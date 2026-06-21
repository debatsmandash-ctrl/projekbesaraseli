import { useEffect, useMemo, useState } from "react";
import { useUniverse } from "@/lib/store";
import { buildGraph } from "@/lib/graph/build";

export function SearchOverlay() {
  const open = useUniverse((s) => s.searchOpen);
  const setOpen = useUniverse((s) => s.setSearchOpen);
  const select = useUniverse((s) => s.select);
  const graph = useMemo(() => buildGraph(), []);
  const [q, setQ] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen(true); }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  const results = useMemo(() => {
    if (!q.trim()) return [];
    const t = q.toLowerCase();
    return graph.nodes.filter((n) => n.label.toLowerCase().includes(t)).slice(0, 30);
  }, [q, graph]);

  if (!open) return null;
  return (
    <div
      onClick={() => setOpen(false)}
      style={{ position: "fixed", inset: 0, background: "rgba(5,8,15,0.8)", backdropFilter: "blur(10px)", zIndex: 60, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "12vh" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "min(620px, 92vw)", background: "rgba(11,18,32,0.95)", border: "1px solid rgba(168,85,247,0.35)", borderRadius: 6, boxShadow: "0 30px 80px -20px #a855f755" }}
      >
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari bintang… (mosi, matter, kamus, role)"
          style={{ width: "100%", padding: "16px 20px", background: "transparent", border: "none", borderBottom: "1px solid rgba(168,85,247,0.25)", color: "var(--au-text)", fontFamily: "DM Sans", fontSize: 15, outline: "none" }}
        />
        <div className="panel-scroll" style={{ maxHeight: "50vh", overflowY: "auto" }}>
          {results.map((n) => (
            <button
              key={n.id}
              onClick={() => { select(n.id); setOpen(false); setQ(""); }}
              style={{ width: "100%", padding: "10px 20px", background: "transparent", border: "none", color: "var(--au-text)", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontFamily: "DM Sans", fontSize: 13 }}
              onMouseOver={(e) => (e.currentTarget.style.background = "rgba(168,85,247,0.08)")}
              onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <span style={{ width: 6, height: 6, borderRadius: 999, background: n.color, boxShadow: `0 0 8px ${n.color}` }} />
              <span style={{ flex: 1 }}>{n.label}</span>
              <span style={{ fontFamily: "Space Mono", fontSize: 9, color: "var(--au-muted)", letterSpacing: "0.2em" }}>{n.kind.toUpperCase()}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}