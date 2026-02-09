// app/api/itinerary-generation/stream/route.ts
import { NextRequest } from "next/server";

export const maxDuration = 300; // 5 minutes (Vercel hobby plan limit)
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    city = "New York",
    interests = "software engineer",
    startDate,
    endDate,
  } = body;

  const ITINERARY_SERVER_URL =
    process.env.ITINERARY_SERVER_URL || "http://localhost:5500";

  // Create a readable stream to forward SSE events
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Connect to the itinerary server's streaming endpoint
        const response = await fetch(
          `${ITINERARY_SERVER_URL}/api/generate-itinerary-stream`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              city,
              interests,
              start_date: startDate,
              end_date: endDate,
            }),
          }
        );

        if (!response.ok) {
          // Try to get error text from response
          let errorMsg = `Itinerary server error: ${response.status}`;
          try {
            const errorText = await response.text();
            if (
              errorText.includes("<!DOCTYPE") ||
              errorText.includes("<html")
            ) {
              errorMsg =
                "Itinerary server endpoint not found. Please restart the itinerary server.";
            } else {
              const errorJson = JSON.parse(errorText);
              errorMsg = errorJson.error || errorMsg;
            }
          } catch {
            // Use default error message
          }

          console.error("Stream route error:", errorMsg);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                message: errorMsg,
              })}\n\n`
            )
          );
          controller.close();
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                message: "No response stream",
              })}\n\n`
            )
          );
          controller.close();
          return;
        }

        // Forward all chunks from the itinerary server
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Forward the chunk directly
          controller.enqueue(value);
        }

        controller.close();
      } catch (error: any) {
        console.error("Stream error:", error);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "error",
              message: error.message || "Connection failed",
            })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
