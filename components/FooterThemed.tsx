"use client";

import Link from "next/link";
import Image from "next/image";

interface FooterThemedProps {
  variant?: "dark" | "light";
}

export default function FooterThemed({ variant = "light" }: FooterThemedProps) {
  const currentYear = new Date().getFullYear();
  const isDark = variant === "dark";

  const colors = isDark
    ? {
        bg: "bg-black/80 backdrop-blur-sm",
        text: "text-white/50",
        textHover: "hover:text-white/80",
        heading: "text-white/70",
        border: "border-white/10",
        mutedText: "text-white/30",
      }
    : {
        bg: "bg-gray-900/95 backdrop-blur-sm",
        text: "text-gray-400",
        textHover: "hover:text-white",
        heading: "text-gray-200",
        border: "border-gray-700",
        mutedText: "text-gray-500",
      };

  return (
    <footer className={`relative z-10 ${colors.bg} border-t ${colors.border}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 group mb-4">
              <img
                src="/images/Naviya-logo-svg.svg"
                alt="Naviya"
                className="w-7 h-7 transition-transform duration-300 group-hover:scale-110"
              />
              <span className="text-xl font-bold text-white font-display">
                Naviya
              </span>
            </Link>
            <p className={`text-sm ${colors.text} leading-relaxed mb-4`}>
              नवीय — from Sanskrit "young, fresh, innovative"
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-3">
              <a
                href="https://www.linkedin.com/company/naviya-ai/?viewAsMember=true"
                target="_blank"
                rel="noopener noreferrer"
                className={`${colors.text} ${colors.textHover} transition-colors`}
                aria-label="LinkedIn"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              <a
                href="https://www.instagram.com/yi.universe/"
                target="_blank"
                rel="noopener noreferrer"
                className={`${colors.text} ${colors.textHover} transition-colors`}
                aria-label="Instagram"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a
                href="https://www.tiktok.com/@naviyatravel"
                target="_blank"
                rel="noopener noreferrer"
                className={`${colors.text} ${colors.textHover} transition-colors`}
                aria-label="TikTok"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Product Column */}
          <div>
            <h4 className={`font-medium font-[family-name:var(--font-outfit)] tracking-wide ${colors.heading} mb-4`}>
              Product
            </h4>
            <ul className="space-y-3">
              <li>
                <Link href="/itinerary-generation" className={`text-sm ${colors.text} ${colors.textHover} transition-colors font-[family-name:var(--font-outfit)]`}>
                  Create Trip
                </Link>
              </li>
              <li>
                <Link href="/gallery" className={`text-sm ${colors.text} ${colors.textHover} transition-colors font-[family-name:var(--font-outfit)]`}>
                  Gallery
                </Link>
              </li>
              <li>
                <span className={`text-sm ${colors.mutedText} font-[family-name:var(--font-outfit)]`}>
                  Mobile App <span className="text-xs">(Coming Soon)</span>
                </span>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h4 className={`font-medium font-[family-name:var(--font-outfit)] tracking-wide ${colors.heading} mb-4`}>
              Company
            </h4>
            <ul className="space-y-3">
              <li>
                <a 
                  href="mailto:hello@yi-universe.com" 
                  className={`text-sm ${colors.text} ${colors.textHover} transition-colors font-[family-name:var(--font-outfit)]`}
                >
                  Contact
                </a>
              </li>
              <li>
                <a 
                  href="https://www.linkedin.com/company/naviya-ai/?viewAsMember=true" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-sm ${colors.text} ${colors.textHover} transition-colors font-[family-name:var(--font-outfit)]`}
                >
                  Careers
                </a>
              </li>
              <li>
                <span className={`text-sm ${colors.mutedText} font-[family-name:var(--font-outfit)]`}>
                  Press
                </span>
              </li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h4 className={`font-medium font-[family-name:var(--font-outfit)] tracking-wide ${colors.heading} mb-4`}>
              Legal
            </h4>
            <ul className="space-y-3">
              <li>
                <span className={`text-sm ${colors.mutedText} font-[family-name:var(--font-outfit)]`}>
                  Privacy Policy
                </span>
              </li>
              <li>
                <span className={`text-sm ${colors.mutedText} font-[family-name:var(--font-outfit)]`}>
                  Terms of Use
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className={`border-t ${colors.border}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className={`text-sm ${colors.mutedText} font-[family-name:var(--font-outfit)]`}>
              © {currentYear} Naviya
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
