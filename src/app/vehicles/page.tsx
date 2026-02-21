"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Rocket,
  Flame,
  CheckCircle2,
  XCircle,
  Target,
  Users,
  ChevronRight,
  Gauge,
  Shield,
} from "lucide-react";
import rocketsData from "../../../public/data/rockets.json";
import dragonsData from "../../../public/data/dragons.json";

/* ── Types ─────────────────────────────────────────────────── */

interface RocketType {
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
  description: string;
  height: { meters: number; feet: number };
  diameter: { meters: number; feet: number };
  mass: { kg: number; lb: number };
  engines: {
    type: string;
    number: number;
    propellant_1: string;
    propellant_2: string;
    thrust_sea_level: { kN: number; lbf: number };
    thrust_vacuum: { kN: number; lbf: number };
  };
  payload_weights: Array<{ id: string; name: string; kg: number; lb: number }>;
  flickr_images: string[];
  wikipedia: string;
  first_stage: {
    reusable: boolean;
    engines: number;
    fuel_amount_tons: number;
    burn_time_sec: number;
  };
  second_stage: {
    reusable: boolean;
    engines: number;
    fuel_amount_tons: number;
    burn_time_sec: number;
  };
  landing_legs: { number: number; material: string | null };
}

interface DragonType {
  id: string;
  name: string;
  type: string;
  active: boolean;
  crew_capacity: number;
  orbit_duration_yr: number;
  dry_mass_kg: number;
  dry_mass_lb: number;
  first_flight: string;
  description: string;
  flickr_images: string[];
  wikipedia: string;
  heat_shield: { material: string; size_meters: number; temp_degrees: number };
  thrusters: Array<{
    type: string;
    amount: number;
    pods: number;
    fuel_1: string;
    fuel_2: string;
    isp: number;
    thrust: { kN: number; lbf: number };
  }>;
}

const rockets: RocketType[] = rocketsData as unknown as RocketType[];
const dragons: DragonType[] = dragonsData as unknown as DragonType[];

const rocketOrder = ["Starship", "Falcon Heavy", "Falcon 9", "Falcon 1"];

function formatCost(cost: number): string {
  if (cost >= 1e6) return `$${(cost / 1e6).toFixed(0)}M`;
  return `$${cost.toLocaleString()}`;
}

/* ── Vehicle card (rockets) ────────────────────────────────── */

function VehicleCard({ rocket, index }: { rocket: RocketType; index: number }) {
  const router = useRouter();
  const maxPayload = rocket.payload_weights.reduce((max, p) => Math.max(max, p.kg), 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass-panel hud-corners overflow-hidden cursor-pointer group hover:border-spacex-accent/30 transition-colors flex flex-col"
      onClick={() => router.push(`/vehicles/${rocket.id}`)}
    >
      <div className={`h-1 ${rocket.active ? "bg-gradient-to-r from-spacex-accent to-blue-600" : "bg-gradient-to-r from-gray-600 to-gray-500"}`} />

      {/* Image */}
      {rocket.flickr_images?.[0] && (
        <div className="relative h-48 overflow-hidden">
          <Image
            src={rocket.flickr_images[0]}
            alt={rocket.name}
            fill
            sizes="(max-width: 640px) 100vw, 50vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-spacex-dark via-spacex-dark/20 to-transparent" />

          {/* Top badges */}
          <div className="absolute top-3 right-3 flex gap-1.5">
            {rocket.active ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono bg-spacex-success/20 text-spacex-success border border-spacex-success/30 backdrop-blur-sm">
                <CheckCircle2 className="w-2.5 h-2.5" /> ACTIVE
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono bg-spacex-muted/20 text-spacex-muted border border-spacex-border/30 backdrop-blur-sm">
                <XCircle className="w-2.5 h-2.5" /> RETIRED
              </span>
            )}
            {rocket.first_stage.reusable && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-spacex-accent/20 text-spacex-accent border border-spacex-accent/30 backdrop-blur-sm">
                REUSABLE
              </span>
            )}
          </div>

          {/* Bottom overlay: name + success */}
          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
            <h3 className="font-display text-xl font-bold text-white drop-shadow-lg group-hover:text-spacex-accent transition-colors">
              {rocket.name}
            </h3>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold backdrop-blur-sm ${
              rocket.success_rate_pct >= 90 ? "bg-spacex-success/20 text-spacex-success" :
              rocket.success_rate_pct >= 50 ? "bg-yellow-500/20 text-yellow-400" :
              "bg-red-500/20 text-red-400"
            }`}>
              <Gauge className="w-3 h-3" />
              {rocket.success_rate_pct}%
            </span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <p className="text-xs text-spacex-text/50 leading-relaxed line-clamp-2 mb-4">
          {rocket.description}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 mb-4 text-center">
          <div className="rounded bg-spacex-dark/40 border border-spacex-border/10 py-2 px-1">
            <p className="text-sm font-bold text-white font-mono">{rocket.height.meters}m</p>
            <p className="text-[8px] font-mono text-spacex-muted mt-0.5">HEIGHT</p>
          </div>
          <div className="rounded bg-spacex-dark/40 border border-spacex-border/10 py-2 px-1">
            <p className="text-sm font-bold text-white font-mono">{(rocket.mass.kg / 1000).toFixed(0)}t</p>
            <p className="text-[8px] font-mono text-spacex-muted mt-0.5">MASS</p>
          </div>
          <div className="rounded bg-spacex-dark/40 border border-spacex-border/10 py-2 px-1">
            <p className="text-sm font-bold text-white font-mono">{rocket.engines.number} {rocket.engines.type}</p>
            <p className="text-[8px] font-mono text-spacex-muted mt-0.5">ENGINES</p>
          </div>
          <div className="rounded bg-spacex-dark/40 border border-spacex-border/10 py-2 px-1">
            <p className="text-sm font-bold text-white font-mono">{(maxPayload / 1000).toFixed(0)}t</p>
            <p className="text-[8px] font-mono text-spacex-muted mt-0.5">TO LEO</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between pt-3 border-t border-spacex-border/10">
          <span className="text-[10px] font-mono text-spacex-muted">
            {formatCost(rocket.cost_per_launch)}/launch
          </span>
          <span className="flex items-center gap-1 text-[10px] font-mono text-spacex-muted group-hover:text-spacex-accent transition-colors">
            DETAILS <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Spacecraft card (dragons) ─────────────────────────────── */

function SpacecraftCard({ dragon, index }: { dragon: DragonType; index: number }) {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass-panel hud-corners overflow-hidden cursor-pointer group hover:border-spacex-accent/30 transition-colors flex flex-col"
      onClick={() => router.push(`/vehicles/${dragon.id}`)}
    >
      <div className="h-1 bg-gradient-to-r from-orange-500 to-amber-600" />

      {/* Image */}
      {dragon.flickr_images?.[0] && (
        <div className="relative h-48 overflow-hidden">
          <Image
            src={dragon.flickr_images[0]}
            alt={dragon.name}
            fill
            sizes="(max-width: 640px) 100vw, 50vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-spacex-dark via-spacex-dark/20 to-transparent" />

          {/* Badges */}
          <div className="absolute top-3 right-3 flex gap-1.5">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono bg-spacex-success/20 text-spacex-success border border-spacex-success/30 backdrop-blur-sm">
              <CheckCircle2 className="w-2.5 h-2.5" /> ACTIVE
            </span>
            {dragon.crew_capacity > 0 && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono bg-blue-500/20 text-blue-400 border border-blue-500/30 backdrop-blur-sm">
                <Users className="w-2.5 h-2.5" /> CREW RATED
              </span>
            )}
          </div>

          {/* Name */}
          <div className="absolute bottom-3 left-4">
            <h3 className="font-display text-xl font-bold text-white drop-shadow-lg group-hover:text-spacex-accent transition-colors">
              {dragon.name}
            </h3>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <p className="text-xs text-spacex-text/50 leading-relaxed line-clamp-2 mb-4">
          {dragon.description}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 mb-4 text-center">
          <div className="rounded bg-spacex-dark/40 border border-spacex-border/10 py-2 px-1">
            <p className="text-sm font-bold text-white font-mono">{dragon.crew_capacity}</p>
            <p className="text-[8px] font-mono text-spacex-muted mt-0.5">CREW</p>
          </div>
          <div className="rounded bg-spacex-dark/40 border border-spacex-border/10 py-2 px-1">
            <p className="text-sm font-bold text-white font-mono">{(dragon.dry_mass_kg / 1000).toFixed(1)}t</p>
            <p className="text-[8px] font-mono text-spacex-muted mt-0.5">MASS</p>
          </div>
          <div className="rounded bg-spacex-dark/40 border border-spacex-border/10 py-2 px-1">
            <p className="text-sm font-bold text-white font-mono">{dragon.heat_shield.temp_degrees}°</p>
            <p className="text-[8px] font-mono text-spacex-muted mt-0.5">HEAT SHIELD</p>
          </div>
          <div className="rounded bg-spacex-dark/40 border border-spacex-border/10 py-2 px-1">
            <p className="text-sm font-bold text-white font-mono">{dragon.thrusters.reduce((s, t) => s + t.amount, 0)}</p>
            <p className="text-[8px] font-mono text-spacex-muted mt-0.5">THRUSTERS</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between pt-3 border-t border-spacex-border/10">
          <span className="text-[10px] font-mono text-spacex-muted">
            First flight: {new Date(dragon.first_flight).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
          </span>
          <span className="flex items-center gap-1 text-[10px] font-mono text-spacex-muted group-hover:text-spacex-accent transition-colors">
            DETAILS <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Page ──────────────────────────────────────────────────── */

export default function VehiclesPage() {
  const allRockets = [...rockets].sort(
    (a, b) => rocketOrder.indexOf(a.name) - rocketOrder.indexOf(b.name)
  );

  const totalEngines = rockets.reduce((s, r) => s + r.engines.number, 0);
  const activeCount = rockets.filter((r) => r.active).length + dragons.length;
  const maxPayload = Math.max(
    ...rockets.flatMap((r) => r.payload_weights.map((p) => p.kg))
  );
  const avgSuccess = Math.round(
    rockets.filter((r) => r.success_rate_pct > 0).reduce((s, r) => s + r.success_rate_pct, 0) /
      rockets.filter((r) => r.success_rate_pct > 0).length
  );

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-[1400px] mx-auto">
      {/* Header + inline stats */}
      <div>
        <h1 className="font-display text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5 mb-1">
          <Rocket className="w-6 h-6 text-spacex-accent" />
          VEHICLE FLEET
        </h1>
        <p className="text-sm text-spacex-muted mb-5">
          Launch vehicles and spacecraft in the SpaceX fleet
        </p>

        {/* Stats strip */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-mono">
          <span className="flex items-center gap-1.5 text-spacex-text/70">
            <Rocket className="w-4 h-4 text-spacex-accent" />
            <strong className="text-white">{rockets.length + dragons.length}</strong>
            <span className="text-spacex-muted">vehicles</span>
            <span className="text-spacex-text/30">({activeCount} active)</span>
          </span>
          <span className="flex items-center gap-1.5 text-spacex-text/70">
            <Flame className="w-4 h-4 text-orange-400" />
            <strong className="text-white">{totalEngines}</strong>
            <span className="text-spacex-muted">engines</span>
          </span>
          <span className="flex items-center gap-1.5 text-spacex-text/70">
            <Target className="w-4 h-4 text-cyan-400" />
            <strong className="text-white">{(maxPayload / 1000).toFixed(0)}t</strong>
            <span className="text-spacex-muted">max payload</span>
          </span>
          <span className="flex items-center gap-1.5 text-spacex-text/70">
            <Gauge className="w-4 h-4 text-spacex-success" />
            <strong className="text-white">{avgSuccess}%</strong>
            <span className="text-spacex-muted">avg success</span>
          </span>
        </div>
      </div>

      {/* Launch Vehicles */}
      <div>
        <h2 className="text-xs font-mono font-bold text-spacex-accent tracking-wider mb-4 flex items-center gap-2">
          <Rocket className="w-3.5 h-3.5" /> LAUNCH VEHICLES
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {allRockets.map((r, i) => (
            <VehicleCard key={r.id} rocket={r} index={i} />
          ))}
        </div>
      </div>

      {/* Spacecraft */}
      <div>
        <h2 className="text-xs font-mono font-bold text-orange-400 tracking-wider mb-4 flex items-center gap-2">
          <Shield className="w-3.5 h-3.5" /> SPACECRAFT
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {dragons.map((d, i) => (
            <SpacecraftCard key={d.id} dragon={d} index={i} />
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-[9px] font-mono text-white/15 text-center mt-8 pb-2">
        All data sourced from public APIs and publicly available sources. Not affiliated with SpaceX or any other agency.
      </p>
    </div>
  );
}
