"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Bell, Phone, IndianRupee, Star, AlertCircle, CheckCircle, Trash2 } from "lucide-react";
import { BottomNav } from "@/components/ui/bottom-nav";

type NotifType = "call" | "payment" | "rating" | "system" | "alert";

interface Notif {
    id: string;
    type: NotifType;
    title: string;
    body: string;
    time: string;
    group: "Today" | "Yesterday" | "Earlier";
    read: boolean;
    avatarUrl?: string;
}

const INITIAL_NOTIFS: Notif[] = [
    { id: "n1", type: "call", title: "Incoming Call Missed", body: "Rahul Sharma tried to call you 12 minutes ago", time: "12 min ago", group: "Today", read: false, avatarUrl: "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg" },
    { id: "n2", type: "payment", title: "₹50 Deducted", body: "Voice call with Ananya Sharma · 5 min session", time: "1 hr ago", group: "Today", read: false },
    { id: "n3", type: "rating", title: "New Review!", body: "Ananya gave you ⭐⭐⭐⭐⭐ — 'Solved my doubt instantly!'", time: "2 hrs ago", group: "Today", read: true },
    { id: "n4", type: "system", title: "Wallet Low Balance", body: "You have only ₹30 left. Add money to continue calling toppers.", time: "4 hrs ago", group: "Today", read: true },
    { id: "n5", type: "call", title: "Call Completed", body: "Session with Priya Kapoor · 22 min · ₹220 charged", time: "Yesterday, 3:30 PM", group: "Yesterday", read: true, avatarUrl: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg" },
    { id: "n6", type: "payment", title: "₹200 Added to Wallet", body: "UPI payment received · txn #TT87234", time: "Yesterday, 11:00 AM", group: "Yesterday", read: true },
    { id: "n7", type: "alert", title: "Mentor Application Under Review", body: "We'll verify your IIT credentials within 48 hours. Stay tuned!", time: "2 days ago", group: "Earlier", read: true },
    { id: "n8", type: "system", title: "New Feature: Report Button", body: "You can now report any misconduct during a call. Learn more.", time: "3 days ago", group: "Earlier", read: true },
    { id: "n9", type: "rating", title: "Rating Request", body: "How was your session with Rohan Mehta? Tap to rate.", time: "4 days ago", group: "Earlier", read: true, avatarUrl: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg" },
];

const TYPE_ICON: Record<NotifType, { icon: React.ReactNode; bg: string; color: string }> = {
    call: { icon: <Phone size={16} />, bg: "rgba(34,197,94,0.12)", color: "#22c55e" },
    payment: { icon: <IndianRupee size={16} />, bg: "rgba(99,102,241,0.12)", color: "#818cf8" },
    rating: { icon: <Star size={16} />, bg: "rgba(251,191,36,0.12)", color: "#fbbf24" },
    system: { icon: <Bell size={16} />, bg: "rgba(14,165,233,0.12)", color: "#38bdf8" },
    alert: { icon: <AlertCircle size={16} />, bg: "rgba(239,68,68,0.12)", color: "#f87171" },
};

export default function NotificationsPage() {
    const router = useRouter();
    const [notifs, setNotifs] = useState<Notif[]>(INITIAL_NOTIFS);
    const [activeFilter, setActiveFilter] = useState<"all" | NotifType>("all");

    const markAllRead = () => setNotifs(n => n.map(x => ({ ...x, read: true })));
    const dismiss = (id: string) => setNotifs(n => n.filter(x => x.id !== id));
    const clearAll = () => setNotifs([]);

    const filtered = notifs.filter(n => activeFilter === "all" || n.type === activeFilter);
    const unreadCount = notifs.filter(n => !n.read).length;
    const groups: ("Today" | "Yesterday" | "Earlier")[] = ["Today", "Yesterday", "Earlier"];

    const FILTERS: { key: "all" | NotifType; label: string }[] = [
        { key: "all", label: "All" },
        { key: "call", label: "📞 Calls" },
        { key: "payment", label: "💳 Payments" },
        { key: "rating", label: "⭐ Ratings" },
        { key: "system", label: "🔔 System" },
    ];

    return (
        <div style={{ minHeight: "100vh", background: "#0d1117", maxWidth: 480, margin: "0 auto", fontFamily: "'Inter',sans-serif", paddingBottom: 80 }}>
            <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>

            {/* ── HEADER ── */}
            <header style={{ background: "linear-gradient(180deg,#13192b,#0d1117)", borderBottom: "1px solid rgba(99,102,241,0.15)", padding: "14px 16px", position: "sticky", top: 0, zIndex: 30 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <button onClick={() => router.back()} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", cursor: "pointer" }}>
                            <ChevronLeft size={18} />
                        </button>
                        <div>
                            <h1 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#e2e8f0" }}>Notifications</h1>
                            {unreadCount > 0 && <p style={{ margin: 0, fontSize: 11, color: "#818cf8" }}>{unreadCount} unread</p>}
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                        {unreadCount > 0 && (
                            <button onClick={markAllRead} style={{ padding: "6px 12px", borderRadius: 10, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", color: "#818cf8", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                                <CheckCircle size={12} style={{ display: "inline", marginRight: 4 }} />Mark all read
                            </button>
                        )}
                        {notifs.length > 0 && (
                            <button onClick={clearAll} style={{ padding: "6px 10px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", color: "#f87171", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                                <Trash2 size={12} style={{ display: "inline" }} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Filter tabs */}
                <div style={{ display: "flex", gap: 6, marginTop: 12, overflowX: "auto", paddingBottom: 2 }}>
                    {FILTERS.map(f => (
                        <button key={f.key} onClick={() => setActiveFilter(f.key)} style={{
                            padding: "5px 12px", borderRadius: 50, fontSize: 11, fontWeight: 700,
                            background: activeFilter === f.key ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)",
                            border: `1px solid ${activeFilter === f.key ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.08)"}`,
                            color: activeFilter === f.key ? "#818cf8" : "#475569",
                            cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0
                        }}>{f.label}</button>
                    ))}
                </div>
            </header>

            {/* ── LIST ── */}
            <div style={{ padding: "12px 14px" }}>
                {filtered.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "60px 0", animation: "fadeUp 0.3s ease" }}>
                        <p style={{ fontSize: 48, margin: "0 0 16px" }}>🔔</p>
                        <p style={{ fontSize: 16, fontWeight: 700, color: "#64748b", margin: "0 0 6px" }}>No notifications</p>
                        <p style={{ fontSize: 13, color: "#334155" }}>You&apos;re all caught up!</p>
                    </div>
                ) : (
                    groups.map(group => {
                        const items = filtered.filter(n => n.group === group);
                        if (items.length === 0) return null;
                        return (
                            <div key={group} style={{ marginBottom: 20 }}>
                                <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 800, color: "#334155", textTransform: "uppercase", letterSpacing: 0.8 }}>{group}</p>
                                {items.map(notif => {
                                    const meta = TYPE_ICON[notif.type];
                                    return (
                                        <div key={notif.id} style={{
                                            display: "flex", alignItems: "flex-start", gap: 12,
                                            background: notif.read ? "#161b27" : "rgba(99,102,241,0.08)",
                                            border: `1px solid ${notif.read ? "rgba(255,255,255,0.04)" : "rgba(99,102,241,0.2)"}`,
                                            borderRadius: 18, padding: "14px", marginBottom: 8,
                                            position: "relative", animation: "fadeUp 0.25s ease"
                                        }}>
                                            {/* Icon or avatar */}
                                            {notif.avatarUrl ? (
                                                <img src={notif.avatarUrl} alt="" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", objectPosition: "top", flexShrink: 0, border: `2px solid ${meta.color}40` }} />
                                            ) : (
                                                <div style={{ width: 44, height: 44, borderRadius: 14, background: meta.bg, display: "flex", alignItems: "center", justifyContent: "center", color: meta.color, flexShrink: 0 }}>
                                                    {meta.icon}
                                                </div>
                                            )}

                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                                                    <p style={{ margin: 0, fontSize: 14, fontWeight: notif.read ? 600 : 800, color: notif.read ? "#94a3b8" : "#e2e8f0", lineHeight: 1.3 }}>{notif.title}</p>
                                                    {!notif.read && (
                                                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#6366f1", flexShrink: 0, marginTop: 4 }} />
                                                    )}
                                                </div>
                                                <p style={{ margin: "3px 0 4px", fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>{notif.body}</p>
                                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                                    <p style={{ margin: 0, fontSize: 10, color: "#334155" }}>{notif.time}</p>
                                                    <button onClick={() => dismiss(notif.id)} style={{ background: "none", border: "none", color: "#334155", cursor: "pointer", padding: "2px 4px" }}>
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })
                )}
            </div>

            <BottomNav active="profile" />
        </div>
    );
}
