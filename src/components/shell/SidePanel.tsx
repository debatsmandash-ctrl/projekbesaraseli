import { AnimatePresence, motion } from "framer-motion";
import { useUniverse, useSettings } from "@/lib/store";
import { buildGraph } from "@/lib/graph/build";
import { invalidateGraphCache } from "@/lib/graph/build";
import { useMemo, useState, useEffect } from "react";
import { PanelContent } from "./panels/PanelContent";
import { setOverride, loadOverrides, clearOverrides, exportOverrides } from "@/lib/editor/overrides";
import { usePointerDrag } from "@/hooks/usePointerDrag";

export function SidePanel() {
  const selectedId = useUniverse((s) => s.selectedId);
  const select = useUniverse((s) => s.select);
  const editorMode = useUniverse((s) => s.editorMode);
  const graph = useMemo(() => buildGraph(), []);
  const node = selectedId ? graph.byId.get(selectedId) : null;
  const open = !!node && node.id !== "root";
  const [labelDraft, setLabelDraft] = useState("");
  useEffect(() => { if (node) setLabelDraft(node.label); }, [node]);

  return (
    <AnimatePresence>
      {open && node && (
        <motion.aside
          key={node.id}
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 240, damping: 28 }}
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            bottom: 0,
            width: "min(560px, 92vw)",
            background: "linear-gradient(180deg, rgba(11,18,32,0.95), rgba(5,8,15,0.92))",
            borderLeft: `1px solid ${node.color}55`,
            boxShadow: `-30px 0 60px -20px ${node.color}33`,
            backdropFilter: "blur(18px)",
            zIndex: 25,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <header
            style={{
              padding: "20px 24px 16px",
              borderBottom: `1px solid ${node.color}33`,
              display: "flex",
              alignItems: "flex-start",
              gap: 14,
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 999,
                background: node.color,
                boxShadow: `0 0 14px ${node.color}, 0 0 28px ${node.color}66`,
                marginTop: 8,
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily: "Space Mono",
                  fontSize: 9,
                  letterSpacing: "0.4em",
                  color: node.color,
                  opacity: 0.8,
                }}
              >
                {node.kind.toUpperCase()} · {node.cluster.toUpperCase()}
              </div>
              <h2
                style={{
                  fontFamily: "Bebas Neue",
                  fontSize: 30,
                  lineHeight: 1.05,
                  letterSpacing: "0.05em",
                  color: "#e8f4ff",
                  marginTop: 4,
                }}
              >
                {node.label}
              </h2>
            </div>
            <button
              onClick={() => select(null)}
              aria-label="Close panel"
              style={{
                background: "transparent",
                border: `1px solid ${node.color}33`,
                color: node.color,
                width: 32,
                height: 32,
                borderRadius: 4,
                cursor: "pointer",
                fontSize: 16,
                fontFamily: "Space Mono",
              }}
            >
              ✕
            </button>
          </header>

          <div className="panel-scroll" style={{ flex: 1, overflowY: "auto", padding: "20px 24px 40px" }}>
            <PanelContent node={node} />
            {editorMode && (
              <div style={{ marginTop: 28, padding: "14px 16px", background: "rgba(0,255,200,0.05)", border: "1px solid rgba(0,255,200,0.25)", borderRadius: 4 }}>
                <div style={{ fontFamily: "Space Mono", fontSize: 9, letterSpacing: "0.35em", color: "#00ffc8", marginBottom: 10 }}>EDITOR · {node.id}</div>
                <label style={{ display: "block", fontFamily: "Space Mono", fontSize: 9, letterSpacing: "0.2em", color: "#8ba3c0" }}>LABEL</label>
                <input
                  value={labelDraft}
                  onChange={(e) => setLabelDraft(e.target.value)}
                  style={{ width: "100%", marginTop: 6, padding: "8px 10px", background: "rgba(5,8,15,0.6)", border: "1px solid rgba(168,85,247,0.3)", color: "#e8f4ff", fontFamily: "DM Sans", fontSize: 13, borderRadius: 3, outline: "none" }}
                />
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
                  <button
                    onClick={() => { setOverride(node.id, { label: labelDraft }); invalidateGraphCache(); location.reload(); }}
                    style={{ padding: "6px 12px", background: "rgba(0,255,200,0.15)", border: "1px solid rgba(0,255,200,0.45)", color: "#00ffc8", cursor: "pointer", borderRadius: 3, fontFamily: "Space Mono", fontSize: 10, letterSpacing: "0.15em" }}
                  >SIMPAN</button>
                  <button
                    onClick={() => { setOverride(node.id, { deleted: true }); invalidateGraphCache(); select(null); location.reload(); }}
                    style={{ padding: "6px 12px", background: "rgba(255,92,92,0.1)", border: "1px solid rgba(255,92,92,0.4)", color: "#ff5c5c", cursor: "pointer", borderRadius: 3, fontFamily: "Space Mono", fontSize: 10, letterSpacing: "0.15em" }}
                  >HAPUS</button>
                  <button
                    onClick={() => {
                      const blob = new Blob([exportOverrides()], { type: "application/json" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a"); a.href = url; a.download = "overrides.json"; a.click(); URL.revokeObjectURL(url);
                    }}
                    style={{ padding: "6px 12px", background: "transparent", border: "1px solid rgba(168,85,247,0.35)", color: "#a855f7", cursor: "pointer", borderRadius: 3, fontFamily: "Space Mono", fontSize: 10, letterSpacing: "0.15em" }}
                  >EXPORT</button>
                  <button
                    onClick={() => { if (confirm("Reset semua perubahan editor?")) { clearOverrides(); invalidateGraphCache(); location.reload(); } }}
                    style={{ padding: "6px 12px", background: "transparent", border: "1px solid rgba(168,85,247,0.25)", color: "#8ba3c0", cursor: "pointer", borderRadius: 3, fontFamily: "Space Mono", fontSize: 10, letterSpacing: "0.15em" }}
                  >RESET</button>
                </div>
                <div style={{ marginTop: 10, fontFamily: "Space Mono", fontSize: 9, color: "#5a6f8a", lineHeight: 1.5 }}>
                  Override disimpan di localStorage browser. {Object.keys(loadOverrides()).length} node ditimpa.
                </div>
              </div>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}