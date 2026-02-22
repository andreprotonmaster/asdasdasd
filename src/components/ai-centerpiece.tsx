"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Zap, Target, ArrowUp } from "lucide-react";
import { getDashboardStats } from "@/lib/api";

/* ─── Helpers ─── */
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

interface NeuronNode {
  id: number;
  cx: number;
  cy: number;
  r: number;
  layer: number;
  pulseDelay: number;
}

interface Synapse {
  from: NeuronNode;
  to: NeuronNode;
  delay: number;
}

function generateNetwork(): { neurons: NeuronNode[]; synapses: Synapse[] } {
  const rng = seededRandom(42);
  const layers = [
    { y: 50, count: 4, r: 7 },   // Input
    { y: 140, count: 7, r: 8 },  // Hidden 1
    { y: 230, count: 9, r: 9 },  // Core (largest)
    { y: 320, count: 7, r: 8 },  // Hidden 2
    { y: 410, count: 4, r: 7 },  // Output
  ];

  const neurons: NeuronNode[] = [];
  let id = 0;
  for (let li = 0; li < layers.length; li++) {
    const l = layers[li];
    const spacing = 540 / (l.count + 1);
    for (let ni = 0; ni < l.count; ni++) {
      neurons.push({
        id: id++,
        cx: 30 + spacing * (ni + 1),
        cy: l.y + (rng() * 20 - 10),
        r: l.r,
        layer: li,
        pulseDelay: rng() * 3,
      });
    }
  }

  // Connect adjacent layers
  const synapses: Synapse[] = [];
  for (let li = 0; li < layers.length - 1; li++) {
    const from = neurons.filter((n) => n.layer === li);
    const to = neurons.filter((n) => n.layer === li + 1);
    for (const f of from) {
      // Connect to ~60% of next layer
      for (const t of to) {
        if (rng() < 0.6) {
          synapses.push({ from: f, to: t, delay: rng() * 4 });
        }
      }
    }
  }

  return { neurons, synapses };
}

/* ─── Data flow particles along synapses ─── */
function DataParticle({ synapse, index }: { synapse: Synapse; index: number }) {
  const dur = 1.8 + (index % 3) * 0.4;
  const delay = synapse.delay + index * 0.7;
  return (
    <motion.circle
      cx={synapse.from.cx}
      cy={synapse.from.cy}
      r={1.5}
      fill="#D4A843"
      initial={{ opacity: 0 }}
      animate={{
        cx: [synapse.from.cx, synapse.to.cx],
        cy: [synapse.from.cy, synapse.to.cy],
        opacity: [0, 0.9, 0],
      }}
      transition={{
        duration: dur,
        delay,
        repeat: Infinity,
        repeatDelay: 2 + (index % 4),
        ease: "easeInOut",
      }}
    />
  );
}

/* ─── Main Component ─── */
export function AICenterpiece() {
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

  const { neurons, synapses } = useMemo(() => generateNetwork(), []);

  // Select a subset of synapses for data particles
  const particleSynapses = useMemo(
    () => synapses.filter((_, i) => i % 3 === 0),
    [synapses]
  );

  return (
    <div className="relative glass-panel p-6 lg:p-8 overflow-hidden h-full flex flex-col items-center justify-start pt-14 lg:pt-16 hud-corners">
      {/* Multi-layer background glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-spacex-accent/[0.03] via-transparent to-spacex-purple/[0.03] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-spacex-accent/[0.05] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[400px] bg-spacex-accent/[0.03] rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-spacex-purple/[0.04] rounded-full blur-[80px] pointer-events-none" />

      {/* Floating data particles in background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[
          { x: "10%", y: "15%", d: 0.2, s: 1.5 },
          { x: "90%", y: "10%", d: 1.0, s: 0.9 },
          { x: "5%", y: "50%", d: 2.0, s: 1.2 },
          { x: "93%", y: "40%", d: 0.5, s: 1.6 },
          { x: "8%", y: "80%", d: 1.8, s: 0.7 },
          { x: "88%", y: "75%", d: 0.3, s: 1.3 },
          { x: "30%", y: "90%", d: 2.2, s: 1.0 },
          { x: "70%", y: "88%", d: 1.4, s: 1.1 },
          { x: "50%", y: "5%", d: 0.8, s: 0.8 },
          { x: "20%", y: "30%", d: 1.6, s: 1.4 },
        ].map((p, i) => (
          <motion.div
            key={i}
            className="absolute w-[2px] h-[2px] bg-spacex-accent rounded-full"
            style={{ left: p.x, top: p.y }}
            animate={{ opacity: [0.1, 0.7, 0.1], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: p.s + 1.5, repeat: Infinity, delay: p.d }}
          />
        ))}
      </div>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-2 relative z-10"
      >
        <p className="text-[10px] font-mono text-spacex-accent/80 tracking-[0.3em] uppercase mb-2">
          Collective Signal Processing
        </p>
        <h2 className="font-display text-3xl lg:text-4xl font-bold text-white text-glow-accent">
          HIVE CORTEX
        </h2>
        <p className="text-white/60 text-sm mt-1">
          Distributed Agent Mesh
        </p>
      </motion.div>

      {/* Neural Network SVG */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative z-10 flex-1 flex items-center justify-center -mt-10"
      >
        <svg
          viewBox="0 0 560 440"
          className="w-full max-w-[700px] lg:max-w-[780px] h-auto"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Glow filter for neurons */}
            <filter id="neuronGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Pulse glow for active neurons */}
            <filter id="pulseGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="8" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Subtle glow for synapses */}
            <filter id="synapseGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.5" />
            </filter>
            {/* Radial gradient for core brain */}
            <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#D4A843" stopOpacity="0.15" />
              <stop offset="50%" stopColor="#D4A843" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#D4A843" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="neuronFill" cx="40%" cy="35%" r="60%">
              <stop offset="0%" stopColor="#A78BFA" />
              <stop offset="60%" stopColor="#D4A843" />
              <stop offset="100%" stopColor="#1A1A28" />
            </radialGradient>
            <radialGradient id="neuronCore" cx="40%" cy="35%" r="60%">
              <stop offset="0%" stopColor="#D4A843" />
              <stop offset="40%" stopColor="#2DD4A8" />
              <stop offset="100%" stopColor="#D4A843" />
            </radialGradient>
          </defs>

          {/* Central brain glow */}
          <ellipse cx="300" cy="230" rx="240" ry="180" fill="url(#coreGlow)" />

          {/* Synapses (connections) */}
          {synapses.map((s, i) => (
            <motion.line
              key={`syn-${i}`}
              x1={s.from.cx}
              y1={s.from.cy}
              x2={s.to.cx}
              y2={s.to.cy}
              stroke="#D4A843"
              strokeWidth={0.6}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.05, 0.2, 0.05] }}
              transition={{
                duration: 3 + (i % 3),
                delay: s.delay * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}

          {/* Glowing synapse highlights (subset) */}
          {synapses
            .filter((_, i) => i % 5 === 0)
            .map((s, i) => (
              <motion.line
                key={`glow-${i}`}
                x1={s.from.cx}
                y1={s.from.cy}
                x2={s.to.cx}
                y2={s.to.cy}
                stroke="#D4A843"
                strokeWidth={2}
                filter="url(#synapseGlow)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.4, 0] }}
                transition={{
                  duration: 2,
                  delay: s.delay + 1,
                  repeat: Infinity,
                  repeatDelay: 3,
                  ease: "easeInOut",
                }}
              />
            ))}

          {/* Data flow particles */}
          {particleSynapses.map((s, i) => (
            <DataParticle key={`dp-${i}`} synapse={s} index={i} />
          ))}

          {/* Neurons */}
          {neurons.map((n) => (
            <g key={n.id}>
              {/* Outer pulse ring */}
              <motion.circle
                cx={n.cx}
                cy={n.cy}
                r={n.r + 4}
                fill="none"
                stroke="#D4A843"
                strokeWidth={0.5}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.4, 0], r: [n.r + 2, n.r + 10, n.r + 2] }}
                transition={{
                  duration: 3,
                  delay: n.pulseDelay + 1,
                  repeat: Infinity,
                  repeatDelay: 2,
                  ease: "easeOut",
                }}
              />
              {/* Glow halo */}
              <circle
                cx={n.cx}
                cy={n.cy}
                r={n.r + 2}
                fill="none"
                stroke="#D4A843"
                strokeWidth={0.3}
                opacity={0.15}
              />
              {/* Main neuron body */}
              <motion.circle
                cx={n.cx}
                cy={n.cy}
                r={n.r}
                fill="url(#neuronFill)"
                filter="url(#neuronGlow)"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{
                  duration: 2 + n.pulseDelay * 0.3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              {/* Inner bright core */}
              <circle
                cx={n.cx - n.r * 0.15}
                cy={n.cy - n.r * 0.15}
                r={n.r * 0.4}
                fill="url(#neuronCore)"
                opacity={0.8}
              />
            </g>
          ))}

          {/* Core brain neuron — center highlight */}
          <motion.circle
            cx={300}
            cy={230}
            r={18}
            fill="none"
            stroke="#D4A843"
            strokeWidth={1}
            filter="url(#pulseGlow)"
            animate={{ opacity: [0.2, 0.6, 0.2], r: [16, 22, 16] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.circle
            cx={300}
            cy={230}
            r={30}
            fill="none"
            stroke="#D4A843"
            strokeWidth={0.5}
            animate={{ opacity: [0.05, 0.2, 0.05], r: [28, 38, 28] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          />

          {/* Layer labels */}
          {[
            { y: 35, label: "INPUT" },
            { y: 125, label: "ENCODE" },
            { y: 215, label: "REASON" },
            { y: 305, label: "DECODE" },
            { y: 395, label: "OUTPUT" },
          ].map((l, i) => (
            <motion.text
              key={`lbl-${i}`}
              x={575}
              y={l.y}
              fill="#D4A843"
              fontSize={8}
              fontFamily="monospace"
              opacity={0.3}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              transition={{ delay: 0.5 + i * 0.1 }}
            >
              {l.label}
            </motion.text>
          ))}
        </svg>

        {/* Thought orbiting rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <motion.div
            className="w-[300px] h-[300px] lg:w-[380px] lg:h-[380px] rounded-full border border-spacex-accent/[0.08]"
            style={{ borderStyle: "dashed" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-spacex-accent rounded-full shadow-glow-blue" />
            <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-1.5 h-1.5 bg-spacex-purple rounded-full" />
          </motion.div>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <motion.div
            className="w-[220px] h-[220px] lg:w-[280px] lg:h-[280px] rounded-full border border-spacex-purple/[0.08]"
            style={{ borderStyle: "dashed" }}
            animate={{ rotate: -360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          >
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-spacex-accent rounded-full" />
          </motion.div>
        </div>
      </motion.div>

      {/* Bottom HUD stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-4 left-4 right-4 flex justify-between items-end z-10"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ArrowUp className="w-3 h-3 text-spacex-accent" />
            <span className="text-[10px] font-mono text-spacex-muted">AGENTS</span>
          </div>
          <p className="text-lg font-mono font-bold text-white">
            {agentCount} <span className="text-xs text-spacex-muted">online</span>
          </p>
        </div>
        <div className="space-y-1 text-center">
          <div className="flex items-center gap-2 justify-center">
            <Zap className="w-3 h-3 text-spacex-thrust" />
            <span className="text-[10px] font-mono text-spacex-muted">SYNAPSES</span>
          </div>
          <p className="text-lg font-mono font-bold text-white">
            {messageCount.toLocaleString()} <span className="text-xs text-spacex-muted">fired</span>
          </p>
        </div>
        <div className="space-y-1 text-right">
          <div className="flex items-center gap-2 justify-end">
            <Target className="w-3 h-3 text-spacex-success" />
            <span className="text-[10px] font-mono text-spacex-muted">INSIGHTS</span>
          </div>
          <p className="text-lg font-mono font-bold text-spacex-success">
            {insightCount}
          </p>
        </div>
      </motion.div>

      {/* Corner labels */}
      <div className="absolute top-4 left-4 z-10">
        <p className="text-[9px] font-mono text-spacex-accent/50 tracking-widest">
          SWARM // HIVE CORTEX v2
        </p>
      </div>
      <div className="absolute top-4 right-4 z-10">
        <p className="text-[9px] font-mono text-spacex-accent/50 tracking-widest">
          ELONAGENTS // HIVE CORTEX
        </p>
      </div>
    </div>
  );
}
