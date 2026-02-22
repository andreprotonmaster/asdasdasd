import Link from "next/link";
import {
  Rocket,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ExternalLink,
  Flame,
  ArrowUpDown,
  BarChart3,
  Calendar,
  Activity,
} from "lucide-react";
import dashboardData from "../../../public/data/ll2-starship-dashboard.json";

interface StarshipVehicle {
  id: number;
  serial_number: string;
  status: { id: number; name: string };
  details?: string;
  image?: { image_url?: string; thumbnail_url?: string };
  flight_proven: boolean;
  flights?: number;
}

interface StarshipUpdate {
  id: number;
  profile_image?: string;
  comment: string;
  info_url?: string;
  created_by: string;
  created_on: string;
}

interface StarshipFlight {
  id: string;
  name: string;
  slug: string;
  status: { id: number; name: string; abbrev?: string };
  net?: string;
  image?: { image_url?: string; thumbnail_url?: string };
  mission?: { name?: string; description?: string };
}

const dashboard = dashboardData as {
  updates: StarshipUpdate[];
  vehicles: StarshipVehicle[];
  upcoming: { launches: StarshipFlight[] };
  previous: { launches: StarshipFlight[] };
};

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  "scrapped": { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
  "converted": { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20" },
  "destroyed": { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
  "lost": { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20" },
  "retired": { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
  "active": { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/20" },
};
const defaultStatusColor = { bg: "bg-spacex-border/10", text: "text-spacex-muted", border: "border-spacex-border/20" };

const flightStatusIcons: Record<string, typeof CheckCircle2> = {
  "Launch Successful": CheckCircle2,
  "Launch Failure": XCircle,
  "Partial Failure": AlertTriangle,
  "To Be Determined": Clock,
  "To Be Confirmed": Clock,
};

const flightStatusColors: Record<string, string> = {
  "Launch Successful": "text-spacex-success",
  "Launch Failure": "text-red-400",
  "Partial Failure": "text-yellow-400",
  "To Be Determined": "text-spacex-muted",
  "To Be Confirmed": "text-spacex-muted",
};

export default function StarshipPage() {
  const vehicles = dashboard.vehicles || [];
  const updates = dashboard.updates || [];
  const previousFlights = dashboard.previous?.launches || [];
  const upcomingFlights = dashboard.upcoming?.launches || [];

  const vehicleStats = (() => {
    const stats: Record<string, number> = {};
    vehicles.forEach((v) => {
      const s = v.status?.name?.toLowerCase() || "unknown";
      stats[s] = (stats[s] || 0) + 1;
    });
    return stats;
  })();

  const allFlights = [
    ...previousFlights.map((f) => ({ ...f, _type: "previous" as const })),
    ...upcomingFlights.map((f) => ({ ...f, _type: "upcoming" as const })),
  ].sort((a, b) => {
    const da = a.net ? new Date(a.net).getTime() : Infinity;
    const db = b.net ? new Date(b.net).getTime() : Infinity;
    return da - db;
  });

  const successCount = previousFlights.filter((f) => f.status?.name === "Launch Successful").length;
  const failCount = previousFlights.filter((f) => f.status?.name === "Launch Failure" || f.status?.name === "Partial Failure").length;

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <Rocket className="w-5 h-5 text-spacex-accent" />
            STARSHIP DEVELOPMENT TRACKER
          </h1>
          <p className="text-xs sm:text-sm text-spacex-muted mt-1">
            Tracking the development of the world&apos;s most powerful rocket
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-spacex-muted">
          <div className="w-2 h-2 rounded-full bg-spacex-accent animate-pulse" />
          {upcomingFlights.length} UPCOMING
        </div>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Test Flights", value: previousFlights.length.toString(), icon: Rocket, color: "text-spacex-accent" },
          { label: "Successful", value: successCount.toString(), icon: CheckCircle2, color: "text-spacex-success" },
          { label: "Failed", value: failCount.toString(), icon: XCircle, color: "text-red-400" },
          { label: "Vehicles Built", value: vehicles.length.toString(), icon: Flame, color: "text-orange-400" },
          { label: "Upcoming", value: upcomingFlights.length.toString(), icon: Clock, color: "text-emerald-300" },
        ].map((s, i) => (
          <div
            key={s.label}
            className={`glass-panel p-3 animate-enter${i > 0 && i <= 6 ? `-d${i}` : ""}`}
          >
            <s.icon className={`w-4 h-4 ${s.color} mb-1`} />
            <p className="text-xl font-bold text-white font-mono">{s.value}</p>
            <p className="text-[10px] font-mono text-spacex-muted">{s.label.toUpperCase()}</p>
          </div>
        ))}
      </div>

      {/* Flight Timeline */}
      <div
        className="glass-panel hud-corners overflow-hidden animate-enter-d1"
      >
        <div className="h-1.5 bg-gradient-to-r from-spacex-accent to-orange-500" />
        <div className="p-5">
          <h2 className="font-display text-sm font-bold text-white flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-spacex-accent" />
            INTEGRATED FLIGHT TEST TIMELINE
          </h2>

          <div className="space-y-3">
            {allFlights.map((flight) => {
              const StatusIcon = flightStatusIcons[flight.status?.name] || Clock;
              const statusColor = flightStatusColors[flight.status?.name] || "text-spacex-muted";
              const isUpcoming = flight._type === "upcoming";

              return (
                <Link key={flight.id} href={`/starship/${flight.id}`}>
                  <div
                    className={`flex items-center gap-4 p-3 rounded-lg border transition-colors cursor-pointer ${
                      isUpcoming
                        ? "bg-spacex-accent/5 border-spacex-accent/15 hover:border-spacex-accent/30"
                        : "bg-spacex-dark/30 border-spacex-border/30 hover:border-spacex-border/30"
                    }`}
                  >
                    {/* Status icon */}
                    <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                      isUpcoming ? "bg-spacex-accent/10" : "bg-spacex-dark/50"
                    }`}>
                      <StatusIcon className={`w-4 h-4 ${statusColor}`} />
                    </div>

                    {/* Flight info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white truncate">{flight.name}</h3>
                        {isUpcoming && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-spacex-accent/15 text-spacex-accent border border-spacex-accent/20">
                            UPCOMING
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[11px] font-mono text-spacex-muted flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {flight.net
                            ? new Date(flight.net).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                            : "TBD"}
                        </span>
                        <span className={`text-[11px] font-mono ${statusColor}`}>
                          {flight.status?.name}
                        </span>
                      </div>
                      {flight.mission?.description && (
                        <p className="text-[11px] text-spacex-text/40 mt-1 line-clamp-1">{flight.mission.description}</p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Vehicle Inventory */}
      <div
        className="glass-panel hud-corners overflow-hidden animate-enter-d2"
      >
        <div className="h-1.5 bg-gradient-to-r from-orange-500 to-red-600" />
        <div className="p-5">
          <h2 className="font-display text-sm font-bold text-white flex items-center gap-2 mb-2">
            <ArrowUpDown className="w-4 h-4 text-orange-400" />
            VEHICLE INVENTORY
          </h2>
          <p className="text-[11px] text-spacex-muted mb-4">
            {vehicles.length} boosters and ships built — showing status breakdown
          </p>

          {/* Status distribution */}
          <div className="flex flex-wrap gap-2 mb-4">
            {Object.entries(vehicleStats).sort((a, b) => b[1] - a[1]).map(([status, count]) => {
              const colors = statusColors[status] || defaultStatusColor;
              return (
                <span key={status} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono ${colors.bg} ${colors.text} border ${colors.border}`}>
                  {status} <span className="font-bold">{count}</span>
                </span>
              );
            })}
          </div>

          {/* Vehicle grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {vehicles
              .sort((a, b) => a.serial_number.localeCompare(b.serial_number, undefined, { numeric: true }))
              .map((v) => {
                const colors = statusColors[v.status?.name?.toLowerCase()] || defaultStatusColor;
                return (
                  <div
                    key={v.id}
                    className={`rounded-lg border p-2.5 ${colors.bg} ${colors.border}`}
                    title={v.details || v.serial_number}
                  >
                    <p className="text-xs font-mono font-bold text-white truncate">{v.serial_number}</p>
                    <p className={`text-[10px] font-mono ${colors.text} capitalize`}>{v.status?.name?.toLowerCase()}</p>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Recent Updates */}
      {updates.length > 0 && (
        <div
          className="glass-panel hud-corners overflow-hidden animate-enter-d3"
        >
          <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-amber-600" />
          <div className="p-5">
            <h2 className="font-display text-sm font-bold text-white flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-emerald-300" />
              DEVELOPMENT UPDATES
            </h2>
            <div className="space-y-3">
              {updates.slice(0, 8).map((u) => (
                <div
                  key={u.id}
                  className="flex gap-3 p-3 rounded-lg bg-spacex-dark/30 border border-spacex-border/30"
                >
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
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-[9px] font-mono text-white/15 text-center mt-8 pb-2">
        All data sourced from public APIs and publicly available sources. Not affiliated with SpaceX or any other agency.
      </p>
    </div>
  );
}
