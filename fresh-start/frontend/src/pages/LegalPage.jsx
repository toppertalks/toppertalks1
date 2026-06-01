import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronDown, ChevronUp } from "lucide-react";

const TERMS_SECTIONS = [
  { title: "1. Acceptance of Terms", body: "By accessing or using TopperTalks, you agree to be bound by these Terms of Service. If you do not agree, please do not use our platform. These terms apply to all users, including students, toppers/mentors, and visitors." },
  { title: "2. Eligibility", body: "You must be at least 13 years of age to use TopperTalks. If you are under 18, you must have consent from a parent or guardian. Toppers must be at least 18 years old and enrolled in or graduated from a recognised institution." },
  { title: "3. User Accounts", body: "You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate information and notify us immediately of any unauthorised use." },
  { title: "4. Call Pricing & Billing", body: "All calls are billed at ₹50 for the first 5 minutes (minimum charge), and ₹10/minute thereafter. Charges are deducted from your wallet before a session begins. No refunds are issued for sessions already completed." },
  { title: "5. Topper/Mentor Earnings", body: "Toppers earn ₹6 per minute for every session. The platform retains ₹4 per minute as a service fee. Earnings are credited to your TopperTalks wallet within 24 hours." },
  { title: "6. Prohibited Conduct", body: "You agree not to: (a) share personal contact details during calls; (b) record sessions without consent; (c) use the platform for any unlawful purpose; (d) harass, abuse, or threaten other users; (e) submit false reports or reviews." },
  { title: "7. Report & Dispute System", body: "If you report misconduct during a call, payment is held for 15 days pending review. Our team will investigate within 72 business hours." },
  { title: "8. Limitation of Liability", body: "TopperTalks is a platform that connects students with mentors. We do not guarantee the accuracy of academic content provided by mentors." },
  { title: "9. Modifications", body: "We reserve the right to modify these Terms at any time. Updated terms will be posted on this page with the effective date." },
  { title: "10. Governing Law", body: "These terms shall be governed by the laws of India. All disputes shall be subject to the courts in Bengaluru, Karnataka." },
];

const PRIVACY_SECTIONS = [
  { title: "1. Information We Collect", body: "We collect: (a) Account information — name, phone number, profile photo; (b) Usage data — sessions, ratings, call durations; (c) Payment data — wallet balance, transaction history; (d) Device data." },
  { title: "2. How We Use Your Information", body: "Your information is used to provide and improve the service, process payments, show relevant toppers, send notifications, and prevent fraud." },
  { title: "3. Data Sharing", body: "We do not sell your personal data. We may share data with payment processors (Razorpay), cloud providers (Firebase/Google), and regulatory authorities when legally required." },
  { title: "4. Data Retention", body: "Account data is retained while your account is active. You can request deletion of your account and all associated data at any time." },
  { title: "5. Your Rights", body: "You have the right to access your personal data, correct inaccurate data, request deletion, and withdraw consent at any time." },
  { title: "6. Security", body: "We implement industry-standard security measures including end-to-end encryption for calls, TLS encryption for data in transit, and AES-256 encryption for data at rest." },
  { title: "7. Cookies & Analytics", body: "We use minimal cookies necessary for authentication. We do not use third-party advertising cookies." },
  { title: "8. Changes to This Policy", body: "We may update this Privacy Policy periodically. We will notify you of significant changes via in-app notification." },
];

const FAQS = [
  { q: "Can I get a refund?", a: "Refunds are not issued for completed sessions. If a call was disconnected due to a technical error, contact support@toppertalks.in within 48 hours." },
  { q: "How do I delete my account?", a: "Go to Profile → Settings → Delete Account, or email support@toppertalks.in." },
  { q: "Is my phone number shared with toppers?", a: "No. Toppers never see your phone number. All communication happens through our masked calling system." },
  { q: "How does the 15-day payment hold work?", a: "When a report is filed, the payment for that session is held in escrow for 15 days. After review, it is either released to the topper or refunded to the student." },
  { q: "What age do I need to be?", a: "Students must be 13+. Toppers must be 18+ with a valid college enrollment proof." },
];

export default function LegalPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("terms");
  const [openFaq, setOpenFaq] = useState(null);
  const [expandedTerms, setExpandedTerms] = useState({});
  const toggleTerm = (i) => setExpandedTerms(prev => ({ ...prev, [i]: !prev[i] }));
  const sections = activeSection === "terms" ? TERMS_SECTIONS : PRIVACY_SECTIONS;

  return (
    <div className="page" style={{ paddingBottom: 40 }}>
      <header style={{ background: "linear-gradient(180deg,#13192b,#0d1117)", borderBottom: "1px solid rgba(99,102,241,0.15)", padding: "14px 16px", position: "sticky", top: 0, zIndex: 30 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <button onClick={() => navigate(-1)} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", cursor: "pointer" }}><ChevronLeft size={18} /></button>
          <h1 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#e2e8f0" }}>Legal & Privacy</h1>
        </div>
        <div style={{ display: "flex", background: "#161b27", borderRadius: 14, padding: 4 }}>
          {[{ key: "terms", label: "📋 Terms of Service" },{ key: "privacy", label: "🔒 Privacy Policy" }].map(t => (
            <button key={t.key} onClick={() => setActiveSection(t.key)} style={{ flex: 1, padding: 10, borderRadius: 10, background: activeSection === t.key ? "rgba(99,102,241,0.2)" : "transparent", border: activeSection === t.key ? "1px solid rgba(99,102,241,0.3)" : "1px solid transparent", color: activeSection === t.key ? "#818cf8" : "#475569", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{t.label}</button>
          ))}
        </div>
      </header>

      <div style={{ padding: "20px 14px" }}>
        <div style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 14, padding: "10px 16px", marginBottom: 20 }}>
          <p style={{ margin: 0, fontSize: 12, color: "#818cf8" }}>📅 Effective Date: <strong>1 March 2025</strong> · Last Updated: <strong>25 Feb 2026</strong></p>
        </div>
        <p style={{ margin: "0 0 20px", fontSize: 13, color: "#64748b", lineHeight: 1.75 }}>{activeSection === "terms" ? "Welcome to TopperTalks. These Terms of Service govern your use of our platform." : "At TopperTalks, we take your privacy seriously. This policy explains how we collect, use, and protect your personal information."}</p>
        {sections.map((s, i) => (
          <div key={i} style={{ background: "#161b27", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, marginBottom: 8, overflow: "hidden", animation: "fadeUp 0.2s ease" }}>
            <button onClick={() => toggleTerm(i)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: 16, background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>{s.title}</p>
              {expandedTerms[i] ? <ChevronUp size={16} color="#6366f1" /> : <ChevronDown size={16} color="#475569" />}
            </button>
            {expandedTerms[i] && <div style={{ padding: "0 16px 16px" }}><p style={{ margin: 0, fontSize: 13, color: "#94a3b8", lineHeight: 1.75 }}>{s.body}</p></div>}
          </div>
        ))}
        <div style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 16, padding: 16, margin: "20px 0" }}>
          <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>📬 Contact Us</p>
          <p style={{ margin: "0 0 4px", fontSize: 12, color: "#64748b" }}>For legal queries, reach us at:</p>
          <p style={{ margin: "0 0 2px", fontSize: 13, color: "#818cf8", fontWeight: 600 }}>legal@toppertalks.in</p>
          <p style={{ margin: 0, fontSize: 12, color: "#475569" }}>TopperTalks Pvt. Ltd., Bengaluru, Karnataka – 560001</p>
        </div>
        <p style={{ margin: "24px 0 12px", fontSize: 13, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: 0.6 }}>❓ Frequently Asked Questions</p>
        {FAQS.map((faq, i) => (
          <div key={i} style={{ background: "#161b27", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, marginBottom: 8, overflow: "hidden" }}>
            <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#94a3b8" }}>{faq.q}</p>
              {openFaq === i ? <ChevronUp size={15} color="#6366f1" /> : <ChevronDown size={15} color="#475569" />}
            </button>
            {openFaq === i && <div style={{ padding: "0 16px 14px" }}><p style={{ margin: 0, fontSize: 13, color: "#64748b", lineHeight: 1.7 }}>{faq.a}</p></div>}
          </div>
        ))}
      </div>
    </div>
  );
}
