import Link from "next/link";
import {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Mail,
  MapPin,
  Phone,
  Compass,
  Globe,
} from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 border-t border-gray-800">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative w-8 h-8">
                <Compass className="w-8 h-8 text-violet-500 transition-transform duration-500 group-hover:rotate-45" />
                <div className="absolute inset-0 bg-violet-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
              </div>
              <span className="text-2xl font-bold text-white font-display tracking-tight">
                Naviya
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-gray-400">
              Discover the world with personalized AI-powered itineraries. Your
              journey begins here.
            </p>
            <div className="flex items-center gap-4">
              <SocialLink href="#" icon={<Facebook className="w-5 h-5" />} />
              <SocialLink href="#" icon={<Instagram className="w-5 h-5" />} />
              <SocialLink href="#" icon={<Twitter className="w-5 h-5" />} />
              <SocialLink href="#" icon={<Linkedin className="w-5 h-5" />} />
              <SocialLink href="#" icon={<Youtube className="w-5 h-5" />} />
            </div>
          </div>

          {/* Links Column 1 */}
          <div>
            <h3 className="text-white font-semibold mb-6">Explore</h3>
            <ul className="space-y-4">
              <FooterLink href="/">Home</FooterLink>
              <FooterLink href="/gallery">Gallery</FooterLink>
              <FooterLink href="/login">Sign In</FooterLink>
            </ul>
          </div>

          {/* Links Column 2 */}
          <div>
            <h3 className="text-white font-semibold mb-6">Support</h3>
            <ul className="space-y-4">
              <li className="text-sm text-gray-400">
                <a href="mailto:hello@yi-universe.com" className="hover:text-violet-400 transition-colors">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>

          {/* Contact/Newsletter Column */}
          <div>
            <h3 className="text-white font-semibold mb-6">Get in Touch</h3>
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <Mail className="w-5 h-5 text-violet-500 flex-shrink-0" />
                <a
                  href="mailto:hello@yi-universe.com"
                  className="hover:text-violet-400 transition-colors"
                >
                  hello@yi-universe.com
                </a>
              </div>
            </div>

            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <h4 className="text-white text-sm font-medium mb-2">
                Get 5% discount
              </h4>
              <p className="text-xs text-gray-400 mb-3">
                Subscribe to our newsletter for travel tips & deals.
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Your email"
                  className="bg-gray-900 border border-gray-700 text-white text-sm rounded px-3 py-2 w-full focus:outline-none focus:border-violet-500 transition-colors"
                />
                <button className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded transition-colors">
                  Join
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800 bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              &copy; {currentYear} Naviya Inc. All rights reserved.
            </p>

            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2 hover:text-gray-300 transition-colors cursor-pointer">
                <Globe className="w-4 h-4" />
                <span>English (US)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm text-gray-400 hover:text-violet-400 transition-colors duration-200 flex items-center gap-2 group"
      >
        <span className="w-1 h-1 bg-violet-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        {children}
      </Link>
    </li>
  );
}

function SocialLink({ href, icon }: { href: string; icon: React.ReactNode }) {
  return (
    <a
      href={href}
      className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-violet-600 hover:text-white transition-all duration-300 transform hover:-translate-y-1"
    >
      {icon}
    </a>
  );
}
