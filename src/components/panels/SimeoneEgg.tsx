import { useState } from "react";
import simeone from "@/assets/eggs/simeone.png.asset.json";

/**
 * Easter egg — HANYA muncul di panel HARAMDEBATE.
 * Banner besar 320×180 di atas konten panel: foto Diego Simeone yang jelas
 * dengan caption "EL CHOLO · PARK THE BUS" dan border neon pink.
 */
export function SimeoneEgg() {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 360,
        marginBottom: 18,
        borderRadius: 8,
        overflow: "hidden",
        border: "2px solid rgba(255,45,138,0.65)",
        boxShadow: hover
          ? "0 12px 32px rgba(255,45,138,0.55), inset 0 0 22px rgba(255,45,138,0.18)"
          : "0 8px 22px rgba(255,45,138,0.35), inset 0 0 14px rgba(255,45,138,0.10)",
        transition: "box-shadow 240ms ease, transform 240ms cubic-bezier(.7,0,.2,1)",
        transform: hover ? "translateY(-2px) scale(1.01)" : "translateY(0) scale(1)",
        cursor: "default",
      }}
      title="Defensive masterclass approved by El Cholo."
    >
      {/* Foto */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", background: "#0b0410" }}>
        <img
          src={simeone.url}
          alt="Diego Simeone — El Cholo"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center 25%",
            display: "block",
            filter: hover ? "saturate(1.15) contrast(1.05)" : "saturate(1.02)",
            transition: "filter 240ms",
          }}
        />
        {/* gradient bawah utk caption legibility */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, transparent 40%, rgba(5,8,15,0.85) 100%)",
          pointerEvents: "none",
        }} />
        {/* corner stamp */}
        <div style={{
          position: "absolute", top: 8, left: 8,
          padding: "3px 8px",
          fontFamily: "Space Mono", fontSize: 8, letterSpacing: "0.25em",
          color: "#ff2d8a", background: "rgba(5,8,15,0.78)",
          border: "1px solid rgba(255,45,138,0.55)", borderRadius: 3,
        }}>EASTER EGG · HARAMDEBATE</div>
      </div>
      {/* Caption strip */}
      <div style={{
        padding: "10px 14px",
        background: "linear-gradient(90deg, rgba(255,45,138,0.18), rgba(168,85,247,0.10))",
        borderTop: "1px solid rgba(255,45,138,0.4)",
        display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: "Bebas Neue", fontSize: 20, letterSpacing: "0.12em", color: "#ff2d8a", lineHeight: 1 }}>
            EL CHOLO
          </div>
          <div style={{ fontFamily: "Space Mono", fontSize: 9, letterSpacing: "0.28em", color: "#e8f4ff", marginTop: 4, opacity: 0.85 }}>
            PARK&nbsp;THE&nbsp;BUS · STING ON THE COUNTER
          </div>
        </div>
        <div style={{
          fontFamily: "Space Mono", fontSize: 9, letterSpacing: "0.2em", color: "#fde047",
          padding: "4px 8px", border: "1px solid rgba(253,224,71,0.4)", borderRadius: 3,
          whiteSpace: "nowrap",
        }}>♛ ATLETI</div>
      </div>
    </div>
  );
}
