"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  SpaceXData,
  EnrichedLaunch,
  LaunchStats,
  Launch,
  Rocket,
  Payload,
  Core,
  Capsule,
  Launchpad,
} from "./types";

// ============================================================
// Client-side hooks for SpaceX data
// Fetches from static JSON files in /data/ (pre-downloaded
// and patched clone of SpaceX API v4).
// ============================================================

// Simple client-side cache
const clientCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour (static data, generous cache)

async function cachedFetch<T>(url: string): Promise<T> {
  const cached = clientCache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Data fetch error: ${res.status}`);
  const data = await res.json();
  clientCache.set(url, { data, timestamp: Date.now() });
  return data as T;
}

// ---- Generic fetch hook ----

interface UseSpaceXResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

function useStaticData<T>(
  filename: string,
  transform?: (data: T) => T
): UseSpaceXResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await cachedFetch<T>(`/data/${filename}`);
      const result = transform ? transform(raw) : raw;
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filename]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// ---- Specific hooks ----

/** All launches (past + upcoming), sorted newest first */
export function useAllLaunches() {
  return useStaticData<Launch[]>("launches.json", (data) =>
    [...data].sort((a, b) => b.date_unix - a.date_unix)
  );
}

/** Past launches only, newest first */
export function usePastLaunches() {
  return useStaticData<Launch[]>("launches.json", (data) =>
    [...data]
      .filter((l) => !l.upcoming)
      .sort((a, b) => b.date_unix - a.date_unix)
  );
}

/** Upcoming launches, soonest first */
export function useUpcomingLaunches() {
  return useStaticData<Launch[]>("launches.json", (data) =>
    [...data]
      .filter((l) => l.upcoming)
      .sort((a, b) => a.date_unix - b.date_unix)
  );
}

/** Latest launched mission */
export function useLatestLaunch() {
  return useStaticData<Launch>("launches.json", ((data: unknown) => {
    const launches = data as unknown as Launch[];
    const past = launches
      .filter((l) => !l.upcoming)
      .sort((a, b) => b.date_unix - a.date_unix);
    return past[0] as unknown as Launch;
  }) as (data: Launch) => Launch);
}

/** Next upcoming launch */
export function useNextLaunch() {
  return useStaticData<Launch>("launches.json", ((data: unknown) => {
    const launches = data as unknown as Launch[];
    const upcoming = launches
      .filter((l) => l.upcoming)
      .sort((a, b) => a.date_unix - b.date_unix);
    return upcoming[0] as unknown as Launch;
  }) as (data: Launch) => Launch);
}

/** All rockets */
export function useRockets() {
  return useStaticData<Rocket[]>("rockets.json");
}

/** All payloads */
export function usePayloads() {
  return useStaticData<Payload[]>("payloads.json");
}

/** All cores with reuse data */
export function useCores() {
  return useStaticData<Core[]>("cores.json", (data) =>
    [...data].sort((a, b) => b.reuse_count - a.reuse_count)
  );
}

/** All capsules */
export function useCapsules() {
  return useStaticData<Capsule[]>("capsules.json");
}

/** All launchpads */
export function useLaunchpads() {
  return useStaticData<Launchpad[]>("launchpads.json");
}

// ---- Combined data hook with enrichment + stats ----

interface UseSpaceXDataResult {
  data: SpaceXData | null;
  enrichedLaunches: EnrichedLaunch[];
  stats: LaunchStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useSpaceXData(): UseSpaceXDataResult {
  const [data, setData] = useState<SpaceXData | null>(null);
  const [enrichedLaunches, setEnrichedLaunches] = useState<EnrichedLaunch[]>([]);
  const [stats, setStats] = useState<LaunchStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [launches, rockets, payloads, cores, capsules, launchpads] =
        await Promise.all([
          cachedFetch<Launch[]>("/data/launches.json"),
          cachedFetch<Rocket[]>("/data/rockets.json"),
          cachedFetch<Payload[]>("/data/payloads.json"),
          cachedFetch<Core[]>("/data/cores.json"),
          cachedFetch<Capsule[]>("/data/capsules.json"),
          cachedFetch<Launchpad[]>("/data/launchpads.json"),
        ]);

      const spaceXData: SpaceXData = {
        launches,
        rockets,
        payloads,
        cores,
        capsules,
        launchpads,
        fetchedAt: new Date().toISOString(),
      };

      // Build lookup maps
      const rocketMap = new Map(rockets.map((r) => [r.id, r]));
      const launchpadMap = new Map(launchpads.map((l) => [l.id, l]));
      const payloadMap = new Map(payloads.map((p) => [p.id, p]));
      const coreMap = new Map(cores.map((c) => [c.id, c]));

      // Enrich launches with related data
      const enriched: EnrichedLaunch[] = [...launches]
        .sort((a, b) => b.date_unix - a.date_unix)
        .map((launch) => ({
          ...launch,
          rocketData: rocketMap.get(launch.rocket) ?? null,
          launchpadData: launchpadMap.get(launch.launchpad) ?? null,
          payloadData: launch.payloads
            .map((pid) => payloadMap.get(pid))
            .filter(Boolean) as Payload[],
          coreData: launch.cores.map((c) =>
            c.core ? coreMap.get(c.core) ?? null : null
          ),
        }));

      // Compute stats
      const pastLaunches = launches.filter((l) => !l.upcoming);
      const successfulLaunches = pastLaunches.filter((l) => l.success === true);
      const failedLaunches = pastLaunches.filter((l) => l.success === false);
      const upcomingLaunches = launches.filter((l) => l.upcoming);

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

      let totalPayloadMassKg = 0;
      for (const payload of payloads) {
        if (payload.mass_kg) totalPayloadMassKg += payload.mass_kg;
      }

      let mostReusedCore: { serial: string; flights: number } | null = null;
      for (const core of cores) {
        const flights = core.reuse_count + 1;
        if (!mostReusedCore || flights > mostReusedCore.flights) {
          mostReusedCore = { serial: core.serial, flights };
        }
      }

      const launchesByYear: Record<string, number> = {};
      for (const l of pastLaunches) {
        const year = l.date_utc.slice(0, 4);
        launchesByYear[year] = (launchesByYear[year] || 0) + 1;
      }

      const launchesByRocket: Record<string, number> = {};
      for (const l of pastLaunches) {
        const rocketName = rocketMap.get(l.rocket)?.name || "Unknown";
        launchesByRocket[rocketName] = (launchesByRocket[rocketName] || 0) + 1;
      }

      const launchesByLaunchpad: Record<string, number> = {};
      for (const l of pastLaunches) {
        const padName = launchpadMap.get(l.launchpad)?.name || "Unknown";
        launchesByLaunchpad[padName] = (launchesByLaunchpad[padName] || 0) + 1;
      }

      const launchesByOrbit: Record<string, number> = {};
      for (const payload of payloads) {
        const orbit = payload.orbit || "Unknown";
        launchesByOrbit[orbit] = (launchesByOrbit[orbit] || 0) + 1;
      }

      const computedStats: LaunchStats = {
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
        totalFlights: launches.length,
        mostReusedCore,
        launchesByYear,
        launchesByRocket,
        launchesByLaunchpad,
        launchesByOrbit,
      };

      setData(spaceXData);
      setEnrichedLaunches(enriched);
      setStats(computedStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch SpaceX data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { data, enrichedLaunches, stats, loading, error, refetch: fetchAll };
}
