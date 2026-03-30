import React, { useState, useEffect } from "react";
import BottomNav from "../components/ui/BottomNav";
import TopperCard from "../components/TopperCard";
import { Gift, IndianRupee } from "lucide-react";

const ALL_TOPPERS = [
  { id: "1", name: "Ananya S.", college: "IIT Bombay", exam: "JEE", ratePerMinute: 10, avatarUrl: "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg", isOnline: true, tag: "IIT" },
  { id: "2", name: "Rohan M.", college: "AIIMS Delhi", exam: "NEET", ratePerMinute: 10, avatarUrl: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg", isOnline: false, tag: "AIIMS" },
  { id: "3", name: "Priya K.", college: "IIT Delhi", exam: "JEE", ratePerMinute: 10, avatarUrl: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg", isOnline: true, tag: "IIT" },
  { id: "4", name: "Arjun V.", college: "NIT Trichy", exam: "JEE", ratePerMinute: 10, avatarUrl: "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg", isOnline: true, tag: "NIT" },
  { id: "5", name: "Meera R.", college: "IIT Madras", exam: "JEE", ratePerMinute: 10, avatarUrl: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg", isOnline: true, tag: "IIT" },
  { id: "6", name: "Karan S.", college: "NIT Surathkal", exam: "JEE", ratePerMinute: 10, avatarUrl: "https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg", isOnline: false, tag: "NIT" },
  { id: "7", name: "Divya P.", college: "AIIMS Bhopal", exam: "NEET", ratePerMinute: 10, avatarUrl: "https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg", isOnline: true, tag: "AIIMS" },
  { id: "8", name: "Siddharth A.", college: "IIT Kharagpur", exam: "JEE", ratePerMinute: 10, avatarUrl: "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg", isOnline: true, tag: "IIT" },
];

const FILTERS = [
  { key: "ALL", label: "All Toppers", emoji: "🌟" },
  { key: "IIT", label: "IIT – JEE", emoji: "🎓" },
  { key: "AIIMS", label: "AIIMS – NEET", emoji: "🩺" },
  { key: "NIT", label: "NIT – JEE", emoji: "🏛️" },
];

function TopperTalksLogo() {
  return (
    <div className="logo">
      <div className="logo-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 3L2 8.5L12 14L22 8.5L12 3Z" fill="white" fillOpacity="0.95" />
          <path d="M7 11V17.5C7 17.5 9 20 12 20C15 20 17 17.5 17 17.5V11" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M22 8.5V14.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="22" cy="15" r="1" fill="white" />
        </svg>
      </div>
      <div className="logo-text">
        <span>
          <span className="logo-title">Topper</span>
          <span className="logo-title-accent">Talks</span>
        </span>
        <span className="logo-subtitle">FIND YOUR MENTOR</span>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [examMode, setExamMode] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("tt_exam_mode");
    if (saved) {
      setExamMode(saved);
      setActiveFilter(saved === "JEE" ? "IIT" : "AIIMS");
    } else {
      setTimeout(() => setShowOnboarding(true), 600);
    }
  }, []);

  const selectExam = (mode) => {
    localStorage.setItem("tt_exam_mode", mode);
    setExamMode(mode);
    setActiveFilter(mode === "JEE" ? "IIT" : "AIIMS");
    setShowOnboarding(false);
  };

  const filtered = activeFilter === "ALL" ? ALL_TOPPERS : ALL_TOPPERS.filter((t) => t.tag === activeFilter);

  return (
    <div style={{ minHeight: "100vh", background: "#0d1117", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", minHeight: "100vh", paddingBottom: 72 }}>

        {/* Header */}
        <header className="header">
          <TopperTalksLogo />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div className="wallet-pill">
              <div className="wallet-pill-icon">
                <IndianRupee size={11} color="#fff" strokeWidth={3} />
              </div>
              <span className="wallet-pill-amount">₹120</span>
            </div>
            {examMode && (
              <button onClick={() => setShowOnboarding(true)} className={`exam-badge ${examMode === "JEE" ? "exam-badge-jee" : "exam-badge-neet"}`}>
                {examMode === "JEE" ? "🎓 JEE" : "🩺 NEET"}
              </button>
            )}
            <button className="gift-btn"><Gift size={16} /></button>
          </div>
        </header>

        {/* Hero banner */}
        <div className="hero-banner">
          <div>
            <p className="hero-banner-title">🚀 Add to Home Screen</p>
            <p className="hero-banner-sub">Get extra ₹30 bonus on first recharge!</p>
          </div>
          <button className="hero-banner-btn">Add</button>
        </div>

        {/* Stats */}
        <div className="stats-row">
          {[
            { value: "4,731", label: "Online Now", color: "#22c55e", icon: "●" },
            { value: "12K+", label: "Sessions", color: "#818cf8", icon: "📞" },
            { value: "4.9★", label: "Avg Rating", color: "#fbbf24", icon: "⭐" },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <p className="stat-value" style={{ color: s.color }}>{s.icon} {s.value}</p>
              <p className="stat-label">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="filter-chips">
          {FILTERS.map((f) => {
            const isActive = activeFilter === f.key;
            return (
              <button key={f.key} onClick={() => setActiveFilter(f.key)} className={`filter-chip ${isActive ? "active" : ""}`}>
                <span>{f.emoji}</span>
                <span>{f.label}</span>
                {isActive && (
                  <span className="filter-chip-count">
                    {ALL_TOPPERS.filter((t) => f.key === "ALL" || t.tag === f.key).length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Count */}
        <div className="section-label">
          <span className="section-label-count">
            {filtered.length} topper{filtered.length !== 1 ? "s" : ""} available
          </span>
          <span className="section-label-live">
            <span className="live-dot" />
            Live now
          </span>
        </div>

        {/* Grid */}
        <main style={{ flex: 1, padding: "0 10px 20px", overflowY: "auto" }}>
          {filtered.length === 0 ? (
            <div className="empty-state">
              <p className="empty-state-emoji">🔍</p>
              <p className="empty-state-title">No toppers found</p>
              <p className="empty-state-sub">Try a different filter</p>
            </div>
          ) : (
            <div className="topper-grid">
              {filtered.map((topper) => (
                <TopperCard key={topper.id} topper={topper} />
              ))}
            </div>
          )}
        </main>

        <BottomNav active="home" />
      </div>

      {/* Onboarding Modal */}
      {showOnboarding && (
        <div className="onboarding-backdrop">
          <div className="onboarding-card" style={{ textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, margin: "0 auto 14px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 32px rgba(99,102,241,0.5)", fontSize: 30 }}>🎓</div>
            <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 900, color: "#e2e8f0" }}>Welcome to TopperTalks</h2>
            <p style={{ margin: "0 0 24px", fontSize: 14, color: "#64748b" }}>Choose your exam to get started</p>
            <div style={{ display: "flex", gap: 12 }}>
              {[
                { key: "JEE", emoji: "🎓", label: "JEE", sub: "IIT · NIT" },
                { key: "NEET", emoji: "🩺", label: "NEET", sub: "AIIMS · Medical" },
              ].map((e) => (
                <button key={e.key} onClick={() => selectExam(e.key)} style={{
                  flex: 1, padding: "20px 12px", borderRadius: 20, textAlign: "center",
                  background: "rgba(255,255,255,0.03)", border: "2px solid rgba(255,255,255,0.08)",
                  cursor: "pointer", transition: "all 0.15s"
                }}>
                  <p style={{ margin: "0 0 6px", fontSize: 36 }}>{e.emoji}</p>
                  <p style={{ margin: "0 0 2px", fontSize: 16, fontWeight: 800, color: "#e2e8f0" }}>{e.label}</p>
                  <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>{e.sub}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
