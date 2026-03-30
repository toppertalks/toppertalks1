import React, { useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Mail, ArrowRight, ChevronLeft, User, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react";
import { logActivity } from "../lib/logger";

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextUrl = searchParams.get("next") ?? "/";
  const [step, setStep] = useState("choose");
  const [authMode, setAuthMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const userRef = useRef(null);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleGoogle = async () => {
    setError("");
    setGoogleLoading(true);
    logActivity({ event: "signin_attempt", provider: "google", page: "login" });
    try {
      const { signInWithGoogle, getUserProfile } = await import("../lib/auth");
      const user = await signInWithGoogle();
      userRef.current = user;
      logActivity({ event: "signin_success", provider: "google", uid: user.uid, email: user.email, page: "login" });
      const profile = await getUserProfile(user.uid);
      logActivity({ event: "profile_fetch", uid: user.uid, found: !!(profile?.name) });
      if (profile?.name && profile?.role) {
        const { setLocalUser } = await import("../lib/auth-guard");
        setLocalUser(user.uid, profile.name, profile.role);
        logActivity({ event: "navigate", to: profile.role === "topper" ? "/topper" : nextUrl, from: "/login" });
        navigate(profile.role === "topper" ? "/topper" : nextUrl);
        return;
      }
      setName(user.displayName ?? "");
      setStep("profile");
    } catch (err) {
      const code = err?.code ?? "";
      const msg = err instanceof Error ? err.message : String(err);
      logActivity({ event: "signin_error", provider: "google", errorCode: code, error: msg, page: "login" });
      if (msg.includes("Redirecting to Google")) return;
      if (msg.includes("popup-closed")) setError("Sign-in cancelled. Please try again.");
      else setError("Sign-in failed. Check your internet connection.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleEmail = async () => {
    if (!isValidEmail || password.length < 6) return;
    setError("");
    setLoading(true);
    logActivity({ event: authMode === "login" ? "signin_attempt" : "signup_attempt", provider: "email", email, page: "login" });
    try {
      const { signInWithEmail, signUpWithEmail, getUserProfile } = await import("../lib/auth");
      let user;
      if (authMode === "login") user = await signInWithEmail(email, password);
      else user = await signUpWithEmail(email, password);
      userRef.current = user;
      logActivity({ event: authMode === "login" ? "signin_success" : "signup_success", provider: "email", uid: user.uid, email: user.email, page: "login" });
      const profile = await getUserProfile(user.uid);
      logActivity({ event: "profile_fetch", uid: user.uid, found: !!(profile?.name) });
      if (profile?.name && profile?.role) {
        const { setLocalUser } = await import("../lib/auth-guard");
        setLocalUser(user.uid, profile.name, profile.role);
        logActivity({ event: "navigate", to: profile.role === "topper" ? "/topper" : nextUrl, from: "/login" });
        navigate(profile.role === "topper" ? "/topper" : nextUrl);
        return;
      }
      setStep("profile");
    } catch (err) {
      const code = err?.code ?? "";
      const msg = err instanceof Error ? err.message : String(err);
      logActivity({ event: authMode === "login" ? "signin_error" : "signup_error", provider: "email", errorCode: code, error: msg, page: "login" });
      if (msg.includes("user-not-found") || msg.includes("wrong-password") || msg.includes("invalid-credential")) setError("Incorrect email or password.");
      else if (msg.includes("email-already-in-use")) { setError("Account already exists. Please sign in instead."); setAuthMode("login"); }
      else if (msg.includes("weak-password")) setError("Password must be at least 6 characters.");
      else if (msg.includes("invalid-email")) setError("Please enter a valid email address.");
      else setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const completeProfile = async () => {
    if (!name.trim() || !role) return;
    setLoading(true);
    logActivity({ event: "profile_save", uid: userRef.current?.uid, name: name.trim(), role, page: "login" });
    try {
      const user = userRef.current;
      if (user) {
        const { saveUserProfile } = await import("../lib/auth");
        await saveUserProfile(user, { name: name.trim(), role });
      }
      const { setLocalUser } = await import("../lib/auth-guard");
      if (user) setLocalUser(user.uid, name.trim(), role);
      if (role === "topper") navigate("/become-mentor");
      else navigate(nextUrl);
    } catch {
      const { setLocalUser } = await import("../lib/auth-guard");
      const user = userRef.current;
      if (user) setLocalUser(user.uid, name.trim(), role);
      navigate(role === "topper" ? "/topper" : nextUrl);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-centered">
      <div style={{ width: "100%", maxWidth: 420, animation: "fadeUp 0.4s ease" }}>
        {step !== "choose" && (
          <button onClick={() => { setError(""); setStep(step === "profile" ? "email" : "choose"); }} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 24, background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
            <ChevronLeft size={18} /> Back
          </button>
        )}

        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ width: 72, height: 72, borderRadius: 22, margin: "0 auto 16px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 40px rgba(99,102,241,0.5)", fontSize: 34 }}>🎓</div>
          <h1 style={{ margin: "0 0 6px", fontSize: 26, fontWeight: 900, color: "#e2e8f0" }}>
            {step === "choose" && "Welcome to TopperTalks"}
            {step === "email" && (authMode === "login" ? "Sign In" : "Create Account")}
            {step === "profile" && "Set Up Your Profile"}
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
            {step === "choose" && "Find your personal IIT & AIIMS mentor"}
            {step === "email" && (authMode === "login" ? "Sign in to your TopperTalks account" : "Join thousands of students & toppers")}
            {step === "profile" && "Just a few details to get started"}
          </p>
        </div>

        {error && (
          <div className="error-banner" style={{ marginBottom: 18 }}>
            <AlertCircle size={16} color="#f87171" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ lineHeight: 1.5 }}>{error}</p>
          </div>
        )}

        {/* Choose method */}
        {step === "choose" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button className="btn-outline" onClick={handleGoogle} disabled={googleLoading}>
              {googleLoading ? <div className="spinner" /> : (
                <>
                  <svg width="20" height="20" viewBox="0 0 48 48">
                    <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.2 6.5 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-9 20-20 0-1.3-.1-2.7-.4-4z" />
                    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.2 6.5 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.3-5.2C29.4 35.6 26.8 36 24 36c-5.2 0-9.7-3.4-11.3-8H6.3C9.7 35.7 16.3 44 24 44z" />
                    <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.3 5.2C41.2 35.7 44 30.3 44 24c0-1.3-.1-2.7-.4-4z" />
                  </svg>
                  Continue with Google
                </>
              )}
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "4px 0" }}>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
              <span style={{ fontSize: 12, color: "#334155" }}>or</span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
            </div>
            <button className="btn-primary" onClick={() => { setAuthMode("signup"); setStep("email"); }}>
              <Mail size={18} /> Sign Up with Email
            </button>
            <button className="btn-secondary" onClick={() => { setAuthMode("login"); setStep("email"); }}>
              Already have an account? Sign In
            </button>
            <p style={{ textAlign: "center", margin: "8px 0 0", fontSize: 11, color: "#334155", lineHeight: 1.7 }}>
              By continuing, you agree to our <span onClick={() => navigate("/legal")} style={{ color: "#6366f1", cursor: "pointer" }}>Terms of Service</span> &amp; <span onClick={() => navigate("/legal")} style={{ color: "#6366f1", cursor: "pointer" }}>Privacy Policy</span>
            </p>
          </div>
        )}

        {/* Email form */}
        {step === "email" && (
          <div>
            <div className="auth-toggle">
              {["login", "signup"].map((m) => (
                <button key={m} onClick={() => { setAuthMode(m); setError(""); }} className={authMode === m ? "active" : ""}>
                  {m === "login" ? "Sign In" : "Sign Up"}
                </button>
              ))}
            </div>
            <div style={{ marginBottom: 12 }}>
              <label className="form-label">Email</label>
              <div className={`form-input-group ${isValidEmail ? "focused" : ""}`}>
                <Mail size={16} color="#6366f1" />
                <input autoFocus type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" onKeyDown={(e) => e.key === "Enter" && document.getElementById("pass-input")?.focus()} />
                {isValidEmail && <CheckCircle size={16} color="#22c55e" />}
              </div>
            </div>
            <div style={{ marginBottom: 22 }}>
              <label className="form-label">Password</label>
              <div className="form-input-group">
                <input id="pass-input" type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={authMode === "signup" ? "Min 6 characters" : "Your password"} onKeyDown={(e) => e.key === "Enter" && handleEmail()} />
                <button onClick={() => setShowPass(!showPass)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 0, display: "flex" }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button className="btn-primary" onClick={handleEmail} disabled={!isValidEmail || password.length < 6 || loading}>
              {loading ? <div className="spinner" /> : <>{authMode === "login" ? "Sign In" : "Create Account"} <ArrowRight size={18} /></>}
            </button>
            {authMode === "login" && (
              <button style={{ display: "block", width: "100%", marginTop: 14, background: "none", border: "none", color: "#6366f1", fontSize: 13, fontWeight: 600, cursor: "pointer", textAlign: "center" }}>Forgot password?</button>
            )}
          </div>
        )}

        {/* Profile setup */}
        {step === "profile" && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <label className="form-label">Your Name</label>
              <div className="form-input-group" style={{ borderColor: "rgba(99,102,241,0.25)" }}>
                <User size={18} color="#6366f1" />
                <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rahul Sharma" />
              </div>
            </div>
            <label className="form-label">I am a...</label>
            <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
              {[
                { key: "student", emoji: "📚", label: "Student", sub: "I want to learn" },
                { key: "topper", emoji: "🏆", label: "Topper", sub: "I want to teach & earn" },
              ].map((r) => (
                <button key={r.key} onClick={() => setRole(r.key)} style={{
                  flex: 1, padding: "16px 10px", borderRadius: 16, textAlign: "center",
                  background: role === r.key ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.03)",
                  border: `2px solid ${role === r.key ? "#6366f1" : "rgba(255,255,255,0.08)"}`,
                  cursor: "pointer", transition: "all 0.15s"
                }}>
                  <p style={{ margin: "0 0 5px", fontSize: 26 }}>{r.emoji}</p>
                  <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 800, color: "#e2e8f0" }}>{r.label}</p>
                  <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>{r.sub}</p>
                </button>
              ))}
            </div>
            {role === "topper" && (
              <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 12, padding: "10px 14px", marginBottom: 18 }}>
                <p style={{ margin: 0, fontSize: 12, color: "#4ade80", lineHeight: 1.6, fontWeight: 600 }}>✅ Earn <strong>₹6/min</strong> for every session. You'll complete our application form next.</p>
              </div>
            )}
            <button className="btn-primary" onClick={completeProfile} disabled={!name.trim() || !role || loading}>
              {loading ? <div className="spinner" /> : <>Let's Go! <ArrowRight size={18} /></>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
