"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Plus,
  ChevronRight,
  ChevronUp,
  Minus,
  X,
  Send,
  Loader2,
  Sparkles,
  Utensils,
  Hotel,
  Compass,
  MessageCircle,
  Edit3,
  Trash2,
} from "lucide-react";
import { User } from "firebase/auth";
import {
  getUserItineraries,
  deleteItinerary,
  ItineraryClient,
} from "@/lib/itineraryService";

interface AuthenticatedGalleryProps {
  user: User;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function AuthenticatedGallery({
  user,
}: AuthenticatedGalleryProps) {
  const [trips, setTrips] = useState<ItineraryClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState<ItineraryClient | null>(
    null
  );
  const [selectedPlace, setSelectedPlace] = useState<{
    dayIndex: number;
    activityIndex: number;
  } | null>(null);

  const [showChat, setShowChat] = useState(false);
  const [chatMinimized, setChatMinimized] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [cityImages, setCityImages] = useState<Record<string, string>>({});
  const [loadingImages, setLoadingImages] = useState<Record<string, boolean>>({});
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const router = useRouter();

  const fetchCityImage = useCallback(async (destination: string) => {
    const cacheKey = `city-img-${destination.toLowerCase().trim()}`;

    // Check localStorage cache first
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      setCityImages((prev) => ({ ...prev, [destination]: cached }));
      return;
    }

    setLoadingImages((prev) => ({ ...prev, [destination]: true }));

    try {
      const res = await fetch(`/api/city-image?city=${encodeURIComponent(destination)}`);
      const data = await res.json();
      if (data.image) {
        setCityImages((prev) => ({ ...prev, [destination]: data.image }));
        // Cache in localStorage for persistence across page reloads
        localStorage.setItem(cacheKey, data.image);
      } else {
        setFailedImages((prev) => ({ ...prev, [destination]: true }));
      }
    } catch (error) {
      console.error("Error fetching city image for", destination, error);
      setFailedImages((prev) => ({ ...prev, [destination]: true }));
    } finally {
      setLoadingImages((prev) => ({ ...prev, [destination]: false }));
    }
  }, []);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const fetchedTrips = await getUserItineraries(user.uid);
        setTrips(fetchedTrips);
      } catch (error) {
        console.error("Error fetching trips:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, [user.uid, fetchCityImage]);

  // Fetch city images for all trips
  useEffect(() => {
    const destinations = [...new Set(trips.map((t) => t.destination))];
    destinations.forEach((dest) => {
      if (!cityImages[dest] && !loadingImages[dest] && !failedImages[dest]) {
        fetchCityImage(dest);
      }
    });
  }, [trips, cityImages, loadingImages, failedImages, fetchCityImage]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const getCategoryIcon = (tags: string[]) => {
    const tag = tags[0]?.toLowerCase() || "";
    if (tag.includes("restaurant") || tag.includes("food")) {
      return <Utensils className="w-4 h-4" />;
    }
    if (tag.includes("hotel") || tag.includes("accommodation")) {
      return <Hotel className="w-4 h-4" />;
    }
    return <Compass className="w-4 h-4" />;
  };

  const getCategoryColor = (tags: string[]) => {
    const tag = tags[0]?.toLowerCase() || "";
    if (tag.includes("restaurant") || tag.includes("food")) {
      return "bg-orange-100 text-orange-700";
    }
    if (tag.includes("hotel") || tag.includes("accommodation")) {
      return "bg-blue-100 text-blue-700";
    }
    return "bg-violet-100 text-violet-700";
  };

  const formatDate = (dateString: string, timezone?: string) => {
    // Strip 'Z' suffix if present (for backward compatibility with old data)
    const cleanDateString = dateString.replace(/Z$/, "");
    return new Date(cleanDateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: timezone || "America/New_York",
    });
  };

  const formatFullDate = (dateString: string, timezone?: string) => {
    // Strip 'Z' suffix if present (for backward compatibility with old data)
    const cleanDateString = dateString.replace(/Z$/, "");
    return new Date(cleanDateString).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      timeZone: timezone || "America/New_York",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleSelectPlace = (dayIndex: number, activityIndex: number) => {
    // Toggle off if clicking the same event
    if (selectedPlace?.dayIndex === dayIndex && selectedPlace?.activityIndex === activityIndex) {
      setSelectedPlace(null);
      return;
    }

    setSelectedPlace({ dayIndex, activityIndex });

    // Auto-open chat with fresh context for this activity
    setChatMessages([]);
    setChatInput("");
    const activity =
      selectedTrip?.days?.[dayIndex]?.activities?.[activityIndex];
    if (activity) {
      setChatMessages([
        {
          id: "1",
          role: "assistant",
          content: `You've selected "${activity.name}". What would you like to change?

• Change the time slot
• Find an alternative place
• Update the description
• Remove this activity
• Add something nearby`,
          timestamp: new Date(),
        },
      ]);
    }
    setShowChat(true);
  };

  const handleOpenChat = () => {
    // Always start fresh
    setChatMessages([]);
    setChatInput("");

    if (selectedPlace) {
      const activity =
        selectedTrip?.days?.[selectedPlace.dayIndex]?.activities?.[selectedPlace.activityIndex];
      if (activity) {
        setChatMessages([
          {
            id: "1",
            role: "assistant",
            content: `You've selected "${activity.name}". What would you like to change?

• Change the time slot
• Find an alternative place
• Update the description
• Remove this activity
• Add something nearby`,
            timestamp: new Date(),
          },
        ]);
      }
    } else {
      setChatMessages([
        {
          id: "1",
          role: "assistant",
          content: `Hi! I can help you modify your trip. You can:

• Select an activity from the itinerary first, then open me to edit it
• Or just tell me what you'd like to change overall`,
          timestamp: new Date(),
        },
      ]);
    }

    setShowChat(true);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || chatLoading || !selectedTrip || !selectedPlace) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: chatInput,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    const editRequest = chatInput;
    setChatInput("");
    setChatLoading(true);

    try {
      const response = await fetch("/api/itinerary-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itinerary: selectedTrip,
          editRequest,
          selection: {
            dayIndex: selectedPlace.dayIndex,
            activityIndex: selectedPlace.activityIndex,
          },
        }),
      });

      const data = await response.json();

      if (data.success && data.itinerary) {
        // Update the trip in state
        const updatedTrip = data.itinerary as ItineraryClient;
        setSelectedTrip(updatedTrip);
        setTrips((prev) =>
          prev.map((t) => (t.id === updatedTrip.id ? updatedTrip : t))
        );

        // Get the updated activity info for the message
        const updatedActivity =
          updatedTrip.days?.[selectedPlace.dayIndex]?.activities?.[
            selectedPlace.activityIndex
          ];

        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `✅ ${data.changeSummary || "Changes applied successfully!"}

${updatedActivity ? `**Updated activity:** ${updatedActivity.name}
📍 ${updatedActivity.locationName}
🕐 ${formatTime(updatedActivity.timeStart)} - ${formatTime(updatedActivity.timeEnd)}` : ""}

Is there anything else you'd like to modify?`,
          timestamp: new Date(),
        };
        setChatMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || "Failed to process edit request");
      }
    } catch (error: any) {
      console.error("Edit error:", error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `❌ Sorry, I couldn't process that request. ${error.message || "Please try again."}`,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    if (!confirm("Are you sure you want to delete this trip?")) return;

    try {
      await deleteItinerary(tripId, user.uid);
      setTrips((prev) => prev.filter((t) => t.id !== tripId));
      if (selectedTrip?.id === tripId) {
        setSelectedTrip(null);
      }
    } catch (error) {
      console.error("Error deleting trip:", error);
      alert("Failed to delete trip. Please try again.");
    }
  };

  const handleViewTrip = (trip: ItineraryClient) => {
    // Store trip in localStorage for the itinerary page
    localStorage.setItem("currentTrip", JSON.stringify(trip));
    router.push("/itinerary");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-blue-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your trips...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-blue-50">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (selectedTrip) {
                  setSelectedTrip(null);
                  setSelectedPlace(null);
                  setShowChat(false);
                  setChatMessages([]);
                } else {
                  router.push("/");
                }
              }}
              className="text-violet-600 hover:text-violet-700"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">
                {selectedTrip ? selectedTrip.destination : "My Travel Gallery"}
              </h1>
              <p className="text-sm text-gray-500">
                {selectedTrip ? "Edit your itinerary" : `Welcome back, ${user.displayName || user.email}`}
              </p>
            </div>
          </div>
          <Link
            href="/itinerary-generation"
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Trip
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {trips.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <MapPin className="w-12 h-12 text-violet-600" />
            </div>
            <h2 className="text-3xl font-bold mb-4">No Trips Yet</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Start planning your first adventure! Create a personalized
              itinerary based on your interests.
            </p>
            <Link
              href="/itinerary-generation"
              className="inline-flex items-center gap-2 px-8 py-4 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-700 transition-colors shadow-lg"
            >
              <Sparkles className="w-5 h-5" />
              Create Your First Trip
            </Link>
          </div>
        ) : selectedTrip ? (
          /* ===== Trip Detail View (full-width, no trip cards) ===== */
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(selectedTrip.startDate, selectedTrip.timezone)} - {formatDate(selectedTrip.endDate, selectedTrip.timezone)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Compass className="w-4 h-4" />
                    {selectedTrip.days?.reduce((sum, day) => sum + (day.activities?.length || 0), 0) || 0} activities
                  </span>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Itinerary</h2>
              </div>
              <button
                onClick={() => handleViewTrip(selectedTrip)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-600 rounded-lg font-medium hover:bg-blue-200 transition-colors"
              >
                <MapPin className="w-4 h-4" />
                Full Map View
              </button>
            </div>

            <div className="p-6 space-y-6">
              {selectedTrip.days?.map((day, dayIndex) => (
                <div
                  key={day.id}
                  className="border border-gray-100 rounded-xl overflow-hidden"
                >
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
                    <h4 className="font-semibold">
                      Day {day.dayNumber}: {formatFullDate(day.date, selectedTrip.timezone)}
                    </h4>
                    {day.notes && (
                      <p className="text-sm text-gray-500 mt-1">{day.notes}</p>
                    )}
                  </div>

                  <div className="divide-y divide-gray-100">
                    {day.activities
                      ?.sort((a, b) => new Date(a.timeStart).getTime() - new Date(b.timeStart).getTime())
                      .map((activity, activityIndex) => (
                        <div
                          key={activity.id}
                          onClick={() => handleSelectPlace(dayIndex, activityIndex)}
                          className={`p-4 hover:bg-violet-50 cursor-pointer transition-colors ${
                            selectedPlace?.dayIndex === dayIndex &&
                            selectedPlace?.activityIndex === activityIndex
                              ? "bg-violet-50 border-l-4 border-violet-500"
                              : ""
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getCategoryColor(activity.tags)}`}
                            >
                              {getCategoryIcon(activity.tags)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h5 className="font-medium truncate">{activity.name}</h5>
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded flex-shrink-0">
                                  {formatTime(activity.timeStart)} - {formatTime(activity.timeEnd)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500 truncate mt-1">{activity.locationName}</p>
                              {activity.description && activity.description !== "N/A" && (
                                <p className="text-sm text-gray-600 mt-2 line-clamp-2">{activity.description}</p>
                              )}
                              {activity.tags && activity.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {activity.tags.map((tag, idx) => (
                                    <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{tag}</span>
                                  ))}
                                </div>
                              )}
                              {activity.url && (
                                <a
                                  href={activity.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                                >
                                  More info →
                                </a>
                              )}
                            </div>
                            <Edit3 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* ===== Trip Cards Grid (no trip selected) ===== */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <div
                key={trip.id}
                onClick={() => { setSelectedTrip(trip); setSelectedPlace(null); setShowChat(false); setChatMessages([]); }}
                className="bg-white rounded-2xl shadow-sm border-2 border-gray-100 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-violet-200"
              >
                <div className="relative h-40 overflow-hidden">
                  {cityImages[trip.destination] ? (
                    <img
                      src={cityImages[trip.destination]}
                      alt={trip.destination}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-violet-600 to-blue-600 flex items-center justify-center">
                      {loadingImages[trip.destination] ? (
                        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <MapPin className="w-10 h-10 text-white/60" />
                      )}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <div className="flex items-center gap-2 text-white/90 text-sm mb-1">
                      <MapPin className="w-4 h-4" />
                      {trip.destination}
                    </div>
                    <h3 className="text-xl font-bold truncate drop-shadow-lg">{trip.destination} Adventure</h3>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-2 text-gray-600 mb-3">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">
                      {formatDate(trip.startDate, trip.timezone)} - {formatDate(trip.endDate, trip.timezone)}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {trip.days?.length || 0} days
                    </span>
                    <span className="flex items-center gap-1">
                      <Compass className="w-4 h-4" />
                      {trip.days?.reduce((sum, day) => sum + (day.activities?.length || 0), 0) || 0} activities
                    </span>
                  </div>

                  {trip.interests && trip.interests.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {trip.interests.slice(0, 3).map((interest, idx) => (
                        <span key={idx} className="px-2 py-1 bg-violet-50 text-violet-600 rounded-full text-xs font-medium">{interest}</span>
                      ))}
                      {trip.interests.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-xs">+{trip.interests.length - 3}</span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                    <span className="text-sm text-violet-600 font-medium flex items-center gap-1">
                      View Details <ChevronRight className="w-4 h-4" />
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (trip.id) handleDeleteTrip(trip.id);
                      }}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating AI Chat — 3 states: FAB / Minimized pill / Expanded panel */}
      {selectedTrip && !showChat && (
        /* ── FAB: initial entry point ── */
        <button
          onClick={() => { handleOpenChat(); setChatMinimized(false); }}
          className="fixed bottom-6 right-6 z-40 group flex items-center gap-3 pl-5 pr-6 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-full shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40 hover:scale-105 active:scale-95 transition-all duration-200"
        >
          <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          <span className="text-sm font-semibold">Modify with AI</span>
        </button>
      )}

      {showChat && chatMinimized && (
        /* ── Minimized pill ── */
        <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2">
          <button
            onClick={() => setChatMinimized(false)}
            className="group flex items-center gap-3 pl-4 pr-5 py-3 bg-white border border-violet-200 rounded-2xl shadow-lg hover:shadow-xl hover:border-violet-300 transition-all duration-200 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-800">Wanna modify?</p>
              <p className="text-xs text-gray-400">Click to expand AI assistant</p>
            </div>
            <ChevronUp className="w-4 h-4 text-gray-400 group-hover:text-violet-500 transition-colors ml-1" />
          </button>
          <button
            onClick={() => { setShowChat(false); setChatMinimized(false); }}
            className="w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 flex items-center justify-center transition-colors"
          >
            <X className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </div>
      )}

      {showChat && !chatMinimized && (
        /* ── Expanded floating chat panel (no backdrop) ── */
        <div className="fixed bottom-6 right-6 z-40 w-[400px] max-h-[520px] bg-white rounded-2xl shadow-2xl shadow-black/15 flex flex-col overflow-hidden border border-violet-100 animate-slide-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm leading-tight">AI Assistant</h4>
                <p className="text-white/70 text-[11px] leading-tight">
                  {selectedPlace
                    ? `Editing: ${selectedTrip?.days?.[selectedPlace.dayIndex]?.activities?.[selectedPlace.activityIndex]?.name || "activity"}`
                    : "General trip modification"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setChatMinimized(true)}
                className="w-7 h-7 rounded-md bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
                title="Minimize"
              >
                <Minus className="w-3.5 h-3.5 text-white" />
              </button>
              <button
                onClick={() => { setShowChat(false); setChatMinimized(false); }}
                className="w-7 h-7 rounded-md bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
                title="Close"
              >
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50/50">
            {chatMessages.length === 0 && (
              <div className="text-center py-6 text-gray-400">
                <MessageCircle className="w-9 h-9 mx-auto mb-2 opacity-40" />
                <p className="text-xs">Select an activity or ask me anything about your trip</p>
              </div>
            )}
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 ${
                    message.role === "user"
                      ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm"
                      : "bg-white text-gray-800 shadow-sm border border-gray-100"
                  }`}
                >
                  <p className="text-sm whitespace-pre-line leading-relaxed">
                    {message.content}
                  </p>
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl px-4 py-2.5 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
                    <span className="text-xs text-gray-400">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-2.5 border-t border-gray-100 bg-white flex-shrink-0">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="What would you like to change?"
                className="flex-1 px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent focus:bg-white transition-all outline-none"
              />
              <button
                onClick={handleSendMessage}
                disabled={!chatInput.trim() || chatLoading}
                className="w-9 h-9 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 disabled:hover:shadow-none transition-all flex items-center justify-center flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
