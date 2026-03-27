"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft, Plus, IndianRupee, Clock,
    TrendingDown, TrendingUp, Info, ShieldCheck,
    Zap, ChevronRight, CheckCircle
} from "lucide-react";

/* ── Mock Data ── */
const BALANCE = 120;

const TRANSACTIONS = [
    { id: "1", type: "call", label: "Call with Ananya S.", sub: "Physics · 8 min", amount: -80, time: "Today, 10:42 AM", icon: "📞" },
    { id: "2", type: "topup", label: "Added via UPI", sub: "PhonePe · Ref: TT8823", amount: 200, time: "Today, 9:15 AM", icon: "💳" },
    { id: "3", type: "call", label: "Call with Priya K.", sub: "Chemistry · 12 min", amount: -120, time: "Yesterday, 4:20 PM", icon: "📞" },
    { id: "4", type: "call", label: "Call with Rohan M.", sub: "Biology · 5 min (min charge)", amount: -50, time: "Yesterday, 11:00 AM", icon: "📞" },
    { id: "5", type: "topup", label: "Added via UPI", sub: "GPay · Ref: TT7731", amount: 500, time: "2 days ago", icon: "💳" },
    { id: "6", type: "call", label: "Call with Arjun V.", sub: "Maths · 31 min", amount: -310, time: "3 days ago", icon: "📞" },
    { id: "7", type: "refund", label: "Refund — Call failed", sub: "Auto-refunded instantly", amount: 50, time: "3 days ago", icon: "↩️" },
];

const PACKS = [
    { amount: 50, label: "Starter", sub: "1 call", badge: null, color: "#6366f1" },
    { amount: 100, label: "Popular", sub: "2 calls", badge: "MOST SAVED", color: "#8b5cf6" },
    { amount: 200, label: "Value", sub: "4 calls", badge: null, color: "#a78bfa" },
    { amount: 500, label: "Pro", sub: "10 calls + bonus", badge: "BEST VALUE", color: "#ec4899" },
];

export default function WalletPage() {
    const router = useRouter();
    const [customAmount, setCustomAmount] = useState("");
    const [selectedPack, setSelectedPack] = useState<number | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showHowItWorks, setShowHowItWorks] = useState(false);

    const finalAmount = selectedPack ?? (customAmount ? Number(customAmount) : null);

    const handlePay = () => {
        if (!finalAmount || finalAmount < 50) return;
        setShowSuccess(true);
        setTimeout(() => { setShowSuccess(false); setSelectedPack(null); setCustomAmount(""); }, 3000);
    };

    return (
        <div style={{
            minHeight: "100vh", maxWidth: 480, margin: "0 auto",
            background: "#0d1117", display: "flex", flexDirection: "column", paddingBottom: 40
        }}>
            <style>{`
        @keyframes slideUp{from{transform:translateY(30px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes pop{0%{transform:scale(0.8);opacity:0}70%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
      `}</style>

            {/* ── HEADER ── */}
            <header style={{
                background: "linear-gradient(180deg,#13192b,#0d1117)",
                borderBottom: "1px solid rgba(99,102,241,0.15)",
                padding: "14px 16px", display: "flex", alignItems: "center", gap: 14,
                position: "sticky", top: 0, zIndex: 30
            }}>
                <button onClick={() => router.back()} style={{
                    width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.06)",
                    border: "none", color: "#94a3b8", display: "flex", alignItems: "center",
                    justifyContent: "center", cursor: "pointer"
                }}><ArrowLeft size={18} /></button>
                <div style={{ flex: 1 }}>
                    <h1 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#e2e8f0" }}>My Wallet</h1>
                    <p style={{ margin: 0, fontSize: 11, color: "#475569" }}>Add money · Call Toppers</p>
                </div>
                <button onClick={() => setShowHowItWorks(true)} style={{
                    width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)", color: "#475569",
                    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
                }}><Info size={16} /></button>
            </header>

            <div style={{ padding: "16px 14px 0" }}>

                {/* ── BALANCE CARD ── */}
                <div style={{
                    borderRadius: 24, padding: "24px", marginBottom: 16,
                    background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)",
                    border: "1px solid rgba(99,102,241,0.35)",
                    boxShadow: "0 0 60px rgba(99,102,241,0.2)",
                    position: "relative", overflow: "hidden"
                }}>
                    {/* decorative */}
                    <div style={{
                        position: "absolute", top: -30, right: -30,
                        width: 120, height: 120, borderRadius: "50%",
                        background: "rgba(139,92,246,0.2)", pointerEvents: "none"
                    }} />

                    <p style={{ margin: "0 0 4px", fontSize: 12, color: "#a5b4fc", textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 700 }}>
                        Available Balance
                    </p>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
                        <span style={{ fontSize: 44, fontWeight: 900, color: "#fff", lineHeight: 1 }}>
                            ₹{BALANCE.toLocaleString()}
                        </span>
                    </div>

                    {/* Low balance warning */}
                    {BALANCE < 150 && (
                        <div style={{
                            display: "inline-flex", alignItems: "center", gap: 6,
                            background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)",
                            borderRadius: 50, padding: "4px 12px", marginBottom: 10
                        }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", animation: "pulse 1s infinite" }} />
                            <span style={{ fontSize: 11, color: "#f87171", fontWeight: 700 }}>Low balance — add ₹50 to call</span>
                        </div>
                    )}

                    {/* Mini stats */}
                    <div style={{ display: "flex", gap: 16, marginTop: 6 }}>
                        <div>
                            <p style={{ margin: 0, fontSize: 10, color: "#94a3b8" }}>Spent this week</p>
                            <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#e2e8f0" }}>₹560</p>
                        </div>
                        <div style={{ width: 1, background: "rgba(255,255,255,0.1)" }} />
                        <div>
                            <p style={{ margin: 0, fontSize: 10, color: "#94a3b8" }}>Calls made</p>
                            <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#e2e8f0" }}>7 sessions</p>
                        </div>
                        <div style={{ width: 1, background: "rgba(255,255,255,0.1)" }} />
                        <div>
                            <p style={{ margin: 0, fontSize: 10, color: "#94a3b8" }}>Avg / call</p>
                            <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#e2e8f0" }}>₹80</p>
                        </div>
                    </div>
                </div>

                {/* ── HOW PRICING WORKS ── */}
                <div style={{
                    borderRadius: 16, padding: "12px 14px", marginBottom: 16,
                    background: "linear-gradient(135deg,rgba(34,197,94,0.08),rgba(16,185,129,0.05))",
                    border: "1px solid rgba(34,197,94,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "space-between"
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Zap size={16} color="#4ade80" />
                        <div>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#4ade80" }}>₹50 flat · 5 min</p>
                            <p style={{ margin: "1px 0 0", fontSize: 10, color: "#64748b" }}>Then ₹10/min if call extends · Auto deducted</p>
                        </div>
                    </div>
                    <button onClick={() => setShowHowItWorks(true)} style={{
                        padding: "5px 10px", borderRadius: 8, fontSize: 10, fontWeight: 700,
                        background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)",
                        color: "#4ade80", cursor: "pointer"
                    }}>Details</button>
                </div>

                {/* ── ADD MONEY SECTION ── */}
                <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.8 }}>
                    Quick Add
                </p>

                {/* Pack grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                    {PACKS.map(pack => {
                        const sel = selectedPack === pack.amount;
                        return (
                            <button key={pack.amount} onClick={() => { setSelectedPack(sel ? null : pack.amount); setCustomAmount(""); }}
                                style={{
                                    padding: "14px 12px", borderRadius: 18, cursor: "pointer", textAlign: "left",
                                    background: sel ? `linear-gradient(135deg,${pack.color}33,${pack.color}1a)` : "#161b27",
                                    border: `1.5px solid ${sel ? pack.color : "rgba(255,255,255,0.06)"}`,
                                    boxShadow: sel ? `0 4px 20px ${pack.color}33` : "none",
                                    transition: "all 0.2s", position: "relative"
                                }}>
                                {pack.badge && (
                                    <span style={{
                                        position: "absolute", top: -8, right: 10,
                                        background: pack.color, borderRadius: 50,
                                        padding: "2px 8px", fontSize: 8, fontWeight: 800, color: "#fff"
                                    }}>{pack.badge}</span>
                                )}
                                <p style={{ margin: "0 0 2px", fontSize: 20, fontWeight: 900, color: sel ? "#fff" : "#e2e8f0" }}>
                                    ₹{pack.amount}
                                </p>
                                <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 700, color: sel ? pack.color : "#64748b" }}>
                                    {pack.label}
                                </p>
                                <p style={{ margin: 0, fontSize: 10, color: "#475569" }}>{pack.sub}</p>
                            </button>
                        );
                    })}
                </div>

                {/* Custom amount */}
                <div style={{ marginBottom: 14 }}>
                    <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5 }}>
                        Or enter custom amount (₹50 min)
                    </p>
                    <div style={{ position: "relative" }}>
                        <span style={{
                            position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                            fontSize: 16, fontWeight: 700, color: "#818cf8"
                        }}>₹</span>
                        <input
                            value={customAmount}
                            onChange={e => { setCustomAmount(e.target.value); setSelectedPack(null); }}
                            placeholder="Enter amount..."
                            type="number" min={50}
                            style={{
                                width: "100%", padding: "13px 16px 13px 32px", borderRadius: 14, boxSizing: "border-box",
                                background: "#161b27",
                                border: `1.5px solid ${customAmount && Number(customAmount) >= 50 ? "#6366f1" : "rgba(255,255,255,0.08)"}`,
                                color: "#e2e8f0", fontSize: 18, fontWeight: 800, outline: "none"
                            }}
                        />
                    </div>
                    {customAmount && Number(customAmount) < 50 && (
                        <p style={{ margin: "4px 0 0", fontSize: 11, color: "#ef4444", fontWeight: 600 }}>
                            ⚠️ Minimum add amount is ₹50
                        </p>
                    )}
                </div>

                {/* UPI options */}
                <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Pay via
                </p>
                <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                    {[
                        { label: "UPI / GPay", icon: "📱", desc: "PhonePe, GPay, Paytm" },
                        { label: "Card", icon: "💳", desc: "Debit / Credit" },
                        { label: "Net Banking", icon: "🏦", desc: "All major banks" },
                    ].map(m => (
                        <div key={m.label} style={{
                            flex: 1, background: "#161b27", border: "1px solid rgba(255,255,255,0.06)",
                            borderRadius: 12, padding: "10px 8px", textAlign: "center", cursor: "pointer"
                        }}>
                            <p style={{ margin: "0 0 2px", fontSize: 18 }}>{m.icon}</p>
                            <p style={{ margin: "0 0 1px", fontSize: 10, fontWeight: 700, color: "#e2e8f0" }}>{m.label}</p>
                            <p style={{ margin: 0, fontSize: 9, color: "#475569" }}>{m.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Pay button */}
                <button onClick={handlePay}
                    disabled={!finalAmount || finalAmount < 50}
                    style={{
                        width: "100%", padding: "16px", borderRadius: 18, marginBottom: 12,
                        background: finalAmount && finalAmount >= 50
                            ? "linear-gradient(135deg,#6366f1,#8b5cf6)"
                            : "rgba(255,255,255,0.05)",
                        border: "none", color: finalAmount && finalAmount >= 50 ? "#fff" : "#334155",
                        fontSize: 15, fontWeight: 800, cursor: finalAmount && finalAmount >= 50 ? "pointer" : "not-allowed",
                        boxShadow: finalAmount && finalAmount >= 50 ? "0 4px 24px rgba(99,102,241,0.45)" : "none",
                        transition: "all 0.2s"
                    }}>
                    {finalAmount && finalAmount >= 50 ? `Add ₹${finalAmount} to Wallet →` : "Select or enter an amount"}
                </button>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 20 }}>
                    <ShieldCheck size={13} color="#22c55e" />
                    <p style={{ margin: 0, fontSize: 11, color: "#475569" }}>100% secure · Powered by Razorpay · Instant credit</p>
                </div>

                {/* ── TRANSACTION HISTORY ── */}
                <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.8 }}>
                    Transaction History
                </p>
                {TRANSACTIONS.map(tx => (
                    <div key={tx.id} style={{
                        background: "#161b27", border: "1px solid rgba(255,255,255,0.05)",
                        borderRadius: 14, padding: "13px 14px", marginBottom: 8,
                        display: "flex", alignItems: "center", gap: 12,
                        animation: "slideUp 0.3s ease"
                    }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                            background: tx.type === "topup" ? "rgba(34,197,94,0.1)" :
                                tx.type === "refund" ? "rgba(99,102,241,0.1)" : "rgba(239,68,68,0.08)",
                            border: tx.type === "topup" ? "1px solid rgba(34,197,94,0.2)" :
                                tx.type === "refund" ? "1px solid rgba(99,102,241,0.2)" : "1px solid rgba(239,68,68,0.15)",
                            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18
                        }}>{tx.icon}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{tx.label}</p>
                            <p style={{ margin: "2px 0 0", fontSize: 10, color: "#475569" }}>{tx.sub}</p>
                            <p style={{ margin: "2px 0 0", fontSize: 10, color: "#334155" }}>{tx.time}</p>
                        </div>
                        <p style={{
                            margin: 0, fontSize: 15, fontWeight: 900, flexShrink: 0,
                            color: tx.amount > 0 ? "#22c55e" : "#ef4444"
                        }}>
                            {tx.amount > 0 ? "+" : ""}₹{Math.abs(tx.amount)}
                        </p>
                    </div>
                ))}
            </div>

            {/* ══ SUCCESS TOAST ══ */}
            {showSuccess && (
                <div style={{
                    position: "fixed", top: 70, left: "50%", transform: "translateX(-50%)",
                    background: "linear-gradient(135deg,#22c55e,#16a34a)",
                    borderRadius: 16, padding: "14px 20px", zIndex: 200,
                    display: "flex", alignItems: "center", gap: 10,
                    boxShadow: "0 8px 32px rgba(34,197,94,0.5)",
                    animation: "pop 0.3s ease"
                }}>
                    <CheckCircle size={20} color="#fff" />
                    <div>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#fff" }}>₹{finalAmount} Added! 🎉</p>
                        <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.8)" }}>Balance updated instantly</p>
                    </div>
                </div>
            )}

            {/* ══ HOW IT WORKS MODAL ══ */}
            {showHowItWorks && (
                <div style={{
                    position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "flex-end",
                    background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)"
                }}
                    onClick={() => setShowHowItWorks(false)}>
                    <div style={{
                        width: "100%", maxWidth: 480, margin: "0 auto",
                        background: "#13192b", borderRadius: "24px 24px 0 0",
                        borderTop: "1px solid rgba(99,102,241,0.2)", padding: "20px 20px 36px"
                    }} onClick={e => e.stopPropagation()}>
                        <p style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 800, color: "#e2e8f0" }}>💡 How Pricing Works</p>
                        {[
                            { icon: "💸", title: "₹50 minimum per call", desc: "Covers the first 5 minutes. Minimum booking to connect to a topper." },
                            { icon: "⏱️", title: "₹10/min after 5 min", desc: "If your session needs more time, ₹10 is deducted per additional minute." },
                            { icon: "🔒", title: "Balance frozen before call", desc: "We hold ₹50 from your wallet before connecting. If you hang up before 5 min, no extra charge." },
                            { icon: "⚡", title: "Auto deducted after session", desc: "Exact amount is calculated and deducted when the call ends. Difference is instantly refunded." },
                            { icon: "↩️", title: "Refund if topper doesn't pick up", desc: "Full refund if the topper doesn't answer within 30 seconds." },
                        ].map((item, i) => (
                            <div key={i} style={{ display: "flex", gap: 12, marginBottom: 14, alignItems: "flex-start" }}>
                                <div style={{
                                    width: 38, height: 38, borderRadius: 10, flexShrink: 0, fontSize: 18,
                                    background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)",
                                    display: "flex", alignItems: "center", justifyContent: "center"
                                }}>{item.icon}</div>
                                <div>
                                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{item.title}</p>
                                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748b", lineHeight: 1.5 }}>{item.desc}</p>
                                </div>
                            </div>
                        ))}
                        <button onClick={() => setShowHowItWorks(false)} style={{
                            width: "100%", padding: "13px", borderRadius: 14, marginTop: 4,
                            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                            color: "#94a3b8", fontSize: 14, fontWeight: 700, cursor: "pointer"
                        }}>Got it ✓</button>
                    </div>
                </div>
            )}
        </div>
    );
}
