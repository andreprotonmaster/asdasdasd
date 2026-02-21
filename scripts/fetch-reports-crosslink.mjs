#!/usr/bin/env node
/**
 * Fetch ALL reports from SNAPI + cross-link with existing data.
 * LL2 docking/station data already fetched.
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'public', 'data');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function loadJSON(filename) {
  const p = join(DATA_DIR, filename);
  return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null;
}

function save(filename, data) {
  writeFileSync(join(DATA_DIR, filename), JSON.stringify(data, null, 2));
  const mb = (Buffer.byteLength(JSON.stringify(data)) / 1024 / 1024).toFixed(2);
  console.log(`  → Saved ${filename} (${mb} MB, ${Array.isArray(data) ? data.length + ' items' : 'object'})\n`);
}

// ─── Fetch ALL SNAPI reports (no search filter) ───────────────────────────

async function fetchAllReports() {
  const base = 'https://api.spaceflightnewsapi.net/v4/reports/';
  let all = [];
  let url = `${base}?limit=100`;
  let page = 1;

  while (url) {
    process.stdout.write(`  [SNAPI] reports page ${page}...`);
    const res = await fetch(url);
    if (!res.ok) { console.error(` ERROR ${res.status}`); break; }
    const data = await res.json();
    all.push(...data.results);
    console.log(` ${all.length}/${data.count}`);
    url = data.next;
    page++;
    await sleep(250);
  }
  return all;
}

// ─── Cross-link reports with launches, ships, docking events ──────────────

function crossLinkReports(reports, launches, ships, dockingEvents) {
  console.log('\n  Cross-linking reports with launches, ships, and docking events...');

  const launchById = new Map();
  launches.forEach(l => launchById.set(l.id, l));

  const shipByName = new Map();
  ships.forEach(s => { if (s.name) shipByName.set(s.name.toLowerCase(), s); });
  const shipNames = ships.map(s => s.name).filter(Boolean);

  // Dragon capsule names from docking events
  const dragonCapsules = new Set();
  if (dockingEvents) {
    dockingEvents.forEach(d => {
      const name = d.flight_vehicle?.spacecraft?.name;
      if (name && name.toLowerCase().includes('dragon')) dragonCapsules.add(name);
    });
  }
  console.log(`  Known Dragon capsules from docking: ${dragonCapsules.size}`);

  // Docking events by launch_id
  const dockingByLaunch = new Map();
  if (dockingEvents) {
    dockingEvents.forEach(d => {
      if (d.launch_id) {
        if (!dockingByLaunch.has(d.launch_id)) dockingByLaunch.set(d.launch_id, []);
        dockingByLaunch.get(d.launch_id).push(d);
      }
    });
  }

  let linkedLaunches = 0, linkedShips = 0, linkedDockings = 0;

  reports.forEach(report => {
    const text = `${report.title || ''} ${report.summary || ''} ${report.content || ''}`.toLowerCase();
    const pubDate = new Date(report.published_at);

    const matchedLaunches = [];
    const matchedShips = [];
    const matchedDockings = [];
    const dragonMentions = [];

    // 1. Text-match launches within ±60 day window
    launches.forEach(launch => {
      if (!launch.name) return;
      const launchDate = new Date(launch.date_utc || launch.net);
      const daysDiff = Math.abs((pubDate - launchDate) / (1000 * 60 * 60 * 24));
      if (daysDiff > 60) return;

      const nameLower = launch.name.toLowerCase();
      const nameWords = nameLower.split(/[\s|/()]+/).filter(w => w.length > 2);
      const matchCount = nameWords.filter(w => text.includes(w)).length;
      
      if (matchCount >= 2 || (matchCount >= 1 && nameWords.length <= 2)) {
        if (!matchedLaunches.find(ml => ml.id === launch.id)) {
          matchedLaunches.push({
            id: launch.id,
            name: launch.name,
            date: launch.date_utc || launch.net,
            match_type: 'text'
          });

          // Check if this launch has docking events
          const dockings = dockingByLaunch.get(launch.id);
          if (dockings) {
            dockings.forEach(d => {
              matchedDockings.push({
                docking_date: d.docking,
                departure_date: d.departure,
                spacecraft: d.flight_vehicle?.spacecraft?.name,
                station: d.docking_location?.spacestation?.name,
                port: d.docking_location?.name,
              });
            });
          }
        }
      }
    });

    // 2. Text-match ships
    shipNames.forEach(shipName => {
      const nameLower = shipName.toLowerCase();
      if (nameLower.length > 3 && text.includes(nameLower)) {
        const ship = shipByName.get(nameLower);
        if (ship && !matchedShips.find(ms => ms.name === ship.name)) {
          matchedShips.push({
            id: ship.id,
            name: ship.name,
            type: ship.type,
            roles: ship.roles,
            image: ship.image
          });
        }
      }
    });

    // 3. Dragon capsule name matches
    const dragonNames = [
      'endurance', 'endeavour', 'resilience', 'freedom', 
      'crew dragon', 'cargo dragon', 'crs-', 'crew-'
    ];
    dragonNames.forEach(dn => {
      if (text.includes(dn)) dragonMentions.push(dn);
    });
    // Check actual capsule names from docking events
    dragonCapsules.forEach(cn => {
      if (text.includes(cn.toLowerCase())) dragonMentions.push(cn);
    });

    // 4. Detect activities
    const activities = [];
    if (text.includes('spacex') || text.includes('dragon') || text.includes('falcon')) activities.push('spacex');
    if (text.includes('spacewalk') || text.includes('eva')) activities.push('eva');
    if (text.includes('reboost') || text.includes('orbit raise')) activities.push('reboost');
    if (text.includes('undock')) activities.push('undock');
    if (text.includes('docking') || text.match(/\bdock\b/)) activities.push('dock');
    if (text.includes('cargo') || text.includes('cygnus') || text.includes('progress')) activities.push('cargo');
    if (text.includes('crew swap') || text.includes('handover')) activities.push('crew_swap');
    if (text.includes('starliner')) activities.push('starliner');
    if (text.includes('soyuz')) activities.push('soyuz');
    if (text.includes('starlink')) activities.push('starlink');

    // Categorize report type
    let category = 'general';
    const title = (report.title || '').toLowerCase();
    if (title.includes('iss daily summary')) category = 'iss_daily';
    else if (title.includes('iss on-orbit')) category = 'iss_status';
    else if (title.includes('starliner')) category = 'starliner';
    else if (title.includes('boeing')) category = 'boeing';
    else if (title.includes('station') || title.includes('iss')) category = 'iss';

    report.matched_launches = matchedLaunches;
    report.matched_ships = matchedShips;
    report.matched_dockings = matchedDockings;
    report.dragon_mentions = [...new Set(dragonMentions)];
    report.activities = [...new Set(activities)];
    report.category = category;

    if (matchedLaunches.length > 0) linkedLaunches++;
    if (matchedShips.length > 0) linkedShips++;
    if (matchedDockings.length > 0) linkedDockings++;
  });

  console.log(`  Reports with launch matches: ${linkedLaunches}/${reports.length}`);
  console.log(`  Reports with ship matches: ${linkedShips}/${reports.length}`);
  console.log(`  Reports with docking matches: ${linkedDockings}/${reports.length}`);

  return reports;
}

// ─── Build docking summary ────────────────────────────────────────────────

function buildDockingSummary(dockingEvents) {
  return dockingEvents.map(d => ({
    id: d.id,
    launch_id: d.launch_id,
    docking: d.docking,
    departure: d.departure,
    spacecraft_name: d.flight_vehicle?.spacecraft?.name || 'Unknown',
    spacecraft_type: d.flight_vehicle?.spacecraft?.spacecraft_config?.name || 'Unknown',
    destination: d.flight_vehicle?.destination || 'Unknown',
    docking_location: d.docking_location?.name || 'Unknown',
    station: d.docking_location?.spacestation?.name || 'Unknown',
    time_docked: d.flight_vehicle?.spacecraft?.time_docked || null,
    mission_end: d.flight_vehicle?.mission_end || null,
    description: d.flight_vehicle?.spacecraft?.description || null,
    image: d.flight_vehicle?.spacecraft?.spacecraft_config?.image_url || null,
  }));
}

// ─── Build launch-ship cross-reference ────────────────────────────────────

function buildCrossRef(launches, ships, dockingEvents) {
  const map = {};

  launches.forEach(l => {
    if (l.ships && l.ships.length > 0) {
      map[l.id] = {
        launch_id: l.id, launch_name: l.name,
        launch_date: l.date_utc || l.net,
        ship_ids: l.ships,
        ship_details: l.ships.map(sid => {
          const ship = ships.find(s => s.id === sid);
          return ship ? { id: ship.id, name: ship.name, type: ship.type, roles: ship.roles, image: ship.image } : { id: sid };
        })
      };
    }
  });

  if (dockingEvents) {
    dockingEvents.forEach(d => {
      if (d.launch_id) {
        if (!map[d.launch_id]) {
          map[d.launch_id] = { launch_id: d.launch_id, launch_name: null, ship_ids: [], ship_details: [] };
        }
        map[d.launch_id].docking = {
          docking_date: d.docking,
          departure_date: d.departure,
          spacecraft: d.flight_vehicle?.spacecraft?.name,
          spacecraft_type: d.flight_vehicle?.spacecraft?.spacecraft_config?.name,
          station: d.docking_location?.spacestation?.name,
          docking_port: d.docking_location?.name,
        };
      }
    });
  }

  return Object.values(map);
}

// ─── MAIN ──────────────────────────────────────────────────────────────────

async function main() {
  const t0 = Date.now();
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║     FETCH ALL REPORTS + CROSS-LINK                     ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // 1. Fetch all SNAPI reports
  console.log('── 1. Fetching ALL reports from SNAPI ──\n');
  const allReports = await fetchAllReports();
  console.log(`\n  Total reports: ${allReports.length}`);

  // Preserve existing scraped content
  const oldReports = loadJSON('news-reports.json') || [];
  const oldMap = new Map();
  oldReports.forEach(r => { if (r.content) oldMap.set(r.id, r); });

  allReports.forEach(r => {
    const old = oldMap.get(r.id);
    if (old) {
      r.content = old.content;
      r.content_html = old.content_html;
      r.word_count = old.word_count || (r.content ? r.content.split(/\s+/).length : 0);
    }
    if (!r.featured) r.featured = false;
    if (!r.launches) r.launches = [];
    if (!r.events) r.events = [];
  });
  console.log(`  Preserved content for ${oldMap.size} existing reports\n`);

  // 2. Load existing data for cross-linking
  console.log('── 2. Loading existing data ──\n');
  const launches = loadJSON('launches.json') || [];
  const ships = loadJSON('ships.json') || [];
  const dockingEvents = loadJSON('ll2-docking-events.json') || [];
  console.log(`  Launches: ${launches.length}, Ships: ${ships.length}, Docking events: ${dockingEvents.length}\n`);

  // 3. Cross-link
  console.log('── 3. Cross-linking ──\n');
  const enriched = crossLinkReports(allReports, launches, ships, dockingEvents);
  save('news-reports.json', enriched);

  // 4. Build docking summary
  console.log('── 4. Docking summary ──\n');
  const summary = buildDockingSummary(dockingEvents);
  save('ll2-docking-summary.json', summary);

  // 5. Launch-ship cross-ref
  console.log('── 5. Launch-ship cross-reference ──\n');
  const crossRef = buildCrossRef(launches, ships, dockingEvents);
  save('launch-ship-crossref.json', crossRef);

  // ─── Stats ──────────────────────────────────────────────────────────────
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  
  const byCategory = {};
  const bySite = {};
  enriched.forEach(r => {
    byCategory[r.category] = (byCategory[r.category] || 0) + 1;
    const site = r.news_site || 'Unknown';
    bySite[site] = (bySite[site] || 0) + 1;
  });

  const withLaunches = enriched.filter(r => r.matched_launches?.length > 0).length;
  const withShips = enriched.filter(r => r.matched_ships?.length > 0).length;
  const withDockings = enriched.filter(r => r.matched_dockings?.length > 0).length;
  const withContent = enriched.filter(r => r.content).length;
  const withSpacex = enriched.filter(r => r.activities?.includes('spacex')).length;

  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║                   COMPLETE                             ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`  Time: ${elapsed}s`);
  console.log(`\n  Reports: ${enriched.length} total`);
  console.log(`    By category: ${JSON.stringify(byCategory, null, 2)}`);
  console.log(`    By source: ${JSON.stringify(bySite, null, 2)}`);
  console.log(`    With scraped content: ${withContent}`);
  console.log(`    With matched launches: ${withLaunches}`);
  console.log(`    With matched ships: ${withShips}`);
  console.log(`    With docking matches: ${withDockings}`);
  console.log(`    SpaceX-related: ${withSpacex}`);
  console.log(`\n  Docking summary: ${summary.length}`);
  console.log(`  Launch-ship cross-refs: ${crossRef.length}`);
  
  // Date range
  const dates = enriched.map(r => new Date(r.published_at)).sort((a,b) => a-b);
  console.log(`  Date range: ${dates[0].toISOString().split('T')[0]} to ${dates[dates.length-1].toISOString().split('T')[0]}`);
  console.log('');
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
