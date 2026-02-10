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

              <span className="text-xl font-bold text-white font-display">
                Navis
              </span>
            </Link>

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
              © {currentYear} Navis
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
