// ============================================================
// SpaceX API v4 — Full TypeScript Type Definitions
// Source: https://api.spacexdata.com/v4/
// ============================================================

// ---- Common sub-types ----

export interface Dimension {
  meters: number | null;
  feet: number | null;
}

export interface Mass {
  kg: number | null;
  lb: number | null;
}

export interface Thrust {
  kN: number;
  lbf: number;
}

// ---- Launch Types ----

export interface LaunchPatch {
  small: string | null;
  large: string | null;
}

export interface LaunchRedditLinks {
  campaign: string | null;
  launch: string | null;
  media: string | null;
  recovery: string | null;
}

export interface LaunchFlickrImages {
  small: string[];
  original: string[];
}

export interface LaunchLinks {
  patch: LaunchPatch;
  reddit: LaunchRedditLinks;
  flickr: LaunchFlickrImages;
  presskit: string | null;
  webcast: string | null;
  youtube_id: string | null;
  article: string | null;
  wikipedia: string | null;
}

export interface LaunchFairings {
  reused: boolean | null;
  recovery_attempt: boolean | null;
  recovered: boolean | null;
  ships: string[];
}

export interface LaunchFailure {
  time: number;
  altitude: number | null;
  reason: string;
}

export interface LaunchCore {
  core: string | null;
  flight: number | null;
  gridfins: boolean | null;
  legs: boolean | null;
  reused: boolean | null;
  landing_attempt: boolean | null;
  landing_success: boolean | null;
  landing_type: string | null;
  landpad: string | null;
}

export interface Launch {
  id: string;
  flight_number: number;
  name: string;
  date_utc: string;
  date_unix: number;
  date_local: string;
  date_precision: "half" | "quarter" | "year" | "month" | "day" | "hour";
  static_fire_date_utc: string | null;
  static_fire_date_unix: number | null;
  tbd: boolean;
  net: boolean;
  window: number | null;
  rocket: string; // Rocket ID
  success: boolean | null;
  failures: LaunchFailure[];
  upcoming: boolean;
  details: string | null;
  fairings: LaunchFairings | null;
  crew: string[];
  ships: string[];
  capsules: string[];
  payloads: string[]; // Payload IDs
  launchpad: string; // Launchpad ID
  cores: LaunchCore[];
  links: LaunchLinks;
  auto_update: boolean;
  launch_library_id: string | null;
}

// ---- Rocket Types ----

export interface RocketFirstStage {
  thrust_sea_level: Thrust;
  thrust_vacuum: Thrust;
  reusable: boolean;
  engines: number;
  fuel_amount_tons: number;
  burn_time_sec: number | null;
}

export interface CompositeFairing {
  height: Dimension;
  diameter: Dimension;
}

export interface RocketSecondStagePayloads {
  composite_fairing: CompositeFairing;
  option_1: string;
}

export interface RocketSecondStage {
  thrust: Thrust;
  payloads: RocketSecondStagePayloads;
  reusable: boolean;
  engines: number;
  fuel_amount_tons: number;
  burn_time_sec: number | null;
}

export interface RocketEngines {
  isp: {
    sea_level: number;
    vacuum: number;
  };
  thrust_sea_level: Thrust;
  thrust_vacuum: Thrust;
  number: number;
  type: string;
  version: string;
  layout: string | null;
  engine_loss_max: number | null;
  propellant_1: string;
  propellant_2: string;
  thrust_to_weight: number;
}

export interface RocketLandingLegs {
  number: number;
  material: string | null;
}

export interface RocketPayloadWeight {
  id: string;
  name: string;
  kg: number;
  lb: number;
}

export interface Rocket {
  id: string;
  name: string;
  type: string;
  active: boolean;
  stages: number;
  boosters: number;
  cost_per_launch: number;
  success_rate_pct: number;
  first_flight: string;
  country: string;
  company: string;
  height: Dimension;
  diameter: Dimension;
  mass: Mass;
  first_stage: RocketFirstStage;
  second_stage: RocketSecondStage;
  engines: RocketEngines;
  landing_legs: RocketLandingLegs;
  payload_weights: RocketPayloadWeight[];
  flickr_images: string[];
  wikipedia: string;
  description: string;
}

// ---- Payload Types ----

export interface PayloadDragon {
  capsule: string | null;
  mass_returned_kg: number | null;
  mass_returned_lbs: number | null;
  flight_time_sec: number | null;
  manifest: string | null;
  water_landing: boolean | null;
  land_landing: boolean | null;
}

export interface Payload {
  id: string;
  name: string;
  type: string;
  reused: boolean;
  launch: string; // Launch ID
  customers: string[];
  norad_ids: number[];
  nationalities: string[];
  manufacturers: string[];
  mass_kg: number | null;
  mass_lbs: number | null;
  orbit: string | null;
  reference_system: string | null;
  regime: string | null;
  longitude: number | null;
  semi_major_axis_km: number | null;
  eccentricity: number | null;
  periapsis_km: number | null;
  apoapsis_km: number | null;
  inclination_deg: number | null;
  period_min: number | null;
  lifespan_years: number | null;
  epoch: string | null;
  mean_motion: number | null;
  raan: number | null;
  arg_of_pericenter: number | null;
  mean_anomaly: number | null;
  dragon: PayloadDragon;
}

// ---- Core Types ----

export interface Core {
  id: string;
  serial: string;
  block: number | null;
  status: "active" | "retired" | "lost" | "expended" | "unknown";
  reuse_count: number;
  rtls_attempts: number;
  rtls_landings: number;
  asds_attempts: number;
  asds_landings: number;
  last_update: string | null;
  launches: string[]; // Launch IDs
}

// ---- Capsule Types ----

export interface Capsule {
  id: string;
  serial: string;
  status: "active" | "retired" | "destroyed" | "unknown";
  type: string;
  reuse_count: number;
  water_landings: number;
  land_landings: number;
  last_update: string | null;
  launches: string[]; // Launch IDs
}

// ---- Launchpad Types ----

export interface LaunchpadImages {
  large: string[];
}

export interface Launchpad {
  id: string;
  name: string;
  full_name: string;
  status: "active" | "inactive" | "retired" | "lost" | "under construction";
  locality: string;
  region: string;
  timezone: string;
  latitude: number;
  longitude: number;
  launch_attempts: number;
  launch_successes: number;
  rockets: string[]; // Rocket IDs
  launches: string[]; // Launch IDs
  details: string;
  images: LaunchpadImages;
}

// ---- Enriched / Denormalized Types (for frontend) ----

export interface EnrichedLaunch extends Omit<Launch, "rocket" | "launchpad"> {
  rocketData: Rocket | null;
  launchpadData: Launchpad | null;
  payloadData: Payload[];
  coreData: (Core | null)[];
}

// ---- API response summary ----

export interface SpaceXData {
  launches: Launch[];
  rockets: Rocket[];
  payloads: Payload[];
  cores: Core[];
  capsules: Capsule[];
  launchpads: Launchpad[];
  fetchedAt: string;
}

// ---- Computed stats ----

export interface LaunchStats {
  totalLaunches: number;
  successfulLaunches: number;
  failedLaunches: number;
  upcomingLaunches: number;
  successRate: number;
  totalLandingAttempts: number;
  totalLandingSuccesses: number;
  landingSuccessRate: number;
  totalPayloadMassKg: number;
  totalFlights: number;
  mostReusedCore: { serial: string; flights: number } | null;
  launchesByYear: Record<string, number>;
  launchesByRocket: Record<string, number>;
  launchesByLaunchpad: Record<string, number>;
  launchesByOrbit: Record<string, number>;
}
