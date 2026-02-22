"use client";

import { useState } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Rocket,
  Flame,
  Ruler,
  Weight,
  DollarSign,
  Calendar,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Zap,
  Target,
  X,
  Users,
  Layers,
  Gauge,
  Thermometer,
  Shield,
} from "lucide-react";
import rocketsData from "../../../../public/data/rockets.json";
import dragonsData from "../../../../public/data/dragons.json";

/* ── types ─────────────────────────────────────────────────── */

interface RocketData {
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
  wikipedia: string;
  height: { meters: number; feet: number };
  diameter: { meters: number; feet: number };
  mass: { kg: number; lb: number };
  engines: {
    type: string;
    version: string;
    number: number;
    layout: string;
    propellant_1: string;
    propellant_2: string;
    thrust_sea_level: { kN: number; lbf: number };
    thrust_vacuum: { kN: number; lbf: number };
    isp: { sea_level: number; vacuum: number };
    engine_loss_max: number;
    thrust_to_weight: number;
  };
  payload_weights: Array<{ id: string; name: string; kg: number; lb: number }>;
  flickr_images: string[];
  first_stage: {
    reusable: boolean;
    engines: number;
    fuel_amount_tons: number;
    burn_time_sec: number;
    thrust_sea_level: { kN: number; lbf: number };
    thrust_vacuum: { kN: number; lbf: number };
  };
  second_stage: {
    reusable: boolean;
    engines: number;
    fuel_amount_tons: number;
    burn_time_sec: number;
    thrust: { kN: number; lbf: number };
    payloads: {
      composite_fairing: {
        height: { meters: number; feet: number };
        diameter: { meters: number; feet: number };
      };
    };
  };
  landing_legs: { number: number; material: string | null };
}

interface DragonData {
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
  wikipedia: string;
  flickr_images: string[];
  sidewall_angle_deg: number;
  heat_shield: { material: string; size_meters: number; temp_degrees: number; dev_partner: string };
  launch_payload_mass: { kg: number; lb: number };
  launch_payload_vol: { cubic_meters: number; cubic_feet: number };
  return_payload_mass: { kg: number; lb: number };
  return_payload_vol: { cubic_meters: number; cubic_feet: number };
  pressurized_capsule: { payload_volume: { cubic_meters: number; cubic_feet: number } };
  trunk: { trunk_volume: { cubic_meters: number; cubic_feet: number }; cargo: { solar_array: number; unpressurized_cargo: boolean } };
  height_w_trunk: { meters: number; feet: number };
  diameter: { meters: number; feet: number };
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

const rockets = rocketsData as unknown as RocketData[];
const dragons = dragonsData as unknown as DragonData[];

function formatCost(cost: number): string {
  if (cost >= 1e9) return `$${(cost / 1e9).toFixed(1)}B`;
  if (cost >= 1e6) return `$${(cost / 1e6).toFixed(0)}M`;
  return `$${cost.toLocaleString()}`;
}

/* ── Stat card helper ──────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, color = "text-spacex-accent" }: {
  icon: typeof Rocket;
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="rounded-lg bg-spacex-dark/40 border border-spacex-border/15 p-3 text-center">
      <Icon className={`w-4 h-4 ${color} mx-auto mb-1`} />
      <p className="text-lg font-bold text-white font-mono">{value}</p>
      <p className="text-[10px] font-mono text-spacex-muted">{label}</p>
    </div>
  );
}

/* ── Gallery section ───────────────────────────────────────── */
function Gallery({ images, name }: { images: string[]; name: string }) {
  const [lightbox, setLightbox] = useState<string | null>(null);

  if (!images || images.length === 0) return null;

  return (
    <>
      <div className="glass-panel hud-corners overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-amber-500/60 to-slate-600/60" />
        <div className="p-5">
          <h2 className="font-display text-sm font-bold text-white mb-3">GALLERY</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setLightbox(img)}
                className="rounded-xl overflow-hidden border border-spacex-border/15 h-36 cursor-zoom-in hover:border-spacex-accent/30 transition-colors group relative"
              >
                <Image
                  src={img}
                  alt={`${name} ${idx + 1}`}
                  fill
                  sizes="33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setLightbox(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative max-w-4xl w-full"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <button
                onClick={() => setLightbox(null)}
                className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-spacex-dark border border-spacex-border/40 flex items-center justify-center text-spacex-muted hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="rounded-2xl overflow-hidden border-2 border-spacex-border/30 bg-spacex-dark shadow-2xl">
                <Image src={lightbox} alt={name} width={1200} height={800} sizes="(max-width: 768px) 100vw, 768px" className="w-full h-auto" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ── Rocket detail ─────────────────────────────────────────── */
function RocketDetail({ rocket }: { rocket: RocketData }) {
  const maxPayload = rocket.payload_weights.reduce((max, p) => Math.max(max, p.kg), 0);
  const totalThrust = rocket.first_stage.thrust_sea_level.kN * rocket.first_stage.engines;

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="glass-panel hud-corners overflow-hidden">
        <div className={`h-1.5 ${rocket.active ? "bg-gradient-to-r from-spacex-accent to-amber-600" : "bg-gradient-to-r from-gray-600 to-gray-700"}`} />
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="font-display text-2xl font-bold text-white">{rocket.name}</h1>
                {rocket.active ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono bg-spacex-success/10 text-spacex-success border border-spacex-success/20">
                    <CheckCircle2 className="w-3 h-3" /> ACTIVE
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono bg-spacex-muted/10 text-spacex-muted border border-spacex-border/20">
                    <XCircle className="w-3 h-3" /> RETIRED
                  </span>
                )}
              </div>
              <p className="text-xs text-spacex-muted font-mono">
                First flight: {new Date(rocket.first_flight).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                {" · "}{rocket.country} · {rocket.company}
              </p>
            </div>
            <a
              href={rocket.wikipedia}
              target="_blank"
              rel="noopener noreferrer"
              className="text-spacex-muted hover:text-spacex-accent transition-colors flex items-center gap-1 text-xs font-mono"
            >
              <ExternalLink className="w-4 h-4" /> Wikipedia
            </a>
          </div>

          {/* Hero image */}
          {rocket.flickr_images?.[0] && (
            <div className="relative rounded-xl overflow-hidden border border-spacex-border/20 h-56 sm:h-72 mb-4">
              <Image
                src={rocket.flickr_images[0]}
                alt={rocket.name}
                fill
                sizes="100vw"
                className="object-cover"
              />
            </div>
          )}

          <p className="text-sm text-spacex-text/70 leading-relaxed">{rocket.description}</p>
        </div>
      </div>

      {/* Key specs */}
      <div className="glass-panel hud-corners overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-spacex-accent/60 to-slate-600/60" />
        <div className="p-5">
          <h2 className="font-display text-sm font-bold text-white mb-3">KEY SPECIFICATIONS</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            <StatCard icon={Ruler} label="HEIGHT" value={`${rocket.height.meters}m`} />
            <StatCard icon={Ruler} label="DIAMETER" value={`${rocket.diameter.meters}m`} />
            <StatCard icon={Weight} label="MASS" value={`${(rocket.mass.kg / 1000).toFixed(0)}t`} />
            <StatCard icon={Target} label="PAYLOAD LEO" value={`${(maxPayload / 1000).toFixed(1)}t`} />
            <StatCard icon={DollarSign} label="PER LAUNCH" value={formatCost(rocket.cost_per_launch)} color="text-green-400" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
            <StatCard icon={Layers} label="STAGES" value={rocket.stages.toString()} />
            <StatCard icon={Rocket} label="BOOSTERS" value={rocket.boosters.toString()} />
            <StatCard icon={Gauge} label="SUCCESS RATE" value={`${rocket.success_rate_pct}%`} color={rocket.success_rate_pct >= 90 ? "text-spacex-success" : rocket.success_rate_pct >= 50 ? "text-yellow-400" : "text-red-400"} />
            <StatCard icon={Zap} label="TOTAL THRUST" value={`${totalThrust} kN`} color="text-orange-400" />
          </div>
        </div>
      </div>

      {/* Success rate bar */}
      <div className="glass-panel hud-corners p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-spacex-muted font-mono">MISSION SUCCESS RATE</span>
          <span className="text-sm text-white font-mono font-bold">{rocket.success_rate_pct}%</span>
        </div>
        <div className="h-3 rounded-full bg-spacex-dark/50 border border-spacex-border/15 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${rocket.success_rate_pct}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
            className={`h-full rounded-full ${
              rocket.success_rate_pct >= 90 ? "bg-gradient-to-r from-spacex-success/80 to-spacex-success" :
              rocket.success_rate_pct >= 50 ? "bg-gradient-to-r from-yellow-600 to-yellow-400" :
              "bg-gradient-to-r from-red-700 to-red-500"
            }`}
          />
        </div>
      </div>

      {/* Engines */}
      <div className="glass-panel hud-corners overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-orange-500/60 to-red-500/60" />
        <div className="p-5">
          <h2 className="font-display text-sm font-bold text-white flex items-center gap-2 mb-3">
            <Flame className="w-4 h-4 text-orange-400" /> ENGINE SPECIFICATIONS
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            <div className="rounded-lg bg-spacex-dark/30 border border-spacex-border/30 p-3">
              <p className="text-[10px] text-spacex-muted font-mono mb-0.5">TYPE</p>
              <p className="text-sm text-white font-mono capitalize">{rocket.engines.type} {rocket.engines.version}</p>
            </div>
            <div className="rounded-lg bg-spacex-dark/30 border border-spacex-border/30 p-3">
              <p className="text-[10px] text-spacex-muted font-mono mb-0.5">LAYOUT</p>
              <p className="text-sm text-white font-mono capitalize">{rocket.engines.layout}</p>
            </div>
            <div className="rounded-lg bg-spacex-dark/30 border border-spacex-border/30 p-3">
              <p className="text-[10px] text-spacex-muted font-mono mb-0.5">COUNT</p>
              <p className="text-sm text-white font-mono">{rocket.engines.number}</p>
            </div>
            <div className="rounded-lg bg-spacex-dark/30 border border-spacex-border/30 p-3">
              <p className="text-[10px] text-spacex-muted font-mono mb-0.5">THRUST/WEIGHT</p>
              <p className="text-sm text-white font-mono">{rocket.engines.thrust_to_weight}</p>
            </div>
            <div className="rounded-lg bg-spacex-dark/30 border border-spacex-border/30 p-3">
              <p className="text-[10px] text-spacex-muted font-mono mb-0.5">THRUST (SL)</p>
              <p className="text-sm text-white font-mono">{rocket.engines.thrust_sea_level.kN} kN</p>
            </div>
            <div className="rounded-lg bg-spacex-dark/30 border border-spacex-border/30 p-3">
              <p className="text-[10px] text-spacex-muted font-mono mb-0.5">THRUST (VAC)</p>
              <p className="text-sm text-white font-mono">{rocket.engines.thrust_vacuum.kN} kN</p>
            </div>
            <div className="rounded-lg bg-spacex-dark/30 border border-spacex-border/30 p-3">
              <p className="text-[10px] text-spacex-muted font-mono mb-0.5">ISP (SL / VAC)</p>
              <p className="text-sm text-white font-mono">{rocket.engines.isp.sea_level}s / {rocket.engines.isp.vacuum}s</p>
            </div>
            <div className="rounded-lg bg-spacex-dark/30 border border-spacex-border/30 p-3">
              <p className="text-[10px] text-spacex-muted font-mono mb-0.5">ENGINE LOSS MAX</p>
              <p className="text-sm text-white font-mono">{rocket.engines.engine_loss_max}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20">
              <Flame className="w-3 h-3" /> {rocket.engines.propellant_1}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-orange-500/10 text-orange-300 border border-orange-500/20">
              <Flame className="w-3 h-3" /> {rocket.engines.propellant_2}
            </span>
          </div>
        </div>
      </div>

      {/* Stages */}
      <div className="glass-panel hud-corners overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-amber-500/60 to-slate-600/60" />
        <div className="p-5">
          <h2 className="font-display text-sm font-bold text-white flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-amber-400" /> STAGE DETAILS
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* First stage */}
            <div className="rounded-xl bg-spacex-dark/30 border border-spacex-border/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-spacex-accent/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-spacex-accent font-mono">S1</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-white">First Stage</p>
                  <p className={`text-[10px] font-mono ${rocket.first_stage.reusable ? "text-spacex-success" : "text-spacex-muted"}`}>
                    {rocket.first_stage.reusable ? "REUSABLE" : "EXPENDABLE"}
                  </p>
                </div>
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between"><span className="text-spacex-muted">Engines</span><span className="text-white">{rocket.first_stage.engines}</span></div>
                <div className="flex justify-between"><span className="text-spacex-muted">Fuel</span><span className="text-white">{rocket.first_stage.fuel_amount_tons} tons</span></div>
                <div className="flex justify-between"><span className="text-spacex-muted">Burn time</span><span className="text-white">{rocket.first_stage.burn_time_sec}s</span></div>
                <div className="flex justify-between"><span className="text-spacex-muted">Thrust (SL)</span><span className="text-white">{rocket.first_stage.thrust_sea_level.kN} kN</span></div>
                <div className="flex justify-between"><span className="text-spacex-muted">Thrust (VAC)</span><span className="text-white">{rocket.first_stage.thrust_vacuum.kN} kN</span></div>
              </div>
            </div>

            {/* Second stage */}
            <div className="rounded-xl bg-spacex-dark/30 border border-spacex-border/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-amber-400 font-mono">S2</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Second Stage</p>
                  <p className={`text-[10px] font-mono ${rocket.second_stage.reusable ? "text-spacex-success" : "text-spacex-muted"}`}>
                    {rocket.second_stage.reusable ? "REUSABLE" : "EXPENDABLE"}
                  </p>
                </div>
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between"><span className="text-spacex-muted">Engines</span><span className="text-white">{rocket.second_stage.engines}</span></div>
                <div className="flex justify-between"><span className="text-spacex-muted">Fuel</span><span className="text-white">{rocket.second_stage.fuel_amount_tons} tons</span></div>
                <div className="flex justify-between"><span className="text-spacex-muted">Burn time</span><span className="text-white">{rocket.second_stage.burn_time_sec}s</span></div>
                <div className="flex justify-between"><span className="text-spacex-muted">Thrust</span><span className="text-white">{rocket.second_stage.thrust.kN} kN</span></div>
              </div>
              {rocket.second_stage.payloads?.composite_fairing && (
                <div className="mt-3 pt-3 border-t border-spacex-border/30">
                  <p className="text-[10px] text-spacex-muted font-mono mb-1">FAIRING</p>
                  <p className="text-xs text-white font-mono">
                    {rocket.second_stage.payloads.composite_fairing.height.meters}m × {rocket.second_stage.payloads.composite_fairing.diameter.meters}m
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payload capacity */}
      {rocket.payload_weights.length > 0 && (
        <div className="glass-panel hud-corners overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-spacex-accent/60 to-emerald-500/60" />
          <div className="p-5">
            <h2 className="font-display text-sm font-bold text-white flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-spacex-accent" /> PAYLOAD CAPACITY
            </h2>
            <div className="space-y-3">
              {rocket.payload_weights.map((pw) => (
                <div key={pw.id} className="flex items-center gap-4">
                  <div className="w-32 text-xs font-mono text-spacex-muted">{pw.name}</div>
                  <div className="flex-1">
                    <div className="h-5 rounded-full bg-spacex-dark/50 border border-spacex-border/15 overflow-hidden relative">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((pw.kg / (maxPayload || 1)) * 100, 100)}%` }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
                        className="h-full rounded-full bg-gradient-to-r from-spacex-accent/70 to-spacex-accent"
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-white font-bold">
                        {(pw.kg / 1000).toFixed(1)}t ({pw.lb.toLocaleString()} lb)
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Landing legs */}
      {rocket.landing_legs.number > 0 && (
        <div className="glass-panel hud-corners p-5">
          <h2 className="font-display text-sm font-bold text-white flex items-center gap-2 mb-2">
            <Rocket className="w-4 h-4 text-spacex-accent" /> LANDING LEGS
          </h2>
          <div className="flex gap-4 text-xs font-mono">
            <span className="text-spacex-muted">Count: <span className="text-white font-bold">{rocket.landing_legs.number}</span></span>
            {rocket.landing_legs.material && (
              <span className="text-spacex-muted">Material: <span className="text-white font-bold capitalize">{rocket.landing_legs.material}</span></span>
            )}
          </div>
        </div>
      )}

      {/* Gallery */}
      <Gallery images={rocket.flickr_images} name={rocket.name} />
    </div>
  );
}

/* ── Dragon detail ─────────────────────────────────────────── */
function DragonDetail({ dragon }: { dragon: DragonData }) {
  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="glass-panel hud-corners overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-orange-500 to-amber-600" />
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="font-display text-2xl font-bold text-white">{dragon.name}</h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono bg-spacex-success/10 text-spacex-success border border-spacex-success/20">
                  <CheckCircle2 className="w-3 h-3" /> ACTIVE
                </span>
              </div>
              <p className="text-xs text-spacex-muted font-mono">
                Spacecraft · First flight: {new Date(dragon.first_flight).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
            <a
              href={dragon.wikipedia}
              target="_blank"
              rel="noopener noreferrer"
              className="text-spacex-muted hover:text-spacex-accent transition-colors flex items-center gap-1 text-xs font-mono"
            >
              <ExternalLink className="w-4 h-4" /> Wikipedia
            </a>
          </div>

          {/* Hero image */}
          {dragon.flickr_images?.[0] && (
            <div className="relative rounded-xl overflow-hidden border border-spacex-border/20 h-56 sm:h-72 mb-4">
              <Image
                src={dragon.flickr_images[0]}
                alt={dragon.name}
                fill
                sizes="100vw"
                className="object-cover"
              />
            </div>
          )}

          <p className="text-sm text-spacex-text/70 leading-relaxed">{dragon.description}</p>
        </div>
      </div>

      {/* Key specs */}
      <div className="glass-panel hud-corners overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-orange-500/60 to-amber-500/60" />
        <div className="p-5">
          <h2 className="font-display text-sm font-bold text-white mb-3">KEY SPECIFICATIONS</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            <StatCard icon={Users} label="CREW CAP." value={dragon.crew_capacity.toString()} />
            <StatCard icon={Weight} label="DRY MASS" value={`${(dragon.dry_mass_kg / 1000).toFixed(1)}t`} />
            <StatCard icon={Ruler} label="HEIGHT" value={`${dragon.height_w_trunk.meters}m`} />
            <StatCard icon={Ruler} label="DIAMETER" value={`${dragon.diameter.meters}m`} />
            <StatCard icon={Calendar} label="ORBIT DUR." value={`${dragon.orbit_duration_yr} yr`} />
            <StatCard icon={Thermometer} label="SIDEWALL" value={`${dragon.sidewall_angle_deg}°`} />
          </div>
        </div>
      </div>

      {/* Heat shield */}
      <div className="glass-panel hud-corners overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-red-500/60 to-orange-500/60" />
        <div className="p-5">
          <h2 className="font-display text-sm font-bold text-white flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-red-400" /> HEAT SHIELD
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg bg-spacex-dark/30 border border-spacex-border/30 p-3">
              <p className="text-[10px] text-spacex-muted font-mono mb-0.5">MATERIAL</p>
              <p className="text-sm text-white font-mono">{dragon.heat_shield.material}</p>
            </div>
            <div className="rounded-lg bg-spacex-dark/30 border border-spacex-border/30 p-3">
              <p className="text-[10px] text-spacex-muted font-mono mb-0.5">SIZE</p>
              <p className="text-sm text-white font-mono">{dragon.heat_shield.size_meters}m</p>
            </div>
            <div className="rounded-lg bg-spacex-dark/30 border border-spacex-border/30 p-3">
              <p className="text-[10px] text-spacex-muted font-mono mb-0.5">MAX TEMP</p>
              <p className="text-sm text-white font-mono">{dragon.heat_shield.temp_degrees}°C</p>
            </div>
            <div className="rounded-lg bg-spacex-dark/30 border border-spacex-border/30 p-3">
              <p className="text-[10px] text-spacex-muted font-mono mb-0.5">DEV PARTNER</p>
              <p className="text-sm text-white font-mono">{dragon.heat_shield.dev_partner}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payload */}
      <div className="glass-panel hud-corners overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-spacex-accent/60 to-emerald-500/60" />
        <div className="p-5">
          <h2 className="font-display text-sm font-bold text-white flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-spacex-accent" /> PAYLOAD CAPACITY
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Launch payload */}
            <div className="rounded-xl bg-spacex-dark/30 border border-spacex-border/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Rocket className="w-4 h-4 text-green-400" />
                </div>
                <p className="text-sm font-bold text-white">Launch (Up)</p>
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between"><span className="text-spacex-muted">Mass</span><span className="text-white">{dragon.launch_payload_mass.kg.toLocaleString()} kg</span></div>
                <div className="flex justify-between"><span className="text-spacex-muted">Volume</span><span className="text-white">{dragon.launch_payload_vol.cubic_meters} m³</span></div>
              </div>
            </div>
            {/* Return payload */}
            <div className="rounded-xl bg-spacex-dark/30 border border-spacex-border/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Rocket className="w-4 h-4 text-amber-400 rotate-180" />
                </div>
                <p className="text-sm font-bold text-white">Return (Down)</p>
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between"><span className="text-spacex-muted">Mass</span><span className="text-white">{dragon.return_payload_mass.kg.toLocaleString()} kg</span></div>
                <div className="flex justify-between"><span className="text-spacex-muted">Volume</span><span className="text-white">{dragon.return_payload_vol.cubic_meters} m³</span></div>
              </div>
            </div>
          </div>

          {/* Trunk / capsule */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div className="rounded-xl bg-spacex-dark/30 border border-spacex-border/30 p-4">
              <p className="text-[10px] text-spacex-muted font-mono mb-2">PRESSURIZED CAPSULE</p>
              <p className="text-sm text-white font-mono">{dragon.pressurized_capsule.payload_volume.cubic_meters} m³</p>
            </div>
            <div className="rounded-xl bg-spacex-dark/30 border border-spacex-border/30 p-4">
              <p className="text-[10px] text-spacex-muted font-mono mb-2">TRUNK VOLUME</p>
              <p className="text-sm text-white font-mono">{dragon.trunk.trunk_volume.cubic_meters} m³</p>
              <p className="text-[10px] text-spacex-muted mt-1">
                Solar arrays: {dragon.trunk.cargo.solar_array} · Unpressurized cargo: {dragon.trunk.cargo.unpressurized_cargo ? "Yes" : "No"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Thrusters */}
      {dragon.thrusters && dragon.thrusters.length > 0 && (
        <div className="glass-panel hud-corners overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-orange-500/60 to-red-500/60" />
          <div className="p-5">
            <h2 className="font-display text-sm font-bold text-white flex items-center gap-2 mb-3">
              <Flame className="w-4 h-4 text-orange-400" /> THRUSTER SYSTEMS
            </h2>
            <div className="space-y-3">
              {dragon.thrusters.map((t, idx) => (
                <div key={idx} className="rounded-xl bg-spacex-dark/30 border border-spacex-border/30 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                      <Flame className="w-4 h-4 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{t.type}</p>
                      <p className="text-[10px] text-spacex-muted font-mono">{t.amount} thrusters · {t.pods} pods</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                    <div><span className="text-spacex-muted">Thrust</span><br /><span className="text-white">{t.thrust.kN} kN</span></div>
                    <div><span className="text-spacex-muted">ISP</span><br /><span className="text-white">{t.isp}s</span></div>
                    <div><span className="text-spacex-muted">Fuel 1</span><br /><span className="text-white text-[11px]">{t.fuel_1}</span></div>
                    <div><span className="text-spacex-muted">Fuel 2</span><br /><span className="text-white text-[11px]">{t.fuel_2}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Gallery */}
      <Gallery images={dragon.flickr_images} name={dragon.name} />
    </div>
  );
}

/* ── Page component ────────────────────────────────────────── */
export default function VehicleDetailPage({ params }: { params: { id: string } }) {
  const rocket = rockets.find((r) => r.id === params.id);
  const dragon = dragons.find((d) => d.id === params.id);
  const vehicle = rocket || dragon;

  if (!vehicle) notFound();

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto">
      {/* Back nav */}
      <Link
        href="/vehicles"
        className="inline-flex items-center gap-2 text-xs font-mono text-spacex-muted hover:text-spacex-accent transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        BACK TO VEHICLE FLEET
      </Link>

      {rocket ? <RocketDetail rocket={rocket} /> : <DragonDetail dragon={dragon!} />}

      {/* Disclaimer */}
      <p className="text-[9px] font-mono text-white/15 text-center mt-8 pb-2">
        All data sourced from public APIs and publicly available sources. Not affiliated with SpaceX or any other agency.
      </p>
    </div>
  );
}
