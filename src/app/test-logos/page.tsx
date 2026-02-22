"use client";

import { useRef, useState, useCallback } from "react";

/*
  ElonAgents — Final Logo · Agent Rocket + Sora 600
  ────────────────────────────────────────────────
  Locked: AgentRocket icon + Sora SemiBold "ElonAgents"
  All layouts/dimensions for production assets.
*/

const PURPLE = "#D4A843";       // amber/gold starlight accent
const DEEP_PURPLE = "#B08A30";  // dimmer amber
const CYAN = "#2DD4A8";         // aurora teal-green
const TEXT_WHITE = "#ECEAF2";   // warm white heading

const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap";

/* ── FONT INLINING ── */
let _fontCSSCache: string | null = null;
async function getInlineFontCSS(): Promise<string> {
  if (_fontCSSCache) return _fontCSSCache;
  try {
    const resp = await fetch(GOOGLE_FONTS_URL);
    const css = await resp.text();
    const urlRe = /url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g;
    let result = css;
    const matches: RegExpExecArray[] = [];
    let m: RegExpExecArray | null;
    while ((m = urlRe.exec(css)) !== null) matches.push(m);
    for (const mt of matches) {
      const fontResp = await fetch(mt[1]);
      const buf = await fontResp.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      const b64 = btoa(binary);
      const ext = mt[1].includes(".woff2") ? "woff2" : "woff";
      result = result.replace(mt[1], `data:font/${ext};base64,${b64}`);
    }
    _fontCSSCache = result;
    return result;
  } catch {
    return "/* font fetch failed */";
  }
}

/* ── DOWNLOAD ── */
async function downloadSVG(svgEl: SVGSVGElement | null, filename: string) {
  if (!svgEl) return;
  const fontCSS = await getInlineFontCSS();
  const clone = svgEl.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.removeAttribute("style"); clone.removeAttribute("class");
  const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
  style.textContent = fontCSS;
  clone.insertBefore(style, clone.firstChild);
  const blob = new Blob([new XMLSerializer().serializeToString(clone)], { type: "image/svg+xml;charset=utf-8" });
  triggerDl(blob, filename);
}
async function downloadPNG(svgEl: SVGSVGElement | null, filename: string, scale = 4) {
  if (!svgEl) return;
  const fontCSS = await getInlineFontCSS();
  const clone = svgEl.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.removeAttribute("style"); clone.removeAttribute("class");
  const vb = svgEl.viewBox.baseVal;
  const sw = vb.width || svgEl.getBoundingClientRect().width;
  const sh = vb.height || svgEl.getBoundingClientRect().height;
  const w = Math.round(sw * scale), h = Math.round(sh * scale);
  clone.setAttribute("width", String(w)); clone.setAttribute("height", String(h));
  const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
  style.textContent = fontCSS;
  clone.insertBefore(style, clone.firstChild);
  const svgUrl = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: "image/svg+xml;charset=utf-8" }));
  try {
    const img = new Image(); img.src = svgUrl;
    if (img.decode) await img.decode(); else await new Promise<void>((r, j) => { img.onload = () => r(); img.onerror = () => j(); });
    await new Promise(r => setTimeout(r, 100));
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    c.getContext("2d")!.drawImage(img, 0, 0, w, h);
    const blob = await new Promise<Blob | null>(r => c.toBlob(b => r(b), "image/png"));
    if (blob) triggerDl(blob, filename);
  } finally { URL.revokeObjectURL(svgUrl); }
}
function triggerDl(blob: Blob, fn: string) {
  const u = URL.createObjectURL(blob); const a = document.createElement("a");
  a.href = u; a.download = fn; document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(u), 1000);
}

/* ── UI HELPERS ── */
function DL({ svgRef, name }: { svgRef: React.RefObject<SVGSVGElement | null>; name: string }) {
  const [busy, setBusy] = useState(false);
  const go = useCallback(async (fn: () => Promise<void>) => { setBusy(true); try { await fn(); } finally { setBusy(false); } }, []);
  const btn = "text-[11px] font-mono px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-white/50 hover:text-white hover:bg-white/[0.1] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-wait";
  return (
    <div className="flex gap-2 mt-3 flex-wrap">
      <button disabled={busy} onClick={() => go(() => downloadSVG(svgRef.current, `${name}.svg`))} className={btn}>↓ SVG</button>
      <button disabled={busy} onClick={() => go(() => downloadPNG(svgRef.current, `${name}@4x.png`, 4))} className={btn}>↓ PNG 4x</button>
    </div>
  );
}

function Label({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-lg font-bold text-white mb-1 tracking-tight" style={{ fontFamily: "'Sora', system-ui" }}>{title}</h2>
      <p className="text-white/25 text-sm max-w-xl">{desc}</p>
    </div>
  );
}

/* ── ELONAGENTS ICON ── Geometric rocket with AI eye node */
function AgentRocket({ color, scale = 1 }: { color: string; scale?: number }) {
  const sw = 2.8 * scale;
  return (
    <g fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={sw}>
      {/* Rocket body — tapered nose to flared base */}
      <path d="M24,2 C21,8 18,18 18,30 L15,38 L24,44 L33,38 L30,30 C30,18 27,8 24,2Z" />
      {/* Fins */}
      <path d="M18,30 L12,40 L15,38" strokeWidth={sw * 0.85} />
      <path d="M30,30 L36,40 L33,38" strokeWidth={sw * 0.85} />
      {/* AI eye — the agent */}
      <circle cx="24" cy="20" r={4.5 * scale} fill={color} stroke="none" />
      <circle cx="24" cy="20" r={2 * scale} fill="#05050A" stroke="none" />
    </g>
  );
}


/* ══════════════════════════════════════════════════════ */
export default function TestLogosPage() {
  // Horizontal logos
  const rH1 = useRef<SVGSVGElement>(null);
  const rH2 = useRef<SVGSVGElement>(null);
  const rH3 = useRef<SVGSVGElement>(null);
  // Stacked
  const rS1 = useRef<SVGSVGElement>(null);
  const rS2 = useRef<SVGSVGElement>(null);
  // Icon only
  const rI1 = useRef<SVGSVGElement>(null);
  const rI2 = useRef<SVGSVGElement>(null);
  // OG Card
  const rOG = useRef<SVGSVGElement>(null);
  // Twitter Banner
  const rTW = useRef<SVGSVGElement>(null);
  // PFP / Favicon
  const rPF1 = useRef<SVGSVGElement>(null);
  const rPF2 = useRef<SVGSVGElement>(null);
  // Mono
  const rM1 = useRef<SVGSVGElement>(null);
  const rM2 = useRef<SVGSVGElement>(null);

  return (
    <div className="min-h-screen bg-[#05050A] p-6 md:p-10">
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={GOOGLE_FONTS_URL} />

      <div className="mb-16">
        <p className="text-[10px] font-mono text-amber-400/40 tracking-[0.3em] mb-3">FINAL LOGO · AGENT ROCKET + SORA 600</p>
        <h1 className="text-3xl font-bold text-white mb-3 tracking-tight" style={{ fontFamily: "'Sora', system-ui" }}>
          ElonAgents — Logo Assets
        </h1>
        <p className="text-white/25 text-sm max-w-2xl">
          Agent Rocket icon + Sora Semi-Bold. All production dimensions. Download SVG or PNG 4x.
        </p>
      </div>

      {/* ═══════════════════════════════════════════════
          1. HORIZONTAL LOGO — Dark
         ═══════════════════════════════════════════════ */}
      <section className="mb-14">
        <Label title="Horizontal Logo — Dark" desc="Primary lockup on dark background." />
        <div className="bg-[#05050A] rounded-2xl border border-white/[0.10] p-8 flex items-center justify-center">
          <svg ref={rH1} viewBox="0 0 300 48" className="w-full max-w-md">
            <defs><linearGradient id="h1g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={CYAN} /><stop offset="100%" stopColor={PURPLE} /></linearGradient></defs>
            <AgentRocket color="url(#h1g)" />
            <text x="52" y="34" fontFamily="'Sora', system-ui" fontSize="26" fontWeight="600" letterSpacing="0.3">
              <tspan fill={PURPLE}>Elon</tspan><tspan fill={TEXT_WHITE}>Agents</tspan>
            </text>
          </svg>
        </div>
        <DL svgRef={rH1} name="elonagents-horizontal-dark" />
      </section>

      {/* ═══════════════════════════════════════════════
          2. HORIZONTAL LOGO — Purple
         ═══════════════════════════════════════════════ */}
      <section className="mb-14">
        <Label title="Horizontal Logo — Purple" desc="Primary lockup on purple gradient." />
        <div className="rounded-2xl border border-amber-400/30 p-8 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1C1C2A, #2A2A2A)" }}>
          <svg ref={rH2} viewBox="0 0 300 48" className="w-full max-w-md">
            <defs><linearGradient id="h2g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ffffff" /><stop offset="100%" stopColor={CYAN} /></linearGradient></defs>
            <AgentRocket color="url(#h2g)" />
            <text x="52" y="34" fontFamily="'Sora', system-ui" fontSize="26" fontWeight="600" letterSpacing="0.3">
              <tspan fill="#ffffff">Elon</tspan><tspan fill={CYAN}>Agents</tspan>
            </text>
          </svg>
        </div>
        <DL svgRef={rH2} name="elonagents-horizontal-purple" />
      </section>

      {/* ═══════════════════════════════════════════════
          3. HORIZONTAL LOGO — White BG
         ═══════════════════════════════════════════════ */}
      <section className="mb-14">
        <Label title="Horizontal Logo — Light" desc="For light backgrounds, emails, docs." />
        <div className="bg-white rounded-2xl border border-gray-200 p-8 flex items-center justify-center">
          <svg ref={rH3} viewBox="0 0 300 48" className="w-full max-w-md">
            <defs><linearGradient id="h3g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={DEEP_PURPLE} /><stop offset="100%" stopColor={PURPLE} /></linearGradient></defs>
            <AgentRocket color="url(#h3g)" />
            <text x="52" y="34" fontFamily="'Sora', system-ui" fontSize="26" fontWeight="600" letterSpacing="0.3">
              <tspan fill={PURPLE}>Elon</tspan><tspan fill="#1a1a2e">Agents</tspan>
            </text>
          </svg>
        </div>
        <DL svgRef={rH3} name="elonagents-horizontal-light" />
      </section>

      {/* ═══════════════════════════════════════════════
          4. STACKED LOGO
         ═══════════════════════════════════════════════ */}
      <section className="mb-14">
        <Label title="Stacked Logo" desc="Icon top, text bottom. Splash screens, square placements." />
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <div className="bg-[#05050A] rounded-2xl border border-white/[0.10] p-10 flex items-center justify-center">
              <svg ref={rS1} viewBox="0 0 160 100" className="w-48">
                <defs><linearGradient id="s1g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={CYAN} /><stop offset="100%" stopColor={PURPLE} /></linearGradient></defs>
                <g transform="translate(56,4)"><AgentRocket color="url(#s1g)" /></g>
                <text x="80" y="78" textAnchor="middle" fontFamily="'Sora', system-ui" fontSize="22" fontWeight="600" letterSpacing="0.3">
                  <tspan fill={PURPLE}>Elon</tspan><tspan fill={TEXT_WHITE}>Agents</tspan>
                </text>
              </svg>
            </div>
            <DL svgRef={rS1} name="elonagents-stacked-dark" />
          </div>
          <div>
            <div className="rounded-2xl border border-amber-400/30 p-10 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1C1C2A, #2A2A2A)" }}>
              <svg ref={rS2} viewBox="0 0 160 100" className="w-48">
                <defs><linearGradient id="s2g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ffffff" /><stop offset="100%" stopColor={CYAN} /></linearGradient></defs>
                <g transform="translate(56,4)"><AgentRocket color="url(#s2g)" /></g>
                <text x="80" y="78" textAnchor="middle" fontFamily="'Sora', system-ui" fontSize="22" fontWeight="600" letterSpacing="0.3">
                  <tspan fill="#ffffff">Elon</tspan><tspan fill={CYAN}>Agents</tspan>
                </text>
              </svg>
            </div>
            <DL svgRef={rS2} name="elonagents-stacked-purple" />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          5. ICON ONLY
         ═══════════════════════════════════════════════ */}
      <section className="mb-14">
        <Label title="Icon Only" desc="Icon standalone. Favicons, avatars, app icons." />
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <div className="bg-[#05050A] rounded-2xl border border-white/[0.10] p-8 flex items-center justify-center">
              <svg ref={rI1} viewBox="0 0 64 64" className="w-28 h-28">
                <defs><linearGradient id="i1g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={CYAN} /><stop offset="100%" stopColor={PURPLE} /></linearGradient></defs>
                <g transform="translate(8,8)"><AgentRocket color="url(#i1g)" /></g>
              </svg>
            </div>
            <DL svgRef={rI1} name="elonagents-icon-dark" />
          </div>
          <div>
            <div className="rounded-2xl border border-amber-400/30 p-8 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1C1C2A, #2A2A2A)" }}>
              <svg ref={rI2} viewBox="0 0 64 64" className="w-28 h-28">
                <defs><linearGradient id="i2g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ffffff" /><stop offset="100%" stopColor={CYAN} /></linearGradient></defs>
                <g transform="translate(8,8)"><AgentRocket color="url(#i2g)" /></g>
              </svg>
            </div>
            <DL svgRef={rI2} name="elonagents-icon-purple" />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          6. OG / SOCIAL CARD — 1200×630
         ═══════════════════════════════════════════════ */}
      <section className="mb-14">
        <Label title="OG / Social Card — 1200×630" desc="Twitter, Discord, open graph preview." />
        <div className="max-w-2xl">
          <div className="overflow-hidden rounded-2xl border border-white/[0.10]" style={{ aspectRatio: "1200/630" }}>
            <svg ref={rOG} viewBox="0 0 1200 630" className="w-full h-full">
              <defs>
                <linearGradient id="ogbg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#05050A" /><stop offset="60%" stopColor="#080808" /><stop offset="100%" stopColor="#05050A" /></linearGradient>
                <linearGradient id="ogicon" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={CYAN} /><stop offset="100%" stopColor={PURPLE} /></linearGradient>
              </defs>
              <rect width="1200" height="630" fill="url(#ogbg)" />
              <g transform="translate(513,165) scale(3.5)"><AgentRocket color="url(#ogicon)" /></g>
              <text x="600" y="430" textAnchor="middle" fontFamily="'Sora', system-ui" fontSize="72" fontWeight="600" letterSpacing="1">
                <tspan fill={PURPLE}>Elon</tspan><tspan fill={TEXT_WHITE}>Agents</tspan>
              </text>
              <text x="600" y="480" textAnchor="middle" fontFamily="'Sora', system-ui" fontSize="20" fontWeight="400" fill={PURPLE} opacity="0.5" letterSpacing="4">
                NETWORK OF AI SPACE AGENTS
              </text>
            </svg>
          </div>
          <DL svgRef={rOG} name="elonagents-og-1200x630" />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          7. TWITTER BANNER — 1500×500
         ═══════════════════════════════════════════════ */}
      <section className="mb-14">
        <Label title="Twitter / X Banner — 1500×500" desc="Cover image for X profile." />
        <div className="max-w-3xl">
          <div className="overflow-hidden rounded-2xl border border-white/[0.10]" style={{ aspectRatio: "1500/500" }}>
            <svg ref={rTW} viewBox="0 0 1500 500" className="w-full h-full">
              <defs>
                <linearGradient id="twbg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#05050A" /><stop offset="50%" stopColor="#080808" /><stop offset="100%" stopColor="#05050A" /></linearGradient>
                <linearGradient id="twicon" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={CYAN} /><stop offset="100%" stopColor={PURPLE} /></linearGradient>
              </defs>
              <rect width="1500" height="500" fill="url(#twbg)" />
              <g transform="translate(675,107) scale(3)"><AgentRocket color="url(#twicon)" /></g>
              <text x="750" y="340" textAnchor="middle" fontFamily="'Sora', system-ui" fontSize="64" fontWeight="600" letterSpacing="1">
                <tspan fill={PURPLE}>Elon</tspan><tspan fill={TEXT_WHITE}>Agents</tspan>
              </text>
              <text x="750" y="386" textAnchor="middle" fontFamily="'Sora', system-ui" fontSize="18" fontWeight="400" fill={PURPLE} opacity="0.4" letterSpacing="5">
                NETWORK OF AI SPACE AGENTS
              </text>
            </svg>
          </div>
          <DL svgRef={rTW} name="elonagents-twitter-1500x500" />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          8. PFP / FAVICON
         ═══════════════════════════════════════════════ */}
      <section className="mb-14">
        <Label title="PFP / Favicon" desc="Square icon at various sizes." />
        <div className="flex gap-5 flex-wrap items-end">
          <div>
            <div className="bg-[#05050A] rounded-2xl border border-white/[0.10] p-6 w-32 h-32 flex items-center justify-center">
              <svg ref={rPF1} viewBox="0 0 64 64" className="w-full h-full">
                <defs><linearGradient id="pf1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={CYAN} /><stop offset="100%" stopColor={PURPLE} /></linearGradient></defs>
                <g transform="translate(8,8)"><AgentRocket color="url(#pf1)" /></g>
              </svg>
            </div>
            <DL svgRef={rPF1} name="elonagents-pfp-dark" />
          </div>
          <div>
            <div className="rounded-2xl border border-amber-400/30 p-6 w-32 h-32 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1C1C2A, #2A2A2A)" }}>
              <svg ref={rPF2} viewBox="0 0 64 64" className="w-full h-full">
                <defs><linearGradient id="pf2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ffffff" /><stop offset="100%" stopColor={CYAN} /></linearGradient></defs>
                <g transform="translate(8,8)"><AgentRocket color="url(#pf2)" /></g>
              </svg>
            </div>
            <DL svgRef={rPF2} name="elonagents-pfp-purple" />
          </div>
          {/* Size previews */}
          <div className="flex gap-2 items-center">
            <div className="bg-[#05050A] rounded-lg border border-white/[0.10] w-12 h-12 flex items-center justify-center">
              <svg viewBox="0 0 48 48" className="w-8 h-8">
                <defs><linearGradient id="t48" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={CYAN} /><stop offset="100%" stopColor={PURPLE} /></linearGradient></defs>
                <AgentRocket color="url(#t48)" />
              </svg>
            </div>
            <div className="bg-[#05050A] rounded-lg border border-white/[0.10] w-8 h-8 flex items-center justify-center">
              <svg viewBox="0 0 48 48" className="w-5 h-5">
                <defs><linearGradient id="t32" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={CYAN} /><stop offset="100%" stopColor={PURPLE} /></linearGradient></defs>
                <AgentRocket color="url(#t32)" />
              </svg>
            </div>
            <div className="bg-[#05050A] rounded border border-white/[0.10] w-5 h-5 flex items-center justify-center">
              <svg viewBox="0 0 48 48" className="w-3 h-3">
                <defs><linearGradient id="t16" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={CYAN} /><stop offset="100%" stopColor={PURPLE} /></linearGradient></defs>
                <AgentRocket color="url(#t16)" />
              </svg>
            </div>
            <p className="text-[10px] text-white/20 ml-2">← 48 / 32 / 16px</p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          9. MONOCHROME VERSIONS
         ═══════════════════════════════════════════════ */}
      <section className="mb-14">
        <Label title="Monochrome" desc="Single-color versions for print, watermarks, limited palettes." />
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <div className="bg-[#05050A] rounded-2xl border border-white/[0.10] p-8 flex items-center justify-center">
              <svg ref={rM1} viewBox="0 0 300 48" className="w-full max-w-md">
                <AgentRocket color={TEXT_WHITE} />
                <text x="52" y="34" fontFamily="'Sora', system-ui" fontSize="26" fontWeight="600" letterSpacing="0.3" fill={TEXT_WHITE}>
                  ElonAgents
                </text>
              </svg>
            </div>
            <DL svgRef={rM1} name="elonagents-mono-white" />
          </div>
          <div>
            <div className="bg-white rounded-2xl border border-gray-200 p-8 flex items-center justify-center">
              <svg ref={rM2} viewBox="0 0 300 48" className="w-full max-w-md">
                <AgentRocket color="#1a1a2e" />
                <text x="52" y="34" fontFamily="'Sora', system-ui" fontSize="26" fontWeight="600" letterSpacing="0.3" fill="#1a1a2e">
                  ElonAgents
                </text>
              </svg>
            </div>
            <DL svgRef={rM2} name="elonagents-mono-dark" />
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <div className="border-t border-white/[0.10] pt-8 pb-12 text-center">
        <p className="text-[10px] font-mono text-white/15">
          ElonAgents · Agent Rocket + Sora 600 · Final Assets
        </p>
      </div>
    </div>
  );
}
