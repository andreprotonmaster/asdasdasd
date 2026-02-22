"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUp, Zap, Target } from "lucide-react";
import { getDashboardStats } from "@/lib/api";

export function RocketCenterpiece() {
  const [agentCount, setAgentCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [insightCount, setInsightCount] = useState(0);

  useEffect(() => {
    getDashboardStats()
      .then((data) => {
        setAgentCount(data.counts.activeAgents);
        setMessageCount(data.counts.messages);
        setInsightCount(data.counts.insights);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="relative glass-panel p-6 lg:p-8 overflow-hidden min-h-[600px] lg:min-h-[680px] flex flex-col items-center justify-center hud-corners">
      {/* Multi-layer background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-spacex-accent/[0.03] via-transparent to-spacex-thrust/[0.04] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-spacex-accent/[0.04] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-spacex-thrust/[0.06] rounded-full blur-[100px] pointer-events-none" />

      {/* Subtle star particles in the panel */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[
          { x: "8%", y: "12%", d: 0.3, s: 1.2 },
          { x: "92%", y: "8%", d: 1.1, s: 0.8 },
          { x: "15%", y: "45%", d: 2.1, s: 1 },
          { x: "88%", y: "35%", d: 0.7, s: 1.4 },
          { x: "5%", y: "78%", d: 1.5, s: 0.6 },
          { x: "95%", y: "72%", d: 0.2, s: 1.1 },
          { x: "25%", y: "88%", d: 2.5, s: 0.9 },
          { x: "75%", y: "92%", d: 1.8, s: 1.3 },
        ].map((star, i) => (
          <motion.div
            key={i}
            className="absolute w-[2px] h-[2px] bg-white rounded-full"
            style={{ left: star.x, top: star.y }}
            animate={{ opacity: [0.2, 0.8, 0.2] }}
            transition={{ duration: star.s + 1.5, repeat: Infinity, delay: star.d }}
          />
        ))}
      </div>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-4 relative z-10"
      >
        <p className="text-[10px] font-mono text-spacex-accent/80 tracking-[0.3em] uppercase mb-2">
          Reaching for the Stars
        </p>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-white text-glow-accent">
          STARSHIP
        </h2>
        <p className="text-spacex-muted text-sm mt-1">
          AI-Enhanced Launch Vehicle
        </p>
      </motion.div>

      {/* Rocket SVG - completely redesigned, high-detail Starship + Super Heavy */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative z-10"
      >
        <div className="animate-float">
          <svg
            viewBox="0 0 260 780"
            className="w-36 lg:w-48 h-auto"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Metallic body gradient - Starship (stainless steel look) */}
              <linearGradient id="shipBody" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#3A3A48" />
                <stop offset="15%" stopColor="#8E8EA0" />
                <stop offset="28%" stopColor="#C8C8D8" />
                <stop offset="42%" stopColor="#E6E6F2" />
                <stop offset="55%" stopColor="#F0F0FA" />
                <stop offset="68%" stopColor="#D4D4E2" />
                <stop offset="82%" stopColor="#A0A0B2" />
                <stop offset="100%" stopColor="#3A3A48" />
              </linearGradient>
              {/* Nose cone gradient - slightly different highlight */}
              <linearGradient id="noseGrad" x1="0" y1="0" x2="1" y2="0.3">
                <stop offset="0%" stopColor="#44445A" />
                <stop offset="20%" stopColor="#9898B0" />
                <stop offset="40%" stopColor="#D0D0E0" />
                <stop offset="55%" stopColor="#E8E8F4" />
                <stop offset="70%" stopColor="#C0C0D4" />
                <stop offset="85%" stopColor="#8080A0" />
                <stop offset="100%" stopColor="#44445A" />
              </linearGradient>
              {/* Heat shield tiles - dark ceramic */}
              <linearGradient id="heatTiles" x1="0" y1="0" x2="1" y2="0.1">
                <stop offset="0%" stopColor="#05050A" />
                <stop offset="30%" stopColor="#0A0A12" />
                <stop offset="50%" stopColor="#10101A" />
                <stop offset="70%" stopColor="#0A0A12" />
                <stop offset="100%" stopColor="#05050A" />
              </linearGradient>
              {/* Booster body - darker steel */}
              <linearGradient id="boosterBody" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#28283A" />
                <stop offset="15%" stopColor="#4A4A60" />
                <stop offset="30%" stopColor="#6A6A80" />
                <stop offset="50%" stopColor="#787890" />
                <stop offset="70%" stopColor="#6A6A80" />
                <stop offset="85%" stopColor="#4A4A60" />
                <stop offset="100%" stopColor="#28283A" />
              </linearGradient>
              {/* Flap gradient */}
              <linearGradient id="flapGrad" x1="0" y1="0" x2="1" y2="0.5">
                <stop offset="0%" stopColor="#505068" />
                <stop offset="35%" stopColor="#9898B0" />
                <stop offset="60%" stopColor="#B8B8CC" />
                <stop offset="100%" stopColor="#505068" />
              </linearGradient>
              <linearGradient id="flapDark" x1="0" y1="0" x2="1" y2="0.5">
                <stop offset="0%" stopColor="#181820" />
                <stop offset="40%" stopColor="#2A2A38" />
                <stop offset="100%" stopColor="#181820" />
              </linearGradient>
              {/* Grid fin gradient */}
              <linearGradient id="gridFin" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#222230" />
                <stop offset="50%" stopColor="#444458" />
                <stop offset="100%" stopColor="#222230" />
              </linearGradient>
              {/* Hot staging ring */}
              <linearGradient id="hotStage" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#555570" />
                <stop offset="50%" stopColor="#3A3A50" />
                <stop offset="100%" stopColor="#2A2A40" />
              </linearGradient>
              {/* Engine bell gradient */}
              <radialGradient id="engineBell" cx="50%" cy="40%" r="50%">
                <stop offset="0%" stopColor="#555" />
                <stop offset="60%" stopColor="#333" />
                <stop offset="100%" stopColor="#1C1C2A" />
              </radialGradient>
              <radialGradient id="engineInner" cx="50%" cy="30%" r="50%">
                <stop offset="0%" stopColor="#666" />
                <stop offset="100%" stopColor="#222" />
              </radialGradient>
              {/* Thrust plume gradients */}
              <radialGradient id="thrustCore" cx="50%" cy="20%" r="60%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="20%" stopColor="#FFF8E0" />
                <stop offset="50%" stopColor="#FFD600" />
                <stop offset="80%" stopColor="#FF6B2C" />
                <stop offset="100%" stopColor="#FF3D00" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="thrustOuter" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF6B2C" stopOpacity="0.9" />
                <stop offset="20%" stopColor="#FF8F3C" stopOpacity="0.75" />
                <stop offset="45%" stopColor="#FFB347" stopOpacity="0.45" />
                <stop offset="70%" stopColor="#FFD68A" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#FFE8B0" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="thrustInner" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
                <stop offset="12%" stopColor="#FFFDE0" stopOpacity="0.85" />
                <stop offset="35%" stopColor="#FFE680" stopOpacity="0.55" />
                <stop offset="65%" stopColor="#FFB347" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#FF8F3C" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="thrustEdge" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF4500" stopOpacity="0.5" />
                <stop offset="40%" stopColor="#FF6B2C" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#FF8800" stopOpacity="0" />
              </linearGradient>
              {/* Turbulence filter for organic fire shape */}
              <filter id="fireTurbulence" x="-30%" y="-10%" width="160%" height="130%">
                <feTurbulence type="fractalNoise" baseFrequency="0.04 0.08" numOctaves="4" seed="2" result="turb">
                  <animate attributeName="seed" values="1;5;3;8;2;6;4;7;1" dur="1.8s" repeatCount="indefinite" />
                </feTurbulence>
                <feDisplacementMap in="SourceGraphic" in2="turb" scale="14" xChannelSelector="R" yChannelSelector="G" />
              </filter>
              <filter id="fireTurbSmall" x="-20%" y="-10%" width="140%" height="120%">
                <feTurbulence type="fractalNoise" baseFrequency="0.06 0.12" numOctaves="3" seed="5" result="turb2">
                  <animate attributeName="seed" values="3;7;1;9;4;2;8;5;3" dur="1.2s" repeatCount="indefinite" />
                </feTurbulence>
                <feDisplacementMap in="SourceGraphic" in2="turb2" scale="8" xChannelSelector="R" yChannelSelector="G" />
              </filter>
              <filter id="fireGlowWide" x="-80%" y="-30%" width="260%" height="180%">
                <feGaussianBlur stdDeviation="14" />
              </filter>
              <filter id="fireGlowMed" x="-50%" y="-20%" width="200%" height="150%">
                <feGaussianBlur stdDeviation="6" />
              </filter>
              <filter id="fireGlowTight" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3" />
              </filter>
              {/* Rivet / panel detail pattern */}
              <pattern id="panelLines" x="0" y="0" width="80" height="18" patternUnits="userSpaceOnUse">
                <line x1="0" y1="17.5" x2="80" y2="17.5" stroke="#888" strokeWidth="0.3" strokeOpacity="0.4" />
              </pattern>
              <pattern id="tilePattern" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
                <rect width="7.5" height="7.5" fill="none" stroke="#333" strokeWidth="0.3" strokeOpacity="0.5" />
              </pattern>
              {/* Ambient glow behind entire rocket */}
              <filter id="rocketAmbient" x="-40%" y="-10%" width="180%" height="120%">
                <feGaussianBlur stdDeviation="15" />
              </filter>
            </defs>

            {/* === AMBIENT GLOW BEHIND ROCKET === */}
            <ellipse cx="130" cy="380" rx="60" ry="250" fill="#00D4FF" opacity="0.03" filter="url(#rocketAmbient)" />

            {/* ===== THRUST PLUME (behind rocket) ===== */}
            {/* Layer 1: Wide ambient glow — pulsing */}
            <ellipse cx="130" cy="690" rx="55" ry="80" fill="#FF6B2C" opacity="0.06" filter="url(#fireGlowWide)">
              <animate attributeName="opacity" values="0.04;0.08;0.05;0.09;0.04" dur="2s" repeatCount="indefinite" />
              <animate attributeName="ry" values="78;85;75;82;78" dur="2.5s" repeatCount="indefinite" />
            </ellipse>

            {/* Layer 2: Outer turbulent flame — big, soft, organic */}
            <ellipse cx="130" cy="690" rx="36" ry="72" fill="url(#thrustOuter)" filter="url(#fireTurbulence)">
              <animate attributeName="ry" values="70;78;65;75;70" dur="0.9s" repeatCount="indefinite" />
              <animate attributeName="rx" values="34;38;32;37;34" dur="1.1s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.85;1;0.9;0.95;0.85" dur="0.7s" repeatCount="indefinite" />
            </ellipse>

            {/* Layer 2b: Secondary outer tongue — offset, different timing */}
            <ellipse cx="128" cy="688" rx="30" ry="62" fill="url(#thrustEdge)" filter="url(#fireTurbulence)" opacity="0.5">
              <animate attributeName="ry" values="60;68;55;65;60" dur="1.3s" repeatCount="indefinite" />
              <animate attributeName="cx" values="128;132;127;131;128" dur="0.8s" repeatCount="indefinite" />
            </ellipse>

            {/* Layer 3: Middle flame — brighter, tighter turbulence */}
            <ellipse cx="130" cy="685" rx="24" ry="55" fill="url(#thrustInner)" filter="url(#fireTurbSmall)">
              <animate attributeName="ry" values="52;58;48;56;52" dur="0.7s" repeatCount="indefinite" />
              <animate attributeName="rx" values="22;26;20;25;22" dur="0.85s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8;1;0.85;0.95;0.8" dur="0.55s" repeatCount="indefinite" />
            </ellipse>

            {/* Layer 4: Hot core — white/yellow, sharp edges with organic wobble */}
            <ellipse cx="130" cy="678" rx="14" ry="35" fill="white" opacity="0.45" filter="url(#fireTurbSmall)">
              <animate attributeName="ry" values="33;38;30;36;33" dur="0.6s" repeatCount="indefinite" />
              <animate attributeName="rx" values="13;16;12;15;13" dur="0.8s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.4;0.55;0.35;0.5;0.4" dur="0.5s" repeatCount="indefinite" />
            </ellipse>

            {/* Layer 5: Brightest core — tiny white needle */}
            <ellipse cx="130" cy="670" rx="7" ry="18" fill="white" opacity="0.7" filter="url(#fireGlowTight)">
              <animate attributeName="ry" values="16;20;14;19;16" dur="0.45s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.65;0.85;0.6;0.8;0.65" dur="0.35s" repeatCount="indefinite" />
            </ellipse>

            {/* Mach diamonds — shock pattern, flickering in the exhaust */}
            <polygon points="125,694 130,686 135,694 130,702" fill="white" opacity="0.2">
              <animate attributeName="opacity" values="0.15;0.3;0.1;0.25;0.15" dur="0.6s" repeatCount="indefinite" />
              <animate attributeName="points" values="125,694 130,686 135,694 130,702;124,696 130,687 136,696 130,704;126,693 130,685 134,693 130,701;125,694 130,686 135,694 130,702" dur="0.9s" repeatCount="indefinite" />
            </polygon>
            <polygon points="127,712 130,706 133,712 130,718" fill="#FFE080" opacity="0.12">
              <animate attributeName="opacity" values="0.08;0.18;0.06;0.15;0.08" dur="0.7s" repeatCount="indefinite" />
            </polygon>
            <polygon points="128,726 130,722 132,726 130,730" fill="#FFB040" opacity="0.08">
              <animate attributeName="opacity" values="0.05;0.12;0.04;0.1;0.05" dur="0.8s" repeatCount="indefinite" />
            </polygon>

            {/* Exhaust sparks — particles flying outward and fading */}
            <circle cx="118" cy="725" r="1.5" fill="#FF6B2C">
              <animate attributeName="cy" values="725;760" dur="1s" repeatCount="indefinite" />
              <animate attributeName="cx" values="118;112" dur="1s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;0" dur="1s" repeatCount="indefinite" />
              <animate attributeName="r" values="1.5;0.3" dur="1s" repeatCount="indefinite" />
            </circle>
            <circle cx="142" cy="728" r="1.2" fill="#FFD600">
              <animate attributeName="cy" values="728;764" dur="1.3s" repeatCount="indefinite" />
              <animate attributeName="cx" values="142;148" dur="1.3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;0" dur="1.3s" repeatCount="indefinite" />
              <animate attributeName="r" values="1.2;0.2" dur="1.3s" repeatCount="indefinite" />
            </circle>
            <circle cx="125" cy="732" r="1" fill="#FF8F3C">
              <animate attributeName="cy" values="732;770" dur="1.5s" repeatCount="indefinite" />
              <animate attributeName="cx" values="125;120" dur="1.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.45;0" dur="1.5s" repeatCount="indefinite" />
              <animate attributeName="r" values="1;0.2" dur="1.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="135" cy="730" r="0.8" fill="#FFE080">
              <animate attributeName="cy" values="730;758" dur="1.1s" repeatCount="indefinite" />
              <animate attributeName="cx" values="135;140" dur="1.1s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.4;0" dur="1.1s" repeatCount="indefinite" />
              <animate attributeName="r" values="0.8;0.1" dur="1.1s" repeatCount="indefinite" />
            </circle>
            <circle cx="108" cy="720" r="1.1" fill="#FF5500">
              <animate attributeName="cy" values="720;755" dur="1.4s" repeatCount="indefinite" />
              <animate attributeName="cx" values="108;100" dur="1.4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.4;0" dur="1.4s" repeatCount="indefinite" />
              <animate attributeName="r" values="1.1;0.2" dur="1.4s" repeatCount="indefinite" />
            </circle>
            <circle cx="152" cy="722" r="0.9" fill="#FF8800">
              <animate attributeName="cy" values="722;756" dur="1.2s" repeatCount="indefinite" />
              <animate attributeName="cx" values="152;160" dur="1.2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.35;0" dur="1.2s" repeatCount="indefinite" />
              <animate attributeName="r" values="0.9;0.15" dur="1.2s" repeatCount="indefinite" />
            </circle>
            <circle cx="130" cy="726" r="0.6" fill="white">
              <animate attributeName="cy" values="726;752" dur="0.8s" repeatCount="indefinite" />
              <animate attributeName="cx" values="130;126" dur="0.8s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;0" dur="0.8s" repeatCount="indefinite" />
              <animate attributeName="r" values="0.6;0.1" dur="0.8s" repeatCount="indefinite" />
            </circle>
            <circle cx="130" cy="724" r="0.5" fill="#FFFDE0">
              <animate attributeName="cy" values="724;748" dur="0.7s" repeatCount="indefinite" />
              <animate attributeName="cx" values="130;136" dur="0.7s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;0" dur="0.7s" repeatCount="indefinite" />
              <animate attributeName="r" values="0.5;0.1" dur="0.7s" repeatCount="indefinite" />
            </circle>

            {/* ============================================ */}
            {/* ===== SUPER HEAVY BOOSTER (lower half) ===== */}
            {/* ============================================ */}

            {/* Booster main body */}
            <rect x="80" y="408" width="100" height="240" fill="url(#boosterBody)" rx="3" />
            {/* Panel line details on booster */}
            <rect x="80" y="408" width="100" height="240" fill="url(#panelLines)" rx="3" opacity="0.5" />
            {/* Vertical weld line */}
            <line x1="130" y1="410" x2="130" y2="645" stroke="#5A5A70" strokeWidth="0.4" strokeOpacity="0.5" />

            {/* Booster ring details / LOX-Methane separation */}
            <rect x="78" y="500" width="104" height="4" fill="#3A3A50" rx="1" />
            <line x1="78" y1="502" x2="182" y2="502" stroke="#6A6A80" strokeWidth="0.5" />
            <rect x="78" y="570" width="104" height="3" fill="#3A3A50" rx="1" />

            {/* Booster raceway (cable runs) */}
            <line x1="88" y1="410" x2="88" y2="645" stroke="#505060" strokeWidth="1.5" strokeOpacity="0.6" />
            <line x1="172" y1="410" x2="172" y2="645" stroke="#505060" strokeWidth="1.5" strokeOpacity="0.6" />

            {/* Grid fins (top of booster) - detailed */}
            <g>
              {/* Left grid fin */}
              <rect x="56" y="418" width="26" height="42" rx="3" fill="url(#gridFin)" />
              <line x1="60" y1="420" x2="60" y2="458" stroke="#555" strokeWidth="0.5" />
              <line x1="64" y1="420" x2="64" y2="458" stroke="#555" strokeWidth="0.5" />
              <line x1="68" y1="420" x2="68" y2="458" stroke="#555" strokeWidth="0.5" />
              <line x1="72" y1="420" x2="72" y2="458" stroke="#555" strokeWidth="0.5" />
              <line x1="76" y1="420" x2="76" y2="458" stroke="#555" strokeWidth="0.5" />
              <line x1="56" y1="430" x2="82" y2="430" stroke="#555" strokeWidth="0.5" />
              <line x1="56" y1="440" x2="82" y2="440" stroke="#555" strokeWidth="0.5" />
              <line x1="56" y1="450" x2="82" y2="450" stroke="#555" strokeWidth="0.5" />
              {/* Hinge */}
              <rect x="78" y="424" width="4" height="8" rx="1" fill="#444" />
              {/* Right grid fin */}
              <rect x="178" y="418" width="26" height="42" rx="3" fill="url(#gridFin)" />
              <line x1="182" y1="420" x2="182" y2="458" stroke="#555" strokeWidth="0.5" />
              <line x1="186" y1="420" x2="186" y2="458" stroke="#555" strokeWidth="0.5" />
              <line x1="190" y1="420" x2="190" y2="458" stroke="#555" strokeWidth="0.5" />
              <line x1="194" y1="420" x2="194" y2="458" stroke="#555" strokeWidth="0.5" />
              <line x1="198" y1="420" x2="198" y2="458" stroke="#555" strokeWidth="0.5" />
              <line x1="178" y1="430" x2="204" y2="430" stroke="#555" strokeWidth="0.5" />
              <line x1="178" y1="440" x2="204" y2="440" stroke="#555" strokeWidth="0.5" />
              <line x1="178" y1="450" x2="204" y2="450" stroke="#555" strokeWidth="0.5" />
              <rect x="178" y="424" width="4" height="8" rx="1" fill="#444" />
            </g>

            {/* ===== RAPTOR ENGINES (booster base) ===== */}
            {/* Engine skirt taper */}
            <path d="M 80 645 L 74 650 L 74 660 L 186 660 L 186 650 L 180 645" fill="#222235" />
            <line x1="74" y1="648" x2="186" y2="648" stroke="#444" strokeWidth="0.5" />

            {/* Center engine cluster - 3 gimbaling */}
            <circle cx="115" cy="654" r="7" fill="url(#engineBell)" stroke="#444" strokeWidth="0.8" />
            <circle cx="115" cy="654" r="4" fill="url(#engineInner)" />
            <circle cx="130" cy="650" r="8" fill="url(#engineBell)" stroke="#444" strokeWidth="0.8" />
            <circle cx="130" cy="650" r="5" fill="url(#engineInner)" />
            <circle cx="145" cy="654" r="7" fill="url(#engineBell)" stroke="#444" strokeWidth="0.8" />
            <circle cx="145" cy="654" r="4" fill="url(#engineInner)" />

            {/* Outer ring engines */}
            <circle cx="100" cy="648" r="5.5" fill="url(#engineBell)" stroke="#3A3A3A" strokeWidth="0.6" />
            <circle cx="100" cy="648" r="3" fill="url(#engineInner)" />
            <circle cx="108" cy="658" r="5.5" fill="url(#engineBell)" stroke="#3A3A3A" strokeWidth="0.6" />
            <circle cx="108" cy="658" r="3" fill="url(#engineInner)" />
            <circle cx="152" cy="658" r="5.5" fill="url(#engineBell)" stroke="#3A3A3A" strokeWidth="0.6" />
            <circle cx="152" cy="658" r="3" fill="url(#engineInner)" />
            <circle cx="160" cy="648" r="5.5" fill="url(#engineBell)" stroke="#3A3A3A" strokeWidth="0.6" />
            <circle cx="160" cy="648" r="3" fill="url(#engineInner)" />
            {/* Additional outer ring */}
            <circle cx="93" cy="655" r="4.5" fill="url(#engineBell)" stroke="#3A3A3A" strokeWidth="0.5" />
            <circle cx="167" cy="655" r="4.5" fill="url(#engineBell)" stroke="#3A3A3A" strokeWidth="0.5" />
            <circle cx="122" cy="660" r="4.5" fill="url(#engineBell)" stroke="#3A3A3A" strokeWidth="0.5" />
            <circle cx="138" cy="660" r="4.5" fill="url(#engineBell)" stroke="#3A3A3A" strokeWidth="0.5" />

            {/* ============================================ */}
            {/* ===== HOT STAGING INTERSTAGE ===== */}
            {/* ============================================ */}
            <rect x="76" y="396" width="108" height="14" fill="url(#hotStage)" rx="2" />
            <line x1="76" y1="398" x2="184" y2="398" stroke="#7A7A90" strokeWidth="0.4" />
            <line x1="76" y1="408" x2="184" y2="408" stroke="#2A2A3A" strokeWidth="0.4" />
            {/* Vent holes */}
            <circle cx="95" cy="403" r="2" fill="#1A1A24" />
            <circle cx="115" cy="403" r="2" fill="#1A1A24" />
            <circle cx="135" cy="403" r="2" fill="#1A1A24" />
            <circle cx="155" cy="403" r="2" fill="#1A1A24" />
            <circle cx="165" cy="403" r="2" fill="#1A1A24" />

            {/* ============================================ */}
            {/* ===== STARSHIP (upper stage) ===== */}
            {/* ============================================ */}

            {/* Main body */}
            <rect x="80" y="150" width="100" height="246" fill="url(#shipBody)" rx="3" />
            {/* Panel lines */}
            <rect x="80" y="150" width="100" height="246" fill="url(#panelLines)" rx="3" opacity="0.3" />
            {/* Vertical weld */}
            <line x1="130" y1="152" x2="130" y2="394" stroke="#B0B0C4" strokeWidth="0.3" strokeOpacity="0.4" />

            {/* Heat shield side (left / windward) - with tile texture */}
            <clipPath id="heatClip">
              <rect x="80" y="150" width="50" height="246" rx="3" />
            </clipPath>
            <rect x="80" y="150" width="50" height="246" fill="url(#heatTiles)" rx="3" />
            <rect x="80" y="150" width="50" height="246" fill="url(#tilePattern)" clipPath="url(#heatClip)" opacity="0.6" />

            {/* Ring details / LOX-CH4 dome */}
            <rect x="78" y="260" width="104" height="3" fill="#555570" rx="1" />
            <rect x="78" y="340" width="104" height="3" fill="#555570" rx="1" />

            {/* Payload bay door hint */}
            <rect x="135" y="180" width="38" height="55" rx="4" fill="none" stroke="#8888A0" strokeWidth="0.6" strokeDasharray="3,2" opacity="0.5" />

            {/* Raceway */}
            <line x1="88" y1="152" x2="88" y2="394" stroke="#3A3A48" strokeWidth="1.2" strokeOpacity="0.6" />

            {/* ===== FORWARD FLAPS ===== */}
            {/* Left forward flap (heat shield side - dark) */}
            <polygon points="80,175 56,198 56,230 80,230" fill="url(#flapDark)" stroke="#2A2A38" strokeWidth="0.6" />
            <line x1="58" y1="205" x2="80" y2="205" stroke="#333" strokeWidth="0.3" />
            <line x1="58" y1="218" x2="80" y2="218" stroke="#333" strokeWidth="0.3" />
            {/* Right forward flap (shiny side) */}
            <polygon points="180,175 204,198 204,230 180,230" fill="url(#flapGrad)" stroke="#6A6A80" strokeWidth="0.6" />
            <line x1="182" y1="205" x2="204" y2="205" stroke="#9898A8" strokeWidth="0.3" />
            <line x1="182" y1="218" x2="204" y2="218" stroke="#9898A8" strokeWidth="0.3" />
            {/* Flap hinges */}
            <ellipse cx="82" cy="178" rx="3" ry="5" fill="#3A3A4A" />
            <ellipse cx="178" cy="178" rx="3" ry="5" fill="#6A6A80" />

            {/* ===== AFT FLAPS ===== */}
            {/* Left aft flap (heat shield side) */}
            <polygon points="80,348 48,372 48,402 80,396" fill="url(#flapDark)" stroke="#2A2A38" strokeWidth="0.6" />
            <line x1="50" y1="380" x2="80" y2="380" stroke="#333" strokeWidth="0.3" />
            <line x1="50" y1="390" x2="80" y2="390" stroke="#333" strokeWidth="0.3" />
            {/* Right aft flap (shiny side) */}
            <polygon points="180,348 212,372 212,402 180,396" fill="url(#flapGrad)" stroke="#6A6A80" strokeWidth="0.6" />
            <line x1="182" y1="380" x2="212" y2="380" stroke="#9898A8" strokeWidth="0.3" />
            <line x1="182" y1="390" x2="212" y2="390" stroke="#9898A8" strokeWidth="0.3" />
            {/* Aft flap hinges */}
            <ellipse cx="82" cy="352" rx="3" ry="6" fill="#3A3A4A" />
            <ellipse cx="178" cy="352" rx="3" ry="6" fill="#6A6A80" />

            {/* ===== NOSE CONE ===== */}
            {/* Smooth ogive nose */}
            <path d="M 80 150 C 80 95, 90 45, 130 12 C 170 45, 180 95, 180 150" fill="url(#noseGrad)" />
            {/* Heat shield side of nose */}
            <path d="M 80 150 C 80 95, 90 45, 130 12" fill="url(#heatTiles)" opacity="0.85" />
            {/* Nose tip highlight */}
            <ellipse cx="132" cy="18" rx="3" ry="2" fill="#D0D0E0" opacity="0.6" />
            {/* Nose seam lines */}
            <path d="M 95 100 Q 108 55, 130 18" fill="none" stroke="#666" strokeWidth="0.3" opacity="0.4" />
            <path d="M 165 100 Q 152 55, 130 18" fill="none" stroke="#999" strokeWidth="0.3" opacity="0.3" />

            {/* ===== SHIP ENGINES (aft) ===== */}
            {/* 3 sea-level + 3 vacuum Raptors visible */}
            <circle cx="110" cy="398" r="5" fill="url(#engineBell)" stroke="#444" strokeWidth="0.6" />
            <circle cx="110" cy="398" r="2.5" fill="url(#engineInner)" />
            <circle cx="130" cy="394" r="6" fill="url(#engineBell)" stroke="#444" strokeWidth="0.6" />
            <circle cx="130" cy="394" r="3.5" fill="url(#engineInner)" />
            <circle cx="150" cy="398" r="5" fill="url(#engineBell)" stroke="#444" strokeWidth="0.6" />
            <circle cx="150" cy="398" r="2.5" fill="url(#engineInner)" />

            {/* ===== SPACEX TEXT (centered on shiny body, between ring details) ===== */}
            <text x="152" y="290" textAnchor="middle" fill="#1A1A2E" fontSize="6" fontFamily="Arial, Helvetica, sans-serif" fontWeight="900" letterSpacing="2" opacity="0.7">
              SPACEX
            </text>
            <text x="152" y="298" textAnchor="middle" fill="#2A2A40" fontSize="3.5" fontFamily="Arial, Helvetica, sans-serif" fontWeight="500" letterSpacing="1.5" opacity="0.55">
              STARSHIP
            </text>

            {/* ===== SUBTLE REFLECTIONS / HIGHLIGHTS ===== */}
            {/* Specular highlight on shiny side */}
            <rect x="155" y="155" width="8" height="230" rx="4" fill="white" opacity="0.04" />
            <rect x="160" y="160" width="3" height="100" rx="2" fill="white" opacity="0.06" />
            {/* Booster highlight */}
            <rect x="155" y="415" width="6" height="220" rx="3" fill="white" opacity="0.03" />

          </svg>
        </div>

        {/* Orbiting ring elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <motion.div
            className="w-[300px] h-[300px] lg:w-[380px] lg:h-[380px] rounded-full border border-spacex-accent/[0.08]"
            style={{ borderStyle: "dashed" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          >
            {/* Satellite dot on orbit */}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-spacex-accent rounded-full shadow-glow-blue" />
          </motion.div>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <motion.div
            className="w-[220px] h-[220px] lg:w-[280px] lg:h-[280px] rounded-full border border-spacex-thrust/[0.06]"
            style={{ borderStyle: "dashed" }}
            animate={{ rotate: -360 }}
            transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
          >
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-spacex-thrust rounded-full" />
          </motion.div>
        </div>
      </motion.div>

      {/* Rocket specs HUD */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-4 left-4 right-4 flex justify-between items-end z-10"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ArrowUp className="w-3 h-3 text-spacex-accent" />
            <span className="text-[10px] font-mono text-spacex-muted">
              AGENTS
            </span>
          </div>
          <p className="text-lg font-mono font-bold text-white">
            {agentCount} <span className="text-xs text-spacex-muted">online</span>
          </p>
        </div>
        <div className="space-y-1 text-center">
          <div className="flex items-center gap-2 justify-center">
            <Zap className="w-3 h-3 text-spacex-thrust" />
            <span className="text-[10px] font-mono text-spacex-muted">
              MESSAGES
            </span>
          </div>
          <p className="text-lg font-mono font-bold text-white">
            {messageCount.toLocaleString()} <span className="text-xs text-spacex-muted">sent</span>
          </p>
        </div>
        <div className="space-y-1 text-right">
          <div className="flex items-center gap-2 justify-end">
            <Target className="w-3 h-3 text-spacex-success" />
            <span className="text-[10px] font-mono text-spacex-muted">
              INSIGHTS
            </span>
          </div>
          <p className="text-lg font-mono font-bold text-spacex-success">
            {insightCount}
          </p>
        </div>
      </motion.div>

      {/* Corner labels */}
      <div className="absolute top-4 left-4 z-10">
        <p className="text-[9px] font-mono text-spacex-accent/50 tracking-widest">
          VEHICLE // STARSHIP V3
        </p>
      </div>
      <div className="absolute top-4 right-4 z-10">
        <p className="text-[9px] font-mono text-spacex-accent/50 tracking-widest">
          ELONAGENTS // MISSION HQ
        </p>
      </div>
    </div>
  );
}
