"use client";

import { useMemo, useState } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Rocket,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  MapPin,
  Globe,
  Activity,
  Flame,
  Target,
  X,
  BarChart3,
  Info,
} from "lucide-react";
import dashboardData from "../../../../public/data/ll2-starship-dashboard.json";

/* ── types ─────────────────────────────────────────────────── */

interface StarshipFlight {
  id: string;
  name: string;
  slug: string;
  status: { id: number; name: string; abbrev?: string; description?: string };
  net?: string;
  window_start?: string;
  window_end?: string;
  failreason?: string | null;
  probability?: number | null;
  weather_concerns?: string | null;
  webcast_live?: boolean;
  image?: { image_url?: string; thumbnail_url?: string; credit?: string };
  mission?: {
    name?: string;
    type?: string;
    description?: string;
    orbit?: { name?: string; abbrev?: string };
  };
  pad?: {
    name?: string;
    location?: { name?: string; country_code?: string };
  };
  rocket?: {
    configuration?: {
      name?: string;
      full_name?: string;
      variant?: string;
    };
  };
  program?: Array<{
    name?: string;
    description?: string;
    image?: { image_url?: string };
  }>;
  launch_service_provider?: {
    name?: string;
    type?: { name?: string };
  };
  orbital_launch_attempt_count?: number;
  pad_launch_attempt_count?: number;
  agency_launch_attempt_count?: number;
}

interface StarshipVehicle {
  id: number;
  serial_number: string;
  status: { id: number; name: string };
  details?: string;
  image?: { image_url?: string; thumbnail_url?: string };
  flight_proven: boolean;
  flights?: number;
  launcher_config?: { name?: string; full_name?: string };
}

interface StarshipUpdate {
  id: number;
  comment: string;
  info_url?: string;
  created_by: string;
  created_on: string;
}

const dashboard = dashboardData as unknown as {
  updates: StarshipUpdate[];
  vehicles: StarshipVehicle[];
  upcoming: { launches: StarshipFlight[] };
  previous: { launches: StarshipFlight[] };
};

const allFlights = [
  ...(dashboard.previous?.launches || []),
  ...(dashboard.upcoming?.launches || []),
];

const statusConfig: Record<string, { icon: typeof CheckCircle2; color: string; bg: string; border: string }> = {
  "Launch Successful": { icon: CheckCircle2, color: "text-spacex-success", bg: "bg-spacex-success/10", border: "border-spacex-success/20" },
  "Launch Failure": { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
  "Partial Failure": { icon: AlertTriangle, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
  "To Be Determined": { icon: Clock, color: "text-emerald-300", bg: "bg-white/10", border: "border-white/20" },
  "To Be Confirmed": { icon: Clock, color: "text-spacex-muted", bg: "bg-spacex-border/10", border: "border-spacex-border/20" },
};
const defaultStatus = { icon: Clock, color: "text-spacex-muted", bg: "bg-spacex-border/10", border: "border-spacex-border/20" };

/* ── Page component ────────────────────────────────────────── */
export default function StarshipFlightDetailPage({ params }: { params: { id: string } }) {
  const flight = allFlights.find((f) => f.id === params.id);
  const [lightbox, setLightbox] = useState<string | null>(null);

  if (!flight) notFound();

  const sc = statusConfig[flight.status?.name] || defaultStatus;
  const StatusIcon = sc.icon;
  const launchDate = flight.net ? new Date(flight.net) : null;
  const isPrevious = dashboard.previous?.launches?.some((f) => f.id === params.id);
  const isUpcoming = !isPrevious;

  // Find related flights (prev/next)
  const sortedFlights = [...allFlights].sort((a, b) => {
    const da = a.net ? new Date(a.net).getTime() : Infinity;
    const db = b.net ? new Date(b.net).getTime() : Infinity;
    return da - db;
  });
  const currentIdx = sortedFlights.findIndex((f) => f.id === params.id);
  const prevFlight = currentIdx > 0 ? sortedFlights[currentIdx - 1] : null;
  const nextFlight = currentIdx < sortedFlights.length - 1 ? sortedFlights[currentIdx + 1] : null;

  // Find related vehicles (match flight number from name)
  const flightNum = flight.name.match(/Flight\s+(\d+)/)?.[1];
  const relatedVehicles = useMemo(() => {
    if (!flightNum) return [];
    const vehicles = dashboard.vehicles || [];
    return vehicles.filter((v) =>
      v.details?.toLowerCase().includes(`flight ${flightNum}`) ||
      v.serial_number.includes(flightNum)
    );
  }, [flightNum]);

  // Related updates 
  const relatedUpdates = useMemo(() => {
    if (!flightNum) return [];
    return (dashboard.updates || []).filter((u) =>
      u.comment.toLowerCase().includes(`flight ${flightNum}`) ||
      u.comment.toLowerCase().includes(flight.name.toLowerCase())
    ).slice(0, 5);
  }, [flightNum, flight.name]);

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto">
      {/* Back nav */}
      <Link
        href="/starship"
        className="inline-flex items-center gap-2 text-xs font-mono text-spacex-muted hover:text-spacex-accent transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        BACK TO STARSHIP TRACKER
      </Link>

      <div className="space-y-5">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel hud-corners overflow-hidden"
        >
          <div className={`h-1.5 ${
            flight.status?.name === "Launch Successful" ? "bg-gradient-to-r from-spacex-success to-green-600" :
            flight.status?.name === "Launch Failure" ? "bg-gradient-to-r from-red-500 to-red-700" :
            "bg-gradient-to-r from-white to-gray-400"
          }`} />
          <div className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="font-display text-2xl font-bold text-white">{flight.name}</h1>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono ${sc.bg} ${sc.color} border ${sc.border}`}>
                    <StatusIcon className="w-3 h-3" />
                    {flight.status?.abbrev || flight.status?.name}
                  </span>
                  {isUpcoming && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-spacex-accent/15 text-spacex-accent border border-spacex-accent/20">
                      UPCOMING
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-spacex-muted font-mono mt-1">
                  {launchDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {launchDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                      {!isUpcoming && ` at ${launchDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZoneName: "short" })}`}
                    </span>
                  )}
                  {flight.pad?.name && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {flight.pad.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Hero image */}
            {flight.image?.image_url && (
              <button
                onClick={() => setLightbox(flight.image!.image_url!)}
                className="w-full relative rounded-xl overflow-hidden border border-spacex-border/20 h-56 sm:h-72 mb-4 cursor-zoom-in"
              >
                <Image
                  src={flight.image.image_url}
                  alt={flight.name}
                  fill
                  sizes="100vw"
                  className="object-cover hover:scale-105 transition-transform duration-500"
                />
              </button>
            )}

            {/* Mission description */}
            {flight.mission?.description && (
              <p className="text-sm text-spacex-text/70 leading-relaxed">{flight.mission.description}</p>
            )}

            {/* Fail reason */}
            {flight.failreason && (
              <div className="mt-4 rounded-xl bg-red-500/5 border border-red-500/20 p-4">
                <h3 className="text-xs font-mono font-bold text-red-400 flex items-center gap-2 mb-1">
                  <XCircle className="w-3.5 h-3.5" /> FAILURE REASON
                </h3>
                <p className="text-sm text-red-300/80 leading-relaxed">{flight.failreason}</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Mission details grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-panel hud-corners overflow-hidden"
        >
          <div className="h-1 bg-gradient-to-r from-spacex-accent/60 to-slate-600/60" />
          <div className="p-5">
            <h2 className="font-display text-sm font-bold text-white mb-3">MISSION DETAILS</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {/* Mission type */}
              {flight.mission?.type && (
                <div className="rounded-lg bg-spacex-dark/40 border border-spacex-border/15 p-3 text-center">
                  <Target className="w-4 h-4 text-spacex-accent mx-auto mb-1" />
                  <p className="text-sm font-bold text-white font-mono">{flight.mission.type}</p>
                  <p className="text-[10px] font-mono text-spacex-muted">TYPE</p>
                </div>
              )}

              {/* Orbit */}
              {flight.mission?.orbit?.name && (
                <div className="rounded-lg bg-spacex-dark/40 border border-spacex-border/15 p-3 text-center">
                  <Globe className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                  <p className="text-sm font-bold text-white font-mono">{flight.mission.orbit.abbrev || flight.mission.orbit.name}</p>
                  <p className="text-[10px] font-mono text-spacex-muted">ORBIT</p>
                </div>
              )}

              {/* Vehicle */}
              {flight.rocket?.configuration?.full_name && (
                <div className="rounded-lg bg-spacex-dark/40 border border-spacex-border/15 p-3 text-center">
                  <Rocket className="w-4 h-4 text-orange-400 mx-auto mb-1" />
                  <p className="text-sm font-bold text-white font-mono">{flight.rocket.configuration.full_name}</p>
                  <p className="text-[10px] font-mono text-spacex-muted">VEHICLE</p>
                </div>
              )}

              {/* Status */}
              <div className="rounded-lg bg-spacex-dark/40 border border-spacex-border/15 p-3 text-center">
                <StatusIcon className={`w-4 h-4 ${sc.color} mx-auto mb-1`} />
                <p className="text-sm font-bold text-white font-mono">{flight.status?.name}</p>
                <p className="text-[10px] font-mono text-spacex-muted">STATUS</p>
              </div>

              {/* Pad */}
              {flight.pad?.name && (
                <div className="rounded-lg bg-spacex-dark/40 border border-spacex-border/15 p-3 text-center">
                  <MapPin className="w-4 h-4 text-green-400 mx-auto mb-1" />
                  <p className="text-xs font-bold text-white font-mono leading-tight">{flight.pad.name}</p>
                  <p className="text-[10px] font-mono text-spacex-muted">LAUNCH PAD</p>
                </div>
              )}

              {/* Location */}
              {flight.pad?.location?.name && (
                <div className="rounded-lg bg-spacex-dark/40 border border-spacex-border/15 p-3 text-center">
                  <Globe className="w-4 h-4 text-emerald-300 mx-auto mb-1" />
                  <p className="text-xs font-bold text-white font-mono leading-tight">{flight.pad.location.name}</p>
                  <p className="text-[10px] font-mono text-spacex-muted">LOCATION</p>
                </div>
              )}

              {/* Provider */}
              {flight.launch_service_provider?.name && (
                <div className="rounded-lg bg-spacex-dark/40 border border-spacex-border/15 p-3 text-center">
                  <Flame className="w-4 h-4 text-spacex-accent mx-auto mb-1" />
                  <p className="text-sm font-bold text-white font-mono">{flight.launch_service_provider.name}</p>
                  <p className="text-[10px] font-mono text-spacex-muted">PROVIDER</p>
                </div>
              )}

              {/* Attempt counts */}
              {flight.orbital_launch_attempt_count && (
                <div className="rounded-lg bg-spacex-dark/40 border border-spacex-border/15 p-3 text-center">
                  <BarChart3 className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                  <p className="text-sm font-bold text-white font-mono">#{flight.orbital_launch_attempt_count}</p>
                  <p className="text-[10px] font-mono text-spacex-muted">ORBITAL ATTEMPT</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Launch Window */}
        {(flight.window_start || flight.window_end) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-panel hud-corners overflow-hidden"
          >
            <div className="h-1 bg-gradient-to-r from-amber-500/60 to-slate-600/60" />
            <div className="p-5">
              <h2 className="font-display text-sm font-bold text-white flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-amber-400" /> LAUNCH WINDOW
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {flight.window_start && (
                  <div className="rounded-xl bg-spacex-dark/30 border border-spacex-border/30 p-4">
                    <p className="text-[10px] text-spacex-muted font-mono mb-1">WINDOW OPEN</p>
                    <p className="text-sm text-white font-mono">
                      {new Date(flight.window_start).toLocaleString("en-US", {
                        year: "numeric", month: "short", day: "numeric",
                        hour: "2-digit", minute: "2-digit", timeZoneName: "short"
                      })}
                    </p>
                  </div>
                )}
                {flight.window_end && (
                  <div className="rounded-xl bg-spacex-dark/30 border border-spacex-border/30 p-4">
                    <p className="text-[10px] text-spacex-muted font-mono mb-1">WINDOW CLOSE</p>
                    <p className="text-sm text-white font-mono">
                      {new Date(flight.window_end).toLocaleString("en-US", {
                        year: "numeric", month: "short", day: "numeric",
                        hour: "2-digit", minute: "2-digit", timeZoneName: "short"
                      })}
                    </p>
                  </div>
                )}
              </div>
              {flight.probability !== null && flight.probability !== undefined && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-spacex-muted font-mono">Launch probability:</span>
                  <span className="text-sm text-white font-bold font-mono">{flight.probability}%</span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Program info */}
        {flight.program && flight.program.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-panel hud-corners overflow-hidden"
          >
            <div className="h-1 bg-gradient-to-r from-spacex-accent/60 to-orange-500/60" />
            <div className="p-5">
              <h2 className="font-display text-sm font-bold text-white flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-spacex-accent" /> PROGRAM
              </h2>
              {flight.program.map((prog, idx) => (
                <div key={idx} className="rounded-xl bg-spacex-dark/30 border border-spacex-border/30 p-4">
                  <h3 className="text-sm font-bold text-white mb-1">{prog.name}</h3>
                  {prog.description && (
                    <p className="text-xs text-spacex-text/60 leading-relaxed">{prog.description}</p>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Related vehicles */}
        {relatedVehicles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-panel hud-corners overflow-hidden"
          >
            <div className="h-1 bg-gradient-to-r from-orange-500/60 to-red-500/60" />
            <div className="p-5">
              <h2 className="font-display text-sm font-bold text-white flex items-center gap-2 mb-3">
                <Rocket className="w-4 h-4 text-orange-400" /> RELATED VEHICLES
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {relatedVehicles.map((v) => (
                  <div key={v.id} className="rounded-xl bg-spacex-dark/30 border border-spacex-border/30 p-4 flex gap-4">
                    {v.image?.thumbnail_url && (
                      <div className="shrink-0 w-16 h-16 relative rounded-lg overflow-hidden border border-spacex-border/15">
                        <Image src={v.image.thumbnail_url} alt={v.serial_number} fill sizes="64px" className="object-cover" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-bold text-white font-mono">{v.serial_number}</p>
                      <p className="text-[10px] text-spacex-muted font-mono capitalize">{v.status?.name?.toLowerCase()}</p>
                      {v.launcher_config?.full_name && (
                        <p className="text-[10px] text-spacex-text/50 font-mono mt-0.5">{v.launcher_config.full_name}</p>
                      )}
                      {v.details && (
                        <p className="text-[11px] text-spacex-text/40 mt-1 line-clamp-2">{v.details}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Related updates */}
        {relatedUpdates.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="glass-panel hud-corners overflow-hidden"
          >
            <div className="h-1 bg-gradient-to-r from-amber-500/60 to-slate-600/60" />
            <div className="p-5">
              <h2 className="font-display text-sm font-bold text-white flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-emerald-300" /> RELATED UPDATES
              </h2>
              <div className="space-y-3">
                {relatedUpdates.map((u) => (
                  <div key={u.id} className="flex gap-3 p-3 rounded-lg bg-spacex-dark/30 border border-spacex-border/30">
                    <div className="w-1 shrink-0 rounded-full bg-white/40" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-spacex-text/70 leading-relaxed">{u.comment}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[10px] font-mono text-spacex-muted">
                          {new Date(u.created_on).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                        </span>
                        <span className="text-[10px] font-mono text-spacex-muted/60">by {u.created_by}</span>
                        {u.info_url && (
                          <a href={u.info_url} target="_blank" rel="noopener noreferrer" className="text-spacex-accent hover:underline text-[10px] font-mono flex items-center gap-0.5">
                            <ExternalLink className="w-3 h-3" /> Source
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Flight navigation (prev/next) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex gap-3"
        >
          {prevFlight ? (
            <Link
              href={`/starship/${prevFlight.id}`}
              className="flex-1 glass-panel p-4 hover:border-spacex-accent/30 transition-colors group"
            >
              <p className="text-[10px] font-mono text-spacex-muted mb-1">← PREVIOUS</p>
              <p className="text-sm font-bold text-white group-hover:text-spacex-accent transition-colors">{prevFlight.name}</p>
            </Link>
          ) : <div className="flex-1" />}
          {nextFlight ? (
            <Link
              href={`/starship/${nextFlight.id}`}
              className="flex-1 glass-panel p-4 hover:border-spacex-accent/30 transition-colors group text-right"
            >
              <p className="text-[10px] font-mono text-spacex-muted mb-1">NEXT →</p>
              <p className="text-sm font-bold text-white group-hover:text-spacex-accent transition-colors">{nextFlight.name}</p>
            </Link>
          ) : <div className="flex-1" />}
        </motion.div>
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
                <Image src={lightbox} alt={flight.name} width={1200} height={800} sizes="(max-width: 768px) 100vw, 768px" className="w-full h-auto" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Disclaimer */}
      <p className="text-[9px] font-mono text-white/15 text-center mt-8 pb-2">
        All data sourced from public APIs and publicly available sources. Not affiliated with SpaceX or any other agency.
      </p>
    </div>
  );
}
