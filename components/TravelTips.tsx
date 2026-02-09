"use client";

import { AlertCircle, Lightbulb, Info, ChevronDown } from "lucide-react";
import { useState } from "react";

interface TravelTipsProps {
  cityName: string;
  dayNumber: number;
}

export default function TravelTips({ cityName, dayNumber }: TravelTipsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // City-specific tips (you can expand this)
  const cityTips: Record<string, string[]> = {
    "Los Angeles": [
      "Traffic can be heavy 7-9 AM & 4-7 PM - plan accordingly",
      "Parking can be expensive ($10-30/day) - consider ride-shares",
      "Weather is usually sunny - bring sunscreen & sunglasses",
      "Many attractions require advance booking",
    ],
    "San Francisco": [
      "Layer your clothing - weather changes throughout the day",
      "Cable cars get crowded - go early morning or late afternoon",
      "Parking is limited - public transit (BART/Muni) is recommended",
      "Many hills - comfortable walking shoes essential",
    ],
    "New York": [
      "Use subway for fastest travel - get a MetroCard",
      "Walk on the right, stand on the right on escalators",
      "Tipping is expected: 18-20% at restaurants",
      "Book popular attractions (Statue of Liberty, etc.) in advance",
    ],
  };

  const tips = cityTips[cityName] || [
    "Check attraction opening hours before visiting",
    "Book restaurants in advance for popular spots",
    "Keep essentials (phone, wallet, water) easily accessible",
    "Stay hydrated and take breaks between activities",
  ];

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-amber-100/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-600" />
          <h3 className="text-sm font-bold text-gray-900">Local Tips & Reminders</h3>
          <span className="text-xs text-amber-600 font-medium">({tips.length} tips)</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-amber-600 transition-transform duration-200 ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
        {tips.map((tip, index) => (
          <div
            key={index}
            className="flex items-start gap-3 bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <Info className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed font-medium">{tip}</p>
          </div>
        ))}
        
        {/* General reminder */}
        <div className="mt-2 bg-white rounded-xl p-4 border-l-4 border-amber-500">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-1">
              Important Reminders
            </p>
            <ul className="text-xs text-gray-600 space-y-1 ml-4 list-disc">
              <li>Verify opening hours on the day of your visit</li>
              <li>Bring ID for age-restricted venues</li>
              <li>Keep digital copies of reservations</li>
              <li>Have emergency contacts saved</li>
            </ul>
          </div>
        </div>
        </div>
        </div>
      )}
    </div>
  );
}
