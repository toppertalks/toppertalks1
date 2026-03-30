import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/ui/BottomNav";
import LoginModal from "../components/ui/LoginModal";
import { isLoggedIn } from "../lib/auth-guard";
import { Star, Clock, IndianRupee, BookOpen, Settings, ChevronRight, Award, Flame, Target, LogOut, GraduationCap, Bell, Shield } from "lucide-react";

const SUBJECTS = ["Physics 🔬", "Chemistry ⚗️", "Maths 📐", "Biology 🧬"];
const RECENT_SESSIONS = [
  { topper: "Ananya S.", college: "IIT Bombay", subject: "Rotational Dynamics 🔬", duration: "24 min", cost: 720, date: "Today" },
  { topper: "Priya K.", college: "IIT Delhi", subject: "SN1 vs SN2 ⚗️", duration: "31 min", cost: 775, date: "2d ago" },
];

const MENU = [
  { icon: Target, label: "My Goals", sub: "Set daily learning targets", color: "#818cf8", href: null },
  { icon: Award, label: "Achievements", sub: "3 badges earned this week", color: "#fbbf24", href: null },
  { icon: BookOpen, label: "Saved Explanations", sub: "12 sessions bookmarked", color: "#22c55e", href: null },
  { icon: IndianRupee, label: "Wallet & Payments", sub: "Balance: ₹120 · Add money", color: "#06b6d4", href: "/wallet" },
  { icon: Bell, label: "Notifications", sub: "Calls, payments, ratings", color: "#f59e0b", href: "/notifications" },
  { icon: Shield, label: "Terms & Privacy", sub: "Legal, refund policy, data", color: "#94a3b8", href: "/legal" },
  { icon: Settings, label: "Settings", sub: "Notifications, Privacy, Account", color: "#64748b", href: null },
  { icon: LogOut, label: "Sign Out", sub: "You are signed in as Vivek", color: "#ef4444", href: "/login" },
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const [loggedIn, setLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => { setLoggedIn(isLoggedIn()); }, []);

  if (!loggedIn) return (
    <div className="page" style={{ alignItems: "center", justifyContent: "flex-start" }}>
      <div style={{ width: "100%", background: "linear-gradient(180deg,#13192b,#0d1117)", borderBottom: "1px solid rgba(99,102,241,0.12)", padding: "20px 18px 18px", filter: "blur(4px)", opacity: 0.5, pointerEvents: "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }} />
          <div>
            <div style={{ width: 100, height: 14, borderRadius: 6, background: "rgba(255,255,255,0.15)", marginBottom: 8 }} />
            <div style={{ width: 60, height: 10, borderRadius: 6, background: "rgba(255,255,255,0.08)" }} />
          </div>
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", width: "100%" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>👤</div>
        <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 800, color: "#e2e8f0", textAlign: "center" }}>Your Profile</h2>
        <p style={{ margin: "0 0 28px", fontSize: 14, color: "#64748b", textAlign: "center", lineHeight: 1.6 }}>Sign in to see your sessions, wallet balance, and achievements</p>
        <div style={{ width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 28 }}>
          {[{ emoji: "⭐", label: "Reviews" }, { emoji: "📞", label: "Sessions" }, { emoji: "💰", label: "Wallet" }].map((s) => (
            <div key={s.label} style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 14, padding: "14px 8px", textAlign: "center" }}>
              <p style={{ margin: "0 0 4px", fontSize: 24 }}>{s.emoji}</p>
              <p style={{ margin: 0, fontSize: 11, color: "#64748b", fontWeight: 600 }}>{s.label}</p>
            </div>
          ))}
        </div>
        <button className="btn-primary" onClick={() => setShowLoginModal(true)}>Sign In to View Profile</button>
        <p style={{ margin: "10px 0 0", fontSize: 12, color: "#334155" }}>100% free · Your data stays private</p>
      </div>
      {showLoginModal && <LoginModal reason="view your profile" returnTo="/profile" onClose={() => setShowLoginModal(false)} />}
      <BottomNav active="profile" />
    </div>
  );

  return (
    <div className="page">
      {/* Header Hero */}
      <div style={{ background: "linear-gradient(180deg,#13192b 0%,#0d1117 100%)", borderBottom: "1px solid rgba(99,102,241,0.15)", padding: "20px 18px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ position: "relative" }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 800, color: "#fff", boxShadow: "0 4px 20px rgba(99,102,241,0.5)" }}>V</div>
            <div className="online-dot" style={{ position: "absolute", bottom: -2, right: -2, width: 14, height: 14, border: "2.5px solid #0d1117" }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#e2e8f0", letterSpacing: -0.3 }}>Vivek Kumar</h1>
              <div style={{ background: "linear-gradient(90deg,#fbbf24,#f59e0b)", borderRadius: 8, padding: "1px 7px", fontSize: 10, fontWeight: 800, color: "#000" }}>⚡ Pro</div>
            </div>
            <p style={{ margin: "3px 0 0", fontSize: 11, color: "#64748b" }}>JEE 2025 Aspirant · ID: 166409025</p>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 6 }}>
              <Flame size={13} color="#f97316" />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#fb923c" }}>7-day streak!</span>
              <span style={{ fontSize: 11, color: "#475569" }}>Keep going 🔥</span>
            </div>
          </div>
        </div>
        {/* Study progress */}
        <div style={{ marginTop: 14, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.18)", borderRadius: 12, padding: "10px 14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#818cf8" }}>📚 Weekly Study Goal</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#e2e8f0" }}>3/5 sessions</span>
          </div>
          <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 50, height: 6, overflow: "hidden" }}>
            <div style={{ width: "60%", height: "100%", background: "linear-gradient(90deg,#6366f1,#8b5cf6)", borderRadius: 50, boxShadow: "0 0 10px rgba(99,102,241,0.6)" }} />
          </div>
        </div>
      </div>

      <main style={{ flex: 1, overflowY: "auto" }}>
        {/* Stats */}
        <div style={{ display: "flex", gap: 8, padding: "14px 14px 6px" }}>
          {[{ icon: "📞", val: "14", label: "Sessions", color: "#818cf8" }, { icon: "⏱️", val: "6.2 hrs", label: "Study Time", color: "#22c55e" }, { icon: "⭐", val: "4.8", label: "Avg Rating", color: "#fbbf24" }].map((s) => (
            <div key={s.label} className="stat-card" style={{ padding: "12px 8px" }}>
              <p style={{ margin: 0, fontSize: 16 }}>{s.icon}</p>
              <p style={{ margin: "4px 0 2px", fontSize: 14, fontWeight: 800, color: s.color }}>{s.val}</p>
              <p style={{ margin: 0, fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Wallet */}
        <div style={{ margin: "6px 14px" }}>
          <div className="card-gradient" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ margin: 0, fontSize: 11, color: "#94a3b8", textTransform: "uppercase", fontWeight: 600, letterSpacing: 0.8 }}>Wallet Balance</p>
              <p style={{ margin: "4px 0 0", fontSize: 26, fontWeight: 900, color: "#fff", lineHeight: 1 }}>₹120</p>
              <p style={{ margin: "4px 0 0", fontSize: 10, color: "#818cf8" }}>≈ 12 min with any IIT topper</p>
            </div>
            <button className="btn-primary" style={{ width: "auto", padding: "10px 20px", fontSize: 13 }}>+ Add Money</button>
          </div>
        </div>

        {/* Subjects */}
        <div style={{ padding: "14px 14px 6px" }}>
          <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.8 }}>My Subjects</p>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            {SUBJECTS.map((sub) => (
              <span key={sub} style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 50, padding: "6px 14px", fontSize: 12, fontWeight: 600, color: "#a5b4fc" }}>{sub}</span>
            ))}
          </div>
        </div>

        {/* Recent Sessions */}
        <div style={{ padding: "10px 14px 0" }}>
          <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.8 }}>Recent Sessions</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {RECENT_SESSIONS.map((s, i) => (
              <div key={i} className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{s.topper}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748b" }}>{s.college} · {s.subject}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5 }}>
                    <span style={{ fontSize: 10, color: "#64748b", display: "flex", alignItems: "center", gap: 3 }}><Clock size={10} /> {s.duration}</span>
                    <span style={{ fontSize: 10, color: "#22c55e", fontWeight: 700 }}>₹{s.cost}</span>
                    <span style={{ fontSize: 10, color: "#64748b" }}>{s.date}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 1 }}>
                  {[1, 2, 3, 4, 5].map((n) => <Star key={n} size={10} fill="#fbbf24" color="#fbbf24" />)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Menu */}
        <div style={{ padding: "14px 14px 8px", display: "flex", flexDirection: "column", gap: 6 }}>
          <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.8 }}>Account</p>
          {MENU.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.label} className="menu-item" onClick={() => item.href && navigate(item.href)}>
                <div className="menu-item-icon" style={{ background: `${item.color}18`, border: `1px solid ${item.color}33` }}>
                  <Icon size={16} color={item.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <p className="menu-item-label">{item.label}</p>
                  <p className="menu-item-sub">{item.sub}</p>
                </div>
                <ChevronRight size={16} color="#475569" />
              </button>
            );
          })}
        </div>

        {/* Become a Mentor */}
        <div style={{ margin: "8px 14px 10px", borderRadius: 20, background: "linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.1))", border: "1.5px solid rgba(99,102,241,0.3)", padding: "16px 18px", boxShadow: "0 0 30px rgba(99,102,241,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, flexShrink: 0, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(99,102,241,0.4)" }}>
              <GraduationCap size={22} color="#fff" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#e2e8f0" }}>Become a Topper Mentor 🎯</p>
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>Earn ₹10–₹50/min sharing your knowledge</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {["✅ IIT/NEET Verified", "💰 Avg ₹18K/month", "⏱️ Work Anytime"].map((f) => (
              <span key={f} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "3px 8px", fontSize: 9, fontWeight: 600, color: "#94a3b8" }}>{f}</span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-primary" style={{ fontSize: 13, padding: "10px" }} onClick={() => navigate("/become-mentor")}>Apply as Mentor →</button>
            <button style={{ padding: "10px 14px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#64748b", fontSize: 12, fontWeight: 700, cursor: "pointer" }} onClick={() => navigate("/topper")}>Topper Mode</button>
          </div>
        </div>

        <p style={{ textAlign: "center", fontSize: 10, color: "#1e293b", padding: "10px 0 4px", fontWeight: 600 }}>TopperTalks v1.0.0 · Made for JEE/NEET Warriors 🎯</p>
      </main>
      <BottomNav active="profile" />
    </div>
  );
}
