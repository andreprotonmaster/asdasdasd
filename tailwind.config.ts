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
          black: "#05050A",
          dark: "#0A0A12",
          panel: "#10101A",
          border: "#1C1C2A",
          accent: "#D4A843",
          accentDim: "#B08A30",
          purple: "#A78BFA",
          purpleDim: "#7C5FD3",
          cyan: "#2DD4A8",
          cyanLight: "#5EECC0",
          thrust: "#FF6B2C",
          thrustGlow: "#FF8F5C",
          success: "#00E676",
          warning: "#FFD600",
          danger: "#FF3D3D",
          muted: "#52526A",
          text: "#B8C0D0",
          heading: "#ECEAF2",
          mars: "#D4532B",
          starship: "#8A8AA0",
        },
      },
      fontFamily: {
        mono: ["var(--font-jetbrains-mono)", "Fira Code", "monospace"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-orbitron)", "sans-serif"],
        brand: ["var(--font-sora)", "system-ui", "sans-serif"],
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
        "glow-blue": "0 0 20px rgba(212, 168, 67, 0.15), 0 0 40px rgba(212, 168, 67, 0.05)",
        "glow-thrust": "0 0 30px rgba(255, 107, 44, 0.4)",
        "glow-success": "0 0 20px rgba(0, 230, 118, 0.3)",
        "panel": "0 4px 30px rgba(0, 0, 0, 0.5)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
