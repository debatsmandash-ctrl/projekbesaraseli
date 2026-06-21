import { useEffect, useState } from "react";
import logo from "@/assets/smandash-logo.png";

/**
 * Loading screen: deep space + logo + drawing constellation lines from points → fade to universe.
 * Reference: SMANDASH Debate Club neon badge.
 */
export function Loader({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const t0 = performance.now();
    const dur = 2400;
    let raf = 0;
    const tick = () => {
      const k = Math.min(1, (performance.now() - t0) / dur);
      setProgress(k);
      if (k < 1) raf = requestAnimationFrame(tick);
      else setTimeout(onDone, 350);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);

  // Constellation polyline points around the logo (rough hexagonal star ring)
  const cx = 200, cy = 200, r = 150;
  const points = Array.from({ length: 9 }, (_, i) => {
    const a = (i / 9) * Math.PI * 2 - Math.PI / 2;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as const;
  });
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ") + " Z";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "radial-gradient(circle at 50% 50%, #0b1220 0%, #05080f 60%, #02030a 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: progress < 1 ? 1 : 0,
        transition: "opacity 350ms ease-out",
        pointerEvents: progress < 1 ? "auto" : "none",
      }}
    >
      {/* dotted grid corners */}
      <div style={{ position: "absolute", top: 24, left: 24 }} className="dot-grid">
        {Array.from({ length: 25 }).map((_, i) => <i key={i} />)}
      </div>
      <div style={{ position: "absolute", bottom: 24, right: 24 }} className="dot-grid">
        {Array.from({ length: 25 }).map((_, i) => <i key={i} style={{ background: "var(--au-blue)", boxShadow: "0 0 6px var(--au-blue)" }} />)}
      </div>

      {/* logo + constellation overlay */}
      <div style={{ position: "relative", width: 400, height: 400 }}>
        <svg
          viewBox="0 0 400 400"
          width="400"
          height="400"
          style={{ position: "absolute", inset: 0 }}
        >
          {/* draw connecting lines */}
          <path
            d={pathD}
            fill="none"
            stroke="url(#grad)"
            strokeWidth="1"
            strokeDasharray="900"
            strokeDashoffset={900 - 900 * progress}
            style={{ filter: "drop-shadow(0 0 4px #a855f7)" }}
          />
          {/* draw points */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p[0]}
              cy={p[1]}
              r={progress * 3 + 0.5}
              fill={i % 2 === 0 ? "#a855f7" : "#38bdf8"}
              style={{ filter: "drop-shadow(0 0 6px currentColor)" }}
              opacity={Math.min(1, progress * 1.4)}
            />
          ))}
          <defs>
            <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ff5cf0" />
              <stop offset="50%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>
        </svg>
        <img
          src={logo}
          alt="SMANDASH Debate Club"
          style={{
            width: 260,
            height: 260,
            objectFit: "contain",
            position: "absolute",
            top: 70,
            left: 70,
            opacity: Math.min(1, progress * 1.3),
            filter: `drop-shadow(0 0 ${12 + progress * 22}px #ff5cf0) drop-shadow(0 0 ${10 + progress * 18}px #a855f7) drop-shadow(0 0 ${6 + progress * 14}px #38bdf8)`,
          }}
        />
      </div>

      {/* loading bar */}
      <div style={{ marginTop: 36, textAlign: "center" }}>
        <div
          style={{
            fontFamily: "Space Mono, monospace",
            fontSize: 11,
            letterSpacing: "0.6em",
            color: "#8ba3c0",
            marginBottom: 14,
          }}
        >
          MEMUAT SEMESTA
        </div>
        <div
          style={{
            width: 220,
            height: 1,
            background: "rgba(168,85,247,0.18)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -2,
              left: 0,
              width: 36,
              height: 5,
              background: "linear-gradient(90deg, transparent, #a855f7, #38bdf8, transparent)",
              boxShadow: "0 0 8px #a855f7",
              transform: `translateX(${progress * 184}px)`,
            }}
          />
        </div>
        <div
          style={{
            fontFamily: "Space Mono, monospace",
            fontSize: 9,
            letterSpacing: "0.4em",
            color: "rgba(168,85,247,0.55)",
            marginTop: 18,
          }}
        >
          DEBATE COACH TOOLKIT · v0.9 · ROJAAKS
        </div>
      </div>
    </div>
  );
}