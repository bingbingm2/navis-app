"use client";

import { Car, Footprints, Clock, ChevronDown } from "lucide-react";
import { useState } from "react";

interface TransportInfoProps {
  fromPlace: string;
  toPlace: string;
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
  timeOfDay: string;
}

// Calculate distance using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Estimate time based on mode and traffic
function estimateTime(distance: number, mode: "walk" | "drive", timeOfDay: string): number {
  if (mode === "walk") {
    return (distance / 3) * 60; // 3 mph
  } else {
    let avgSpeed = 25;
    const hour = parseInt(timeOfDay.split(":")[0]);
    if ((hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 18)) {
      avgSpeed = 15; // Rush hour
    } else if (hour >= 11 && hour <= 14) {
      avgSpeed = 20; // Lunch time
    }
    return (distance / avgSpeed) * 60;
  }
}

export default function TransportInfo({
  fromPlace,
  toPlace,
  fromLat,
  fromLng,
  toLat,
  toLng,
  timeOfDay,
}: TransportInfoProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const distance = calculateDistance(fromLat, fromLng, toLat, toLng);
  const walkTime = estimateTime(distance, "walk", timeOfDay);
  const driveTime = estimateTime(distance, "drive", timeOfDay);
  const recommendedMode = distance < 0.5 ? "walk" : "drive";
  const recommendedTime = recommendedMode === "walk" ? walkTime : driveTime;
  const RecommendedIcon = recommendedMode === "walk" ? Footprints : Car;

  return (
    <div className="relative py-2">
      {/* Connecting Line */}
      <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-violet-200 via-blue-200 to-violet-200"></div>

      {/* Compact Transport Card */}
      <div className="relative ml-12 mr-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-left bg-gradient-to-r from-violet-50 to-blue-50 rounded-lg p-3 hover:shadow-sm transition-all duration-200 border border-violet-100 group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-white rounded-md shadow-sm">
                <RecommendedIcon className="w-4 h-4 text-violet-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-700">
                    {distance.toFixed(1)} mi
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    ~{Math.ceil(recommendedTime)} min
                  </span>
                  <span className="text-xs text-violet-600 font-medium">
                    {recommendedMode === "walk" ? "Walk" : "Drive"}
                  </span>
                </div>
              </div>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </div>
        </button>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-2 bg-white rounded-lg border border-gray-200 p-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-2 gap-3">
              {/* Walk */}
              <div
                className={`rounded-lg p-3 border ${
                  recommendedMode === "walk"
                    ? "border-violet-300 bg-violet-50"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Footprints className="w-4 h-4 text-violet-600" />
                  <span className="font-semibold text-sm">Walk</span>
                </div>
                <div className="text-xs text-gray-600">{Math.ceil(walkTime)} min</div>
                {recommendedMode === "walk" && (
                  <div className="text-xs text-violet-600 mt-1 font-medium">✨ Best option</div>
                )}
              </div>

              {/* Drive */}
              <div
                className={`rounded-lg p-3 border ${
                  recommendedMode === "drive"
                    ? "border-blue-300 bg-blue-50"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Car className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-sm">Drive</span>
                </div>
                <div className="text-xs text-gray-600">{Math.ceil(driveTime)} min</div>
                {recommendedMode === "drive" && (
                  <div className="text-xs text-blue-600 mt-1 font-medium">✨ Best option</div>
                )}
              </div>
            </div>

            {distance > 1 && (
              <div className="mt-3 text-xs text-amber-700 bg-amber-50 rounded-md p-2 border border-amber-100">
                💡 Consider ride-share or public transit
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
