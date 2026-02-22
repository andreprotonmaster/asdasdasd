"use client";

import { useState } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ExternalLink,
  Rocket,
  Calendar,
  CheckCircle2,
  XCircle,
  Users,
  Globe,
  Building2,
  ChevronRight,
  GraduationCap,
  Shield,
  Clock,
  MapPin,
  AtSign,
  Award,
  Cake,
  X,
} from "lucide-react";
import crewData from "../../../../public/data/crew.json";
import launchData from "../../../../public/data/launches.json";

interface Crew {
  id: string;
  name: string;
  agency: string;
  image: string;
  wikipedia: string;
  launches: string[];
  status: string;
  bio?: string;
  role?: string;
  nationality?: string;
  totalFlights?: number;
  spacewalks?: number;
  dateOfBirth?: string;
  birthPlace?: string;
  education?: string[];
  militaryService?: string | null;
  timeInSpace?: string;
  twitter?: string | null;
  selection?: string;
}

interface Launch {
  id: string;
  name: string;
  date_utc: string;
  success: boolean | null;
  details: string | null;
  flight_number: number;
  crew: string[];
  links: {
    patch: { small: string | null; large: string | null };
    webcast: string | null;
    article: string | null;
    wikipedia: string | null;
  };
}

const allCrew: Crew[] = crewData as Crew[];
const allLaunches: Launch[] = launchData as unknown as Launch[];

const agencyColors: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
  NASA: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", gradient: "from-amber-500 to-violet-700" },
  JAXA: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20", gradient: "from-red-500 to-red-700" },
  ESA: { bg: "bg-white/10", text: "text-emerald-300", border: "border-white/20", gradient: "from-emerald-500 to-emerald-700" },
  SpaceX: { bg: "bg-spacex-accent/10", text: "text-spacex-accent", border: "border-spacex-accent/20", gradient: "from-spacex-accent to-violet-700" },
  "Axiom Space": { bg: "bg-white/10", text: "text-amber-400", border: "border-white/20", gradient: "from-amber-500 to-gray-700" },
  Roscosmos: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20", gradient: "from-orange-500 to-orange-700" },
};

const defaultStyle = { bg: "bg-spacex-border/10", text: "text-spacex-muted", border: "border-spacex-border/20", gradient: "from-amber-500 to-gray-700" };

function formatDate(dateUTC: string): string {
  return new Date(dateUTC).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

interface Params {
  params: { id: string };
}

export default function CrewDetailPage({ params }: Params) {
  const [lightbox, setLightbox] = useState<{ src: string; name: string } | null>(null);
  const crew: Crew | undefined = allCrew.find((c) => c.id === params.id);
  if (!crew) return notFound();

  const style = agencyColors[crew.agency] || defaultStyle;
  const crewLaunches = crew.launches
    .map((lid) => allLaunches.find((l) => l.id === lid))
    .filter(Boolean) as Launch[];

  // Find fellow crew members from all shared missions
  const fellowCrewIds = new Set<string>();
  crewLaunches.forEach((launch) => {
    (launch.crew || []).forEach((cid) => {
      if (typeof cid === "string" && cid !== crew.id) fellowCrewIds.add(cid);
    });
  });
  const fellowCrew = allCrew.filter((c) => fellowCrewIds.has(c.id));

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Back */}
      <Link
        href="/crew"
        className="inline-flex items-center gap-2 text-xs font-mono text-spacex-muted hover:text-spacex-accent transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        BACK TO CREW MANIFEST
      </Link>

      {/* Hero Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel hud-corners overflow-hidden"
      >
        {/* Gradient accent stripe */}
        <div className={`h-1.5 bg-gradient-to-r ${style.gradient}`} />

        <div className="p-6">
          {/* Top: Avatar + Identity */}
          <div className="flex flex-col sm:flex-row items-start gap-5 mb-6">
            {/* Avatar */}
            <div className="shrink-0">
              <button
                type="button"
                onClick={() => setLightbox({ src: crew.image, name: crew.name })}
                className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-spacex-border/30 hover:border-spacex-accent/40 shadow-2xl cursor-zoom-in transition-colors"
              >
                <Image
                  src={crew.image}
                  alt={crew.name}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              </button>
            </div>

            {/* Name & meta */}
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mb-1">
                {crew.name}
              </h1>
              {crew.role && (
                <p className="text-sm text-spacex-accent mb-3 font-mono">{crew.role}</p>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono ${style.bg} ${style.text} border ${style.border}`}>
                  <Building2 className="w-3 h-3" />
                  {crew.agency}
                </span>
                {crew.nationality && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono bg-spacex-dark/40 text-spacex-muted border border-spacex-border/20">
                    <Globe className="w-3 h-3" />
                    {crew.nationality}
                  </span>
                )}
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono ${
                  crew.status === "active"
                    ? "bg-spacex-success/10 text-spacex-success border border-spacex-success/20"
                    : "bg-spacex-muted/10 text-spacex-muted border border-spacex-border/20"
                }`}>
                  {crew.status === "active" ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {crew.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg bg-spacex-dark/40 border border-spacex-border/15 p-3 text-center">
              <Rocket className="w-4 h-4 text-spacex-accent mx-auto mb-1.5" />
              <p className="text-xl font-bold text-white font-mono leading-none">{crew.totalFlights || crew.launches.length}</p>
              <p className="text-[10px] font-mono text-spacex-muted mt-1">FLIGHTS</p>
            </div>
            <div className="rounded-lg bg-spacex-dark/40 border border-spacex-border/15 p-3 text-center">
              <Rocket className="w-4 h-4 text-spacex-accent mx-auto mb-1.5" />
              <p className="text-xl font-bold text-white font-mono leading-none">{crew.launches.length}</p>
              <p className="text-[10px] font-mono text-spacex-muted mt-1">w/ SPACEX</p>
            </div>
            <div className="rounded-lg bg-spacex-dark/40 border border-spacex-border/15 p-3 text-center">
              <Globe className="w-4 h-4 text-spacex-accent mx-auto mb-1.5" />
              <p className="text-xl font-bold text-white font-mono leading-none">{crew.spacewalks ?? 0}</p>
              <p className="text-[10px] font-mono text-spacex-muted mt-1">EVAs</p>
            </div>
            <div className="rounded-lg bg-spacex-dark/40 border border-spacex-border/15 p-3 text-center">
              <Clock className="w-4 h-4 text-emerald-300 mx-auto mb-1.5" />
              <p className="text-base font-bold text-white font-mono leading-none">{crew.timeInSpace || "—"}</p>
              <p className="text-[10px] font-mono text-spacex-muted mt-1">IN SPACE</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Bio */}
      {crew.bio && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="glass-panel p-5 hud-corners"
        >
          <h2 className="font-display text-sm font-bold text-white flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-spacex-accent" />
            BIOGRAPHY
          </h2>
          <p className="text-sm text-spacex-text/70 leading-relaxed">{crew.bio}</p>
        </motion.div>
      )}

      {/* Personal Details & Education Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Personal Details */}
        {(crew.dateOfBirth || crew.birthPlace || crew.selection) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-panel p-5 hud-corners"
          >
            <h2 className="font-display text-sm font-bold text-white flex items-center gap-2 mb-4">
              <Award className="w-4 h-4 text-spacex-accent" />
              PERSONAL DETAILS
            </h2>
            <div className="space-y-3">
              {crew.dateOfBirth && (
                <div className="flex items-start gap-3">
                  <Cake className="w-4 h-4 text-spacex-muted shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-mono text-spacex-muted uppercase">Date of Birth</p>
                    <p className="text-sm text-spacex-text">
                      {new Date(crew.dateOfBirth + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                  </div>
                </div>
              )}
              {crew.birthPlace && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-spacex-muted shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-mono text-spacex-muted uppercase">Birthplace</p>
                    <p className="text-sm text-spacex-text">{crew.birthPlace}</p>
                  </div>
                </div>
              )}
              {crew.selection && (
                <div className="flex items-start gap-3">
                  <Award className="w-4 h-4 text-spacex-muted shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-mono text-spacex-muted uppercase">Selection</p>
                    <p className="text-sm text-spacex-text">{crew.selection}</p>
                  </div>
                </div>
              )}
              {crew.militaryService && (
                <div className="flex items-start gap-3">
                  <Shield className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-mono text-spacex-muted uppercase">Military Service</p>
                    <p className="text-sm text-amber-300">{crew.militaryService}</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Education */}
        {crew.education && crew.education.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="glass-panel p-5 hud-corners"
          >
            <h2 className="font-display text-sm font-bold text-white flex items-center gap-2 mb-4">
              <GraduationCap className="w-4 h-4 text-spacex-accent" />
              EDUCATION
            </h2>
            <div className="space-y-3">
              {crew.education.map((edu, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-spacex-accent shrink-0 mt-2" />
                  <p className="text-sm text-spacex-text/80">{edu}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* External Links */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-3"
      >
        <a
          href={crew.wikipedia}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg glass-panel hover:border-spacex-accent/30 transition-all text-sm text-spacex-accent"
        >
          <ExternalLink className="w-4 h-4" />
          Wikipedia Profile
        </a>
        {crew.twitter && (
          <a
            href={`https://x.com/${crew.twitter}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg glass-panel hover:border-white/30 transition-all text-sm text-emerald-300"
          >
            <AtSign className="w-4 h-4" />
            @{crew.twitter}
          </a>
        )}
      </motion.div>

      {/* Mission History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="space-y-3"
      >
        <h2 className="font-display text-sm font-bold text-white flex items-center gap-2">
          <Rocket className="w-4 h-4 text-spacex-accent" />
          MISSION HISTORY
        </h2>

        <div className="space-y-3">
          {crewLaunches.map((launch, i) => {
            const missionCrew = (launch.crew || [])
              .map((cid) => allCrew.find((c) => c.id === (typeof cid === "string" ? cid : "")))
              .filter(Boolean) as Crew[];

            return (
              <motion.div
                key={launch.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
              >
                <Link
                  href={`/missions/${launch.id}`}
                  className="glass-panel p-4 flex gap-4 items-start hover:border-spacex-accent/20 transition-all group cursor-pointer hud-corners"
                >
                  {/* Mission patch */}
                  <div className="shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-spacex-dark/50 border border-spacex-border/20 flex items-center justify-center relative">
                    {launch.links?.patch?.small ? (
                      <Image
                        src={launch.links.patch.small}
                        alt={launch.name}
                        fill
                        sizes="64px"
                        className="object-contain"
                      />
                    ) : (
                      <Rocket className="w-6 h-6 text-spacex-muted" />
                    )}
                  </div>

                  {/* Mission details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-white group-hover:text-spacex-accent transition-colors">
                        {launch.name}
                      </h3>
                      {launch.success === true && (
                        <CheckCircle2 className="w-4 h-4 text-spacex-success shrink-0" />
                      )}
                      {launch.success === false && (
                        <XCircle className="w-4 h-4 text-spacex-danger shrink-0" />
                      )}
                    </div>

                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-[11px] font-mono text-spacex-muted flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(launch.date_utc)}
                      </span>
                      <span className="text-[11px] font-mono text-spacex-muted">
                        Flight #{launch.flight_number}
                      </span>
                    </div>

                    {launch.details && (
                      <p className="text-xs text-spacex-text/50 line-clamp-2 mb-2">
                        {launch.details}
                      </p>
                    )}

                    {/* Crew on this mission */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-mono text-spacex-muted mr-1">CREW:</span>
                      <div className="flex -space-x-2">
                        {missionCrew.slice(0, 6).map((mc) => (
                          <div
                            key={mc.id}
                            className="w-6 h-6 rounded-full overflow-hidden border-2 border-spacex-dark"
                            title={mc.name}
                          >
                            <Image
                              src={mc.image}
                              alt={mc.name}
                              width={24}
                              height={24}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                      {missionCrew.length > 6 && (
                        <span className="text-[9px] font-mono text-spacex-muted">
                          +{missionCrew.length - 6}
                        </span>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-spacex-muted group-hover:text-spacex-accent transition-colors shrink-0 mt-1" />
                </Link>
              </motion.div>
            );
          })}

          {crewLaunches.length === 0 && (
            <div className="glass-panel p-6 text-center">
              <Rocket className="w-8 h-8 text-spacex-muted mx-auto mb-2 opacity-30" />
              <p className="text-sm text-spacex-muted">No mission data available.</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Fellow Crew Members */}
      {fellowCrew.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="space-y-3"
        >
          <h2 className="font-display text-sm font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-spacex-accent" />
            FELLOW CREWMATES
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {fellowCrew.map((fc, i) => {
              const fcStyle = agencyColors[fc.agency] || defaultStyle;
              return (
                <motion.div
                  key={fc.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.03 }}
                >
                  <Link
                    href={`/crew/${fc.id}`}
                    className="glass-panel p-3 flex flex-col items-center hover:border-spacex-accent/20 transition-all group cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-spacex-border/30 group-hover:border-spacex-accent/40 transition-colors mb-2">
                      <Image
                        src={fc.image}
                        alt={fc.name}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-xs font-bold text-white text-center truncate w-full group-hover:text-spacex-accent transition-colors">
                      {fc.name}
                    </p>
                    <span className={`text-[9px] font-mono ${fcStyle.text} mt-0.5`}>
                      {fc.agency}
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Image Lightbox Modal */}
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
              className="relative max-w-lg w-full"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <button
                onClick={() => setLightbox(null)}
                className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-spacex-dark border border-spacex-border/40 flex items-center justify-center text-spacex-muted hover:text-white hover:border-spacex-accent/40 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="rounded-2xl overflow-hidden border-2 border-spacex-border/30 bg-spacex-dark shadow-2xl">
                <Image
                  src={lightbox.src}
                  alt={lightbox.name}
                  width={600}
                  height={600}
                  sizes="(max-width: 640px) 100vw, 512px"
                  className="w-full h-auto object-cover"
                />
              </div>
              <p className="text-center text-sm font-mono text-spacex-muted mt-3">{lightbox.name}</p>
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
