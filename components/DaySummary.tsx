"use client";

import { Clock, DollarSign, Footprints, TrendingUp } from "lucide-react";

interface Place {
  startTime?: string;
  endTime?: string;
  category: string;
}

interface DaySummaryProps {
  places: Place[];
  dayNumber: number;
}

export default function DaySummary({ places, dayNumber }: DaySummaryProps) {
  // Calculate total time
  const calculateTotalTime = () => {
    if (!places.length || !places[0]?.startTime || !places[places.length - 1]?.endTime) {
      return null;
    }
    
    const startTime = places[0].startTime!;
    const endTime = places[places.length - 1].endTime!;
    
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);
    
    const totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return { hours, minutes, startTime, endTime };
  };

  // Estimate budget (rough estimates)
  const estimateBudget = () => {
    let total = 0;
    let breakdown = { restaurants: 0, hotels: 0, attractions: 0 };
    
    places.forEach((place) => {
      if (place.category === "restaurant") {
        const cost = 25; // Average meal cost
        total += cost;
        breakdown.restaurants += cost;
      } else if (place.category === "hotel") {
        const cost = 150; // Average hotel per night
        total += cost;
        breakdown.hotels += cost;
      } else {
        const cost = 20; // Average attraction entry
        total += cost;
        breakdown.attractions += cost;
      }
    });
    
    return { total, breakdown };
  };

  const timeInfo = calculateTotalTime();
  const budget = estimateBudget();

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-6 shadow-sm border border-indigo-100">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-indigo-600" />
        Day {dayNumber} Summary
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Activities Count */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-100 rounded-lg">
              <Footprints className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">Activities</p>
              <p className="text-2xl font-bold text-gray-900">{places.length}</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {places.filter(p => p.category === "restaurant").length} meals •{" "}
            {places.filter(p => p.category === "attraction").length} attractions
          </p>
        </div>

        {/* Time Schedule */}
        {timeInfo && (
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium">Duration</p>
                <p className="text-2xl font-bold text-gray-900">
                  {timeInfo.hours}h {timeInfo.minutes}m
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {timeInfo.startTime} - {timeInfo.endTime}
            </p>
          </div>
        )}

        {/* Budget Estimate */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">Est. Budget</p>
              <p className="text-2xl font-bold text-gray-900">
                ${budget.total}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Per person estimate
          </p>
        </div>
      </div>

      {/* Budget Breakdown */}
      {budget.total > 0 && (
        <div className="mt-4 bg-white rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-700 mb-2">Budget Breakdown:</p>
          <div className="flex flex-wrap gap-2">
            {budget.breakdown.restaurants > 0 && (
              <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                🍴 Dining: ${budget.breakdown.restaurants}
              </span>
            )}
            {budget.breakdown.hotels > 0 && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                🏨 Lodging: ${budget.breakdown.hotels}
              </span>
            )}
            {budget.breakdown.attractions > 0 && (
              <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                🎯 Attractions: ${budget.breakdown.attractions}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
