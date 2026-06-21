import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Universe } from "@/components/universe/Universe";
import { Loader } from "@/components/shell/Loader";
import { Sidebar } from "@/components/shell/Sidebar";
import { SidePanel } from "@/components/shell/SidePanel";
import { MobileShell } from "@/components/shell/MobileShell";
import { SearchOverlay } from "@/components/shell/SearchOverlay";
import { EditorUnlockModal } from "@/components/shell/EditorUnlockModal";
import { SettingsPanel } from "@/components/shell/SettingsPanel";
import { AmbientAudio } from "@/components/shell/AmbientAudio";
import { AssistantPanel } from "@/components/shell/AssistantPanel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Debate Coach Toolkit · Star Universe" },
      { name: "description", content: "Navigate the entire debate curriculum as a 3D star map: matter, motion bank, roles, kamus — semua bintang yang saling terhubung." },
      { property: "og:title", content: "Debate Coach Toolkit · Star Universe" },
      { property: "og:description", content: "3D knowledge graph for SMANDASH Debate Club." },
    ],
  }),
  component: Index,
});

function Index() {
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse), (max-width: 900px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);
  return (
    <main style={{ position: "fixed", inset: 0, overflow: "hidden", background: "#05080f" }}>
      <div className="aurora-bg" />
      <Universe />
      {isMobile ? (
        <MobileShell />
      ) : (
        <>
          <Sidebar />
          <SidePanel />
        </>
      )}
      <SearchOverlay />
      <EditorUnlockModal />
      <SettingsPanel />
      <AmbientAudio />
      <AssistantPanel />
      {loading && <Loader onDone={() => setLoading(false)} />}
      <div
        style={{
          position: "fixed", top: 18, right: 22, zIndex: 20,
          fontFamily: "Space Mono", fontSize: 9, letterSpacing: "0.3em",
          color: "rgba(168,85,247,0.55)", textTransform: "uppercase", pointerEvents: "none",
        }}
      >
        v0.8 · STAR UNIVERSE
      </div>
    </main>
  );
}
