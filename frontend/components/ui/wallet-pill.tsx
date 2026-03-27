import { IndianRupee } from "lucide-react";

interface WalletPillProps {
  balance: number;
}

export function WalletPill({ balance }: WalletPillProps) {
  return (
    <button
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        borderRadius: 50,
        background: "rgba(99,102,241,0.15)",
        border: "1px solid rgba(99,102,241,0.35)",
        padding: "5px 12px",
        cursor: "pointer"
      }}
    >
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "linear-gradient(135deg,#fbbf24,#f59e0b)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <IndianRupee size={11} color="#fff" strokeWidth={3} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>
        ₹{balance}
      </span>
    </button>
  );
}
