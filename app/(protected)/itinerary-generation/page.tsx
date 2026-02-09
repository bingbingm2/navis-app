"use client";

import { useState, useRef, useEffect } from "react";
import {
  Map,
  MapPin,
  Loader2,
  ChevronDown,
  ChevronUp,
  Calendar,
  Sparkles,
  Search,
  CheckCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { US_MAJOR_CITIES } from "./us_cities";
import { saveUserInterests, getCurrentUserUID } from "@/lib/userLogin";
import { INTEREST_CATEGORIES } from "./user_interests";

// Progress state type
interface ProgressState {
  phase: string;
  message: string;
  detail?: string;
  percent?: number;
}

// Transform raw server response to ItineraryClient format for Firebase
function transformToItineraryClient(
  serverData: any,
  city: string,
  interests: string[],
  userId: string,
  startDate: string,
  endDate: string
) {
  const now = new Date().toISOString();
  const itinerary = serverData.itinerary || [];

  // Group events by day
  const dayGroups: Record<string, any[]> = {};

  itinerary.forEach((item: any) => {
    const dayKey = item.start_time?.split("T")[0] || startDate.split("T")[0];
    if (!dayGroups[dayKey]) {
      dayGroups[dayKey] = [];
    }
    dayGroups[dayKey].push(item);
  });

  const sortedDays = Object.entries(dayGroups).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  // Convert to days with activities
  const days = sortedDays.map(([dateKey, items]: [string, any[]], index) => {
    const sortedItems = items.sort((a: any, b: any) => {
      const timeA = new Date(a.start_time).getTime();
      const timeB = new Date(b.start_time).getTime();
      return timeA - timeB;
    });

    const activities = sortedItems.map((item: any, order: number) => {
      // Extract location
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

      const tags =
        item.tags && Array.isArray(item.tags) && item.tags.length > 0
          ? item.tags
          : [item.category || "activity"];

      return {
        name: item.name || "N/A",
        locationName,
        locationGeo: {
          latitude: item.coordinates?.lat || 0,
          longitude: item.coordinates?.lng || 0,
        },
        timeStart: item.start_time,
        timeEnd: item.end_time,
        tags,
        description: item.description || "N/A",
        url: item.source?.url || item.url || "",
        order,
      };
    });

    return {
      date: `${dateKey}T00:00:00`,
      dayNumber: index + 1,
      notes: `Day ${index + 1}: ${items.length} activities planned`,
      activities,
    };
  });

  // Determine timezone based on city
  const timezone =
    city.toLowerCase().includes("los angeles") ||
    city.toLowerCase().includes("la")
      ? "America/Los_Angeles"
      : city.toLowerCase().includes("chicago")
      ? "America/Chicago"
      : "America/New_York";

  return {
    userId,
    destination: city,
    startDate,
    endDate,
    interests,
    timezone,
    createdAt: now,
    updatedAt: now,
    days,
  };
}

function getUpcomingWeekend() {
  const today = new Date();
  const currentDay = today.getDay(); // 0 = Sunday, 6 = Saturday

  let daysUntilSaturday = 6 - currentDay; // Days until Saturday

  // If today is Saturday (6), get next Saturday
  if (currentDay === 6) {
    daysUntilSaturday = 7;
  }
  // If today is Sunday (0), get next Saturday (6 days away)
  else if (currentDay === 0) {
    daysUntilSaturday = 6;
  }

  // Calculate Saturday
  const saturday = new Date(today);
  saturday.setDate(today.getDate() + daysUntilSaturday);
  saturday.setHours(0, 0, 0, 0);

  // Calculate Sunday (next day after Saturday)
  const sunday = new Date(saturday);
  sunday.setDate(saturday.getDate() + 1);
  sunday.setHours(23, 59, 59, 999);

  return {
    startDate: saturday.toISOString(),
    endDate: sunday.toISOString(),
    displayText: `${saturday.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })} - ${sunday.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })}`,
  };
}

export default function ItineraryGenerationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [city, setCity] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [progress, setProgress] = useState<ProgressState | null>(null);

  // Date state - default to upcoming weekend
  const defaultWeekend = getUpcomingWeekend();
  const [startDate, setStartDate] = useState(
    defaultWeekend.startDate.split("T")[0]
  );
  const [endDate, setEndDate] = useState(defaultWeekend.endDate.split("T")[0]);

  // Add new state for autocomplete
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredCities, setFilteredCities] = useState<string[]>([]);
  const inputRef = useRef<HTMLDivElement>(null);

  // State for expandable categories
  const [expandedCategories, setExpandedCategories] = useState<{
    [key: string]: boolean;
  }>({});

  const MAX_TAGS = 10;

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter cities based on input
  const handleCityChange = (value: string) => {
    setCity(value);

    if (value.trim().length > 0) {
      const filtered = US_MAJOR_CITIES.filter((cityName) =>
        cityName.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 8);

      setFilteredCities(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setFilteredCities([]);
      setShowSuggestions(false);
    }
  };

  // Select a city from suggestions
  const selectCity = (selectedCity: string) => {
    setCity(selectedCity);
    setShowSuggestions(false);
    setFilteredCities([]);
  };

  // Toggle tag selection with limit
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) {
        // Always allow deselection
        return prev.filter((t) => t !== tag);
      } else if (prev.length >= MAX_TAGS) {
        // Prevent selection if limit reached
        alert(`You can select up to ${MAX_TAGS} interests only`);
        return prev;
      } else {
        // Add tag if under limit
        return [...prev, tag];
      }
    });
  };

  // Toggle category expansion
  const toggleCategory = (categoryName: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryName]: !prev[categoryName],
    }));
  };

  const handleUnlockTrip = async () => {
    if (!city || selectedTags.length === 0) {
      alert("Please select a city and at least one interest");
      return;
    }

    if (!startDate || !endDate) {
      alert("Please select both start and end dates");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      alert("End date must be after start date");
      return;
    }

    setLoading(true);
    try {
      // Get current user ID
      const userId = getCurrentUserUID();

      if (!userId) {
        alert("Please log in to create an itinerary");
        router.push("/login");
        return;
      }

      // Save user interests to Firebase
      try {
        await saveUserInterests(userId, selectedTags);
        console.log("✅ User interests saved");
      } catch (interestError: any) {
        console.error("⚠️ Failed to save interests:", interestError.message);
      }

      // Use the date strings directly from the picker (already in YYYY-MM-DD format)
      // No Date object conversion needed - this preserves the exact date selected
      const startDateTime = `${startDate}T00:00:00`;
      const endDateTime = `${endDate}T23:59:59`;

      console.log("📅 Date range:", startDateTime, "to", endDateTime);

      // Use streaming endpoint for real-time progress updates
      const response = await fetch("/api/itinerary-generation/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city,
          interests: selectedTags.join(", "),
          userId: userId,
          startDate: startDateTime,
          endDate: endDateTime,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      // Read the SSE stream
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response stream available");
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let data: any = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events from buffer
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const eventData = JSON.parse(line.slice(6));

              if (eventData.type === "progress") {
                setProgress({
                  phase: eventData.phase,
                  message: eventData.message,
                  detail: eventData.detail,
                  percent: eventData.percent,
                });
              } else if (eventData.type === "complete") {
                data = eventData.data;
                setProgress({
                  phase: "complete",
                  message: "Your itinerary is ready!",
                  detail: `Found ${data.total_items} activities for your trip`,
                });
              } else if (eventData.type === "error") {
                // Server sent an error - throw it to be caught by outer catch
                reader.cancel();
                throw new Error(eventData.message || "Server error occurred");
              }
            } catch (parseError: any) {
              // If it's our intentional error, re-throw it
              if (parseError.message && !parseError.message.includes("JSON")) {
                throw parseError;
              }
              // Otherwise ignore parse errors for incomplete JSON
            }
          }
        }
      }

      if (data?.success) {
        // Transform raw server data to ItineraryClient format
        const transformedItinerary = transformToItineraryClient(
          data,
          city,
          selectedTags,
          userId,
          startDateTime,
          endDateTime
        );

        // NOW save to Firebase from the authenticated frontend
        const { createItinerary } = await import("@/lib/itineraryService");

        try {
          console.log("💾 Saving itinerary to Firebase...");
          console.log("📦 Transformed itinerary:", transformedItinerary);
          const tripId = await createItinerary(transformedItinerary);
          const itineraryWithId = { ...transformedItinerary, id: tripId };
          console.log("✅ Itinerary saved to Firebase:", tripId);

          // Store and navigate
          localStorage.setItem("currentTrip", JSON.stringify(itineraryWithId));
          router.push("/itinerary");
        } catch (saveError: any) {
          console.error("❌ Failed to save to Firebase:", saveError.message);
          alert(
            "Generated itinerary but failed to save. Error: " +
              saveError.message
          );
        }
      } else {
        alert(
          "Failed to generate itinerary: " + (data?.error || "Unknown error")
        );
      }
    } catch (error: any) {
      alert("Error generating itinerary: " + error.message);
      console.error(error);
    } finally {
      setLoading(false);
      setProgress(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-blue-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Form to unlock trip */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Map className="w-8 h-8 text-violet-600" />
            </div>
            <h2 className="text-3xl font-bold mb-2">
              Unlock Your Trip Itinerary
            </h2>
            <p className="text-gray-600">
              Tell us your destination and interests to create a personalized
              travel experience
            </p>
          </div>

          <div className="space-y-6">
            {/* City Input with Autocomplete */}
            <div ref={inputRef} className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Destination City *
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => handleCityChange(e.target.value)}
                onFocus={() => {
                  if (city.trim().length > 0 && filteredCities.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                placeholder="e.g., Chicago, Los Angeles, New York"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                autoComplete="off"
              />

              {/* Suggestions Dropdown */}
              {showSuggestions && filteredCities.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredCities.map((cityName, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => selectCity(cityName)}
                      className="w-full text-left px-4 py-3 hover:bg-violet-50 focus:bg-violet-50 focus:outline-none transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-violet-600 flex-shrink-0" />
                        <span className="text-gray-900">{cityName}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Date Range Selection */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || new Date().toISOString().split("T")[0]}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Show selected date range */}
            {startDate && endDate && (
              <div className="bg-blue-50 rounded-lg p-3 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <p className="text-sm text-blue-700">
                  <strong>Selected dates:</strong>{" "}
                  {new Date(startDate + "T00:00:00").toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}{" "}
                  -{" "}
                  {new Date(endDate + "T00:00:00").toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}{" "}
                  (
                  {Math.ceil(
                    (new Date(endDate + "T00:00:00").getTime() -
                      new Date(startDate + "T00:00:00").getTime()) /
                      (1000 * 60 * 60 * 24)
                  ) + 1}{" "}
                  days)
                </p>
              </div>
            )}

            {/* Interest Tags Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                What are you interested in? *
                {selectedTags.length > 0 && (
                  <span className="text-violet-600 ml-2">
                    ({selectedTags.length}/{MAX_TAGS} selected)
                  </span>
                )}
              </label>

              {selectedTags.length >= MAX_TAGS && (
                <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-700">
                    ⚠️ You've reached the maximum of {MAX_TAGS} interests.
                    Remove some to add different ones.
                  </p>
                </div>
              )}

              <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
                {INTEREST_CATEGORIES.map((category) => {
                  const Icon = category.icon;
                  const isExpanded = expandedCategories[category.name];
                  const displayTags = isExpanded
                    ? category.tags
                    : category.tags.slice(0, 5);

                  return (
                    <div
                      key={category.name}
                      className="border-b border-gray-100 pb-4 last:border-b-0"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${category.color}`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <h3 className="font-semibold text-gray-900">
                          {category.name}
                        </h3>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {displayTags.map((tag) => {
                          const isSelected = selectedTags.includes(tag);
                          const isDisabled =
                            !isSelected && selectedTags.length >= MAX_TAGS;

                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => toggleTag(tag)}
                              disabled={isDisabled}
                              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                isSelected
                                  ? "bg-violet-600 text-white shadow-md scale-105"
                                  : isDisabled
                                  ? "bg-gray-50 text-gray-400 cursor-not-allowed"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              }`}
                            >
                              {tag}
                            </button>
                          );
                        })}

                        {category.tags.length > 5 && (
                          <button
                            type="button"
                            onClick={() => toggleCategory(category.name)}
                            className="px-4 py-2 rounded-full text-sm font-medium bg-gray-50 text-gray-600 hover:bg-gray-100 flex items-center gap-1"
                          >
                            {isExpanded ? (
                              <>
                                Show less <ChevronUp className="w-4 h-4" />
                              </>
                            ) : (
                              <>
                                Show more <ChevronDown className="w-4 h-4" />
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedTags.length > 0 && (
                <div className="mt-4 p-3 bg-violet-50 rounded-lg">
                  <p className="text-sm text-violet-700 font-medium mb-2">
                    Selected interests:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-violet-600 text-white text-sm rounded-full"
                      >
                        {tag}
                        <button
                          onClick={() => toggleTag(tag)}
                          className="hover:bg-violet-700 rounded-full p-0.5"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Progress Display */}
            {loading && progress && (
              <div className="bg-gradient-to-r from-violet-50 to-blue-50 rounded-xl p-6 border border-violet-100">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {progress.phase === "complete" ? (
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                    ) : progress.phase === "scout" ||
                      progress.phase === "scout_complete" ? (
                      <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center">
                        <Search className="w-6 h-6 text-violet-600 animate-pulse" />
                      </div>
                    ) : progress.phase === "explorer" ? (
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-blue-600 animate-pulse" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-violet-600 animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-semibold text-gray-900">
                      {progress.message}
                    </p>
                    {progress.detail && (
                      <p className="text-sm text-gray-600 mt-1">
                        {progress.detail}
                      </p>
                    )}
                    {progress.percent !== undefined && (
                      <div className="mt-3">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all duration-500"
                            style={{ width: `${progress.percent}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleUnlockTrip}
              disabled={
                loading ||
                !city ||
                selectedTags.length === 0 ||
                !startDate ||
                !endDate
              }
              className="w-full px-6 py-3 bg-violet-600 text-white rounded-lg font-semibold hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {progress?.message || "Generating Your Itinerary..."}
                </>
              ) : (
                <>
                  <Map className="w-5 h-5" />
                  Unlock My Trip
                </>
              )}
            </button>

            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                💡 <strong>Tip:</strong> Select multiple interests to get the
                most personalized recommendations for your trip!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
