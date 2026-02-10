import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

// In-memory cache to avoid regenerating images for the same city
const imageCache = new Map<string, string>();

export async function GET(request: NextRequest) {
  const city = request.nextUrl.searchParams.get("city");

  if (!city) {
    return NextResponse.json({ error: "Missing city parameter" }, { status: 400 });
  }

  const cacheKey = city.toLowerCase().trim();

  // Return cached image if available
  if (imageCache.has(cacheKey)) {
    return NextResponse.json({ image: imageCache.get(cacheKey) });
  }

  try {
    const prompt = `A stunning, iconic wide-angle photograph of ${city}. Show the most recognizable landmark or skyline of the city. Golden hour lighting, vibrant colors, professional travel photography style. No text or watermarks.`;

    const response = await ai.models.generateContent({
      model: "nano-banana-pro-preview",
      contents: prompt,
      config: {
        responseModalities: ["Image"],
      },
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts) {
      throw new Error("No response parts from Gemini");
    }

    for (const part of parts) {
      if (part.inlineData) {
        const base64Image = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        // Cache the result
        imageCache.set(cacheKey, base64Image);
        return NextResponse.json({ image: base64Image });
      }
    }

    throw new Error("No image returned from Gemini");
  } catch (error: any) {
    console.error("City image generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate image" },
      { status: 500 }
    );
  }
}
