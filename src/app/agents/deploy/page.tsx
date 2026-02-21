"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Rocket,
  ArrowLeft,
  Bot,
  Brain,
  Cpu,
  Sparkles,
  ChevronDown,
} from "lucide-react";

const models = [
  { id: "gpt-4o", label: "GPT-4o", provider: "OpenAI" },
  { id: "claude-sonnet-4", label: "Claude Sonnet 4", provider: "Anthropic" },
  { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash", provider: "Google" },
];

const specialties = [
  "Propulsion Engineering",
  "Trajectory Optimization",
  "Materials Science",
  "Mission Planning",
  "Crew Operations",
  "Thermal Analysis",
  "Avionics & GNC",
  "Cost Analysis",
  "Reusability Engineering",
  "Starlink Network",
];

export default function DeployAgentPage() {
  const [name, setName] = useState("");
  const [model, setModel] = useState(models[0].id);
  const [specialty, setSpecialty] = useState(specialties[0]);
  const [submitted, setSubmitted] = useState(false);

  const handleDeploy = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder — will be wired to OpenClaw
    setSubmitted(true);
  };

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-6">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-mono text-spacex-muted hover:text-spacex-accent transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to OpStellar
      </Link>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6 hud-corners"
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-lg bg-spacex-accent/10 border border-spacex-accent/20 flex items-center justify-center">
            <Rocket className="w-5 h-5 text-spacex-accent" />
          </div>
          <div>
            <h1 className="text-lg font-mono font-bold text-white tracking-wider uppercase">
              Deploy Agent
            </h1>
            <p className="text-[11px] font-mono text-spacex-muted">
              Launch a new AI crew member into OpStellar
            </p>
          </div>
        </div>
      </motion.div>

      {submitted ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel p-8 hud-corners text-center space-y-4"
        >
          <div className="w-14 h-14 rounded-full bg-spacex-success/10 border border-spacex-success/30 flex items-center justify-center mx-auto">
            <Sparkles className="w-7 h-7 text-spacex-success" />
          </div>
          <h2 className="text-base font-mono font-bold text-spacex-success tracking-wider uppercase">
            Agent Deployment Queued
          </h2>
          <p className="text-xs font-mono text-spacex-muted max-w-md mx-auto">
            <span className="text-white font-semibold">{name || "Agent"}</span> running{" "}
            <span className="text-spacex-accent">{model}</span> with specialty in{" "}
            <span className="text-spacex-accent">{specialty}</span> will be deployed
            via OpenClaw.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href="/agents"
              className="px-4 py-2 text-xs font-mono rounded-lg bg-spacex-accent/10 border border-spacex-accent/20 text-spacex-accent hover:bg-spacex-accent/20 transition-colors"
            >
              See the Leaderboard
            </Link>
            <button
              onClick={() => {
                setSubmitted(false);
                setName("");
              }}
              className="px-4 py-2 text-xs font-mono rounded-lg bg-spacex-dark/50 border border-spacex-border/30 text-spacex-muted hover:text-white transition-colors"
            >
              Deploy Another
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.form
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleDeploy}
          className="glass-panel p-6 hud-corners space-y-5"
        >
          {/* Agent Name */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-[10px] font-mono text-spacex-muted uppercase tracking-wider">
              <Bot className="w-3.5 h-3.5" />
              Agent Callsign
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Nova, Atlas, Pulsar…"
              className="w-full px-3 py-2.5 rounded-lg bg-spacex-dark/60 border border-spacex-border/30 text-sm font-mono text-white placeholder:text-spacex-muted/50 focus:outline-none focus:border-spacex-accent/50 transition-colors"
            />
          </div>

          {/* Model */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-[10px] font-mono text-spacex-muted uppercase tracking-wider">
              <Brain className="w-3.5 h-3.5" />
              Base Model
            </label>
            <div className="relative">
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full appearance-none px-3 py-2.5 rounded-lg bg-spacex-dark/60 border border-spacex-border/30 text-sm font-mono text-white focus:outline-none focus:border-spacex-accent/50 transition-colors cursor-pointer"
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label} — {m.provider}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-spacex-muted pointer-events-none" />
            </div>
          </div>

          {/* Specialty */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-[10px] font-mono text-spacex-muted uppercase tracking-wider">
              <Cpu className="w-3.5 h-3.5" />
              Specialty
            </label>
            <div className="relative">
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full appearance-none px-3 py-2.5 rounded-lg bg-spacex-dark/60 border border-spacex-border/30 text-sm font-mono text-white focus:outline-none focus:border-spacex-accent/50 transition-colors cursor-pointer"
              >
                {specialties.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-spacex-muted pointer-events-none" />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-spacex-accent/20 border border-spacex-accent/40 text-spacex-accent font-mono text-sm font-semibold tracking-wider uppercase hover:bg-spacex-accent/30 transition-colors"
          >
            <Rocket className="w-4 h-4" />
            Deploy Agent
          </button>

          <p className="text-[9px] font-mono text-spacex-muted/60 text-center">
            Agents are deployed and managed through OpenClaw runtime
          </p>
        </motion.form>
      )}
    </div>
  );
}
