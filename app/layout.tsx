import type { Metadata } from "next";
import { Inter, Playwrite_GB_J, Bodoni_Moda, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const playwriteGBJ = Playwrite_GB_J({
  weight: "400",
  display: "swap",
  variable: "--font-playwrite",
});

const bodoniModa = Bodoni_Moda({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-bodoni",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Navis - AI Travel Planner",
  description: "Generate personalized travel itineraries with AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${playwriteGBJ.variable} ${bodoniModa.variable} ${outfit.variable}`}>{children}</body>
    </html>
  );
}
