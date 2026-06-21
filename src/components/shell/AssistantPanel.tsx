import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { useUniverse } from "@/lib/store";
import { buildGraph } from "@/lib/graph/build";

type Mode = "qa" | "generate" | "coach" | "search";
const MODES: { id: Mode; label: string; desc: string }[] = [
  { id: "qa",       label: "Tanya",     desc: "Q&A tentang isi universe" },
  { id: "generate", label: "Generate",  desc: "Bantu bikin motion / matter baru" },
  { id: "coach",    label: "Coaching",  desc: "Feedback ala adjudicator" },
  { id: "search",   label: "Search AI", desc: "Cari node via natural language" },
];

export function AssistantPanel() {
  const open = useUniverse((s) => s.assistantOpen);
  const setOpen = useUniverse((s) => s.setAssistantOpen);
  const [mode, setMode] = useState<Mode>("qa");
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const universeContext = useMemo(() => {
    if (!open) return "";
    const g = buildGraph();
    // Compact summary
    const clusters = new Map<string, string[]>();
    for (const n of g.nodes) {
      if (n.kind === "root") continue;
      const arr = clusters.get(n.cluster) ?? [];
      if (arr.length < 60) arr.push(n.label);
      clusters.set(n.cluster, arr);
    }
    return Array.from(clusters.entries())
      .map(([k, arr]) => `${k}: ${arr.slice(0, 40).join(", ")}`)
      .join("\n");
  }, [open]);

  const transport = useMemo(() => new DefaultChatTransport({
    api: "/api/chat",
    body: () => ({ mode, context: universeContext }),
  }), [mode, universeContext]);

  const { messages, sendMessage, status, error, stop } = useChat({
    transport,
    onError: (e) => console.error("Chat error:", e),
  });

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open, mode]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, status]);

  if (!open) return null;
  const isLoading = status === "submitted" || status === "streaming";

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    sendMessage({ text });
    setInput("");
  };

  return (
    <div
      onClick={() => setOpen(false)}
      style={{ position: "fixed", inset: 0, background: "rgba(5,8,15,0.6)", backdropFilter: "blur(6px)", zIndex: 55, display: "flex", justifyContent: "flex-end" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(460px, 100vw)", height: "100vh",
          background: "linear-gradient(180deg, rgba(11,18,32,0.98), rgba(5,8,15,0.96))",
          borderLeft: "1px solid rgba(0,212,170,0.3)",
          boxShadow: "-30px 0 60px -10px rgba(0,212,170,0.15)",
          display: "flex", flexDirection: "column",
        }}
      >
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(0,212,170,0.18)", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18, color: "#00d4aa", textShadow: "0 0 12px #00d4aa" }}>✚</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "Bebas Neue", letterSpacing: "0.14em", fontSize: 16, color: "#e8f4ff" }}>AI ASSISTANT</div>
            <div style={{ fontFamily: "Space Mono", fontSize: 9, letterSpacing: "0.25em", color: "#3d5a7a" }}>LOVABLE AI · GEMINI 3 FLASH</div>
          </div>
          <button onClick={() => setOpen(false)} style={{ background: "transparent", border: "1px solid rgba(168,85,247,0.3)", color: "#a855f7", padding: "4px 10px", cursor: "pointer", borderRadius: 4, fontFamily: "Space Mono", fontSize: 11 }}>✕</button>
        </div>

        {/* Mode tabs */}
        <div style={{ display: "flex", gap: 4, padding: "10px 12px", borderBottom: "1px solid rgba(168,85,247,0.1)" }}>
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              title={m.desc}
              style={{
                flex: 1, padding: "6px 4px",
                background: mode === m.id ? "rgba(0,212,170,0.15)" : "transparent",
                border: `1px solid ${mode === m.id ? "rgba(0,212,170,0.5)" : "rgba(168,85,247,0.18)"}`,
                color: mode === m.id ? "#00d4aa" : "#8ba3c0",
                fontFamily: "Space Mono", fontSize: 9, letterSpacing: "0.15em",
                cursor: "pointer", borderRadius: 3,
              }}
            >{m.label.toUpperCase()}</button>
          ))}
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="panel-scroll" style={{ flex: 1, overflowY: "auto", padding: "16px 18px" }}>
          {messages.length === 0 && (
            <div style={{ fontFamily: "DM Sans", fontSize: 12, color: "#5d7494", lineHeight: 1.7 }}>
              <p style={{ marginBottom: 8 }}><strong style={{ color: "#00d4aa" }}>Selamat datang.</strong> Asisten ini terhubung dengan data Debate Universe (matter, motion, vocab, competitor, SMANDASH).</p>
              <p style={{ marginBottom: 8 }}>Coba tanya:</p>
              <ul style={{ paddingLeft: 18, margin: 0 }}>
                <li>"Siapa best speaker dari MAN IC Siak?"</li>
                <li>"Generate motion soal AI dan privasi"</li>
                <li>"Apa itu deadlock dalam debate?"</li>
                <li>"Strategi lawan tim Tembok Konstantinopel?"</li>
              </ul>
              <p style={{ marginTop: 14, fontSize: 10, color: "#3d5a7a", fontFamily: "Space Mono", letterSpacing: "0.1em" }}>
                Pakai Lovable AI (gratis kuota bulanan). API key sendiri (Claude/OpenAI) bisa ditambah nanti via Settings.
              </p>
            </div>
          )}
          {messages.map((m) => {
            const text = m.parts.map((p) => p.type === "text" ? p.text : "").join("");
            const isUser = m.role === "user";
            return (
              <div key={m.id} style={{ marginBottom: 14 }}>
                <div style={{ fontFamily: "Space Mono", fontSize: 9, letterSpacing: "0.2em", color: isUser ? "#a855f7" : "#00d4aa", marginBottom: 4 }}>
                  {isUser ? "YOU" : "AI"}
                </div>
                <div style={{
                  fontFamily: "DM Sans", fontSize: 13, color: "#e8f4ff", lineHeight: 1.6,
                  background: isUser ? "rgba(168,85,247,0.08)" : "rgba(0,212,170,0.06)",
                  border: `1px solid ${isUser ? "rgba(168,85,247,0.2)" : "rgba(0,212,170,0.18)"}`,
                  padding: "10px 12px", borderRadius: 6, whiteSpace: "pre-wrap",
                }}>{text || (isLoading && !isUser ? "…" : "")}</div>
              </div>
            );
          })}
          {error && (
            <div style={{ padding: 10, background: "rgba(251,113,133,0.1)", border: "1px solid rgba(251,113,133,0.3)", color: "#fb7185", fontFamily: "Space Mono", fontSize: 11, borderRadius: 4 }}>
              {error.message || "AI error. Cek koneksi atau kuota Lovable AI."}
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={onSubmit} style={{ padding: 12, borderTop: "1px solid rgba(0,212,170,0.15)" }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSubmit(e as any); } }}
            placeholder={`Tanya sesuatu... (${MODES.find(m => m.id === mode)?.desc})`}
            rows={2}
            style={{
              width: "100%", background: "rgba(5,8,15,0.6)",
              border: "1px solid rgba(0,212,170,0.25)", color: "#e8f4ff",
              fontFamily: "DM Sans", fontSize: 13, padding: "10px 12px",
              borderRadius: 4, outline: "none", resize: "none",
            }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button type="submit" disabled={isLoading || !input.trim()} style={{
              flex: 1, padding: "8px 12px",
              background: isLoading ? "rgba(168,85,247,0.15)" : "rgba(0,212,170,0.15)",
              border: `1px solid ${isLoading ? "rgba(168,85,247,0.4)" : "rgba(0,212,170,0.5)"}`,
              color: isLoading ? "#a855f7" : "#00d4aa",
              fontFamily: "Space Mono", fontSize: 10, letterSpacing: "0.2em",
              cursor: isLoading || !input.trim() ? "not-allowed" : "pointer", borderRadius: 4,
              opacity: !input.trim() ? 0.4 : 1,
            }}>{isLoading ? "STREAMING…" : "↵ KIRIM"}</button>
            {isLoading && (
              <button type="button" onClick={() => stop()} style={{
                padding: "8px 12px", background: "transparent",
                border: "1px solid rgba(251,113,133,0.4)", color: "#fb7185",
                fontFamily: "Space Mono", fontSize: 10, cursor: "pointer", borderRadius: 4,
              }}>STOP</button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
