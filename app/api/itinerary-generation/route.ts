// app/api/itinerary-generation/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  createItinerary,
  ItineraryClient,
  DayClient,
  ActivityClient,
} from "@/lib/itineraryService";
import { GeoPoint } from "firebase/firestore";
import { Agent } from "undici";

// Custom agent with extended timeouts for long-running itinerary generation
const longRunningAgent = new Agent({
  headersTimeout: 290000, // ~5 minutes - Vercel hobby plan limit
  bodyTimeout: 290000, // ~5 minutes - wait for full response body
  connectTimeout: 30000, // 30 seconds - connection timeout
});

// ... keep existing Place, DayItinerary interfaces for internal use ...

function transformToItineraryClient(
  apiResponse: any,
  city: string,
  interests: string,
  userId: string,
  providedStartDate?: string,
  providedEndDate?: string
): ItineraryClient {
  const now = new Date().toISOString();
  const itinerary = apiResponse.itinerary || [];

  // Group by day
  const dayGroups = new Map<string, any[]>();

  // Extract the selected date range boundaries for filtering
  const rangeStart = providedStartDate?.split("T")[0];
  const rangeEnd = providedEndDate?.split("T")[0];

  itinerary.forEach((item: any) => {
    // Extract date directly from start_time string to avoid timezone conversion
    // Format: "2026-01-07T19:00:00" -> extract "2026-01-07"
    const dayKey = item.start_time.split("T")[0];

    // Filter out activities outside the selected date range
    if (rangeStart && dayKey < rangeStart) return;
    if (rangeEnd && dayKey > rangeEnd) return;

    if (!dayGroups.has(dayKey)) {
      dayGroups.set(dayKey, []);
    }
    dayGroups.get(dayKey)!.push(item);
  });

  const sortedDays = Array.from(dayGroups.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  // Convert to days with activities
  const days: DayClient[] = sortedDays.map(([dateKey, items], index) => {
    const sortedItems = items.sort((a, b) => {
      const timeA = new Date(a.start_time).getTime();
      const timeB = new Date(b.start_time).getTime();
      return timeA - timeB;
    });

    const activities: ActivityClient[] = sortedItems.map((item, order) => {
      const coords = parseCoordinates(item);

      // Extract location - server returns nested location object
      let locationName = "N/A";
      if (item.location) {
        if (typeof item.location === "string") {
          locationName = item.location;
        } else if (item.location.address && item.location.city) {
          locationName = `${item.location.address}, ${item.location.city}`;
        } else if (item.location.venue) {
          locationName = item.location.venue;
        }
      }

      // Use server-provided tags if available, otherwise categorize
      const tags =
        item.tags && Array.isArray(item.tags) && item.tags.length > 0
          ? item.tags
          : [item.category || categorizeItem(item)];

      // Extract URL from source object if nested
      const url = item.source?.url || item.url || "";

      return {
        name: item.name || "N/A",
        locationName,
        locationGeo: {
          latitude: coords.latitude,
          longitude: coords.longitude,
        },
        timeStart: item.start_time,
        timeEnd: item.end_time,
        tags,
        description: item.description || "N/A",
        url,
        order: order,
      };
    });

    return {
      date: `${dateKey}T00:00:00`,
      dayNumber: index + 1,
      notes: `Day ${index + 1}: ${items.length} activities planned`,
      activities,
    };
  });

  const startDate =
    providedStartDate ||
    (sortedDays.length > 0 ? `${sortedDays[0][0]}T00:00:00` : now);
  const endDate =
    providedEndDate ||
    (sortedDays.length > 0
      ? `${sortedDays[sortedDays.length - 1][0]}T23:59:59`
      : now);

  const interestsArray = interests
    .split(",")
    .map((i) => i.trim())
    .filter((i) => i.length > 0);

  // Use timezone from server response, or default based on city
  const timezone =
    apiResponse.timezone ||
    (city.toLowerCase().includes("los angeles") ||
    city.toLowerCase().includes("la")
      ? "America/Los_Angeles"
      : city.toLowerCase().includes("chicago")
      ? "America/Chicago"
      : "America/New_York"); // Default for NYC and most East Coast cities

  return {
    userId,
    destination: city,
    startDate,
    endDate,
    interests: interestsArray,
    timezone,
    createdAt: now,
    updatedAt: now,
    days,
  };
}

function parseCoordinates(item: any): { latitude: number; longitude: number } {
  if (item.coordinates) {
    return {
      latitude: item.coordinates.lat || 0,
      longitude: item.coordinates.lng || 0,
    };
  }
  return { latitude: 0, longitude: 0 };
}

function categorizeItem(item: any): string {
  const name = item.name?.toLowerCase() || "";
  const description = item.description?.toLowerCase() || "";

  if (
    name.includes("restaurant") ||
    name.includes("cafe") ||
    name.includes("bakery") ||
    description.includes("dining") ||
    description.includes("food")
  ) {
    return "restaurant";
  }

  if (
    name.includes("hotel") ||
    name.includes("resort") ||
    description.includes("accommodation")
  ) {
    return "hotel";
  }

  return "attraction";
}

// Disable Next.js default timeout for this route (itinerary generation can take 10+ minutes)
export const maxDuration = 300; // 5 minutes (Vercel hobby plan limit)
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      city = "New York",
      interests = "software engineer",
      userId = "default_user",
      max_results = 20,
      startDate,
      endDate,
    } = body;

    console.log(`🔄 Generating itinerary for ${interests} in ${city}`);

    try {
      const ITINERARY_SERVER_URL =
        process.env.ITINERARY_SERVER_URL || "http://localhost:5500";

      // Increase health check timeout to 10 seconds
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const healthCheck = await fetch(`${ITINERARY_SERVER_URL}/health`, {
        method: "GET",
        signal: controller.signal,
      }).catch((err) => {
        console.error("Health check failed:", err.message);
        throw new Error(
          `Failed to connect to itinerary server: ${err.message}`
        );
      });

      clearTimeout(timeoutId);

      if (healthCheck.ok) {
        console.log("✅ API server is running, making request...");

        // Set timeout for the main request (~5 minutes - Vercel hobby plan limit)
        const mainController = new AbortController();
        const startTime = Date.now();
        const mainTimeoutId = setTimeout(() => {
          const elapsed = Math.round((Date.now() - startTime) / 1000);
          console.log(
            `⏱️ Request timeout - aborting after ${elapsed} seconds (limit: 5 minutes)`
          );
          mainController.abort();
        }, 290000); // ~5 minutes (Vercel hobby plan limit is 300s)

        console.log("📤 Sending request to itinerary server...");

        const response = await fetch(
          `${ITINERARY_SERVER_URL}/api/generate-itinerary`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              city,
              interests,
              max_results,
              start_date: startDate,
              end_date: endDate,
            }),
            signal: mainController.signal,
            // @ts-expect-error - dispatcher is a valid undici option for Node.js fetch
            dispatcher: longRunningAgent,
          }
        ).catch((err) => {
          const elapsed = Math.round((Date.now() - startTime) / 1000);
          console.error(
            `❌ Main itinerary request failed after ${elapsed} seconds:`,
            err.message
          );
          console.error("   Error cause:", err.cause);
          console.error("   Error code:", err.code);
          throw new Error(
            `Itinerary generation request failed after ${elapsed}s: ${
              err.message
            } (cause: ${err.cause || "unknown"})`
          );
        });

        clearTimeout(mainTimeoutId);
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        console.log(`📥 Response received after ${elapsed} seconds`);

        if (!response.ok) {
          throw new Error(
            `API server returned ${response.status}: ${response.statusText}`
          );
        }

        const data = await response.json();

        console.log(
          "✅ API server responded with",
          data.itinerary?.length || 0,
          "events/activities"
        );

        // Validate response format
        if (!data.itinerary || !Array.isArray(data.itinerary)) {
          console.error(
            "❌ Invalid response format. Expected 'itinerary' array."
          );
          throw new Error(
            "API server returned invalid format. Expected 'itinerary' array but got: " +
              JSON.stringify(Object.keys(data))
          );
        }

        if (data.itinerary.length === 0) {
          throw new Error(
            "API server returned empty itinerary. No events found for the specified criteria."
          );
        }

        // Transform to new schema
        const itinerary = transformToItineraryClient(
          data,
          city,
          interests,
          userId.toString(),
          startDate,
          endDate
        );

        return NextResponse.json({
          success: true,
          itinerary,
          meta: {
            totalItems: data.total_items,
            activities: data.activities,
            events: data.events,
            generatedAt: data.generated_at,
          },
        });
      } else {
        throw new Error("API server health check failed");
      }
    } catch (healthError: any) {
      console.error("❌ API server unavailable:", healthError.message);
      return NextResponse.json(
        {
          success: false,
          error: "Itinerary generation service is currently unavailable",
          details: healthError.message,
        },
        { status: 503 }
      );
    }
  } catch (error: any) {
    console.error("❌ Error generating itinerary:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate itinerary",
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "Itinerary Generation API",
    usage: "Send a POST request with { city, interests, userId }",
    schema:
      "Using nested subcollections: itinerary/{tripId}/days/{dayId}/activities/{activityId}",
  });
}
