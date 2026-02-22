"use client";

import { useRef, useState, useCallback } from "react";

/*
  ElonAgents — Sora 600 Mixed Case · Focused Iteration
  ─────────────────────────────────────────────────────
  Icon concepts for ElonAgents brand identity.
  Text: Sora 600 "ElonAgents"
*/

const PURPLE = "#FFFFFF";
const _DEEP_PURPLE = "#9CA3AF"; // eslint-disable-line @typescript-eslint/no-unused-vars
const CYAN = "#D1D5DB";
const TEXT_WHITE = "#E5E7EB";

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

function Label({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div className="mb-5">
      <p className="text-[10px] font-mono text-amber-400/40 tracking-[0.3em] mb-2">{num}</p>
      <h2 className="text-lg font-bold text-white mb-1 tracking-tight" style={{ fontFamily: "'Sora', system-ui" }}>{title}</h2>
      <p className="text-white/25 text-sm max-w-xl">{desc}</p>
    </div>
  );
}

/* ── ELONAGENTS ICONS ──
   Five distinct Icon Concepts for the ElonAgents brand.
   Space + AI Agent theme. Each is visually unique.
*/

/* A — Agent Rocket: Geometric rocket with AI eye node (primary) */
function AgentRocket({ color, width = 2.8 }: { color: string; width?: number }) {
  return (
    <g fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={width}>
      <path d="M24,2 C21,8 18,18 18,30 L15,38 L24,44 L33,38 L30,30 C30,18 27,8 24,2Z" />
      <path d="M18,30 L12,40 L15,38" strokeWidth={width * 0.85} />
      <path d="M30,30 L36,40 L33,38" strokeWidth={width * 0.85} />
      <circle cx="24" cy="20" r="4.5" fill={color} stroke="none" />
      <circle cx="24" cy="20" r="2" fill="#05050A" stroke="none" />
    </g>
  );
}

/* B — Rocket Minimal: Clean outline rocket, no fins, single viewport */
function RocketMinimal({ color }: { color: string }) {
  return (
    <g fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round">
      <path d="M24,2 C20,10 18,20 18,32 L14,40 L24,44 L34,40 L30,32 C30,20 28,10 24,2Z" strokeWidth="3" />
      <circle cx="24" cy="22" r="4" strokeWidth="2.4" />
    </g>
  );
}

/* C — Neural Link: Connected nodes forming an AI network constellation */
function NeuralLink({ color }: { color: string }) {
  return (
    <g stroke={color} strokeLinecap="round" strokeWidth="2">
      <line x1="24" y1="6" x2="8" y2="28" fill="none" />
      <line x1="24" y1="6" x2="40" y2="28" fill="none" />
      <line x1="8" y1="28" x2="40" y2="28" fill="none" />
      <line x1="8" y1="28" x2="18" y2="44" fill="none" />
      <line x1="40" y1="28" x2="30" y2="44" fill="none" />
      <circle cx="24" cy="6" r="3.5" fill={color} stroke="none" />
      <circle cx="8" cy="28" r="3" fill={color} stroke="none" />
      <circle cx="40" cy="28" r="3" fill={color} stroke="none" />
      <circle cx="18" cy="44" r="2.5" fill={color} stroke="none" />
      <circle cx="30" cy="44" r="2.5" fill={color} stroke="none" />
    </g>
  );
}

/* D — Signal Beacon: Radiating signal arcs from a central agent node */
function SignalBeacon({ color }: { color: string }) {
  return (
    <g fill="none" stroke={color} strokeLinecap="round" strokeWidth="2.5">
      <circle cx="24" cy="36" r="4" fill={color} stroke="none" />
      <path d="M14,28 A14,14 0 0,1 34,28" />
      <path d="M8,20 A22,22 0 0,1 40,20" />
      <path d="M3,12 A30,30 0 0,1 45,12" />
    </g>
  );
}

/* E — Starship: Stylized tall Starship silhouette with grid details */
function StarshipIcon({ color }: { color: string }) {
  return (
    <g fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3">
      <path d="M24,2 C22,8 20,16 20,30 L16,40 L20,44 L24,42 L28,44 L32,40 L28,30 C28,16 26,8 24,2Z" />
      <path d="M20,14 L28,14" strokeWidth="2" />
      <path d="M19,24 L29,24" strokeWidth="2" />
    </g>
  );
}


/* ══════════════════════════════════════════════════════ */
export default function LogoConceptsPage() {
  const rA1 = useRef<SVGSVGElement>(null);
  const rA2 = useRef<SVGSVGElement>(null);
  const rB1 = useRef<SVGSVGElement>(null);
  const rB2 = useRef<SVGSVGElement>(null);
  const rC1 = useRef<SVGSVGElement>(null);
  const rC2 = useRef<SVGSVGElement>(null);
  const rD1 = useRef<SVGSVGElement>(null);
  const rD2 = useRef<SVGSVGElement>(null);
  const rE1 = useRef<SVGSVGElement>(null);
  const rE2 = useRef<SVGSVGElement>(null);
  const rF1 = useRef<SVGSVGElement>(null);
  const rF2 = useRef<SVGSVGElement>(null);
  const rH1 = useRef<SVGSVGElement>(null);
  const rH2 = useRef<SVGSVGElement>(null);
  const rI1 = useRef<SVGSVGElement>(null);
  const rJ1 = useRef<SVGSVGElement>(null);
  const rJ2 = useRef<SVGSVGElement>(null);

  return (
    <div className="min-h-screen bg-[#05050A] p-6 md:p-10">
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={GOOGLE_FONTS_URL} />

      <div className="mb-16">
        <p className="text-[10px] font-mono text-amber-400/40 tracking-[0.3em] mb-3">SORA 600 · FOCUSED</p>
        <h1 className="text-3xl font-bold text-white mb-3 tracking-tight" style={{ fontFamily: "'Sora', system-ui" }}>
          ElonAgents — Icon Concepts
        </h1>
        <p className="text-white/25 text-sm max-w-2xl">
          Sora Semi-Bold locked in. Five Icon Concepts for the ElonAgents brand — <strong className="text-white/40">rocket trails, neural networks, signal beacons</strong> and more. All stroke-based with round linecaps.
        </p>
      </div>

      {/* A — Launch Trails */}
      <section className="mb-14">
        <Label num="A" title="Agent Rocket" desc="Geometric rocket with AI eye. Primary brand icon." />
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <div className="bg-[#05050A] rounded-2xl border border-white/[0.10] p-8 flex items-center justify-center">
              <svg ref={rA1} viewBox="0 0 300 48" className="w-full max-w-md">
                <defs><linearGradient id="a1g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={CYAN} /><stop offset="100%" stopColor={PURPLE} /></linearGradient></defs>
                <AgentRocket color="url(#a1g)" />
                <text x="52" y="34" fontFamily="'Sora', system-ui" fontSize="26" fontWeight="600" letterSpacing="0.3">
                  <tspan fill={PURPLE}>Elon</tspan><tspan fill={TEXT_WHITE}>Agents</tspan>
                </text>
              </svg>
            </div>
            <DL svgRef={rA1} name="elonagents-clean-dark" />
          </div>
          <div>
            <div className="rounded-2xl border border-amber-400/30 p-8 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1C1C2A, #2A2A2A)" }}>
              <svg ref={rA2} viewBox="0 0 300 48" className="w-full max-w-md">
                <defs><linearGradient id="a2g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ffffff" /><stop offset="100%" stopColor={CYAN} /></linearGradient></defs>
                <AgentRocket color="url(#a2g)" />
                <text x="52" y="34" fontFamily="'Sora', system-ui" fontSize="26" fontWeight="600" letterSpacing="0.3">
                  <tspan fill="#ffffff">Elon</tspan><tspan fill={CYAN}>Agents</tspan>
                </text>
              </svg>
            </div>
            <DL svgRef={rA2} name="elonagents-clean-purple" />
          </div>
        </div>
      </section>

      {/* B — Agent Rocket — Tight */}
      <section className="mb-14">
        <Label num="B" title="Agent Rocket — Tight" desc="Same rocket, tighter icon-text spacing." />
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <div className="bg-[#05050A] rounded-2xl border border-white/[0.10] p-8 flex items-center justify-center">
              <svg ref={rB1} viewBox="0 0 280 48" className="w-full max-w-md">
                <defs><linearGradient id="b1g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={CYAN} /><stop offset="100%" stopColor={PURPLE} /></linearGradient></defs>
                <AgentRocket color="url(#b1g)" />
                <text x="46" y="34" fontFamily="'Sora', system-ui" fontSize="26" fontWeight="600" letterSpacing="0.3">
                  <tspan fill={PURPLE}>Elon</tspan><tspan fill={TEXT_WHITE}>Agents</tspan>
                </text>
              </svg>
            </div>
            <DL svgRef={rB1} name="elonagents-tight-dark" />
          </div>
          <div>
            <div className="rounded-2xl border border-amber-400/30 p-8 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1C1C2A, #2A2A2A)" }}>
              <svg ref={rB2} viewBox="0 0 280 48" className="w-full max-w-md">
                <defs><linearGradient id="b2g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ffffff" /><stop offset="100%" stopColor={CYAN} /></linearGradient></defs>
                <AgentRocket color="url(#b2g)" />
                <text x="46" y="34" fontFamily="'Sora', system-ui" fontSize="26" fontWeight="600" letterSpacing="0.3">
                  <tspan fill="#ffffff">Elon</tspan><tspan fill={CYAN}>Agents</tspan>
                </text>
              </svg>
            </div>
            <DL svgRef={rB2} name="elonagents-tight-purple" />
          </div>
        </div>
      </section>

      {/* C — Rocket Silhouette */}
      <section className="mb-14">
        <Label num="C" title="Rocket Silhouette" desc="Geometric rocket outline with viewport window." />
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <div className="bg-[#05050A] rounded-2xl border border-white/[0.10] p-8 flex items-center justify-center">
              <svg ref={rC1} viewBox="0 0 300 48" className="w-full max-w-md">
                <defs><linearGradient id="c1g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={CYAN} /><stop offset="100%" stopColor={PURPLE} /></linearGradient></defs>
                <RocketMinimal color="url(#c1g)" />
                <text x="52" y="34" fontFamily="'Sora', system-ui" fontSize="26" fontWeight="600" letterSpacing="0.3">
                  <tspan fill={PURPLE}>Elon</tspan><tspan fill={TEXT_WHITE}>Agents</tspan>
                </text>
              </svg>
            </div>
            <DL svgRef={rC1} name="elonagents-taper-dark" />
          </div>
          <div>
            <div className="rounded-2xl border border-amber-400/30 p-8 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1C1C2A, #2A2A2A)" }}>
              <svg ref={rC2} viewBox="0 0 300 48" className="w-full max-w-md">
                <defs><linearGradient id="c2g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ffffff" /><stop offset="100%" stopColor={CYAN} /></linearGradient></defs>
                <RocketMinimal color="url(#c2g)" />
                <text x="52" y="34" fontFamily="'Sora', system-ui" fontSize="26" fontWeight="600" letterSpacing="0.3">
                  <tspan fill="#ffffff">Elon</tspan><tspan fill={CYAN}>Agents</tspan>
                </text>
              </svg>
            </div>
            <DL svgRef={rC2} name="elonagents-taper-purple" />
          </div>
        </div>
      </section>

      {/* D — Thin Elegant */}
      <section className="mb-14">
        <Label num="D" title="Neural Network" desc="Connected nodes forming an AI constellation. Swarm intelligence." />
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <div className="bg-[#05050A] rounded-2xl border border-white/[0.10] p-8 flex items-center justify-center">
              <svg ref={rD1} viewBox="0 0 300 48" className="w-full max-w-md">
                <defs><linearGradient id="d1g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={CYAN} /><stop offset="100%" stopColor={PURPLE} /></linearGradient></defs>
                <NeuralLink color="url(#d1g)" />
                <text x="52" y="34" fontFamily="'Sora', system-ui" fontSize="26" fontWeight="600" letterSpacing="0.3">
                  <tspan fill={PURPLE}>Elon</tspan><tspan fill={TEXT_WHITE}>Agents</tspan>
                </text>
              </svg>
            </div>
            <DL svgRef={rD1} name="elonagents-thin-dark" />
          </div>
          <div>
            <div className="rounded-2xl border border-amber-400/30 p-8 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1C1C2A, #2A2A2A)" }}>
              <svg ref={rD2} viewBox="0 0 300 48" className="w-full max-w-md">
                <defs><linearGradient id="d2g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ffffff" /><stop offset="100%" stopColor={CYAN} /></linearGradient></defs>
                <NeuralLink color="url(#d2g)" />
                <text x="52" y="34" fontFamily="'Sora', system-ui" fontSize="26" fontWeight="600" letterSpacing="0.3">
                  <tspan fill="#ffffff">Elon</tspan><tspan fill={CYAN}>Agents</tspan>
                </text>
              </svg>
            </div>
            <DL svgRef={rD2} name="elonagents-thin-purple" />
          </div>
        </div>
      </section>

      {/* E — Heavy Bold */}
      <section className="mb-14">
        <Label num="E" title="Signal Beacon" desc="Radiating signal arcs from a central agent node." />
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <div className="bg-[#05050A] rounded-2xl border border-white/[0.10] p-8 flex items-center justify-center">
              <svg ref={rE1} viewBox="0 0 300 48" className="w-full max-w-md">
                <defs><linearGradient id="e1g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={CYAN} /><stop offset="100%" stopColor={PURPLE} /></linearGradient></defs>
                <SignalBeacon color="url(#e1g)" />
                <text x="52" y="34" fontFamily="'Sora', system-ui" fontSize="26" fontWeight="600" letterSpacing="0.3">
                  <tspan fill={PURPLE}>Elon</tspan><tspan fill={TEXT_WHITE}>Agents</tspan>
                </text>
              </svg>
            </div>
            <DL svgRef={rE1} name="elonagents-heavy-dark" />
          </div>
          <div>
            <div className="rounded-2xl border border-amber-400/30 p-8 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1C1C2A, #2A2A2A)" }}>
              <svg ref={rE2} viewBox="0 0 300 48" className="w-full max-w-md">
                <defs><linearGradient id="e2g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ffffff" /><stop offset="100%" stopColor={CYAN} /></linearGradient></defs>
                <SignalBeacon color="url(#e2g)" />
                <text x="52" y="34" fontFamily="'Sora', system-ui" fontSize="26" fontWeight="600" letterSpacing="0.3">
                  <tspan fill="#ffffff">Elon</tspan><tspan fill={CYAN}>Agents</tspan>
                </text>
              </svg>
            </div>
            <DL svgRef={rE2} name="elonagents-heavy-purple" />
          </div>
        </div>
      </section>

      {/* F — Starship */}
      <section className="mb-14">
        <Label num="F" title="Starship" desc="Stylized Starship silhouette with grid fin details." />
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <div className="bg-[#05050A] rounded-2xl border border-white/[0.10] p-8 flex items-center justify-center">
              <svg ref={rF1} viewBox="0 0 300 48" className="w-full max-w-md">
                <defs><linearGradient id="f1g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={CYAN} /><stop offset="100%" stopColor={PURPLE} /></linearGradient></defs>
                <StarshipIcon color="url(#f1g)" />
                <text x="52" y="34" fontFamily="'Sora', system-ui" fontSize="26" fontWeight="600" letterSpacing="0.3">
                  <tspan fill={PURPLE}>Elon</tspan><tspan fill={TEXT_WHITE}>Agents</tspan>
                </text>
              </svg>
            </div>
            <DL svgRef={rF1} name="elonagents-wild-dark" />
          </div>
          <div>
            <div className="rounded-2xl border border-amber-400/30 p-8 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1C1C2A, #2A2A2A)" }}>
              <svg ref={rF2} viewBox="0 0 300 48" className="w-full max-w-md">
                <defs><linearGradient id="f2g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ffffff" /><stop offset="100%" stopColor={CYAN} /></linearGradient></defs>
                <StarshipIcon color="url(#f2g)" />
                <text x="52" y="34" fontFamily="'Sora', system-ui" fontSize="26" fontWeight="600" letterSpacing="0.3">
                  <tspan fill="#ffffff">Elon</tspan><tspan fill={CYAN}>Agents</tspan>
                </text>
              </svg>
            </div>
            <DL svgRef={rF2} name="elonagents-wild-purple" />
          </div>
        </div>
      </section>

      {/* G — Icon Only (all 5) */}
      <section className="mb-14">
        <Label num="G" title="Icon Only" desc="Icon standalone — favicons, avatars, small contexts." />
        <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
          {[
            { label: "Agent", Cmp: AgentRocket },
            { label: "Rocket", Cmp: RocketMinimal },
            { label: "Neural", Cmp: NeuralLink },
            { label: "Beacon", Cmp: SignalBeacon },
            { label: "Starship", Cmp: StarshipIcon },
          ].map(({ label, Cmp }, i) => (
            <div key={i} className="bg-[#05050A] rounded-xl border border-white/[0.10] p-5 flex flex-col items-center gap-3">
              <p className="text-[8px] font-mono text-amber-400/30 tracking-widest">{label}</p>
              <svg viewBox="0 0 48 48" className="w-16 h-16">
                <defs>
                  <linearGradient id={`ico${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CYAN} />
                    <stop offset="100%" stopColor={PURPLE} />
                  </linearGradient>
                </defs>
                <Cmp color={`url(#ico${i})`} />
              </svg>
            </div>
          ))}
        </div>
      </section>

      {/* H — Stacked */}
      <section className="mb-14">
        <Label num="H" title="Stacked Layout" desc="Icon on top, text below. Splash screens, larger placements." />
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <div className="bg-[#05050A] rounded-2xl border border-white/[0.10] p-10 flex items-center justify-center">
              <svg ref={rH1} viewBox="0 0 160 100" className="w-48">
                <defs><linearGradient id="h1g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={CYAN} /><stop offset="100%" stopColor={PURPLE} /></linearGradient></defs>
                <g transform="translate(56,4)"><AgentRocket color="url(#h1g)" /></g>
                <text x="80" y="78" textAnchor="middle" fontFamily="'Sora', system-ui" fontSize="22" fontWeight="600" letterSpacing="0.3">
                  <tspan fill={PURPLE}>Elon</tspan><tspan fill={TEXT_WHITE}>Agents</tspan>
                </text>
              </svg>
            </div>
            <DL svgRef={rH1} name="elonagents-stacked-dark" />
          </div>
          <div>
            <div className="rounded-2xl border border-amber-400/30 p-10 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1C1C2A, #2A2A2A)" }}>
              <svg ref={rH2} viewBox="0 0 160 100" className="w-48">
                <defs><linearGradient id="h2g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ffffff" /><stop offset="100%" stopColor={CYAN} /></linearGradient></defs>
                <g transform="translate(56,4)"><AgentRocket color="url(#h2g)" /></g>
                <text x="80" y="78" textAnchor="middle" fontFamily="'Sora', system-ui" fontSize="22" fontWeight="600" letterSpacing="0.3">
                  <tspan fill="#ffffff">Elon</tspan><tspan fill={CYAN}>Agents</tspan>
                </text>
              </svg>
            </div>
            <DL svgRef={rH2} name="elonagents-stacked-purple" />
          </div>
        </div>
      </section>

      {/* I — OG Card */}
      <section className="mb-14">
        <Label num="I" title="OG / Social Card" desc="1200×630 preview card for Twitter, Discord, etc." />
        <div className="max-w-2xl">
          <div className="overflow-hidden rounded-2xl border border-white/[0.10]" style={{ aspectRatio: "1200/630" }}>
            <svg ref={rI1} viewBox="0 0 1200 630" className="w-full h-full">
              <defs>
                <linearGradient id="ogbg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#05050A" /><stop offset="60%" stopColor="#080808" /><stop offset="100%" stopColor="#05050A" /></linearGradient>
                <linearGradient id="ogicon" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={CYAN} /><stop offset="100%" stopColor={PURPLE} /></linearGradient>
              </defs>
              <rect width="1200" height="630" fill="url(#ogbg)" />
              <g transform="translate(513,165) scale(3.5)"><AgentRocket color="url(#ogicon)" width={4} /></g>
              <text x="600" y="430" textAnchor="middle" fontFamily="'Sora', system-ui" fontSize="72" fontWeight="600" letterSpacing="1">
                <tspan fill={PURPLE}>Elon</tspan><tspan fill={TEXT_WHITE}>Agents</tspan>
              </text>
              <text x="600" y="480" textAnchor="middle" fontFamily="'Sora', system-ui" fontSize="20" fontWeight="400" fill={PURPLE} opacity="0.5" letterSpacing="4">
                NETWORK OF AI SPACE AGENTS
              </text>
            </svg>
          </div>
          <DL svgRef={rI1} name="elonagents-og-card" />
        </div>
      </section>

      {/* J — PFP / Favicon */}
      <section className="mb-14">
        <Label num="J" title="PFP / Favicon" desc="Square icon for profile pics, favicons, app icons." />
        <div className="flex gap-5 flex-wrap items-end">
          <div>
            <div className="bg-[#05050A] rounded-2xl border border-white/[0.10] p-6 w-32 h-32 flex items-center justify-center">
              <svg ref={rJ1} viewBox="0 0 64 64" className="w-full h-full">
                <defs><linearGradient id="pfp1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={CYAN} /><stop offset="100%" stopColor={PURPLE} /></linearGradient></defs>
                <g transform="translate(8,8)"><AgentRocket color="url(#pfp1)" /></g>
              </svg>
            </div>
            <DL svgRef={rJ1} name="elonagents-pfp-dark" />
          </div>
          <div>
            <div className="rounded-2xl border border-amber-400/30 p-6 w-32 h-32 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1C1C2A, #2A2A2A)" }}>
              <svg ref={rJ2} viewBox="0 0 64 64" className="w-full h-full">
                <defs><linearGradient id="pfp2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ffffff" /><stop offset="100%" stopColor={CYAN} /></linearGradient></defs>
                <g transform="translate(8,8)"><AgentRocket color="url(#pfp2)" /></g>
              </svg>
            </div>
            <DL svgRef={rJ2} name="elonagents-pfp-purple" />
          </div>
          <div className="flex gap-2 items-center">
            <div className="bg-[#05050A] rounded-lg border border-white/[0.10] w-8 h-8 flex items-center justify-center">
              <svg viewBox="0 0 48 48" className="w-5 h-5">
                <defs><linearGradient id="tiny1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={CYAN} /><stop offset="100%" stopColor={PURPLE} /></linearGradient></defs>
                <AgentRocket color="url(#tiny1)" />
              </svg>
            </div>
            <div className="bg-[#05050A] rounded-lg border border-white/[0.10] w-5 h-5 flex items-center justify-center">
              <svg viewBox="0 0 48 48" className="w-3 h-3">
                <defs><linearGradient id="tiny2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={CYAN} /><stop offset="100%" stopColor={PURPLE} /></linearGradient></defs>
                <AgentRocket color="url(#tiny2)" />
              </svg>
            </div>
            <p className="text-[10px] text-white/20 ml-2">← 32px / 20px</p>
          </div>
        </div>
      </section>

      {/* COMPARE STRIP */}
      <section className="mb-14">
        <Label num="COMPARE" title="All Icon Styles Side-by-Side" desc="Same text, different icon styles." />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "A · Agent", Cmp: AgentRocket },
            { label: "B · Rocket", Cmp: RocketMinimal },
            { label: "C · Neural", Cmp: NeuralLink },
            { label: "D · Beacon", Cmp: SignalBeacon },
            { label: "E · Starship", Cmp: StarshipIcon },
          ].map(({ label, Cmp }, i) => (
            <div key={i} className="bg-[#05050A] rounded-xl border border-white/[0.10] p-4 flex flex-col gap-3">
              <p className="text-[8px] font-mono text-amber-400/30 tracking-widest">{label}</p>
              <svg viewBox="0 0 200 32" className="w-full">
                <defs><linearGradient id={`cmp${i}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={CYAN} /><stop offset="100%" stopColor={PURPLE} /></linearGradient></defs>
                <g transform="scale(0.64)"><Cmp color={`url(#cmp${i})`} /></g>
                <text x="36" y="22" fontFamily="'Sora', system-ui" fontSize="17" fontWeight="600" letterSpacing="0.2">
                  <tspan fill={PURPLE}>Elon</tspan><tspan fill={TEXT_WHITE}>Agents</tspan>
                </text>
              </svg>
            </div>
          ))}
        </div>
      </section>

      <div className="border-t border-white/[0.10] pt-8 pb-12 text-center">
        <p className="text-[10px] font-mono text-white/15">
          ElonAgents · Sora 600 Locked · Pick an icon style (A\u2013E)
        </p>
      </div>
    </div>
  );
}
