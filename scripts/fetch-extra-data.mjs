#!/usr/bin/env node
/**
 * Fetch supplementary data from:
 *  - Spaceflight News API (SNAPI) — articles, blogs, reports about SpaceX
 *  - Launch Library 2 (LL2)       — astronauts, events, programs, vehicle configs, spacecraft
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'public', 'data');
mkdirSync(DATA_DIR, { recursive: true });

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ─── SPACEFLIGHT NEWS API (no auth, generous limits) ───────────────────────

async function fetchSNAPI(endpoint, searchTerm = 'spacex') {
  const base = `https://api.spaceflightnewsapi.net/v4/${endpoint}/`;
  let all = [];
  let url = `${base}?search=${encodeURIComponent(searchTerm)}&limit=100`;
  let page = 1;

  while (url) {
    process.stdout.write(`  [SNAPI] ${endpoint} page ${page}...`);
    const res = await fetch(url);
    if (!res.ok) {
      console.error(` ERROR ${res.status}`);
      break;
    }
    const data = await res.json();
    all.push(...data.results);
    console.log(` ${all.length}/${data.count}`);
    url = data.next;
    page++;
    await sleep(300);
  }
  return all;
}

// ─── LAUNCH LIBRARY 2 (production, handle 429s) ───────────────────────────

async function fetchLL2Paged(endpoint, params = '') {
  const base = `https://ll.thespacedevs.com/2.3.0/${endpoint}/`;
  let all = [];
  let url = `${base}?limit=100${params}`;
  let page = 1;

  while (url) {
    process.stdout.write(`  [LL2] ${endpoint} page ${page}...`);
    const res = await fetch(url);
    if (res.status === 429) {
      console.log(' rate-limited, waiting 65s...');
      await sleep(65000);
      continue;
    }
    if (!res.ok) {
      console.error(` ERROR ${res.status}`);
      break;
    }
    const data = await res.json();
    all.push(...data.results);
    console.log(` ${all.length}/${data.count}`);
    url = data.next;
    page++;
    await sleep(4000); // 4s between LL2 requests
  }
  return all;
}

async function fetchLL2Single(path) {
  process.stdout.write(`  [LL2] ${path}...`);
  const res = await fetch(`https://ll.thespacedevs.com/2.3.0/${path}`);
  if (res.status === 429) {
    console.log(' rate-limited, waiting 65s...');
    await sleep(65000);
    return fetchLL2Single(path);
  }
  if (!res.ok) {
    console.error(` ERROR ${res.status}`);
    return null;
  }
  const data = await res.json();
  console.log(' OK');
  await sleep(4000);
  return data;
}

function save(filename, data) {
  const path = join(DATA_DIR, filename);
  writeFileSync(path, JSON.stringify(data, null, 2));
  const mb = (Buffer.byteLength(JSON.stringify(data)) / 1024 / 1024).toFixed(2);
  console.log(`   → Saved ${filename} (${mb} MB)\n`);
}

// ─── MAIN ──────────────────────────────────────────────────────────────────

async function main() {
  const t0 = Date.now();

  // ═══ SPACEFLIGHT NEWS API ═══
  console.log('\n══════════════════════════════════════════════');
  console.log('  SPACEFLIGHT NEWS API');
  console.log('══════════════════════════════════════════════\n');

  // 1. Articles
  console.log('1. SpaceX articles...');
  const articles = await fetchSNAPI('articles', 'spacex');
  save('news-articles.json', articles);

  // 2. Blogs
  console.log('2. SpaceX blogs...');
  const blogs = await fetchSNAPI('blogs', 'spacex');
  save('news-blogs.json', blogs);

  // 3. Reports
  console.log('3. SpaceX reports...');
  const reports = await fetchSNAPI('reports', 'spacex');
  save('news-reports.json', reports);

  // ═══ LAUNCH LIBRARY 2 — supplementary ═══
  console.log('══════════════════════════════════════════════');
  console.log('  LAUNCH LIBRARY 2 — SUPPLEMENTARY DATA');
  console.log('══════════════════════════════════════════════\n');

  // 4. SpaceX agency profile
  console.log('4. SpaceX agency profile...');
  const agency = await fetchLL2Single('agencies/121/');
  if (agency) save('ll2-agency-spacex.json', agency);

  // 5. Launcher configurations (Falcon 9, FH, Starship, etc.)
  console.log('5. SpaceX launcher configurations...');
  const launcherConfigs = await fetchLL2Paged('launcher_configurations', '&manufacturer=121');
  save('ll2-launcher-configs.json', launcherConfigs);

  // 6. Spacecraft configurations (Dragon, etc.)
  console.log('6. SpaceX spacecraft configurations...');
  const spacecraftConfigs = await fetchLL2Paged('spacecraft_configurations', '&manufacturer__name=SpaceX');
  save('ll2-spacecraft-configs.json', spacecraftConfigs);

  // 7. SpaceX programs (Commercial Crew, CRS, Starlink, etc.)
  console.log('7. SpaceX programs...');
  const programs = await fetchLL2Paged('programs', '&agency=121');
  save('ll2-programs.json', programs);

  // 8. SpaceX events (milestones, static fires, etc.)
  console.log('8. SpaceX events...');
  const events = await fetchLL2Paged('events', '&search=SpaceX');
  save('ll2-events.json', events);

  // 9. SpaceX-related astronauts (crew who flew on Dragon)
  console.log('9. SpaceX-related astronauts...');
  const astronauts = await fetchLL2Paged('astronauts', '&search=SpaceX');
  save('ll2-astronauts.json', astronauts);

  // 10. SpaceX spacecraft (individual Dragon capsules, etc.)
  console.log('10. SpaceX spacecraft...');
  const spacecraft = await fetchLL2Paged('spacecraft', '&search=Dragon');
  save('ll2-spacecraft.json', spacecraft);

  // 11. SpaceX pads
  console.log('11. SpaceX launch pads...');
  const pads = await fetchLL2Paged('pads', '&search=SpaceX');
  save('ll2-pads.json', pads);

  // 12. Starship dashboard
  console.log('12. Starship dashboard...');
  const starship = await fetchLL2Single('dashboard/starship/');
  if (starship) save('ll2-starship-dashboard.json', starship);

  // ═══ SUMMARY ═══
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log('══════════════════════════════════════════════');
  console.log('  COMPLETE');
  console.log('══════════════════════════════════════════════');
  console.log(`  Time: ${elapsed}s`);
  console.log(`  SNAPI: ${articles.length} articles, ${blogs.length} blogs, ${reports.length} reports`);
  console.log(`  LL2:   ${launcherConfigs.length} launcher configs, ${spacecraftConfigs.length} spacecraft configs`);
  console.log(`         ${programs.length} programs, ${events.length} events`);
  console.log(`         ${astronauts.length} astronauts, ${spacecraft.length} spacecraft`);
  console.log(`         ${pads.length} pads, starship dashboard: ${starship ? 'yes' : 'no'}`);
  console.log(`         agency profile: ${agency ? 'yes' : 'no'}`);
  console.log('══════════════════════════════════════════════\n');
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
