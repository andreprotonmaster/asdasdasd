export interface StarlinkSatellite {
  id: string;
  noradId: number;
  shell: string;
  altitude: number;
  velocity: number;
  lat: number;
  lng: number;
  status: "active" | "maneuvering" | "deorbiting";
  inclination: number;
  eccentricity: number;
  epoch: string;
  meanMotion: number;
  bstar: number;
}

export interface ShellInfo {
  name: string;
  count: number;
}

export interface InclinationGroup {
  inclination: string;
  count: number;
}

export interface NextLaunch {
  name: string;
  net: string;
  status: string;
  statusAbbrev: string;
  mission: string;
  description: string;
  orbit: string;
  pad: string;
  location: string;
  provider: string;
  rocket: string;
  image: string | null;
  webcastUrl: string | null;
  probability: number | null;
  padLatitude: string | null;
  padLongitude: string | null;
}

export interface MapSatellite {
  id: string;
  noradId: number;
  lat: number;
  lng: number;
  alt: number;
  status: "active" | "maneuvering" | "deorbiting";
  shell: string;
  inc: number;
  vel: number;
}

export interface StarlinkData {
  timestamp: string;
  constellation: {
    total: number;
    active: number;
    maneuvering: number;
    deorbiting: number;
  };
  altitude: {
    avg: number;
    min: number;
    max: number;
  };
  velocity: {
    avg: number;
    min: number;
    max: number;
  };
  orbitalPeriod: {
    avg: number;
  };
  constellationAge: {
    newestEpoch: string;
    oldestEpoch: string;
    avgRevolutions: number;
  };
  shells: ShellInfo[];
  inclinationGroups: InclinationGroup[];
  upcomingLaunches: NextLaunch[];
  satellites: StarlinkSatellite[];
  mapSatellites: MapSatellite[];
}
