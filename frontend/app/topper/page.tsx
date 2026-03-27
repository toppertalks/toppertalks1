"use client";
import { useState, useEffect, useRef } from "react";
import {
    Power, Phone, Video, Star, IndianRupee, TrendingUp,
    Clock, BookOpen, Bell, Settings, ChevronRight,
    CheckCircle, XCircle, Wifi, WifiOff, BarChart3,
    ArrowDownRight, User, PhoneOff
} from "lucide-react";

/* ── Mock Data ── */
const TOPPER = {
    name: "Ananya Sharma",
    college: "IIT Bombay",
    tag: "IIT",
    subjects: ["Physics", "Maths", "Mechanics"],
    rate: 10,          // ₹10/min fixed for all toppers
    topperCut: 6,      // ₹6 to topper per min
    platformCut: 4,    // ₹4 platform fee per min
    minCharge: 50,     // ₹50 flat covers first 5 min (min booking)
    rating: 4.9,
    totalSessions: 312,
    avatarUrl: "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg",
    todayEarnings: 1260,
    todaySessions: 7,
    weeklyEarnings: 8400,
    pendingPayout: 5040,
    walletBalance: 5040
};

const RECENT_SESSIONS = [
    { id: "1", student: "Rahul Gupta", subject: "Rotational Dynamics", duration: 28, earned: 168, time: "12:40 PM", rating: 5 },
    { id: "2", student: "Prerna Singh", subject: "Electrostatics", duration: 15, earned: 90, time: "10:15 AM", rating: 5 },
    { id: "3", student: "Aditya Kumar", subject: "Integration", duration: 22, earned: 132, time: "9:00 AM", rating: 4 },
    { id: "4", student: "Nisha Verma", subject: "Thermodynamics", duration: 31, earned: 186, time: "Yesterday", rating: 5 },
];

const INCOMING_STUDENT = {
    id: "1",  // matches /messages/1 — Zegocloud room tt_1
    name: "Rahul Sharma",
    class: "Class 12 · JEE 2026",
    subject: "Rotational Dynamics",
    avatar: "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg",
    callType: "video" as "video" | "audio"
};

/* ── Bottom nav for Topper ── */
type Tab = "dashboard" | "sessions" | "earnings" | "settings";

function TopperNav({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
    const items: { key: Tab; label: string; icon: React.ReactNode }[] = [
        { key: "dashboard", label: "Dashboard", icon: <Power size={20} /> },
        { key: "sessions", label: "Sessions", icon: <Clock size={20} /> },
        { key: "earnings", label: "Earnings", icon: <IndianRupee size={20} /> },
        { key: "settings", label: "Settings", icon: <Settings size={20} /> },
    ];
    return (
        <nav style={{
            position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
            width: "100%", maxWidth: 480, zIndex: 40,
            background: "rgba(13,17,23,0.95)", backdropFilter: "blur(20px)",
            borderTop: "1px solid rgba(99,102,241,0.15)"
        }}>
            <div style={{ display: "flex" }}>
                {items.map(item => {
                    const on = item.key === active;
                    return (
                        <button key={item.key} onClick={() => onChange(item.key)} style={{
                            flex: 1, padding: "10px 0 12px", background: "none", border: "none",
                            color: on ? "#818cf8" : "#334155", cursor: "pointer",
                            display: "flex", flexDirection: "column", alignItems: "center", gap: 3
                        }}>
                            {on && <div style={{
                                width: 24, height: 2.5, background: "linear-gradient(90deg,#6366f1,#8b5cf6)",
                                borderRadius: 2, marginBottom: 2
                            }} />}
                            {item.icon}
                            <span style={{ fontSize: 9, fontWeight: on ? 800 : 500 }}>{item.label}</span>
                        </button>);
                })}
            </div>
        </nav>
    );
}

export default function TopperDashboard() {
    const [isOnline, setIsOnline] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>("dashboard");
    const [showIncoming, setShowIncoming] = useState(false);
    const [ringCount, setRingCount] = useState(30);
    const [callAccepted, setCallAccepted] = useState(false);
    const [showPayout, setShowPayout] = useState(false);
    // Topper call management
    const [callSecs, setCallSecs] = useState(0);
    const [showTopperEndConfirm, setShowTopperEndConfirm] = useState(false);
    const [showTopperReport, setShowTopperReport] = useState(false);
    const [topperReportConfirm, setTopperReportConfirm] = useState(false);
    const [showTopperRating, setShowTopperRating] = useState(false);
    const [topperRatingStar, setTopperRatingStar] = useState(0);
    const [topperRatingDone, setTopperRatingDone] = useState(false);
    const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    // Zegocloud refs (topper side)
    const zegoTopperSessionRef = useRef<{ zg: any; localStream: MediaStream | null; streamID: string; roomID: string } | null>(null);
    const topperRemoteAudioRef = useRef<HTMLAudioElement | null>(null);
    const topperLocalVideoRef = useRef<HTMLVideoElement | null>(null);
    const topperRemoteVideoRef = useRef<HTMLVideoElement | null>(null);
    const [studentJoined, setStudentJoined] = useState(false);

    // Simulate incoming call after 4s if online
    useEffect(() => {
        if (!isOnline) return;
        const t = setTimeout(() => setShowIncoming(true), 4000);
        return () => clearTimeout(t);
    }, [isOnline]);

    // Ring countdown
    useEffect(() => {
        if (!showIncoming) { setRingCount(30); return; }
        if (ringCount <= 0) { setShowIncoming(false); return; }
        const t = setInterval(() => setRingCount(n => n - 1), 1000);
        return () => clearInterval(t);
    }, [showIncoming, ringCount]);

    // Cleanup Zegocloud on unmount
    useEffect(() => {
        return () => {
            if (zegoTopperSessionRef.current) {
                import("../../lib/zego").then(({ stopZegoCall }) => {
                    if (zegoTopperSessionRef.current) stopZegoCall(zegoTopperSessionRef.current);
                });
            }
        };
    }, []);

    const acceptCall = () => {
        setCallAccepted(true); setShowIncoming(false); setCallSecs(0); setStudentJoined(false);
        callTimerRef.current = setInterval(() => setCallSecs(s => s + 1), 1000);
        // 🔴 Join Zegocloud room as topper (same roomID the student is in)
        import("../../lib/zego").then(({ startZegoCall }) => {
            startZegoCall({
                conversationId: INCOMING_STUDENT.id, // matches student's conversation route
                role: "topper",
                isVideo: false, // audio-first by default; can expand to video
                remoteAudioEl: topperRemoteAudioRef.current,
                remoteVideoEl: topperRemoteVideoRef.current,
                onRemoteUserJoined: () => setStudentJoined(true),
            }).then(session => {
                zegoTopperSessionRef.current = session;
            }).catch(err => console.warn("Topper Zegocloud error:", err));
        });
    };
    const declineCall = () => { setShowIncoming(false); };

    const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

    const topperEarned = callSecs < 300 ? 0 : Math.ceil((callSecs - 300) / 60) * TOPPER.topperCut;
    // Toppers only earn after first 5 min plateau from the min ₹50 (they get ₹30 from min charge)
    const topperMinEarned = Math.min(Math.round((callSecs / 300) * 30), 30);
    const totalTopperEarned = topperMinEarned + topperEarned;

    const endTopperCall = () => {
        if (callTimerRef.current) clearInterval(callTimerRef.current);
        // Cleanup Zegocloud
        if (zegoTopperSessionRef.current) {
            import("../../lib/zego").then(({ stopZegoCall }) => {
                if (zegoTopperSessionRef.current) stopZegoCall(zegoTopperSessionRef.current);
                zegoTopperSessionRef.current = null;
            });
        }
        setCallAccepted(false); setShowTopperEndConfirm(false); setStudentJoined(false);
        setTimeout(() => { setShowTopperRating(true); setTopperRatingStar(0); setTopperRatingDone(false); }, 400);
    };

    return (
        <div style={{
            minHeight: "100vh", maxWidth: 480, margin: "0 auto",
            background: "#0d1117", display: "flex", flexDirection: "column", paddingBottom: 72
        }}>
            <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        @keyframes ring{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
        @keyframes callPulse{0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,.5)}60%{box-shadow:0 0 0 24px rgba(34,197,94,0)}}
        @keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

            {/* ── HEADER ── */}
            <header style={{
                background: "linear-gradient(180deg,#13192b,#0d1117)",
                borderBottom: "1px solid rgba(99,102,241,0.15)",
                padding: "14px 16px", position: "sticky", top: 0, zIndex: 30
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ position: "relative", flexShrink: 0 }}>
                        <img src={TOPPER.avatarUrl} alt="" style={{
                            width: 44, height: 44, borderRadius: "50%", objectFit: "cover", objectPosition: "top",
                            border: `2px solid ${isOnline ? "#22c55e" : "rgba(255,255,255,0.15)"}`
                        }} />
                        <div style={{
                            position: "absolute", bottom: 0, right: 0, width: 13, height: 13, borderRadius: "50%",
                            background: isOnline ? "#22c55e" : "#334155", border: "2px solid #0d1117",
                            boxShadow: isOnline ? "0 0 8px #22c55e" : "none"
                        }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#e2e8f0" }}>{TOPPER.name}</p>
                        <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>{TOPPER.college} · ₹50 / 5 min</p>
                    </div>
                    <button style={{
                        width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)", color: "#475569",
                        display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
                    }}><Bell size={17} /></button>
                </div>
            </header>

            {/* ─── DASHBOARD TAB ─── */}
            {activeTab === "dashboard" && (
                <main style={{ flex: 1, overflowY: "auto", padding: "16px 14px 0" }}>

                    {/* BIG ONLINE TOGGLE */}
                    <div style={{
                        borderRadius: 24, padding: "24px 20px", marginBottom: 16, textAlign: "center",
                        background: isOnline
                            ? "linear-gradient(135deg,rgba(22,163,74,0.15),rgba(34,197,94,0.08))"
                            : "linear-gradient(135deg,#161b27,#13192b)",
                        border: `1.5px solid ${isOnline ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.06)"}`,
                        boxShadow: isOnline ? "0 0 40px rgba(34,197,94,0.15)" : "none",
                        transition: "all 0.4s ease"
                    }}>
                        <p style={{ margin: "0 0 6px", fontSize: 12, color: "#475569", textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 700 }}>
                            {isOnline ? "🟢 You are online" : "🔴 You are offline"}
                        </p>
                        <p style={{ margin: "0 0 20px", fontSize: 13, color: isOnline ? "#4ade80" : "#64748b", fontWeight: 600, lineHeight: 1.5 }}>
                            {isOnline ? "Students can see and call you right now!" : "Toggle on to start receiving calls and earning"}
                        </p>

                        {/* Toggle button */}
                        <button onClick={() => setIsOnline(o => !o)} style={{
                            width: 72, height: 72, borderRadius: "50%", cursor: "pointer",
                            background: isOnline
                                ? "linear-gradient(135deg,#22c55e,#16a34a)"
                                : "rgba(255,255,255,0.08)",
                            border: isOnline ? "none" : "1.5px solid rgba(255,255,255,0.12)",
                            boxShadow: isOnline ? "0 0 30px rgba(34,197,94,0.5)" : "none",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            margin: "0 auto", transition: "all 0.3s ease",
                            animation: isOnline ? "callPulse 2s ease-in-out infinite" : "none"
                        }}>
                            <Power size={30} color={isOnline ? "#fff" : "#475569"} />
                        </button>

                        {isOnline && (
                            <div style={{ marginTop: 16, display: "flex", gap: 8, justifyContent: "center" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#4ade80" }}>
                                    <div style={{
                                        width: 6, height: 6, borderRadius: "50%", background: "#22c55e",
                                        animation: "pulse 1s ease-in-out infinite"
                                    }} />
                                    4,731 students browsing
                                </div>
                            </div>
                        )}
                    </div>

                    {/* CALL ACCEPTED — Active session indicator */}
                    {callAccepted && (
                        <div style={{
                            borderRadius: 20, padding: "16px", marginBottom: 16,
                            background: "linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.15))",
                            border: "1.5px solid rgba(99,102,241,0.4)"
                        }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div>
                                    <p style={{ margin: 0, fontSize: 12, color: "#818cf8", fontWeight: 700 }}>📞 ACTIVE CALL</p>
                                    <p style={{ margin: "4px 0 0", fontSize: 15, fontWeight: 800, color: "#e2e8f0" }}>{INCOMING_STUDENT.name}</p>
                                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748b" }}>{INCOMING_STUDENT.subject} · ₹{TOPPER.rate}/min</p>
                                </div>
                                <button onClick={() => setCallAccepted(false)} style={{
                                    width: 48, height: 48, borderRadius: "50%",
                                    background: "linear-gradient(135deg,#ef4444,#dc2626)",
                                    border: "none", color: "#fff", cursor: "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    boxShadow: "0 4px 16px rgba(239,68,68,0.5)"
                                }}><PhoneOff size={20} /></button>
                            </div>
                        </div>
                    )}

                    {/* TODAY'S STATS */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                        {[
                            { label: "Today's Earnings", val: `₹${TOPPER.todayEarnings}`, icon: "💰", color: "#22c55e" },
                            { label: "Sessions Today", val: TOPPER.todaySessions, icon: "📞", color: "#818cf8" },
                            { label: "This Week", val: `₹${TOPPER.weeklyEarnings.toLocaleString()}`, icon: "📈", color: "#f59e0b" },
                            { label: "Rating", val: `⭐ ${TOPPER.rating}`, icon: "⭐", color: "#fbbf24" },
                        ].map(s => (
                            <div key={s.label} style={{
                                background: "#161b27", border: "1px solid rgba(255,255,255,0.05)",
                                borderRadius: 18, padding: "14px"
                            }}>
                                <p style={{ margin: "0 0 4px", fontSize: 20 }}>{s.icon}</p>
                                <p style={{ margin: "0 0 2px", fontSize: 18, fontWeight: 900, color: s.color }}>{s.val}</p>
                                <p style={{ margin: 0, fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* PAYOUT CARD */}
                    <div style={{
                        borderRadius: 20, padding: "16px 18px", marginBottom: 12,
                        background: "linear-gradient(135deg,#1e1b4b,#312e81)",
                        border: "1px solid rgba(99,102,241,0.3)",
                        display: "flex", alignItems: "center", justifyContent: "space-between"
                    }}>
                        <div>
                            <p style={{ margin: 0, fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>Pending Payout</p>
                            <p style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 900, color: "#e2e8f0" }}>₹{TOPPER.pendingPayout.toLocaleString()}</p>
                            <p style={{ margin: "2px 0 0", fontSize: 10, color: "#64748b" }}>Min withdraw ₹500 · Instant UPI</p>
                        </div>
                        <button onClick={() => setShowPayout(true)} style={{
                            padding: "10px 18px", borderRadius: 12,
                            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                            border: "none", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer",
                            boxShadow: "0 2px 12px rgba(99,102,241,0.4)"
                        }}>Withdraw</button>
                    </div>

                    {/* RECENT SESSIONS */}
                    <p style={{
                        margin: "8px 0 10px", fontSize: 12, fontWeight: 700, color: "#475569",
                        textTransform: "uppercase", letterSpacing: 0.8
                    }}>Recent Sessions</p>
                    {RECENT_SESSIONS.map(s => (
                        <div key={s.id} style={{
                            background: "#161b27", border: "1px solid rgba(255,255,255,0.05)",
                            borderRadius: 16, padding: "14px", marginBottom: 8,
                            display: "flex", alignItems: "center", gap: 12
                        }}>
                            <div style={{
                                width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
                                background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)",
                                display: "flex", alignItems: "center", justifyContent: "center"
                            }}>
                                <User size={18} color="#818cf8" />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{s.student}</p>
                                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748b" }}>{s.subject} · {s.duration} min · {s.time}</p>
                            </div>
                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                                <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#22c55e" }}>+₹{s.earned}</p>
                                <p style={{ margin: "2px 0 0", fontSize: 10, color: "#fbbf24" }}>{"⭐".repeat(s.rating)}</p>
                            </div>
                        </div>
                    ))}
                </main>
            )}

            {/* ─── SESSIONS TAB ─── */}
            {activeTab === "sessions" && (
                <main style={{ flex: 1, padding: "16px 14px" }}>
                    <h2 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 800, color: "#e2e8f0" }}>All Sessions</h2>
                    {/* Stats bar */}
                    <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                        {[{ l: "Total", v: TOPPER.totalSessions }, { l: "This Month", v: 68 }, { l: "Avg Duration", v: "24m" }].map(x => (
                            <div key={x.l} style={{
                                flex: 1, background: "#161b27", border: "1px solid rgba(255,255,255,0.05)",
                                borderRadius: 14, padding: "10px 8px", textAlign: "center"
                            }}>
                                <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#818cf8" }}>{x.v}</p>
                                <p style={{ margin: 0, fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5 }}>{x.l}</p>
                            </div>
                        ))}
                    </div>
                    {[...RECENT_SESSIONS, ...RECENT_SESSIONS].map((s, i) => (
                        <div key={i} style={{
                            background: "#161b27", border: "1px solid rgba(255,255,255,0.05)",
                            borderRadius: 16, padding: "14px", marginBottom: 8,
                            display: "flex", alignItems: "center", gap: 12
                        }}>
                            <div style={{
                                width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
                                background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)",
                                display: "flex", alignItems: "center", justifyContent: "center"
                            }}><User size={18} color="#818cf8" /></div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{s.student}</p>
                                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748b" }}>
                                    <BookOpen size={10} style={{ display: "inline", marginRight: 3 }} />{s.subject}
                                </p>
                                <p style={{ margin: "2px 0 0", fontSize: 10, color: "#334155" }}>
                                    <Clock size={9} style={{ display: "inline", marginRight: 3 }} />{s.duration} min · {s.time}
                                </p>
                            </div>
                            <div style={{ textAlign: "right" }}>
                                <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#22c55e" }}>+₹{s.earned}</p>
                                <p style={{ margin: "3px 0 0", fontSize: 10, color: "#fbbf24" }}>{"⭐".repeat(s.rating)}</p>
                            </div>
                        </div>
                    ))}
                </main>
            )}

            {/* ─── EARNINGS TAB ─── */}
            {activeTab === "earnings" && (
                <main style={{ flex: 1, padding: "16px 14px" }}>
                    <h2 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 800, color: "#e2e8f0" }}>Earnings</h2>
                    {/* Big balance */}
                    <div style={{
                        borderRadius: 24, padding: "24px", marginBottom: 16,
                        background: "linear-gradient(135deg,#1e1b4b,#312e81)",
                        border: "1px solid rgba(99,102,241,0.3)"
                    }}>
                        <p style={{ margin: "0 0 4px", fontSize: 12, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 }}>Available Balance</p>
                        <p style={{ margin: "0 0 4px", fontSize: 36, fontWeight: 900, color: "#e2e8f0" }}>
                            ₹{TOPPER.pendingPayout.toLocaleString()}
                        </p>
                        <p style={{ margin: "0 0 16px", fontSize: 11, color: "#64748b" }}>Earned from {TOPPER.totalSessions} sessions</p>
                        <button onClick={() => setShowPayout(true)} style={{
                            width: "100%", padding: "13px", borderRadius: 14,
                            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                            border: "none", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer",
                            boxShadow: "0 4px 20px rgba(99,102,241,0.4)"
                        }}>💸 Withdraw to UPI / Bank</button>
                    </div>
                    {/* Period cards */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                        {[
                            { p: "Today", v: TOPPER.todayEarnings, s: TOPPER.todaySessions },
                            { p: "This Week", v: TOPPER.weeklyEarnings, s: 68 },
                            { p: "This Month", v: 18900, s: 210 },
                            { p: "All Time", v: 92400, s: TOPPER.totalSessions },
                        ].map(x => (
                            <div key={x.p} style={{
                                background: "#161b27", border: "1px solid rgba(255,255,255,0.05)",
                                borderRadius: 18, padding: "14px"
                            }}>
                                <p style={{ margin: "0 0 4px", fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5 }}>{x.p}</p>
                                <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#22c55e" }}>₹{x.v.toLocaleString()}</p>
                                <p style={{ margin: "2px 0 0", fontSize: 10, color: "#64748b" }}>{x.s} sessions</p>
                            </div>
                        ))}
                    </div>
                    {/* Recent payouts */}
                    <p style={{ margin: "8px 0 10px", fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.8 }}>Payout History</p>
                    {[
                        { date: "15 Feb", amount: 4500, upi: "vivek@upi", status: "Success" },
                        { date: "01 Feb", amount: 6200, upi: "vivek@upi", status: "Success" },
                        { date: "15 Jan", amount: 3800, upi: "vivek@upi", status: "Success" },
                    ].map((p, i) => (
                        <div key={i} style={{
                            background: "#161b27", border: "1px solid rgba(255,255,255,0.05)",
                            borderRadius: 14, padding: "14px", marginBottom: 8,
                            display: "flex", justifyContent: "space-between", alignItems: "center"
                        }}>
                            <div>
                                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>₹{p.amount.toLocaleString()}</p>
                                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748b" }}>{p.upi} · {p.date}</p>
                            </div>
                            <span style={{
                                background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)",
                                borderRadius: 8, padding: "3px 10px", fontSize: 11, fontWeight: 700, color: "#4ade80"
                            }}>✓ {p.status}</span>
                        </div>
                    ))}
                </main>
            )}

            {/* ─── SETTINGS TAB ─── */}
            {activeTab === "settings" && (
                <main style={{ flex: 1, padding: "16px 14px" }}>
                    <h2 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 800, color: "#e2e8f0" }}>Settings</h2>
                    {/* Profile card */}
                    <div style={{
                        background: "#161b27", borderRadius: 20, padding: "16px", marginBottom: 12,
                        border: "1px solid rgba(255,255,255,0.05)",
                        display: "flex", alignItems: "center", gap: 12
                    }}>
                        <img src={TOPPER.avatarUrl} alt="" style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", objectPosition: "top" }} />
                        <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#e2e8f0" }}>{TOPPER.name}</p>
                            <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748b" }}>{TOPPER.college}</p>
                            <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                                {TOPPER.subjects.slice(0, 3).map(s => (
                                    <span key={s} style={{
                                        background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)",
                                        borderRadius: 6, padding: "1px 6px", fontSize: 9, fontWeight: 700, color: "#818cf8"
                                    }}>{s}</span>
                                ))}
                            </div>
                        </div>
                        <button style={{
                            padding: "7px 14px", borderRadius: 10, background: "rgba(99,102,241,0.1)",
                            border: "1px solid rgba(99,102,241,0.25)", color: "#818cf8", fontSize: 12, fontWeight: 700, cursor: "pointer"
                        }}>Edit</button>
                    </div>
                    {/* Rate — fixed card (not slider) */}
                    <div style={{ background: "#161b27", borderRadius: 20, padding: "16px", marginBottom: 12, border: "1px solid rgba(255,255,255,0.05)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                            <div>
                                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>Platform Rate</p>
                                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748b" }}>Fixed for all toppers currently</p>
                            </div>
                            <div style={{
                                background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                                borderRadius: 12, padding: "6px 14px"
                            }}>
                                <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#fff" }}>₹10/min</p>
                            </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                            <div style={{
                                background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)",
                                borderRadius: 10, padding: "8px 12px"
                            }}>
                                <p style={{ margin: 0, fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>You Earn</p>
                                <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#4ade80" }}>₹6/min</p>
                            </div>
                            <div style={{
                                background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)",
                                borderRadius: 10, padding: "8px 12px"
                            }}>
                                <p style={{ margin: 0, fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>Min charge</p>
                                <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#818cf8" }}>₹50 / 5m</p>
                            </div>
                        </div>
                        <p style={{ margin: "10px 0 0", fontSize: 11, color: "#475569", lineHeight: 1.6 }}>
                            Custom rates will be unlocked as the platform grows. You’ll be notified first! 🎉
                        </p>
                    </div>
                    {/* Menu items */}
                    {[
                        { icon: "📚", label: "Manage Subjects", sub: "Add or remove subjects you teach" },
                        { icon: "🏦", label: "Bank / UPI Details", sub: "For payout withdrawals" },
                        { icon: "⭐", label: "Reviews & Ratings", sub: "See student feedback" },
                        { icon: "📋", label: "Verification Status", sub: "Verified by TopperTalks Admin ✅" },
                        { icon: "🔔", label: "Notifications", sub: "Call alerts, earnings, news" },
                        { icon: "🚪", label: "Sign Out", sub: "Log out of Topper account" },
                    ].map(item => (
                        <button key={item.label} style={{
                            width: "100%", display: "flex", alignItems: "center", gap: 14,
                            padding: "14px 16px", marginBottom: 8, borderRadius: 16,
                            background: "#161b27", border: "1px solid rgba(255,255,255,0.05)",
                            cursor: "pointer", textAlign: "left"
                        }}>
                            <div style={{
                                width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                                background: "rgba(99,102,241,0.1)", display: "flex",
                                alignItems: "center", justifyContent: "center", fontSize: 18
                            }}>{item.icon}</div>
                            <div style={{ flex: 1 }}>
                                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{item.label}</p>
                                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748b" }}>{item.sub}</p>
                            </div>
                            <ChevronRight size={16} color="#475569" />
                        </button>
                    ))}
                </main>
            )}

            <TopperNav active={activeTab} onChange={setActiveTab} />

            {/* ══ INCOMING CALL OVERLAY ══ */}
            {showIncoming && (
                <div style={{
                    position: "fixed", inset: 0, zIndex: 100,
                    background: "rgba(0,0,0,0.92)", backdropFilter: "blur(20px)",
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    animation: "slideUp 0.3s ease", gap: 0
                }}>
                    {/* Ring countdown */}
                    <p style={{
                        position: "absolute", top: 60, right: 24,
                        fontSize: 18, fontWeight: 900, color: "#64748b"
                    }}>{ringCount}s</p>

                    <p style={{
                        margin: "0 0 30px", fontSize: 13, color: "#64748b",
                        textTransform: "uppercase", letterSpacing: 2, fontWeight: 700
                    }}>
                        Incoming {INCOMING_STUDENT.callType === "video" ? "Video" : "Voice"} Call
                    </p>

                    {/* Pulsing avatar */}
                    <div style={{
                        width: 110, height: 110, borderRadius: "50%", overflow: "hidden",
                        border: "3px solid #22c55e", marginBottom: 20,
                        animation: "callPulse 1.5s ease-in-out infinite"
                    }}>
                        <img src={INCOMING_STUDENT.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
                    </div>

                    <p style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 900, color: "#e2e8f0" }}>{INCOMING_STUDENT.name}</p>
                    <p style={{ margin: "0 0 4px", fontSize: 13, color: "#94a3b8" }}>{INCOMING_STUDENT.class}</p>
                    <div style={{
                        background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)",
                        borderRadius: 10, padding: "5px 14px", marginBottom: 32
                    }}>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#818cf8" }}>
                            📖 Needs help with: {INCOMING_STUDENT.subject}
                        </p>
                    </div>
                    <p style={{ margin: "0 0 40px", fontSize: 13, color: "#22c55e", fontWeight: 600 }}>
                        Student pays ₹50 for 5 min · You earn ₹{TOPPER.topperCut}/min (60%)
                    </p>

                    {/* Accept / Decline */}
                    <div style={{ display: "flex", gap: 40, alignItems: "center" }}>
                        <div style={{ textAlign: "center" }}>
                            <button onClick={declineCall} style={{
                                width: 70, height: 70, borderRadius: "50%",
                                background: "linear-gradient(135deg,#ef4444,#dc2626)",
                                border: "none", color: "#fff", cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                boxShadow: "0 4px 24px rgba(239,68,68,0.5)", marginBottom: 8
                            }}><PhoneOff size={28} /></button>
                            <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>Decline</p>
                        </div>
                        <div style={{ textAlign: "center" }}>
                            <button onClick={acceptCall} style={{
                                width: 70, height: 70, borderRadius: "50%",
                                background: "linear-gradient(135deg,#22c55e,#16a34a)",
                                border: "none", color: "#fff", cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                boxShadow: "0 4px 24px rgba(34,197,94,0.5)", marginBottom: 8,
                                animation: "ring 0.8s ease-in-out infinite"
                            }}>
                                {INCOMING_STUDENT.callType === "video" ? <Video size={28} /> : <Phone size={28} />}
                            </button>
                            <p style={{ margin: 0, fontSize: 11, color: "#4ade80", fontWeight: 700 }}>Accept</p>
                        </div>
                    </div>
                </div>
            )}

            {/* ══ PAYOUT MODAL ══ */}
            {showPayout && (
                <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "flex-end", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }} onClick={() => setShowPayout(false)}>
                    <div style={{ width: "100%", maxWidth: 480, margin: "0 auto", background: "#13192b", borderRadius: "24px 24px 0 0", borderTop: "1px solid rgba(99,102,241,0.2)", padding: "20px 20px 32px" }} onClick={e => e.stopPropagation()}>
                        <p style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800, color: "#e2e8f0" }}>Withdraw Earnings 💸</p>
                        <p style={{ margin: "0 0 16px", fontSize: 12, color: "#64748b" }}>Balance: ₹{TOPPER.pendingPayout.toLocaleString()}</p>
                        <label style={{ display: "block", marginBottom: 6, fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>Amount</label>
                        <input defaultValue={TOPPER.pendingPayout} type="number" style={{ width: "100%", padding: "12px 16px", borderRadius: 14, marginBottom: 12, boxSizing: "border-box", background: "#1e2535", border: "1.5px solid rgba(99,102,241,0.25)", color: "#e2e8f0", fontSize: 18, fontWeight: 900, outline: "none" }} />
                        <label style={{ display: "block", marginBottom: 6, fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>UPI ID / Account Number</label>
                        <input placeholder="yourname@upi or bank account" style={{ width: "100%", padding: "12px 16px", borderRadius: 14, marginBottom: 16, boxSizing: "border-box", background: "#1e2535", border: "1.5px solid rgba(99,102,241,0.25)", color: "#e2e8f0", fontSize: 14, outline: "none" }} />
                        <button onClick={() => setShowPayout(false)} style={{ width: "100%", padding: "14px", borderRadius: 16, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 20px rgba(99,102,241,0.4)" }}>🚀 Request Payout</button>
                        <p style={{ textAlign: "center", margin: "8px 0 0", fontSize: 11, color: "#475569" }}>Processed within 24-48 hrs · Min ₹500</p>
                    </div>
                </div>
            )}

            {/* ══ TOPPER ACTIVE CALL OVERLAY ══ */}
            {callAccepted && (
                <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "linear-gradient(180deg,#071a10,#0d1117)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
                    <style>{`@keyframes callPulseG{0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,.6)}60%{box-shadow:0 0 0 24px rgba(34,197,94,0)}}`}</style>
                    <p style={{ margin: 0, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#22c55e", fontWeight: 700 }}>🟢 Call in Progress</p>
                    <div style={{ width: 96, height: 96, borderRadius: "50%", overflow: "hidden", border: "3px solid #22c55e", animation: "callPulseG 1.5s ease-in-out infinite" }}>
                        <img src={INCOMING_STUDENT.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
                    </div>
                    <div style={{ textAlign: "center" }}>
                        <p style={{ margin: "0 0 2px", fontSize: 20, fontWeight: 800, color: "#e2e8f0" }}>{INCOMING_STUDENT.name}</p>
                        <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>{INCOMING_STUDENT.subject}</p>
                    </div>
                    <div style={{ background: callSecs < 300 ? "rgba(251,191,36,0.1)" : "rgba(34,197,94,0.1)", border: `1px solid ${callSecs < 300 ? "rgba(251,191,36,0.3)" : "rgba(34,197,94,0.3)"}`, borderRadius: 50, padding: "6px 22px", display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: callSecs < 300 ? "#fbbf24" : "#22c55e", display: "inline-block" }} />
                        <span style={{ fontSize: 24, fontWeight: 900, color: callSecs < 300 ? "#fbbf24" : "#4ade80", fontVariantNumeric: "tabular-nums" }}>{fmtTime(callSecs)}</span>
                    </div>
                    <div style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 14, padding: "10px 20px", textAlign: "center" }}>
                        <p style={{ margin: "0 0 2px", fontSize: 11, color: "#64748b" }}>You&apos;ve earned so far</p>
                        <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#4ade80" }}>₹{totalTopperEarned}</p>
                    </div>
                    <button onClick={() => setShowTopperReport(true)} style={{ padding: "7px 18px", borderRadius: 50, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>🚨 Report Issue</button>
                    <button onClick={() => setShowTopperEndConfirm(true)} style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg,#ef4444,#dc2626)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 24px rgba(239,68,68,0.6)" }}><PhoneOff size={24} /></button>
                    <p style={{ margin: 0, fontSize: 10, color: "#334155" }}>Tap to end call</p>
                </div>
            )}

            {/* ══ TOPPER CUT-CALL CONFIRM ══ */}
            {showTopperEndConfirm && (
                <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                    <div style={{ width: "100%", maxWidth: 480, background: "#13192b", borderRadius: "24px 24px 0 0", padding: "24px 20px 36px", borderTop: "1px solid rgba(239,68,68,0.25)" }}>
                        <p style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 800, color: "#f87171" }}>⚠️ End Call?</p>
                        {callSecs < 300 ? (
                            <>
                                <p style={{ margin: "0 0 12px", fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>You are <strong style={{ color: "#fbbf24" }}>within the first 5 minutes</strong>. If you cut now, <strong style={{ color: "#ef4444" }}>you will not receive any payment</strong>.</p>
                                <div style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 12, padding: "12px 14px", marginBottom: 20 }}>
                                    <p style={{ margin: 0, fontSize: 12, color: "#4ade80", fontWeight: 700, lineHeight: 1.6 }}>💡 If the doubt is resolved, ask the student to end the call — they still pay ₹50 and you earn ₹30.</p>
                                </div>
                            </>
                        ) : (
                            <p style={{ margin: "0 0 20px", fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>You have earned <strong style={{ color: "#4ade80" }}>₹{totalTopperEarned}</strong> ({fmtTime(callSecs)}). This will be credited now.</p>
                        )}
                        <div style={{ display: "flex", gap: 10 }}>
                            <button onClick={() => setShowTopperEndConfirm(false)} style={{ flex: 1, padding: "14px", borderRadius: 14, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Continue</button>
                            <button onClick={endTopperCall} style={{ flex: 1, padding: "14px", borderRadius: 14, background: "linear-gradient(135deg,#ef4444,#dc2626)", border: "none", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>End Call</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══ TOPPER REPORT ══ */}
            {showTopperReport && (
                <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                    <div style={{ width: "100%", maxWidth: 480, background: "#13192b", borderRadius: "24px 24px 0 0", padding: "24px 20px 36px", borderTop: "1px solid rgba(239,68,68,0.3)" }}>
                        {!topperReportConfirm ? (
                            <>
                                <p style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 800, color: "#f87171" }}>🚨 Report Student</p>
                                <p style={{ margin: "0 0 16px", fontSize: 13, color: "#94a3b8", lineHeight: 1.7 }}>Reporting ends the call. <strong style={{ color: "#fbbf24" }}>Payment held 15 days</strong> for review.</p>
                                <div style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 12, padding: "12px 14px", marginBottom: 20 }}>
                                    <p style={{ margin: 0, fontSize: 12, color: "#fbbf24", lineHeight: 1.6 }}>⚠️ False reports → account suspension.</p>
                                </div>
                                <div style={{ display: "flex", gap: 10 }}>
                                    <button onClick={() => setShowTopperReport(false)} style={{ flex: 1, padding: "14px", borderRadius: 14, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                                    <button onClick={() => setTopperReportConfirm(true)} style={{ flex: 1, padding: "14px", borderRadius: 14, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", color: "#f87171", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Report →</button>
                                </div>
                            </>
                        ) : (
                            <>
                                <p style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 800, color: "#f87171" }}>Confirm Report?</p>
                                <p style={{ margin: "0 0 20px", fontSize: 13, color: "#94a3b8" }}>Call ends + payment held. Team reviews in <strong style={{ color: "#e2e8f0" }}>72 hours</strong>.</p>
                                <div style={{ display: "flex", gap: 10 }}>
                                    <button onClick={() => { setTopperReportConfirm(false); setShowTopperReport(false); }} style={{ flex: 1, padding: "14px", borderRadius: 14, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Go Back</button>
                                    <button onClick={() => { if (callTimerRef.current) clearInterval(callTimerRef.current); setShowTopperReport(false); setTopperReportConfirm(false); setCallAccepted(false); setTimeout(() => setShowTopperRating(true), 400); }} style={{ flex: 1, padding: "14px", borderRadius: 14, background: "linear-gradient(135deg,#ef4444,#dc2626)", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Submit 🚨</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* ══ TOPPER RATES STUDENT ══ */}
            {showTopperRating && (
                <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px" }}>
                    <div style={{ width: "100%", maxWidth: 420, background: "linear-gradient(180deg,#13192b,#0d1117)", borderRadius: 28, padding: "28px 22px", border: "1px solid rgba(34,197,94,0.2)" }}>
                        {!topperRatingDone ? (
                            <>
                                <div style={{ textAlign: "center", marginBottom: 18 }}>
                                    <img src={INCOMING_STUDENT.avatar} alt="" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: "3px solid #22c55e", marginBottom: 10 }} />
                                    <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#e2e8f0" }}>Rate this student</p>
                                    <p style={{ margin: "3px 0 0", fontSize: 12, color: "#64748b" }}>{INCOMING_STUDENT.name} · {fmtTime(callSecs)}</p>
                                </div>
                                <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 16 }}>
                                    {[1, 2, 3, 4, 5].map(n => (
                                        <button key={n} onClick={() => setTopperRatingStar(n)} style={{ fontSize: 34, background: "none", border: "none", cursor: "pointer", opacity: n <= topperRatingStar ? 1 : 0.2, transform: n <= topperRatingStar ? "scale(1.15)" : "scale(1)", transition: "all 0.12s" }}>⭐</button>
                                    ))}
                                </div>
                                <button onClick={() => setTopperRatingDone(true)} disabled={topperRatingStar === 0} style={{ width: "100%", padding: "14px", borderRadius: 16, marginBottom: 10, background: topperRatingStar > 0 ? "linear-gradient(135deg,#22c55e,#16a34a)" : "rgba(255,255,255,0.05)", border: "none", color: topperRatingStar > 0 ? "#fff" : "#334155", fontSize: 14, fontWeight: 800, cursor: topperRatingStar > 0 ? "pointer" : "not-allowed" }}>Submit Rating ✓</button>
                                <button onClick={() => setShowTopperRating(false)} style={{ width: "100%", padding: "10px", borderRadius: 12, background: "transparent", border: "none", color: "#475569", fontSize: 12, cursor: "pointer" }}>Skip</button>
                            </>
                        ) : (
                            <div style={{ textAlign: "center", padding: "16px 0" }}>
                                <p style={{ fontSize: 44, margin: "0 0 10px" }}>🎉</p>
                                <p style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800, color: "#4ade80" }}>Session Complete!</p>
                                <p style={{ margin: "0 0 14px", fontSize: 13, color: "#64748b" }}>₹{totalTopperEarned} earned · credited to wallet</p>
                                <button onClick={() => setShowTopperRating(false)} style={{ padding: "12px 24px", borderRadius: 14, background: "linear-gradient(135deg,#22c55e,#16a34a)", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Back to Dashboard</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
