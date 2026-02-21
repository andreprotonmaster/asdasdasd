#!/usr/bin/env node
/**
 * Fetch MORE data:
 *  1. ALL 1,415 reports from SNAPI (not just "spacex" search — all reports)
 *  2. 528 docking events from LL2 v2.2.0
 *  3. Space station data from LL2 v2.2.0
 *  4. Cross-link reports with launches and ships
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'public', 'data');
mkdirSync(DATA_DIR, { recursive: true });

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ─── SNAPI paginated fetch (ALL items, no search filter) ──────────────────

async function fetchSNAPIAll(endpoint, extraParams = '') {
  const base = `https://api.spaceflightnewsapi.net/v4/${endpoint}/`;
  let all = [];
  let url = `${base}?limit=100${extraParams}`;
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

// ─── LL2 v2.2.0 paginated fetch ──────────────────────────────────────────

async function fetchLL2v2(endpoint, params = '') {
  const base = `https://ll.thespacedevs.com/2.2.0/${endpoint}/`;
  let all = [];
  let url = `${base}?limit=100&format=json${params}`;
  let page = 1;

  while (url) {
    process.stdout.write(`  [LL2 v2.2] ${endpoint} page ${page}...`);
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
    await sleep(4000);
  }
  return all;
}

function save(filename, data) {
  const path = join(DATA_DIR, filename);
  writeFileSync(path, JSON.stringify(data, null, 2));
  const mb = (Buffer.byteLength(JSON.stringify(data)) / 1024 / 1024).toFixed(2);
  console.log(`   → Saved ${filename} (${mb} MB, ${Array.isArray(data) ? data.length + ' items' : 'object'})\n`);
}

function loadJSON(filename) {
  const path = join(DATA_DIR, filename);
  if (existsSync(path)) {
    return JSON.parse(readFileSync(path, 'utf8'));
  }
  return null;
}

// ─── Cross-linking logic ──────────────────────────────────────────────────

function crossLinkReports(reports, launches, ships) {
  console.log('\n  Cross-linking reports with launches and ships...');

  // Build lookup maps
  const launchByName = new Map();
  const launchById = new Map();
  launches.forEach(l => {
    launchById.set(l.id, l);
    if (l.name) launchByName.set(l.name.toLowerCase(), l);
  });

  const shipByName = new Map();
  ships.forEach(s => {
    if (s.name) shipByName.set(s.name.toLowerCase(), s);
  });

  // Ship name keywords for fuzzy matching
  const shipNames = ships.map(s => s.name).filter(Boolean);
  
  // Common SpaceX vehicle/mission keywords
  const missionKeywords = [
    'crew dragon', 'cargo dragon', 'dragon', 'falcon 9', 'falcon heavy',
    'starship', 'crs-', 'crew-', 'starlink', 'transporter-',
    'ax-', 'axiom', 'polaris', 'inspiration4'
  ];

  let linkedLaunches = 0;
  let linkedShips = 0;

  reports.forEach(report => {
    const text = `${report.title || ''} ${report.summary || ''} ${report.content || ''}`.toLowerCase();
    const pubDate = new Date(report.published_at);

    // 1. Match launches by SNAPI launches field (if populated)
    const matchedLaunches = [];
    const matchedShips = [];

    if (report.launches && report.launches.length > 0) {
      report.launches.forEach(ll => {
        const launch = launchById.get(ll.launch_id || ll.id);
        if (launch) matchedLaunches.push({ id: launch.id, name: launch.name });
      });
    }

    // 2. Text-match launches by name (within ±60 day window)
    launches.forEach(launch => {
      if (!launch.name) return;
      const launchDate = new Date(launch.date_utc || launch.net);
      const daysDiff = Math.abs((pubDate - launchDate) / (1000 * 60 * 60 * 24));
      if (daysDiff > 60) return;

      // Extract meaningful keywords from launch name
      const nameLower = launch.name.toLowerCase();
      const nameWords = nameLower.split(/[\s|/()]+/).filter(w => w.length > 2);
      
      // Check if any meaningful part of launch name appears in report text
      const matchCount = nameWords.filter(w => text.includes(w)).length;
      if (matchCount >= 2 || (matchCount >= 1 && nameWords.length <= 2)) {
        if (!matchedLaunches.find(ml => ml.id === launch.id)) {
          matchedLaunches.push({
            id: launch.id,
            name: launch.name,
            date: launch.date_utc || launch.net,
            match_type: 'text'
          });
        }
      }
    });

    // 3. Text-match ships by name
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

    // 4. Also check for Dragon capsule names in text (e.g. "Endurance", "Endeavour", "Resilience", "Freedom")
    const dragonNames = ['endurance', 'endeavour', 'resilience', 'freedom', 'crew dragon'];
    dragonNames.forEach(dn => {
      if (text.includes(dn)) {
        if (!report._dragon_mentions) report._dragon_mentions = [];
        report._dragon_mentions.push(dn);
      }
    });

    // 5. Detect SpaceX-specific activities mentioned
    const activities = [];
    if (text.includes('spacex') || text.includes('dragon') || text.includes('falcon')) {
      activities.push('spacex');
    }
    if (text.includes('spacewalk') || text.includes('eva')) activities.push('eva');
    if (text.includes('reboost') || text.includes('orbit raise')) activities.push('reboost');
    if (text.includes('undock') || text.includes('undocking')) activities.push('undock');
    if (text.includes('docking') || text.includes(' dock')) activities.push('dock');
    if (text.includes('cargo') || text.includes('cygnus') || text.includes('progress')) activities.push('cargo');
    if (text.includes('crew swap') || text.includes('handover')) activities.push('crew_swap');

    report.matched_launches = matchedLaunches;
    report.matched_ships = matchedShips;
    report.activities = [...new Set(activities)];

    if (matchedLaunches.length > 0) linkedLaunches++;
    if (matchedShips.length > 0) linkedShips++;
  });

  console.log(`  Reports with launch matches: ${linkedLaunches}/${reports.length}`);
  console.log(`  Reports with ship matches: ${linkedShips}/${reports.length}`);

  return reports;
}

// ─── MAIN ──────────────────────────────────────────────────────────────────

async function main() {
  const t0 = Date.now();

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║     FETCH MORE DATA — Reports, Docking, Ships          ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // ═══ 1. ALL REPORTS FROM SNAPI ═══
  console.log('═══ 1. ALL REPORTS (no search filter) ═══\n');
  const allReports = await fetchSNAPIAll('reports');
  console.log(`  Total reports fetched: ${allReports.length}`);

  // Preserve existing content from our old reports
  const oldReports = loadJSON('news-reports.json') || [];
  const oldContentMap = new Map();
  oldReports.forEach(r => {
    if (r.content) oldContentMap.set(r.id, r);
  });
  
  // Merge: keep our scraped content for reports we already had
  allReports.forEach(r => {
    const old = oldContentMap.get(r.id);
    if (old) {
      r.content = old.content;
      r.content_html = old.content_html;
      r.word_count = old.word_count || (r.content ? r.content.split(/\s+/).length : 0);
    }
    // Ensure required fields exist
    if (!r.featured) r.featured = false;
    if (!r.launches) r.launches = [];
    if (!r.events) r.events = [];
  });

  console.log(`  Reports with existing content: ${oldContentMap.size}`);
  console.log(`  Reports needing scraping: ${allReports.length - oldContentMap.size}\n`);

  // ═══ 2. DOCKING EVENTS FROM LL2 v2.2.0 ═══
  console.log('═══ 2. DOCKING EVENTS (LL2 v2.2.0) ═══\n');
  const dockingEvents = await fetchLL2v2('docking_event');
  save('ll2-docking-events.json', dockingEvents);

  // ═══ 3. SPACE STATIONS FROM LL2 v2.2.0 ═══
  console.log('═══ 3. SPACE STATIONS (LL2 v2.2.0) ═══\n');
  const spaceStations = await fetchLL2v2('spacestation');
  save('ll2-spacestations.json', spaceStations);

  // ═══ 4. SPACECRAFT FLIGHTS (Dragon missions with docking info) ═══
  console.log('═══ 4. SPACECRAFT FLIGHTS (LL2 v2.2.0) ═══\n');
  const spacecraftFlights = await fetchLL2v2('spacecraft/flight', '&search=Dragon');
  save('ll2-spacecraft-flights.json', spacecraftFlights);

  // ═══ 5. CROSS-LINK REPORTS ═══
  console.log('\n═══ 5. CROSS-LINKING ═══\n');
  const launches = loadJSON('launches.json') || [];
  const ships = loadJSON('ships.json') || [];
  
  const enrichedReports = crossLinkReports(allReports, launches, ships);
  save('news-reports.json', enrichedReports);

  // ═══ 6. ENRICH SHIPS WITH DOCKING DATA ═══
  console.log('═══ 6. ENRICHING SHIPS ═══\n');
  
  // Create a ship-enrichment map from docking events
  const dragonDockings = dockingEvents.filter(d => 
    d.flight_vehicle?.spacecraft?.spacecraft_config?.name?.toLowerCase().includes('dragon') ||
    d.flight_vehicle?.spacecraft?.name?.toLowerCase().includes('dragon')
  );
  console.log(`  Dragon docking events: ${dragonDockings.length}/${dockingEvents.length}`);

  // Build enriched docking summary
  const dockingSummary = dockingEvents.map(d => ({
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
  save('ll2-docking-summary.json', dockingSummary);

  // ═══ 7. CREATE ENRICHED LAUNCH-SHIP CROSS-REFERENCE ═══
  console.log('═══ 7. LAUNCH-SHIP CROSS-REFERENCE ═══\n');
  
  const launchShipMap = {};
  
  // From launches.json ships array
  launches.forEach(l => {
    if (l.ships && l.ships.length > 0) {
      launchShipMap[l.id] = {
        launch_id: l.id,
        launch_name: l.name,
        launch_date: l.date_utc || l.net,
        ship_ids: l.ships,
        ship_details: l.ships.map(sid => {
          const ship = ships.find(s => s.id === sid);
          return ship ? { id: ship.id, name: ship.name, type: ship.type, roles: ship.roles, image: ship.image } : { id: sid };
        })
      };
    }
  });
  
  // From docking events (launch_id → spacecraft)
  dockingEvents.forEach(d => {
    if (d.launch_id) {
      if (!launchShipMap[d.launch_id]) {
        launchShipMap[d.launch_id] = {
          launch_id: d.launch_id,
          launch_name: null,
          ship_ids: [],
          ship_details: [],
        };
      }
      const entry = launchShipMap[d.launch_id];
      entry.docking = {
        docking_date: d.docking,
        departure_date: d.departure,
        spacecraft: d.flight_vehicle?.spacecraft?.name,
        spacecraft_type: d.flight_vehicle?.spacecraft?.spacecraft_config?.name,
        station: d.docking_location?.spacestation?.name,
        docking_port: d.docking_location?.name,
      };
    }
  });

  const crossRef = Object.values(launchShipMap);
  save('launch-ship-crossref.json', crossRef);

  // ═══ SUMMARY ═══
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  
  // Stats on reports
  const reportsBySource = {};
  enrichedReports.forEach(r => {
    const site = r.news_site || 'Unknown';
    reportsBySource[site] = (reportsBySource[site] || 0) + 1;
  });
  
  const withLaunches = enrichedReports.filter(r => r.matched_launches?.length > 0).length;
  const withShips = enrichedReports.filter(r => r.matched_ships?.length > 0).length;
  const withContent = enrichedReports.filter(r => r.content).length;
  const withActivities = enrichedReports.filter(r => r.activities?.length > 0).length;

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║                   FETCH COMPLETE                       ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`  Time: ${elapsed}s`);
  console.log(`\n  Reports: ${enrichedReports.length} total`);
  console.log(`    By source: ${JSON.stringify(reportsBySource)}`);
  console.log(`    With content: ${withContent}`);
  console.log(`    With matched launches: ${withLaunches}`);
  console.log(`    With matched ships: ${withShips}`);
  console.log(`    With activities: ${withActivities}`);
  console.log(`\n  Docking events: ${dockingEvents.length}`);
  console.log(`    Dragon: ${dragonDockings.length}`);
  console.log(`\n  Space stations: ${spaceStations.length}`);
  console.log(`  Spacecraft flights: ${spacecraftFlights.length}`);
  console.log(`  Launch-ship cross-refs: ${crossRef.length}`);
  console.log('');
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
