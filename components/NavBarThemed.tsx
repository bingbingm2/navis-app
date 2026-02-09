"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Compass, User, Menu, X, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { logOut, onAuthChange } from "@/lib/userLogin";
import { User as FirebaseUser } from "firebase/auth";

interface NavBarProps {
  variant?: "dark" | "light";
}

export default function NavBarThemed({ variant = "light" }: NavBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);

  const isDark = variant === "dark";

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  const isActive = (path: string) => pathname === path;

  const handleLogout = async () => {
    try {
      await logOut();
      router.push("/");
    } catch (error: any) {
      console.error("Error logging out:", error);
    }
  };

  // Color schemes
  const colors = isDark
    ? {
        bg: isScrolled ? "bg-black/80 backdrop-blur-md border-b border-white/10" : "bg-transparent",
        text: "text-white/70",
        textHover: "hover:text-white",
        textActive: "text-white",
        logo: "text-white",
        logoGradient: "from-violet-400 to-cyan-400",
        mobileMenuBg: "bg-black/95 backdrop-blur-md border-t border-white/10",
        buttonBg: "bg-white/10 hover:bg-white/20",
        buttonText: "text-white",
        ctaBg: "bg-violet-600 hover:bg-violet-500",
        ctaText: "text-white",
      }
    : {
        bg: isScrolled ? "bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100" : "bg-white/60 backdrop-blur-sm",
        text: "text-gray-600",
        textHover: "hover:text-violet-600",
        textActive: "text-violet-600",
        logo: "text-violet-600",
        logoGradient: "from-violet-600 to-blue-600",
        mobileMenuBg: "bg-white border-t border-gray-100",
        buttonBg: "bg-gray-100 hover:bg-gray-200",
        buttonText: "text-gray-900",
        ctaBg: "bg-violet-600 hover:bg-violet-700",
        ctaText: "text-white",
      };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${colors.bg}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative w-8 h-8">
              <img
                src="/images/Naviya-logo-svg.svg"
                alt="Naviya"
                className="w-8 h-8 transition-transform duration-500 group-hover:scale-110"
              />
              <div className={`absolute inset-0 ${isDark ? "bg-violet-400" : "bg-violet-400"} blur-lg opacity-20 group-hover:opacity-40 transition-opacity`} />
            </div>
            <span className={`text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${colors.logoGradient} font-display tracking-tight`}>
              Naviya
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className={`text-sm font-medium font-[family-name:var(--font-outfit)] tracking-wide transition-colors ${colors.textHover} ${
                isActive("/") ? colors.textActive : colors.text
              }`}
            >
              Home
            </Link>
            <Link
              href="/itinerary-generation"
              className={`text-sm font-medium font-[family-name:var(--font-outfit)] tracking-wide transition-colors ${colors.textHover} ${
                isActive("/itinerary-generation") || isActive("/itinerary")
                  ? colors.textActive
                  : colors.text
              }`}
            >
              Create Trip
            </Link>
            <Link
              href="/gallery"
              className={`text-sm font-medium font-[family-name:var(--font-outfit)] tracking-wide transition-colors ${colors.textHover} ${
                isActive("/gallery") ? colors.textActive : colors.text
              }`}
            >
              Gallery
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard"
                  className={`flex items-center gap-2 px-4 py-2 rounded-full ${colors.buttonBg} ${colors.buttonText} transition-colors`}
                >
                  <div className={`w-8 h-8 rounded-full ${isDark ? "bg-violet-500/30" : "bg-violet-100"} flex items-center justify-center`}>
                    <User className={`w-4 h-4 ${isDark ? "text-violet-300" : "text-violet-600"}`} />
                  </div>
                  <span className="text-sm font-medium">
                    {user.displayName || "Dashboard"}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className={`p-2 ${isDark ? "text-white/60 hover:text-red-400 hover:bg-red-500/20" : "text-gray-600 hover:text-red-600 hover:bg-red-50"} rounded-full transition-all`}
                  title="Log out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className={`text-sm font-medium font-[family-name:var(--font-outfit)] tracking-wide ${colors.text} ${colors.textHover} transition-colors`}
                >
                  Log in
                </Link>
                <Link
                  href="/login?mode=signup"
                  className={`px-4 py-2 rounded-full ${colors.ctaBg} ${colors.ctaText} text-sm font-medium font-[family-name:var(--font-outfit)] tracking-wide transition-all shadow-lg ${isDark ? "shadow-violet-500/20" : "shadow-violet-200"}`}
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className={`md:hidden p-2 ${colors.text}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className={`md:hidden ${colors.mobileMenuBg} absolute w-full left-0 shadow-lg`}>
          <div className="px-4 py-6 space-y-4">
            <Link
              href="/"
              className={`block text-base font-medium ${isDark ? "text-white hover:text-violet-400" : "text-gray-900 hover:text-violet-600"}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/itinerary-generation"
              className={`block text-base font-medium ${isDark ? "text-white hover:text-violet-400" : "text-gray-900 hover:text-violet-600"}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Create Trip
            </Link>
            <Link
              href="/gallery"
              className={`block text-base font-medium ${isDark ? "text-white hover:text-violet-400" : "text-gray-900 hover:text-violet-600"}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Gallery
            </Link>
            <div className={`pt-4 border-t ${isDark ? "border-white/10" : "border-gray-100"} flex flex-col gap-3`}>
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className={`flex items-center justify-center gap-2 w-full py-3 ${isDark ? "bg-white/10" : "bg-gray-100"} rounded-lg font-medium ${isDark ? "text-white" : "text-gray-900"}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User className="w-4 h-4" /> {user.displayName || "Dashboard"}
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full py-3 ${isDark ? "text-red-400 border-red-500/30 hover:bg-red-500/10" : "text-red-600 border-red-200 hover:bg-red-50"} font-medium border rounded-lg`}
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className={`w-full py-3 ${isDark ? "text-white/70 border-white/20" : "text-gray-600 border-gray-200"} font-medium border rounded-lg text-center`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Log in
                  </Link>
                  <Link
                    href="/login?mode=signup"
                    className="w-full py-3 bg-violet-600 text-white font-medium rounded-lg text-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
