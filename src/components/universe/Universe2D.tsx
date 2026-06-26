import { useEffect, useMemo, useRef } from "react";
import { buildGraph } from "@/lib/graph/build";
import { useUniverse } from "@/lib/store";
import type { StarNode } from "@/data/types";

/**
 * Universe2D — Aurora Night Sky Constellation.
 * - Background: gradient langit malam biru-deep + aurora pita biru/ungu/magenta (NO green).
 * - Bintang natural (putih redup), bukan neon.
 * - Cluster = bintang besar (rasi anchor), leaves = bintang kecil; dihubungkan garis tipis.
 * - Komet dekoratif respawn random.
 * - Layout Poisson-disk spread agar tidak numpuk.
 */
export function Universe2D() {
  const graph = useMemo(() => buildGraph(), []);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const select = useUniverse((s) => s.select);
  const hover = useUniverse((s) => s.hover);
  const selectedId = useUniverse((s) => s.selectedId);
  const hoveredId = useUniverse((s) => s.hoveredId);
  const viewRef = useRef({ x: 0, y: 0, zoom: 1 });
  const dragRef = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);

  // Background twinkle stars — natural redup
  const bgStars = useMemo(() => {
    const arr: { x: number; y: number; r: number; b: number; tw: number; warm: boolean }[] = [];
    for (let i = 0; i < 1100; i++) {
      arr.push({
        x: Math.random(),
        y: Math.random(),
        r: 0.25 + Math.pow(Math.random(), 3) * 1.4,
        b: 0.25 + Math.random() * 0.5,
        tw: Math.random() * Math.PI * 2,
        warm: Math.random() < 0.15,
      });
    }
    return arr;
  }, []);

  // ── Constellation layout via Poisson-disk-ish spread ──
  const projected = useMemo(() => {
    const W = 2400, H = 1500; // virtual canvas
    const rand = (() => {
      let s = 1337;
      return () => {
        s = (s * 1664525 + 1013904223) | 0;
        return ((s >>> 8) & 0xffffff) / 0xffffff;
      };
    })();

    // Group nodes by cluster, place clusters in spread pattern, leaves in sub-groups around them.
    const map = new Map<string, { x: number; y: number; node: StarNode }>();
    const clusters = graph.nodes.filter((n) => n.kind === "cluster");
    const placed: { x: number; y: number; r: number }[] = [];
    const tryPlace = (minR: number, attempts = 80) => {
      for (let i = 0; i < attempts; i++) {
        const x = 100 + rand() * (W - 200);
        const y = 100 + rand() * (H - 200);
        let ok = true;
        for (const p of placed) {
          if (Math.hypot(p.x - x, p.y - y) < p.r + minR) { ok = false; break; }
        }
        if (ok) { placed.push({ x, y, r: minR }); return { x, y }; }
      }
      const x = 100 + rand() * (W - 200);
      const y = 100 + rand() * (H - 200);
      placed.push({ x, y, r: minR });
      return { x, y };
    };

    // Root center-ish
    const root = graph.nodes.find((n) => n.id === "root");
    if (root) {
      const p = { x: W / 2, y: H / 2 };
      placed.push({ x: p.x, y: p.y, r: 110 });
      map.set(root.id, { x: p.x - W / 2, y: p.y - H / 2, node: root });
    }

    const clusterCenters = new Map<string, { x: number; y: number }>();
    for (const c of clusters) {
      const p = tryPlace(220);
      clusterCenters.set(c.cluster, p);
      map.set(c.id, { x: p.x - W / 2, y: p.y - H / 2, node: c });
    }

    // Group children by their parent edge (use neighbors)
    const childrenOfCluster = new Map<string, StarNode[]>();
    for (const n of graph.nodes) {
      if (n.kind === "cluster" || n.kind === "root") continue;
      if (!childrenOfCluster.has(n.cluster)) childrenOfCluster.set(n.cluster, []);
      childrenOfCluster.get(n.cluster)!.push(n);
    }

    // For each cluster, layout its children in a spread around the center.
    for (const [ck, kids] of childrenOfCluster.entries()) {
      const center = clusterCenters.get(ck);
      if (!center) continue;
      // Determine radius based on count
      const baseR = 80 + Math.sqrt(kids.length) * 22;
      // Sort: subhubs first (closer), then deeper kinds outward
      const tierOf = (k: string) =>
        k === "subhub" ? 0 :
        k === "domain" || k === "school" ? 1 :
        k === "bab" || k === "team" || k === "letter" || k === "role" ? 2 :
        k === "subbab" || k === "speaker" || k === "vocab" || k === "roleskill" || k === "motion" ? 3 : 2;
      const sorted = [...kids].sort((a, b) => tierOf(a.kind) - tierOf(b.kind));
      const localPlaced: { x: number; y: number }[] = [{ x: center.x, y: center.y }];
      for (let i = 0; i < sorted.length; i++) {
        const k = sorted[i];
        const tier = tierOf(k.kind);
        const radius = baseR * (0.35 + tier * 0.28);
        const minSep = k.kind === "subhub" ? 60 : k.kind === "domain" || k.kind === "school" ? 42 : 18;
        let best: { x: number; y: number } | null = null;
        for (let t = 0; t < 60; t++) {
          const ang = rand() * Math.PI * 2;
          const r = radius * (0.7 + rand() * 0.6);
          const x = center.x + Math.cos(ang) * r;
          const y = center.y + Math.sin(ang) * r;
          if (x < 40 || x > W - 40 || y < 40 || y > H - 40) continue;
          let ok = true;
          for (const lp of localPlaced) {
            if (Math.hypot(lp.x - x, lp.y - y) < minSep) { ok = false; break; }
          }
          if (ok) { best = { x, y }; break; }
        }
        if (!best) {
          const ang = (i / sorted.length) * Math.PI * 2;
          best = { x: center.x + Math.cos(ang) * radius, y: center.y + Math.sin(ang) * radius };
        }
        localPlaced.push(best);
        map.set(k.id, { x: best.x - W / 2, y: best.y - H / 2, node: k });
      }
    }
    return map;
  }, [graph]);

  // Lit set
  const litSet = useMemo(() => {
    const s = new Set<string>();
    const a = selectedId ?? hoveredId;
    if (a) {
      s.add(a);
      const ns = graph.neighbors.get(a);
      if (ns) for (const id of ns) s.add(id);
    }
    return s;
  }, [selectedId, hoveredId, graph]);

  // Aurora bands — fixed wave params, animated in draw loop
  const auroraBands = useMemo(() => [
    { y: 0.18, amp: 70, period: 0.0014, hue: "rgba(120,140,255,", base: 0.22, speed: 0.13 },
    { y: 0.32, amp: 95, period: 0.0010, hue: "rgba(160,110,255,", base: 0.18, speed: 0.09 },
    { y: 0.48, amp: 120, period: 0.0008, hue: "rgba(220,100,200,", base: 0.13, speed: 0.06 },
  ], []);

  // Comets
  const cometsRef = useRef<{ x: number; y: number; vx: number; vy: number; life: number; max: number }[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const spawnComet = () => {
      const w = canvas.width, h = canvas.height;
      const fromLeft = Math.random() < 0.5;
      const angle = (Math.PI / 6) + Math.random() * (Math.PI / 5); // shallow down-diagonal
      const speed = (w + h) * 0.00038;
      cometsRef.current.push({
        x: fromLeft ? -50 : w + 50,
        y: Math.random() * h * 0.55,
        vx: (fromLeft ? 1 : -1) * Math.cos(angle) * speed * dpr,
        vy: Math.sin(angle) * speed * dpr,
        life: 0,
        max: 220 + Math.random() * 140,
      });
    };

    const draw = () => {
      const view = viewRef.current;
      const anyActive = !!(selectedId ?? hoveredId);
      const w = canvas.width, h = canvas.height;

      // ── Background: deep night sky gradient ──
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#0a1530");
      grad.addColorStop(0.4, "#0d2148");
      grad.addColorStop(0.75, "#0a1a36");
      grad.addColorStop(1, "#050b1c");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      const t = performance.now() / 1000;

      // ── Aurora bands ──
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (const band of auroraBands) {
        const yBase = band.y * h;
        const grd = ctx.createLinearGradient(0, yBase - band.amp * dpr * 1.4, 0, yBase + band.amp * dpr * 1.4);
        grd.addColorStop(0, band.hue + "0)");
        grd.addColorStop(0.5, band.hue + band.base + ")");
        grd.addColorStop(1, band.hue + "0)");
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.moveTo(0, yBase);
        for (let x = 0; x <= w; x += 12 * dpr) {
          const k = x * band.period;
          const yy = yBase
            + Math.sin(k + t * band.speed) * band.amp * dpr * 0.6
            + Math.sin(k * 2.3 + t * band.speed * 0.6) * band.amp * dpr * 0.4;
          ctx.lineTo(x, yy);
        }
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // ── Background twinkle stars ──
      for (const s of bgStars) {
        const tw = 0.55 + 0.45 * Math.sin(t * 1.3 + s.tw);
        const col = s.warm
          ? `rgba(255,235,200,${s.b * tw * 0.7})`
          : `rgba(${220 + s.b * 35 | 0},${230 + s.b * 25 | 0},255,${s.b * tw * 0.75})`;
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, s.r * dpr, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── Comets ──
      if (Math.random() < 0.004) spawnComet();
      cometsRef.current = cometsRef.current.filter((c) => c.life < c.max);
      for (const c of cometsRef.current) {
        c.x += c.vx;
        c.y += c.vy;
        c.life += 1;
        const alpha = Math.min(1, c.life / 20) * Math.max(0, 1 - c.life / c.max);
        // Trail
        for (let i = 0; i < 18; i++) {
          const k = i / 18;
          const tx = c.x - c.vx * i * 1.8;
          const ty = c.y - c.vy * i * 1.8;
          ctx.fillStyle = `rgba(220,230,255,${alpha * (1 - k) * 0.5})`;
          ctx.beginPath();
          ctx.arc(tx, ty, (2.2 - k * 2) * dpr, 0, Math.PI * 2);
          ctx.fill();
        }
        // Head
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.beginPath();
        ctx.arc(c.x, c.y, 2.4 * dpr, 0, Math.PI * 2);
        ctx.fill();
      }

      const cx = w / 2 + view.x * dpr;
      const cy = h / 2 + view.y * dpr;
      const z = view.zoom * dpr * Math.min(w / 2400 / dpr, h / 1500 / dpr) * dpr;

      // ── Constellation edges (thin white lines) ──
      ctx.lineWidth = 0.55 * dpr;
      for (const e of graph.edges) {
        if (e.kind === "link") continue;
        const a = projected.get(e.a), b = projected.get(e.b);
        if (!a || !b) continue;
        const lit = anyActive && litSet.has(e.a) && litSet.has(e.b);
        const dim = anyActive && !lit;
        ctx.strokeStyle = lit ? "rgba(220,235,255,0.95)" : "rgba(200,220,255,0.32)";
        ctx.globalAlpha = lit ? 0.95 : dim ? 0.05 : 0.32;
        ctx.beginPath();
        ctx.moveTo(cx + a.x * z, cy + a.y * z);
        ctx.lineTo(cx + b.x * z, cy + b.y * z);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // ── Nodes as natural stars ──
      for (const { x, y, node } of projected.values()) {
        const px = cx + x * z;
        const py = cy + y * z;
        if (px < -50 || px > w + 50 || py < -50 || py > h + 50) continue;
        const isSel = node.id === selectedId;
        const isHov = node.id === hoveredId;
        const isLit = litSet.has(node.id);
        const dim = anyActive && !isLit;
        const baseR =
          node.kind === "root" ? 4.2 :
          node.kind === "cluster" ? 3.6 :
          node.kind === "subhub" ? 2.6 :
          node.kind === "domain" || node.kind === "school" ? 2.0 :
          node.kind === "bab" || node.kind === "team" || node.kind === "role" || node.kind === "letter" ? 1.5 :
          1.0;
        const r = baseR * (isSel || isHov ? 1.8 : 1) * dpr;
        // Soft halo (subtle)
        const halo = ctx.createRadialGradient(px, py, 0, px, py, r * 5);
        halo.addColorStop(0, `rgba(255,255,255,${dim ? 0.05 : 0.35})`);
        halo.addColorStop(0.45, `rgba(200,220,255,${dim ? 0.02 : 0.12})`);
        halo.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(px, py, r * 5, 0, Math.PI * 2);
        ctx.fill();
        // Star core — natural white
        ctx.fillStyle = `rgba(255,255,255,${dim ? 0.35 : 1})`;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
        // Cross sparkle for big stars
        if (baseR >= 2.5 && !dim) {
          ctx.strokeStyle = `rgba(255,255,255,${isSel || isHov ? 0.7 : 0.45})`;
          ctx.lineWidth = 0.6 * dpr;
          ctx.beginPath();
          ctx.moveTo(px - r * 3.2, py); ctx.lineTo(px + r * 3.2, py);
          ctx.moveTo(px, py - r * 3.2); ctx.lineTo(px, py + r * 3.2);
          ctx.stroke();
        }
        // Label
        if (node.kind === "root" || node.kind === "cluster" || node.kind === "subhub" || isSel || isHov) {
          ctx.globalAlpha = dim ? 0.35 : 1;
          ctx.font = `${node.kind === "root" ? 14 : node.kind === "cluster" ? 11 : 10}px DM Sans, sans-serif`;
          ctx.fillStyle = "rgba(230,240,255,0.92)";
          ctx.textAlign = "center";
          ctx.shadowColor = "rgba(20,30,60,0.95)";
          ctx.shadowBlur = 6;
          ctx.fillText(node.label, px, py + r + 14 * dpr);
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;
        }
      }

      raf = requestAnimationFrame(draw);
    };
    draw();

    // ── Interactions ──
    const screenToWorld = (sx: number, sy: number) => {
      const view = viewRef.current;
      const rect = canvas.getBoundingClientRect();
      const px = (sx - rect.left) * dpr;
      const py = (sy - rect.top) * dpr;
      const cx = canvas.width / 2 + view.x * dpr;
      const cy = canvas.height / 2 + view.y * dpr;
      const z = view.zoom * dpr * Math.min(canvas.width / 2400 / dpr, canvas.height / 1500 / dpr) * dpr;
      return { x: (px - cx) / z, y: (py - cy) / z };
    };
    const hitTest = (sx: number, sy: number) => {
      const wp = screenToWorld(sx, sy);
      let best: { id: string; d: number } | null = null;
      for (const { x, y, node } of projected.values()) {
        const baseR =
          node.kind === "root" ? 6 :
          node.kind === "cluster" ? 5 :
          node.kind === "subhub" ? 4 : 3;
        const r = baseR + 6;
        const d = Math.hypot(x - wp.x, y - wp.y);
        if (d < r && (!best || d < best.d)) best = { id: node.id, d };
      }
      return best?.id ?? null;
    };
    const onMove = (e: PointerEvent) => {
      if (dragRef.current) {
        const dx = e.clientX - dragRef.current.x;
        const dy = e.clientY - dragRef.current.y;
        viewRef.current.x = dragRef.current.vx + dx;
        viewRef.current.y = dragRef.current.vy + dy;
        return;
      }
      const id = hitTest(e.clientX, e.clientY);
      hover(id);
      canvas.style.cursor = id ? "pointer" : "grab";
    };
    const onDown = (e: PointerEvent) => {
      const id = hitTest(e.clientX, e.clientY);
      if (id) { select(id); return; }
      dragRef.current = { x: e.clientX, y: e.clientY, vx: viewRef.current.x, vy: viewRef.current.y };
      canvas.style.cursor = "grabbing";
    };
    const onUp = () => { dragRef.current = null; canvas.style.cursor = "grab"; };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const f = Math.exp(-e.deltaY * 0.001);
      viewRef.current.zoom = Math.max(0.3, Math.min(5, viewRef.current.zoom * f));
    };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, [graph, projected, bgStars, auroraBands, selectedId, hoveredId, litSet, hover, select]);

  return (
    <div ref={wrapRef} style={{ position: "absolute", inset: 0, background: "#050b1c" }}>
      <canvas ref={canvasRef} style={{ cursor: "grab", display: "block" }} />
      <div style={{
        position: "absolute", top: 12, left: 12,
        fontFamily: "Space Mono", fontSize: 10, letterSpacing: "0.2em",
        color: "#a8c0ff", padding: "4px 10px",
        background: "rgba(10,20,40,0.7)", border: "1px solid rgba(160,180,255,0.3)",
        borderRadius: 4, backdropFilter: "blur(8px)",
      }}>2D · AURORA SKY · DRAG · SCROLL UTK ZOOM</div>
    </div>
  );
}
