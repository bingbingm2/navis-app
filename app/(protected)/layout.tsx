"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { onAuthChange } from "@/lib/userLogin";
import { User } from "firebase/auth";
import NavBarThemed from "@/components/NavBarThemed";
import FooterThemed from "@/components/FooterThemed";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to auth state changes
    const unsubscribe = onAuthChange((firebaseUser) => {
      if (firebaseUser) {
        // User is authenticated
        setUser(firebaseUser);
        setLoading(false);
      } else {
        // User is not authenticated - redirect to login with return URL
        console.log("User not authenticated, redirecting to login...");
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router, pathname]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black relative">
        {/* LA Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <img
            src="/images/la-background.jpg"
            alt="Los Angeles"
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>
        <div className="relative z-10 text-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-violet-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70 text-lg">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, render the protected content
  if (user) {
    return (
      <div className="min-h-screen bg-black flex flex-col relative">
        {/* LA Background - Sunny California vibe */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {/* Background image */}
          <img
            src="/images/la-background.jpg"
            alt="Los Angeles"
            className="w-full h-full object-cover"
          />
          {/* Warm overlay to match sunset tones */}
          <div className="absolute inset-0 bg-gradient-to-b from-orange-900/20 via-transparent to-black/40" />
          {/* Subtle vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.4)_100%)]" />
        </div>

        {/* NavBar - Light variant for LA theme */}
        <NavBarThemed variant="light" />

        {/* Main Content */}
        <main className="relative z-10 flex-1 pt-16">
          {children}
        </main>

        {/* Footer - Light variant */}
        <FooterThemed variant="light" />
      </div>
    );
  }

  // Fallback (shouldn't reach here due to redirect)
  return null;
}
