"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Play,
  MapPin,
  Calendar,
  Clock,
  Heart,
  Share2,
  Lock,
  Sparkles,
  Film,
} from "lucide-react";
import { ref, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

const EXAMPLE_ITINERARIES = [
  {
    id: 1,
    city: "San Francisco, CA",
    title: "Tech & Culture Weekend",
    duration: "2 days",
    interests: ["Tech Meetups", "Art Galleries", "Hiking"],
    image:
      "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=300&fit=crop",
    highlights: ["Golden Gate Bridge", "SFMOMA", "Dolores Park"],
  },
  {
    id: 2,
    city: "New York, NY",
    title: "Urban Adventure Explorer",
    duration: "2 days",
    interests: ["Museums", "Live Music", "Food Tours"],
    image:
      "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&h=300&fit=crop",
    highlights: ["Central Park", "Broadway Show", "Brooklyn Bridge"],
  },
  {
    id: 3,
    city: "Austin, TX",
    title: "Music & BBQ Trail",
    duration: "2 days",
    interests: ["Live Music", "Food", "Nightlife"],
    image:
      "https://images.unsplash.com/photo-1531218150217-54595bc2b934?w=400&h=300&fit=crop",
    highlights: ["6th Street", "Zilker Park", "Franklin BBQ"],
  },
  {
    id: 4,
    city: "Seattle, WA",
    title: "Coffee & Nature Escape",
    duration: "2 days",
    interests: ["Coffee", "Hiking", "Tech"],
    image:
      "https://images.unsplash.com/photo-1502175353174-a7a70e73b362?w=400&h=300&fit=crop",
    highlights: ["Pike Place Market", "Mount Rainier", "Amazon Spheres"],
  },
  {
    id: 5,
    city: "Miami, FL",
    title: "Beach & Art Deco",
    duration: "2 days",
    interests: ["Beach", "Art", "Nightlife"],
    image:
      "https://images.unsplash.com/photo-1506966953602-c20cc11f75e3?w=400&h=300&fit=crop",
    highlights: ["South Beach", "Wynwood Walls", "Little Havana"],
  },
  {
    id: 6,
    city: "Chicago, IL",
    title: "Architecture & Jazz",
    duration: "2 days",
    interests: ["Architecture", "Jazz", "Food"],
    image:
      "https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=400&h=300&fit=crop",
    highlights: ["Millennium Park", "Architecture Tour", "Deep Dish Pizza"],
  },
];

export default function PublicGallery() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        setVideoLoading(true);
        const videoRef = ref(storage, "demos/naviya-demo.mp4");
        const url = await getDownloadURL(videoRef);
        setVideoUrl(url);
        setVideoError(null);
      } catch (error) {
        console.error("Error fetching video:", error);
        setVideoError("Video demo coming soon!");
      } finally {
        setVideoLoading(false);
      }
    };
    fetchVideo();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-blue-50">
      {/* Header */}
      <div className="border-b bg-white/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Link href="/" className="text-violet-600 hover:text-violet-700">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold">Travel Gallery</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Login Reminder Banner */}
        <div className="mb-12 bg-gradient-to-r from-violet-600 to-blue-600 rounded-2xl p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                <Sparkles className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-1">
                  Create Your Own Travel Gallery
                </h2>
                <p className="text-violet-100">
                  Log in or create an account to save your personalized
                  itineraries and videos
                </p>
              </div>
            </div>
            <Link
              href="/login"
              className="flex items-center gap-2 px-6 py-3 bg-white text-violet-600 rounded-xl font-semibold hover:bg-violet-50 transition-colors shadow-lg"
            >
              <Lock className="w-5 h-5" />
              Sign In / Sign Up
            </Link>
          </div>
        </div>

        {/* Video Demo Section */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
              <Film className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Video Demo</h2>
              <p className="text-gray-600">
                See how Navis creates cinematic travel experiences
              </p>
            </div>
          </div>

          <div className="bg-gray-900 rounded-2xl overflow-hidden shadow-2xl aspect-video relative">
            {videoLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-400">Loading video...</p>
                </div>
              </div>
            ) : videoError ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                <div className="text-center">
                  <div className="w-20 h-20 bg-violet-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Play className="w-10 h-10 text-violet-400" />
                  </div>
                  <p className="text-gray-400 text-lg">{videoError}</p>
                </div>
              </div>
            ) : (
              <video
                src={videoUrl || ""}
                controls
                className="w-full h-full object-cover"
                poster="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&h=675&fit=crop"
              >
                Your browser does not support the video tag.
              </video>
            )}
          </div>
        </div>

        {/* Example Itineraries Section */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Example Itineraries</h2>
              <p className="text-gray-600">
                Get inspired by these curated weekend adventures
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {EXAMPLE_ITINERARIES.map((itinerary) => (
              <div
                key={itinerary.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={itinerary.image}
                    alt={itinerary.city}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center gap-2 text-white/90 text-sm mb-1">
                      <MapPin className="w-4 h-4" />
                      {itinerary.city}
                    </div>
                    <h3 className="text-white font-bold text-lg">
                      {itinerary.title}
                    </h3>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {itinerary.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Weekend Trip
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {itinerary.interests.map((interest) => (
                      <span
                        key={interest}
                        className="px-3 py-1 bg-violet-50 text-violet-600 rounded-full text-xs font-medium"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>

                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Highlights: </span>
                    {itinerary.highlights.join(" • ")}
                  </div>

                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                    <button className="flex items-center gap-1 text-gray-500 hover:text-violet-600 transition-colors">
                      <Heart className="w-4 h-4" />
                      <span className="text-sm">Save</span>
                    </button>
                    <button className="flex items-center gap-1 text-gray-500 hover:text-violet-600 transition-colors">
                      <Share2 className="w-4 h-4" />
                      <span className="text-sm">Share</span>
                    </button>
                    <Link
                      href="/itinerary-generation"
                      className="ml-auto text-sm text-violet-600 font-medium hover:text-violet-700"
                    >
                      Create Similar →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10">
            <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-violet-600" />
            </div>
            <h2 className="text-3xl font-bold mb-4">
              Ready to Plan Your Adventure?
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Create a personalized itinerary tailored to your interests and
              discover amazing experiences in any city.
            </p>
            <Link
              href="/itinerary-generation"
              className="inline-flex items-center gap-2 px-8 py-4 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-700 transition-colors shadow-lg"
            >
              <MapPin className="w-5 h-5" />
              Start Planning Your Trip
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
