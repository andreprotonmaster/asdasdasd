import {
  Clock,
  CheckCircle2,
  Circle,
  Loader2,
  Rocket,
} from "lucide-react";

interface TimelineEvent {
  id: string;
  label: string;
  time: string;
  status: "completed" | "active" | "upcoming";
  detail?: string;
}

const events: TimelineEvent[] = [
  {
    id: "1",
    label: "Pre-flight Systems Check",
    time: "T-04:00:00",
    status: "completed",
    detail: "All subsystems verified",
  },
  {
    id: "2",
    label: "Propellant Loading",
    time: "T-00:35:00",
    status: "completed",
    detail: "LOX/CH4 load complete",
  },
  {
    id: "3",
    label: "Launch Director Poll",
    time: "T-00:10:00",
    status: "active",
    detail: "AI crew providing GO/NO-GO",
  },
  {
    id: "4",
    label: "Terminal Count",
    time: "T-00:01:00",
    status: "upcoming",
  },
  {
    id: "5",
    label: "Ignition & Liftoff",
    time: "T-00:00:00",
    status: "upcoming",
  },
  {
    id: "6",
    label: "Max-Q",
    time: "T+00:01:12",
    status: "upcoming",
  },
  {
    id: "7",
    label: "Hot Staging",
    time: "T+00:02:42",
    status: "upcoming",
  },
  {
    id: "8",
    label: "Booster Catch",
    time: "T+00:07:15",
    status: "upcoming",
  },
  {
    id: "9",
    label: "Orbital Insertion",
    time: "T+00:08:30",
    status: "upcoming",
  },
];

const statusIcons = {
  completed: CheckCircle2,
  active: Loader2,
  upcoming: Circle,
};

const statusStyles = {
  completed: {
    icon: "text-spacex-success",
    line: "bg-spacex-success",
    text: "text-spacex-text",
  },
  active: {
    icon: "text-spacex-accent animate-spin",
    line: "bg-spacex-accent",
    text: "text-white",
  },
  upcoming: {
    icon: "text-spacex-muted/40",
    line: "bg-spacex-border/30",
    text: "text-spacex-muted",
  },
};

export function MissionTimeline() {
  return (
    <div className="glass-panel p-4 hud-corners">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Rocket className="w-4 h-4 text-spacex-thrust" />
          <h3 className="text-xs font-mono font-semibold text-spacex-thrust tracking-wider uppercase">
            Launch Timeline
          </h3>
        </div>
        <span className="text-[10px] font-mono text-spacex-muted flex items-center gap-1">
          <Clock className="w-3 h-3" />
          IFT-8
        </span>
      </div>

      <div className="space-y-0 max-h-[300px] overflow-y-auto pr-1">
        {events.map((event, i) => {
          const style = statusStyles[event.status];
          const StatusIcon = statusIcons[event.status];
          const isLast = i === events.length - 1;

          return (
            <div
              key={event.id}
              className={`flex gap-3 animate-enter${i > 0 && i <= 6 ? `-d${i}` : ""}`}
            >
              {/* Timeline line */}
              <div className="flex flex-col items-center">
                <StatusIcon className={`w-4 h-4 shrink-0 ${style.icon}`} />
                {!isLast && (
                  <div className={`w-[1px] flex-1 min-h-[24px] ${style.line}`} />
                )}
              </div>

              {/* Content */}
              <div className={`pb-3 ${isLast ? "" : ""}`}>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${style.text}`}>
                    {event.label}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-mono text-spacex-accent/70">
                    {event.time}
                  </span>
                  {event.detail && (
                    <>
                      <span className="text-spacex-border text-[10px]">·</span>
                      <span className="text-[10px] text-spacex-muted">
                        {event.detail}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
