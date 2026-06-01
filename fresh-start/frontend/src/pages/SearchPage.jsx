import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Star, Clock } from "lucide-react";
import BottomNav from "../components/ui/BottomNav";

const ALL_TOPPERS = [
  { id: "1", name: "Ananya Sharma", college: "IIT Bombay", tag: "IIT", subjects: ["Physics", "Maths", "Mechanics"], rating: 4.9, sessions: 312, avatarUrl: "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg", isOnline: true, rank: "AIR 427" },
  { id: "2", name: "Rohan Mehta", college: "AIIMS Delhi", tag: "AIIMS", subjects: ["Biology", "Chemistry", "Physiology"], rating: 4.8, sessions: 198, avatarUrl: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg", isOnline: false, rank: "AIR 89" },
  { id: "3", name: "Priya Kapoor", college: "IIT Delhi", tag: "IIT", subjects: ["Maths", "Chemistry", "Organic Chemistry"], rating: 4.7, sessions: 145, avatarUrl: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg", isOnline: true, rank: "AIR 312" },
  { id: "4", name: "Arjun Verma", college: "NIT Trichy", tag: "NIT", subjects: ["Physics", "Mechanics", "Fluid Dynamics"], rating: 4.6, sessions: 87, avatarUrl: "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg", isOnline: true, rank: "AIR 2140" },
  { id: "5", name: "Meera Rajan", college: "IIT Madras", tag: "IIT", subjects: ["Chemistry", "Maths", "Physical Chemistry"], rating: 4.9, sessions: 256, avatarUrl: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg", isOnline: true, rank: "AIR 198" },
  { id: "6", name: "Karan Sharma", college: "NIT Surathkal", tag: "NIT", subjects: ["Maths", "Physics"], rating: 4.5, sessions: 62, avatarUrl: "https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg", isOnline: false, rank: "AIR 3210" },
  { id: "7", name: "Divya Pillai", college: "AIIMS Bhopal", tag: "AIIMS", subjects: ["Biology", "Botany", "Zoology"], rating: 4.8, sessions: 178, avatarUrl: "https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg", isOnline: true, rank: "AIR 412" },
  { id: "8", name: "Siddharth Anand", college: "IIT Kharagpur", tag: "IIT", subjects: ["Maths", "Physics", "Programming"], rating: 4.7, sessions: 134, avatarUrl: "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg", isOnline: true, rank: "AIR 581" },
];

const POPULAR_SEARCHES = ["Maths", "Physics", "Biology", "Chemistry", "IIT Bombay", "AIIMS", "Organic Chemistry", "Mechanics"];
const TAG_COLORS = { IIT: "#6366f1", NIT: "#22c55e", AIIMS: "#0ea5e9" };

function TopperRow({ topper, onClick }) {
  const tagColor = TAG_COLORS[topper.tag] ?? "#6366f1";
  return (
    <div onClick={onClick} className="card" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10, cursor: "pointer", transition: "border-color 0.15s" }}>
      <div style={{ position: "relative", flexShrink: 0 }}>
        <img src={topper.avatarUrl} alt={topper.name} style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", objectPosition: "top", border: `2px solid ${tagColor}50` }} />
        <div style={{ position: "absolute", bottom: 1, right: 1, width: 12, height: 12, borderRadius: "50%", background: topper.isOnline ? "#22c55e" : "#334155", border: "2px solid #161b27" }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#e2e8f0" }}>{topper.name}</p>
          <span className={`tag tag-${topper.tag.toLowerCase()}`}>{topper.tag}</span>
        </div>
        <p style={{ margin: "0 0 4px", fontSize: 11, color: "#64748b" }}>{topper.college} · {topper.rank}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: "#94a3b8" }}>
            <Star size={10} fill="#fbbf24" color="#fbbf24" /> {topper.rating}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: "#94a3b8" }}>
            <Clock size={10} /> {topper.sessions} sessions
          </span>
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <p style={{ margin: "0 0 3px", fontSize: 12, fontWeight: 800, color: "#818cf8" }}>₹50/5min</p>
        <p style={{ margin: 0, fontSize: 10, color: topper.isOnline ? "#4ade80" : "#475569", fontWeight: 600 }}>
          {topper.isOnline ? "● Online" : "○ Offline"}
        </p>
      </div>
    </div>
  );
}

export default function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return ALL_TOPPERS.filter((t) =>
      t.name.toLowerCase().includes(q) || t.college.toLowerCase().includes(q) || t.tag.toLowerCase().includes(q) || t.subjects.some((s) => s.toLowerCase().includes(q))
    ).sort((a, b) => Number(b.isOnline) - Number(a.isOnline));
  }, [query]);

  return (
    <div className="page">
      <div style={{ padding: "56px 16px 16px", background: "linear-gradient(180deg,#13192b,#0d1117)", borderBottom: "1px solid rgba(99,102,241,0.1)" }}>
        <h1 style={{ margin: "0 0 16px", fontSize: 22, fontWeight: 900, color: "#e2e8f0" }}>🔍 Find Toppers</h1>
        <div className={`search-bar ${focused ? "focused" : ""}`}>
          <Search size={18} color={focused ? "#6366f1" : "#475569"} style={{ flexShrink: 0 }} />
          <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} placeholder="Search by name, subject, or college..." />
          {query && <button className="search-clear" onClick={() => setQuery("")}><X size={13} /></button>}
        </div>
      </div>
      <div style={{ padding: "16px 14px" }}>
        {!query && (
          <div style={{ animation: "fadeUp 0.3s ease" }}>
            <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.6 }}>Popular Searches</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>
              {POPULAR_SEARCHES.map((s) => (
                <button key={s} onClick={() => setQuery(s)} style={{ padding: "7px 14px", borderRadius: 50, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", color: "#818cf8", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{s}</button>
              ))}
            </div>
            <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.6 }}>🟢 Online Now</p>
            {ALL_TOPPERS.filter((t) => t.isOnline).slice(0, 3).map((t) => (
              <TopperRow key={t.id} topper={t} onClick={() => navigate(`/topperprofile/${t.id}`)} />
            ))}
          </div>
        )}
        {query && (
          <div style={{ animation: "fadeUp 0.2s ease" }}>
            <p style={{ margin: "0 0 14px", fontSize: 13, color: "#475569" }}>
              {results.length} result{results.length !== 1 ? "s" : ""} for "<strong style={{ color: "#818cf8" }}>{query}</strong>"
            </p>
            {results.length === 0 ? (
              <div className="empty-state">
                <p className="empty-state-emoji">🔍</p>
                <p style={{ fontSize: 14, color: "#475569" }}>No toppers found for "{query}"</p>
                <p style={{ fontSize: 12, color: "#334155" }}>Try searching by subject like "Maths" or "Biology"</p>
              </div>
            ) : (
              results.map((t) => <TopperRow key={t.id} topper={t} onClick={() => navigate(`/topperprofile/${t.id}`)} />)
            )}
          </div>
        )}
      </div>
      <BottomNav active="search" />
    </div>
  );
}
