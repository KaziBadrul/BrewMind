import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Attempt to hit local Ollama instance
    const res = await fetch("http://localhost:11434/api/tags", {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error("Ollama instance returned an error status");
    }

    const data = await res.json();

    // Format the response for clean consumption by our client state
    const models =
      data.models?.map((m: any) => ({
        name: m.name,
        size: m.size,
        parameterSize: m.details?.parameter_size || "Unknown",
        family: m.details?.family || "Unknown",
      })) || [];

    return NextResponse.json({ active: true, models });
  } catch (error) {
    // If Ollama is turned off or not installed, return inactive state gracefully
    return NextResponse.json({ active: false, models: [] });
  }
}
