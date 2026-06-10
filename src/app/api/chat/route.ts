import { NextResponse } from "next/server";

type ApiMessage = {
  role: string;
  content: string;
  images?: string[];
};

export async function POST(req: Request) {
  try {
    const { messages, model } = await req.json();
    const systemMessage = {
      role: "system",
      content:
        "You are BrewMind. When your answer includes any mathematical expression, formula, equation, or symbolic relation, write it in LaTeX using $...$ for inline math and $$...$$ for display math. Never use plain-text approximations when a mathematical form exists. Keep the rest of the answer natural and helpful.",
    };

    // Map messages to ensure images are formatted properly for Ollama's API structure
    const formattedMessages: ApiMessage[] = messages.map((msg: ApiMessage) => {
      const formatted: ApiMessage = {
        role: msg.role,
        content: msg.content,
      };
      if (msg.images && msg.images.length > 0) {
        // Ollama expects just the base64 string without the "data:image/jpeg;base64," prefix
        formatted.images = msg.images.map(
          (img: string) => img.split(",")[1] || img,
        );
      }
      return formatted;
    });

    const ollamaResponse = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: model,
        messages: [systemMessage, ...formattedMessages],
        stream: true,
      }),
    });

    if (!ollamaResponse.ok) {
      throw new Error(`Ollama responded with status ${ollamaResponse.status}`);
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = ollamaResponse.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const rawChunk = decoder.decode(value, { stream: true });
            const lines = rawChunk.split("\n");

            for (const line of lines) {
              if (line.trim() === "") continue;
              const parsed = JSON.parse(line);

              if (parsed.message?.content) {
                controller.enqueue(encoder.encode(parsed.message.content));
              }
            }
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
