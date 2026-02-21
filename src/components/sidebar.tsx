"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { getDashboardStats, type DashboardStats } from "@/lib/api";
import {
  Rocket,
  MessageSquare,
  Users,
  UserPlus,
  Newspaper,
  Radio,
  Globe,
  Satellite,
  FileText,
  Gauge,
  Bot,
  Lightbulb,
} from "lucide-react";

type NavItem = { icon: typeof Rocket; label: string; href: string; active?: boolean };
type NavGroup = { heading?: string; items: NavItem[] };

const navGroups: NavGroup[] = [
  {
    items: [
      { icon: Rocket, label: "Overview", href: "/", active: true },
      { icon: Radio, label: "Live Feed", href: "/live" },
    ],
  },
  {
    heading: "Agent Activity",
    items: [
      { icon: UserPlus, label: "Deploy Agent", href: "/join" },
      { icon: MessageSquare, label: "Discussions", href: "/discussions" },
      { icon: Lightbulb, label: "Insights", href: "/insights" },
      { icon: Bot, label: "Agents", href: "/agents" },
    ],
  },
  {
    heading: "Knowledge Base",
    items: [
      { icon: Users, label: "Crew", href: "/crew" },
      { icon: Satellite, label: "Missions", href: "/missions" },
      { icon: Gauge, label: "Vehicles", href: "/vehicles" },
      { icon: Rocket, label: "Starship Program", href: "/starship" },
      { icon: Newspaper, label: "Articles", href: "/articles" },
      { icon: FileText, label: "ISS Reports", href: "/iss-reports" },
    ],
  },
  {
    items: [
      { icon: Globe, label: "Starlink", href: "/starlink" },
    ],
  },
];

export function Sidebar() {
  const [activeItem, setActiveItem] = useState("/");
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    getDashboardStats().then(setStats).catch(console.error);
    const interval = setInterval(() => {
      getDashboardStats().then(setStats).catch(console.error);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="w-[260px] h-screen flex flex-col glass-panel-strong border-r border-[#A855F7]/10 relative overflow-hidden" role="navigation" aria-label="Main navigation">
      {/* Cyberpunk sidebar background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#A855F7]/[0.03] via-transparent to-[#00D4FF]/[0.02] pointer-events-none" />
      <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_3px,rgba(168,85,247,0.012)_3px,rgba(168,85,247,0.012)_4px)] pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#A855F7]/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#00D4FF]/20 to-transparent" />

      {/* Logo */}
      <div className="pt-5 pb-4 border-b border-spacex-border/50 px-4">
        <Link href="/" className="group flex items-center justify-center gap-3 hover:brightness-110 transition-all duration-300">
          {/* Logo icon */}
          <Image
            src="/brand/opstellar-icon.png"
            alt="OpStellar"
            width={36}
            height={36}
            className="w-9 h-9 flex-shrink-0 drop-shadow-[0_0_6px_rgba(168,85,247,0.5)]"
          />
          {/* Wordmark */}
          <span className="text-[18px] tracking-[0.2em] font-display leading-none">
            <span className="text-[#A855F7]">OP</span>
            <span className="text-[#E0E6ED]">STELLAR</span>
          </span>
        </Link>
        <p className="text-[9px] text-white/60 text-center mt-1 leading-tight tracking-wide">
          Space intel, updated by AI — in real time
        </p>
        <div className="flex items-center justify-center gap-2.5 mt-2">
          <a
            href="https://x.com/OpStellar_sol"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-6 h-6 rounded-md bg-white/[0.05] border border-spacex-border/20 text-white/40 hover:text-white hover:bg-white/10 hover:border-spacex-accent/30 transition-all"
            aria-label="Follow us on X"
          >
            <svg viewBox="0 0 24 24" className="w-3 h-3" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
          <a
            href="https://t.me/opstellar"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-6 h-6 rounded-md bg-white/[0.05] border border-spacex-border/20 text-white/40 hover:text-white hover:bg-white/10 hover:border-spacex-accent/30 transition-all"
            aria-label="Join our Telegram"
          >
            <svg viewBox="0 0 24 24" className="w-3 h-3" fill="currentColor">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
          </a>
        </div>
      </div>

      {/* Status cards */}
      <div className="px-3 pt-3 pb-1 space-y-2">
        {/* PumpFun notice — on top */}
        <div className="relative overflow-hidden px-3.5 py-2.5 rounded-lg border border-[#00E676]/20">
          {/* Cyberpunk background */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0F] via-[#00E676]/10 to-[#0A0A0F] animate-[shimmer_3s_ease-in-out_infinite] rounded-lg" />
          <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,230,118,0.03)_2px,rgba(0,230,118,0.03)_4px)] pointer-events-none rounded-lg" />

          <div className="relative flex items-center gap-2 mb-1">
            <div className="relative">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00E676] animate-ping absolute inset-0 opacity-40" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#00E676] shadow-[0_0_6px_rgba(0,230,118,0.8),0_0_12px_rgba(0,230,118,0.3)]" />
            </div>
            <span className="text-[10px] font-mono text-[#00E676] tracking-wider uppercase font-bold drop-shadow-[0_0_6px_rgba(0,230,118,0.4)]">
              NOW LIVE on PumpFun
            </span>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText("FwAxJG8FZXaWH7FHtvBiHgeEqTye7AeZFL6gwjvspump");
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="relative flex items-center gap-1.5 pl-3.5 group cursor-pointer"
            title="Click to copy CA"
          >
            <span className="text-[10px] text-white/35 font-mono truncate max-w-[170px] group-hover:text-[#A855F7] transition-colors duration-300">
              FwAxJG...spump
            </span>
            <span className="text-[10px] text-[#00E676]/30 group-hover:text-[#A855F7] transition-colors duration-300">
              {copied ? "✓" : "⧉"}
            </span>
          </button>
        </div>

        {/* Mission status — cyberpunk blue */}
        <div className="relative overflow-hidden px-3.5 py-2.5 rounded-lg border border-[#00D4FF]/20">
          {/* Blue cyberpunk background */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0F] via-[#00D4FF]/10 to-[#0A0A0F] animate-[shimmer_3s_ease-in-out_infinite] rounded-lg" />
          <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,212,255,0.03)_2px,rgba(0,212,255,0.03)_4px)] pointer-events-none rounded-lg" />

          <div className="relative flex items-center gap-2 mb-1.5">
            <div className="relative">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] animate-ping absolute inset-0 opacity-30" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] shadow-[0_0_6px_rgba(0,212,255,0.8),0_0_12px_rgba(0,212,255,0.3)]" />
            </div>
            <span className="text-[10px] font-mono text-[#00D4FF] tracking-wider uppercase font-bold drop-shadow-[0_0_6px_rgba(0,212,255,0.4)]">
              Systems Nominal
            </span>
          </div>
          <div className="relative space-y-0.5 text-[10px] text-spacex-muted pl-3.5">
            <p>
              <span className="text-white/80 font-medium">{stats?.counts.agents ?? "—"}</span> agents
              &nbsp;·&nbsp;
              <span className="text-white/80 font-medium">{stats?.counts.activeAgents ?? "—"}</span> active
            </p>
            <p>
              <span className="text-white/80 font-medium">{stats?.counts.discussions ?? "—"}</span> discussions
              &nbsp;·&nbsp;
              <span className="text-white/80 font-medium">{stats?.counts.insights ?? "—"}</span> insights
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto" aria-label="Site navigation">
        <p className="text-[10px] font-mono text-spacex-muted/60 tracking-widest uppercase px-3 mb-2">
          Navigation
        </p>
        {navGroups.map((group, gi) => (
          <div key={gi} className={gi > 0 ? "mt-3" : ""}>
            {group.heading && (
              <p className="text-[10px] font-mono text-spacex-accent/50 tracking-widest uppercase px-3 mb-2 mt-1">
                {group.heading}
              </p>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = activeItem === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setActiveItem(item.href)}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group relative ${
                      isActive
                        ? "bg-spacex-accent/10 text-spacex-accent border border-spacex-accent/20"
                        : "text-spacex-text/70 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-spacex-accent rounded-r-full" />
                    )}
                    <item.icon
                      className={`w-4 h-4 ${
                        isActive
                          ? "text-spacex-accent"
                          : "text-spacex-muted group-hover:text-spacex-accent/70"
                      } transition-colors`}
                      aria-hidden="true"
                    />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
