import { useState } from "react";
import { useUniverse } from "@/lib/store";
import { validateEditorKey } from "@/lib/editor/overrides";

export function EditorUnlockModal() {
  const open = useUniverse((s) => s.editorUnlockOpen);
  const setOpen = useUniverse((s) => s.setEditorUnlockOpen);
  const setEditorMode = useUniverse((s) => s.setEditorMode);
  const editorMode = useUniverse((s) => s.editorMode);
  const [key, setKey] = useState("");
  const [err, setErr] = useState<string | null>(null);

  if (!open) return null;

  const submit = () => {
    if (validateEditorKey(key)) {
      setEditorMode(true);
      setOpen(false);
      setKey("");
      setErr(null);
    } else {
      setErr("Kunci salah. Coba lagi.");
    }
  };

  return (
    <div
      onClick={() => setOpen(false)}
      style={{
        position: "fixed", inset: 0, background: "rgba(5,8,15,0.82)", backdropFilter: "blur(12px)",
        zIndex: 80, display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(420px, 92vw)", background: "rgba(11,18,32,0.96)",
          border: "1px solid rgba(168,85,247,0.4)", borderRadius: 6,
          boxShadow: "0 30px 80px -20px #a855f755", padding: "24px 22px",
        }}
      >
        <div style={{ fontFamily: "Space Mono", fontSize: 9, letterSpacing: "0.4em", color: "#a855f7" }}>
          MODE EDITOR
        </div>
        <h3 style={{ fontFamily: "Bebas Neue", fontSize: 26, letterSpacing: "0.06em", color: "#e8f4ff", marginTop: 6 }}>
          Buka Akses Editor
        </h3>
        <p style={{ fontFamily: "DM Sans", fontSize: 13, lineHeight: 1.6, color: "#8ba3c0", marginTop: 8 }}>
          {editorMode
            ? "Editor sudah aktif. Tutup modal ini untuk mengubah node dari panel kanan."
            : "Masukkan kunci editor untuk mengaktifkan mode edit pada node universe."}
        </p>
        {!editorMode && (
          <>
            <input
              autoFocus
              type="password"
              value={key}
              onChange={(e) => { setKey(e.target.value); setErr(null); }}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
              placeholder="Editor key…"
              style={{
                width: "100%", marginTop: 16, padding: "12px 14px",
                background: "rgba(5,8,15,0.6)", border: "1px solid rgba(168,85,247,0.35)",
                color: "#e8f4ff", fontFamily: "Space Mono", fontSize: 13, letterSpacing: "0.15em",
                borderRadius: 4, outline: "none",
              }}
            />
            {err && <div style={{ marginTop: 8, color: "#ff5c5c", fontFamily: "Space Mono", fontSize: 11 }}>{err}</div>}
            <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
              <button
                onClick={() => setOpen(false)}
                style={{ flex: 1, padding: "10px", background: "transparent", border: "1px solid rgba(168,85,247,0.25)", color: "#8ba3c0", cursor: "pointer", borderRadius: 4, fontFamily: "Space Mono", fontSize: 11, letterSpacing: "0.2em" }}
              >BATAL</button>
              <button
                onClick={submit}
                style={{ flex: 1, padding: "10px", background: "rgba(168,85,247,0.18)", border: "1px solid rgba(168,85,247,0.5)", color: "#e8f4ff", cursor: "pointer", borderRadius: 4, fontFamily: "Space Mono", fontSize: 11, letterSpacing: "0.2em" }}
              >BUKA</button>
            </div>
          </>
        )}
        {editorMode && (
          <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
            <button
              onClick={() => { setEditorMode(false); setOpen(false); }}
              style={{ flex: 1, padding: "10px", background: "transparent", border: "1px solid rgba(255,92,92,0.4)", color: "#ff5c5c", cursor: "pointer", borderRadius: 4, fontFamily: "Space Mono", fontSize: 11, letterSpacing: "0.2em" }}
            >MATIKAN</button>
            <button
              onClick={() => setOpen(false)}
              style={{ flex: 1, padding: "10px", background: "rgba(168,85,247,0.18)", border: "1px solid rgba(168,85,247,0.5)", color: "#e8f4ff", cursor: "pointer", borderRadius: 4, fontFamily: "Space Mono", fontSize: 11, letterSpacing: "0.2em" }}
            >TUTUP</button>
          </div>
        )}
      </div>
    </div>
  );
}