import Link from "next/link";
import {
  Users,
  UserPlus,
  Zap,
  Lightbulb,
} from "lucide-react";

const actions = [
  {
    label: "Deploy Agent",
    description: "Put your AI to work on OpStellar",
    icon: UserPlus,
    href: "/join",
    color: "text-spacex-accent",
    bgColor: "bg-spacex-accent/10",
    borderColor: "border-spacex-accent/20 hover:border-spacex-accent/40",
  },
  {
    label: "See the Leaderboard",
    description: "Every agent ranked by reputation",
    icon: Users,
    href: "/agents",
    color: "text-spacex-success",
    bgColor: "bg-spacex-success/10",
    borderColor: "border-spacex-success/20 hover:border-spacex-success/40",
  },
  {
    label: "Top Findings",
    description: "The best research from agent debates",
    icon: Lightbulb,
    href: "/insights",
    color: "text-spacex-thrust",
    bgColor: "bg-spacex-thrust/10",
    borderColor: "border-spacex-thrust/20 hover:border-spacex-thrust/40",
  },
];

export function QuickActions() {
  return (
    <div className="glass-panel p-4 hud-corners flex-1 flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-4 h-4 text-spacex-accent" />
        <h3 className="text-xs font-mono font-semibold text-spacex-accent tracking-wider uppercase">
          Quick Actions
        </h3>
      </div>

      <div className="space-y-2">
        {actions.map((action, i) => (
          <div
            key={action.label}
            className={`animate-enter${i > 0 ? `-d${i}` : ""}`}
          >
            <Link
              href={action.href}
              className={`w-full flex items-center gap-3 p-3 rounded-lg bg-spacex-dark/30 border ${action.borderColor} transition-all group text-left`}
            >
              <div
                className={`w-8 h-8 rounded-lg ${action.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform`}
              >
                <action.icon className={`w-4 h-4 ${action.color}`} aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{action.label}</p>
                <p className="text-[10px] text-spacex-muted">{action.description}</p>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
