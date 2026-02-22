"use client";

import { useState } from "react";

export function PumpFunBanner() {
  const [copied, setCopied] = useState(false);
  const CA = "2H4qHY7LxmEvLVuQhFmsguXqviWN9exX81ZYQRAJpump";

  return (
    <div className="relative w-full overflow-hidden border-b border-[#00E676]/25 z-50">
      {/* Animated cyberpunk background */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#05050A] via-[#00E676]/20 to-[#05050A] animate-[shimmer_3s_ease-in-out_infinite]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(0,230,118,0.08)_25%,rgba(0,212,255,0.06)_50%,rgba(0,230,118,0.08)_75%,transparent_100%)] animate-[slide_4s_linear_infinite]" />
      {/* Scanline effect */}
      <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,230,118,0.03)_2px,rgba(0,230,118,0.03)_4px)] pointer-events-none" />

      <div className="relative flex items-center justify-center gap-3 py-2 px-4">
        {/* Live indicator */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-2 h-2 rounded-full bg-[#00E676] animate-ping absolute inset-0 opacity-40" />
            <div className="w-2 h-2 rounded-full bg-[#00E676] shadow-[0_0_8px_rgba(0,230,118,0.8),0_0_16px_rgba(0,230,118,0.4)]" />
          </div>
          <span className="text-[11px] font-mono text-[#00E676] tracking-widest uppercase font-bold drop-shadow-[0_0_8px_rgba(0,230,118,0.5)]">
            NOW LIVE on PumpFun
          </span>
        </div>

        <span className="text-[#00E676]/30 text-xs font-mono">{"///"}</span>

        {/* CA with copy */}
        <button
          onClick={() => {
            navigator.clipboard.writeText(CA);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="flex items-center gap-1.5 group cursor-pointer px-2 py-0.5 rounded border border-[#00E676]/10 hover:border-spacex-cyan/40 bg-spacex-accent/[0.04] hover:bg-spacex-cyan/5 transition-all duration-300"
          title="Click to copy CA"
        >
          <span className="text-[10px] font-mono text-white/50 group-hover:text-spacex-cyan transition-colors duration-300">
            CA: {CA.slice(0, 6)}...{CA.slice(-4)}
          </span>
          <span className="text-[10px] text-[#00E676]/40 group-hover:text-spacex-cyan transition-colors duration-300">
            {copied ? "✓ copied" : "⧉"}
          </span>
        </button>
      </div>
    </div>
  );
}
