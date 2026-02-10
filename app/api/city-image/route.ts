import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

// In-memory cache to avoid redundant Firestore reads within the same server process
const imageCache = new Map<string, string>();

export async function GET(request: NextRequest) {
  const city = request.nextUrl.searchParams.get("city");

  if (!city) {
    return NextResponse.json({ error: "Missing city parameter" }, { status: 400 });
  }

  const cacheKey = city.toLowerCase().trim();

  // 1. Check in-memory cache
  if (imageCache.has(cacheKey)) {
    return NextResponse.json({ image: imageCache.get(cacheKey) });
  }

  try {
    // 2. Check Firestore for a previously saved image
    const docRef = doc(db, "cityImages", cacheKey);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const image = docSnap.data().image as string;
      imageCache.set(cacheKey, image);
      return NextResponse.json({ image });
    }

    // 3. Generate a new image with Nano Banana
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

        // 4. Save to Firestore for permanent persistence
        await setDoc(docRef, {
          city: city,
          image: base64Image,
          createdAt: new Date().toISOString(),
        });

        // 5. Cache in memory
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
