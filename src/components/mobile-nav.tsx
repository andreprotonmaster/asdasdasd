"use client";

import { Rocket, MessageSquare, Users, Newspaper, Radio, Cpu, Globe, Satellite, FileText, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const mainNavItems = [
  { icon: Rocket, label: "Control", href: "/" },
  { icon: MessageSquare, label: "Comms", href: "/comms" },
  { icon: Users, label: "Crew", href: "/crew" },
  { icon: Newspaper, label: "Articles", href: "/articles" },
  { icon: Radio, label: "Live", href: "/live" },
];

const moreNavItems = [
  { icon: Satellite, label: "Missions", href: "/missions" },
  { icon: FileText, label: "ISS Reports", href: "/iss-reports" },
  { icon: Cpu, label: "Systems", href: "/systems" },
  { icon: Globe, label: "Starlink", href: "/starlink" },
];

export function MobileNav() {
  const [active, setActive] = useState("/");
  const [showMore, setShowMore] = useState(false);

  const isMoreActive = moreNavItems.some((item) => item.href === active);

  return (
    <>
      {/* More menu overlay */}
      {showMore && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowMore(false)}
          aria-hidden="true"
        />
      )}

      {/* More menu popup */}
      {showMore && (
        <div className="fixed bottom-[4.5rem] left-4 right-4 z-50 glass-panel-strong p-3 rounded-xl border border-spacex-border/50 space-y-1" role="menu" aria-label="Additional navigation">
          {moreNavItems.map((item) => {
            const isActive = active === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  setActive(item.href);
                  setShowMore(false);
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? "text-spacex-accent bg-spacex-accent/10"
                    : "text-spacex-muted hover:text-white hover:bg-white/5"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}

      {/* Bottom nav bar */}
      <div className="mobile-nav fixed bottom-0 left-0 right-0 z-50 glass-panel-strong border-t border-spacex-border/50 px-1 py-2 items-center justify-around" role="navigation" aria-label="Mobile navigation">
        {mainNavItems.map((item) => {
          const isActive = active === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => { setActive(item.href); setShowMore(false); }}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-all ${
                isActive
                  ? "text-spacex-accent"
                  : "text-spacex-muted hover:text-white"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[9px] font-medium">{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setShowMore(!showMore)}
          aria-expanded={showMore}
          aria-label="More navigation options"
          className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-all ${
            showMore || isMoreActive
              ? "text-spacex-accent"
              : "text-spacex-muted hover:text-white"
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[9px] font-medium">More</span>
        </button>
      </div>
    </>
  );
}
