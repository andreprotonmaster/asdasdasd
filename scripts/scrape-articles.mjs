/**
 * Bulk Article Content Scraper
 * 
 * Extracts full article text from all news URLs and merges into existing JSON.
 * Adds `content` field to each article while preserving all existing fields.
 * 
 * Features:
 * - Per-domain rate limiting (polite 1.5s between requests to same domain)
 * - Incremental progress save every 50 articles
 * - Graceful error handling (content = null on failure)
 * - Resume support via checkpoint file
 * - Concurrent fetching across different domains
 */

import { extract } from "@extractus/article-extractor";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "public", "data");
const CHECKPOINT_DIR = path.join(__dirname, "..", ".scrape-checkpoints");

// ─── Config ─────────────────────────────────────────────────────────────────

const DOMAIN_DELAY_MS = 1500;     // ms between requests to same domain
const CONCURRENCY = 6;            // max simultaneous fetches (across domains)
const SAVE_EVERY = 50;            // save progress every N articles
const REQUEST_TIMEOUT_MS = 15000; // per-request timeout
const MAX_RETRIES = 2;            // retry failed extractions

// ─── Helpers ────────────────────────────────────────────────────────────────

function getDomain(url) {
  try { return new URL(url).hostname; } catch { return "unknown"; }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function stripHtml(html) {
  if (!html) return null;
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── Per-domain rate limiter ────────────────────────────────────────────────

const domainLastFetch = new Map();

async function waitForDomain(domain) {
  const last = domainLastFetch.get(domain) || 0;
  const elapsed = Date.now() - last;
  if (elapsed < DOMAIN_DELAY_MS) {
    await sleep(DOMAIN_DELAY_MS - elapsed);
  }
  domainLastFetch.set(domain, Date.now());
}

// ─── Extract with timeout + retry ───────────────────────────────────────────

async function extractArticle(url, retries = MAX_RETRIES) {
  const domain = getDomain(url);
  await waitForDomain(domain);

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      const result = await extract(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });

      clearTimeout(timeout);

      if (result && result.content) {
        const plainText = stripHtml(result.content);
        return {
          content: plainText || null,
          content_html: result.content || null,
          word_count: plainText ? plainText.split(/\s+/).length : 0,
          extracted_title: result.title || null,
          extracted_author: result.author || null,
          extracted_date: result.published || null,
          extraction_source: result.source || null,
        };
      }

      return { content: null, content_html: null, word_count: 0 };
    } catch (err) {
      if (attempt < retries) {
        await sleep(2000 * (attempt + 1)); // backoff
        continue;
      }
      return {
        content: null,
        content_html: null,
        word_count: 0,
        extraction_error: err.message?.substring(0, 200) || "Unknown error",
      };
    }
  }
}

// ─── Checkpoint management ──────────────────────────────────────────────────

function loadCheckpoint(type) {
  const cpFile = path.join(CHECKPOINT_DIR, `${type}-checkpoint.json`);
  if (fs.existsSync(cpFile)) {
    const cp = JSON.parse(fs.readFileSync(cpFile, "utf8"));
    console.log(`  Resuming from checkpoint: ${cp.completed}/${cp.total} done`);
    return cp;
  }
  return null;
}

function saveCheckpoint(type, completed, total, failedIds) {
  if (!fs.existsSync(CHECKPOINT_DIR)) fs.mkdirSync(CHECKPOINT_DIR, { recursive: true });
  const cpFile = path.join(CHECKPOINT_DIR, `${type}-checkpoint.json`);
  fs.writeFileSync(cpFile, JSON.stringify({ completed, total, failedIds, timestamp: new Date().toISOString() }));
}

function clearCheckpoint(type) {
  const cpFile = path.join(CHECKPOINT_DIR, `${type}-checkpoint.json`);
  if (fs.existsSync(cpFile)) fs.unlinkSync(cpFile);
}

// ─── Main scraper ───────────────────────────────────────────────────────────

async function scrapeFile(inputFile, outputFile, type) {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  SCRAPING: ${type.toUpperCase()}`);
  console.log(`  Input:  ${inputFile}`);
  console.log(`  Output: ${outputFile}`);
  console.log(`${"═".repeat(60)}`);

  const articles = JSON.parse(fs.readFileSync(inputFile, "utf8"));
  console.log(`  Total items: ${articles.length}`);

  // Check for existing content (resume support)
  const checkpoint = loadCheckpoint(type);
  const completedIds = new Set();

  // If output already exists with some content, load it
  let existing = [];
  if (fs.existsSync(outputFile)) {
    existing = JSON.parse(fs.readFileSync(outputFile, "utf8"));
    existing.forEach(a => {
      if (a.content !== undefined) completedIds.add(a.id);
    });
    if (completedIds.size > 0) {
      console.log(`  Already have content for ${completedIds.size} items`);
    }
  }

  // Build work queue - only items without content
  const needsScraping = articles.filter(a => !completedIds.has(a.id));
  console.log(`  Need to scrape: ${needsScraping.length}`);

  if (needsScraping.length === 0) {
    console.log("  All done! Nothing to scrape.");
    return;
  }

  // Build result map from existing data
  const resultMap = new Map();
  (existing.length > 0 ? existing : articles).forEach(a => resultMap.set(a.id, { ...a }));

  let completed = completedIds.size;
  let succeeded = 0;
  let failed = 0;
  const failedIds = [];
  const startTime = Date.now();

  // Process with bounded concurrency
  let queueIndex = 0;

  async function worker() {
    while (queueIndex < needsScraping.length) {
      const idx = queueIndex++;
      const article = needsScraping[idx];
      if (!article.url) {
        const existing = resultMap.get(article.id) || article;
        resultMap.set(article.id, { ...existing, content: null, content_html: null, word_count: 0 });
        completed++;
        failed++;
        continue;
      }

      const domain = getDomain(article.url);
      const result = await extractArticle(article.url);

      // Merge: preserve ALL existing fields, add new content fields
      const existingArticle = resultMap.get(article.id) || article;
      resultMap.set(article.id, {
        ...existingArticle,
        content: result.content || null,
        content_html: result.content_html || null,
        word_count: result.word_count || 0,
        ...(result.extraction_error ? { extraction_error: result.extraction_error } : {}),
      });

      completed++;
      if (result.content) {
        succeeded++;
      } else {
        failed++;
        failedIds.push(article.id);
      }

      // Progress
      const elapsed = (Date.now() - startTime) / 1000;
      const rate = (completed - completedIds.size) / elapsed;
      const remaining = (needsScraping.length - (completed - completedIds.size)) / Math.max(rate, 0.1);
      const pct = ((completed / articles.length) * 100).toFixed(1);

      if ((completed - completedIds.size) % 10 === 0 || completed === articles.length) {
        const words = result.word_count || 0;
        console.log(
          `  [${pct}%] ${completed}/${articles.length} | ` +
          `✓${succeeded} ✗${failed} | ` +
          `${words}w from ${domain} | ` +
          `~${Math.round(remaining / 60)}m left`
        );
      }

      // Periodic save
      if ((completed - completedIds.size) % SAVE_EVERY === 0) {
        const output = articles.map(a => resultMap.get(a.id) || a);
        fs.writeFileSync(outputFile, JSON.stringify(output, null, 0));
        saveCheckpoint(type, completed, articles.length, failedIds);
      }
    }
  }

  // Launch concurrent workers
  const workers = [];
  for (let i = 0; i < CONCURRENCY; i++) {
    workers.push(worker());
  }
  await Promise.all(workers);

  // Final save - preserve original ordering, prettified
  const finalOutput = articles.map(a => resultMap.get(a.id) || a);
  fs.writeFileSync(outputFile, JSON.stringify(finalOutput, null, 0));
  clearCheckpoint(type);

  const totalElapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log(`\n  DONE in ${totalElapsed}min | ✓${succeeded} extracted, ✗${failed} failed`);

  // Stats
  const withContent = finalOutput.filter(a => a.content && a.content.length > 0);
  const totalWords = withContent.reduce((s, a) => s + (a.word_count || 0), 0);
  console.log(`  Content: ${withContent.length}/${finalOutput.length} articles have full text`);
  console.log(`  Total words: ${totalWords.toLocaleString()} (avg ${Math.round(totalWords / Math.max(withContent.length, 1))} per article)`);
  console.log(`  File size: ${(fs.statSync(outputFile).size / 1024 / 1024).toFixed(2)} MB`);

  if (failedIds.length > 0) {
    console.log(`  Failed IDs saved to checkpoint for retry`);
    saveCheckpoint(type + "-failed", 0, failedIds.length, failedIds);
  }
}

// ─── Run ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║     SPACEX-AI FULL ARTICLE CONTENT SCRAPER             ║");
  console.log("║     Extracting full text from all news sources         ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log(`  Concurrency: ${CONCURRENCY} | Domain delay: ${DOMAIN_DELAY_MS}ms`);
  console.log(`  Timeout: ${REQUEST_TIMEOUT_MS}ms | Max retries: ${MAX_RETRIES}`);

  // Scrape articles
  await scrapeFile(
    path.join(DATA_DIR, "news-articles.json"),
    path.join(DATA_DIR, "news-articles.json"),
    "articles"
  );

  // Scrape blogs
  await scrapeFile(
    path.join(DATA_DIR, "news-blogs.json"),
    path.join(DATA_DIR, "news-blogs.json"),
    "blogs"
  );

  // Scrape reports
  await scrapeFile(
    path.join(DATA_DIR, "news-reports.json"),
    path.join(DATA_DIR, "news-reports.json"),
    "reports"
  );

  console.log("\n✅ ALL SCRAPING COMPLETE");
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
