import React from "react";
import { IndianRupee } from "lucide-react";

export default function WalletPill({ balance }) {
  return (
    <button className="wallet-pill">
      <div className="wallet-pill-icon">
        <IndianRupee size={11} color="#fff" strokeWidth={3} />
      </div>
      <span className="wallet-pill-amount">₹{balance}</span>
    </button>
  );
}
