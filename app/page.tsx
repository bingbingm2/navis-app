"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Sparkles, Check, MapPin, X } from "lucide-react";
import { US_MAJOR_CITIES } from "@/app/(protected)/itinerary-generation/us_cities";
import { addToWaitlist } from "@/lib/waitlistService";

// Generate softer, more varied colors (muted tones)
const getRandomSoftColor = () => {
  const hue = Math.floor(Math.random() * 360); // Full hue range
  const saturation = 35 + Math.floor(Math.random() * 35); // 35-70% (more muted)
  const lightness = 50 + Math.floor(Math.random() * 25); // 50-75% (softer range)
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

export default function Home() {
  // Start with white/gray color matching description text
  const [headlineColor1, setHeadlineColor1] = useState("rgba(255, 255, 255, 0.8)");
  const [headlineColor2, setHeadlineColor2] = useState("rgba(255, 255, 255, 0.6)");
  const [loadingComplete, setLoadingComplete] = useState(false);

  // Wait for loading animation to complete before starting color effect
  useEffect(() => {
    const loadingTimer = setTimeout(() => {
      setLoadingComplete(true);
    }, 2500); // Animation completes around 2.4s

    return () => clearTimeout(loadingTimer);
  }, []);

  // Soft color changing effect - only starts after loading is complete
  useEffect(() => {
    if (!loadingComplete) return;

    // Transition from white to first colors smoothly
    setHeadlineColor1(getRandomSoftColor());
    setHeadlineColor2(getRandomSoftColor());

    const interval = setInterval(() => {
      setHeadlineColor1(getRandomSoftColor());
      setHeadlineColor2(getRandomSoftColor());
    }, 200); // Slightly slower for elegance

    return () => clearInterval(interval);
  }, [loadingComplete]);

  const interestOptions = [
    {
      label: "Business & professional events",
      tooltip: "Examples: Networking events, training seminars, workshops.",
    },
    {
      label: "Music events",
      tooltip:
        "Examples: Festivals, instrument clinics, and local performances like acoustic open mic nights.",
    },
    {
      label: "Food & drink events",
      tooltip:
        "Examples: Food truck festivals, cooking classes, and cooking competitions.",
    },
    {
      label: "Performance & visual arts events",
      tooltip:
        "Examples: Art expos, galas and dinners, plays, ballets, and poetry readings.",
    },
    {
      label: "Sports & fitness events",
      tooltip: "Examples: Tournaments, races, and community fun runs.",
    },
    {
      label: "Charity & causes",
      tooltip:
        "Examples: Animal welfare events, environmental causes, and community causes.",
    },
  ];
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [destinationCity, setDestinationCity] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredCities, setFilteredCities] = useState<string[]>([]);
  const destinationInputRef = useRef<HTMLDivElement>(null);
  const MAX_INTERESTS = 3;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        destinationInputRef.current &&
        !destinationInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDestinationChange = (value: string) => {
    setDestinationCity(value);

    if (value.trim().length > 0) {
      const filtered = US_MAJOR_CITIES.filter((cityName) =>
        cityName.toLowerCase().includes(value.toLowerCase()),
      ).slice(0, 8);

      setFilteredCities(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setFilteredCities([]);
      setShowSuggestions(false);
    }
  };

  const selectDestination = (selectedCity: string) => {
    setDestinationCity(selectedCity);
    setShowSuggestions(false);
    setFilteredCities([]);
  };

  const toggleInterest = (label: string) => {
    setInterests((prev) => {
      if (prev.includes(label)) {
        return prev.filter((value) => value !== label);
      }
      if (prev.length >= MAX_INTERESTS) {
        return prev;
      }
      return [...prev, label];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !firstName || !lastName || !destinationCity) return;

    setIsLoading(true);
    setErrorMessage("");

    try {
      await addToWaitlist({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        destinationCity: destinationCity.trim(),
        interests,
      });

      setShowModal(false);
      setIsSubmitted(true);
      // Reset form
      setFirstName("");
      setLastName("");
      setEmail("");
      setDestinationCity("");
      setInterests([]);
    } catch (error: any) {
      console.error("Error submitting to waitlist:", error);
      setErrorMessage(
        error.message || "Failed to join waitlist. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col overflow-hidden relative">
      {/* Background - City scene with movie curtain effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
        {/* Movie screen container - larger but still with soft edges */}
        <div className="relative w-[98%] sm:w-[92%] md:w-[88%] h-[90%] sm:h-[88%]">
          {/* City background image */}
          <img
            src="/images/background-image-1.gif"
            alt=""
            className="absolute inset-0 w-full h-full object-cover rounded-2xl sm:rounded-3xl animate-load-bg"
          />
          {/* Soft vignette/blur edges - creates movie curtain fade */}
          <div className="absolute inset-0 rounded-2xl sm:rounded-3xl shadow-[inset_0_0_60px_40px_rgba(0,0,0,0.9),inset_0_0_120px_80px_rgba(0,0,0,0.7)] animate-load-curtain" />
          {/* Top and bottom gradient fade */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/80 rounded-2xl sm:rounded-3xl animate-load-curtain" />
          {/* Side gradient fade */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/50 rounded-2xl sm:rounded-3xl animate-load-curtain" />
        </div>
        {/* Outer black area */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Top curtain */}
          <div className="absolute top-0 left-0 right-0 h-[10%] bg-gradient-to-b from-black to-transparent" />
          {/* Bottom curtain */}
          <div className="absolute bottom-0 left-0 right-0 h-[15%] bg-gradient-to-t from-black to-transparent" />
          {/* Left curtain */}
          <div className="absolute top-0 bottom-0 left-0 w-[10%] bg-gradient-to-r from-black to-transparent" />
          {/* Right curtain */}
          <div className="absolute top-0 bottom-0 right-0 w-[10%] bg-gradient-to-l from-black to-transparent" />
        </div>
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 lg:px-12 py-3 animate-load-header">
        <nav className="max-w-5xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 transition-opacity"
          >
            <div className="relative w-12 h-12">
              <img
                src="/images/Naviya-logo-svg.svg"
                alt="Naviya"
                className="w-full h-full object-contain neon-glow"
              />
              <span className="shine-point" />
            </div>
            <span className="text-4xl font-script text-white mt-4 neon-glow">
              Naviya
            </span>
          </Link>
          <span className="text-xs text-white/60 tracking-widest uppercase">
            Coming Soon
          </span>
        </nav>
      </header>

      {/* Main Content - Positioned in sky area */}
      <main className="relative z-10 flex-1 flex items-start justify-center px-6 pt-32 sm:pt-8 pb-8">
        <div className="w-full max-w-xl space-y-4 sm:space-y-6 text-center animate-load-headline">
          {/* Tagline */}
          <p className="text-[10px] sm:text-xs tracking-[0.2em] sm:tracking-[0.25em] text-cyan-400/80 uppercase">
            नवीय · The New Path
          </p>

          {/* Headlines container */}
          <div className="flex flex-col items-center">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bodoni font-semibold leading-[1.1] tracking-tight">
              <span
                className="block transition-colors duration-100"
                style={{ color: headlineColor1 }}
              >
                Experience the City.
              </span>
            </h1>

            {/* Secondary headline */}
            <div className="mt-3 sm:mt-4 whitespace-nowrap">
              <span
                className="text-2xl sm:text-4xl lg:text-5xl font-bodoni font-medium transition-colors duration-100"
                style={{ color: headlineColor2 }}
              >
                Beyond the Sights.
              </span>
            </div>
          </div>

          <div className="space-y-1 max-w-2xl mx-auto mt-4 sm:mt-6 px-2 sm:px-0">
            <p className="text-sm sm:text-lg text-white/80 leading-relaxed font-medium">
              Landmarks stand still, but cities move.
            </p>
            <p className="text-xs sm:text-base text-white/60 leading-relaxed">
              Naviya blends local happenings into your itinerary to make the
              trip alive.
            </p>
          </div>

          {/* CTA Button - Start Planning */}
          <div className="flex flex-col items-center gap-2 sm:gap-4">
            <Link
              href="/itinerary-generation"
              className="group relative px-6 sm:px-8 py-2 sm:py-3 transition-all duration-500"
            >
              {/* Soft ambient glow - always visible */}
              <span className="absolute -inset-6 bg-indigo-500/10 blur-3xl rounded-full transition-all duration-700 group-hover:bg-indigo-400/40 group-hover:blur-[40px]" />
              <span className="absolute -inset-4 bg-violet-500/10 blur-2xl rounded-full transition-all duration-500 group-hover:bg-violet-400/35 group-hover:blur-3xl" />

              {/* Halo ring on hover */}
              <span className="absolute -inset-2 rounded-full opacity-0 group-hover:opacity-100 bg-gradient-to-r from-indigo-500/20 via-violet-500/30 to-indigo-500/20 blur-xl transition-all duration-500" />

              {/* Text content - subtle by default, brighter on hover */}
              <span className="relative flex items-center gap-2 text-white/50 group-hover:text-white font-medium transition-all duration-300 text-sm sm:text-base group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                <span className="tracking-wide">Start Planning Your Trip</span>
                <Sparkles
                  className="w-3 h-3 sm:w-4 sm:h-4 opacity-40 group-hover:opacity-100 group-hover:animate-pulse transition-opacity"
                  fill="currentColor"
                />
              </span>
            </Link>
            <p className="text-[10px] sm:text-xs text-white/50">
              Create your personalized itinerary in minutes.
            </p>
          </div>
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />

          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in">
            {/* Close button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <h2 className="text-xl font-headline font-bold text-slate-800">
                Join the Waitlist
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Be the first to explore cities beyond the frame
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:bg-white transition-colors text-sm"
                  required
                />
                <input
                  type="text"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:bg-white transition-colors text-sm"
                  required
                />
              </div>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:bg-white transition-colors text-sm"
                required
              />
              <div ref={destinationInputRef} className="relative">
                <input
                  type="text"
                  placeholder="Where do you want to travel?"
                  value={destinationCity}
                  onChange={(e) => handleDestinationChange(e.target.value)}
                  onFocus={() => {
                    if (
                      destinationCity.trim().length > 0 &&
                      filteredCities.length > 0
                    ) {
                      setShowSuggestions(true);
                    }
                  }}
                  className="h-11 w-full px-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:bg-white transition-colors text-sm"
                  required
                  autoComplete="off"
                />
                {showSuggestions && filteredCities.length > 0 && (
                  <div className="absolute z-30 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredCities.map((cityName) => (
                      <button
                        key={cityName}
                        type="button"
                        onClick={() => selectDestination(cityName)}
                        className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 focus:bg-indigo-50 focus:outline-none transition-colors border-b border-slate-100 last:border-b-0"
                      >
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <MapPin className="w-4 h-4 text-indigo-500" />
                          <span>{cityName}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <fieldset>
                <div className="flex items-center justify-between mb-2">
                  <legend className="text-xs uppercase tracking-[0.15em] text-slate-400">
                    Interests
                  </legend>
                  <p className="text-xs text-slate-400">
                    Select up to {MAX_INTERESTS}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {interestOptions.map((option) => (
                    <label
                      key={option.label}
                      className="group relative flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 hover:border-indigo-300 hover:bg-white transition-colors cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={interests.includes(option.label)}
                        onChange={() => toggleInterest(option.label)}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-500 focus:ring-indigo-400"
                      />
                      <span className="leading-tight">{option.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {errorMessage && (
                <p className="text-sm text-red-500 text-center">
                  {errorMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-lg mt-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Join Waitlist"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 px-6 py-4 animate-load-headline">
        <div className="flex flex-col items-center gap-3">
          {/* Social Links */}
          <div className="flex items-center gap-4">
            <a
              href="https://www.linkedin.com/company/naviya-ai/?viewAsMember=true"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/40 hover:text-white/70 transition-colors"
              aria-label="LinkedIn"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
            <a
              href="https://www.instagram.com/yi.universe/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/40 hover:text-white/70 transition-colors"
              aria-label="Instagram"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            <a
              href="https://www.tiktok.com/@naviyatravel"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/40 hover:text-white/70 transition-colors"
              aria-label="TikTok"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
              </svg>
            </a>
          </div>
          {/* Copyright */}
          <p className="text-xs text-white/40 text-center">
            © 2026 Naviya · नवीय — from Sanskrit "young, fresh, innovative"
          </p>
        </div>
      </footer>
    </div>
  );
}
