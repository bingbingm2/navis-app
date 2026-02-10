"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Compass, User, Menu, X, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { logOut, onAuthChange } from "@/lib/userLogin";
import { User as FirebaseUser } from "firebase/auth";

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);

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
      if (firebaseUser) {
        console.log("User logged in:", firebaseUser.uid);
      } else {
        console.log("User logged out");
      }
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

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">

            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-blue-600 font-display tracking-tight">
              Navis
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors hover:text-violet-600 ${
                isActive("/") ? "text-violet-600" : "text-gray-600"
              }`}
            >
              Home
            </Link>
            <Link
              href="/itinerary-generation"
              className={`text-sm font-medium transition-colors hover:text-violet-600 ${
                isActive("/itinerary-generation") || isActive("/itinerary")
                  ? "text-violet-600"
                  : "text-gray-600"
              }`}
            >
              Create Trip
            </Link>
            <Link
              href="/gallery"
              className={`text-sm font-medium transition-colors hover:text-violet-600 ${
                isActive("/gallery") ? "text-violet-600" : "text-gray-600"
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
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-900 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-violet-600" />
                  </div>
                  <span className="text-sm font-medium">
                    {user.displayName || "Dashboard"}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                  title="Log out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-600 hover:text-violet-600 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/login?mode=signup"
                  className="px-4 py-2 rounded-full bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-all shadow-lg shadow-violet-200 hover:shadow-violet-300"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-600"
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
        <div className="md:hidden bg-white border-t border-gray-100 absolute w-full left-0 shadow-lg">
          <div className="px-4 py-6 space-y-4">
            <Link
              href="/"
              className="block text-base font-medium text-gray-900 hover:text-violet-600"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/itinerary-generation"
              className="block text-base font-medium text-gray-900 hover:text-violet-600"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Create Trip
            </Link>
            <Link
              href="/gallery"
              className="block text-base font-medium text-gray-900 hover:text-violet-600"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Gallery
            </Link>
            <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-gray-100 rounded-lg font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User className="w-4 h-4" />{" "}
                    {user.displayName || "Dashboard"}
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full py-3 text-red-600 font-medium border border-red-200 rounded-lg hover:bg-red-50"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="w-full py-3 text-gray-600 font-medium border border-gray-200 rounded-lg text-center"
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
