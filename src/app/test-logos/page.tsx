"use client";

import { useRef, useState, useCallback } from "react";

/*
  OpStellar — Final Brand Assets (Archivo Black)
  ────────────────────────────────────────────────
  Neon Glow Spectrum icon × Archivo Black wordmark.
  Favicon · One-liner · OG Image · Icon-only · Dark & Light.
  Download each asset as PNG or SVG.
*/

/* ── CONSTANTS ── */
const FONT = "'Archivo Black', 'Oswald', 'Inter', sans-serif";
const PURPLE = "#A855F7";
const CYAN = "#00D4FF";
const TEAL = "#22D3EE";
const LIGHT_CYAN = "#67E8F9";
const TEXT_WHITE = "#E0E6ED";
const DARK_BG = "#0A0A0F";
const DARK_TEXT = "#1a1a2e";

const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@400;700;800&display=swap";

/* ── FONT INLINING (fetches woff2, converts to base64 for self-contained SVG) ── */
let _fontCSSCache: string | null = null;

async function getInlineFontCSS(): Promise<string> {
  if (_fontCSSCache) return _fontCSSCache;
  try {
    const resp = await fetch(GOOGLE_FONTS_URL);
    const css = await resp.text();
    /* Replace every url(https://fonts.gstatic.com/...) with inline data URI */
    const urlRe = /url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g;
    let result = css;
    const matches: RegExpExecArray[] = [];
    let m: RegExpExecArray | null;
    while ((m = urlRe.exec(css)) !== null) matches.push(m);
    for (const m of matches) {
      const fontResp = await fetch(m[1]);
      const buf = await fontResp.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      const b64 = btoa(binary);
      const ext = m[1].includes(".woff2") ? "woff2" : "woff";
      result = result.replace(m[1], `data:font/${ext};base64,${b64}`);
    }
    _fontCSSCache = result;
    return result;
  } catch {
    return "/* font fetch failed — fallback to local */";
  }
}

/* ── DOWNLOAD HELPERS ── */

async function downloadSVG(svgEl: SVGSVGElement | null, filename: string) {
  if (!svgEl) return;
  const fontCSS = await getInlineFontCSS();
  const clone = svgEl.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
  /* Strip DOM-only styles/classes that can interfere with standalone rendering */
  clone.removeAttribute("style");
  clone.removeAttribute("class");
  const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
  style.textContent = fontCSS;
  clone.insertBefore(style, clone.firstChild);
  const svgData = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  triggerDownload(blob, filename);
}

async function downloadPNG(svgEl: SVGSVGElement | null, filename: string, scale = 4) {
  if (!svgEl) return;
  const fontCSS = await getInlineFontCSS();
  const clone = svgEl.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
  /* Strip DOM-only styles/classes that can interfere with rasterisation */
  clone.removeAttribute("style");
  clone.removeAttribute("class");
  const vb = svgEl.viewBox.baseVal;
  const svgW = vb.width || svgEl.getBoundingClientRect().width;
  const svgH = vb.height || svgEl.getBoundingClientRect().height;
  /* Set explicit dimensions = viewBox * scale so the browser rasterises at exact target size */
  const w = Math.round(svgW * scale);
  const h = Math.round(svgH * scale);
  clone.setAttribute("width", String(w));
  clone.setAttribute("height", String(h));
  const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
  style.textContent = fontCSS;
  clone.insertBefore(style, clone.firstChild);
  const svgData = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const img = new Image();
    img.src = svgUrl;
    if (img.decode) {
      await img.decode();
    } else {
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Image load failed"));
      });
    }
    await new Promise((r) => setTimeout(r, 100));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, w, h);

    const pngBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/png")
    );
    if (!pngBlob) {
      alert("PNG export failed — try the SVG download instead.");
      return;
    }
    triggerDownload(pngBlob, filename);
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ── GLOW ICON ── */
function GlowIcon({ id }: { id: string }) {
  return (
    <g>
      <defs>
        <filter id={`${id}-glow`}>
          <feGaussianBlur stdDeviation="2.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id={`${id}-g1`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={PURPLE} />
          <stop offset="100%" stopColor={CYAN} />
        </linearGradient>
        <linearGradient id={`${id}-g2`} x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={PURPLE} />
          <stop offset="100%" stopColor={CYAN} />
        </linearGradient>
      </defs>
      <g filter={`url(#${id}-glow)`}>
        <line x1="40" y1="40" x2="20" y2="18" stroke={`url(#${id}-g1)`} strokeWidth="1.4" opacity="0.6" />
        <line x1="40" y1="40" x2="62" y2="14" stroke={`url(#${id}-g1)`} strokeWidth="1.4" opacity="0.6" />
        <line x1="40" y1="40" x2="16" y2="62" stroke={`url(#${id}-g2)`} strokeWidth="1.4" opacity="0.6" />
        <line x1="40" y1="40" x2="66" y2="56" stroke={`url(#${id}-g2)`} strokeWidth="1.4" opacity="0.6" />
        <line x1="40" y1="40" x2="56" y2="34" stroke={`url(#${id}-g1)`} strokeWidth="1.2" opacity="0.5" />
        <line x1="56" y1="34" x2="72" y2="18" stroke={CYAN} strokeWidth="1" opacity="0.35" />
        <line x1="20" y1="18" x2="62" y2="14" stroke={TEAL} strokeWidth="0.7" opacity="0.22" />
        <line x1="16" y1="62" x2="66" y2="56" stroke={TEAL} strokeWidth="0.7" opacity="0.22" />
        <circle cx="40" cy="40" r="5.5" fill={PURPLE} />
        <circle cx="20" cy="18" r="3.5" fill={CYAN} opacity="0.75" />
        <circle cx="62" cy="14" r="3" fill={TEAL} opacity="0.7" />
        <circle cx="16" cy="62" r="3" fill={CYAN} opacity="0.65" />
        <circle cx="66" cy="56" r="3.5" fill={TEAL} opacity="0.75" />
        <circle cx="56" cy="34" r="2.2" fill={LIGHT_CYAN} opacity="0.55" />
        <circle cx="72" cy="18" r="2" fill={CYAN} opacity="0.4" />
      </g>
      <circle cx="41.5" cy="38.5" r="2" fill="#fff" opacity="0.6" />
    </g>
  );
}

/* ── GLOW ICON with background (for favicon) ── */
function GlowIconStandalone({ id, bg }: { id: string; bg: string }) {
  return (
    <>
      <rect width="80" height="80" rx="16" fill={bg} />
      <GlowIcon id={id} />
    </>
  );
}

/* ── DOWNLOAD BUTTONS ── */
function DownloadBar({ svgRef, baseName }: { svgRef: React.RefObject<SVGSVGElement | null>; baseName: string }) {
  const [busy, setBusy] = useState(false);
  const dl = useCallback(
    async (fn: () => Promise<void>) => {
      setBusy(true);
      try { await fn(); } finally { setBusy(false); }
    },
    []
  );
  /* Compute actual pixel sizes from the viewBox */
  const el = svgRef.current;
  const vbW = el?.viewBox?.baseVal?.width || 0;
  const vbH = el?.viewBox?.baseVal?.height || 0;
  const label = (s: number) => vbW ? `${Math.round(vbW * s)}×${Math.round(vbH * s)}` : "";
  const btnClass =
    "text-[11px] font-mono px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-white/50 hover:text-white hover:bg-white/[0.1] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-wait";
  return (
    <div className="flex gap-2 mt-3 flex-wrap items-center">
      <button disabled={busy} onClick={() => dl(() => downloadSVG(svgRef.current, `${baseName}.svg`))} className={btnClass}>
        ↓ SVG
      </button>
      <button disabled={busy} onClick={() => dl(() => downloadPNG(svgRef.current, `${baseName}@4x.png`, 4))} className={btnClass}>
        ↓ PNG 4x {label(4) && <span className="text-white/25 ml-1">({label(4)})</span>}
      </button>
      <button disabled={busy} onClick={() => dl(() => downloadPNG(svgRef.current, `${baseName}@2x.png`, 2))} className={btnClass}>
        ↓ PNG 2x {label(2) && <span className="text-white/25 ml-1">({label(2)})</span>}
      </button>
      <button disabled={busy} onClick={() => dl(() => downloadPNG(svgRef.current, `${baseName}@1x.png`, 1))} className={btnClass}>
        ↓ PNG 1x {label(1) && <span className="text-white/25 ml-1">({label(1)})</span>}
      </button>
    </div>
  );
}

/* ── SECTION HEADER ── */
function SectionHeader({ tag, title, desc }: { tag: string; title: string; desc?: string }) {
  return (
    <div className="mb-8">
      <p className="text-[10px] font-mono text-[#A855F7]/50 tracking-[0.3em] mb-3">{tag}</p>
      <h2
        className="text-2xl font-bold text-white mb-2 tracking-tight"
        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        {title}
      </h2>
      {desc && <p className="text-white/35 text-sm max-w-xl leading-relaxed">{desc}</p>}
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════ */
export default function TestLogosPage() {
  const lockupDarkRef = useRef<SVGSVGElement>(null);
  const lockupLightRef = useRef<SVGSVGElement>(null);
  const oneLinerDarkRef = useRef<SVGSVGElement>(null);
  const oneLinerLightRef = useRef<SVGSVGElement>(null);
  const faviconDarkRef = useRef<SVGSVGElement>(null);
  const faviconLightRef = useRef<SVGSVGElement>(null);
  const faviconTransRef = useRef<SVGSVGElement>(null);
  const ogDarkRef = useRef<SVGSVGElement>(null);
  const ogLightRef = useRef<SVGSVGElement>(null);
  const ogBgDarkRef = useRef<SVGSVGElement>(null);
  const ogBgLightRef = useRef<SVGSVGElement>(null);
  const twitterPfpRef = useRef<SVGSVGElement>(null);
  const twitterCoverRef = useRef<SVGSVGElement>(null);
  const iconOnlyRef = useRef<SVGSVGElement>(null);
  const wordmarkDarkRef = useRef<SVGSVGElement>(null);
  const wordmarkLightRef = useRef<SVGSVGElement>(null);

  return (
    <div className="min-h-screen bg-[#0A0A0F] p-6 md:p-10">

      {/* Load Archivo Black + Inter from Google Fonts */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={GOOGLE_FONTS_URL} />

      {/* ── PAGE HEADER ── */}
      <div className="mb-20">
        <p className="text-[10px] font-mono text-[#A855F7]/50 tracking-[0.3em] mb-3">
          OPSTELLAR BRAND KIT
        </p>
        <h1
          className="text-4xl font-bold text-white mb-3 tracking-tight"
          style={{ fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif" }}
        >
          OpStellar — Final Brand Assets
        </h1>
        <p className="text-white/35 text-sm max-w-2xl leading-relaxed">
          Neon Glow Spectrum icon × <span className="text-white/50">Archivo Black</span> wordmark.
          Every asset below is downloadable in SVG and PNG.
        </p>
      </div>

      {/* ═══════════════════════════════════════════
          1. PRIMARY LOCKUP — Icon + Wordmark
         ═══════════════════════════════════════════ */}
      <section className="mb-20">
        <SectionHeader
          tag="01 · PRIMARY LOCKUP"
          title="Icon + Wordmark — Horizontal"
          desc="The primary brand mark. Icon left, OPSTELLAR right. Use on dashboards, headers, marketing."
        />
        {/* Dark */}
        <div className="bg-[#0A0A0F] rounded-2xl border border-white/[0.06] p-12 flex items-center justify-center">
          <svg ref={lockupDarkRef} viewBox="0 0 440 80" className="w-full max-w-xl">
            <GlowIcon id="lockup-d" />
            <text
              x="96"
              y="50"
              fontFamily={FONT}
              fontSize="28"
              letterSpacing="4"
              fontWeight="400"
              filter="url(#lockup-d-glow)"
            >
              <tspan fill={PURPLE}>OP</tspan>
              <tspan fill={TEXT_WHITE}>STELLAR</tspan>
            </text>
          </svg>
        </div>
        <DownloadBar svgRef={lockupDarkRef} baseName="opstellar-lockup-dark" />

        {/* Light */}
        <div className="mt-6 bg-white rounded-2xl border border-neutral-200 p-12 flex items-center justify-center">
          <svg ref={lockupLightRef} viewBox="0 0 440 80" className="w-full max-w-xl">
            <GlowIcon id="lockup-l" />
            <text
              x="96"
              y="50"
              fontFamily={FONT}
              fontSize="28"
              letterSpacing="4"
              fontWeight="400"
              filter="url(#lockup-l-glow)"
            >
              <tspan fill={PURPLE}>OP</tspan>
              <tspan fill={DARK_TEXT}>STELLAR</tspan>
            </text>
          </svg>
        </div>
        <DownloadBar svgRef={lockupLightRef} baseName="opstellar-lockup-light" />
      </section>

      {/* ═══════════════════════════════════════════
          2. ONE-LINER — Compact inline
         ═══════════════════════════════════════════ */}
      <section className="mb-20">
        <SectionHeader
          tag="02 · ONE-LINER"
          title="Compact Inline Lockup"
          desc="Smaller footprint for navbars, sidebars, tight layouts. Same icon, tighter spacing."
        />
        {/* Dark */}
        <div className="bg-[#0A0A0F] rounded-2xl border border-white/[0.06] p-8 flex items-center justify-center">
          <svg ref={oneLinerDarkRef} viewBox="0 0 320 48" className="w-full max-w-md">
            <g transform="scale(0.55) translate(4, 4)">
              <GlowIcon id="ol-d" />
            </g>
            <text
              x="58"
              y="31"
              fontFamily={FONT}
              fontSize="18"
              letterSpacing="3"
              fontWeight="400"
              filter="url(#ol-d-glow)"
            >
              <tspan fill={PURPLE}>OP</tspan>
              <tspan fill={TEXT_WHITE}>STELLAR</tspan>
            </text>
          </svg>
        </div>
        <DownloadBar svgRef={oneLinerDarkRef} baseName="opstellar-oneliner-dark" />

        {/* Light */}
        <div className="mt-6 bg-white rounded-2xl border border-neutral-200 p-8 flex items-center justify-center">
          <svg ref={oneLinerLightRef} viewBox="0 0 320 48" className="w-full max-w-md">
            <g transform="scale(0.55) translate(4, 4)">
              <GlowIcon id="ol-l" />
            </g>
            <text
              x="58"
              y="31"
              fontFamily={FONT}
              fontSize="18"
              letterSpacing="3"
              fontWeight="400"
              filter="url(#ol-l-glow)"
            >
              <tspan fill={PURPLE}>OP</tspan>
              <tspan fill={DARK_TEXT}>STELLAR</tspan>
            </text>
          </svg>
        </div>
        <DownloadBar svgRef={oneLinerLightRef} baseName="opstellar-oneliner-light" />
      </section>

      {/* ═══════════════════════════════════════════
          3. FAVICON / APP ICON
         ═══════════════════════════════════════════ */}
      <section className="mb-20">
        <SectionHeader
          tag="03 · FAVICON / APP ICON"
          title="Favicons & App Icons"
          desc="Icon-only mark. Dark bg, light bg, and transparent variants."
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Dark bg */}
          <div>
            <p className="text-[11px] font-mono text-white/30 mb-3">Dark Background</p>
            <div className="bg-[#0A0A0F] rounded-2xl border border-white/[0.06] p-10 flex items-center justify-center">
              <div className="w-32 h-32">
                <svg ref={faviconDarkRef} viewBox="0 0 80 80" className="w-full h-full">
                  <GlowIconStandalone id="fav-d" bg={DARK_BG} />
                </svg>
              </div>
            </div>
            <DownloadBar svgRef={faviconDarkRef} baseName="opstellar-favicon-dark" />
          </div>
          {/* Light bg */}
          <div>
            <p className="text-[11px] font-mono text-white/30 mb-3">Light Background</p>
            <div className="bg-neutral-100 rounded-2xl border border-neutral-200 p-10 flex items-center justify-center">
              <div className="w-32 h-32">
                <svg ref={faviconLightRef} viewBox="0 0 80 80" className="w-full h-full">
                  <GlowIconStandalone id="fav-l" bg="#ffffff" />
                </svg>
              </div>
            </div>
            <DownloadBar svgRef={faviconLightRef} baseName="opstellar-favicon-light" />
          </div>
          {/* Transparent */}
          <div>
            <p className="text-[11px] font-mono text-white/30 mb-3">Transparent</p>
            <div
              className="rounded-2xl border border-white/[0.06] p-10 flex items-center justify-center"
              style={{ background: "repeating-conic-gradient(#1a1a2e 0% 25%, #12121a 0% 50%) 0 0 / 20px 20px" }}
            >
              <div className="w-32 h-32">
                <svg ref={faviconTransRef} viewBox="0 0 80 80" className="w-full h-full">
                  <GlowIcon id="fav-t" />
                </svg>
              </div>
            </div>
            <DownloadBar svgRef={faviconTransRef} baseName="opstellar-favicon-transparent" />
          </div>
        </div>

        {/* Size ladder */}
        <div className="mt-8">
          <p className="text-[11px] font-mono text-white/30 mb-4">Size Ladder</p>
          <div className="flex items-end gap-5 flex-wrap">
            {[16, 24, 32, 48, 64, 96, 128, 192, 512].map((s) => (
              <div key={s} className="flex flex-col items-center gap-2">
                <div
                  className="bg-[#0A0A0F] rounded-lg border border-white/[0.06] flex items-center justify-center"
                  style={{ width: Math.max(s, 32) + 8, height: Math.max(s, 32) + 8 }}
                >
                  <div style={{ width: Math.min(s, 80), height: Math.min(s, 80) }}>
                    <svg viewBox="0 0 80 80" className="w-full h-full">
                      <GlowIcon id={`sz-${s}`} />
                    </svg>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-white/25">{s}px</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          4. OG IMAGE / SOCIAL PREVIEW
         ═══════════════════════════════════════════ */}
      <section className="mb-20">
        <SectionHeader
          tag="04 · OG IMAGE / SOCIAL PREVIEW"
          title="Open Graph & Social Cards"
          desc="1200×630 social preview. Used by Twitter/X, Discord, Slack, etc."
        />
        {/* Dark OG */}
        <div className="bg-[#0A0A0F] rounded-2xl border border-white/[0.06] p-4">
          <svg ref={ogDarkRef} viewBox="0 0 1200 630" className="w-full max-w-[800px] rounded-xl">
            <rect width="1200" height="630" fill={DARK_BG} />
            <defs>
              <filter id="og-d-glow">
                <feGaussianBlur stdDeviation="3" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <linearGradient id="og-d-g1" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={PURPLE} />
                <stop offset="100%" stopColor={CYAN} />
              </linearGradient>
              <linearGradient id="og-d-g2" x1="1" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={PURPLE} />
                <stop offset="100%" stopColor={CYAN} />
              </linearGradient>
              <radialGradient id="og-d-bg-glow" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0%" stopColor={PURPLE} stopOpacity="0.08" />
                <stop offset="100%" stopColor={PURPLE} stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect width="1200" height="630" fill="url(#og-d-bg-glow)" />
            {/* Centered icon — scaled up */}
            <g transform="translate(440, 140) scale(4)">
              <g filter="url(#og-d-glow)">
                <line x1="40" y1="40" x2="20" y2="18" stroke="url(#og-d-g1)" strokeWidth="1.4" opacity="0.6" />
                <line x1="40" y1="40" x2="62" y2="14" stroke="url(#og-d-g1)" strokeWidth="1.4" opacity="0.6" />
                <line x1="40" y1="40" x2="16" y2="62" stroke="url(#og-d-g2)" strokeWidth="1.4" opacity="0.6" />
                <line x1="40" y1="40" x2="66" y2="56" stroke="url(#og-d-g2)" strokeWidth="1.4" opacity="0.6" />
                <line x1="40" y1="40" x2="56" y2="34" stroke="url(#og-d-g1)" strokeWidth="1.2" opacity="0.5" />
                <line x1="56" y1="34" x2="72" y2="18" stroke={CYAN} strokeWidth="1" opacity="0.35" />
                <line x1="20" y1="18" x2="62" y2="14" stroke={TEAL} strokeWidth="0.7" opacity="0.22" />
                <line x1="16" y1="62" x2="66" y2="56" stroke={TEAL} strokeWidth="0.7" opacity="0.22" />
                <circle cx="40" cy="40" r="5.5" fill={PURPLE} />
                <circle cx="20" cy="18" r="3.5" fill={CYAN} opacity="0.75" />
                <circle cx="62" cy="14" r="3" fill={TEAL} opacity="0.7" />
                <circle cx="16" cy="62" r="3" fill={CYAN} opacity="0.65" />
                <circle cx="66" cy="56" r="3.5" fill={TEAL} opacity="0.75" />
                <circle cx="56" cy="34" r="2.2" fill={LIGHT_CYAN} opacity="0.55" />
                <circle cx="72" cy="18" r="2" fill={CYAN} opacity="0.4" />
              </g>
              <circle cx="41.5" cy="38.5" r="2" fill="#fff" opacity="0.6" />
            </g>
            {/* Wordmark */}
            <text
              x="600"
              y="510"
              textAnchor="middle"
              fontFamily={FONT}
              fontSize="64"
              letterSpacing="8"
              fontWeight="400"
              filter="url(#og-d-glow)"
            >
              <tspan fill={PURPLE}>OP</tspan>
              <tspan fill={TEXT_WHITE}>STELLAR</tspan>
            </text>
            <text
              x="600"
              y="560"
              textAnchor="middle"
              fontFamily="'Inter', system-ui, sans-serif"
              fontSize="18"
              fill={TEXT_WHITE}
              opacity="0.35"
              letterSpacing="4"
            >
              AI-POWERED SPACEX COMPANION
            </text>
          </svg>
        </div>
        <DownloadBar svgRef={ogDarkRef} baseName="opstellar-og-dark" />

        {/* Light OG */}
        <div className="mt-6 bg-white rounded-2xl border border-neutral-200 p-4">
          <svg ref={ogLightRef} viewBox="0 0 1200 630" className="w-full max-w-[800px] rounded-xl">
            <rect width="1200" height="630" fill="#ffffff" />
            <defs>
              <filter id="og-l-glow">
                <feGaussianBlur stdDeviation="3" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <linearGradient id="og-l-g1" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={PURPLE} />
                <stop offset="100%" stopColor={CYAN} />
              </linearGradient>
              <linearGradient id="og-l-g2" x1="1" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={PURPLE} />
                <stop offset="100%" stopColor={CYAN} />
              </linearGradient>
              <radialGradient id="og-l-bg-glow" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0%" stopColor={PURPLE} stopOpacity="0.06" />
                <stop offset="100%" stopColor={PURPLE} stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect width="1200" height="630" fill="url(#og-l-bg-glow)" />
            <g transform="translate(440, 140) scale(4)">
              <g filter="url(#og-l-glow)">
                <line x1="40" y1="40" x2="20" y2="18" stroke="url(#og-l-g1)" strokeWidth="1.4" opacity="0.6" />
                <line x1="40" y1="40" x2="62" y2="14" stroke="url(#og-l-g1)" strokeWidth="1.4" opacity="0.6" />
                <line x1="40" y1="40" x2="16" y2="62" stroke="url(#og-l-g2)" strokeWidth="1.4" opacity="0.6" />
                <line x1="40" y1="40" x2="66" y2="56" stroke="url(#og-l-g2)" strokeWidth="1.4" opacity="0.6" />
                <line x1="40" y1="40" x2="56" y2="34" stroke="url(#og-l-g1)" strokeWidth="1.2" opacity="0.5" />
                <line x1="56" y1="34" x2="72" y2="18" stroke={CYAN} strokeWidth="1" opacity="0.35" />
                <line x1="20" y1="18" x2="62" y2="14" stroke={TEAL} strokeWidth="0.7" opacity="0.22" />
                <line x1="16" y1="62" x2="66" y2="56" stroke={TEAL} strokeWidth="0.7" opacity="0.22" />
                <circle cx="40" cy="40" r="5.5" fill={PURPLE} />
                <circle cx="20" cy="18" r="3.5" fill={CYAN} opacity="0.75" />
                <circle cx="62" cy="14" r="3" fill={TEAL} opacity="0.7" />
                <circle cx="16" cy="62" r="3" fill={CYAN} opacity="0.65" />
                <circle cx="66" cy="56" r="3.5" fill={TEAL} opacity="0.75" />
                <circle cx="56" cy="34" r="2.2" fill={LIGHT_CYAN} opacity="0.55" />
                <circle cx="72" cy="18" r="2" fill={CYAN} opacity="0.4" />
              </g>
              <circle cx="41.5" cy="38.5" r="2" fill="#fff" opacity="0.6" />
            </g>
            <text
              x="600"
              y="510"
              textAnchor="middle"
              fontFamily={FONT}
              fontSize="64"
              letterSpacing="8"
              fontWeight="400"
              filter="url(#og-l-glow)"
            >
              <tspan fill={PURPLE}>OP</tspan>
              <tspan fill={DARK_TEXT}>STELLAR</tspan>
            </text>
            <text
              x="600"
              y="560"
              textAnchor="middle"
              fontFamily="'Inter', system-ui, sans-serif"
              fontSize="18"
              fill={DARK_TEXT}
              opacity="0.35"
              letterSpacing="4"
            >
              AI-POWERED SPACEX COMPANION
            </text>
          </svg>
        </div>
        <DownloadBar svgRef={ogLightRef} baseName="opstellar-og-light" />

        {/* ── BG-only downloads (no logo/text) ── */}
        <div className="mt-10 mb-4">
          <p className="text-[10px] font-mono text-[#A855F7]/50 tracking-[0.3em] mb-3">BACKGROUND ONLY</p>
          <p className="text-white/35 text-sm max-w-xl leading-relaxed">
            Same 1200×630 canvas with gradient glow — no icon or wordmark.
          </p>
        </div>
        {/* Dark BG only */}
        <div className="bg-[#0A0A0F] rounded-2xl border border-white/[0.06] p-4">
          <svg ref={ogBgDarkRef} viewBox="0 0 1200 630" className="w-full max-w-[800px] rounded-xl">
            <rect width="1200" height="630" fill={DARK_BG} />
            <defs>
              <radialGradient id="og-bgonly-d-glow" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0%" stopColor={PURPLE} stopOpacity="0.08" />
                <stop offset="100%" stopColor={PURPLE} stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect width="1200" height="630" fill="url(#og-bgonly-d-glow)" />
          </svg>
        </div>
        <DownloadBar svgRef={ogBgDarkRef} baseName="opstellar-bg-dark" />

        {/* Light BG only */}
        <div className="mt-6 bg-white rounded-2xl border border-neutral-200 p-4">
          <svg ref={ogBgLightRef} viewBox="0 0 1200 630" className="w-full max-w-[800px] rounded-xl">
            <rect width="1200" height="630" fill="#ffffff" />
            <defs>
              <radialGradient id="og-bgonly-l-glow" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0%" stopColor={PURPLE} stopOpacity="0.06" />
                <stop offset="100%" stopColor={PURPLE} stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect width="1200" height="630" fill="url(#og-bgonly-l-glow)" />
          </svg>
        </div>
        <DownloadBar svgRef={ogBgLightRef} baseName="opstellar-bg-light" />
      </section>

      {/* ═══════════════════════════════════════════
          5. X / TWITTER ASSETS
         ═══════════════════════════════════════════ */}
      <section className="mb-20">
        <SectionHeader
          tag="05 · X / TWITTER"
          title="X (Twitter) Profile & Cover"
          desc="Profile picture 400×400 and header/cover photo 1500×500 — optimised for X/Twitter."
        />

        {/* Twitter Profile Picture — 400×400 */}
        <p className="text-[10px] font-mono text-white/30 tracking-wider mb-3">PROFILE PICTURE · 400×400</p>
        <div className="bg-[#0A0A0F] rounded-2xl border border-white/[0.06] p-8 flex items-center justify-center">
          <div className="w-48 h-48">
            <svg ref={twitterPfpRef} viewBox="0 0 400 400" className="w-full h-full rounded-full" style={{ borderRadius: '50%' }}>
              <defs>
                <clipPath id="tw-pfp-clip"><circle cx="200" cy="200" r="200" /></clipPath>
                <filter id="tw-pfp-glow">
                  <feGaussianBlur stdDeviation="4" result="b" />
                  <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <linearGradient id="tw-pfp-g1" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={PURPLE} /><stop offset="100%" stopColor={CYAN} />
                </linearGradient>
                <linearGradient id="tw-pfp-g2" x1="1" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={PURPLE} /><stop offset="100%" stopColor={CYAN} />
                </linearGradient>
                <radialGradient id="tw-pfp-bg" cx="0.5" cy="0.5" r="0.5">
                  <stop offset="0%" stopColor={PURPLE} stopOpacity="0.1" />
                  <stop offset="100%" stopColor={PURPLE} stopOpacity="0" />
                </radialGradient>
              </defs>
              <rect width="400" height="400" fill={DARK_BG} />
              <rect width="400" height="400" fill="url(#tw-pfp-bg)" />
              {/* Centered icon — scale(4) puts the 80×80 icon at 320×320, offset to center */}
              <g transform="translate(40, 40) scale(4)">
                <g filter="url(#tw-pfp-glow)">
                  <line x1="40" y1="40" x2="20" y2="18" stroke="url(#tw-pfp-g1)" strokeWidth="1.4" opacity="0.6" />
                  <line x1="40" y1="40" x2="62" y2="14" stroke="url(#tw-pfp-g1)" strokeWidth="1.4" opacity="0.6" />
                  <line x1="40" y1="40" x2="16" y2="62" stroke="url(#tw-pfp-g2)" strokeWidth="1.4" opacity="0.6" />
                  <line x1="40" y1="40" x2="66" y2="56" stroke="url(#tw-pfp-g2)" strokeWidth="1.4" opacity="0.6" />
                  <line x1="40" y1="40" x2="56" y2="34" stroke="url(#tw-pfp-g1)" strokeWidth="1.2" opacity="0.5" />
                  <line x1="56" y1="34" x2="72" y2="18" stroke={CYAN} strokeWidth="1" opacity="0.35" />
                  <line x1="20" y1="18" x2="62" y2="14" stroke={TEAL} strokeWidth="0.7" opacity="0.22" />
                  <line x1="16" y1="62" x2="66" y2="56" stroke={TEAL} strokeWidth="0.7" opacity="0.22" />
                  <circle cx="40" cy="40" r="5.5" fill={PURPLE} />
                  <circle cx="20" cy="18" r="3.5" fill={CYAN} opacity="0.75" />
                  <circle cx="62" cy="14" r="3" fill={TEAL} opacity="0.7" />
                  <circle cx="16" cy="62" r="3" fill={CYAN} opacity="0.65" />
                  <circle cx="66" cy="56" r="3.5" fill={TEAL} opacity="0.75" />
                  <circle cx="56" cy="34" r="2.2" fill={LIGHT_CYAN} opacity="0.55" />
                  <circle cx="72" cy="18" r="2" fill={CYAN} opacity="0.4" />
                </g>
                <circle cx="41.5" cy="38.5" r="2" fill="#fff" opacity="0.6" />
              </g>
            </svg>
          </div>
        </div>
        <DownloadBar svgRef={twitterPfpRef} baseName="opstellar-twitter-pfp" />

        {/* Twitter Cover / Header — 1500×500 */}
        <p className="text-[10px] font-mono text-white/30 tracking-wider mb-3 mt-10">HEADER / COVER PHOTO · 1500×500</p>
        <div className="bg-[#0A0A0F] rounded-2xl border border-white/[0.06] p-4">
          <svg ref={twitterCoverRef} viewBox="0 0 1500 500" className="w-full max-w-[900px] rounded-xl">
            <defs>
              <filter id="tw-cov-glow" x="-25%" y="-25%" width="150%" height="150%">
                <feGaussianBlur stdDeviation="9" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="tw-cov-glow-lg" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="18" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <linearGradient id="tw-cov-g1" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={PURPLE} /><stop offset="100%" stopColor={CYAN} />
              </linearGradient>
              <linearGradient id="tw-cov-g2" x1="1" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={PURPLE} /><stop offset="100%" stopColor={CYAN} />
              </linearGradient>
              {/* Central purple glow */}
              <radialGradient id="tw-cov-glow-purple" cx="0.5" cy="0.38" r="0.45">
                <stop offset="0%" stopColor={PURPLE} stopOpacity="0.14" />
                <stop offset="60%" stopColor={PURPLE} stopOpacity="0.04" />
                <stop offset="100%" stopColor={PURPLE} stopOpacity="0" />
              </radialGradient>
              {/* Off-center cyan accent */}
              <radialGradient id="tw-cov-glow-cyan" cx="0.65" cy="0.55" r="0.4">
                <stop offset="0%" stopColor={CYAN} stopOpacity="0.08" />
                <stop offset="100%" stopColor={CYAN} stopOpacity="0" />
              </radialGradient>
              {/* Vignette — darkens edges */}
              <radialGradient id="tw-cov-vignette" cx="0.5" cy="0.5" r="0.7">
                <stop offset="0%" stopColor={DARK_BG} stopOpacity="0" />
                <stop offset="100%" stopColor={DARK_BG} stopOpacity="0.6" />
              </radialGradient>
              {/* Grid pattern */}
              <pattern id="tw-cov-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <line x1="60" y1="0" x2="60" y2="60" stroke={PURPLE} strokeWidth="0.5" opacity="0.06" />
                <line x1="0" y1="60" x2="60" y2="60" stroke={PURPLE} strokeWidth="0.5" opacity="0.06" />
              </pattern>
            </defs>
            {/* Base dark bg */}
            <rect width="1500" height="500" fill={DARK_BG} />
            {/* Subtle grid */}
            <rect width="1500" height="500" fill="url(#tw-cov-grid)" />
            {/* Purple center glow */}
            <rect width="1500" height="500" fill="url(#tw-cov-glow-purple)" />
            {/* Cyan accent glow */}
            <rect width="1500" height="500" fill="url(#tw-cov-glow-cyan)" />
            {/* Vignette */}
            <rect width="1500" height="500" fill="url(#tw-cov-vignette)" />
            {/* Top/bottom accent lines */}
            <line x1="0" y1="1" x2="1500" y2="1" stroke={CYAN} strokeWidth="1.5" opacity="0.12" />
            <line x1="0" y1="499" x2="1500" y2="499" stroke={PURPLE} strokeWidth="1.5" opacity="0.15" />
            {/* Decorative diagonal accent lines */}
            <line x1="0" y1="500" x2="300" y2="0" stroke={PURPLE} strokeWidth="0.5" opacity="0.05" />
            <line x1="1200" y1="500" x2="1500" y2="0" stroke={CYAN} strokeWidth="0.5" opacity="0.04" />
            {/* Large ambient glow behind icon */}
            <circle cx="750" cy="170" r="100" fill={PURPLE} opacity="0.06" filter="url(#tw-cov-glow-lg)" />
            {/* Icon — all coordinates inlined at canvas scale (hub @ 750,170, ×3) */}
            <g filter="url(#tw-cov-glow)">
              {/* Spokes from hub */}
              <line x1="750" y1="170" x2="690" y2="104" stroke="url(#tw-cov-g1)" strokeWidth="4.2" opacity="0.6" />
              <line x1="750" y1="170" x2="816" y2="92"  stroke="url(#tw-cov-g1)" strokeWidth="4.2" opacity="0.6" />
              <line x1="750" y1="170" x2="678" y2="236" stroke="url(#tw-cov-g2)" strokeWidth="4.2" opacity="0.6" />
              <line x1="750" y1="170" x2="828" y2="218" stroke="url(#tw-cov-g2)" strokeWidth="4.2" opacity="0.6" />
              <line x1="750" y1="170" x2="798" y2="152" stroke="url(#tw-cov-g1)" strokeWidth="3.6" opacity="0.5" />
              {/* Secondary spoke */}
              <line x1="798" y1="152" x2="846" y2="104" stroke={CYAN} strokeWidth="3" opacity="0.35" />
              {/* Cross links */}
              <line x1="690" y1="104" x2="816" y2="92"  stroke={TEAL} strokeWidth="2.1" opacity="0.22" />
              <line x1="678" y1="236" x2="828" y2="218" stroke={TEAL} strokeWidth="2.1" opacity="0.22" />
              {/* Nodes */}
              <circle cx="750" cy="170" r="16.5" fill={PURPLE} />
              <circle cx="690" cy="104" r="10.5" fill={CYAN} opacity="0.75" />
              <circle cx="816" cy="92"  r="9"    fill={TEAL} opacity="0.7" />
              <circle cx="678" cy="236" r="9"    fill={CYAN} opacity="0.65" />
              <circle cx="828" cy="218" r="10.5" fill={TEAL} opacity="0.75" />
              <circle cx="798" cy="152" r="6.6"  fill={LIGHT_CYAN} opacity="0.55" />
              <circle cx="846" cy="104" r="6"    fill={CYAN} opacity="0.4" />
            </g>
            {/* Highlight — no filter */}
            <circle cx="754.5" cy="165.5" r="6" fill="#fff" opacity="0.6" />
            {/* Wordmark — centered below icon */}
            <text
              x="750"
              y="370"
              textAnchor="middle"
              fontFamily={FONT}
              fontSize="52"
              letterSpacing="6"
              fontWeight="400"
              filter="url(#tw-cov-glow)"
            >
              <tspan fill={PURPLE}>OP</tspan>
              <tspan fill={TEXT_WHITE}>STELLAR</tspan>
            </text>
            <text
              x="750"
              y="410"
              textAnchor="middle"
              fontFamily="'Inter', system-ui, sans-serif"
              fontSize="14"
              fill={TEXT_WHITE}
              opacity="0.3"
              letterSpacing="4"
            >
              SPACE INTELLIGENCE, BUILT BY AI AGENTS
            </text>
          </svg>
        </div>
        <DownloadBar svgRef={twitterCoverRef} baseName="opstellar-twitter-cover" />
      </section>

      {/* ═══════════════════════════════════════════
          6. ICON-ONLY MARK
         ═══════════════════════════════════════════ */}
      <section className="mb-20">
        <SectionHeader
          tag="06 · ICON ONLY"
          title="Standalone Mark"
          desc="The constellation icon without text. For app icons, loading states, watermarks."
        />
        <div className="bg-[#0A0A0F] rounded-2xl border border-white/[0.06] p-12 flex items-center justify-center">
          <div className="w-48 h-48">
            <svg ref={iconOnlyRef} viewBox="0 0 80 80" className="w-full h-full">
              <GlowIcon id="icon-only" />
            </svg>
          </div>
        </div>
        <DownloadBar svgRef={iconOnlyRef} baseName="opstellar-icon" />
      </section>

      {/* ═══════════════════════════════════════════
          7. WORDMARK ONLY
         ═══════════════════════════════════════════ */}
      <section className="mb-20">
        <SectionHeader
          tag="07 · WORDMARK ONLY"
          title="Text-Only Wordmark"
          desc="OPSTELLAR in Archivo Black — no icon. For footers, legal, small type."
        />
        {/* Dark */}
        <div className="bg-[#0A0A0F] rounded-2xl border border-white/[0.06] p-10 flex items-center justify-center">
          <svg ref={wordmarkDarkRef} viewBox="0 0 380 50" className="w-full max-w-md">
            <defs>
              <filter id="wm-d-glow">
                <feGaussianBlur stdDeviation="2" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <text
              x="10"
              y="36"
              fontFamily={FONT}
              fontSize="32"
              letterSpacing="5"
              fontWeight="400"
              filter="url(#wm-d-glow)"
            >
              <tspan fill={PURPLE}>OP</tspan>
              <tspan fill={TEXT_WHITE}>STELLAR</tspan>
            </text>
          </svg>
        </div>
        <DownloadBar svgRef={wordmarkDarkRef} baseName="opstellar-wordmark-dark" />

        {/* Light */}
        <div className="mt-6 bg-white rounded-2xl border border-neutral-200 p-10 flex items-center justify-center">
          <svg ref={wordmarkLightRef} viewBox="0 0 380 50" className="w-full max-w-md">
            <defs>
              <filter id="wm-l-glow">
                <feGaussianBlur stdDeviation="2" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <text
              x="10"
              y="36"
              fontFamily={FONT}
              fontSize="32"
              letterSpacing="5"
              fontWeight="400"
              filter="url(#wm-l-glow)"
            >
              <tspan fill={PURPLE}>OP</tspan>
              <tspan fill={DARK_TEXT}>STELLAR</tspan>
            </text>
          </svg>
        </div>
        <DownloadBar svgRef={wordmarkLightRef} baseName="opstellar-wordmark-light" />
      </section>

      {/* ═══════════════════════════════════════════
          8. BRAND COLORS
         ═══════════════════════════════════════════ */}
      <section className="mb-20">
        <SectionHeader tag="08 · BRAND PALETTE" title="Color Reference" />
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {[
            { name: "Purple Hub", hex: PURPLE },
            { name: "Cyan Node", hex: CYAN },
            { name: "Teal", hex: TEAL },
            { name: "Light Cyan", hex: LIGHT_CYAN },
            { name: "Text White", hex: TEXT_WHITE },
            { name: "Dark BG", hex: DARK_BG },
            { name: "Dark Text", hex: DARK_TEXT },
          ].map((c) => (
            <div key={c.hex} className="flex flex-col items-center gap-2">
              <div
                className="w-full aspect-square rounded-xl border border-white/[0.08]"
                style={{ backgroundColor: c.hex }}
              />
              <span className="text-[10px] font-mono text-white/40">{c.name}</span>
              <span className="text-[10px] font-mono text-white/25">{c.hex}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          9. TYPOGRAPHY
         ═══════════════════════════════════════════ */}
      <section className="mb-20">
        <SectionHeader
          tag="09 · TYPOGRAPHY"
          title="Archivo Black"
          desc="Primary display typeface. Used for the OPSTELLAR wordmark across all brand materials."
        />
        <div className="bg-[#0A0A0F] rounded-2xl border border-white/[0.06] p-10 space-y-6">
          {[64, 48, 36, 28, 20, 14].map((s) => (
            <div key={s} className="flex items-baseline gap-4">
              <span className="text-[10px] font-mono text-white/20 w-12 text-right shrink-0">{s}px</span>
              <p style={{ fontFamily: FONT, fontSize: s, letterSpacing: 2 }} className="text-white/80 truncate">
                OPSTELLAR
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          10. PLACEMENT GUIDE
         ═══════════════════════════════════════════ */}
      <section className="mb-20">
        <SectionHeader
          tag="10 · PLACEMENT GUIDE"
          title="Where to Put These Files"
          desc="Download the assets above, then drop them into these locations."
        />
        <div className="bg-[#0A0A0F] rounded-2xl border border-white/[0.06] p-8 space-y-6 text-sm font-mono">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_2fr_1fr] gap-4 text-white/30 text-[10px] tracking-wider border-b border-white/[0.06] pb-3">
            <span>ASSET</span>
            <span>FILE PATH</span>
            <span>DOWNLOAD</span>
          </div>

          {[
            { asset: "Favicon .ico", path: "public/favicons/favicon.ico", dl: "Favicon Dark → PNG @1x, convert to .ico via realfavicongenerator.net" },
            { asset: "Favicon 16×16", path: "public/favicons/favicon-16x16.png", dl: "Favicon Dark → PNG @1x (resize to 16px)" },
            { asset: "Favicon 32×32", path: "public/favicons/favicon-32x32.png", dl: "Favicon Dark → PNG @1x (resize to 32px)" },
            { asset: "Apple Touch Icon", path: "public/favicons/apple-touch-icon.png", dl: "Favicon Dark → PNG @4x (resize to 180px)" },
            { asset: "Android 192×192", path: "public/favicons/android-chrome-192x192.png", dl: "Favicon Dark → PNG @4x (resize to 192px)" },
            { asset: "Android 512×512", path: "public/favicons/android-chrome-512x512.png", dl: "Favicon Dark → PNG @4x (resize to 512px)" },
            { asset: "OG Image", path: "public/brand/opstellar-og.png", dl: "OG Dark → PNG @1x (1200×630)" },
            { asset: "OG Image 4×", path: "public/brand/opstellar-og@4x.png", dl: "OG Dark → PNG @4x (4800×2520)" },
            { asset: "App Icon PNG", path: "public/brand/opstellar-icon.png", dl: "Icon Only → PNG @1x" },
            { asset: "App Icon SVG", path: "public/brand/opstellar-icon.svg", dl: "Icon Only → SVG" },
            { asset: "Lockup Dark PNG", path: "public/brand/opstellar-lockup-dark.png", dl: "Primary Lockup → PNG @1x" },
            { asset: "Lockup Dark SVG", path: "public/brand/opstellar-lockup-dark.svg", dl: "Primary Lockup → SVG" },
            { asset: "One-liner PNG", path: "public/brand/opstellar-oneliner-dark.png", dl: "One-liner Dark → PNG @1x" },
            { asset: "Sidebar Logo", path: "public/brand/opstellar-lockup-dark.png", dl: "Used for sidebar navigation" },
            { asset: "X Profile Pic", path: "public/brand/opstellar-twitter-pfp.png", dl: "Twitter PFP → PNG @1x (400×400)" },
            { asset: "X Cover Photo", path: "public/brand/opstellar-twitter-cover.png", dl: "Twitter Cover → PNG @1x (1500×500)" },
          ].map((row) => (
            <div key={row.path} className="grid grid-cols-[1fr_2fr_1fr] gap-4 items-start">
              <span className="text-white/60 text-[12px]">{row.asset}</span>
              <span className="text-[#A855F7]/70 text-[11px] break-all">{row.path}</span>
              <span className="text-white/30 text-[10px] leading-relaxed">{row.dl}</span>
            </div>
          ))}

          <div className="border-t border-white/[0.06] pt-4 mt-4">
            <p className="text-white/25 text-[11px] leading-relaxed mb-3">
              <span className="text-[#A855F7]/60">layout.tsx</span> metadata currently references:
            </p>
            <pre className="text-white/20 text-[10px] bg-white/[0.03] rounded-lg p-4 overflow-x-auto">{`icons: {
  icon: [{ url: "/brand/opstellar-icon.png", sizes: "any" }],
  apple: "/brand/opstellar-icon.png",
},
openGraph: {
  images: [{ url: "/brand/opstellar-og.png", width: 1200, height: 630 }],
},
twitter: {
  images: ["/brand/opstellar-og.png"],
}`}</pre>
            <p className="text-green-400/60 text-[10px] mt-3 leading-relaxed">
              ✓ All brand assets are placed in <span className="text-green-400/80">public/brand/</span> and
              all code references point to the correct paths. Favicons are in <span className="text-green-400/80">public/favicons/</span>.
            </p>
          </div>

          <div className="border-t border-white/[0.06] pt-4">
            <p className="text-white/25 text-[11px] leading-relaxed mb-2">
              <span className="text-[#A855F7]/60">site.webmanifest</span> at public/favicons/site.webmanifest — update name:
            </p>
            <pre className="text-white/20 text-[10px] bg-white/[0.03] rounded-lg p-4 overflow-x-auto">{`{
  "name": "OpStellar",
  "short_name": "OpStellar",
  "icons": [
    { "src": "/favicons/android-chrome-192x192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/favicons/android-chrome-512x512.png", "sizes": "512x512", "type": "image/png" }
  ],
  "theme_color": "#0A0A0F",
  "background_color": "#0A0A0F",
  "display": "standalone"
}`}</pre>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <div className="border-t border-white/[0.06] pt-8 pb-12 text-center">
        <p className="text-[10px] font-mono text-white/20">
          OpStellar Brand Kit · Archivo Black · Neon Glow Spectrum
        </p>
      </div>
    </div>
  );
}
