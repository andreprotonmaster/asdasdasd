"use client";

import { useState, useEffect, useCallback, useMemo, useRef, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  Satellite,
  Wifi,
  ArrowUpDown,
  MapPin,
  Activity,
  RefreshCw,
  Rocket,
  Timer,
  AlertTriangle,
  TrendingUp,
  Radio,
  ExternalLink,
  Clock,
  Target,
  Gauge,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  EyeOff,
} from "lucide-react";
import type {
  StarlinkData,
  MapSatellite,
  ShellInfo,
  NextLaunch,
} from "@/types/starlink";

const statusConfig = {
  active: {
    color: "text-spacex-success",
    bg: "bg-spacex-success",
    label: "ACTIVE",
  },
  maneuvering: {
    color: "text-spacex-warning",
    bg: "bg-spacex-warning",
    label: "MANEUVER",
  },
  deorbiting: {
    color: "text-spacex-danger",
    bg: "bg-spacex-danger",
    label: "DEORBIT",
  },
};

const OrbitVisualization = memo(function OrbitVisualization({
  constellation,
  mapSatellites,
}: {
  shells: ShellInfo[];
  constellation: StarlinkData["constellation"];
  mapSatellites: MapSatellite[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedSat, setSelectedSat] = useState<MapSatellite | null>(null);
  const [hoveredSat, setHoveredSat] = useState<MapSatellite | null>(null);
  const [statusFilter, setStatusFilter] = useState<Record<string, boolean>>({
    active: true, maneuvering: true, deorbiting: true,
  });
  const [showLabels, setShowLabels] = useState(false);

  // Rotation/zoom in refs to avoid re-renders during drag
  const rotRef = useRef({ lng: -30, lat: 20, zoom: 1 });
  const [hudState, setHudState] = useState({ lng: -30, lat: 20, zoom: 1, visCount: 0 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, lng: 0, lat: 0 });
  const rafRef = useRef<number>(0);
  const projectedRef = useRef<Array<MapSatellite & { px: number; py: number; depth: number }>>([]);
  const statusFilterRef = useRef(statusFilter);
  statusFilterRef.current = statusFilter;
  const showLabelsRef = useRef(showLabels);
  showLabelsRef.current = showLabels;
  const selectedRef = useRef(selectedSat);
  selectedRef.current = selectedSat;
  const hoveredRef = useRef(hoveredSat);
  hoveredRef.current = hoveredSat;

  const totalSats = constellation.total;
  const healthPct = Math.round((constellation.active / totalSats) * 100);

  const statusColors: Record<string, string> = {
    active: "#00E676", maneuvering: "#FFB74D", deorbiting: "#FF5252",
  };

  // Continent data
  const continentData = useMemo(() => [
    { coords: [[58,-135],[60,-140],[62,-148],[64,-155],[66,-162],[68,-165],[70,-162],[72,-157],[73,-150],[72,-140],[71,-137],[70,-131],[68,-128],[65,-122],[62,-118],[60,-116],[58,-124],[56,-130],[52,-128],[50,-127],[48,-124.5],[46,-124],[44,-124.5],[42,-124],[40,-124],[38,-122.5],[36,-122],[34.5,-120.5],[33,-118],[32.5,-117],[31,-116],[29,-114],[27,-112],[25,-110],[23,-107],[21,-105],[19,-104],[18,-100],[18,-96],[19,-92],[20,-90],[21,-87],[23,-84],[25,-80],[26,-80],[27,-82],[28.5,-82.5],[30,-84],[30.5,-86],[29,-89],[30,-90],[29,-91],[28,-92],[27,-97],[26,-97],[25.5,-97.5],[26,-97],[28,-96],[30,-94],[30,-90],[31,-88],[32,-85],[33,-80],[34,-78],[35,-76],[36,-76],[37,-76],[38,-75.5],[39,-75],[39.5,-74],[40,-74],[41,-72],[42,-71],[42,-70],[43,-70],[44,-68],[45,-67],[46,-66],[47,-65],[48,-64],[49,-63],[50,-60],[51,-57],[52,-56],[53,-56],[55,-59],[56,-60],[58,-62],[59,-64],[60,-65],[62,-66],[63,-70],[64,-72],[65,-75],[66,-78],[67,-82],[68,-88],[69,-94],[70,-100],[70,-105],[69,-110],[68,-115],[66,-120],[64,-128],[62,-133],[60,-136]] as [number,number][] },
    { coords: [[18,-100],[17,-99],[16,-97],[15,-93],[14,-90],[14,-88],[13,-87],[12,-86],[11,-84],[10,-84],[9,-83],[8,-82],[8,-80],[9,-79.5],[9,-78],[8,-77],[7.5,-77.5],[7,-77],[8,-76],[9,-76],[10,-76],[11,-75.5],[12,-72],[11,-74],[10,-76],[10,-78],[11,-80],[12,-82],[13,-84],[14,-86],[15,-88],[16,-90],[17,-93],[18,-96],[18,-100]] as [number,number][] },
    { coords: [[12,-72],[11,-70],[10,-67],[8,-63],[7,-60],[6,-57],[5,-54],[4,-52],[3,-50],[2,-50],[1,-49],[0,-49],[-1,-48],[-2,-45],[-3,-42],[-4,-39],[-5,-36],[-6,-35],[-7,-35],[-8,-35],[-10,-36],[-12,-37],[-14,-39],[-16,-39],[-18,-40],[-20,-41],[-22,-41],[-23,-43],[-24,-45],[-25,-47],[-27,-49],[-29,-50],[-30,-51],[-32,-52],[-33,-53],[-35,-57],[-37,-58],[-39,-62],[-41,-64],[-43,-65],[-45,-66],[-47,-66],[-49,-68],[-51,-69],[-53,-70],[-54,-69],[-55,-67],[-54,-66],[-53,-64],[-52,-68],[-50,-72],[-48,-74],[-46,-74],[-44,-73],[-42,-73],[-40,-72],[-38,-70],[-36,-72],[-34,-72],[-32,-71],[-30,-71],[-28,-70],[-26,-70],[-24,-70],[-22,-70],[-20,-70],[-18,-72],[-16,-75],[-14,-76],[-12,-77],[-10,-78],[-8,-80],[-6,-80],[-4,-80],[-2,-80],[-1,-79],[0,-79],[1,-78],[3,-78],[5,-77],[7,-76],[8,-74],[10,-72]] as [number,number][] },
    { coords: [[36,-6],[37,-7],[38,-9],[39,-9],[40,-8],[41,-8],[43,-9],[44,-8],[43.5,-3],[44,-1],[43,0],[43,3],[43,5],[44,8],[45,7],[46,6],[47,5],[48,3],[49,2],[50,2],[51,3],[51,5],[52,5],[53,6],[53.5,8],[54,8.5],[54.5,10],[55,10],[55.5,12],[56,12],[57,12],[57,16],[58,18],[59,20],[59,22],[60,24],[60,28],[61,28],[62,30],[63,28],[64,26],[65,25],[66,24],[67,22],[68,20],[69.5,20],[70,22],[70.5,26],[71,28],[71,30],[70,32],[69,34],[68,36],[66,37],[64,38],[62,40],[60,40],[58,42],[56,42],[54,40],[52,40],[50,40],[48,38],[47,36],[46,34],[45,32],[44,30],[43,28],[42,28],[41,26],[40,26],[39,24],[38,24],[37,22],[36,20],[36,16],[36,12],[37,10],[37,6],[37,3],[37,0],[36,-3],[36,-5]] as [number,number][] },
    { coords: [[37,10],[37,8],[36,5],[36,2],[36,0],[35,-3],[35,-5],[34,-6],[33,-7],[32,-8],[31,-10],[30,-10],[28,-13],[26,-15],[24,-16],[22,-17],[20,-17],[18,-16],[16,-16],[14,-17],[12,-16],[10,-15],[8,-14],[6,-10],[5,-8],[5,-5],[4,-3],[4,0],[5,2],[6,2],[7,1],[8,0],[10,-1],[12,-2],[14,0],[15,0],[15,2],[13,5],[11,8],[10,10],[8,12],[6,10],[5,10],[4,9],[3,10],[2,10],[1,10],[0,10],[-1,10],[-2,12],[-3,12],[-4,12],[-5,12],[-6,12],[-8,14],[-10,14],[-12,14],[-14,14],[-16,16],[-18,18],[-20,20],[-22,22],[-24,24],[-26,26],[-28,28],[-30,30],[-32,30],[-33,28],[-34,26],[-34.5,24],[-35,22],[-34,20],[-34,18],[-33,16],[-32,16],[-30,18],[-28,16],[-26,15],[-24,14],[-22,14],[-20,14],[-18,12],[-16,12],[-14,12],[-12,12],[-10,14],[-8,14],[-6,12],[-4,10],[-2,10],[0,10],[1,8],[2,6],[3,4],[4,2],[5,0],[6,-2],[8,-4],[10,-6],[12,-8],[14,-10],[15,-12],[16,-14],[18,-16],[20,-16],[22,-14],[24,-14],[26,-14],[28,-12],[30,-10],[32,-8],[33,-6],[34,-3],[35,-2],[35,0],[35,2],[36,5],[37,8],[37,10]] as [number,number][] },
    { coords: [[37,10],[36,12],[35,12],[34,14],[32,14],[31,28],[30,30],[28,32],[26,34],[24,36],[22,37],[20,38],[18,40],[16,42],[14,44],[12,46],[10,48],[8,48],[6,46],[4,44],[2,42],[0,42],[-2,42],[-4,40],[-6,40],[-8,40],[-10,40],[-12,40],[-14,40],[-16,38],[-18,36],[-20,34],[-22,32],[-24,30],[-26,28],[-28,28],[-30,30]] as [number,number][] },
    { coords: [[42,28],[44,32],[46,36],[48,38],[50,40],[52,42],[54,44],[56,46],[58,50],[60,54],[60,58],[58,60],[56,60],[54,62],[52,64],[50,66],[48,66],[46,68],[44,70],[46,72],[48,74],[50,76],[52,78],[54,78],[56,76],[58,72],[60,70],[62,72],[64,76],[66,80],[68,84],[69,90],[70,95],[71,100],[72,108],[72,118],[72,128],[72,135],[71,140],[70,145],[70,150],[69,155],[68,160],[66,165],[64,168],[62,168],[60,165],[58,163],[56,160],[54,158],[52,155],[50,150],[48,146],[46,143],[44,142],[42,141],[40,140],[38,138],[36,137],[35,135],[34,132],[33,130],[32,128],[30,122],[28,118],[26,115],[24,112],[22,110],[20,108],[18,106],[16,105],[14,103],[12,102],[10,100],[8,98],[6,98],[4,100],[3,102],[2,104],[1,104],[0,104],[-2,106],[-4,106],[-6,106],[-8,108],[6,98],[8,96],[10,92],[12,88],[14,82],[16,80],[18,78],[20,74],[22,72],[24,70],[26,68],[28,66],[30,60],[32,54],[34,48],[36,42],[38,36],[40,32],[42,28]] as [number,number][] },
    { coords: [[28,68],[26,70],[24,72],[22,73],[20,73],[18,74],[16,76],[14,77],[12,78],[10,79],[8,78],[8,76],[10,76],[10,74],[8,76],[6,80],[8,78],[8,74],[10,72],[12,72],[14,74],[16,74],[18,72],[20,70],[22,68],[24,70],[26,72],[28,68]] as [number,number][] },
    { coords: [[10,100],[8,98],[6,100],[4,102],[2,104],[1,104],[0,104],[-2,106],[-4,106],[-6,106],[-7,108],[-8,110],[-7,112],[-6,114],[-5,116],[-4,118],[-2,118],[0,116],[2,114],[4,110],[6,108],[8,106],[10,104]] as [number,number][] },
    { coords: [[-11,132],[-12,130],[-13,128],[-14,127],[-15,125],[-16,124],[-17,122],[-18,120],[-19,118],[-20,116],[-22,114],[-24,114],[-26,113],[-28,114],[-30,115],[-32,116],[-33,117],[-34,118],[-35,118],[-36,120],[-37,122],[-38,126],[-38,130],[-38,134],[-38,138],[-38,142],[-38,146],[-37,148],[-36,149],[-35,150],[-34,151],[-32,152],[-30,153],[-28,154],[-26,153],[-24,152],[-22,150],[-20,149],[-18,147],[-16,146],[-14,144],[-13,142],[-12,140],[-12,138],[-11,136],[-11,134],[-11,132]] as [number,number][] },
    { coords: [[31,131],[33,131],[34,133],[35,134],[36,136],[37,137],[38,139],[39,140],[40,140],[41,140],[42,141],[43,142],[44,144],[45,143],[44,142],[43,141],[41,140.5],[40,139],[38,137],[36,135],[34,132],[32,130]] as [number,number][] },
    { coords: [[-35,172],[-36,174],[-37,175],[-38,176],[-40,176],[-42,174],[-44,172],[-46,168],[-46,166],[-44,168],[-42,172],[-40,174],[-38,176],[-36,176],[-35,174],[-35,172]] as [number,number][] },
    { coords: [[50,-5.5],[50.5,-3],[51,1],[51.5,1.5],[52,1],[52.5,0],[53,-1],[53.5,0],[54,-1],[54.5,-3],[55,-3],[55.5,-5],[56,-5],[57,-5],[58,-4],[58.5,-5],[58,-6],[57,-6],[56,-6],[55,-5.5],[54,-5],[53,-4.5],[52,-4],[51,-4],[50.5,-5],[50,-5.5]] as [number,number][] },
    { coords: [[52,-6],[52.5,-7],[53,-10],[53.5,-10],[54,-10],[54.5,-8.5],[55,-7],[54.5,-6],[54,-6],[53.5,-6],[53,-6],[52.5,-6.5],[52,-6]] as [number,number][] },
    { coords: [[64,-22],[65,-24],[66,-23],[66,-18],[65.5,-14],[65,-14],[64.5,-14],[64,-16],[63.5,-18],[64,-20],[64,-22]] as [number,number][] },
    { coords: [[-12,49],[-14,48],[-16,46],[-18,44],[-20,44],[-22,44],[-24,45],[-25,47],[-24,48],[-22,48],[-20,49],[-18,50],[-16,50],[-14,50],[-12,49]] as [number,number][] },
    { coords: [[60,-44],[62,-48],[64,-52],[66,-54],[68,-55],[70,-54],[72,-52],[74,-50],[76,-46],[78,-42],[80,-38],[82,-30],[83,-24],[83,-18],[82,-16],[80,-18],[78,-20],[76,-22],[74,-22],[72,-24],[70,-26],[68,-30],[66,-34],[64,-38],[62,-42],[60,-44]] as [number,number][] },
    { coords: [[30,36],[28,38],[26,40],[24,42],[22,44],[20,46],[18,48],[16,48],[14,48],[14,44],[16,42],[18,40],[20,38],[22,36],[24,36],[26,36],[28,36],[30,36]] as [number,number][] },
  ], []);

  // Stars (computed once)
  const starsData = useMemo(() =>
    Array.from({ length: 80 }, (_, i) => ({
      x: (i * 173.37) % 500, y: (i * 119.83) % 500,
      r: 0.3 + (i % 3) * 0.3, a: 0.1 + (i % 5) * 0.05,
    })), []);

  // Orthographic projection (pure function, reads args not state)
  const projectPt = (lat: number, lng: number, rLng: number, rLat: number, gR: number, cx: number, cy: number) => {
    const latR = lat * 0.017453;
    const lngR = (lng - rLng) * 0.017453;
    const lat0R = rLat * 0.017453;
    const sinLat0 = Math.sin(lat0R), cosLat0 = Math.cos(lat0R);
    const sinLat = Math.sin(latR), cosLat = Math.cos(latR);
    const cosLng = Math.cos(lngR), sinLng = Math.sin(lngR);
    const cosC = sinLat0 * sinLat + cosLat0 * cosLat * cosLng;
    if (cosC < -0.02) return null;
    return {
      x: cx + gR * cosLat * sinLng,
      y: cy - gR * (cosLat0 * sinLat - sinLat0 * cosLat * cosLng),
      visible: cosC >= 0,
      depth: cosC,
    };
  };

  // Canvas render
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const { lng: rLng, lat: rLat, zoom: z } = rotRef.current;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width * dpr;
    const h = rect.height * dpr;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const rw = rect.width, rh = rect.height;
    const cx = rw / 2, cy = rh / 2;
    const baseR = Math.min(rw, rh) * 0.42;
    const gR = baseR * z;

    // Background
    const bgGrad = ctx.createRadialGradient(rw * 0.38, rh * 0.35, 0, cx, cy, rw * 0.55);
    bgGrad.addColorStop(0, "#0A0A12");
    bgGrad.addColorStop(1, "#030508");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, rw, rh);

    // Stars
    ctx.fillStyle = "white";
    for (const s of starsData) {
      ctx.globalAlpha = s.a;
      ctx.beginPath();
      ctx.arc(s.x * (rw / 500), s.y * (rh / 500), s.r, 0, 6.283);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Globe sphere
    const gGrad = ctx.createRadialGradient(cx - gR * 0.14, cy - gR * 0.2, 0, cx, cy, gR);
    gGrad.addColorStop(0, "#102844");
    gGrad.addColorStop(0.4, "#0a1e38");
    gGrad.addColorStop(0.8, "#071428");
    gGrad.addColorStop(1, "#040a14");
    ctx.beginPath();
    ctx.arc(cx, cy, gR, 0, 6.283);
    ctx.fillStyle = gGrad;
    ctx.fill();

    // Clip to globe
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, gR, 0, 6.283);
    ctx.clip();

    // Graticule
    ctx.strokeStyle = "rgba(0,212,255,0.035)";
    ctx.lineWidth = 0.5;
    for (let lng = -180; lng < 180; lng += 30) {
      ctx.beginPath();
      let started = false;
      for (let lat = -90; lat <= 90; lat += 5) {
        const p = projectPt(lat, lng, rLng, rLat, gR, cx, cy);
        if (p && p.visible) {
          if (!started) { ctx.moveTo(p.x, p.y); started = true; }
          else ctx.lineTo(p.x, p.y);
        } else { started = false; }
      }
      ctx.stroke();
    }
    for (let lat = -60; lat <= 60; lat += 30) {
      ctx.beginPath();
      let started = false;
      for (let lng = -180; lng <= 180; lng += 5) {
        const p = projectPt(lat, lng, rLng, rLat, gR, cx, cy);
        if (p && p.visible) {
          if (!started) { ctx.moveTo(p.x, p.y); started = true; }
          else ctx.lineTo(p.x, p.y);
        } else { started = false; }
      }
      ctx.stroke();
    }
    // Equator
    ctx.strokeStyle = "rgba(0,212,255,0.10)";
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    let eqStarted = false;
    for (let lng = -180; lng <= 180; lng += 3) {
      const p = projectPt(0, lng, rLng, rLat, gR, cx, cy);
      if (p && p.visible) {
        if (!eqStarted) { ctx.moveTo(p.x, p.y); eqStarted = true; }
        else ctx.lineTo(p.x, p.y);
      } else { eqStarted = false; }
    }
    ctx.stroke();

    // Continents
    ctx.fillStyle = "rgba(18,90,45,0.25)";
    ctx.strokeStyle = "rgba(40,150,70,0.35)";
    ctx.lineWidth = 0.7;
    ctx.lineJoin = "round";
    for (const cont of continentData) {
      const pts: { x: number; y: number }[] = [];
      for (const [lat, lng] of cont.coords) {
        const p = projectPt(lat, lng, rLng, rLat, gR, cx, cy);
        if (p && p.visible) pts.push(p);
      }
      if (pts.length < 3) continue;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Satellites
    const filter = statusFilterRef.current;
    const projected: Array<MapSatellite & { px: number; py: number; depth: number }> = [];
    const counts = { active: 0, maneuvering: 0, deorbiting: 0 };
    for (const sat of mapSatellites) {
      if (!filter[sat.status]) continue;
      const p = projectPt(sat.lat, sat.lng, rLng, rLat, gR, cx, cy);
      if (!p || !p.visible) continue;
      projected.push({ ...sat, px: p.x, py: p.y, depth: p.depth });
      counts[sat.status as keyof typeof counts]++;
    }
    projected.sort((a, b) => a.depth - b.depth);
    projectedRef.current = projected;

    const sel = selectedRef.current;
    const hov = hoveredRef.current;
    const labels = showLabelsRef.current;
    const dotR = z > 1.5 ? 1.4 : 1;

    // Batch by color for fewer state changes
    for (const status of ["active", "maneuvering", "deorbiting"] as const) {
      const color = statusColors[status];
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.75;
      ctx.beginPath();
      for (const sat of projected) {
        if (sat.status !== status) continue;
        const isHighlight = sel?.noradId === sat.noradId || hov?.noradId === sat.noradId;
        if (isHighlight) continue; // draw highlights separately
        ctx.moveTo(sat.px + dotR, sat.py);
        ctx.arc(sat.px, sat.py, dotR, 0, 6.283);
      }
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Highlighted satellites
    for (const sat of projected) {
      const isSelected = sel?.noradId === sat.noradId;
      const isHov = hov?.noradId === sat.noradId;
      if (!isSelected && !isHov) continue;
      const color = statusColors[sat.status];
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.06;
      ctx.beginPath();
      ctx.arc(sat.px, sat.py, 7, 0, 6.283);
      ctx.fill();
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = color;
      ctx.lineWidth = 0.4;
      ctx.beginPath();
      ctx.arc(sat.px, sat.py, 4.5, 0, 6.283);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(sat.px, sat.py, 3, 0, 6.283);
      ctx.fill();
      if (labels) {
        ctx.font = "6px monospace";
        ctx.globalAlpha = 0.8;
        ctx.fillText(sat.id, sat.px + 5, sat.py - 3);
        ctx.globalAlpha = 1;
      }
    }

    ctx.restore(); // undo clip

    // Atmosphere glow
    ctx.globalAlpha = 0.07;
    ctx.strokeStyle = "rgba(34,211,238,1)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, gR, 0, 6.283);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Atmosphere haze
    const atmoGrad = ctx.createRadialGradient(cx, cy, gR * 0.86, cx, cy, gR + 6);
    atmoGrad.addColorStop(0, "transparent");
    atmoGrad.addColorStop(0.7, "rgba(34,211,238,0.04)");
    atmoGrad.addColorStop(1, "rgba(34,211,238,0.01)");
    ctx.fillStyle = atmoGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, gR + 6, 0, 6.283);
    ctx.fill();

    // HUD corners
    ctx.strokeStyle = "rgba(0,212,255,0.14)";
    ctx.lineWidth = 1;
    const m = 12, m2 = 28;
    ctx.beginPath(); ctx.moveTo(m, m2); ctx.lineTo(m, m); ctx.lineTo(m2, m); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(rw - m2, m); ctx.lineTo(rw - m, m); ctx.lineTo(rw - m, m2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(rw - m, rh - m2); ctx.lineTo(rw - m, rh - m); ctx.lineTo(rw - m2, rh - m); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(m2, rh - m); ctx.lineTo(m, rh - m); ctx.lineTo(m, rh - m2); ctx.stroke();

    // HUD text
    ctx.font = "7px monospace";
    ctx.textBaseline = "top";
    // Top-left
    ctx.fillStyle = "rgba(0,212,255,0.45)";
    ctx.textAlign = "left";
    ctx.fillText("CONSTELLATION", 18, 17);
    ctx.font = "bold 14px monospace";
    ctx.fillStyle = "white";
    ctx.fillText(totalSats.toLocaleString(), 18, 27);
    ctx.font = "7px monospace";
    ctx.fillStyle = "rgba(0,230,118,0.45)";
    ctx.fillText("TRACKED", 18, 43);
    // Top-right
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(0,212,255,0.45)";
    ctx.fillText("HEALTH", rw - 18, 17);
    ctx.font = "bold 14px monospace";
    ctx.fillStyle = healthPct > 90 ? "#00E676" : "#FFB74D";
    ctx.fillText(`${healthPct}%`, rw - 18, 27);
    // Bottom-left
    ctx.textAlign = "left";
    ctx.font = "7px monospace";
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = "#00E676";
    ctx.fillText(`● ${counts.active.toLocaleString()} active`, 18, rh - 42);
    ctx.fillStyle = "#FFB74D";
    ctx.fillText(`● ${counts.maneuvering.toLocaleString()} maneuver`, 18, rh - 31);
    ctx.fillStyle = "#FF5252";
    ctx.fillText(`● ${counts.deorbiting.toLocaleString()} deorbit`, 18, rh - 20);
    ctx.globalAlpha = 1;
    // Bottom-right
    ctx.textAlign = "right";
    const normLng = (((rLng % 360) + 540) % 360 - 180).toFixed(0);
    ctx.fillStyle = "rgba(0,212,255,0.35)";
    ctx.fillText(`LAT ${rLat.toFixed(0)}° LNG ${normLng}°`, rw - 18, rh - 31);
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fillText(`${z.toFixed(1)}x • DRAG TO ROTATE`, rw - 18, rh - 20);

    // Update HUD state (throttled — only when not dragging)
    if (!isDraggingRef.current) {
      setHudState({ lng: rLng, lat: rLat, zoom: z, visCount: projected.length });
    }
  }, [mapSatellites, continentData, starsData, totalSats, healthPct, statusColors]);

  // Initial render + re-render on data/filter changes
  useEffect(() => {
    render();
  }, [render, statusFilter, showLabels, selectedSat, hoveredSat]);

  // ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const obs = new ResizeObserver(() => render());
    obs.observe(container);
    return () => obs.disconnect();
  }, [render]);

  // Mouse/wheel handlers via native events for perf
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      const r = rotRef.current;
      dragStartRef.current = { x: e.clientX, y: e.clientY, lng: r.lng, lat: r.lat };
      canvas.style.cursor = "grabbing";
      window.addEventListener("mousemove", onDragMove);
      window.addEventListener("mouseup", onDragUp);
    };
    const onDragMove = (e: MouseEvent) => {
      const ds = dragStartRef.current;
      rotRef.current = {
        ...rotRef.current,
        lng: ds.lng - (e.clientX - ds.x) * 0.35,
        lat: Math.max(-80, Math.min(80, ds.lat + (e.clientY - ds.y) * 0.35)),
      };
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(render);
    };
    const onDragUp = () => {
      isDraggingRef.current = false;
      canvas.style.cursor = "grab";
      const r = rotRef.current;
      setHudState((p) => ({ ...p, lng: r.lng, lat: r.lat, zoom: r.zoom }));
      render();
      window.removeEventListener("mousemove", onDragMove);
      window.removeEventListener("mouseup", onDragUp);
    };
    const onHover = (e: MouseEvent) => {
      if (isDraggingRef.current) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      let nearest: (typeof projectedRef.current)[0] | null = null;
      let bestDist = 64;
      for (const sat of projectedRef.current) {
        const dx = sat.px - mx, dy = sat.py - my;
        const d2 = dx * dx + dy * dy;
        if (d2 < bestDist) { bestDist = d2; nearest = sat; }
      }
      setHoveredSat(nearest);
      canvas.style.cursor = nearest ? "pointer" : "grab";
    };
    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      let nearest: (typeof projectedRef.current)[0] | null = null;
      let bestDist = 64;
      for (const sat of projectedRef.current) {
        const dx = sat.px - mx, dy = sat.py - my;
        const d2 = dx * dx + dy * dy;
        if (d2 < bestDist) { bestDist = d2; nearest = sat; }
      }
      if (nearest) {
        setSelectedSat((prev) => prev?.noradId === nearest!.noradId ? null : nearest);
      } else {
        setSelectedSat(null);
      }
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      rotRef.current = {
        ...rotRef.current,
        zoom: Math.max(0.6, Math.min(3, rotRef.current.zoom - e.deltaY * 0.001)),
      };
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(render);
    };

    canvas.addEventListener("mousedown", onDown);
    canvas.addEventListener("mousemove", onHover);
    canvas.addEventListener("click", onClick);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      canvas.removeEventListener("mousedown", onDown);
      canvas.removeEventListener("mousemove", onHover);
      canvas.removeEventListener("click", onClick);
      canvas.removeEventListener("wheel", onWheel);
      window.removeEventListener("mousemove", onDragMove);
      window.removeEventListener("mouseup", onDragUp);
      cancelAnimationFrame(rafRef.current);
    };
  }, [render]);

  const displaySat = hoveredSat || selectedSat;

  return (
    <div className="glass-panel p-3 hud-corners relative overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 shrink-0">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-spacex-accent" />
          <h3 className="text-xs font-mono font-semibold text-spacex-accent tracking-wider uppercase">
            Position Globe
          </h3>
          <span className="text-[9px] font-mono text-spacex-muted ml-1">
            {hudState.visCount.toLocaleString()} / {mapSatellites.length.toLocaleString()} visible
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {(["active", "maneuvering", "deorbiting"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter((f) => ({ ...f, [s]: !f[s] }))}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-mono tracking-wider transition-all border ${
                statusFilter[s] ? "border-white/10 bg-white/5" : "border-transparent opacity-40"
              }`}
              style={{ color: statusColors[s] }}
            >
              {statusFilter[s] ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
              {s === "active" ? "ACT" : s === "maneuvering" ? "MNV" : "DRB"}
            </button>
          ))}
        </div>
      </div>

      {/* Canvas Globe */}
      <div ref={containerRef} className="relative w-full flex-1 min-h-0">
        <div className="absolute inset-0">
          <canvas
            ref={canvasRef}
            className="w-full h-full select-none"
            style={{ borderRadius: "0.75rem" }}
          />

          {/* Zoom controls */}
          <div className="absolute bottom-2 right-2 flex flex-col gap-1 z-10">
            <button onClick={() => { rotRef.current = { ...rotRef.current, zoom: Math.min(3, rotRef.current.zoom + 0.3) }; render(); }} className="glass-panel w-7 h-7 flex items-center justify-center hover:bg-white/5 rounded" title="Zoom in">
              <ZoomIn className="w-3 h-3 text-spacex-accent" />
            </button>
            <button onClick={() => { rotRef.current = { ...rotRef.current, zoom: Math.max(0.6, rotRef.current.zoom - 0.3) }; render(); }} className="glass-panel w-7 h-7 flex items-center justify-center hover:bg-white/5 rounded" title="Zoom out">
              <ZoomOut className="w-3 h-3 text-spacex-accent" />
            </button>
            <button onClick={() => { rotRef.current = { lng: -30, lat: 20, zoom: 1 }; render(); setHudState((p) => ({ ...p, lng: -30, lat: 20, zoom: 1 })); }} className="glass-panel w-7 h-7 flex items-center justify-center hover:bg-white/5 rounded" title="Reset">
              <RotateCcw className="w-3 h-3 text-spacex-accent" />
            </button>
            <button onClick={() => setShowLabels((l) => !l)} className={`glass-panel w-7 h-7 flex items-center justify-center hover:bg-white/5 rounded ${showLabels ? "border border-spacex-accent/30" : ""}`} title="Labels">
              <Satellite className="w-3 h-3 text-spacex-accent" />
            </button>
          </div>

          {/* Selected/hovered satellite detail */}
          <AnimatePresence>
            {displaySat && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="absolute top-2 left-2 glass-panel p-2.5 rounded-lg border border-spacex-accent/15 z-10 min-w-[180px]"
                style={{ backdropFilter: "blur(12px)" }}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-mono text-white font-bold">{displaySat.id}</p>
                  <span className="text-[8px] font-mono font-semibold px-1.5 py-0.5 rounded"
                    style={{ color: statusColors[displaySat.status], backgroundColor: statusColors[displaySat.status] + "15" }}>
                    {displaySat.status.toUpperCase()}
                  </span>
                </div>
                <div className="space-y-0.5 text-[9px] font-mono text-spacex-muted">
                  <div className="flex justify-between"><span>NORAD</span><span className="text-white">{displaySat.noradId}</span></div>
                  <div className="flex justify-between"><span>Alt</span><span className="text-spacex-accent">{displaySat.alt} km</span></div>
                  <div className="flex justify-between"><span>Vel</span><span className="text-white">{displaySat.vel.toLocaleString()} m/s</span></div>
                  <div className="flex justify-between"><span>Inc</span><span className="text-emerald-300">{displaySat.inc}°</span></div>
                  <div className="flex justify-between"><span>Pos</span><span className="text-white">{displaySat.lat.toFixed(1)}°, {displaySat.lng.toFixed(1)}°</span></div>
                  <div className="flex justify-between"><span>Shell</span><span className="text-amber-400 text-[8px]">{displaySat.shell}</span></div>
                </div>
                {selectedSat?.noradId === displaySat.noradId && (
                  <button onClick={() => setSelectedSat(null)}
                    className="mt-1.5 w-full text-[8px] font-mono text-spacex-muted hover:text-white py-0.5 border-t border-spacex-border/20 transition-colors">
                    DESELECT
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Fleet status bar below globe */}
      <div className="mt-2 grid grid-cols-3 gap-2 shrink-0">
        {[
          { label: "Active", count: constellation.active, color: "#00E676" },
          { label: "Maneuvering", count: constellation.maneuvering, color: "#FFB74D" },
          { label: "Deorbiting", count: constellation.deorbiting, color: "#FF5252" },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-[9px] font-mono text-spacex-muted">{s.label}</span>
            <span className="text-[10px] font-mono text-white font-bold ml-auto">{s.count.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
});
OrbitVisualization.displayName = "OrbitVisualization";

function ShellDistribution({ shells }: { shells: ShellInfo[] }) {
  const maxCount = Math.max(...shells.map((s) => s.count));

  return (
    <div className="glass-panel p-4 hud-corners">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-mono font-semibold text-amber-400 tracking-wider uppercase">
            Orbital Shell Distribution
          </h3>
        </div>
        <span className="text-[9px] font-mono text-spacex-muted tracking-wider">
          {shells.length} SHELLS
        </span>
      </div>

      <div className="space-y-2.5">
        {shells.slice(0, 8).map((shell, i) => (
          <motion.div
            key={shell.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono text-white truncate max-w-[180px]">
                {shell.name}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-spacex-accent">
                  {((shell.count / shells.reduce((a, s) => a + s.count, 0)) * 100).toFixed(1)}%
                </span>
                <span className="text-[10px] font-mono font-bold text-white">
                  {shell.count.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="h-1.5 rounded-full bg-spacex-dark/60 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(shell.count / maxCount) * 100}%` }}
                transition={{ duration: 0.6, delay: i * 0.04 }}
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-spacex-accent"
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function AltitudeStats({
  altitude,
}: {
  altitude: StarlinkData["altitude"];
}) {
  return (
    <div className="glass-panel p-4 hud-corners">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-emerald-300" />
        <h3 className="text-xs font-mono font-semibold text-emerald-300 tracking-wider uppercase">
          Altitude Telemetry
        </h3>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <p className="text-[9px] font-mono text-spacex-muted uppercase tracking-wider mb-1">
            Min
          </p>
          <p className="text-lg font-mono font-bold text-spacex-warning">
            {altitude.min}
          </p>
          <p className="text-[9px] font-mono text-spacex-muted">km</p>
        </div>
        <div className="text-center border-x border-spacex-border/30">
          <p className="text-[9px] font-mono text-spacex-muted uppercase tracking-wider mb-1">
            Avg
          </p>
          <p className="text-lg font-mono font-bold text-spacex-accent">
            {altitude.avg}
          </p>
          <p className="text-[9px] font-mono text-spacex-muted">km</p>
        </div>
        <div className="text-center">
          <p className="text-[9px] font-mono text-spacex-muted uppercase tracking-wider mb-1">
            Max
          </p>
          <p className="text-lg font-mono font-bold text-spacex-success">
            {altitude.max}
          </p>
          <p className="text-[9px] font-mono text-spacex-muted">km</p>
        </div>
      </div>
      {/* Visual altitude range bar */}
      <div className="mt-4 relative h-2 rounded-full bg-spacex-dark/60 overflow-hidden">
        <div
          className="absolute h-full bg-gradient-to-r from-spacex-warning via-spacex-accent to-spacex-success rounded-full"
          style={{
            left: `${((altitude.min - 200) / 500) * 100}%`,
            width: `${((altitude.max - altitude.min) / 500) * 100}%`,
          }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[8px] font-mono text-spacex-muted">200 km</span>
        <span className="text-[8px] font-mono text-spacex-muted">700 km</span>
      </div>
    </div>
  );
}

function LaunchCountdown({ net }: { net: string }) {
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date().getTime();
      const target = new Date(net).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setCountdown("LAUNCHED");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setCountdown(
          `${days}d ${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
        );
      } else {
        setCountdown(
          `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
        );
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [net]);

  return (
    <span className="text-lg font-mono font-bold text-spacex-thrust">
      {countdown || "—"}
    </span>
  );
}

function UpcomingLaunches({ launches }: { launches: NextLaunch[] }) {
  if (launches.length === 0) return null;

  const primary = launches[0];
  const rest = launches.slice(1);

  return (
    <div className="glass-panel p-4 hud-corners">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Rocket className="w-4 h-4 text-spacex-thrust" />
          <h3 className="text-xs font-mono font-semibold text-spacex-thrust tracking-wider uppercase">
            Upcoming Starlink Launches
          </h3>
        </div>
        <span className="text-[9px] font-mono text-spacex-muted tracking-wider">
          {launches.length} SCHEDULED
        </span>
      </div>

      {/* Primary / Next launch — expanded */}
      <div className="border border-spacex-thrust/20 rounded-lg p-3 mb-3 bg-spacex-thrust/[0.03]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] font-mono text-spacex-thrust tracking-wider uppercase">
            Next Launch
          </span>
          <div
            className={`px-2 py-0.5 rounded text-[9px] font-mono tracking-wider ${
              primary.statusAbbrev === "Go"
                ? "bg-spacex-success/20 text-spacex-success"
                : primary.statusAbbrev === "TBD"
                ? "bg-spacex-warning/20 text-spacex-warning"
                : "bg-spacex-accent/20 text-spacex-accent"
            }`}
          >
            {primary.status}
          </div>
        </div>

        <p className="text-sm font-mono font-bold text-white mb-1">
          {primary.mission}
        </p>
        <p className="text-[10px] font-mono text-spacex-muted line-clamp-2 mb-2">
          {primary.description}
        </p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-mono text-spacex-muted mb-2">
          <div className="flex items-center gap-1">
            <Rocket className="w-3 h-3" />
            <span className="text-white">{primary.rocket}</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            <span>{primary.pad}</span>
          </div>
          <div className="flex items-center gap-1">
            <Globe className="w-3 h-3" />
            <span>{primary.orbit}</span>
          </div>
          {primary.probability !== null && primary.probability >= 0 && (
            <div className="flex items-center gap-1">
              <Target className="w-3 h-3" />
              <span className="text-spacex-success">{primary.probability}% probability</span>
            </div>
          )}
        </div>

        {/* Countdown */}
        <div className="flex items-center gap-2 pt-2 border-t border-spacex-border/20">
          <Timer className="w-3.5 h-3.5 text-spacex-thrust" />
          <span className="text-[10px] font-mono text-spacex-muted">T-</span>
          <LaunchCountdown net={primary.net} />
        </div>

        <div className="flex items-center justify-between mt-1">
          <span className="text-[9px] font-mono text-spacex-muted">
            NET:{" "}
            {new Date(primary.net).toLocaleString("en-US", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </span>
          {primary.webcastUrl && (
            <a
              href={primary.webcastUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[9px] font-mono text-spacex-accent hover:text-spacex-accent/80 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              WEBCAST
            </a>
          )}
        </div>
      </div>

      {/* Additional upcoming launches — compact cards */}
      {rest.length > 0 && (
        <div className="space-y-2">
          <span className="text-[9px] font-mono text-spacex-muted tracking-wider uppercase">
            Following Launches
          </span>
          {rest.map((launch, i) => (
            <motion.div
              key={launch.name + i}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="flex items-center justify-between p-2.5 rounded-lg border border-spacex-border/20 hover:border-spacex-border/40 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-[10px] font-mono font-bold text-white truncate">
                    {launch.mission}
                  </p>
                  <div
                    className={`shrink-0 px-1.5 py-0.5 rounded text-[8px] font-mono tracking-wider ${
                      launch.statusAbbrev === "Go"
                        ? "bg-spacex-success/20 text-spacex-success"
                        : launch.statusAbbrev === "TBD"
                        ? "bg-spacex-warning/20 text-spacex-warning"
                        : "bg-spacex-accent/20 text-spacex-accent"
                    }`}
                  >
                    {launch.statusAbbrev}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[9px] font-mono text-spacex-muted">
                  <span>{launch.rocket}</span>
                  <span>
                    {new Date(launch.net).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <span>{launch.pad}</span>
                </div>
              </div>
              <div className="text-right ml-2 shrink-0">
                <div className="flex items-center gap-1 text-[10px] font-mono text-spacex-thrust">
                  <Clock className="w-3 h-3" />
                  <LaunchCountdown net={launch.net} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-bold text-white">
            STARLINK CONSTELLATION
          </h1>
          <p className="text-sm text-spacex-muted mt-1">
            Fetching real-time orbital data...
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glass-panel p-3 hud-corners animate-pulse">
            <div className="h-3 w-16 bg-spacex-border/30 rounded mb-2" />
            <div className="h-6 w-12 bg-spacex-border/30 rounded mb-1" />
            <div className="h-2 w-20 bg-spacex-border/20 rounded" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="glass-panel p-4 hud-corners h-[400px] animate-pulse"
          >
            <div className="h-4 w-32 bg-spacex-border/30 rounded mb-4" />
            <div className="h-full bg-spacex-border/10 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorState({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-white">
          STARLINK CONSTELLATION
        </h1>
      </div>
      <div className="glass-panel p-8 hud-corners flex flex-col items-center justify-center text-center">
        <AlertTriangle className="w-10 h-10 text-spacex-warning mb-4" />
        <p className="text-sm font-mono text-white mb-2">
          TELEMETRY LINK INTERRUPTED
        </p>
        <p className="text-xs font-mono text-spacex-muted mb-4 max-w-md">
          {error}
        </p>
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 rounded bg-spacex-accent/20 border border-spacex-accent/30 text-spacex-accent text-xs font-mono hover:bg-spacex-accent/30 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          RECONNECT
        </button>
      </div>
    </div>
  );
}

export default function StarlinkPage() {
  const [data, setData] = useState<StarlinkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<
    "all" | "active" | "maneuvering" | "deorbiting"
  >("all");
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/starlink");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: StarlinkData = await res.json();
      setData(json);
      setLastUpdated(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch data"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Refresh every 15 minutes
    const interval = setInterval(fetchData, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const satellites = data?.satellites ?? [];
  const constellation = data?.constellation ?? { total: 0, active: 0, maneuvering: 0, deorbiting: 0 };
  const altitude = data?.altitude ?? { avg: 0, min: 0, max: 0 };
  const velocity = data?.velocity ?? { avg: 0, min: 0, max: 0 };
  const orbitalPeriod = data?.orbitalPeriod ?? { avg: 0 };
  const shells = data?.shells ?? [];

  const { filtered, activeCount, maneuverCount, deorbitCount } = useMemo(() => {
    const ac = satellites.filter((s) => s.status === "active").length;
    const mc = satellites.filter((s) => s.status === "maneuvering").length;
    const dc = satellites.filter((s) => s.status === "deorbiting").length;
    const f = filter === "all" ? satellites : satellites.filter((s) => s.status === filter);
    return { filtered: f, activeCount: ac, maneuverCount: mc, deorbitCount: dc };
  }, [satellites, filter]);

  const constellationStats = useMemo(() => [
    {
      label: "Total Tracked",
      value: constellation.total.toLocaleString(),
      icon: Satellite,
      color: "text-spacex-accent",
      sub: `${constellation.active.toLocaleString()} operational`,
    },
    {
      label: "Active",
      value: constellation.active.toLocaleString(),
      icon: Wifi,
      color: "text-spacex-success",
      sub: `${((constellation.active / (constellation.total || 1)) * 100).toFixed(1)}% of fleet`,
    },
    {
      label: "Maneuvering",
      value: constellation.maneuvering.toLocaleString(),
      icon: ArrowUpDown,
      color: "text-spacex-warning",
      sub: "Orbit adjustment",
    },
    {
      label: "Deorbiting",
      value: constellation.deorbiting.toLocaleString(),
      icon: Activity,
      color: "text-spacex-danger",
      sub: "End of life",
    },
    {
      label: "Avg Altitude",
      value: `${altitude.avg}`,
      icon: TrendingUp,
      color: "text-emerald-300",
      sub: `${altitude.min}–${altitude.max} km`,
    },
    {
      label: "Avg Velocity",
      value: `${velocity.avg}`,
      icon: Gauge,
      color: "text-amber-400",
      sub: `${velocity.min}–${velocity.max} m/s`,
    },
    {
      label: "Orbital Period",
      value: `${orbitalPeriod.avg}`,
      icon: Clock,
      color: "text-orange-400",
      sub: "minutes avg",
    },
    {
      label: "Orbital Shells",
      value: shells.length.toString(),
      icon: Globe,
      color: "text-amber-400",
      sub: `Largest: ${shells[0]?.count.toLocaleString() || "—"}`,
    },
  ], [constellation, altitude, velocity, orbitalPeriod, shells]);

  if (loading && !data) return <LoadingState />;
  if (error && !data)
    return <ErrorState error={error} onRetry={fetchData} />;
  if (!data) return null;

  const { constellationAge, upcomingLaunches, mapSatellites } = data;

  const nextLaunch = upcomingLaunches.length > 0 ? upcomingLaunches[0] : null;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-bold text-white">
            STARLINK CONSTELLATION
          </h1>
          <p className="text-sm text-spacex-muted mt-1">
            Real-time satellite tracking — Celestrak NORAD data
          </p>
        </div>
        <div className="flex items-center gap-3">
          {nextLaunch && (
            <div className="glass-panel px-3 py-2 flex items-center gap-2">
              <Rocket className="w-3.5 h-3.5 text-spacex-thrust" />
              <span className="text-[10px] font-mono text-spacex-muted">
                NEXT
              </span>
              <span className="text-[10px] font-mono font-bold text-spacex-thrust truncate max-w-[120px]">
                {nextLaunch.mission}
              </span>
            </div>
          )}
          <button
            onClick={fetchData}
            disabled={loading}
            className="glass-panel px-3 py-2 flex items-center gap-2 hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-spacex-accent ${
                loading ? "animate-spin" : ""
              }`}
            />
            <span className="text-[10px] font-mono text-spacex-muted hidden sm:inline">
              {lastUpdated || "—"}
            </span>
          </button>
          <div className="glass-panel px-3 py-2 flex items-center gap-2">
            <Wifi className="w-3.5 h-3.5 text-spacex-success" />
            <span className="text-sm font-mono font-bold text-spacex-success">
              ONLINE
            </span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {constellationStats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02 }}
            className="glass-panel p-3 hud-corners"
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
              <span className="text-[9px] font-mono text-spacex-muted tracking-wider uppercase">
                {stat.label}
              </span>
            </div>
            <p className="text-xl font-mono font-bold text-white">
              {stat.value}
            </p>
            <p className="text-[9px] font-mono text-spacex-muted mt-0.5">
              {stat.sub}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Globe + Launches side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4 items-stretch">
        <OrbitVisualization
          shells={shells}
          constellation={constellation}
          mapSatellites={mapSatellites}
        />
        <div className="flex flex-col gap-4">
          <UpcomingLaunches launches={upcomingLaunches} />
          <AltitudeStats altitude={altitude} />
        </div>
      </div>

      {/* Velocity & Orbital Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-4 hud-corners">
          <div className="flex items-center gap-2 mb-3">
            <Gauge className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-mono font-semibold text-amber-400 tracking-wider uppercase">
              Velocity Range
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[9px] font-mono text-spacex-muted uppercase mb-1">Min</p>
              <p className="text-lg font-mono font-bold text-spacex-warning">{velocity.min}</p>
              <p className="text-[9px] font-mono text-spacex-muted">m/s</p>
            </div>
            <div className="border-x border-spacex-border/30">
              <p className="text-[9px] font-mono text-spacex-muted uppercase mb-1">Avg</p>
              <p className="text-lg font-mono font-bold text-amber-400">{velocity.avg}</p>
              <p className="text-[9px] font-mono text-spacex-muted">m/s</p>
            </div>
            <div>
              <p className="text-[9px] font-mono text-spacex-muted uppercase mb-1">Max</p>
              <p className="text-lg font-mono font-bold text-spacex-success">{velocity.max}</p>
              <p className="text-[9px] font-mono text-spacex-muted">m/s</p>
            </div>
          </div>
        </div>

        <div className="glass-panel p-4 hud-corners">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-orange-400" />
            <h3 className="text-xs font-mono font-semibold text-orange-400 tracking-wider uppercase">
              Orbital Period
            </h3>
          </div>
          <div className="text-center">
            <p className="text-3xl font-mono font-bold text-orange-400">{orbitalPeriod.avg}</p>
            <p className="text-[10px] font-mono text-spacex-muted mt-1">minutes average</p>
            <p className="text-[9px] font-mono text-spacex-muted/60 mt-2">
              ~{(24 * 60 / orbitalPeriod.avg).toFixed(1)} orbits per day
            </p>
          </div>
        </div>

        <div className="glass-panel p-4 hud-corners">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-emerald-300" />
            <h3 className="text-xs font-mono font-semibold text-emerald-300 tracking-wider uppercase">
              Constellation Health
            </h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-spacex-muted">Avg Revolutions</span>
              <span className="text-sm font-mono font-bold text-white">{constellationAge.avgRevolutions.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-spacex-muted">Freshest TLE</span>
              <span className="text-[10px] font-mono text-spacex-success">
                {new Date(constellationAge.newestEpoch).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-spacex-muted">Oldest TLE</span>
              <span className="text-[10px] font-mono text-spacex-warning">
                {new Date(constellationAge.oldestEpoch).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-spacex-muted">Operational Rate</span>
              <span className="text-sm font-mono font-bold text-spacex-success">
                {((constellation.active / constellation.total) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Shell distribution */}
      <ShellDistribution shells={shells} />

      {/* Satellite table */}
      <div className="glass-panel p-4 hud-corners">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Satellite className="w-4 h-4 text-spacex-accent" />
            <h3 className="text-xs font-mono font-semibold text-spacex-accent tracking-wider uppercase">
              Satellite Fleet — Live Telemetry
            </h3>
            <span className="text-[9px] font-mono text-spacex-muted">
              (Top 50 by epoch)
            </span>
          </div>
          {/* Filter tabs */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {(["all", "active", "maneuvering", "deorbiting"] as const).map(
              (f) => {
                const counts = {
                  all: satellites.length,
                  active: activeCount,
                  maneuvering: maneuverCount,
                  deorbiting: deorbitCount,
                };
                const colors = {
                  all: "text-white",
                  active: "text-spacex-success",
                  maneuvering: "text-spacex-warning",
                  deorbiting: "text-spacex-danger",
                };
                return (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-2 sm:px-3 py-1 rounded text-[9px] sm:text-[10px] font-mono tracking-wider uppercase transition-all ${
                      filter === f
                        ? `${colors[f]} bg-white/5 border border-white/10`
                        : "text-spacex-muted hover:text-white"
                    }`}
                  >
                    {f} ({counts[f]})
                  </button>
                );
              }
            )}
          </div>
        </div>

        {/* Table - scrollable on mobile */}
        <div className="overflow-x-auto -mx-4 px-4">
          <div className="min-w-[700px]">
            {/* Table header */}
            <div className="grid grid-cols-8 gap-2 px-3 py-2 border-b border-spacex-border/50 mb-1">
              {[
                "Name",
                "NORAD",
                "Shell",
                "Alt (km)",
                "Vel (m/s)",
                "Inc (°)",
                "Epoch",
                "Status",
              ].map((h) => (
                <span
                  key={h}
                  className="text-[9px] font-mono text-spacex-muted tracking-wider uppercase"
                >
                  {h}
                </span>
              ))}
            </div>

            {/* Satellite rows */}
            <div className="max-h-[400px] overflow-y-auto space-y-0.5">
              {filtered.map((sat) => {
                const sc = statusConfig[sat.status];
                return (
                  <div
                    key={sat.noradId}
                    className="grid grid-cols-8 gap-2 px-3 py-2 rounded hover:bg-white/[0.04] transition-colors"
                  >
                    <span className="text-[10px] font-mono text-white font-semibold truncate">
                      {sat.id}
                    </span>
                    <span className="text-[10px] font-mono text-spacex-muted">
                      {sat.noradId}
                    </span>
                    <span className="text-[9px] font-mono text-spacex-muted truncate">
                      {sat.shell}
                    </span>
                    <span className="text-[10px] font-mono text-spacex-accent">
                      {sat.altitude.toFixed(1)}
                    </span>
                    <span className="text-[10px] font-mono text-white">
                      {sat.velocity.toFixed(0)}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-300">
                      {sat.inclination.toFixed(2)}
                    </span>
                    <span className="text-[9px] font-mono text-spacex-muted">
                      {new Date(sat.epoch).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <div className="flex items-center gap-1">
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${sc.bg} ${
                          sat.status !== "active" ? "animate-pulse" : ""
                        }`}
                      />
                      <span className={`text-[9px] font-mono ${sc.color}`}>
                        {sc.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Data source attribution */}
        <div className="mt-3 pt-3 border-t border-spacex-border/30 flex items-center justify-between">
          <span className="text-[8px] font-mono text-spacex-muted/60">
            Data: Celestrak NORAD GP Elements • Launch Library 2 API •
            Updated every 15 min
          </span>
          <span className="text-[8px] font-mono text-spacex-muted/60">
            {lastUpdated && `Last: ${lastUpdated}`}
          </span>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-[9px] font-mono text-white/15 text-center mt-8 pb-2">
        All data sourced from public APIs and publicly available sources. Not affiliated with SpaceX or any other agency.
      </p>
    </div>
  );
}
