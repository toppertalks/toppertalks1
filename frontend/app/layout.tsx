import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TopperTalks – Find Your Mentor",
  description: "Find and connect with verified IIT & AIIMS toppers as your personal mentor. 1:1 video calls for JEE & NEET aspirants.",
  keywords: ["JEE", "NEET", "IIT", "find mentor", "topper mentor", "IIT mentor", "AIIMS mentor", "call"],
  authors: [{ name: "TopperTalks" }],
  themeColor: "#0d1117"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0d1117"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{
        minHeight: "100vh",
        background: "#060a12",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start"
      }}>
        {/* Desktop: subtle indigo grid pattern visible on sides */}
        <div aria-hidden style={{
          position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
          backgroundImage: `
            radial-gradient(circle at 20% 20%, rgba(99,102,241,0.08) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(139,92,246,0.06) 0%, transparent 50%),
            linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "100% 100%, 100% 100%, 40px 40px, 40px 40px"
        }} />

        {/* ── On desktop: show a "desktop hint" sidebar ── */}
        <div style={{
          position: "fixed", left: 0, top: 0, bottom: 0,
          width: "calc((100vw - 480px) / 2)",
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", padding: "40px 32px", zIndex: 1,
          pointerEvents: "none"
        }}
          className="desktop-sidebar"
        >
          <div style={{ maxWidth: 280, textAlign: "center" }}>
            <div style={{
              width: 64, height: 64, borderRadius: 20,
              background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px", boxShadow: "0 8px 32px rgba(99,102,241,0.4)"
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M12 3L2 8.5L12 14L22 8.5L12 3Z" fill="white" fillOpacity="0.9" />
                <path d="M7 11V17C7 17 9 20 12 20C15 20 17 17 17 17V11"
                  stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" />
              </svg>
            </div>
            <h2 style={{
              margin: "0 0 10px", fontSize: 22, fontWeight: 800, color: "#e2e8f0"
            }}>
              Topper<span style={{
                background: "linear-gradient(90deg,#818cf8,#c084fc)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
              }}>Talks</span>
            </h2>
            <p style={{ margin: 0, fontSize: 13, color: "#475569", lineHeight: 1.7 }}>
              Find your personal mentor from verified IIT &amp; AIIMS toppers.
              1:1 video calls, available 24/7 for JEE &amp; NEET aspirants.
            </p>
            <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 10 }}>
              {["✅ IIT & AIIMS Verified Toppers", "⚡ Connect in Under 60s", "🔒 100% Safe & Secure", "💰 Starts at just ₹10/min"].map(f => (
                <div key={f} style={{
                  background: "rgba(99,102,241,0.08)",
                  border: "1px solid rgba(99,102,241,0.15)",
                  borderRadius: 10, padding: "8px 14px",
                  fontSize: 12, fontWeight: 600, color: "#94a3b8",
                  textAlign: "left"
                }}>{f}</div>
              ))}
            </div>
          </div>
        </div>

        {/* App content — centered, max 480px */}
        <div style={{
          position: "relative", zIndex: 2,
          width: "100%", maxWidth: 480,
          minHeight: "100vh",
          boxShadow: "0 0 60px rgba(0,0,0,0.5)"
        }}>
          {children}
        </div>

        {/* Desktop sidebar style — only visible > 960px */}
        <style>{`
          .desktop-sidebar { display: none; }
          @media (min-width: 960px) { .desktop-sidebar { display: flex; } }
        `}</style>
      </body>
    </html>
  );
}
