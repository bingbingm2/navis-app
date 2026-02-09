import NavBarThemed from "@/components/NavBarThemed";
import FooterThemed from "@/components/FooterThemed";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
