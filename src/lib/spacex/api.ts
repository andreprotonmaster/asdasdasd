// ============================================================
// SpaceX Data Service — Static Local Data
// Reads from pre-downloaded JSON files in public/data/.
// Data was cloned from SpaceX API v4 and patched with
// corrected launch statuses for missions after Oct 2022.
// ============================================================

import { readFileSync } from "fs";
import { join } from "path";
import type {
  Launch,
  Rocket,
  Payload,
  Core,
  Capsule,
  Launchpad,
  SpaceXData,
  EnrichedLaunch,
  LaunchStats,
} from "./types";

// ---- Read static JSON ----

function readData<T>(filename: string): T {
  const filePath = join(process.cwd(), "public", "data", filename);
  return JSON.parse(readFileSync(filePath, "utf-8")) as T;
}

// ---- In-memory cache (lazy singleton) ----

let cachedData: SpaceXData | null = null;

export async function fetchAllSpaceXData(): Promise<SpaceXData> {
  if (cachedData) return cachedData;

  const launches = readData<Launch[]>("launches.json");
  const rockets = readData<Rocket[]>("rockets.json");
  const payloads = readData<Payload[]>("payloads.json");
  const cores = readData<Core[]>("cores.json");
  const capsules = readData<Capsule[]>("capsules.json");
  const launchpads = readData<Launchpad[]>("launchpads.json");

  cachedData = {
    launches,
    rockets,
    payloads,
    cores,
    capsules,
    launchpads,
    fetchedAt: new Date().toISOString(),
  };

  return cachedData;
}

// ---- Lookup maps ----

function buildMaps(data: SpaceXData) {
  const rocketMap = new Map(data.rockets.map((r) => [r.id, r]));
  const launchpadMap = new Map(data.launchpads.map((l) => [l.id, l]));
  const payloadMap = new Map(data.payloads.map((p) => [p.id, p]));
  const coreMap = new Map(data.cores.map((c) => [c.id, c]));
  return { rocketMap, launchpadMap, payloadMap, coreMap };
}

// ---- Enrichment ----

export function enrichLaunch(
  launch: Launch,
  maps: ReturnType<typeof buildMaps>
): EnrichedLaunch {
  return {
    ...launch,
    rocketData: maps.rocketMap.get(launch.rocket) ?? null,
    launchpadData: maps.launchpadMap.get(launch.launchpad) ?? null,
    payloadData: launch.payloads
      .map((pid) => maps.payloadMap.get(pid))
      .filter(Boolean) as Payload[],
    coreData: launch.cores.map((c) =>
      c.core ? maps.coreMap.get(c.core) ?? null : null
    ),
  };
}

export async function getEnrichedLaunches(): Promise<EnrichedLaunch[]> {
  const data = await fetchAllSpaceXData();
  const maps = buildMaps(data);
  return data.launches.map((l) => enrichLaunch(l, maps));
}

// ---- Statistics ----

export function computeLaunchStats(data: SpaceXData): LaunchStats {
  const pastLaunches = data.launches.filter((l) => !l.upcoming);
  const successfulLaunches = pastLaunches.filter((l) => l.success === true);
  const failedLaunches = pastLaunches.filter((l) => l.success === false);
  const upcomingLaunches = data.launches.filter((l) => l.upcoming);

  // Landing stats
  let totalLandingAttempts = 0;
  let totalLandingSuccesses = 0;
  for (const launch of pastLaunches) {
    for (const core of launch.cores) {
      if (core.landing_attempt) {
        totalLandingAttempts++;
        if (core.landing_success) totalLandingSuccesses++;
      }
    }
  }

  // Total payload mass
  let totalPayloadMassKg = 0;
  for (const payload of data.payloads) {
    if (payload.mass_kg) totalPayloadMassKg += payload.mass_kg;
  }

  // Most reused core
  let mostReusedCore: { serial: string; flights: number } | null = null;
  for (const core of data.cores) {
    const flights = core.reuse_count + 1; // reuse_count=0 means 1 flight
    if (!mostReusedCore || flights > mostReusedCore.flights) {
      mostReusedCore = { serial: core.serial, flights };
    }
  }

  // Launches by year
  const launchesByYear: Record<string, number> = {};
  for (const l of pastLaunches) {
    const year = l.date_utc.slice(0, 4);
    launchesByYear[year] = (launchesByYear[year] || 0) + 1;
  }

  // Launches by rocket
  const launchesByRocket: Record<string, number> = {};
  const rocketMap = new Map(data.rockets.map((r) => [r.id, r.name]));
  for (const l of pastLaunches) {
    const rocketName = rocketMap.get(l.rocket) || "Unknown";
    launchesByRocket[rocketName] = (launchesByRocket[rocketName] || 0) + 1;
  }

  // Launches by launchpad
  const launchesByLaunchpad: Record<string, number> = {};
  const padMap = new Map(data.launchpads.map((p) => [p.id, p.name]));
  for (const l of pastLaunches) {
    const padName = padMap.get(l.launchpad) || "Unknown";
    launchesByLaunchpad[padName] = (launchesByLaunchpad[padName] || 0) + 1;
  }

  // Launches by orbit
  const launchesByOrbit: Record<string, number> = {};
  for (const payload of data.payloads) {
    const orbit = payload.orbit || "Unknown";
    launchesByOrbit[orbit] = (launchesByOrbit[orbit] || 0) + 1;
  }

  return {
    totalLaunches: pastLaunches.length,
    successfulLaunches: successfulLaunches.length,
    failedLaunches: failedLaunches.length,
    upcomingLaunches: upcomingLaunches.length,
    successRate:
      pastLaunches.length > 0
        ? Math.round((successfulLaunches.length / pastLaunches.length) * 10000) / 100
        : 0,
    totalLandingAttempts,
    totalLandingSuccesses,
    landingSuccessRate:
      totalLandingAttempts > 0
        ? Math.round((totalLandingSuccesses / totalLandingAttempts) * 10000) / 100
        : 0,
    totalPayloadMassKg,
    totalFlights: data.launches.length,
    mostReusedCore,
    launchesByYear,
    launchesByRocket,
    launchesByLaunchpad,
    launchesByOrbit,
  };
}

export async function getSpaceXStats(): Promise<LaunchStats> {
  const data = await fetchAllSpaceXData();
  return computeLaunchStats(data);
}

// ---- Convenience getters ----

export async function getPastLaunches(): Promise<Launch[]> {
  const data = await fetchAllSpaceXData();
  return data.launches
    .filter((l) => !l.upcoming)
    .sort((a, b) => b.date_unix - a.date_unix); // newest first
}

export async function getUpcomingLaunches(): Promise<Launch[]> {
  const data = await fetchAllSpaceXData();
  return data.launches
    .filter((l) => l.upcoming)
    .sort((a, b) => a.date_unix - b.date_unix); // soonest first
}

export async function getLatestLaunch(): Promise<EnrichedLaunch | null> {
  const data = await fetchAllSpaceXData();
  const maps = buildMaps(data);
  const past = data.launches
    .filter((l) => !l.upcoming)
    .sort((a, b) => b.date_unix - a.date_unix);
  return past.length > 0 ? enrichLaunch(past[0], maps) : null;
}

export async function getNextLaunch(): Promise<EnrichedLaunch | null> {
  const data = await fetchAllSpaceXData();
  const maps = buildMaps(data);
  const upcoming = data.launches
    .filter((l) => l.upcoming)
    .sort((a, b) => a.date_unix - b.date_unix);
  return upcoming.length > 0 ? enrichLaunch(upcoming[0], maps) : null;
}

export async function getLaunchById(id: string): Promise<EnrichedLaunch | null> {
  const data = await fetchAllSpaceXData();
  const maps = buildMaps(data);
  const launch = data.launches.find((l) => l.id === id);
  return launch ? enrichLaunch(launch, maps) : null;
}

export async function getRockets(): Promise<Rocket[]> {
  const data = await fetchAllSpaceXData();
  return data.rockets;
}

export async function getRocketById(id: string): Promise<Rocket | null> {
  const data = await fetchAllSpaceXData();
  return data.rockets.find((r) => r.id === id) ?? null;
}

export async function getLaunchpads(): Promise<Launchpad[]> {
  const data = await fetchAllSpaceXData();
  return data.launchpads;
}

export async function getCores(): Promise<Core[]> {
  const data = await fetchAllSpaceXData();
  return data.cores.sort((a, b) => b.reuse_count - a.reuse_count);
}

export async function getCapsules(): Promise<Capsule[]> {
  const data = await fetchAllSpaceXData();
  return data.capsules;
}

export async function getPayloads(): Promise<Payload[]> {
  const data = await fetchAllSpaceXData();
  return data.payloads;
}

// ---- Search ----

export async function searchLaunches(query: string): Promise<EnrichedLaunch[]> {
  const all = await getEnrichedLaunches();
  const q = query.toLowerCase();
  return all.filter(
    (l) =>
      l.name.toLowerCase().includes(q) ||
      l.details?.toLowerCase().includes(q) ||
      l.rocketData?.name.toLowerCase().includes(q) ||
      l.launchpadData?.name.toLowerCase().includes(q) ||
      l.payloadData.some((p) => p.name.toLowerCase().includes(q))
  );
}
