"use client";

import { useState } from "react";
import {
    Users, IndianRupee, Phone, Star, AlertTriangle, CheckCircle,
    XCircle, Clock, TrendingUp, ChevronRight, Shield, Search, Eye,
    LogOut, BarChart2, Bell
} from "lucide-react";

/* ─── Mock Data ─── */
const OVERVIEW = {
    totalUsers: 4820, totalToppers: 127, activeCalls: 7,
    dailyRevenue: 12400, weeklyRevenue: 78600, pendingPayouts: 42300,
    pendingApplications: 14, openReports: 3, totalSessions: 18540,
};

const PENDING_APPLICATIONS = [
    { id: "a1", name: "Vikram Patel", college: "IIT Roorkee", exam: "JEE Advanced 2023", rank: "AIR 892", avatar: "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg", appliedAt: "2 hrs ago", status: "pending" },
    { id: "a2", name: "Isha Nair", college: "AIIMS Kochi", exam: "NEET 2022", rank: "AIR 230", avatar: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg", appliedAt: "5 hrs ago", status: "pending" },
    { id: "a3", name: "Aryan Gupta", college: "NIT Warangal", exam: "JEE Mains 2023", rank: "AIR 1890", avatar: "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg", appliedAt: "Yesterday", status: "pending" },
    { id: "a4", name: "Sneha Reddy", college: "IIT Hyderabad", exam: "JEE Advanced 2022", rank: "AIR 456", avatar: "https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg", appliedAt: "Yesterday", status: "pending" },
];

const REPORTS = [
    { id: "r1", reporter: "Rahul G. (Student)", against: "Ananya S. (Topper)", reason: "Abusive language during call", callDuration: "12 min", amount: "₹170", reportedAt: "1 hr ago", status: "open" },
    { id: "r2", reporter: "Ananya S. (Topper)", against: "Prerna K. (Student)", reason: "Inappropriate questions", callDuration: "4 min", amount: "₹50", reportedAt: "3 hrs ago", status: "open" },
    { id: "r3", reporter: "Kabir M. (Student)", against: "Rohan M. (Topper)", reason: "Wrong information provided", callDuration: "8 min", amount: "₹80", reportedAt: "6 hrs ago", status: "reviewing" },
];

const RECENT_SESSIONS = [
    { id: "s1", student: "Rahul G.", topper: "Ananya S.", duration: "22 min", amount: "₹220", topper_earned: "₹132", platform: "₹88", at: "Today 3:30 PM" },
    { id: "s2", student: "Prerna S.", topper: "Meera R.", duration: "8 min", amount: "₹80", topper_earned: "₹48", platform: "₹32", at: "Today 2:10 PM" },
    { id: "s3", student: "Aditya K.", topper: "Priya K.", duration: "35 min", amount: "₹350", topper_earned: "₹210", platform: "₹140", at: "Today 11:00 AM" },
    { id: "s4", student: "Nisha V.", topper: "Siddharth A.", duration: "14 min", amount: "₹140", topper_earned: "₹84", platform: "₹56", at: "Today 9:45 AM" },
];

const PAYOUT_REQUESTS = [
    { id: "p1", topper: "Ananya Sharma", college: "IIT Bombay", amount: 5040, upi: "ananya@upi", requested: "1 hr ago" },
    { id: "p2", topper: "Meera Rajan", college: "IIT Madras", amount: 2800, upi: "meera@upi", requested: "3 hrs ago" },
    { id: "p3", topper: "Rohan Mehta", college: "AIIMS Delhi", amount: 1600, upi: "rohan@upi", requested: "Yesterday" },
];

const TOP_TOPPERS = [
    { name: "Ananya Sharma", college: "IIT Bombay", rating: 4.9, sessions: 312, earnings: "₹1,26,720", avatar: "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg" },
    { name: "Meera Rajan", college: "IIT Madras", rating: 4.9, sessions: 256, earnings: "₹1,04,040", avatar: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg" },
    { name: "Priya Kapoor", college: "IIT Delhi", rating: 4.7, sessions: 145, earnings: "₹58,800", avatar: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg" },
];

type AdminTab = "overview" | "applications" | "reports" | "sessions" | "payouts" | "toppers";

export default function AdminPage() {
    const [tab, setTab] = useState<AdminTab>("overview");
    const [applications, setApplications] = useState(PENDING_APPLICATIONS);
    const [reports, setReports] = useState(REPORTS);
    const [payouts, setPayouts] = useState(PAYOUT_REQUESTS);
    const [search, setSearch] = useState("");

    const approveApp = (id: string) => setApplications(a => a.filter(x => x.id !== id));
    const rejectApp = (id: string) => setApplications(a => a.filter(x => x.id !== id));
    const resolveReport = (id: string) => setReports(r => r.filter(x => x.id !== id));
    const approvePayout = (id: string) => setPayouts(p => p.filter(x => x.id !== id));

    const NAV: { key: AdminTab; label: string; icon: React.ReactNode; badge?: number }[] = [
        { key: "overview", label: "Overview", icon: <BarChart2 size={16} /> },
        { key: "applications", label: "Applications", icon: <Users size={16} />, badge: OVERVIEW.pendingApplications },
        { key: "reports", label: "Reports", icon: <AlertTriangle size={16} />, badge: OVERVIEW.openReports },
        { key: "sessions", label: "Sessions", icon: <Phone size={16} /> },
        { key: "payouts", label: "Payouts", icon: <IndianRupee size={16} /> },
        { key: "toppers", label: "Top Toppers", icon: <Star size={16} /> },
    ];

    return (
        <div style={{ minHeight: "100vh", background: "#080c14", fontFamily: "'Inter',sans-serif" }}>
            <style>{`
                @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
                @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
            `}</style>

            {/* ── TOP BAR ── */}
            <header style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 20px", background: "rgba(13,19,35,0.97)",
                borderBottom: "1px solid rgba(99,102,241,0.15)",
                position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(16px)"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(99,102,241,0.4)" }}>
                        <Shield size={18} color="#fff" />
                    </div>
                    <div>
                        <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#e2e8f0" }}>TopperTalks Admin</p>
                        <p style={{ margin: 0, fontSize: 10, color: "#475569" }}>Super Admin Panel</p>
                    </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ position: "relative" }}>
                        <Bell size={18} color="#64748b" />
                        <div style={{ position: "absolute", top: -4, right: -4, width: 14, height: 14, borderRadius: "50%", background: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 800, color: "#fff" }}>
                            {OVERVIEW.openReports}
                        </div>
                    </div>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff" }}>A</div>
                    <LogOut size={16} color="#475569" style={{ cursor: "pointer" }} />
                </div>
            </header>

            <div style={{ display: "flex", maxWidth: 1200, margin: "0 auto" }}>
                {/* ── SIDEBAR ── */}
                <aside style={{ width: 200, flexShrink: 0, padding: "20px 12px", height: "calc(100vh - 60px)", position: "sticky", top: 60, overflowY: "auto", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
                    {NAV.map(item => (
                        <button key={item.key} onClick={() => setTab(item.key)} style={{
                            width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "10px 12px", borderRadius: 12, marginBottom: 4, cursor: "pointer",
                            background: tab === item.key ? "rgba(99,102,241,0.15)" : "transparent",
                            border: `1px solid ${tab === item.key ? "rgba(99,102,241,0.3)" : "transparent"}`,
                            color: tab === item.key ? "#818cf8" : "#475569",
                            textAlign: "left", transition: "all 0.15s"
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700 }}>
                                {item.icon}{item.label}
                            </div>
                            {item.badge && <span style={{ background: "#ef4444", color: "#fff", fontSize: 10, fontWeight: 800, borderRadius: 50, padding: "1px 6px" }}>{item.badge}</span>}
                        </button>
                    ))}
                </aside>

                {/* ── MAIN CONTENT ── */}
                <main style={{ flex: 1, padding: "20px 24px", animation: "fadeUp 0.25s ease", overflowX: "auto" }}>

                    {/* ═══ OVERVIEW ═══ */}
                    {tab === "overview" && (
                        <div>
                            <h2 style={{ margin: "0 0 20px", fontSize: 20, fontWeight: 900, color: "#e2e8f0" }}>📊 Platform Overview</h2>

                            {/* KPI Cards */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginBottom: 24 }}>
                                {[
                                    { label: "Total Users", value: OVERVIEW.totalUsers.toLocaleString(), icon: "👥", color: "#6366f1", sub: "+24 today" },
                                    { label: "Total Toppers", value: OVERVIEW.totalToppers, icon: "🏆", color: "#22c55e", sub: "+2 this week" },
                                    { label: "Active Calls", value: OVERVIEW.activeCalls, icon: "📞", color: "#f59e0b", sub: "Right now", pulse: true },
                                    { label: "Daily Revenue", value: `₹${OVERVIEW.dailyRevenue.toLocaleString()}`, icon: "💰", color: "#0ea5e9", sub: "Today" },
                                    { label: "Weekly Revenue", value: `₹${OVERVIEW.weeklyRevenue.toLocaleString()}`, icon: "📈", color: "#8b5cf6", sub: "This week" },
                                    { label: "Pending Payouts", value: `₹${OVERVIEW.pendingPayouts.toLocaleString()}`, icon: "🏦", color: "#f87171", sub: `${payouts.length} requests` },
                                    { label: "Total Sessions", value: OVERVIEW.totalSessions.toLocaleString(), icon: "🎓", color: "#4ade80", sub: "All time" },
                                    { label: "Open Reports", value: OVERVIEW.openReports, icon: "🚨", color: "#ef4444", sub: "Needs action" },
                                ].map(k => (
                                    <div key={k.label} style={{ background: "#161b27", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 18, padding: "16px" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                            <span style={{ fontSize: 24 }}>{k.icon}</span>
                                            {(k as any).pulse && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", animation: "pulse 1.5s ease-in-out infinite" }} />}
                                        </div>
                                        <p style={{ margin: "8px 0 2px", fontSize: 22, fontWeight: 900, color: k.color }}>{k.value}</p>
                                        <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 700, color: "#94a3b8" }}>{k.label}</p>
                                        <p style={{ margin: 0, fontSize: 10, color: "#475569" }}>{k.sub}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Quick actions */}
                            <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: 0.6 }}>Quick Actions</h3>
                            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                {[
                                    { label: `Review ${applications.filter(a => a.status === "pending").length} Applications`, color: "#6366f1", onClick: () => setTab("applications") },
                                    { label: `Resolve ${reports.filter(r => r.status === "open").length} Reports`, color: "#ef4444", onClick: () => setTab("reports") },
                                    { label: `Approve ${payouts.length} Payouts`, color: "#22c55e", onClick: () => setTab("payouts") },
                                ].map(a => (
                                    <button key={a.label} onClick={a.onClick} style={{
                                        padding: "10px 18px", borderRadius: 12, cursor: "pointer",
                                        background: `rgba(${a.color === "#6366f1" ? "99,102,241" : a.color === "#ef4444" ? "239,68,68" : "34,197,94"},0.12)`,
                                        border: `1px solid ${a.color}40`, color: a.color, fontSize: 13, fontWeight: 700,
                                        display: "flex", alignItems: "center", gap: 6
                                    }}>
                                        {a.label} <ChevronRight size={14} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ═══ MENTOR APPLICATIONS ═══ */}
                    {tab === "applications" && (
                        <div>
                            <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 900, color: "#e2e8f0" }}>📝 Mentor Applications</h2>
                            <p style={{ margin: "0 0 20px", fontSize: 13, color: "#475569" }}>{applications.length} pending · Verify college + rank before approving</p>

                            {applications.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "60px 0", color: "#475569" }}>
                                    <CheckCircle size={40} color="#22c55e" style={{ marginBottom: 12 }} />
                                    <p style={{ fontSize: 16, fontWeight: 700 }}>All applications reviewed!</p>
                                </div>
                            ) : (
                                applications.map(app => (
                                    <div key={app.id} style={{ background: "#161b27", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: "20px", marginBottom: 12 }}>
                                        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                                            <img src={app.avatar} alt="" style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", objectPosition: "top", border: "2px solid rgba(99,102,241,0.3)", flexShrink: 0 }} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                                    <p style={{ margin: "0 0 2px", fontSize: 16, fontWeight: 800, color: "#e2e8f0" }}>{app.name}</p>
                                                    <span style={{ fontSize: 10, color: "#475569" }}>{app.appliedAt}</span>
                                                </div>
                                                <p style={{ margin: "0 0 4px", fontSize: 13, color: "#64748b" }}>{app.college}</p>
                                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                                                    <span style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 50, padding: "3px 10px", fontSize: 11, fontWeight: 700, color: "#818cf8" }}>{app.exam}</span>
                                                    <span style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 50, padding: "3px 10px", fontSize: 11, fontWeight: 700, color: "#4ade80" }}>{app.rank}</span>
                                                </div>
                                                <div style={{ display: "flex", gap: 10 }}>
                                                    <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, background: "rgba(14,165,233,0.1)", border: "1px solid rgba(14,165,233,0.25)", color: "#38bdf8", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                                                        <Eye size={14} /> View Docs
                                                    </button>
                                                    <button onClick={() => approveApp(app.id)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", color: "#4ade80", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                                                        <CheckCircle size={14} /> Approve
                                                    </button>
                                                    <button onClick={() => rejectApp(app.id)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                                                        <XCircle size={14} /> Reject
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* ═══ REPORTS ═══ */}
                    {tab === "reports" && (
                        <div>
                            <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 900, color: "#e2e8f0" }}>🚨 Open Reports</h2>
                            <p style={{ margin: "0 0 20px", fontSize: 13, color: "#475569" }}>Payment is held until each report is resolved</p>

                            {reports.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "60px 0", color: "#475569" }}>
                                    <Shield size={40} color="#22c55e" style={{ marginBottom: 12 }} />
                                    <p style={{ fontSize: 16, fontWeight: 700 }}>No open reports. Platform is clean!</p>
                                </div>
                            ) : (
                                reports.map(r => (
                                    <div key={r.id} style={{ background: "#161b27", border: `1px solid ${r.status === "open" ? "rgba(239,68,68,0.2)" : "rgba(251,191,36,0.2)"}`, borderRadius: 20, padding: "18px", marginBottom: 12 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                                            <span style={{ background: r.status === "open" ? "rgba(239,68,68,0.1)" : "rgba(251,191,36,0.1)", border: `1px solid ${r.status === "open" ? "rgba(239,68,68,0.3)" : "rgba(251,191,36,0.3)"}`, borderRadius: 50, padding: "3px 10px", fontSize: 11, fontWeight: 800, color: r.status === "open" ? "#f87171" : "#fbbf24" }}>
                                                {r.status === "open" ? "🔴 Open" : "🟡 Reviewing"}
                                            </span>
                                            <span style={{ fontSize: 11, color: "#475569" }}>{r.reportedAt}</span>
                                        </div>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                                            <div style={{ background: "rgba(14,165,233,0.07)", borderRadius: 10, padding: "8px 12px" }}>
                                                <p style={{ margin: "0 0 2px", fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: 0.4 }}>Reporter</p>
                                                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{r.reporter}</p>
                                            </div>
                                            <div style={{ background: "rgba(239,68,68,0.07)", borderRadius: 10, padding: "8px 12px" }}>
                                                <p style={{ margin: "0 0 2px", fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: 0.4 }}>Reported</p>
                                                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{r.against}</p>
                                            </div>
                                        </div>
                                        <p style={{ margin: "0 0 6px", fontSize: 13, color: "#94a3b8" }}>Reason: <strong style={{ color: "#e2e8f0" }}>{r.reason}</strong></p>
                                        <p style={{ margin: "0 0 14px", fontSize: 12, color: "#64748b" }}>Call: {r.callDuration} · Amount on hold: {r.amount}</p>
                                        <div style={{ display: "flex", gap: 10 }}>
                                            <button onClick={() => resolveReport(r.id)} style={{ flex: 1, padding: "10px", borderRadius: 10, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", color: "#4ade80", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>✅ Release Payment (Legit)</button>
                                            <button onClick={() => resolveReport(r.id)} style={{ flex: 1, padding: "10px", borderRadius: 10, background: "rgba(239,68,68,0.09)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>🚫 Refund Student (Valid)</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* ═══ SESSIONS ═══ */}
                    {tab === "sessions" && (
                        <div>
                            <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 900, color: "#e2e8f0" }}>📞 Recent Sessions</h2>
                            <p style={{ margin: "0 0 16px", fontSize: 13, color: "#475569" }}>{OVERVIEW.activeCalls} calls active right now</p>

                            {/* Search */}
                            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#161b27", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "10px 14px", marginBottom: 16 }}>
                                <Search size={15} color="#475569" />
                                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by student or topper name..." style={{ flex: 1, background: "transparent", border: "none", color: "#e2e8f0", fontSize: 13, outline: "none" }} />
                            </div>

                            {/* Table */}
                            <div style={{ background: "#161b27", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 18, overflow: "hidden" }}>
                                <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr 1fr", gap: 0, background: "rgba(255,255,255,0.03)", padding: "12px 16px" }}>
                                    {["Student", "Topper", "Duration", "Charged", "Topper Earn", "Platform"].map(h => (
                                        <p key={h} style={{ margin: 0, fontSize: 10, fontWeight: 800, color: "#334155", textTransform: "uppercase", letterSpacing: 0.4 }}>{h}</p>
                                    ))}
                                </div>
                                {RECENT_SESSIONS.filter(s => !search || s.student.toLowerCase().includes(search.toLowerCase()) || s.topper.toLowerCase().includes(search.toLowerCase())).map((s, i) => (
                                    <div key={s.id} style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr 1fr 1fr 1fr", gap: 0, padding: "14px 16px", borderTop: "1px solid rgba(255,255,255,0.04)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{s.student}</p>
                                        <p style={{ margin: 0, fontSize: 13, color: "#818cf8", fontWeight: 700 }}>{s.topper}</p>
                                        <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>{s.duration}</p>
                                        <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#e2e8f0" }}>{s.amount}</p>
                                        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#4ade80" }}>{s.topper_earned}</p>
                                        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#6366f1" }}>{s.platform}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ═══ PAYOUTS ═══ */}
                    {tab === "payouts" && (
                        <div>
                            <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 900, color: "#e2e8f0" }}>💸 Payout Requests</h2>
                            <p style={{ margin: "0 0 20px", fontSize: 13, color: "#475569" }}>Total pending: ₹{payouts.reduce((a, b) => a + b.amount, 0).toLocaleString()}</p>

                            {payouts.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "60px 0", color: "#475569" }}>
                                    <CheckCircle size={40} color="#22c55e" style={{ marginBottom: 12 }} />
                                    <p style={{ fontSize: 16, fontWeight: 700 }}>All payouts processed!</p>
                                </div>
                            ) : (
                                payouts.map(p => (
                                    <div key={p.id} style={{ background: "#161b27", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 18, padding: "18px", marginBottom: 12 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                                            <div>
                                                <p style={{ margin: "0 0 2px", fontSize: 15, fontWeight: 800, color: "#e2e8f0" }}>{p.topper}</p>
                                                <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>{p.college} · {p.upi}</p>
                                            </div>
                                            <div style={{ textAlign: "right" }}>
                                                <p style={{ margin: "0 0 2px", fontSize: 20, fontWeight: 900, color: "#4ade80" }}>₹{p.amount.toLocaleString()}</p>
                                                <p style={{ margin: 0, fontSize: 10, color: "#475569" }}>Requested {p.requested}</p>
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", gap: 10 }}>
                                            <button onClick={() => approvePayout(p.id)} style={{ flex: 1, padding: "10px", borderRadius: 10, background: "linear-gradient(135deg,#22c55e,#16a34a)", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                                                ✅ Approve & Transfer
                                            </button>
                                            <button onClick={() => approvePayout(p.id)} style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                <XCircle size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* ═══ TOP TOPPERS ═══ */}
                    {tab === "toppers" && (
                        <div>
                            <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 900, color: "#e2e8f0" }}>🏆 Top Performing Toppers</h2>
                            <p style={{ margin: "0 0 20px", fontSize: 13, color: "#475569" }}>Ranked by total sessions this month</p>

                            {TOP_TOPPERS.map((t, i) => (
                                <div key={t.name} style={{ display: "flex", alignItems: "center", gap: 14, background: "#161b27", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 20, padding: "18px", marginBottom: 12 }}>
                                    <div style={{ fontSize: 22, fontWeight: 900, color: i === 0 ? "#fbbf24" : i === 1 ? "#94a3b8" : "#cd7c32", width: 28, textAlign: "center" }}>
                                        #{i + 1}
                                    </div>
                                    <img src={t.avatar} alt="" style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", objectPosition: "top", border: "2px solid rgba(99,102,241,0.3)" }} />
                                    <div style={{ flex: 1 }}>
                                        <p style={{ margin: "0 0 2px", fontSize: 15, fontWeight: 800, color: "#e2e8f0" }}>{t.name}</p>
                                        <p style={{ margin: "0 0 6px", fontSize: 12, color: "#64748b" }}>{t.college}</p>
                                        <div style={{ display: "flex", gap: 12 }}>
                                            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#fbbf24" }}><Star size={11} fill="#fbbf24" />{t.rating}</span>
                                            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#94a3b8" }}><Phone size={11} />{t.sessions} sessions</span>
                                            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#4ade80" }}><TrendingUp size={11} />{t.earnings}</span>
                                        </div>
                                    </div>
                                    <button style={{ padding: "8px 14px", borderRadius: 10, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", color: "#818cf8", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                                        View Profile
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
