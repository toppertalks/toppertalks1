"use client";

import { BottomNav } from "@/components/ui/bottom-nav";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, MessageCircle } from "lucide-react";
import { isLoggedIn } from "@/lib/auth-guard";
import { LoginModal } from "@/components/ui/login-modal";

/* ── Chat thread data — last message + unread ── */
export const CHATS = [
  {
    id: "1",
    topperName: "Ananya Sharma",
    college: "IIT Bombay",
    tag: "IIT",
    tagColor: "#6366f1",
    subject: "Physics 🔬",
    lastMessage: "Yes! Torque = r × F. Cross product gives the direction too.",
    lastTime: "10:42 AM",
    unread: 2,
    online: true,
    avatarUrl: "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg"
  },
  {
    id: "2",
    topperName: "Rohan Mehta",
    college: "AIIMS Delhi",
    tag: "AIIMS",
    tagColor: "#0ea5e9",
    subject: "Biology 🧬",
    lastMessage: "The Krebs cycle regenerates NAD⁺ and FAD to keep glycolysis going.",
    lastTime: "Yesterday",
    unread: 0,
    online: false,
    avatarUrl: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg"
  },
  {
    id: "3",
    topperName: "Priya Krishnan",
    college: "IIT Delhi",
    tag: "IIT",
    tagColor: "#6366f1",
    subject: "Chemistry ⚗️",
    lastMessage: "SN2 is one-step — backside attack. SN1 is two-step with carbocation.",
    lastTime: "Mon",
    unread: 0,
    online: true,
    avatarUrl: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg"
  },
  {
    id: "4",
    topperName: "Arjun Verma",
    college: "NIT Trichy",
    tag: "NIT",
    tagColor: "#10b981",
    subject: "Maths 📐",
    lastMessage: "Try ∫ x·eˣ dx using tabular integration — it's faster for JEE.",
    lastTime: "Sun",
    unread: 0,
    online: false,
    avatarUrl: "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg"
  },
  {
    id: "5",
    topperName: "Meera Rao",
    college: "IIT Madras",
    tag: "IIT",
    tagColor: "#6366f1",
    subject: "Physics 🔬",
    lastMessage: "Gauss law holds for any closed surface — shape doesn't matter!",
    lastTime: "Fri",
    unread: 0,
    online: true,
    avatarUrl: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg"
  }
];

export default function MessagesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Check auth once on mount (client-side)
  useEffect(() => { setLoggedIn(isLoggedIn()); }, []);

  const filtered = CHATS.filter(c =>
    c.topperName.toLowerCase().includes(search.toLowerCase()) ||
    c.subject.toLowerCase().includes(search.toLowerCase())
  );

  const totalUnread = loggedIn ? CHATS.reduce((s: number, c) => s + c.unread, 0) : 0;
  const [showSearch, setShowSearch] = useState(false);

  return (
    <div style={{
      minHeight: "100vh", maxWidth: 480, margin: "0 auto",
      background: "#0d1117", display: "flex", flexDirection: "column", paddingBottom: 72
    }}>

      {/* ── Header ── */}
      <header style={{
        background: "linear-gradient(180deg,#13192b 0%,#0d1117 100%)",
        borderBottom: "1px solid rgba(99,102,241,0.15)",
        padding: "14px 18px 10px",
        position: "sticky", top: 0, zIndex: 40
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: showSearch ? 10 : 0 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#e2e8f0" }}>
              Chats
              {totalUnread > 0 && (
                <span style={{
                  marginLeft: 8, background: "#6366f1", color: "#fff",
                  borderRadius: 50, padding: "1px 8px", fontSize: 11, fontWeight: 800
                }}>{totalUnread}</span>
              )}
            </h1>
            <p style={{ margin: 0, fontSize: 11, color: "#475569" }}>
              {loggedIn ? `${CHATS.filter(c => c.online).length} toppers online` : "Sign in to see your conversations"}
            </p>
          </div>
          {loggedIn && (
            <button onClick={() => setShowSearch(s => !s)} style={{
              width: 38, height: 38, borderRadius: 11,
              background: showSearch ? "rgba(99,102,241,0.25)" : "rgba(99,102,241,0.1)",
              border: "1px solid rgba(99,102,241,0.25)", color: "#818cf8",
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
            }}>
              <Search size={16} />
            </button>
          )}
        </div>

        {showSearch && loggedIn && (
          <input
            autoFocus
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search chats..."
            style={{
              width: "100%", padding: "9px 14px", borderRadius: 12,
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(99,102,241,0.2)",
              color: "#e2e8f0", fontSize: 13, outline: "none", boxSizing: "border-box"
            }}
          />
        )}
      </header>

      {/* ══ NOT LOGGED IN — Show prompt card ══ */}
      {!loggedIn ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>💬</div>
          <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 800, color: "#e2e8f0", textAlign: "center" }}>Your Conversations</h2>
          <p style={{ margin: "0 0 28px", fontSize: 14, color: "#64748b", textAlign: "center", lineHeight: 1.6 }}>
            Sign in to view your chats with IIT & AIIMS mentors
          </p>
          {/* Blurred preview cards */}
          <div style={{ width: "100%", marginBottom: 28, filter: "blur(3px)", opacity: 0.35, pointerEvents: "none" }}>
            {CHATS.slice(0, 3).map(chat => (
              <div key={chat.id} style={{
                display: "flex", alignItems: "center", gap: 13, padding: "11px 0",
                borderBottom: "1px solid rgba(255,255,255,0.05)"
              }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(99,102,241,0.2)", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ width: "60%", height: 12, borderRadius: 6, background: "rgba(255,255,255,0.1)", marginBottom: 6 }} />
                  <div style={{ width: "80%", height: 10, borderRadius: 6, background: "rgba(255,255,255,0.06)" }} />
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setShowLoginModal(true)} style={{
            width: "100%", padding: "15px", borderRadius: 16,
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            border: "none", color: "#fff", fontSize: 15, fontWeight: 800,
            cursor: "pointer", boxShadow: "0 6px 24px rgba(99,102,241,0.4)"
          }}>
            Sign In to View Chats
          </button>
          <p style={{ margin: "12px 0 0", fontSize: 12, color: "#334155" }}>100% free · No spam</p>
        </div>
      ) : (
        /* ══ LOGGED IN — Show chats ══ */
        <>
          <p style={{ margin: "12px 18px 4px", fontSize: 11, color: "#475569", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700 }}>
            Recent Messages
          </p>
          <main style={{ flex: 1, overflowY: "auto", paddingBottom: 80 }}>
            {filtered.map((chat) => (
              <div
                key={chat.id}
                onClick={() => router.push(`/messages/${chat.id}`)}
                role="button" tabIndex={0}
                onKeyDown={e => e.key === "Enter" && router.push(`/messages/${chat.id}`)}
                style={{
                  display: "flex", alignItems: "center", gap: 13, padding: "11px 16px",
                  borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer",
                  background: chat.unread > 0 ? "rgba(99,102,241,0.04)" : "transparent",
                  transition: "background 0.15s"
                }}
              >
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <img src={chat.avatarUrl} alt={chat.topperName} style={{
                    width: 52, height: 52, borderRadius: "50%",
                    objectFit: "cover", objectPosition: "top",
                    border: `2px solid ${chat.unread > 0 ? chat.tagColor : "rgba(255,255,255,0.08)"}`
                  }} />
                  {chat.online && (
                    <div style={{
                      position: "absolute", bottom: 1, right: 1,
                      width: 13, height: 13, borderRadius: "50%",
                      background: "#22c55e", border: "2px solid #0d1117",
                      boxShadow: "0 0 6px #22c55e"
                    }} />
                  )}
                  {chat.unread > 0 && (
                    <div style={{
                      position: "absolute", top: -3, right: -3,
                      background: "#6366f1", borderRadius: "50%",
                      width: 18, height: 18, fontSize: 10, fontWeight: 800,
                      color: "#fff", display: "flex", alignItems: "center",
                      justifyContent: "center", border: "2px solid #0d1117"
                    }}>{chat.unread}</div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 3 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: chat.unread > 0 ? 800 : 600, color: chat.unread > 0 ? "#e2e8f0" : "#94a3b8" }}>
                      {chat.topperName}
                    </p>
                    <span style={{ fontSize: 11, color: chat.unread > 0 ? "#818cf8" : "#475569", fontWeight: chat.unread > 0 ? 700 : 400, flexShrink: 0 }}>
                      {chat.lastTime}
                    </span>
                  </div>
                  <p style={{
                    margin: 0, fontSize: 12, color: chat.unread > 0 ? "#94a3b8" : "#475569",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                  }}>
                    {chat.lastMessage}
                  </p>
                  <span style={{
                    display: "inline-block", marginTop: 4,
                    background: `${chat.tagColor}18`, border: `1px solid ${chat.tagColor}33`,
                    borderRadius: 6, padding: "1px 7px", fontSize: 9, fontWeight: 700, color: chat.tagColor
                  }}>{chat.subject}</span>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <p style={{ fontSize: 36, margin: "0 0 10px" }}>💬</p>
                <p style={{ fontSize: 14, color: "#64748b" }}>No chats found</p>
              </div>
            )}
          </main>
        </>
      )}

      {/* ── Login Modal ── */}
      {showLoginModal && (
        <LoginModal
          reason="view your chats"
          returnTo="/messages"
          onClose={() => setShowLoginModal(false)}
        />
      )}

      <BottomNav active="chats" />
    </div>
  );
}
