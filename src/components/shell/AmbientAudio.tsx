import { useEffect, useRef } from "react";
import { useSettings } from "@/lib/store";
import audioAsset from "@/assets/interstellar-theme.mp3.asset.json";

export function AmbientAudio() {
  const audioMuted = useSettings((s) => s.audioMuted);
  const audioVolume = useSettings((s) => s.audioVolume);
  const update = useSettings((s) => s.update);
  const ref = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const a = ref.current;
    if (!a) return;
    a.volume = audioVolume;
    a.muted = audioMuted;
    if (!audioMuted) {
      a.play().catch(() => { /* will retry on next gesture */ });
    }
  }, [audioMuted, audioVolume]);

  // First-gesture auto-unmute: kalau user belum pernah mute manual, mulai play setelah klik pertama
  useEffect(() => {
    const onFirst = () => {
      const a = ref.current;
      if (!a) return;
      // selalu play (kalau muted, tetap play biar buffer mulai)
      a.play().catch(() => {});
      // auto-unmute pada first gesture, hanya jika belum dipersist secara eksplisit
      const persisted = localStorage.getItem("smandash-settings-v1");
      const everToggled = persisted && persisted.includes("\"audioMuted\":false");
      if (!everToggled) {
        // unmute lembut
        update({ audioMuted: false });
      }
      window.removeEventListener("pointerdown", onFirst);
      window.removeEventListener("keydown", onFirst);
    };
    window.addEventListener("pointerdown", onFirst, { once: true });
    window.addEventListener("keydown", onFirst, { once: true });
    return () => {
      window.removeEventListener("pointerdown", onFirst);
      window.removeEventListener("keydown", onFirst);
    };
  }, [update]);

  return (
    <>
      <audio ref={ref} src={audioAsset.url} loop preload="auto" />
      <button
        onClick={() => update({ audioMuted: !audioMuted })}
        aria-label={audioMuted ? "Unmute musik" : "Mute musik"}
        title={audioMuted ? "Putar Interstellar Theme" : "Bisukan musik"}
        style={{
          position: "fixed", bottom: 18, right: 18, zIndex: 25,
          width: 40, height: 40, borderRadius: 999,
          background: "rgba(11,18,32,0.85)",
          border: `1px solid ${audioMuted ? "rgba(168,85,247,0.35)" : "rgba(0,255,200,0.55)"}`,
          color: audioMuted ? "#a855f7" : "#00ffc8",
          cursor: "pointer", fontSize: 16,
          boxShadow: audioMuted ? "none" : "0 0 18px rgba(0,255,200,0.35)",
          backdropFilter: "blur(10px)",
        }}
      >
        {audioMuted ? "♪̸" : "♪"}
      </button>
    </>
  );
}