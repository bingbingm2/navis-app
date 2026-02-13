// app/api/itinerary-generation/stream/route.ts
import { NextRequest } from "next/server";
import { Agent } from "undici";

// Custom agent with very generous timeouts — itinerary generation can take 10+ minutes
// bodyTimeout is the max time to wait between receiving body chunks
// headersTimeout is the max time to wait for initial response headers
const longRunningAgent = new Agent({
  headersTimeout: 600000, // 10 minutes — Python server may take a while to start responding
  bodyTimeout: 600000,    // 10 minutes — long gaps between SSE events during processing
  connectTimeout: 30000,  // 30 seconds — initial TCP connection
  keepAliveTimeout: 600000,
  keepAliveMaxTimeout: 600000,
});

export const maxDuration = 300; // 5 minutes (Vercel hobby plan limit, ignored locally)
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

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Keepalive heartbeat every 10s to prevent BROWSER/proxy timeouts
      // (SSE comment lines are silently ignored by EventSource clients)
      const keepaliveInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          clearInterval(keepaliveInterval);
        }
      }, 10000);

      // AbortController for the upstream request — only abort if WE decide to,
      // not because of any default timeout
      const upstreamAbort = new AbortController();

      try {
        console.log(
          `🔗 Stream connecting to ${ITINERARY_SERVER_URL}/api/generate-itinerary-stream`
        );

        // Send initial connecting event to browser immediately
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "progress",
              phase: "connecting",
              message: "Connecting to itinerary server...",
              percent: 0,
            })}\n\n`
          )
        );

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
            signal: upstreamAbort.signal,
            // @ts-expect-error - dispatcher is a valid undici option for Node.js fetch
            dispatcher: longRunningAgent,
          }
        );

        if (!response.ok) {
          clearInterval(keepaliveInterval);
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

        console.log("✅ Stream connected, forwarding SSE events...");

        const reader = response.body?.getReader();
        if (!reader) {
          clearInterval(keepaliveInterval);
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
        let lastChunkTime = Date.now();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const now = Date.now();
          const gap = Math.round((now - lastChunkTime) / 1000);
          if (gap > 30) {
            console.log(`📡 Received chunk after ${gap}s gap`);
          }
          lastChunkTime = now;

          // Forward the chunk directly to the browser
          controller.enqueue(value);
        }

        console.log("✅ Stream completed successfully");
        clearInterval(keepaliveInterval);
        controller.close();
      } catch (error: any) {
        clearInterval(keepaliveInterval);
        const errorMsg = error.message || "Connection failed";
        console.error("Stream error:", errorMsg);

        // Provide more helpful error messages
        let userMessage = errorMsg;
        if (errorMsg.includes("terminated")) {
          userMessage =
            "Connection to itinerary server was lost. The server may have timed out. Please try again.";
        } else if (errorMsg.includes("abort")) {
          userMessage =
            "Request was cancelled. Please try again.";
        }

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "error",
              message: userMessage,
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
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
