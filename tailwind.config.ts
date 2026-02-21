import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        spacex: {
          black: "#0A0A0F",
          dark: "#111118",
          panel: "#16161F",
          border: "#1E1E2A",
          accent: "#00D4FF",
          accentDim: "#00A3CC",
          purple: "#A855F7",
          purpleDim: "#7C3AED",
          cyan: "#22D3EE",
          cyanLight: "#67E8F9",
          thrust: "#FF6B2C",
          thrustGlow: "#FF8F5C",
          success: "#00E676",
          warning: "#FFD600",
          danger: "#FF3D3D",
          muted: "#6B7280",
          text: "#E0E6ED",
          heading: "#FFFFFF",
          mars: "#D4532B",
          starship: "#A8C6FA",
        },
      },
      fontFamily: {
        mono: ["var(--font-jetbrains-mono)", "Fira Code", "monospace"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-orbitron)", "sans-serif"],
      },
      animation: {
        "float": "float 6s ease-in-out infinite",
        "float-slow": "float-slow 8s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "thrust-burn": "thrust-burn 0.3s ease-in-out infinite",
        "slide-up": "slide-up 0.4s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
        "orbit": "orbit 20s linear infinite",
        "spin-slow": "spin 12s linear infinite",
        "twinkle": "twinkle 3s ease-in-out infinite",
        "data-stream": "data-stream 2s linear infinite",
        "scan-line": "scan-line 3s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.4", filter: "blur(20px)" },
          "50%": { opacity: "0.8", filter: "blur(30px)" },
        },
        "thrust-burn": {
          "0%, 100%": { opacity: "0.8", transform: "scaleY(1)" },
          "50%": { opacity: "1", transform: "scaleY(1.1)" },
        },
        "slide-up": {
          "0%": { transform: "translateY(16px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        orbit: {
          "0%": { transform: "rotate(0deg) translateX(200px) rotate(0deg)" },
          "100%": { transform: "rotate(360deg) translateX(200px) rotate(-360deg)" },
        },
        twinkle: {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "1" },
        },
        "data-stream": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        "scan-line": {
          "0%": { top: "0%" },
          "100%": { top: "100%" },
        },
      },
      boxShadow: {
        "glow-blue": "0 0 20px rgba(0, 163, 255, 0.3)",
        "glow-thrust": "0 0 30px rgba(255, 107, 44, 0.4)",
        "glow-success": "0 0 20px rgba(0, 230, 118, 0.3)",
        "panel": "0 4px 30px rgba(0, 0, 0, 0.5)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
