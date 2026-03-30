import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Star, Phone, Video, ChevronLeft, Clock, BookOpen, MessageCircle, CheckCircle, IndianRupee, Share2 } from "lucide-react";

const TOPPERS = {
  "1": { id: "1", name: "Ananya Sharma", college: "IIT Bombay", tag: "IIT", rank: "AIR 427", exam: "JEE Advanced 2022", year: "3rd Year", branch: "B.Tech CS", subjects: ["Physics","Maths","Mechanics","Thermodynamics","Waves"], bio: "Hey! I cracked JEE Advanced in my first attempt with AIR 427. I scored 98.6 percentile in Maths and specialise in solving tricky Physics problems. I've helped 300+ students clear their doubts. Let's crack your exams together! 💪", rating: 4.9, totalSessions: 312, responseTime: 2, avatarUrl: "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg", isOnline: true, reviews: [{ student: "Rahul G.", comment: "Explained Rotational Dynamics so clearly in 20 min. Highly recommend!", stars: 5, time: "2 days ago" },{ student: "Prerna S.", comment: "Patient and very knowledgeable. Cleared my Electrostatics doubt within minutes.", stars: 5, time: "4 days ago" },{ student: "Aditya K.", comment: "Best mentor for integration tricks. Will definitely book again.", stars: 4, time: "1 week ago" },{ student: "Nisha V.", comment: "Super helpful! Explained Thermodynamics with real exam context.", stars: 5, time: "1 week ago" }] },
  "2": { id: "2", name: "Rohan Mehta", college: "AIIMS Delhi", tag: "AIIMS", rank: "AIR 89", exam: "NEET 2021", year: "4th Year MBBS", branch: "MBBS", subjects: ["Biology","Chemistry","Physiology","Biochemistry"], bio: "AIIMS Delhi MBBS student with AIR 89 in NEET. I help students understand biology concepts with diagrams and mnemonics. Scored 720/720 in NEET.", rating: 4.8, totalSessions: 198, responseTime: 3, avatarUrl: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg", isOnline: false, reviews: [{ student: "Simran P.", comment: "Amazing at explaining Biology diagrams.", stars: 5, time: "3 days ago" },{ student: "Aryan K.", comment: "Very detailed explanations on Human Physiology.", stars: 5, time: "5 days ago" }] },
  "3": { id: "3", name: "Priya Kapoor", college: "IIT Delhi", tag: "IIT", rank: "AIR 312", exam: "JEE Advanced 2023", year: "2nd Year", branch: "B.Tech ECE", subjects: ["Maths","Chemistry","Organic Chemistry","Electrochemistry"], bio: "IIT Delhi ECE student passionate about teaching Maths and Chemistry.", rating: 4.7, totalSessions: 145, responseTime: 4, avatarUrl: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg", isOnline: true, reviews: [{ student: "Kabir M.", comment: "She makes Organic Chemistry sound so simple!", stars: 5, time: "1 day ago" }] },
  "4": { id: "4", name: "Arjun Verma", college: "NIT Trichy", tag: "NIT", rank: "AIR 2140", exam: "JEE Mains 2023", year: "3rd Year", branch: "Mechanical Engg", subjects: ["Physics","Mechanics","Fluid Dynamics"], bio: "NIT Trichy Mechanical student. Great at Physics and Mechanics.", rating: 4.6, totalSessions: 87, responseTime: 5, avatarUrl: "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg", isOnline: true, reviews: [] },
  "5": { id: "5", name: "Meera Rajan", college: "IIT Madras", tag: "IIT", rank: "AIR 198", exam: "JEE Advanced 2022", year: "3rd Year", branch: "B.Tech Chemical", subjects: ["Chemistry","Maths","Physical Chemistry"], bio: "IIT Madras Chemical Engg. AIR 198.", rating: 4.9, totalSessions: 256, responseTime: 2, avatarUrl: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg", isOnline: true, reviews: [] },
};

const TAG_COLORS = { IIT: "#6366f1", NIT: "#22c55e", AIIMS: "#0ea5e9" };

export default function TopperProfilePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const topper = TOPPERS[id] ?? TOPPERS["1"];
  const [activeTab, setActiveTab] = useState("about");
  const tagColor = TAG_COLORS[topper.tag] ?? "#6366f1";
  const fullStars = Math.floor(topper.rating);
  const partialStar = topper.rating - fullStars;

  return (
    <div className="page" style={{ paddingBottom: 120 }}>
      {/* Hero Header */}
      <div style={{ position: "relative", overflow: "hidden", background: `linear-gradient(180deg, rgba(${topper.tag==="IIT"?"99,102,241":topper.tag==="NIT"?"34,197,94":"14,165,233"},0.18) 0%, #0d1117 100%)`, paddingTop: 60, paddingBottom: 24 }}>
        <div style={{ position: "absolute", top: 16, left: 16, right: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={() => navigate(-1)} style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#e2e8f0", cursor: "pointer" }}><ChevronLeft size={20} /></button>
          <button style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#e2e8f0", cursor: "pointer" }}><Share2 size={17} /></button>
        </div>
        <div style={{ textAlign: "center", animation: "fadeUp 0.4s ease" }}>
          <div style={{ position: "relative", display: "inline-block", marginBottom: 14 }}>
            <img src={topper.avatarUrl} alt={topper.name} style={{ width: 100, height: 100, borderRadius: "50%", objectFit: "cover", objectPosition: "top", border: `3px solid ${tagColor}`, boxShadow: "0 8px 30px rgba(0,0,0,0.5)" }} />
            <div style={{ position: "absolute", bottom: 4, right: 4, width: 16, height: 16, borderRadius: "50%", background: topper.isOnline ? "#22c55e" : "#334155", border: "2.5px solid #0d1117", boxShadow: topper.isOnline ? "0 0 8px #22c55e" : "none" }} />
          </div>
          <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 900, color: "#e2e8f0" }}>{topper.name}</h1>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ background: `rgba(${topper.tag==="IIT"?"99,102,241":topper.tag==="NIT"?"34,197,94":"14,165,233"},0.15)`, border: `1px solid ${tagColor}40`, borderRadius: 50, padding: "2px 10px", fontSize: 11, fontWeight: 800, color: tagColor }}>{topper.tag}</span>
            <span style={{ fontSize: 13, color: "#94a3b8" }}>{topper.college}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginBottom: 6 }}>
            {[1,2,3,4,5].map(i => <span key={i} style={{ fontSize: 16, opacity: i <= fullStars ? 1 : (i === fullStars+1 && partialStar > 0.5 ? 0.6 : 0.2) }}>⭐</span>)}
            <span style={{ fontSize: 14, fontWeight: 800, color: "#fbbf24", marginLeft: 4 }}>{topper.rating}</span>
            <span style={{ fontSize: 12, color: "#64748b" }}>({topper.totalSessions} sessions)</span>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: topper.isOnline ? "#4ade80" : "#64748b", fontWeight: 700 }}>{topper.isOnline ? "🟢 Available now" : "⚫ Currently offline"}</p>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, margin: "0 14px 20px" }}>
        {[{ label: "Sessions", value: topper.totalSessions.toString(), icon: <Clock size={14} /> },{ label: "Rank", value: topper.rank, icon: <Star size={14} /> },{ label: "Avg Reply", value: `${topper.responseTime} min`, icon: <MessageCircle size={14} /> }].map(s => (
          <div key={s.label} style={{ background: "#161b27", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "14px 10px", textAlign: "center" }}>
            <div style={{ color: "#6366f1", marginBottom: 6, display: "flex", justifyContent: "center" }}>{s.icon}</div>
            <p style={{ margin: "0 0 2px", fontSize: 15, fontWeight: 900, color: "#e2e8f0" }}>{s.value}</p>
            <p style={{ margin: 0, fontSize: 10, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pricing */}
      <div style={{ margin: "0 14px 20px", background: "linear-gradient(135deg,rgba(99,102,241,0.12),rgba(139,92,246,0.08))", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 20, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(99,102,241,0.4)", flexShrink: 0 }}><IndianRupee size={20} color="#fff" /></div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: "0 0 3px", fontSize: 16, fontWeight: 900, color: "#e2e8f0" }}>₹50 for first 5 min · then ₹10/min</p>
          <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>Topper earns ₹6/min · Standard rate for all mentors</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", margin: "0 14px 20px", background: "#161b27", borderRadius: 14, padding: 4 }}>
        {["about","reviews"].map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{ flex: 1, padding: 10, borderRadius: 10, background: activeTab === t ? "rgba(99,102,241,0.2)" : "transparent", border: activeTab === t ? "1px solid rgba(99,102,241,0.3)" : "1px solid transparent", color: activeTab === t ? "#818cf8" : "#475569", fontSize: 13, fontWeight: 700, cursor: "pointer", textTransform: "capitalize" }}>{t === "about" ? "📋 About" : `⭐ Reviews (${topper.reviews.length})`}</button>
        ))}
      </div>

      {/* About Tab */}
      {activeTab === "about" && (
        <div style={{ padding: "0 14px", animation: "fadeUp 0.25s ease" }}>
          <div className="card" style={{ marginBottom: 14 }}>
            <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5 }}>About</p>
            <p style={{ margin: 0, fontSize: 14, color: "#94a3b8", lineHeight: 1.75 }}>{topper.bio}</p>
          </div>
          <div className="card" style={{ marginBottom: 14 }}>
            <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5 }}>Details</p>
            {[{ label: "Exam Cleared", value: topper.exam },{ label: "Rank", value: topper.rank },{ label: "Year", value: `${topper.year} · ${topper.branch}` },{ label: "College", value: topper.college }].map(d => (
              <div key={d.label} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <span style={{ fontSize: 13, color: "#64748b" }}>{d.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{d.value}</span>
              </div>
            ))}
          </div>
          <div className="card" style={{ marginBottom: 14 }}>
            <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5 }}><BookOpen size={12} style={{ display: "inline", marginRight: 4 }} />Teaches</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {topper.subjects.map(s => <span key={s} style={{ background: `rgba(${topper.tag==="IIT"?"99,102,241":topper.tag==="NIT"?"34,197,94":"14,165,233"},0.1)`, border: `1px solid ${tagColor}30`, borderRadius: 50, padding: "5px 14px", fontSize: 12, fontWeight: 700, color: tagColor }}>{s}</span>)}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 14, padding: "12px 16px", marginBottom: 14 }}>
            <CheckCircle size={18} color="#22c55e" />
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#4ade80" }}>Verified Topper</p>
              <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>Identity & college verified by TopperTalks team</p>
            </div>
          </div>
        </div>
      )}

      {/* Reviews Tab */}
      {activeTab === "reviews" && (
        <div style={{ padding: "0 14px", animation: "fadeUp 0.25s ease" }}>
          {topper.reviews.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}><p style={{ fontSize: 40, marginBottom: 12 }}>⭐</p><p style={{ fontSize: 14, color: "#475569" }}>No reviews yet — be the first!</p></div>
          ) : topper.reviews.map((r, i) => (
            <div key={i} className="card" style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, color: "#fff" }}>{r.student[0]}</div>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{r.student}</p>
                    <p style={{ margin: 0, fontSize: 11, color: "#475569" }}>{r.time}</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 1 }}>{[1,2,3,4,5].map(n => <span key={n} style={{ fontSize: 13, opacity: n <= r.stars ? 1 : 0.2 }}>⭐</span>)}</div>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: "#94a3b8", lineHeight: 1.7 }}>{r.comment}</p>
            </div>
          ))}
        </div>
      )}

      {/* Sticky Bottom CTA */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, padding: "16px 14px 24px", background: "linear-gradient(to top, #0d1117 70%, transparent)", display: "flex", gap: 10 }}>
        <button onClick={() => navigate(`/messages/${topper.id}`)} style={{ width: 52, height: 52, borderRadius: 16, background: "#161b27", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#818cf8", cursor: "pointer", flexShrink: 0 }}><MessageCircle size={20} /></button>
        <button onClick={() => navigate(`/messages/${topper.id}`)} style={{ flex: 1, padding: 15, borderRadius: 16, background: "linear-gradient(135deg,#22c55e,#16a34a)", border: "none", color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 6px 24px rgba(34,197,94,0.45)" }}><Phone size={18} /> Voice Call</button>
        <button onClick={() => navigate(`/messages/${topper.id}`)} style={{ flex: 1, padding: 15, borderRadius: 16, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 6px 24px rgba(99,102,241,0.45)" }}><Video size={18} /> Video Call</button>
      </div>
    </div>
  );
}
