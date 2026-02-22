"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Rocket, Home, ArrowLeft, Satellite, AlertTriangle } from "lucide-react";

export default function NotFound() {
  const [stars, setStars] = useState<{ x: number; y: number; size: number; delay: number }[]>([]);

  useEffect(() => {
    setStars(
      Array.from({ length: 60 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 0.5,
        delay: Math.random() * 3,
      }))
    );
  }, []);

  return (
    <div className="min-h-screen bg-spacex-dark flex items-center justify-center relative overflow-hidden">
      {/* Starfield */}
      {stars.map((star, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
          }}
          animate={{ opacity: [0.1, 0.8, 0.1] }}
          transition={{ duration: 2 + star.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      {/* Subtle grid overlay */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }} />

      {/* Radial glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-spacex-accent/5 rounded-full blur-[120px]" />

      <div className="relative z-10 text-center px-6 max-w-lg">
        {/* Floating satellite */}
        <motion.div
          animate={{ y: [-8, 8, -8], rotate: [-5, 5, -5] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="mb-8 inline-block"
        >
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-spacex-accent/5 border border-spacex-accent/10 flex items-center justify-center mx-auto">
              <Satellite className="w-12 h-12 text-spacex-accent/40" />
            </div>
            <motion.div
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-spacex-thrust/10 border border-spacex-thrust/20 flex items-center justify-center"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <AlertTriangle className="w-3 h-3 text-spacex-thrust" />
            </motion.div>
          </div>
        </motion.div>

        {/* Error code */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="font-mono text-[10px] tracking-[0.3em] text-spacex-thrust/60 uppercase mb-3 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-spacex-thrust animate-pulse" />
            Signal Lost
          </div>
          <h1 className="font-display text-7xl font-black text-white mb-2 tracking-tight">
            4<span className="text-spacex-accent">0</span>4
          </h1>
          <p className="text-spacex-muted text-sm font-mono mb-2">
            TRAJECTORY_NOT_FOUND
          </p>
        </motion.div>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-spacex-text/50 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
            The requested coordinates don&apos;t match any known trajectory in our navigation system. 
            The page may have been deorbited or relocated.
          </p>
        </motion.div>

        {/* Telemetry box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-panel p-4 rounded-lg mb-8 text-left max-w-xs mx-auto"
        >
          <div className="text-[9px] font-mono text-spacex-accent tracking-widest uppercase mb-2">
            Telemetry Log
          </div>
          <div className="space-y-1.5 font-mono text-[11px]">
            <div className="flex justify-between">
              <span className="text-spacex-muted">Status</span>
              <span className="text-spacex-thrust">NOT FOUND</span>
            </div>
            <div className="flex justify-between">
              <span className="text-spacex-muted">Code</span>
              <span className="text-white">404</span>
            </div>
            <div className="flex justify-between">
              <span className="text-spacex-muted">Mission</span>
              <span className="text-spacex-text/60">Page Recovery</span>
            </div>
            <div className="flex justify-between">
              <span className="text-spacex-muted">Action</span>
              <span className="text-spacex-success">Return to base</span>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-center gap-3"
        >
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/[0.04] border border-spacex-border/30 text-sm text-spacex-text hover:text-white hover:bg-white/[0.08] hover:border-spacex-accent/20 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-spacex-accent/10 border border-spacex-accent/20 text-sm text-spacex-accent hover:bg-spacex-accent/20 transition-all"
          >
            <Home className="w-4 h-4" />
            ElonAgents Home
          </Link>
        </motion.div>

        {/* Bottom rocket animation */}
        <motion.div
          className="mt-12 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <motion.div
            animate={{ x: [-200, 200] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="flex items-center gap-1"
          >
            <div className="w-8 h-[1px] bg-gradient-to-r from-transparent to-spacex-accent/30" />
            <Rocket className="w-4 h-4 text-spacex-accent/30 -rotate-90" />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
