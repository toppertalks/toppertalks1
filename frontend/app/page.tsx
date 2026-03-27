"use client";

import { useState, useEffect } from "react";
import { BottomNav } from "@/components/ui/bottom-nav";
import { TopperCard, Topper } from "@/components/topper-card";
import { Gift, IndianRupee } from "lucide-react";

/* ── Extended dataset with IIT / NIT / AIIMS variety ── */
const ALL_TOPPERS: (Topper & { tag: "IIT" | "NIT" | "AIIMS" })[] = [
  { id: "1", name: "Ananya S.", college: "IIT Bombay", exam: "JEE", ratePerMinute: 10, avatarUrl: "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg", isOnline: true, tag: "IIT" },
  { id: "2", name: "Rohan M.", college: "AIIMS Delhi", exam: "NEET", ratePerMinute: 10, avatarUrl: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg", isOnline: false, tag: "AIIMS" },
  { id: "3", name: "Priya K.", college: "IIT Delhi", exam: "JEE", ratePerMinute: 10, avatarUrl: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg", isOnline: true, tag: "IIT" },
  { id: "4", name: "Arjun V.", college: "NIT Trichy", exam: "JEE", ratePerMinute: 10, avatarUrl: "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg", isOnline: true, tag: "NIT" },
  { id: "5", name: "Meera R.", college: "IIT Madras", exam: "JEE", ratePerMinute: 10, avatarUrl: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg", isOnline: true, tag: "IIT" },
  { id: "6", name: "Karan S.", college: "NIT Surathkal", exam: "JEE", ratePerMinute: 10, avatarUrl: "https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg", isOnline: false, tag: "NIT" },
  { id: "7", name: "Divya P.", college: "AIIMS Bhopal", exam: "NEET", ratePerMinute: 10, avatarUrl: "https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg", isOnline: true, tag: "AIIMS" },
  { id: "8", name: "Siddharth A.", college: "IIT Kharagpur", exam: "JEE", ratePerMinute: 10, avatarUrl: "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg", isOnline: true, tag: "IIT" },
];

type ExamMode = "JEE" | "NEET" | null;
type FilterKey = "ALL" | "IIT" | "AIIMS" | "NIT";

const FILTERS: { key: FilterKey; label: string; emoji: string }[] = [
  { key: "ALL", label: "All Toppers", emoji: "🌟" },
  { key: "IIT", label: "IIT – JEE", emoji: "🎓" },
  { key: "AIIMS", label: "AIIMS – NEET", emoji: "🩺" },
  { key: "NIT", label: "NIT – JEE", emoji: "🏛️" }
];

/* ── Inline SVG Logo ── */
function TopperTalksLogo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {/* Icon mark */}
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 13,
          background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 60%, #a78bfa 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 16px rgba(99,102,241,0.55)",
          flexShrink: 0
        }}
      >
        {/* Graduation cap SVG */}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 3L2 8.5L12 14L22 8.5L12 3Z"
            fill="white"
            fillOpacity="0.95"
          />
          <path
            d="M7 11V17.5C7 17.5 9 20 12 20C15 20 17 17.5 17 17.5V11"
            stroke="white"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <path
            d="M22 8.5V14.5"
            stroke="white"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="22" cy="15" r="1" fill="white" />
        </svg>
      </div>

      {/* Word mark */}
      <div style={{ lineHeight: 1, display: "flex", flexDirection: "column", gap: 1 }}>
        <span style={{ display: "flex", alignItems: "baseline", gap: 0 }}>
          <span
            style={{
              fontFamily: "'Segoe UI', system-ui, sans-serif",
              fontWeight: 800,
              fontSize: 20,
              color: "#ffffff",
              letterSpacing: -0.5
            }}
          >
            Topper
          </span>
          <span
            style={{
              fontFamily: "'Segoe UI', system-ui, sans-serif",
              fontWeight: 800,
              fontSize: 20,
              background: "linear-gradient(90deg, #818cf8, #c084fc)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: -0.5
            }}
          >
            Talks
          </span>
        </span>
        <span
          style={{
            fontSize: 9,
            color: "#94a3b8",
            letterSpacing: 1.5,
            textTransform: "uppercase",
            fontWeight: 600
          }}
        >
          FIND YOUR MENTOR
        </span>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("ALL");
  const [examMode, setExamMode] = useState<ExamMode>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("tt_exam_mode") as ExamMode;
    if (saved) {
      setExamMode(saved);
      setActiveFilter(saved === "JEE" ? "IIT" : "AIIMS");
    } else {
      // First visit — show onboarding
      setTimeout(() => setShowOnboarding(true), 600);
    }
  }, []);

  const selectExam = (mode: "JEE" | "NEET") => {
    localStorage.setItem("tt_exam_mode", mode);
    setExamMode(mode);
    setActiveFilter(mode === "JEE" ? "IIT" : "AIIMS");
    setShowOnboarding(false);
  };

  const filtered =
    activeFilter === "ALL"
      ? ALL_TOPPERS
      : ALL_TOPPERS.filter((t) => t.tag === activeFilter);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0d1117",  /* deep navy — trustworthy like GitHub dark */
        display: "flex",
        justifyContent: "center"
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          paddingBottom: 72
        }}
      >

        {/* ══════════════════════════════════
            HEADER
        ══════════════════════════════════ */}
        <header
          style={{
            background: "linear-gradient(180deg, #13192b 0%, #0d1117 100%)",
            borderBottom: "1px solid rgba(99,102,241,0.2)",
            padding: "14px 16px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 40,
            backdropFilter: "blur(12px)"
          }}
        >
          <TopperTalksLogo />

          {/* Right: Wallet + Gift */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Wallet pill */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "rgba(99,102,241,0.15)",
                border: "1px solid rgba(99,102,241,0.35)",
                borderRadius: 50,
                padding: "5px 12px",
                cursor: "pointer"
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg,#fbbf24,#f59e0b)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <IndianRupee size={11} color="#fff" strokeWidth={3} />
              </div>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#e2e8f0"
                }}
              >
                ₹120
              </span>
            </div>

            {/* Exam mode badge */}
            {examMode && (
              <button onClick={() => setShowOnboarding(true)} style={{
                padding: "4px 10px", borderRadius: 50, fontSize: 10, fontWeight: 800,
                background: examMode === "JEE" ? "rgba(99,102,241,0.15)" : "rgba(14,165,233,0.15)",
                border: `1px solid ${examMode === "JEE" ? "rgba(99,102,241,0.35)" : "rgba(14,165,233,0.35)"}`,
                color: examMode === "JEE" ? "#818cf8" : "#38bdf8",
                cursor: "pointer"
              }}>
                {examMode === "JEE" ? "🎓 JEE" : "🩺 NEET"}
              </button>
            )}

            {/* Gift button */}
            <button
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "rgba(139,92,246,0.15)",
                border: "1px solid rgba(139,92,246,0.35)",
                color: "#c084fc",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer"
              }}
            >
              <Gift size={16} />
            </button>
          </div>
        </header>

        {/* ══════════════════════════════════
            HERO BANNER STRIP
        ══════════════════════════════════ */}
        <div
          style={{
            margin: "12px 14px 4px",
            borderRadius: 16,
            background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)",
            border: "1px solid rgba(99,102,241,0.3)",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>
              🚀 Add to Home Screen
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>
              Get extra ₹30 bonus on first recharge!
            </p>
          </div>
          <button
            style={{
              background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
              color: "#fff",
              border: "none",
              borderRadius: 50,
              padding: "6px 16px",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 2px 12px rgba(99,102,241,0.4)"
            }}
          >
            Add
          </button>
        </div>

        {/* ══════════════════════════════════
            STATS ROW
        ══════════════════════════════════ */}
        <div
          style={{
            display: "flex",
            gap: 8,
            padding: "10px 14px 6px",
            justifyContent: "space-between"
          }}
        >
          {[
            { value: "4,731", label: "Online Now", color: "#22c55e", icon: "●" },
            { value: "12K+", label: "Sessions", color: "#818cf8", icon: "📞" },
            { value: "4.9★", label: "Avg Rating", color: "#fbbf24", icon: "⭐" }
          ].map((s) => (
            <div
              key={s.label}
              style={{
                flex: 1,
                background: "#161b27",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 12,
                padding: "8px 10px",
                textAlign: "center"
              }}
            >
              <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: s.color }}>
                {s.icon} {s.value}
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 10, color: "#64748b" }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* ══════════════════════════════════
            FILTER CHIPS
        ══════════════════════════════════ */}
        <div
          style={{
            display: "flex",
            gap: 8,
            padding: "10px 14px 6px",
            overflowX: "auto",
            scrollbarWidth: "none"
          }}
        >
          {FILTERS.map((f) => {
            const isActive = activeFilter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                style={{
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "7px 16px",
                  borderRadius: 50,
                  border: isActive
                    ? "1.5px solid #818cf8"
                    : "1.5px solid rgba(255,255,255,0.1)",
                  background: isActive
                    ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                    : "rgba(255,255,255,0.04)",
                  color: isActive ? "#ffffff" : "#94a3b8",
                  fontSize: 12,
                  fontWeight: isActive ? 700 : 500,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  boxShadow: isActive
                    ? "0 2px 14px rgba(99,102,241,0.45)"
                    : "none"
                }}
              >
                <span>{f.emoji}</span>
                <span>{f.label}</span>
                {isActive && (
                  <span
                    style={{
                      marginLeft: 2,
                      background: "rgba(255,255,255,0.25)",
                      borderRadius: "50%",
                      width: 16,
                      height: 16,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 9,
                      fontWeight: 800
                    }}
                  >
                    {ALL_TOPPERS.filter(
                      (t) => f.key === "ALL" || t.tag === f.key
                    ).length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ══════════════════════════════════
            "Showing X toppers for …" label
        ══════════════════════════════════ */}
        <div
          style={{
            padding: "4px 16px 8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <span style={{ fontSize: 12, color: "#475569" }}>
            {filtered.length} topper{filtered.length !== 1 ? "s" : ""} available
          </span>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11,
              color: "#22c55e"
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#22c55e",
                boxShadow: "0 0 6px #22c55e",
                display: "inline-block"
              }}
            />
            Live now
          </span>
        </div>

        {/* ══════════════════════════════════
            2-COLUMN TOPPER GRID
        ══════════════════════════════════ */}
        <main style={{ flex: 1, padding: "0 10px 20px", overflowY: "auto" }}>
          {filtered.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                color: "#475569"
              }}
            >
              <p style={{ fontSize: 40, margin: "0 0 12px" }}>🔍</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#94a3b8" }}>
                No toppers found
              </p>
              <p style={{ fontSize: 12, marginTop: 4 }}>
                Try a different filter
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 10
              }}
            >
              {filtered.map((topper) => (
                <TopperCard key={topper.id} topper={topper} />
              ))}
            </div>
          )}
        </main>

        <BottomNav active="home" />
      </div>

      {/* ══════════════════════════════════════
          ONBOARDING MODAL — EXAM SELECTION
      ══════════════════════════════════════ */}
      {showOnboarding && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 500,
          background: "rgba(0,0,0,0.92)", backdropFilter: "blur(16px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "0 20px"
        }}>
          <div style={{
            width: "100%", maxWidth: 420,
            background: "linear-gradient(180deg,#13192b 0%,#0d1117 100%)",
            borderRadius: 28, padding: "32px 24px",
            border: "1px solid rgba(99,102,241,0.25)",
            boxShadow: "0 32px 80px rgba(0,0,0,0.8)"
          }}>
            {/* Logo */}
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{
                width: 64, height: 64, borderRadius: 18, margin: "0 auto 14px",
                background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 8px 32px rgba(99,102,241,0.5)"
              }}>
                <span style={{ fontSize: 28 }}>🎯</span>
              </div>
              <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 900, color: "#e2e8f0" }}>
                What are you preparing for?
              </h2>
              <p style={{ margin: 0, fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>
                We&apos;ll show you the most relevant toppers for your exam.
                You can change this anytime.
              </p>
            </div>

            {/* JEE Option */}
            <button onClick={() => selectExam("JEE")} style={{
              width: "100%", padding: "18px 20px", borderRadius: 20, marginBottom: 12,
              background: "rgba(99,102,241,0.08)", border: "1.5px solid rgba(99,102,241,0.25)",
              cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 16,
              transition: "all 0.2s"
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(99,102,241,0.18)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#6366f1";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(99,102,241,0.08)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(99,102,241,0.25)";
              }}>
              <span style={{ fontSize: 40 }}>🎓</span>
              <div>
                <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#e2e8f0" }}>
                  JEE (Mains / Advanced)
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>
                  IIT · NIT · IIIT · B.Tech
                </p>
              </div>
              <span style={{ marginLeft: "auto", fontSize: 20, color: "#6366f1" }}>→</span>
            </button>

            {/* NEET Option */}
            <button onClick={() => selectExam("NEET")} style={{
              width: "100%", padding: "18px 20px", borderRadius: 20, marginBottom: 20,
              background: "rgba(14,165,233,0.06)", border: "1.5px solid rgba(14,165,233,0.2)",
              cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 16,
              transition: "all 0.2s"
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(14,165,233,0.15)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#0ea5e9";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(14,165,233,0.06)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(14,165,233,0.2)";
              }}>
              <span style={{ fontSize: 40 }}>🩺</span>
              <div>
                <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#e2e8f0" }}>
                  NEET-UG
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>
                  AIIMS · MBBS · BDS · Medical
                </p>
              </div>
              <span style={{ marginLeft: "auto", fontSize: 20, color: "#0ea5e9" }}>→</span>
            </button>

            {examMode && (
              <button onClick={() => setShowOnboarding(false)} style={{
                width: "100%", padding: "12px", borderRadius: 14,
                background: "transparent", border: "none",
                color: "#475569", fontSize: 13, cursor: "pointer"
              }}>Keep current ({examMode}) →</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
