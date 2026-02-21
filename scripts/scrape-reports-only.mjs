#!/usr/bin/env node
/**
 * Scrape content for new reports only.
 * ~1,369 reports need content (mostly blogs.nasa.gov).
 */

import { extract } from "@extractus/article-extractor";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "public", "data");
const FILE = path.join(DATA_DIR, "news-reports.json");

const DOMAIN_DELAY_MS = 800;
const CONCURRENCY = 4;
const SAVE_EVERY = 50;
const REQUEST_TIMEOUT_MS = 15000;
const MAX_RETRIES = 2;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function getDomain(url) { try { return new URL(url).hostname; } catch { return "unknown"; } }

function stripHtml(html) {
  if (!html) return null;
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, " ").trim();
}

const domainLastFetch = new Map();
async function waitForDomain(domain) {
  const last = domainLastFetch.get(domain) || 0;
  const elapsed = Date.now() - last;
  if (elapsed < DOMAIN_DELAY_MS) await sleep(DOMAIN_DELAY_MS - elapsed);
  domainLastFetch.set(domain, Date.now());
}

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
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "text/html,application/xhtml+xml",
        },
      });
      clearTimeout(timeout);

      if (result && result.content) {
        const plainText = stripHtml(result.content);
        return { content: plainText || null, word_count: plainText ? plainText.split(/\s+/).length : 0 };
      }
      return { content: null, word_count: 0 };
    } catch (err) {
      if (attempt < retries) { await sleep(2000 * (attempt + 1)); continue; }
      return { content: null, word_count: 0, extraction_error: err.message?.substring(0, 200) };
    }
  }
}

async function main() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║     SCRAPE REPORT CONTENT (reports only)               ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  const reports = JSON.parse(fs.readFileSync(FILE, "utf8"));
  console.log(`  Total reports: ${reports.length}`);

  const needsScraping = reports.filter(r => !r.content && r.url);
  console.log(`  Need scraping: ${needsScraping.length}`);
  console.log(`  Already have content: ${reports.length - needsScraping.length}`);

  if (needsScraping.length === 0) {
    console.log("  All done!");
    return;
  }

  const resultMap = new Map();
  reports.forEach(r => resultMap.set(r.id, { ...r }));

  let completed = 0, succeeded = 0, failed = 0;
  const startTime = Date.now();
  let queueIndex = 0;

  async function worker() {
    while (queueIndex < needsScraping.length) {
      const idx = queueIndex++;
      const report = needsScraping[idx];

      const result = await extractArticle(report.url);
      const existing = resultMap.get(report.id);
      resultMap.set(report.id, {
        ...existing,
        content: result.content || existing.summary || null,
        word_count: result.word_count || 0,
        ...(result.extraction_error ? { extraction_error: result.extraction_error } : {}),
      });

      completed++;
      if (result.content) succeeded++; else failed++;

      const elapsed = (Date.now() - startTime) / 1000;
      const rate = completed / elapsed;
      const remaining = (needsScraping.length - completed) / Math.max(rate, 0.1);

      if (completed % 25 === 0 || completed === needsScraping.length) {
        const pct = ((completed / needsScraping.length) * 100).toFixed(1);
        console.log(
          `  [${pct}%] ${completed}/${needsScraping.length} | ` +
          `✓${succeeded} ✗${failed} | ~${Math.round(remaining / 60)}m left`
        );
      }

      // Periodic save
      if (completed % SAVE_EVERY === 0) {
        const output = reports.map(r => resultMap.get(r.id) || r);
        fs.writeFileSync(FILE, JSON.stringify(output, null, 0));
      }
    }
  }

  const workers = [];
  for (let i = 0; i < CONCURRENCY; i++) workers.push(worker());
  await Promise.all(workers);

  // Final save with formatting
  const final = reports.map(r => resultMap.get(r.id) || r);
  fs.writeFileSync(FILE, JSON.stringify(final, null, 2));

  const totalElapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  const withContent = final.filter(r => r.content).length;
  const totalWords = final.reduce((s, r) => s + (r.word_count || 0), 0);

  console.log(`\n  DONE in ${totalElapsed}min | ✓${succeeded} ✗${failed}`);
  console.log(`  Content: ${withContent}/${final.length} reports`);
  console.log(`  Total words: ${totalWords.toLocaleString()}`);
  console.log(`  File: ${(fs.statSync(FILE).size / 1024 / 1024).toFixed(2)} MB\n`);
}

main().catch(err => { console.error("Fatal:", err); process.exit(1); });
