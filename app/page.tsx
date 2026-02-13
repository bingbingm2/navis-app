"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Sparkles, Check, MapPin, X } from "lucide-react";
import { US_MAJOR_CITIES } from "@/app/(protected)/itinerary-generation/us_cities";
import { addToWaitlist } from "@/lib/waitlistService";

export default function Home() {

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
    <div className="min-h-screen flex flex-col overflow-hidden relative font-beach">

      {/* Full-page video background with cinematic blue edges */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[#0a1628]" />
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        >
          <source src="/images/la-homepage.mp4" type="video/mp4" />
        </video>
        {/* Blue tint overlay */}
        <div className="absolute inset-0 bg-[#0c2340]/25" />
        {/* Heavy cinematic vignette — blurred edges */}
        <div className="absolute inset-0 shadow-[inset_0_0_120px_60px_rgba(10,22,40,0.85),inset_0_0_200px_100px_rgba(10,22,40,0.5)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a1628]/70 via-transparent to-[#0a1628]/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a1628]/50 via-transparent to-[#0a1628]/50" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 lg:px-24 py-4">
        <nav className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 transition-opacity"
          >
            <span className="text-4xl lg:text-5xl font-script text-white/90">
              Navis
            </span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/itinerary-generation" className="text-sm text-white/70 hover:text-white transition-colors">
              Plan Trip
            </Link>
            <Link href="/gallery" className="text-sm text-white/70 hover:text-white transition-colors">
              Gallery
            </Link>
          </div>
        </nav>
      </header>

      {/* Main Content — Text on sky area */}
      <main className="relative z-10 flex-1 flex items-start justify-start px-6 lg:px-24 pt-16 sm:pt-24 lg:pt-28 pb-8">
        <div className="max-w-xl flex flex-col gap-5">
          {/* Headline — one sentence, staggered for artistic flow */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-light leading-relaxed text-white">
            <span className="block">Make Your Impression</span>
            <span className="block pl-6 sm:pl-10">of a City —</span>
            <span className="block pl-12 sm:pl-20">Your Next Travel Itinerary</span>
          </h1>

          <div className="space-y-2 max-w-md">
            <p className="text-sm sm:text-base text-white/80 leading-relaxed font-medium">
              Landmarks stand still, but cities move.
            </p>
            <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
              Navis blends local happenings into your itinerary to make the
              trip alive.
            </p>
          </div>

          {/* CTA Button */}
          <div className="flex flex-col gap-2 mt-2">
            <Link
              href="/itinerary-generation"
              className="group inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-medium rounded-full transition-all duration-300 backdrop-blur-sm w-fit"
            >
              <span className="tracking-wide">Start Planning Your Trip</span>
              <Sparkles
                className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity"
                fill="currentColor"
              />
            </Link>
            <p className="text-[11px] sm:text-xs text-white/50">
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
              <h2 className="text-xl font-bold text-slate-800 font-beach">
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
                  className="h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#2d6a7a] focus:bg-white transition-colors text-sm"
                  required
                />
                <input
                  type="text"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#2d6a7a] focus:bg-white transition-colors text-sm"
                  required
                />
              </div>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#2d6a7a] focus:bg-white transition-colors text-sm"
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
                  className="h-11 w-full px-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#2d6a7a] focus:bg-white transition-colors text-sm"
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
                        className="w-full text-left px-4 py-2.5 hover:bg-[#e8f4f8] focus:bg-[#e8f4f8] focus:outline-none transition-colors border-b border-slate-100 last:border-b-0"
                      >
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <MapPin className="w-4 h-4 text-[#2d6a7a]" />
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
                      className="group relative flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 hover:border-[#2d6a7a]/40 hover:bg-white transition-colors cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={interests.includes(option.label)}
                        onChange={() => toggleInterest(option.label)}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-[#2d6a7a] focus:ring-[#2d6a7a]"
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
                className="w-full h-11 bg-[#2d6a7a] hover:bg-[#1e4f5c] text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-lg mt-2"
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
      <footer className="relative z-10 px-6 py-4">
        <div className="flex flex-col items-center gap-3">
          <p className="text-xs text-white/40 text-center">
            © {new Date().getFullYear()} Navis
          </p>
        </div>
      </footer>
    </div>
  );
}
