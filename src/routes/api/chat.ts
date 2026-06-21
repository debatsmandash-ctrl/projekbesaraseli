import { createFileRoute } from "@tanstack/react-router";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const SYSTEM = `Kamu adalah asisten AI untuk SMANDASH Debate Club, terintegrasi dengan "Debate Star Universe".
Bantu user soal:
- Matter (kerangka argumen filosofis & domain)
- Motion bank (mosi, jenis, framing)
- Vocab debate (istilah)
- Kompetitor sekolah & speaker (riwayat lomba)
- Active member, coach, rotasi team SMANDASH
- Strategi (HALAL/HARAM debate styles, role P1-P3, GR/OR)

Jawab ringkas dan padat dalam Bahasa Indonesia (boleh campur istilah debate inggris).
Format Markdown. Kalau user minta generate motion/matter, kasih structure jelas (point, contoh, weighing).`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const body = await request.json().catch(() => null) as { messages?: UIMessage[]; mode?: string; context?: string } | null;
        if (!body?.messages) return new Response("Bad request", { status: 400 });

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3-flash-preview");

        const modeHint = body.mode === "generate"
          ? "\n\n[MODE: GENERATE] Jika user minta motion/matter baru, balas dalam blok markdown dengan field jelas (Mosi, Type, Pro, Kon, Weighing)."
          : body.mode === "coach"
          ? "\n\n[MODE: COACHING] Berikan feedback ala adjudicator: substance, strategy, manner. 3 poin positif, 3 poin perbaikan."
          : body.mode === "search"
          ? "\n\n[MODE: SEARCH] Cari node di universe yang relevan dengan query, jelaskan kenapa relevan."
          : "";

        const sysText = SYSTEM + modeHint + (body.context ? `\n\n[UNIVERSE CONTEXT]\n${body.context}` : "");

        try {
          const result = streamText({
            model,
            system: sysText,
            messages: await convertToModelMessages(body.messages),
          });
          return result.toUIMessageStreamResponse();
        } catch (e: any) {
          const msg = e?.message || "AI error";
          return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { "content-type": "application/json" } });
        }
      },
    },
  },
});
