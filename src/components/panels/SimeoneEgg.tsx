import { useState } from "react";
import simeone from "@/assets/eggs/simeone.png.asset.json";

/**
 * Easter egg: muncul HANYA di panel HARAMDEBATE.
 * Floating sticker pojok kanan-atas konten, rotate, hover tooltip.
 */
export function SimeoneEgg() {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "absolute",
        top: 8,
        right: 8,
        width: 96,
        height: 96,
        transform: `rotate(${hover ? -2 : -8}deg) scale(${hover ? 1.06 : 1})`,
        transition: "transform 220ms cubic-bezier(.7,0,.2,1)",
        zIndex: 3,
        pointerEvents: "auto",
        filter: "drop-shadow(0 6px 18px rgba(255,45,138,0.45))",
      }}
      title="El Cholo approves — Park the bus."
    >
      <img
        src={simeone.url}
        alt="Diego Simeone"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          borderRadius: 8,
          border: "2px solid rgba(255,45,138,0.65)",
          opacity: hover ? 0.98 : 0.86,
        }}
      />
      {hover && (
        <div style={{
          position: "absolute",
          bottom: -28,
          right: 0,
          fontFamily: "Space Mono",
          fontSize: 9,
          letterSpacing: "0.18em",
          color: "#ff2d8a",
          background: "rgba(5,8,15,0.92)",
          border: "1px solid rgba(255,45,138,0.55)",
          padding: "3px 7px",
          borderRadius: 3,
          whiteSpace: "nowrap",
        }}>EL CHOLO APPROVES</div>
      )}
    </div>
  );
}
