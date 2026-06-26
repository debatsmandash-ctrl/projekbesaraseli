/**
 * RiskBar — horizontal meter dari "safe template" (kiri/teal) ke "niche chaos" (kanan/magenta).
 * risk: 1..5
 */
export function RiskBar({ risk, side }: { risk: number; side: "pro" | "opp" }) {
  const pct = Math.min(100, Math.max(0, (risk - 1) / 4 * 100));
  const sideColor = side === "pro" ? "#ff6b6b" : "#38bdf8";
  const label = risk <= 1 ? "SAFE" : risk <= 2 ? "TEMPLATE" : risk <= 3 ? "BALANCED" : risk <= 4 ? "BOLD" : "CHAOS";
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{
        position: "relative",
        height: 6,
        borderRadius: 3,
        background: "linear-gradient(90deg, rgba(0,255,200,0.15), rgba(255,45,138,0.18))",
        overflow: "hidden",
        border: `1px solid ${sideColor}22`,
      }}>
        <div style={{
          position: "absolute",
          left: 0, top: 0, bottom: 0, width: `${pct}%`,
          background: `linear-gradient(90deg, #00ffc8, #fde047 50%, #ff2d8a)`,
          opacity: 0.85,
          transition: "width 600ms cubic-bezier(.7,0,.2,1)",
        }} />
        <div style={{
          position: "absolute",
          left: `calc(${pct}% - 5px)`, top: -3,
          width: 10, height: 12, borderRadius: 2,
          background: "#fff",
          boxShadow: `0 0 8px rgba(255,255,255,0.8)`,
        }} />
      </div>
      <div style={{
        marginTop: 3,
        fontFamily: "Space Mono", fontSize: 8, letterSpacing: "0.22em",
        color: "var(--au-muted)",
        display: "flex", justifyContent: "space-between",
      }}>
        <span>SAFE</span>
        <span style={{ color: sideColor, fontWeight: 700 }}>{label} · {risk}/5</span>
        <span>CHAOS</span>
      </div>
    </div>
  );
}
