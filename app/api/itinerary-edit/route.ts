import { NextRequest, NextResponse } from "next/server";
import { ItineraryClient, ActivityClient } from "@/lib/itineraryService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SelectedPlace = {
  dayIndex: number;
  activityIndex: number;
};

function isObject(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null;
}

function validateSelection(
  itinerary: ItineraryClient,
  selection: SelectedPlace
): { dayIndex: number; activityIndex: number } {
  const days = itinerary.days || [];
  if (
    !Number.isInteger(selection.dayIndex) ||
    selection.dayIndex < 0 ||
    selection.dayIndex >= days.length
  ) {
    throw new Error("Invalid selection.dayIndex");
  }

  const activities = days[selection.dayIndex]?.activities || [];
  if (
    !Number.isInteger(selection.activityIndex) ||
    selection.activityIndex < 0 ||
    selection.activityIndex >= activities.length
  ) {
    throw new Error("Invalid selection.activityIndex");
  }

  return selection;
}

function normalizeDayOrders(itinerary: ItineraryClient, dayIndex: number) {
  const days = itinerary.days || [];
  const day = days[dayIndex];
  if (!day?.activities) return;
  day.activities = day.activities.map((a, idx) => ({ ...a, order: idx }));
}

function transformServerResponseToItinerary(
  serverResponse: any,
  originalItinerary: ItineraryClient,
  selection: SelectedPlace
): { itinerary: ItineraryClient; changeSummary: string } {
  const next: ItineraryClient = JSON.parse(JSON.stringify(originalItinerary));

  if (serverResponse.updated_activity) {
    const updatedActivity = serverResponse.updated_activity;
    const days = next.days || [];
    const day = days[selection.dayIndex];
    if (day?.activities?.[selection.activityIndex]) {
      const original = day.activities[selection.activityIndex];
      day.activities[selection.activityIndex] = {
        ...original,
        name: updatedActivity.name || original.name,
        locationName: updatedActivity.location || original.locationName,
        locationGeo: updatedActivity.coordinates
          ? {
              latitude: updatedActivity.coordinates.lat || 0,
              longitude: updatedActivity.coordinates.lng || 0,
            }
          : original.locationGeo,
        timeStart: updatedActivity.start_time || original.timeStart,
        timeEnd: updatedActivity.end_time || original.timeEnd,
        description: updatedActivity.description || original.description,
        url: updatedActivity.url || original.url,
      };
    }
  }

  if (serverResponse.new_activity && serverResponse.operation === "add") {
    const newAct = serverResponse.new_activity;
    const days = next.days || [];
    const day = days[selection.dayIndex];
    if (day?.activities) {
      const newActivity: ActivityClient = {
        name: newAct.name || "New activity",
        locationName: newAct.location || "N/A",
        locationGeo: newAct.coordinates
          ? { latitude: newAct.coordinates.lat || 0, longitude: newAct.coordinates.lng || 0 }
          : { latitude: 0, longitude: 0 },
        timeStart: newAct.start_time || day.activities[selection.activityIndex]?.timeEnd || "",
        timeEnd: newAct.end_time || "",
        tags: newAct.tags || ["attraction"],
        description: newAct.description || "N/A",
        url: newAct.url,
        order: selection.activityIndex + 1,
      };
      day.activities.splice(selection.activityIndex + 1, 0, newActivity);
    }
  }

  if (serverResponse.operation === "delete") {
    const days = next.days || [];
    const day = days[selection.dayIndex];
    if (day?.activities) {
      day.activities.splice(selection.activityIndex, 1);
    }
  }

  normalizeDayOrders(next, selection.dayIndex);
  next.updatedAt = new Date().toISOString();

  const changeSummary =
    serverResponse.change_summary ||
    serverResponse.changeSummary ||
    "Itinerary updated.";

  return { itinerary: next, changeSummary };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const itinerary = body?.itinerary as ItineraryClient | undefined;
    const editRequest = body?.editRequest as string | undefined;
    const selection = body?.selection as SelectedPlace | undefined;

    if (!itinerary || !isObject(itinerary)) {
      return NextResponse.json(
        { success: false, error: "Missing itinerary" },
        { status: 400 }
      );
    }

    if (typeof editRequest !== "string" || editRequest.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Missing editRequest" },
        { status: 400 }
      );
    }

    if (!selection || !isObject(selection)) {
      return NextResponse.json(
        { success: false, error: "Missing selection" },
        { status: 400 }
      );
    }

    const normalizedSelection = validateSelection(itinerary, selection);

    // Get selected activity info to send to server
    const days = itinerary.days || [];
    const selectedActivity =
      days[normalizedSelection.dayIndex]?.activities?.[
        normalizedSelection.activityIndex
      ];

    if (!selectedActivity) {
      return NextResponse.json(
        { success: false, error: "Selected activity not found" },
        { status: 400 }
      );
    }

    // Call external itinerary server
    const ITINERARY_SERVER_URL =
      process.env.ITINERARY_SERVER_URL || "http://localhost:5500";

    // Health check first
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const healthCheck = await fetch(`${ITINERARY_SERVER_URL}/health`, {
      method: "GET",
      signal: controller.signal,
    }).catch((err) => {
      console.error("Health check failed:", err.message);
      throw new Error("Itinerary server unavailable");
    });

    clearTimeout(timeoutId);

    if (!healthCheck.ok) {
      throw new Error("Itinerary server health check failed");
    }

    console.log("✅ Itinerary server is running, sending edit request...");

    // Call the edit endpoint on the external server
    const response = await fetch(`${ITINERARY_SERVER_URL}/api/edit-itinerary`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        edit_request: editRequest,
        current_activity: {
          name: selectedActivity.name,
          location: selectedActivity.locationName,
          coordinates: {
            lat: selectedActivity.locationGeo.latitude,
            lng: selectedActivity.locationGeo.longitude,
          },
          start_time: selectedActivity.timeStart,
          end_time: selectedActivity.timeEnd,
          description: selectedActivity.description,
          tags: selectedActivity.tags,
        },
        city: itinerary.destination,
        day_date: days[normalizedSelection.dayIndex]?.date,
        interests: itinerary.interests,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Server returned ${response.status}: ${errorText}`
      );
    }

    const serverData = await response.json();

    // Transform server response and apply to itinerary
    const { itinerary: updatedItinerary, changeSummary } =
      transformServerResponseToItinerary(
        serverData,
        itinerary,
        normalizedSelection
      );

    return NextResponse.json({
      success: true,
      itinerary: updatedItinerary,
      changeSummary,
      operation: serverData.operation || "update",
    });
  } catch (error: any) {
    console.error("❌ Error editing itinerary:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to edit itinerary",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Itinerary Edit API",
    usage: "POST { itinerary, editRequest, selection: { dayIndex, activityIndex } }",
  });
}
