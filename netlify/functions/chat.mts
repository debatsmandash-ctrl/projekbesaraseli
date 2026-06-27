import { streamText, convertToModelMessages } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const MODE_PROMPTS: Record<string, string> = {
  qa: "Kamu adalah asisten AI untuk Debate Coach Toolkit SMANDASH Debate Club. Jawab pertanyaan tentang debate, motion, matter, strategi, kosakata, dan konten dalam Debate Universe dengan jelas dan ringkas. Gunakan bahasa Indonesia yang natural.",
  generate:
    "Kamu adalah debate coach profesional untuk SMANDASH Debate Club. Bantu generate motion dan matter baru yang berkualitas tinggi untuk British Parliamentary debate. Buat yang relevan, kontroversial (dalam batas wajar), dan menarik untuk diperdebatkan.",
  coach:
    "Kamu adalah adjudicator berpengalaman untuk SMANDASH Debate Club. Berikan feedback konstruktif seperti adjudicator profesional British Parliamentary. Perhatikan struktur argumen, rebuttals, matter, dan manner.",
  search:
    "Kamu adalah asisten pencarian untuk Debate Universe SMANDASH. Bantu pengguna menemukan topik, motion, matter, atau konsep yang relevan. Rekomendasikan konten spesifik dari data universe yang diberikan.",
};

export default async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await req.json();
    const {
      messages = [],
      mode = "qa",
      context = "",
    }: {
      messages: Parameters<typeof convertToModelMessages>[0];
      mode: string;
      context: string;
    } = body;

    const baseURL = process.env.OPENAI_BASE_URL;
    const apiKey = process.env.OPENAI_API_KEY;

    if (!baseURL || !apiKey) {
      return new Response(
        JSON.stringify({
          error:
            "AI Gateway not available. Deploy to Netlify to activate AI features.",
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const provider = createOpenAICompatible({
      name: "netlify-gateway",
      baseURL,
      apiKey,
    });

    // Convert UIMessage[] (from useChat) to CoreMessage[] for streamText
    const modelMessages = await convertToModelMessages(messages);

    const systemBase = MODE_PROMPTS[mode] ?? MODE_PROMPTS.qa;
    const system = context
      ? `${systemBase}\n\nData Debate Universe yang tersedia:\n${context}`
      : systemBase;

    const result = streamText({
      model: provider("gpt-4.1-mini"),
      system,
      messages: modelMessages,
      maxTokens: 2048,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const config = {
  path: "/api/chat",
};
