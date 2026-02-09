"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

export default function TestMapPage() {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);

  const mockTripData = {
    userId: "test-user-123",
    cityName: "Los Angeles",
    startDate: "2025-12-20T00:00:00Z",
    endDate: "2025-12-21T23:59:59Z",
    itinerary: [
      {
        id: "day-1",
        day: 1,
        date: "2025-12-20T00:00:00Z",
        notes: "Day 1: 5 activities planned",
        places: [
          {
            id: "griffith-observatory",
            name: "Griffith Observatory",
            address: "2800 E Observatory Rd, Los Angeles, CA 90027",
            latitude: 34.1184,
            longitude: -118.3004,
            category: "attraction",
            description: "Iconic observatory with stunning views of LA and the Hollywood Sign. Perfect for astronomy lovers!",
            startTime: "09:00",
            endTime: "11:00",
          },
          {
            id: "hollywood-sign",
            name: "Hollywood Sign Hike",
            address: "Los Angeles, CA 90068",
            latitude: 34.1341,
            longitude: -118.3215,
            category: "attraction",
            description: "Scenic hiking trail with amazing views of the iconic Hollywood sign.",
            startTime: "11:30",
            endTime: "13:00",
          },
          {
            id: "grand-central-market",
            name: "Grand Central Market",
            address: "317 S Broadway, Los Angeles, CA 90013",
            latitude: 34.0507,
            longitude: -118.2487,
            category: "restaurant",
            description: "Historic downtown food hall with diverse culinary offerings from tacos to ramen.",
            startTime: "13:30",
            endTime: "15:00",
          },
          {
            id: "the-broad",
            name: "The Broad Museum",
            address: "221 S Grand Ave, Los Angeles, CA 90012",
            latitude: 34.0545,
            longitude: -118.2505,
            category: "attraction",
            description: "Contemporary art museum featuring works by Andy Warhol, Jeff Koons, and more.",
            startTime: "15:30",
            endTime: "17:30",
          },
          {
            id: "perch-la",
            name: "Perch LA",
            address: "448 S Hill St, Los Angeles, CA 90013",
            latitude: 34.0496,
            longitude: -118.2514,
            category: "restaurant",
            description: "Rooftop French bistro with stunning city views, perfect for sunset dining.",
            startTime: "18:00",
            endTime: "20:00",
          },
        ],
      },
      {
        id: "day-2",
        day: 2,
        date: "2025-12-21T00:00:00Z",
        notes: "Day 2: 4 activities planned",
        places: [
          {
            id: "santa-monica-pier",
            name: "Santa Monica Pier",
            address: "200 Santa Monica Pier, Santa Monica, CA 90401",
            latitude: 34.0094,
            longitude: -118.4977,
            category: "attraction",
            description: "Iconic pier with amusement park rides, arcade games, and ocean views.",
            startTime: "09:00",
            endTime: "11:30",
          },
          {
            id: "venice-beach",
            name: "Venice Beach Boardwalk",
            address: "1800 Ocean Front Walk, Venice, CA 90291",
            latitude: 33.9850,
            longitude: -118.4695,
            category: "attraction",
            description: "Vibrant boardwalk with street performers, shops, and the famous Muscle Beach.",
            startTime: "12:00",
            endTime: "14:00",
          },
          {
            id: "gjelina",
            name: "Gjelina",
            address: "1429 Abbot Kinney Blvd, Venice, CA 90291",
            latitude: 33.9945,
            longitude: -118.4672,
            category: "restaurant",
            description: "Trendy restaurant known for wood-fired pizzas and California-Mediterranean cuisine.",
            startTime: "14:30",
            endTime: "16:00",
          },
          {
            id: "getty-center",
            name: "The Getty Center",
            address: "1200 Getty Center Dr, Los Angeles, CA 90049",
            latitude: 34.0780,
            longitude: -118.4741,
            category: "attraction",
            description: "World-class art museum with impressive architecture and beautiful gardens.",
            startTime: "16:30",
            endTime: "19:00",
          },
        ],
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const loadMockData = () => {
    localStorage.setItem("currentTrip", JSON.stringify(mockTripData));
    setLoaded(true);
    setTimeout(() => {
      router.push("/itinerary");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-blue-50 flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Test Map Feature
            </h1>
            <p className="text-gray-600">
              Load mock itinerary data to test the beautiful map visualization
            </p>
          </div>

          <div className="bg-gradient-to-r from-violet-50 to-blue-50 rounded-xl p-6 mb-6">
            <h2 className="font-semibold text-gray-900 mb-3">
              Mock Trip Details:
            </h2>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>📍 <strong>City:</strong> Los Angeles, CA</li>
              <li>📅 <strong>Duration:</strong> 2-day weekend trip</li>
              <li>🗺️ <strong>Day 1:</strong> 5 locations (Griffith Observatory, Hollywood Sign, Grand Central Market, The Broad, Perch LA)</li>
              <li>🗺️ <strong>Day 2:</strong> 4 locations (Santa Monica Pier, Venice Beach, Gjelina, Getty Center)</li>
              <li>✨ <strong>Features:</strong> Red markers, connecting paths, interactive popups</li>
            </ul>
          </div>

          {loaded ? (
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-violet-600 font-semibold">
                Loading itinerary with maps...
              </p>
            </div>
          ) : (
            <button
              onClick={loadMockData}
              className="w-full px-6 py-4 bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-violet-700 hover:to-blue-700 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Load Mock Data & View Map
            </button>
          )}

          <p className="text-xs text-gray-500 text-center mt-6">
            This will store mock trip data in localStorage and redirect you to the itinerary page
          </p>
        </div>
      </div>
    </div>
  );
}
