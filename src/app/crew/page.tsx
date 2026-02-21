"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  Users,
  Search,
  Filter,
  Rocket,
  ChevronRight,
  Globe,
  Building2,
  Clock,
  Shield,
  X,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import crewData from "../../../public/data/crew.json";

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
  timeInSpace?: string;
  militaryService?: string | null;
  dateOfBirth?: string;
  birthPlace?: string;
  education?: string[];
  twitter?: string | null;
  selection?: string;
}

const crewList: Crew[] = crewData as Crew[];

const agencyColors: Record<string, { bg: string; text: string; border: string; dot: string; gradient: string }> = {
  NASA: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20", dot: "bg-blue-400", gradient: "from-blue-500 to-blue-700" },
  JAXA: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20", dot: "bg-red-400", gradient: "from-red-500 to-red-700" },
  ESA: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20", dot: "bg-cyan-400", gradient: "from-cyan-500 to-cyan-700" },
  SpaceX: { bg: "bg-spacex-accent/10", text: "text-spacex-accent", border: "border-spacex-accent/20", dot: "bg-spacex-accent", gradient: "from-spacex-accent to-blue-700" },
  "Axiom Space": { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20", dot: "bg-purple-400", gradient: "from-purple-500 to-purple-700" },
  Roscosmos: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20", dot: "bg-orange-400", gradient: "from-orange-500 to-orange-700" },
};

const defaultAgencyStyle = { bg: "bg-spacex-border/10", text: "text-spacex-muted", border: "border-spacex-border/20", dot: "bg-spacex-muted", gradient: "from-gray-500 to-gray-700" };

export default function CrewPage() {
  const [search, setSearch] = useState("");
  const [agencyFilter, setAgencyFilter] = useState<string>("all");
  const [lightbox, setLightbox] = useState<{ src: string; name: string } | null>(null);

  const agencies = useMemo(() => Array.from(new Set(crewList.map((c) => c.agency))).sort(), []);

  const agencyStats = useMemo(() => {
    const map: Record<string, number> = {};
    crewList.forEach((c) => {
      map[c.agency] = (map[c.agency] || 0) + 1;
    });
    return map;
  }, []);

  const filtered = useMemo(() => {
    return crewList.filter((c) => {
      const matchSearch =
        search === "" ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.agency.toLowerCase().includes(search.toLowerCase());
      const matchAgency = agencyFilter === "all" || c.agency === agencyFilter;
      return matchSearch && matchAgency;
    });
  }, [search, agencyFilter]);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-spacex-accent" />
            CREW MANIFEST
          </h1>
          <p className="text-xs sm:text-sm text-spacex-muted mt-1">
            Astronauts and crew members who have flown on space missions
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-spacex-muted">
          <div className="w-2 h-2 rounded-full bg-spacex-success animate-pulse" />
          {crewList.length} CREW MEMBERS
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Crew", value: crewList.length.toString(), sub: "All missions", icon: Users },
          { label: "Agencies", value: agencies.length.toString(), sub: agencies.join(", "), icon: Building2 },
          { label: "Missions Flown", value: Array.from(new Set(crewList.flatMap((c) => c.launches))).length.toString(), sub: "Unique launches", icon: Rocket },
          { label: "Active Status", value: crewList.filter((c) => c.status === "active").length.toString(), sub: `of ${crewList.length} total`, icon: Globe },
        ].map((stat) => (
          <div key={stat.label} className="glass-panel p-3">
            <div className="flex items-center gap-2 mb-1">
              <stat.icon className="w-3.5 h-3.5 text-spacex-accent" />
              <p className="text-[10px] font-mono text-spacex-muted tracking-wider uppercase">{stat.label}</p>
            </div>
            <p className="text-xl font-bold text-white font-mono mt-1">{stat.value}</p>
            <p className="text-[10px] text-spacex-muted font-mono truncate">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-spacex-muted" />
          <input
            type="text"
            placeholder="Search crew members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-spacex-dark/60 border border-spacex-border/30 text-sm text-white placeholder:text-spacex-muted/50 focus:outline-none focus:border-spacex-accent/40 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-spacex-muted" />
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setAgencyFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                agencyFilter === "all"
                  ? "bg-spacex-accent/15 text-spacex-accent border border-spacex-accent/30"
                  : "bg-spacex-dark/40 text-spacex-muted border border-spacex-border/20 hover:text-white"
              }`}
            >
              ALL ({crewList.length})
            </button>
            {agencies.map((agency) => {
              const style = agencyColors[agency] || defaultAgencyStyle;
              return (
                <button
                  key={agency}
                  onClick={() => setAgencyFilter(agency)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 ${
                    agencyFilter === agency
                      ? `${style.bg} ${style.text} border ${style.border}`
                      : "bg-spacex-dark/40 text-spacex-muted border border-spacex-border/20 hover:text-white"
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                  {agency} ({agencyStats[agency]})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Crew grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((crew, i) => {
            const style = agencyColors[crew.agency] || defaultAgencyStyle;
            return (
              <motion.div
                key={crew.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.03, duration: 0.3 }}
              >
                <Link
                  href={`/crew/${crew.id}`}
                  className="glass-panel overflow-hidden hover:border-spacex-accent/20 transition-all group cursor-pointer hud-corners h-full flex flex-col"
                >
                  {/* Agency accent stripe */}
                  <div className={`h-1 bg-gradient-to-r ${style.gradient} opacity-60 group-hover:opacity-100 transition-opacity`} />

                  <div className="p-4 flex gap-4 flex-1">
                    {/* Avatar */}
                    <div className="relative shrink-0 flex items-center">
                      <button
                        type="button"
                        onClick={(e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setLightbox({ src: crew.image, name: crew.name }); }}
                        className="w-[72px] h-[72px] rounded-xl overflow-hidden border-2 border-spacex-border/30 group-hover:border-spacex-accent/40 transition-colors cursor-zoom-in"
                      >
                        <Image
                          src={crew.image}
                          alt={crew.name}
                          width={72}
                          height={72}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col">
                      {/* Name + status */}
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-sm font-bold text-white group-hover:text-spacex-accent transition-colors truncate">
                          {crew.name}
                        </h3>
                        {crew.status === "active" ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-spacex-success shrink-0" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-spacex-muted/50 shrink-0" />
                        )}
                      </div>

                      {/* Role */}
                      {crew.role && (
                        <p className="text-[11px] text-spacex-accent font-mono mb-1.5 truncate">{crew.role}</p>
                      )}

                      {/* Tags row */}
                      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono ${style.bg} ${style.text} border ${style.border}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                          {crew.agency}
                        </span>
                        {crew.nationality && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-spacex-muted bg-spacex-dark/40 px-2 py-0.5 rounded-md border border-spacex-border/20">
                            <Globe className="w-2.5 h-2.5" />
                            {crew.nationality}
                          </span>
                        )}
                        {crew.militaryService && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-400/80 bg-amber-500/5 px-2 py-0.5 rounded-md border border-amber-500/15">
                            <Shield className="w-2.5 h-2.5" />
                            MIL
                          </span>
                        )}
                      </div>

                      {/* Bio */}
                      {crew.bio && (
                        <p className="text-[11px] text-spacex-text/50 leading-relaxed line-clamp-2 flex-1">{crew.bio}</p>
                      )}
                    </div>

                    {/* Arrow */}
                    <div className="flex items-center shrink-0">
                      <ChevronRight className="w-4 h-4 text-spacex-muted group-hover:text-spacex-accent transition-colors" />
                    </div>
                  </div>

                  {/* Stats footer */}
                  <div className="border-t border-spacex-border/10 px-4 py-2.5 flex items-center gap-4 text-[10px] font-mono bg-spacex-dark/20">
                    <span className="text-spacex-muted flex items-center gap-1">
                      <Rocket className="w-3 h-3" />
                      {crew.totalFlights || crew.launches.length} flight{(crew.totalFlights || crew.launches.length) !== 1 ? "s" : ""}
                    </span>
                    {(crew.spacewalks ?? 0) > 0 && (
                      <span className="text-spacex-accent flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {crew.spacewalks} EVA{crew.spacewalks !== 1 ? "s" : ""}
                      </span>
                    )}
                    {crew.timeInSpace && (
                      <span className="text-cyan-400/70 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {crew.timeInSpace}
                      </span>
                    )}
                    {crew.selection && (
                      <span className="text-spacex-muted/60 ml-auto truncate max-w-[120px]" title={crew.selection}>
                        {crew.selection}
                      </span>
                    )}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-spacex-muted">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No crew members found matching your search.</p>
        </div>
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
