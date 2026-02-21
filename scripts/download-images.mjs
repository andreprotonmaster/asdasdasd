/**
 * Download all core SpaceX images to local public/images/ directory
 * and update JSON data files to reference local paths.
 *
 * Run: node scripts/download-images.mjs
 */

import fs from "fs";
import path from "path";
import https from "https";
import http from "http";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA = path.join(ROOT, "public", "data");
const IMG_ROOT = path.join(ROOT, "public", "images");

// Track stats
let downloaded = 0;
let skipped = 0;
let failed = 0;
const failedUrls = [];

// Ensure directory exists
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Download a single file
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest)) {
      skipped++;
      return resolve(false);
    }
    ensureDir(path.dirname(dest));
    const proto = url.startsWith("https") ? https : http;
    const request = proto.get(url, { timeout: 15000 }, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        failed++;
        failedUrls.push({ url, status: res.statusCode });
        res.resume();
        return resolve(false);
      }
      const stream = fs.createWriteStream(dest);
      res.pipe(stream);
      stream.on("finish", () => {
        stream.close();
        downloaded++;
        resolve(true);
      });
      stream.on("error", (err) => {
        fs.unlink(dest, () => {});
        failed++;
        failedUrls.push({ url, error: err.message });
        resolve(false);
      });
    });
    request.on("error", (err) => {
      failed++;
      failedUrls.push({ url, error: err.message });
      resolve(false);
    });
    request.on("timeout", () => {
      request.destroy();
      failed++;
      failedUrls.push({ url, error: "timeout" });
      resolve(false);
    });
  });
}

// Generate local filename from URL
function urlToLocalPath(url, category, fallbackName) {
  try {
    const u = new URL(url);
    const ext = path.extname(u.pathname) || ".jpg";
    // Use last 2 path segments for uniqueness
    const segments = u.pathname.split("/").filter(Boolean);
    const name = segments.length > 1
      ? segments.slice(-2).join("_").replace(/[^a-zA-Z0-9._-]/g, "_")
      : (segments[0] || fallbackName).replace(/[^a-zA-Z0-9._-]/g, "_");
    const finalName = name.includes(".") ? name : name + ext;
    return `/images/${category}/${finalName}`;
  } catch {
    return null;
  }
}

// Process a batch in parallel with concurrency limit
async function processInBatches(tasks, concurrency = 10) {
  const results = [];
  for (let i = 0; i < tasks.length; i += concurrency) {
    const batch = tasks.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map((t) => t()));
    results.push(...batchResults);
    if (i % 50 === 0 && i > 0) {
      process.stdout.write(`  ... ${i}/${tasks.length}\r`);
    }
  }
  return results;
}

// ─── Process each data source ────────────────────────────────

async function processLaunches() {
  console.log("\n📦 Processing launches.json (patches + flickr)...");
  const filePath = path.join(DATA, "launches.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const tasks = [];

  for (const launch of data) {
    // Patch small
    if (launch.links?.patch?.small) {
      const localPath = urlToLocalPath(launch.links.patch.small, "patches", `${launch.id}_small`);
      if (localPath) {
        const dest = path.join(ROOT, "public", localPath);
        tasks.push(() => downloadFile(launch.links.patch.small, dest).then(() => {
          launch.links.patch.small = localPath;
        }));
      }
    }
    // Patch large
    if (launch.links?.patch?.large) {
      const localPath = urlToLocalPath(launch.links.patch.large, "patches", `${launch.id}_large`);
      if (localPath) {
        const dest = path.join(ROOT, "public", localPath);
        tasks.push(() => downloadFile(launch.links.patch.large, dest).then(() => {
          launch.links.patch.large = localPath;
        }));
      }
    }
    // Flickr originals
    if (launch.links?.flickr?.original?.length) {
      for (let i = 0; i < launch.links.flickr.original.length; i++) {
        const url = launch.links.flickr.original[i];
        const localPath = urlToLocalPath(url, "flickr", `${launch.id}_${i}`);
        if (localPath) {
          const dest = path.join(ROOT, "public", localPath);
          const idx = i;
          tasks.push(() => downloadFile(url, dest).then(() => {
            launch.links.flickr.original[idx] = localPath;
          }));
        }
      }
    }
  }

  await processInBatches(tasks);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`  ✅ launches.json: ${tasks.length} images processed`);
}

async function processRockets() {
  console.log("\n📦 Processing rockets.json...");
  const filePath = path.join(DATA, "rockets.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const tasks = [];

  for (const rocket of data) {
    if (rocket.flickr_images?.length) {
      for (let i = 0; i < rocket.flickr_images.length; i++) {
        const url = rocket.flickr_images[i];
        const localPath = urlToLocalPath(url, "rockets", `${rocket.id}_${i}`);
        if (localPath) {
          const dest = path.join(ROOT, "public", localPath);
          const idx = i;
          tasks.push(() => downloadFile(url, dest).then(() => {
            rocket.flickr_images[idx] = localPath;
          }));
        }
      }
    }
  }

  await processInBatches(tasks);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`  ✅ rockets.json: ${tasks.length} images processed`);
}

async function processDragons() {
  console.log("\n📦 Processing dragons.json...");
  const filePath = path.join(DATA, "dragons.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const tasks = [];

  for (const dragon of data) {
    if (dragon.flickr_images?.length) {
      for (let i = 0; i < dragon.flickr_images.length; i++) {
        const url = dragon.flickr_images[i];
        const localPath = urlToLocalPath(url, "dragons", `${dragon.id}_${i}`);
        if (localPath) {
          const dest = path.join(ROOT, "public", localPath);
          const idx = i;
          tasks.push(() => downloadFile(url, dest).then(() => {
            dragon.flickr_images[idx] = localPath;
          }));
        }
      }
    }
  }

  await processInBatches(tasks);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`  ✅ dragons.json: ${tasks.length} images processed`);
}

async function processCrew() {
  console.log("\n📦 Processing crew.json...");
  const filePath = path.join(DATA, "crew.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const tasks = [];

  for (const member of data) {
    if (member.image) {
      const localPath = urlToLocalPath(member.image, "crew", member.id || member.name);
      if (localPath) {
        const dest = path.join(ROOT, "public", localPath);
        tasks.push(() => downloadFile(member.image, dest).then(() => {
          member.image = localPath;
        }));
      }
    }
  }

  await processInBatches(tasks);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`  ✅ crew.json: ${tasks.length} images processed`);
}

async function processShips() {
  console.log("\n📦 Processing ships.json...");
  const filePath = path.join(DATA, "ships.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const tasks = [];

  for (const ship of data) {
    if (ship.image) {
      const localPath = urlToLocalPath(ship.image, "ships", ship.id || ship.name);
      if (localPath) {
        const dest = path.join(ROOT, "public", localPath);
        tasks.push(() => downloadFile(ship.image, dest).then(() => {
          ship.image = localPath;
        }));
      }
    }
  }

  await processInBatches(tasks);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`  ✅ ships.json: ${tasks.length} images processed`);
}

async function processLaunchpads() {
  console.log("\n📦 Processing launchpads.json...");
  const filePath = path.join(DATA, "launchpads.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const tasks = [];

  for (const pad of data) {
    if (pad.images?.large?.length) {
      for (let i = 0; i < pad.images.large.length; i++) {
        const url = pad.images.large[i];
        const localPath = urlToLocalPath(url, "launchpads", `${pad.id}_${i}`);
        if (localPath) {
          const dest = path.join(ROOT, "public", localPath);
          const idx = i;
          tasks.push(() => downloadFile(url, dest).then(() => {
            pad.images.large[idx] = localPath;
          }));
        }
      }
    }
  }

  await processInBatches(tasks);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`  ✅ launchpads.json: ${tasks.length} images processed`);
}

async function processLandpads() {
  console.log("\n📦 Processing landpads.json...");
  const filePath = path.join(DATA, "landpads.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const tasks = [];

  for (const pad of data) {
    if (pad.images?.large?.length) {
      for (let i = 0; i < pad.images.large.length; i++) {
        const url = pad.images.large[i];
        const localPath = urlToLocalPath(url, "landpads", `${pad.id}_${i}`);
        if (localPath) {
          const dest = path.join(ROOT, "public", localPath);
          const idx = i;
          tasks.push(() => downloadFile(url, dest).then(() => {
            pad.images.large[idx] = localPath;
          }));
        }
      }
    }
  }

  await processInBatches(tasks);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`  ✅ landpads.json: ${tasks.length} images processed`);
}

async function processRoadster() {
  console.log("\n📦 Processing roadster.json...");
  const filePath = path.join(DATA, "roadster.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const tasks = [];

  if (data.flickr_images?.length) {
    for (let i = 0; i < data.flickr_images.length; i++) {
      const url = data.flickr_images[i];
      const localPath = urlToLocalPath(url, "roadster", `roadster_${i}`);
      if (localPath) {
        const dest = path.join(ROOT, "public", localPath);
        const idx = i;
        tasks.push(() => downloadFile(url, dest).then(() => {
          data.flickr_images[idx] = localPath;
        }));
      }
    }
  }

  await processInBatches(tasks);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`  ✅ roadster.json: ${tasks.length} images processed`);
}

async function processLaunchShipCrossref() {
  console.log("\n📦 Processing launch-ship-crossref.json...");
  const filePath = path.join(DATA, "launch-ship-crossref.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const tasks = [];
  const seenUrls = new Map(); // Dedupe ship images

  for (const entry of data) {
    if (entry.ship_details?.length) {
      for (const ship of entry.ship_details) {
        if (ship.image) {
          if (seenUrls.has(ship.image)) {
            // Already being downloaded, just record for later update
            const localPath = seenUrls.get(ship.image);
            ship.image = localPath;
          } else {
            const localPath = urlToLocalPath(ship.image, "ships", ship.id || ship.name);
            if (localPath) {
              seenUrls.set(ship.image, localPath);
              const dest = path.join(ROOT, "public", localPath);
              const origUrl = ship.image;
              tasks.push(() => downloadFile(origUrl, dest));
              ship.image = localPath;
            }
          }
        }
      }
    }
  }

  await processInBatches(tasks);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`  ✅ launch-ship-crossref.json: ${tasks.length} unique images processed`);
}

// ─── Hardcoded ISS image in source files ────────────────────────────────

async function processHardcodedImages() {
  console.log("\n📦 Downloading hardcoded ISS image...");
  const url = "https://upload.wikimedia.org/wikipedia/commons/8/8a/ISS_after_completion_%28as_of_June_2006%29.jpg";
  const localPath = "/images/misc/iss_completion.jpg";
  const dest = path.join(ROOT, "public", localPath);
  await downloadFile(url, dest);
  console.log(`  ✅ ISS image downloaded`);
  return localPath;
}

// ─── Main ────────────────────────────────────────────────────

async function main() {
  console.log("🚀 SpaceX Image Localizer");
  console.log("=".repeat(50));

  ensureDir(IMG_ROOT);

  await processLaunches();
  await processRockets();
  await processDragons();
  await processCrew();
  await processShips();
  await processLaunchpads();
  await processLandpads();
  await processRoadster();
  await processLaunchShipCrossref();
  await processHardcodedImages();

  console.log("\n" + "=".repeat(50));
  console.log(`✅ Downloaded: ${downloaded}`);
  console.log(`⏭️  Skipped (already exists): ${skipped}`);
  console.log(`❌ Failed: ${failed}`);
  if (failedUrls.length > 0) {
    console.log("\nFailed URLs:");
    for (const f of failedUrls.slice(0, 20)) {
      console.log(`  ${f.url} → ${f.status || f.error}`);
    }
    if (failedUrls.length > 20) console.log(`  ... and ${failedUrls.length - 20} more`);
  }
  console.log("\n📝 JSON files updated with local paths.");
  console.log("🔧 Remember to update hardcoded ISS URL in src/ files.");
}

main().catch(console.error);
