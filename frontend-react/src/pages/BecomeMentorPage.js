import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, CheckCircle, Upload, GraduationCap, BookOpen, IndianRupee } from "lucide-react";
import { submitMentorApplication } from "../lib/api-client";
import { getLocalUser } from "../lib/auth-guard";

const COLLEGES = ["IIT Bombay","IIT Delhi","IIT Madras","IIT Kanpur","IIT Kharagpur","IIT Roorkee","IIT Guwahati","IIT Hyderabad","IIT BHU","IIT Indore","AIIMS Delhi","AIIMS Mumbai","AIIMS Bhopal","AIIMS Rishikesh","NIT Trichy","NIT Warangal","NIT Surathkal","NIT Calicut","NIT Rourkela","BITS Pilani","BITS Goa","BITS Hyderabad","VIT Vellore","Other"];
const SUBJECTS = ["Physics","Chemistry","Mathematics","Biology","Organic Chemistry","Inorganic Chemistry","Physical Chemistry","Calculus","Algebra","Coordinate Geometry","Trigonometry","Mechanics","Electrostatics","Optics","Modern Physics","Genetics","Ecology","Physiology","Biochemistry"];
const EXAMS = [
  { id: "jee-adv", label: "JEE Advanced", icon: "🏆", tag: "IIT" },
  { id: "jee-main", label: "JEE Mains", icon: "📘", tag: "NIT/IIIT" },
  { id: "neet", label: "NEET-UG", icon: "🩺", tag: "AIIMS/MBBS" },
  { id: "bitsat", label: "BITSAT", icon: "⚡", tag: "BITS" },
];
const STEPS = ["Exam & Rank", "College & Year", "Subjects & Rate", "Verification"];

export default function BecomeMentorPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ exams: [], ranks: {}, college: "", year: "2024", branch: "", subjects: [], rate: 20, bio: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleSubject = (s) => set("subjects", form.subjects.includes(s) ? form.subjects.filter(x => x !== s) : [...form.subjects, s]);
  const toggleExam = (id) => {
    const next = form.exams.includes(id) ? form.exams.filter(e => e !== id) : [...form.exams, id];
    set("exams", next);
    if (form.exams.includes(id)) { const r = { ...form.ranks }; delete r[id]; set("ranks", r); }
  };
  const setRank = (examId, val) => set("ranks", { ...form.ranks, [examId]: val });
  const canNext = () => {
    if (step === 0) return form.exams.length > 0 && form.exams.every(e => form.ranks[e]?.trim());
    if (step === 1) return form.college && form.branch;
    if (step === 2) return form.subjects.length > 0;
    return true;
  };

  if (submitted) return (
    <div className="page" style={{ alignItems: "center", justifyContent: "center", padding: "32px 24px", textAlign: "center" }}>
      <div style={{ width: 80, height: 80, borderRadius: "50%", marginBottom: 24, background: "linear-gradient(135deg,#22c55e,#16a34a)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 40px rgba(34,197,94,0.4)" }}><CheckCircle size={40} color="#fff" /></div>
      <h1 style={{ margin: "0 0 10px", fontSize: 24, fontWeight: 800, color: "#e2e8f0" }}>Application Submitted! 🎉</h1>
      <p style={{ margin: "0 0 6px", fontSize: 14, color: "#94a3b8", lineHeight: 1.7 }}>We review all topper applications within <strong style={{ color: "#818cf8" }}>24 hours</strong> to ensure quality.</p>
      <p style={{ margin: "0 0 32px", fontSize: 13, color: "#64748b", lineHeight: 1.7 }}>You'll receive an SMS on your registered number once you're approved and verified.</p>
      <div style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 16, padding: "16px 20px", width: "100%", marginBottom: 24, textAlign: "left" }}>
        <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: 1 }}>What happens next</p>
        {["Admin verifies your ID & rank card","You get approved & onboarded via SMS","Set your rate & go online from Topper Dashboard","Start earning — ₹ credited after each call"].map((t, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8 }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(99,102,241,0.2)", color: "#818cf8", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>{i+1}</div>
            <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>{t}</p>
          </div>
        ))}
      </div>
      <button onClick={() => navigate("/")} className="btn-primary">Back to Home</button>
    </div>
  );

  return (
    <div className="page">
      <header style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "linear-gradient(180deg,#13192b,#0d1117)", borderBottom: "1px solid rgba(99,102,241,0.15)", position: "sticky", top: 0, zIndex: 40 }}>
        <button onClick={() => step > 0 ? setStep(s => s-1) : navigate("/profile")} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "none", color: "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><ArrowLeft size={18} /></button>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#e2e8f0" }}>Become a Mentor</h1>
          <p style={{ margin: 0, fontSize: 11, color: "#475569" }}>Step {step+1} of {STEPS.length} · {STEPS[step]}</p>
        </div>
        <div style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 8, padding: "3px 10px", fontSize: 10, fontWeight: 700, color: "#818cf8" }}>Free to Join</div>
      </header>

      <div style={{ height: 3, background: "#161b27", flexShrink: 0 }}><div style={{ height: "100%", transition: "width 0.4s ease", background: "linear-gradient(90deg,#6366f1,#8b5cf6)", width: `${((step+1)/STEPS.length)*100}%` }} /></div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px 120px", animation: "fadeUp 0.3s ease" }}>
        {/* Step 0: Exams */}
        {step === 0 && (<>
          <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800, color: "#e2e8f0" }}>Which exams did you crack? 🎯</h2>
          <p style={{ margin: "0 0 20px", fontSize: 13, color: "#64748b" }}>Select <strong style={{ color: "#818cf8" }}>all that apply</strong> — enter your rank for each.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 8 }}>
            {EXAMS.map(e => {
              const active = form.exams.includes(e.id);
              return (<div key={e.id}>
                <button onClick={() => toggleExam(e.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: active ? "16px 16px 0 0" : 16, background: active ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.03)", border: `1.5px solid ${active ? "#6366f1" : "rgba(255,255,255,0.08)"}`, borderBottom: active ? "none" : undefined, cursor: "pointer", textAlign: "left", boxShadow: active ? "0 2px 16px rgba(99,102,241,0.2)" : "none" }}>
                  <span style={{ fontSize: 26 }}>{e.icon}</span>
                  <div style={{ flex: 1 }}><p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>{e.label}</p><p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748b" }}>For {e.tag} Students</p></div>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, background: active ? "#6366f1" : "rgba(255,255,255,0.06)", border: `1.5px solid ${active ? "#6366f1" : "rgba(255,255,255,0.15)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>{active && <span style={{ color: "#fff", fontSize: 12, fontWeight: 900 }}>✓</span>}</div>
                </button>
                {active && (
                  <div style={{ background: "rgba(99,102,241,0.07)", border: "1.5px solid #6366f1", borderTop: "none", borderRadius: "0 0 16px 16px", padding: "12px 16px" }}>
                    <label style={{ display: "block", marginBottom: 6, fontSize: 11, fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: 0.5 }}>Your AIR for {e.label}</label>
                    <input value={form.ranks[e.id] || ""} onChange={ev => setRank(e.id, ev.target.value)} placeholder="e.g. 1247" type="number" style={{ width: "100%", padding: "10px 14px", borderRadius: 12, boxSizing: "border-box", background: "#161b27", border: "1.5px solid rgba(99,102,241,0.3)", color: "#e2e8f0", fontSize: 15, outline: "none", fontWeight: 700 }} />
                  </div>
                )}
              </div>);
            })}
          </div>
          {form.exams.length > 0 && (
            <div style={{ marginTop: 4, padding: "10px 14px", borderRadius: 12, background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)" }}>
              <p style={{ margin: 0, fontSize: 12, color: "#4ade80", fontWeight: 600 }}>✓ {form.exams.length} exam{form.exams.length > 1 ? "s" : ""} selected{form.exams.every(e => form.ranks[e]) ? " — all ranks filled ✅" : " — fill all ranks to continue"}</p>
            </div>
          )}
        </>)}

        {/* Step 1: College */}
        {step === 1 && (<>
          <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 800, color: "#e2e8f0" }}>Which college? 🏛️</h2>
          <p style={{ margin: "0 0 20px", fontSize: 13, color: "#64748b" }}>This will be shown on your public profile.</p>
          <label className="form-label">College / Institute</label>
          <select value={form.college} onChange={e => set("college", e.target.value)} className="form-input" style={{ marginBottom: 16 }}>
            <option value="">Select your college...</option>
            {COLLEGES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <label className="form-label">Branch / Course</label>
          <input value={form.branch} onChange={e => set("branch", e.target.value)} placeholder="e.g. B.Tech Computer Science" className="form-input" style={{ marginBottom: 16 }} />
          <label className="form-label">Year of Joining</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["2021","2022","2023","2024","2025"].map(y => (
              <button key={y} onClick={() => set("year", y)} style={{ padding: "9px 20px", borderRadius: 50, background: form.year === y ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(255,255,255,0.04)", border: `1.5px solid ${form.year === y ? "#818cf8" : "rgba(255,255,255,0.1)"}`, color: form.year === y ? "#fff" : "#94a3b8", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{y}</button>
            ))}
          </div>
        </>)}

        {/* Step 2: Subjects */}
        {step === 2 && (<>
          <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 800, color: "#e2e8f0" }}>What will you teach? 📚</h2>
          <p style={{ margin: "0 0 20px", fontSize: 13, color: "#64748b" }}>Select all subjects you're confident in.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
            {SUBJECTS.map(s => {
              const active = form.subjects.includes(s);
              return <button key={s} onClick={() => toggleSubject(s)} style={{ padding: "7px 14px", borderRadius: 50, cursor: "pointer", background: active ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(255,255,255,0.04)", border: `1.5px solid ${active ? "#818cf8" : "rgba(255,255,255,0.1)"}`, color: active ? "#fff" : "#94a3b8", fontSize: 12, fontWeight: active ? 700 : 500, boxShadow: active ? "0 2px 10px rgba(99,102,241,0.3)" : "none" }}>{active ? "✓ " : ""}{s}</button>;
            })}
          </div>
          <div style={{ background: "#161b27", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 16, padding: 20, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div><p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>Platform Rate</p><p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748b" }}>Fixed for all toppers right now</p></div>
              <div style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius: 12, padding: "6px 16px" }}><p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#fff" }}>₹10/min</p></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
              {[{ label: "You Earn", val: "₹6/min", bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.25)", color: "#4ade80" },{ label: "Platform", val: "₹4/min", bg: "rgba(239,68,68,0.06)", border: "rgba(239,68,68,0.2)", color: "#f87171" },{ label: "Min Charge", val: "₹50", bg: "rgba(99,102,241,0.08)", border: "rgba(99,102,241,0.25)", color: "#818cf8" }].map(x => (
                <div key={x.label} style={{ background: x.bg, border: `1px solid ${x.border}`, borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 }}>{x.label}</p>
                  <p style={{ margin: 0, fontSize: 17, fontWeight: 900, color: x.color }}>{x.val}</p>
                </div>
              ))}
            </div>
            <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
              <p style={{ margin: 0, fontSize: 12, color: "#4ade80", fontWeight: 600 }}>💰 30 min session → You earn ₹180 · Min booking = ₹50 flat (5 min)</p>
            </div>
          </div>
          <label className="form-label">Short Bio (optional)</label>
          <textarea value={form.bio} onChange={e => set("bio", e.target.value)} placeholder="Tell students about your JEE/NEET journey and how you can help..." rows={3} className="form-input" style={{ resize: "none", fontFamily: "inherit" }} />
        </>)}

        {/* Step 3: Verification */}
        {step === 3 && (<>
          <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 800, color: "#e2e8f0" }}>Upload Verification 📎</h2>
          <p style={{ margin: "0 0 20px", fontSize: 13, color: "#64748b" }}>We verify to ensure only real toppers join. Docs are private and deleted post-verification.</p>
          {[{ icon: "🪪", title: "College ID Card", sub: "Front side of your current college ID" },{ icon: "📄", title: "JEE/NEET Rank Card", sub: "Screenshot of your official result / rank card" }].map(doc => (
            <div key={doc.title} style={{ marginBottom: 12, border: "1.5px dashed rgba(99,102,241,0.3)", borderRadius: 16, padding: 20, cursor: "pointer", background: "rgba(99,102,241,0.04)", textAlign: "center" }}>
              <p style={{ fontSize: 32, margin: "0 0 8px" }}>{doc.icon}</p>
              <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>{doc.title}</p>
              <p style={{ margin: "0 0 12px", fontSize: 11, color: "#64748b" }}>{doc.sub}</p>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 10, background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)", color: "#818cf8", fontSize: 12, fontWeight: 700, cursor: "pointer" }}><Upload size={14} /> Choose File<input type="file" accept="image/*,.pdf" style={{ display: "none" }} /></label>
            </div>
          ))}
          <div style={{ marginTop: 8, padding: "14px 16px", borderRadius: 12, background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>
            <p style={{ margin: 0, fontSize: 12, color: "#fbbf24", lineHeight: 1.7 }}>🔒 Your documents are encrypted and only viewed by our verification team. They are permanently deleted within 48 hours of review.</p>
          </div>
        </>)}
      </div>

      {/* Bottom CTA */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, padding: "12px 16px 24px", background: "linear-gradient(0deg,#0d1117 80%,transparent)", zIndex: 50 }}>
        {submitError && <p style={{ textAlign: "center", margin: "0 0 8px", fontSize: 12, color: "#f87171", fontWeight: 600 }}>⚠️ {submitError}</p>}
        <button onClick={async () => {
          if (step < STEPS.length - 1) { setStep(s => s+1); return; }
          setSubmitting(true); setSubmitError("");
          try {
            const localUser = getLocalUser();
            await submitMentorApplication({ name: localUser?.name ?? "Applicant", phone: "", college: form.college, exams: form.exams.map(e => ({ exam: e, rank: form.ranks[e] ?? "" })), subjects: form.subjects, bio: form.bio });
            setSubmitted(true);
          } catch (err) { setSubmitError(err.message || "Submission failed"); } finally { setSubmitting(false); }
        }} disabled={!canNext() || submitting} className="btn-primary" style={{ opacity: canNext() && !submitting ? 1 : 0.4, cursor: canNext() && !submitting ? "pointer" : "not-allowed" }}>
          {submitting ? "Submitting..." : step < STEPS.length - 1 ? `Continue → ${STEPS[step+1]}` : "Submit Application 🚀"}
        </button>
      </div>
    </div>
  );
}
