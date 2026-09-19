import React from "react";
import { Link } from "react-router-dom";

const LINKS = [
  { to: "/about", label: "About Us" },
  { to: "/contact", label: "Contact Us" },
  { to: "/pricing", label: "Pricing" },
  { to: "/terms", label: "Terms" },
  { to: "/privacy", label: "Privacy" },
  { to: "/refund-policy", label: "Refund Policy" },
];

export default function PublicComplianceLinks({ compact = false, label = "Public pages" }) {
  return (
    <section style={{ marginTop: compact ? 16 : 24 }}>
      <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: 0.8 }}>
        {label}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {LINKS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            style={{
              padding: compact ? "7px 11px" : "9px 13px",
              borderRadius: 999,
              border: "1px solid rgba(99,102,241,0.18)",
              background: "rgba(99,102,241,0.06)",
              color: "#c7d2fe",
              fontSize: compact ? 11 : 12,
              fontWeight: 700,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </section>
  );
}