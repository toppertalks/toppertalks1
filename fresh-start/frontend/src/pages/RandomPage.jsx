import React, { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { History, X, Video, RefreshCw, CheckCircle, Star, PhoneOff } from "lucide-react";
import BottomNav from "../components/ui/BottomNav";
import LoginModal from "../components/ui/LoginModal";
import { isLoggedIn } from "../lib/auth-guard";

const TOPPERS = [
  { id: "1", name: "Ananya Sharma", college: "IIT Bombay", tag: "IIT", subjects: ["Physics", "Maths"], rating: 4.9, ratePerMinute: 10, sessions: 312, avatarUrl: "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg", isOnline: true },
  { id: "2", name: "Rohan Mehta", college: "AIIMS Delhi", tag: "AIIMS", subjects: ["Biology", "Anatomy"], rating: 4.8, ratePerMinute: 10, sessions: 189, avatarUrl: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg", isOnline: true },
  { id: "3", name: "Priya Krishnan", college: "IIT Delhi", tag: "IIT", subjects: ["Chemistry", "Organic"], rating: 4.95, ratePerMinute: 10, sessions: 428, avatarUrl: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg", isOnline: true },
  { id: "4", name: "Arjun Verma", college: "NIT Trichy", tag: "NIT", subjects: ["Maths", "Integration"], rating: 4.7, ratePerMinute: 10, sessions: 201, avatarUrl: "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg", isOnline: true },
  { id: "5", name: "Meera Rao", college: "IIT Madras", tag: "IIT", subjects: ["Physics", "Mechanics"], rating: 4.85, ratePerMinute: 10, sessions: 376, avatarUrl: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg", isOnline: false },
  { id: "6", name: "Karan Sharma", college: "IIT Kharagpur", tag: "IIT", subjects: ["Maths", "Algebra"], rating: 4.78, ratePerMinute: 10, sessions: 254, avatarUrl: "https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg", isOnline: true },
];

const TAG_COLORS = { IIT: "#6366f1", AIIMS: "#0ea5e9", NIT: "#10b981" };
const SPIN_DELAYS = [65,65,65,65,65,70,70,75,80,85,95,110,130,160,200,260,340,450,580];

export default function RandomPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState("idle");
  const [displayIdx, setDisplayIdx] = useState(0);
  const [matchedTopper, setMatchedTopper] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [permDenied, setPermDenied] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const frameRef = useRef(0);

  const startSpin = useCallback(() => {
    setPhase("spinning"); setMatchedTopper(null); frameRef.current = 0;
    function tick() {
      setDisplayIdx(i => (i + 1) % TOPPERS.length);
      const next = frameRef.current + 1; frameRef.current = next;
      if (next < SPIN_DELAYS.length) { setTimeout(tick, SPIN_DELAYS[next]); }
      else {
        const winner = TOPPERS[Math.floor(Math.random() * TOPPERS.length)];
        setMatchedTopper(winner);
        setDisplayIdx(TOPPERS.findIndex(t => t.id === winner.id));
        setPhase("matched");
      }
    }
    setTimeout(tick, SPIN_DELAYS[0]);
  }, []);

  const handleContinue = useCallback(async () => {
    if (!matchedTopper) return;
    if (!isLoggedIn()) { setShowLoginModal(true); return; }
    setPermDenied(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: true });
      stream.getTracks().forEach(t => t.stop());
      setHistory(h => [{ ...matchedTopper, calledAt: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) }, ...h]);
      setPhase("calling");
      setTimeout(() => navigate(`/messages/${matchedTopper.id}`), 3000);
    } catch { setPermDenied(true); }
  }, [matchedTopper, navigate]);

  const currentPhoto = TOPPERS[displayIdx];

  return (
    <div className="page" style={{ paddingBottom: 72, overflow: "hidden" }}>
      {/* Stars */}
      {[5,14,28,42,60,75,88,96,3,18,35,52,68,82,93,9,24,47,63,79,91,6,33,58,84].map((l, i) => (
        <div key={i} aria-hidden style={{ position: "absolute", left: `${l}%`, top: `${8+i*3.5}%`, width: i%3===0?1.8:1.2, height: i%3===0?1.8:1.2, borderRadius: "50%", background: "#fff", animation: `twinkle ${2+i%4*0.4}s ${i*0.3}s ease-in-out infinite`, zIndex: 1, pointerEvents: "none" }} />
      ))}

      {/* Header */}
      <header style={{ position: "relative", zIndex: 20, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px 10px", background: "rgba(13,17,23,0.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(99,102,241,0.15)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(99,102,241,0.5)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 3L2 8.5L12 14L22 8.5L12 3Z" fill="white" fillOpacity="0.9" /><path d="M7 11V17C7 17 9 20 12 20C15 20 17 17 17 17V11" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" /></svg>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontWeight: 800, fontSize: 17, color: "#fff" }}>Topper<span style={{ background: "linear-gradient(90deg,#818cf8,#c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Talks</span></span>
            <span style={{ fontSize: 9, color: "#94a3b8", letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 600 }}>FIND YOUR MENTOR</span>
          </div>
        </div>
        <button onClick={() => setShowHistory(true)} style={{ position: "relative", width: 40, height: 40, borderRadius: 12, background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)", color: "#818cf8", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <History size={18} />
          {history.length > 0 && <div style={{ position: "absolute", top: -4, right: -4, background: "#ef4444", borderRadius: "50%", width: 16, height: 16, fontSize: 9, fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #0d1117" }}>{history.length}</div>}
        </button>
      </header>

      {/* IDLE */}
      {phase === "idle" && (
        <div style={{ position: "relative", zIndex: 5, flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", gap: 24 }}>
          <div style={{ position: "relative", width: 260, height: 260 }}>
            {TOPPERS.slice(0, 4).map((t, i) => {
              const positions = [{ top: 0, left: 0 }, { top: 0, right: 0 }, { bottom: 0, left: 0 }, { bottom: 0, right: 0 }];
              return (<div key={t.id} style={{ position: "absolute", ...positions[i], width: 120, height: 120, borderRadius: 16, overflow: "hidden", border: "2px solid rgba(99,102,241,0.3)", opacity: 0.7 }}><img src={t.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} /></div>);
            })}
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", animation: "pulse 2s infinite", zIndex: 2, fontSize: 28 }}>🎲</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#e2e8f0", lineHeight: 1.2 }}>Get Matched with a<br /><span style={{ background: "linear-gradient(90deg,#818cf8,#c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Verified IIT Topper</span></h1>
            <p style={{ margin: "10px 0 0", fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>Our system instantly matches you with the<br />best available mentor for your subject.</p>
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px #22c55e", display: "inline-block" }} /><span style={{ fontSize: 13, fontWeight: 700, color: "#4ade80" }}>4,731 online</span></div>
            <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.1)" }} />
            <span style={{ fontSize: 13, color: "#64748b" }}>⚡ Avg match: 8s</span>
          </div>
          <button onClick={startSpin} className="btn-primary" style={{ width: "100%", padding: "18px 0", fontSize: 17, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}><span style={{ fontSize: 22 }}>🎯</span>Find My Topper</button>
          <p style={{ margin: 0, fontSize: 11, color: "#334155", textAlign: "center" }}>₹50 for your first session · Then ₹10–₹50/min<br />No booking needed · Cancel anytime</p>
        </div>
      )}

      {/* SPINNING */}
      {phase === "spinning" && (
        <div style={{ position: "relative", zIndex: 5, flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", gap: 20 }}>
          <div style={{ textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 14, color: "#818cf8", fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>Matching you with</p>
            <h2 style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 800, color: "#e2e8f0" }}>the perfect topper...</h2>
          </div>
          <div style={{ position: "relative", width: 220, height: 280, borderRadius: 24, overflow: "hidden", border: "3px solid #6366f1", boxShadow: "0 0 32px rgba(99,102,241,0.6), 0 0 64px rgba(99,102,241,0.3)" }}>
            <img src={currentPhoto.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", filter: "blur(3px) brightness(0.7)", transition: "filter 0.05s" }} />
            <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg,rgba(0,0,0,0.1),rgba(0,0,0,0.1) 2px,transparent 2px,transparent 4px)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(99,102,241,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, animation: "spin 0.8s linear infinite" }}>🎓</div>
            </div>
          </div>
          <div style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 14, padding: "10px 24px", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#a5b4fc", animation: "blink 0.2s ease-in-out infinite" }}>{currentPhoto.name}</p>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "#475569" }}>{currentPhoto.college}</p>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {[0,1,2].map(i => (<div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#6366f1", opacity: 0.4+(i*0.3), animation: `blink 0.8s ${i*0.27}s ease-in-out infinite` }} />))}
          </div>
        </div>
      )}

      {/* MATCHED */}
      {phase === "matched" && matchedTopper && (
        <div style={{ position: "relative", zIndex: 5, flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 20px 0", gap: 16 }}>
          <div style={{ background: "linear-gradient(90deg,rgba(34,197,94,0.12),rgba(99,102,241,0.12))", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 50, padding: "6px 20px", display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircle size={14} color="#22c55e" />
            <span style={{ fontSize: 13, fontWeight: 800, color: "#4ade80" }}>Topper Matched! 🎉</span>
          </div>
          <div style={{ width: "100%", maxWidth: 300, borderRadius: 24, overflow: "hidden", position: "relative", height: 320, animation: "matchReveal 0.6s ease-out forwards", boxShadow: "0 0 0 3px #22c55e, 0 0 40px rgba(34,197,94,0.5), 0 8px 40px rgba(0,0,0,0.5)" }}>
            <img src={matchedTopper.avatarUrl} alt={matchedTopper.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(13,17,23,0.95) 0%,rgba(13,17,23,0.3) 55%,transparent 70%)" }} />
            <div style={{ position: "absolute", top: 14, right: 14, background: TAG_COLORS[matchedTopper.tag] || "#6366f1", borderRadius: 10, padding: "3px 10px", fontSize: 10, fontWeight: 800, color: "#fff" }}>🏛️ {matchedTopper.tag}</div>
            <div style={{ position: "absolute", top: 14, left: 14, display: "flex", alignItems: "center", gap: 5, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)", borderRadius: 20, padding: "3px 10px" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", display: "inline-block", boxShadow: "0 0 6px #22c55e" }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: "#fff" }}>Online</span>
            </div>
            <div style={{ position: "absolute", bottom: 16, left: 16, right: 16 }}>
              <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: "#fff" }}>{matchedTopper.name}</h2>
              <p style={{ margin: "3px 0 0", fontSize: 12, color: "#94a3b8" }}>{matchedTopper.college}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6 }}>
                {[1,2,3,4,5].map(n => <Star key={n} size={11} fill="#fbbf24" color="#fbbf24" />)}
                <span style={{ fontSize: 11, color: "#fbbf24", fontWeight: 700 }}>{matchedTopper.rating}</span>
                <span style={{ fontSize: 10, color: "#475569" }}>· {matchedTopper.sessions} sessions</span>
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                {matchedTopper.subjects.map(s => (<span key={s} style={{ background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 50, padding: "2px 10px", fontSize: 10, fontWeight: 600, color: "#a5b4fc" }}>{s}</span>))}
                <span style={{ background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 50, padding: "2px 10px", fontSize: 10, fontWeight: 700, color: "#818cf8" }}>₹50 / 5 min</span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, width: "100%", maxWidth: 360, paddingTop: 4 }}>
            {permDenied && (
              <div style={{ width: "100%", maxWidth: 360, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 14, padding: "12px 16px" }}>
                <p style={{ margin: 0, fontSize: 12, color: "#f87171", fontWeight: 700 }}>⚠️ Camera/Mic access denied</p>
                <p style={{ margin: "4px 0 0", fontSize: 11, color: "#94a3b8", lineHeight: 1.5 }}>Please allow camera and microphone in your browser settings, then try again.</p>
                <button onClick={() => setPermDenied(false)} style={{ marginTop: 8, padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", cursor: "pointer" }}>Dismiss</button>
              </div>
            )}
            <button onClick={startSpin} style={{ flex: 1, padding: "14px 0", borderRadius: 16, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}><RefreshCw size={15} />Match Again</button>
            <button onClick={handleContinue} style={{ flex: 2, padding: "14px 0", borderRadius: 16, background: "linear-gradient(135deg,#22c55e,#16a34a)", border: "none", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 6px 24px rgba(34,197,94,0.5)" }}><Video size={16} strokeWidth={2.5} />Start Video Call</button>
          </div>
        </div>
      )}

      {/* CALLING */}
      {phase === "calling" && matchedTopper && (
        <div style={{ position: "relative", zIndex: 5, flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", gap: 20, textAlign: "center" }}>
          <div style={{ width: 100, height: 100, borderRadius: 24, overflow: "hidden", boxShadow: "0 0 0 4px #22c55e, 0 0 40px rgba(34,197,94,0.6)", animation: "callRing 1s ease-in-out infinite" }}>
            <img src={matchedTopper.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#e2e8f0" }}>Connecting to {matchedTopper.name}...</h2>
            <p style={{ margin: "6px 0 0", fontSize: 13, color: "#64748b" }}>{matchedTopper.college}</p>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", animation: `blink 0.7s ${i*0.25}s ease-in-out infinite` }} />)}
          </div>
          <p style={{ color: "#22c55e", fontWeight: 700, fontSize: 14, margin: 0 }}>✅ Added to history</p>
          <button onClick={() => setPhase("idle")} style={{ padding: "12px 32px", borderRadius: 14, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Cancel Call</button>
        </div>
      )}

      {/* HISTORY DRAWER */}
      {showHistory && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <div onClick={() => setShowHistory(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }} />
          <div style={{ position: "relative", zIndex: 1, background: "#13192b", borderRadius: "24px 24px 0 0", border: "1px solid rgba(99,102,241,0.2)", maxHeight: "70vh", display: "flex", flexDirection: "column", animation: "slideSheet 0.32s ease-out" }}>
            <div style={{ padding: "16px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#e2e8f0" }}>📋 Session History</h3>
              <button onClick={() => setShowHistory(false)} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "none", color: "#94a3b8", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X size={16} /></button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
              {history.length === 0 ? (
                <div style={{ padding: "40px 20px", textAlign: "center", color: "#475569" }}>
                  <p style={{ fontSize: 32, margin: "0 0 10px" }}>📭</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#64748b" }}>No sessions yet</p>
                  <p style={{ fontSize: 11 }}>Successfully connected calls appear here</p>
                </div>
              ) : history.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <img src={item.avatarUrl} alt="" style={{ width: 46, height: 46, borderRadius: 12, objectFit: "cover", objectPosition: "top" }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{item.name}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748b" }}>{item.college}</p>
                    <p style={{ margin: "3px 0 0", fontSize: 10, color: "#475569" }}>Called at {item.calledAt}</p>
                  </div>
                  <div style={{ background: `${TAG_COLORS[item.tag]||"#6366f1"}22`, border: `1px solid ${TAG_COLORS[item.tag]||"#6366f1"}44`, borderRadius: 8, padding: "3px 8px", fontSize: 10, fontWeight: 700, color: TAG_COLORS[item.tag]||"#6366f1" }}>{item.tag}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showLoginModal && <LoginModal reason="connect with a mentor" returnTo={matchedTopper ? `/messages/${matchedTopper.id}` : "/random"} onClose={() => setShowLoginModal(false)} />}
      <BottomNav active="random" />
    </div>
  );
}
