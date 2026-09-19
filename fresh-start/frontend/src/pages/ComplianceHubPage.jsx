import { Link } from "react-router-dom";
import PublicComplianceLinks from "../components/PublicComplianceLinks";

const CARDS = [
  { to: "/about", title: "About Us", desc: "What TopperTalks does and who runs it." },
  { to: "/contact", title: "Contact Us", desc: "Support email, grievance email, address and phone placeholder." },
  { to: "/pricing", title: "Pricing / Services", desc: "Public pricing and wallet flow." },
  { to: "/terms", title: "Terms & Conditions", desc: "User rules, sessions and platform use." },
  { to: "/privacy", title: "Privacy Policy", desc: "How we collect, use and protect data." },
  { to: "/refund-policy", title: "Cancellation & Refund", desc: "No-show, cancellation and refund rules." },
];

export default function ComplianceHubPage() {
  return (
    <div className="page" style={{ paddingBottom: 40 }}>
      <header style={{ background: "linear-gradient(180deg,#13192b,#0d1117)", borderBottom: "1px solid rgba(99,102,241,0.15)", padding: "16px 16px 14px" }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: "#818cf8", textTransform: "uppercase", letterSpacing: 0.8 }}>Compliance center</p>
        <h1 style={{ margin: "4px 0 6px", fontSize: 18, fontWeight: 900, color: "#e2e8f0" }}>Public policy pages</h1>
        <p style={{ margin: 0, fontSize: 13, color: "#94a3b8", lineHeight: 1.7 }}>These are the public pages that should stay visible from the app footer and other entry points so customers can review the important platform rules before they use the service.</p>
      </header>

      <div style={{ padding: "18px 14px 24px" }}>
        <div style={{ display: "grid", gap: 10 }}>
          {CARDS.map((card) => (
            <Link key={card.to} to={card.to} style={{ background: "#161b27", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 18, padding: 16, textDecoration: "none" }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#e2e8f0" }}>{card.title}</p>
              <p style={{ margin: "6px 0 0", fontSize: 13, color: "#94a3b8", lineHeight: 1.65 }}>{card.desc}</p>
            </Link>
          ))}
        </div>

        <PublicComplianceLinks compact label="Quick links" />

        <div style={{ marginTop: 18, padding: 16, borderRadius: 18, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)" }}>
          <p style={{ margin: 0, fontSize: 13, color: "#c7d2fe", lineHeight: 1.75 }}>If you want, I can also make these links appear in a small footer block on the login and registration screens so the compliance surface is visible even before sign-in.</p>
        </div>
      </div>
    </div>
  );
}