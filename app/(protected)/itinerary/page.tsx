"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Map,
  Calendar,
  Clock,
  MapPin,
  Utensils,
  Hotel,
  Compass,
  ChevronLeft,
  ChevronRight,
  Mail,
  Send,
  Loader2,
  CheckCircle,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Quicksand } from "next/font/google";
import ClientMap from "@/components/ClientMap";
import TransportInfo from "@/components/TransportInfo";
import DaySummary from "@/components/DaySummary";
import TravelTips from "@/components/TravelTips";
import AnimatedEventCard from "@/components/AnimatedEventCard";

const quicksand = Quicksand({ 
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
import { ItineraryClient } from "@/lib/itineraryService";

export default function ItineraryPage() {
  const router = useRouter();
  const [tripData, setTripData] = useState<ItineraryClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [selectedEventIndex, setSelectedEventIndex] = useState<number | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState("");

  // Memoize places so the map doesn't rebuild on every render (e.g. when selectedEventIndex changes)
  const currentDayPlaces = useMemo(() => {
    const activities = tripData?.days?.[currentDayIndex]?.activities;
    if (!activities) return [];
    return activities.map((activity: any) => ({
      id: activity.id || '',
      name: activity.name,
      address: activity.locationName,
      latitude: activity.locationGeo?.latitude || 0,
      longitude: activity.locationGeo?.longitude || 0,
      category: activity.tags?.[0]?.toLowerCase() || 'attraction',
      description: activity.description,
      startTime: activity.timeStart && activity.timeStart.includes("T") ? activity.timeStart.split("T")[1]?.substring(0, 5) : undefined,
      endTime: activity.timeEnd && activity.timeEnd.includes("T") ? activity.timeEnd.split("T")[1]?.substring(0, 5) : undefined,
    }));
  }, [tripData?.days, currentDayIndex]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const storedTrip = localStorage.getItem("currentTrip");
    if (storedTrip) {
      try {
        const parsedData = JSON.parse(storedTrip);
        setTripData(parsedData);
        if (parsedData.userId) {
          setUserId(parsedData.userId);
        }
      } catch (e) {
        console.error("Failed to parse trip data", e);
      }
    }
    setLoading(false);
  }, []);

  const handleSendEmail = async () => {
    if (!emailInput.trim() || !tripData) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setEmailSending(true);
    setEmailError("");

    try {
      const response = await fetch("/api/send-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailInput,
          itinerary: tripData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setEmailSent(true);
        setTimeout(() => {
          setShowEmailModal(false);
          setEmailSent(false);
          setEmailInput("");
        }, 2500);
      } else {
        setEmailError(data.error || "Failed to send email. Please try again.");
      }
    } catch (error: any) {
      console.error("Email send error:", error);
      setEmailError("Something went wrong. Please try again.");
    } finally {
      setEmailSending(false);
    }
  };

  // Updated to work with tags array
  const getCategoryIcon = (tags: string[]) => {
    const tag = tags[0]?.toLowerCase() || "";
    if (tag.includes("restaurant") || tag.includes("food")) {
      return <Utensils className="w-5 h-5" />;
    }
    if (tag.includes("hotel") || tag.includes("accommodation")) {
      return <Hotel className="w-5 h-5" />;
    }
    return <Compass className="w-5 h-5" />;
  };

  const getCategoryColor = (tags: string[]) => {
    const tag = tags[0]?.toLowerCase() || "";
    if (tag.includes("restaurant") || tag.includes("food")) {
      return "bg-orange-100 text-orange-700 border-orange-200";
    }
    if (tag.includes("hotel") || tag.includes("accommodation")) {
      return "bg-blue-100 text-blue-700 border-blue-200";
    }
    return "bg-violet-100 text-violet-700 border-violet-200";
  };

  // Parse date string without timezone conversion
  // Input format: "2026-01-17T00:00:00" or "2026-01-17"
  const parseLocalDate = (dateString: string) => {
    // Extract date parts to avoid timezone conversion
    const datePart = dateString.split("T")[0];
    const [year, month, day] = datePart.split("-").map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed
  };

  const formatDate = (dateString: string) => {
    const date = parseLocalDate(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const formatFullDate = (dateString: string) => {
    const date = parseLocalDate(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    // For time, parse the full datetime but extract time components directly
    // Input format: "2026-01-17T19:00:00"
    const timePart = dateString.includes("T") ? dateString.split("T")[1] : "00:00:00";
    const [hours, minutes] = timePart.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHour = hours % 12 || 12;
    return `${displayHour}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  const goToNextDay = () => {
    if (tripData && currentDayIndex < tripData.days!.length - 1) {
      setCurrentDayIndex(currentDayIndex + 1);
      setSelectedEventIndex(null);
    }
  };

  const goToPreviousDay = () => {
    if (currentDayIndex > 0) {
      setCurrentDayIndex(currentDayIndex - 1);
      setSelectedEventIndex(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your itinerary...</p>
        </div>
      </div>
    );
  }

  if (!tripData || !tripData.days || tripData.days.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Compass className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            No Itinerary Found
          </h2>
          <p className="text-gray-600 mb-6">
            It looks like you haven't generated a trip yet. Let's get you
            started!
          </p>
          <button
            onClick={() => router.push("/itinerary-generation")}
            className="px-6 py-3 bg-violet-600 text-white rounded-lg font-semibold hover:bg-violet-700 transition-colors"
          >
            Create New Trip
          </button>
        </div>
      </div>
    );
  }

  const currentDay = tripData.days[currentDayIndex];
  const totalDays = tripData.days.length;

  // Helper to extract time in HH:MM format from datetime string
  const extractTime24h = (dateString: string | undefined): string | undefined => {
    if (!dateString) return undefined;
    const timePart = dateString.includes("T") ? dateString.split("T")[1] : null;
    if (!timePart) return undefined;
    return timePart.substring(0, 5); // "19:00:00" -> "19:00"
  };

  // Helper to convert activities to places format for components
  const activitiesToPlaces = (activities: any[]) => {
    if (!activities) return [];
    return activities.map((activity) => ({
      id: activity.id || '',
      name: activity.name,
      address: activity.locationName,
      latitude: activity.locationGeo?.latitude || 0,
      longitude: activity.locationGeo?.longitude || 0,
      category: activity.tags?.[0]?.toLowerCase() || 'attraction',
      description: activity.description,
      startTime: extractTime24h(activity.timeStart),
      endTime: extractTime24h(activity.timeEnd),
    }));
  };

  return (
    <div className={`h-screen overflow-hidden ${quicksand.className}`}>
      {/* Full-screen split layout */}
      <div className="flex h-full">
        {/* Left Panel - Scrollable Itinerary */}
        <div className="w-full lg:w-[45%] xl:w-[40%] h-full overflow-y-auto bg-white border-r border-gray-200">
          {/* Trip Header - Compact */}
          <div className="sticky top-0 z-10 bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push("/gallery")}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold">
                    {tripData.destination}
                  </h1>
                  <div className="flex items-center gap-4 text-white/80 text-sm mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(tripData.startDate)} - {formatDate(tripData.endDate)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Compass className="w-4 h-4" />
                      {tripData.days.reduce((sum, day) => sum + (day.activities?.length || 0), 0)} Activities
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Day Navigation - Compact tabs */}
          <div className="sticky top-[76px] z-10 bg-white border-b border-gray-100 px-4 py-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {tripData.days.map((day, index) => (
                <button
                  key={index}
                  onClick={() => { setCurrentDayIndex(index); setSelectedEventIndex(null); }}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    index === currentDayIndex
                      ? "bg-violet-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Day {index + 1}
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {formatFullDate(currentDay.date)}
            </p>
          </div>

          {/* Itinerary Content */}
          <div className="p-4 space-y-4">
            {/* Day Summary */}
            {currentDay.activities && currentDay.activities.length > 0 && (
              <DaySummary 
                places={currentDayPlaces} 
                dayNumber={currentDay.dayNumber} 
              />
            )}

            {/* Activity Cards */}
            <div className="space-y-3">
              {currentDay.activities?.map((activity, index) => (
                <React.Fragment key={activity.id || index}>
                  <AnimatedEventCard delay={index * 80}>
                    <div
                      onClick={() => setSelectedEventIndex(index)}
                      className={`rounded-xl p-4 transition-all border cursor-pointer relative ${
                        selectedEventIndex === index
                          ? "bg-violet-50 border-violet-300 ring-2 ring-violet-200 shadow-md"
                          : "bg-gray-50 border-gray-100 hover:bg-gray-100"
                      }`}
                    >
                      {/* Number badge */}
                      <div className="absolute -left-2 -top-2 w-7 h-7 bg-violet-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md">
                        {index + 1}
                      </div>

                      <div className="flex gap-3 ml-4">
                        <div className="flex-shrink-0">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${getCategoryColor(activity.tags)}`}
                          >
                            {getCategoryIcon(activity.tags)}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {activity.name}
                          </h3>
                          <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{activity.locationName}</span>
                          </p>
                          
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full border border-gray-200 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTime(activity.timeStart)} - {formatTime(activity.timeEnd)}
                            </span>
                            {activity.tags.slice(0, 2).map((tag, idx) => (
                              <span
                                key={idx}
                                className={`text-xs px-2 py-1 rounded-full ${getCategoryColor([tag])}`}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>

                          {activity.description && activity.description !== "N/A" && (
                            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                              {activity.description}
                            </p>
                          )}

                          {activity.url && (
                            <a
                              href={activity.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-violet-600 hover:underline mt-2 inline-block font-medium"
                            >
                              View More →
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </AnimatedEventCard>

                  {/* Transportation between locations */}
                  {index < currentDay.activities!.length - 1 && currentDay.activities![index + 1] && (
                    <TransportInfo
                      fromPlace={activity.name}
                      toPlace={currentDay.activities![index + 1].name}
                      fromLat={activity.locationGeo?.latitude || 0}
                      fromLng={activity.locationGeo?.longitude || 0}
                      toLat={currentDay.activities![index + 1].locationGeo?.latitude || 0}
                      toLng={currentDay.activities![index + 1].locationGeo?.longitude || 0}
                      timeOfDay={extractTime24h(activity.timeEnd) || '12:00'}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Travel Tips */}
            <TravelTips 
              cityName={tripData.destination} 
              dayNumber={currentDay.dayNumber} 
            />

            {/* Action Card */}
            <div className="bg-gradient-to-r from-violet-50 to-blue-50 rounded-xl p-4 border border-violet-100">
              <h3 className="font-semibold text-gray-900 mb-2">
                📧 Get this itinerary in your inbox
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Receive a beautifully formatted PDF of your trip plan.
              </p>
              <button
                onClick={() => { setShowEmailModal(true); setEmailSent(false); setEmailError(""); }}
                className="w-full px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition-colors flex items-center justify-center gap-2"
              >
                <Mail className="w-4 h-4" />
                Send PDF to Email
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel - Full-height Map */}
        <div className="hidden lg:block flex-1 h-full relative">
          {isMounted && currentDay.activities && currentDay.activities.length > 0 && (
            <div className="absolute inset-0">
              <ClientMap 
                places={currentDayPlaces} 
                dayNumber={currentDay.dayNumber}
                fullHeight={true}
                selectedPlaceIndex={selectedEventIndex}
              />
            </div>
          )}
        </div>
      </div>

      {/* Email PDF Modal */}
      {showEmailModal && tripData && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            {emailSent ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Sent!</h3>
                <p className="text-gray-500 text-sm">Your itinerary PDF has been sent to <strong>{emailInput}</strong></p>
              </div>
            ) : (
              <>
                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <Mail className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-lg">Email Itinerary</h3>
                        <p className="text-white/70 text-sm">{tripData.destination}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => { setShowEmailModal(false); setEmailError(""); }}
                      className="w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <p className="text-gray-600 text-sm mb-4">
                    We&apos;ll generate a beautifully formatted PDF of your trip and send it to your email.
                  </p>

                  <label className="block text-sm font-medium text-gray-700 mb-2">Email address</label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => { setEmailInput(e.target.value); setEmailError(""); }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSendEmail();
                    }}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
                    autoFocus
                  />

                  {emailError && (
                    <p className="text-red-500 text-sm mt-2">{emailError}</p>
                  )}

                  <div className="flex gap-3 mt-5">
                    <button
                      onClick={() => { setShowEmailModal(false); setEmailError(""); }}
                      className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSendEmail}
                      disabled={emailSending || !emailInput.trim()}
                      className="flex-1 px-4 py-3 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 disabled:opacity-50 disabled:hover:bg-violet-600 transition-colors flex items-center justify-center gap-2"
                    >
                      {emailSending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send PDF
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Mobile: Map Toggle Button */}
      <div className="lg:hidden fixed bottom-6 right-6 z-50">
        <button
          onClick={() => {/* Could add mobile map modal */}}
          className="w-14 h-14 bg-violet-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-violet-700 transition-colors"
        >
          <Map className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
