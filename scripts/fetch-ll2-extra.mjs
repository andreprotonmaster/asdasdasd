#!/usr/bin/env node
/**
 * Fetch supplementary LL2 data using the dev endpoint (300 req/day limit).
 * SNAPI data already fetched — this script only does LL2.
 * Dev endpoint has full reference data (configs, programs, agency, astronauts).
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'public', 'data');
mkdirSync(DATA_DIR, { recursive: true });

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const LL2_BASE = 'https://lldev.thespacedevs.com/2.3.0';

async function fetchLL2Paged(endpoint, params = '') {
  let all = [];
  let url = `${LL2_BASE}/${endpoint}/?limit=100${params}`;
  let page = 1;

  while (url) {
    process.stdout.write(`  [LL2-dev] ${endpoint} p${page}...`);
    let res;
    try {
      res = await fetch(url);
    } catch (e) {
      console.log(` network error, retrying in 10s...`);
      await sleep(10000);
      continue;
    }
    if (res.status === 429) {
      console.log(' rate-limited, waiting 30s...');
      await sleep(30000);
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
    await sleep(2000);
  }
  return all;
}

async function fetchLL2Single(path) {
  process.stdout.write(`  [LL2-dev] ${path}...`);
  let res;
  try {
    res = await fetch(`${LL2_BASE}/${path}`);
  } catch (e) {
    console.log(` network error, retrying in 10s...`);
    await sleep(10000);
    return fetchLL2Single(path);
  }
  if (res.status === 429) {
    console.log(' rate-limited, waiting 30s...');
    await sleep(30000);
    return fetchLL2Single(path);
  }
  if (!res.ok) {
    console.error(` ERROR ${res.status}`);
    return null;
  }
  const data = await res.json();
  console.log(' OK');
  await sleep(2000);
  return data;
}

function save(filename, data) {
  const path = join(DATA_DIR, filename);
  writeFileSync(path, JSON.stringify(data, null, 2));
  const size = Buffer.byteLength(JSON.stringify(data));
  const label = size > 1024 * 1024
    ? `${(size / 1024 / 1024).toFixed(2)} MB`
    : `${(size / 1024).toFixed(1)} KB`;
  console.log(`   → Saved ${filename} (${label})\n`);
}

async function main() {
  const t0 = Date.now();
  console.log('\n══════════════════════════════════════════════');
  console.log('  LL2 DEV — SUPPLEMENTARY SpaceX DATA');
  console.log('══════════════════════════════════════════════\n');

  // 1. SpaceX agency profile
  console.log('1. SpaceX agency profile...');
  const agency = await fetchLL2Single('agencies/121/');
  if (agency) save('ll2-agency-spacex.json', agency);

  // 2. Launcher configurations (SpaceX rockets)
  console.log('2. SpaceX launcher configurations...');
  const launcherConfigs = await fetchLL2Paged('launcher_configurations', '&search=SpaceX');
  // Filter to only SpaceX-manufactured rockets
  const spacexLaunchers = launcherConfigs.filter(c =>
    c.manufacturer?.name === 'SpaceX' ||
    c.manufacturer?.id === 121 ||
    (c.name && (c.name.includes('Falcon') || c.name.includes('Starship') || c.name.includes('SpaceX')))
  );
  save('ll2-launcher-configs.json', spacexLaunchers.length > 0 ? spacexLaunchers : launcherConfigs);

  // 3. Spacecraft configurations (Dragon, etc.)
  console.log('3. SpaceX spacecraft configurations...');
  const scConfigs = await fetchLL2Paged('spacecraft_configurations', '&search=Dragon');
  save('ll2-spacecraft-configs.json', scConfigs);

  // 4. SpaceX programs (Commercial Crew, CRS, Starlink, etc.)
  console.log('4. SpaceX programs...');
  const programs = await fetchLL2Paged('programs', '&search=SpaceX');
  save('ll2-programs.json', programs);

  // 5. SpaceX events
  console.log('5. SpaceX events...');
  const events = await fetchLL2Paged('events', '&search=SpaceX');
  save('ll2-events.json', events);

  // 6. Astronauts (Dragon crew)
  console.log('6. Astronauts who flew on Dragon...');
  const astronauts = await fetchLL2Paged('astronauts', '&search=SpaceX');
  save('ll2-astronauts.json', astronauts);

  // 7. Individual spacecraft (Dragon capsules in service)
  console.log('7. SpaceX spacecraft (Dragon capsules)...');
  const spacecraft = await fetchLL2Paged('spacecraft', '&search=Dragon');
  save('ll2-spacecraft.json', spacecraft);

  // 8. Pads used by SpaceX
  console.log('8. SpaceX pads...');
  const pads = await fetchLL2Paged('pads', '&search=SpaceX');
  save('ll2-pads.json', pads);

  // 9. Starship dashboard
  console.log('9. Starship dashboard...');
  const starship = await fetchLL2Single('dashboard/starship/');
  if (starship) save('ll2-starship-dashboard.json', starship);

  // ═══ SUMMARY ═══
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log('══════════════════════════════════════════════');
  console.log('  COMPLETE');
  console.log('══════════════════════════════════════════════');
  console.log(`  Time: ${elapsed}s`);
  console.log(`  Agency profile:        ${agency ? 'yes' : 'no'}`);
  console.log(`  Launcher configs:      ${spacexLaunchers.length || launcherConfigs.length}`);
  console.log(`  Spacecraft configs:    ${scConfigs.length}`);
  console.log(`  Programs:              ${programs.length}`);
  console.log(`  Events:                ${events.length}`);
  console.log(`  Astronauts:            ${astronauts.length}`);
  console.log(`  Spacecraft:            ${spacecraft.length}`);
  console.log(`  Pads:                  ${pads.length}`);
  console.log(`  Starship dashboard:    ${starship ? 'yes' : 'no'}`);
  console.log('══════════════════════════════════════════════\n');
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
