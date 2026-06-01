import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, IndianRupee, Clock, TrendingDown, TrendingUp, Info, ShieldCheck, Zap, ChevronRight, CheckCircle } from "lucide-react";
import { fetchWallet, addMoney } from "../lib/api-client";

const PACKS = [
  { amount: 50, label: "Starter", sub: "1 call", badge: null, color: "#6366f1" },
  { amount: 100, label: "Popular", sub: "2 calls", badge: "MOST SAVED", color: "#8b5cf6" },
  { amount: 200, label: "Value", sub: "4 calls", badge: null, color: "#a78bfa" },
  { amount: 500, label: "Pro", sub: "10 calls + bonus", badge: "BEST VALUE", color: "#ec4899" },
];

export default function WalletPage() {
  const navigate = useNavigate();
  const [customAmount, setCustomAmount] = useState("");
  const [selectedPack, setSelectedPack] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState("");

  const finalAmount = selectedPack ?? (customAmount ? Number(customAmount) : null);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchWallet();
        setBalance(data.balance);
        setTransactions(data.transactions);
      } catch {} finally { setLoadingWallet(false); }
    })();
  }, []);

  const handlePay = async () => {
    if (!finalAmount || finalAmount < 50) return;
    setPayLoading(true); setPayError("");
    try {
      const result = await addMoney(finalAmount);
      setBalance(result.newBalance);
      setShowSuccess(true);
      setSelectedPack(null); setCustomAmount("");
      const wallet = await fetchWallet();
      setTransactions(wallet.transactions);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      setPayError(err.message || "Payment failed");
    } finally { setPayLoading(false); }
  };

  return (
    <div className="page" style={{ paddingBottom: 40 }}>
      {/* Header */}
      <header style={{ background: "linear-gradient(180deg,#13192b,#0d1117)", borderBottom: "1px solid rgba(99,102,241,0.15)", padding: "14px 16px", display: "flex", alignItems: "center", gap: 14, position: "sticky", top: 0, zIndex: 30 }}>
        <button onClick={() => navigate(-1)} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "none", color: "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><ArrowLeft size={18} /></button>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#e2e8f0" }}>My Wallet</h1>
          <p style={{ margin: 0, fontSize: 11, color: "#475569" }}>Add money · Call Toppers</p>
        </div>
        <button onClick={() => setShowHowItWorks(true)} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#475569", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Info size={16} /></button>
      </header>

      <div style={{ padding: "16px 14px 0" }}>
        {/* Balance Card */}
        <div style={{ borderRadius: 24, padding: 24, marginBottom: 16, background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)", border: "1px solid rgba(99,102,241,0.35)", boxShadow: "0 0 60px rgba(99,102,241,0.2)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(139,92,246,0.2)", pointerEvents: "none" }} />
          <p style={{ margin: "0 0 4px", fontSize: 12, color: "#a5b4fc", textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 700 }}>Available Balance</p>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
            <span style={{ fontSize: 44, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{loadingWallet ? "..." : `₹${balance.toLocaleString()}`}</span>
          </div>
          {!loadingWallet && balance < 150 && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 50, padding: "4px 12px", marginBottom: 10 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", animation: "pulse 1s infinite" }} />
              <span style={{ fontSize: 11, color: "#f87171", fontWeight: 700 }}>Low balance — add ₹50 to call</span>
            </div>
          )}
          <div style={{ display: "flex", gap: 16, marginTop: 6 }}>
            {[{ l: "Spent this week", v: "₹560" }, { l: "Calls made", v: "7 sessions" }, { l: "Avg / call", v: "₹80" }].map((s, i) => (
              <React.Fragment key={s.l}>
                {i > 0 && <div style={{ width: 1, background: "rgba(255,255,255,0.1)" }} />}
                <div><p style={{ margin: 0, fontSize: 10, color: "#94a3b8" }}>{s.l}</p><p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#e2e8f0" }}>{s.v}</p></div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Pricing Info */}
        <div style={{ borderRadius: 16, padding: "12px 14px", marginBottom: 16, background: "linear-gradient(135deg,rgba(34,197,94,0.08),rgba(16,185,129,0.05))", border: "1px solid rgba(34,197,94,0.2)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Zap size={16} color="#4ade80" />
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#4ade80" }}>₹50 flat · 5 min</p>
              <p style={{ margin: "1px 0 0", fontSize: 10, color: "#64748b" }}>Then ₹10/min if call extends · Auto deducted</p>
            </div>
          </div>
          <button onClick={() => setShowHowItWorks(true)} style={{ padding: "5px 10px", borderRadius: 8, fontSize: 10, fontWeight: 700, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#4ade80", cursor: "pointer" }}>Details</button>
        </div>

        {/* Quick Add */}
        <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.8 }}>Quick Add</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          {PACKS.map(pack => {
            const sel = selectedPack === pack.amount;
            return (
              <button key={pack.amount} onClick={() => { setSelectedPack(sel ? null : pack.amount); setCustomAmount(""); }} style={{ padding: "14px 12px", borderRadius: 18, cursor: "pointer", textAlign: "left", background: sel ? `linear-gradient(135deg,${pack.color}33,${pack.color}1a)` : "#161b27", border: `1.5px solid ${sel ? pack.color : "rgba(255,255,255,0.06)"}`, boxShadow: sel ? `0 4px 20px ${pack.color}33` : "none", transition: "all 0.2s", position: "relative" }}>
                {pack.badge && <span style={{ position: "absolute", top: -8, right: 10, background: pack.color, borderRadius: 50, padding: "2px 8px", fontSize: 8, fontWeight: 800, color: "#fff" }}>{pack.badge}</span>}
                <p style={{ margin: "0 0 2px", fontSize: 20, fontWeight: 900, color: sel ? "#fff" : "#e2e8f0" }}>₹{pack.amount}</p>
                <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 700, color: sel ? pack.color : "#64748b" }}>{pack.label}</p>
                <p style={{ margin: 0, fontSize: 10, color: "#475569" }}>{pack.sub}</p>
              </button>
            );
          })}
        </div>

        {/* Custom amount */}
        <div style={{ marginBottom: 14 }}>
          <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5 }}>Or enter custom amount (₹50 min)</p>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16, fontWeight: 700, color: "#818cf8" }}>₹</span>
            <input value={customAmount} onChange={e => { setCustomAmount(e.target.value); setSelectedPack(null); }} placeholder="Enter amount..." type="number" min={50} style={{ width: "100%", padding: "13px 16px 13px 32px", borderRadius: 14, boxSizing: "border-box", background: "#161b27", border: `1.5px solid ${customAmount && Number(customAmount) >= 50 ? "#6366f1" : "rgba(255,255,255,0.08)"}`, color: "#e2e8f0", fontSize: 18, fontWeight: 800, outline: "none" }} />
          </div>
          {customAmount && Number(customAmount) < 50 && <p style={{ margin: "4px 0 0", fontSize: 11, color: "#ef4444", fontWeight: 600 }}>⚠️ Minimum add amount is ₹50</p>}
        </div>

        {/* Pay via */}
        <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5 }}>Pay via</p>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {[{ label: "UPI / GPay", icon: "📱", desc: "PhonePe, GPay, Paytm" }, { label: "Card", icon: "💳", desc: "Debit / Credit" }, { label: "Net Banking", icon: "🏦", desc: "All major banks" }].map(m => (
            <div key={m.label} style={{ flex: 1, background: "#161b27", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "10px 8px", textAlign: "center", cursor: "pointer" }}>
              <p style={{ margin: "0 0 2px", fontSize: 18 }}>{m.icon}</p>
              <p style={{ margin: "0 0 1px", fontSize: 10, fontWeight: 700, color: "#e2e8f0" }}>{m.label}</p>
              <p style={{ margin: 0, fontSize: 9, color: "#475569" }}>{m.desc}</p>
            </div>
          ))}
        </div>

        {/* Pay button */}
        <button onClick={handlePay} disabled={!finalAmount || finalAmount < 50 || payLoading} style={{ width: "100%", padding: 16, borderRadius: 18, marginBottom: 12, background: finalAmount && finalAmount >= 50 && !payLoading ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(255,255,255,0.05)", border: "none", color: finalAmount && finalAmount >= 50 && !payLoading ? "#fff" : "#334155", fontSize: 15, fontWeight: 800, cursor: finalAmount && finalAmount >= 50 && !payLoading ? "pointer" : "not-allowed", boxShadow: finalAmount && finalAmount >= 50 && !payLoading ? "0 4px 24px rgba(99,102,241,0.45)" : "none", transition: "all 0.2s" }}>
          {payLoading ? "Processing..." : finalAmount && finalAmount >= 50 ? `Add ₹${finalAmount} to Wallet →` : "Select or enter an amount"}
        </button>

        {payError && <p style={{ textAlign: "center", margin: "0 0 8px", fontSize: 12, color: "#f87171", fontWeight: 600 }}>⚠️ {payError}</p>}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 20 }}>
          <ShieldCheck size={13} color="#22c55e" />
          <p style={{ margin: 0, fontSize: 11, color: "#475569" }}>100% secure · Powered by Razorpay · Instant credit</p>
        </div>

        {/* Transaction History */}
        <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.8 }}>Transaction History</p>
        {transactions.length === 0 && !loadingWallet && <p style={{ textAlign: "center", padding: "24px 0", fontSize: 13, color: "#475569" }}>No transactions yet. Add money to get started!</p>}
        {transactions.map((tx, i) => (
          <div key={tx.id || i} style={{ background: "#161b27", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: "13px 14px", marginBottom: 8, display: "flex", alignItems: "center", gap: 12, animation: "fadeUp 0.3s ease" }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: tx.type === "topup" ? "rgba(34,197,94,0.1)" : tx.type === "refund" ? "rgba(99,102,241,0.1)" : "rgba(239,68,68,0.08)", border: tx.type === "topup" ? "1px solid rgba(34,197,94,0.2)" : tx.type === "refund" ? "1px solid rgba(99,102,241,0.2)" : "1px solid rgba(239,68,68,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
              {tx.type === "topup" ? "💳" : tx.type === "refund" ? "↩️" : "📞"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{tx.description ?? tx.type}</p>
              <p style={{ margin: "2px 0 0", fontSize: 10, color: "#334155" }}>{tx.createdAt?.toDate ? new Date(tx.createdAt.toDate()).toLocaleString() : ""}</p>
            </div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 900, flexShrink: 0, color: tx.amount > 0 ? "#22c55e" : "#ef4444" }}>{tx.amount > 0 ? "+" : ""}₹{Math.abs(tx.amount)}</p>
          </div>
        ))}
      </div>

      {/* Success toast */}
      {showSuccess && (
        <div style={{ position: "fixed", top: 70, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg,#22c55e,#16a34a)", borderRadius: 16, padding: "14px 20px", zIndex: 200, display: "flex", alignItems: "center", gap: 10, boxShadow: "0 8px 32px rgba(34,197,94,0.5)" }}>
          <CheckCircle size={20} color="#fff" />
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#fff" }}>₹{finalAmount} Added! 🎉</p>
            <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.8)" }}>Balance updated instantly</p>
          </div>
        </div>
      )}

      {/* How It Works Modal */}
      {showHowItWorks && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "flex-end", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }} onClick={() => setShowHowItWorks(false)}>
          <div style={{ width: "100%", maxWidth: 480, margin: "0 auto", background: "#13192b", borderRadius: "24px 24px 0 0", borderTop: "1px solid rgba(99,102,241,0.2)", padding: "20px 20px 36px" }} onClick={e => e.stopPropagation()}>
            <p style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 800, color: "#e2e8f0" }}>💡 How Pricing Works</p>
            {[
              { icon: "💸", title: "₹50 minimum per call", desc: "Covers the first 5 minutes. Minimum booking to connect to a topper." },
              { icon: "⏱️", title: "₹10/min after 5 min", desc: "If your session needs more time, ₹10 is deducted per additional minute." },
              { icon: "🔒", title: "Balance frozen before call", desc: "We hold ₹50 from your wallet before connecting. If you hang up before 5 min, no extra charge." },
              { icon: "⚡", title: "Auto deducted after session", desc: "Exact amount is calculated and deducted when the call ends. Difference is instantly refunded." },
              { icon: "↩️", title: "Refund if topper doesn't pick up", desc: "Full refund if the topper doesn't answer within 30 seconds." },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 12, marginBottom: 14, alignItems: "flex-start" }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, fontSize: 18, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>{item.icon}</div>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{item.title}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748b", lineHeight: 1.5 }}>{item.desc}</p>
                </div>
              </div>
            ))}
            <button onClick={() => setShowHowItWorks(false)} style={{ width: "100%", padding: 13, borderRadius: 14, marginTop: 4, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Got it ✓</button>
          </div>
        </div>
      )}
    </div>
  );
}
