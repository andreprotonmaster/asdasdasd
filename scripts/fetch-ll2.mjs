// ============================================================
// Fetch missing SpaceX launches from Launch Library 2 API
// and merge them into our local data in r-spacex API v4 format.
// ============================================================

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "public", "data");

// LL2 production endpoint (works without auth, has full history)
const LL2_BASE = "https://ll.thespacedevs.com/2.3.0";
const SPACEX_PROVIDER_ID = 121;

// r-spacex rocket IDs (from our rockets.json)
const ROCKET_MAP = {
  "Falcon 9": "5e9d0d95eda69973a809d1ec",
  "Falcon 9 Block 5": "5e9d0d95eda69973a809d1ec",
  "Falcon Heavy": "5e9d0d95eda69974db09d1ed",
  "Falcon 1": "5e9d0d95eda69955f709bf1c",
  "Starship": "starship_id", // not in original API
};

// r-spacex launchpad IDs (from our launchpads.json)
const LAUNCHPAD_MAP = {
  "Space Launch Complex 40": "5e9e4501f509094ba4566f84",
  "Kennedy Space Center Launch Complex 39A": "5e9e4502f509092b78566f87",
  "Launch Complex 39A": "5e9e4502f509092b78566f87",
  "Space Launch Complex 4E": "5e9e4502f509094188566f88",
  "SpaceX Space Launch Facility": "5e9e4502f5090995de566f86", // Boca Chica
  "Starbase": "5e9e4502f5090995de566f86",
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchLL2Page(offset = 0, limit = 100, yearStart = null, yearEnd = null) {
  // status 3=success, 4=failure, 7=partial failure
  let url = `${LL2_BASE}/launches/?launch_service_provider__ids=${SPACEX_PROVIDER_ID}&status__ids=3,4,7&limit=${limit}&offset=${offset}&ordering=net&format=json`;
  if (yearStart) url += `&net__gte=${yearStart}`;
  if (yearEnd) url += `&net__lte=${yearEnd}`;
  console.log(`  Fetching offset=${offset}${yearStart ? ` (${yearStart.slice(0,4)})` : ""}...`);
  const res = await fetch(url);
  if (res.status === 429) {
    console.log("  Rate limited! Waiting 60s...");
    await sleep(60000);
    return fetchLL2Page(offset, limit, yearStart, yearEnd);
  }
  if (!res.ok) throw new Error(`LL2 error: ${res.status} ${res.statusText}`);
  return res.json();
}

async function fetchAllCompletedSpaceXLaunches() {
  const all = [];
  
  // Fetch year by year to stay within pagination limits
  const years = [2023, 2024, 2025, 2026];
  
  for (const year of years) {
    const yearStart = `${year}-01-01`;
    const yearEnd = `${year}-12-31`;
    let offset = 0;
    const limit = 100;
    
    while (true) {
      const page = await fetchLL2Page(offset, limit, yearStart, yearEnd);
      const spacexOnly = page.results.filter(
        (l) => l.launch_service_provider?.id === SPACEX_PROVIDER_ID
      );
      all.push(...spacexOnly);
      console.log(`  ${year}: got ${spacexOnly.length} SpaceX (${page.results.length} total) — running total: ${all.length}`);
      if (!page.next) break;
      offset += limit;
      await sleep(3000); // respect rate limits
    }
    await sleep(2000);
  }

  return all;
}

function mapStatus(ll2Status) {
  // LL2 status IDs: 1=Go, 2=TBD, 3=Success, 4=Failure, 7=Partial Failure
  if (ll2Status?.id === 3) return { success: true, upcoming: false };
  if (ll2Status?.id === 4) return { success: false, upcoming: false };
  if (ll2Status?.id === 7) return { success: false, upcoming: false }; // partial failure
  return { success: null, upcoming: true };
}

function mapRocketId(ll2Rocket) {
  const name = ll2Rocket?.configuration?.full_name || ll2Rocket?.configuration?.name || "";
  for (const [key, id] of Object.entries(ROCKET_MAP)) {
    if (name.includes(key)) return id;
  }
  return ROCKET_MAP["Falcon 9"]; // default
}

function mapLaunchpadId(ll2Pad) {
  const name = ll2Pad?.name || "";
  for (const [key, id] of Object.entries(LAUNCHPAD_MAP)) {
    if (name.includes(key)) return id;
  }
  // Try location-based matching
  const loc = ll2Pad?.location?.name || "";
  if (loc.includes("Cape Canaveral") || loc.includes("Kennedy")) {
    return "5e9e4501f509094ba4566f84"; // SLC-40 as default cape
  }
  if (loc.includes("Vandenberg")) {
    return "5e9e4502f509094188566f88";
  }
  if (loc.includes("Boca Chica") || loc.includes("Starbase")) {
    return "5e9e4502f5090995de566f86";
  }
  return "5e9e4501f509094ba4566f84"; // default
}

function extractYouTubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/live\/)([A-Za-z0-9_-]{11})/);
  return match ? match[1] : null;
}

function mapLandingType(ll2Landing) {
  if (!ll2Landing) return null;
  const type = ll2Landing.type?.abbrev || ll2Landing.type?.name || "";
  if (type.includes("ASDS") || type.includes("Droneship")) return "ASDS";
  if (type.includes("RTLS")) return "RTLS";
  if (type.includes("Ocean")) return "Ocean";
  return type || null;
}

function convertLL2Launch(ll2, flightNumber) {
  const { success, upcoming } = mapStatus(ll2.status);
  const dateUtc = ll2.net || ll2.window_start;
  const dateUnix = Math.floor(new Date(dateUtc).getTime() / 1000);

  // Extract video URLs
  const vidUrls = ll2.vid_urls || [];
  const webcastUrl = vidUrls.length > 0 ? vidUrls[0]?.url : null;
  const youtubeId = extractYouTubeId(webcastUrl);

  // Extract mission info
  const mission = ll2.mission || {};

  // Map cores/boosters with landing info
  const cores = [];
  const rocket = ll2.rocket || {};
  const launchers = rocket.launcher_stage || [];

  if (launchers.length > 0) {
    for (const stage of launchers) {
      if (stage.type === "SolidFuel") continue; // skip SRBs not in r-spacex format
      const launcher = stage.launcher || {};
      const landing = stage.landing || {};
      cores.push({
        core: launcher.serial_number || null,
        flight: launcher.flights || null,
        gridfins: true,
        legs: true,
        reused: (launcher.flights || 1) > 1,
        landing_attempt: landing.attempt || false,
        landing_success: landing.success || null,
        landing_type: mapLandingType(landing),
        landpad: landing.location?.abbrev || null,
      });
    }
  }

  // Fallback: at least one core entry
  if (cores.length === 0) {
    cores.push({
      core: null,
      flight: null,
      gridfins: null,
      legs: null,
      reused: null,
      landing_attempt: null,
      landing_success: null,
      landing_type: null,
      landpad: null,
    });
  }

  // Build patch image from LL2 mission patches or main image
  const patchImage = ll2.mission_patches?.[0]?.image_url || null;
  const mainImage = ll2.image?.image_url || null;

  // Failures
  const failures = [];
  if (success === false && ll2.failreason) {
    failures.push({
      time: 0,
      altitude: null,
      reason: ll2.failreason,
    });
  }

  // Date precision mapping
  let datePrecision = "hour";
  const precName = ll2.net_precision?.name?.toLowerCase() || "";
  if (precName.includes("year")) datePrecision = "year";
  else if (precName.includes("month")) datePrecision = "month";
  else if (precName.includes("day")) datePrecision = "day";
  else if (precName.includes("hour") || precName.includes("minute")) datePrecision = "hour";

  return {
    id: ll2.id, // LL2 UUID
    flight_number: flightNumber,
    name: ll2.name?.replace(/^Falcon 9 Block 5 \| /, "")
                    .replace(/^Falcon Heavy \| /, "")
                    .replace(/^Falcon 9 \| /, "") || mission.name || "Unknown",
    date_utc: dateUtc,
    date_unix: dateUnix,
    date_local: dateUtc, // LL2 doesn't always have local time, use UTC
    date_precision: datePrecision,
    static_fire_date_utc: null,
    static_fire_date_unix: null,
    tbd: false,
    net: false,
    window: null,
    rocket: mapRocketId(rocket),
    success,
    failures,
    upcoming,
    details: mission.description || null,
    fairings: null,
    crew: [],
    ships: [],
    capsules: [],
    payloads: [],
    launchpad: mapLaunchpadId(ll2.pad),
    cores,
    links: {
      patch: {
        small: patchImage,
        large: patchImage,
      },
      reddit: {
        campaign: null,
        launch: null,
        media: null,
        recovery: null,
      },
      flickr: {
        small: [],
        original: mainImage ? [mainImage] : [],
      },
      presskit: null,
      webcast: webcastUrl,
      youtube_id: youtubeId,
      article: ll2.info_urls?.[0]?.url || null,
      wikipedia: mission.agencies?.[0]?.wiki_url || null,
    },
    auto_update: false,
    launch_library_id: ll2.id,
  };
}

async function main() {
  console.log("Loading existing local launches...");
  const localLaunches = JSON.parse(
    readFileSync(join(DATA_DIR, "launches.json"), "utf-8")
  );
  console.log(`  Local launches: ${localLaunches.length}`);

  // Find our latest launch date
  const latestDate = Math.max(...localLaunches.map((l) => l.date_unix));
  const latestDateStr = new Date(latestDate * 1000).toISOString();
  console.log(`  Latest local launch: ${latestDateStr}`);

  // Build a set of existing launch_library_ids to avoid duplicates
  const existingLL2Ids = new Set(
    localLaunches.map((l) => l.launch_library_id).filter(Boolean)
  );
  // Also build a name+date set for fuzzy dedup
  const existingKeys = new Set(
    localLaunches.map(
      (l) => `${l.name.toLowerCase()}_${l.date_utc.slice(0, 10)}`
    )
  );

  console.log("\nFetching completed SpaceX launches from Launch Library 2...");
  const ll2Launches = await fetchAllCompletedSpaceXLaunches();
  console.log(`  Total from LL2: ${ll2Launches.length}`);

  // Filter to only launches after our latest date (SpaceX already filtered in fetch)
  const newLaunches = ll2Launches.filter((ll2) => {
    const launchUnix = Math.floor(new Date(ll2.net).getTime() / 1000);
    // Must be after our latest
    if (launchUnix <= latestDate) return false;
    // Skip if we already have this launch_library_id
    if (existingLL2Ids.has(ll2.id)) return false;
    return true;
  });

  console.log(`  New launches to add: ${newLaunches.length}`);

  if (newLaunches.length === 0) {
    console.log("No new launches to add!");
    return;
  }

  // Convert and assign flight numbers
  const maxFlightNum = Math.max(...localLaunches.map((l) => l.flight_number));
  const converted = newLaunches
    .sort((a, b) => new Date(a.net).getTime() - new Date(b.net).getTime())
    .map((ll2, i) => convertLL2Launch(ll2, maxFlightNum + 1 + i));

  console.log(
    `\nConverted ${converted.length} launches (flight ${maxFlightNum + 1} - ${maxFlightNum + converted.length})`
  );

  // Show a sample
  console.log("\nFirst 5 new launches:");
  for (const l of converted.slice(0, 5)) {
    console.log(
      `  #${l.flight_number} ${l.name} — ${l.date_utc.slice(0, 10)} — ${l.success ? "SUCCESS" : "FAILED"}`
    );
  }
  console.log("\nLast 5 new launches:");
  for (const l of converted.slice(-5)) {
    console.log(
      `  #${l.flight_number} ${l.name} — ${l.date_utc.slice(0, 10)} — ${l.success ? "SUCCESS" : "FAILED"}`
    );
  }

  // Merge
  const merged = [...localLaunches, ...converted];
  console.log(`\nTotal merged launches: ${merged.length}`);

  // Write
  writeFileSync(
    join(DATA_DIR, "launches.json"),
    JSON.stringify(merged, null, 2)
  );
  console.log("Written to launches.json");

  // Stats
  const past = merged.filter((l) => !l.upcoming);
  const success = past.filter((l) => l.success === true);
  const failed = past.filter((l) => l.success === false);
  console.log(`\nFinal stats:`);
  console.log(`  Total: ${merged.length}`);
  console.log(`  Past: ${past.length}`);
  console.log(`  Successful: ${success.length}`);
  console.log(`  Failed: ${failed.length}`);
  console.log(
    `  Success rate: ${((success.length / past.length) * 100).toFixed(1)}%`
  );
}

main().catch(console.error);
