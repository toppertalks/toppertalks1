import React from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PublicComplianceLinks from "./PublicComplianceLinks";

function SectionCard({ section, accent }) {
  return (
    <article style={{ background: "#161b27", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 18, padding: 16, marginBottom: 10 }}>
      <p style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 800, color: "#e2e8f0" }}>{section.title}</p>
      {Array.isArray(section.body) ? section.body.map((line, index) => (
        <p key={index} style={{ margin: index === 0 ? 0 : "10px 0 0", fontSize: 13, color: "#94a3b8", lineHeight: 1.75 }}>
          {line}
        </p>
      )) : (
        <p style={{ margin: 0, fontSize: 13, color: "#94a3b8", lineHeight: 1.75 }}>{section.body}</p>
      )}
      {section.note && (
        <p style={{ margin: "12px 0 0", fontSize: 11, color: accent, fontWeight: 700 }}>{section.note}</p>
      )}
    </article>
  );
}

export default function CompliancePage({
  eyebrow,
  title,
  subtitle,
  accent = "#818cf8",
  heroLabel,
  highlights = [],
  sections = [],
  contact,
  footnote,
}) {
  const navigate = useNavigate();

  return (
    <div className="page" style={{ paddingBottom: 40 }}>
      <header style={{ background: "linear-gradient(180deg,#13192b,#0d1117)", borderBottom: "1px solid rgba(99,102,241,0.15)", padding: "14px 16px", position: "sticky", top: 0, zIndex: 30 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <button onClick={() => navigate(-1)} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", cursor: "pointer" }}>
            <ChevronLeft size={18} />
          </button>
          <div>
            {eyebrow && <p style={{ margin: 0, fontSize: 11, fontWeight: 800, letterSpacing: 0.8, color: accent, textTransform: "uppercase" }}>{eyebrow}</p>}
            <h1 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#e2e8f0" }}>{title}</h1>
          </div>
        </div>
        {heroLabel && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, borderRadius: 999, padding: "8px 12px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.16)", color: accent, fontSize: 12, fontWeight: 700 }}>
            {heroLabel}
          </div>
        )}
      </header>

      <div style={{ padding: "18px 14px 24px" }}>
        <div style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.14), rgba(15,23,42,0.96))", border: "1px solid rgba(99,102,241,0.16)", borderRadius: 20, padding: 18, marginBottom: 14, boxShadow: "0 16px 40px rgba(0,0,0,0.18)" }}>
          <p style={{ margin: "0 0 8px", fontSize: 12, color: accent, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.7 }}>TopperTalks</p>
          <p style={{ margin: "0 0 12px", fontSize: 18, fontWeight: 900, color: "#f8fafc", lineHeight: 1.2 }}>{title}</p>
          <p style={{ margin: 0, fontSize: 13, color: "#94a3b8", lineHeight: 1.75 }}>{subtitle}</p>
        </div>

        {highlights.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, marginBottom: 14 }}>
            {highlights.map((item) => (
              <div key={item.label} style={{ background: "#161b27", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 14 }}>
                <p style={{ margin: 0, fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 700 }}>{item.label}</p>
                <p style={{ margin: "6px 0 0", fontSize: 14, color: "#e2e8f0", fontWeight: 800, lineHeight: 1.35 }}>{item.value}</p>
              </div>
            ))}
          </div>
        )}

        {sections.map((section) => (
          <SectionCard key={section.title} section={section} accent={accent} />
        ))}

        {contact && (
          <div style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 18, padding: 16, marginTop: 14 }}>
            <p style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 800, color: "#e2e8f0" }}>{contact.title}</p>
            {contact.lines.map((line, index) => (
              <p key={index} style={{ margin: index === 0 ? 0 : "4px 0 0", fontSize: 13, color: index === 0 ? accent : "#94a3b8", fontWeight: index === 0 ? 700 : 400, lineHeight: 1.65 }}>
                {line}
              </p>
            ))}
          </div>
        )}

        {footnote && <p style={{ margin: "16px 0 0", fontSize: 11, color: "#64748b", lineHeight: 1.7 }}>{footnote}</p>}

        <PublicComplianceLinks />
      </div>
    </div>
  );
}