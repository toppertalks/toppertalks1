"use client";

import { useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, ArrowRight, ChevronLeft, User, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react";

type Step = "choose" | "email" | "otp" | "profile";
type AuthMode = "login" | "signup";

function LoginPageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const nextUrl = searchParams.get("next") ?? "/";
    const [step, setStep] = useState<Step>("choose");
    const [authMode, setAuthMode] = useState<AuthMode>("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [name, setName] = useState("");
    const [role, setRole] = useState<"student" | "topper" | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [googleLoading, setGoogleLoading] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const firebaseUserRef = useRef<any>(null);

    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    // ── Google Sign-In ─────────────────────────────────────────────────────────
    const handleGoogle = async () => {
        setError("");
        setGoogleLoading(true);
        try {
            const { signInWithGoogle, getUserProfile } = await import("../../lib/auth");
            const user = await signInWithGoogle();
            firebaseUserRef.current = user;

            // Check if profile exists
            const profile = await getUserProfile(user.uid);
            if (profile?.name && profile?.role) {
                localStorage.setItem("tt_user_uid", user.uid);
                localStorage.setItem("tt_user_name", profile.name);
                localStorage.setItem("tt_user_role", profile.role);
                router.push(profile.role === "topper" ? "/topper" : nextUrl);
                return;
            }
            setName(user.displayName ?? "");
            setStep("profile");
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            if (msg.includes("popup-closed")) {
                setError("Sign-in cancelled. Please try again.");
            } else if (msg.includes("unauthorized-domain")) {
                setError("Please add localhost to Firebase Authorized Domains in Firebase Console → Authentication → Settings.");
            } else {
                setError("Google sign-in failed. Check your internet connection.");
            }
        } finally {
            setGoogleLoading(false);
        }
    };

    // ── Email Auth ─────────────────────────────────────────────────────────────
    const handleEmail = async () => {
        if (!isValidEmail || password.length < 6) return;
        setError("");
        setLoading(true);
        try {
            const { signInWithEmail, signUpWithEmail, getUserProfile } = await import("../../lib/auth");

            let user;
            if (authMode === "login") {
                user = await signInWithEmail(email, password);
            } else {
                user = await signUpWithEmail(email, password);
            }
            firebaseUserRef.current = user;

            const profile = await getUserProfile(user.uid);
            if (profile?.name && profile?.role) {
                localStorage.setItem("tt_user_uid", user.uid);
                localStorage.setItem("tt_user_name", profile.name);
                localStorage.setItem("tt_user_role", profile.role);
                router.push(profile.role === "topper" ? "/topper" : nextUrl);
                return;
            }
            // New user → profile setup
            setStep("profile");
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            if (msg.includes("user-not-found") || msg.includes("wrong-password") || msg.includes("invalid-credential")) {
                setError("Incorrect email or password.");
            } else if (msg.includes("email-already-in-use")) {
                setError("Account already exists. Please sign in instead.");
                setAuthMode("login");
            } else if (msg.includes("weak-password")) {
                setError("Password must be at least 6 characters.");
            } else if (msg.includes("invalid-email")) {
                setError("Please enter a valid email address.");
            } else {
                setError("Something went wrong. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    // ── Save Profile ───────────────────────────────────────────────────────────
    const completeProfile = async () => {
        if (!name.trim() || !role) return;
        setLoading(true);
        try {
            const user = firebaseUserRef.current;
            if (user) {
                const { saveUserProfile } = await import("../../lib/auth");
                await saveUserProfile(user, { name: name.trim(), role });
            }
            localStorage.setItem("tt_user_name", name.trim());
            localStorage.setItem("tt_user_role", role);
            if (user) localStorage.setItem("tt_user_uid", user.uid);

            if (role === "topper") {
                router.push("/become-mentor");
            } else {
                router.push(nextUrl); // Return to the page they were trying to visit
            }
        } catch {
            localStorage.setItem("tt_user_name", name.trim());
            localStorage.setItem("tt_user_role", role!);
            router.push(role === "topper" ? "/topper" : nextUrl);
        } finally {
            setLoading(false);
        }
    };

    const Spinner = () => (
        <div style={{ width: 20, height: 20, border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    );

    return (
        <div style={{
            minHeight: "100vh", background: "#0d1117",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            padding: "24px 20px", fontFamily: "'Inter', sans-serif"
        }}>
            <style>{`
                @keyframes fadeUp { from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)} }
                @keyframes spin   { to{transform:rotate(360deg)} }
                input:focus { outline: none; }
            `}</style>

            <div style={{ width: "100%", maxWidth: 420, animation: "fadeUp 0.4s ease" }}>

                {/* Back button */}
                {step !== "choose" && (
                    <button onClick={() => { setError(""); setStep(step === "profile" ? "email" : "choose"); }} style={{
                        display: "flex", alignItems: "center", gap: 6, marginBottom: 24,
                        background: "none", border: "none", color: "#64748b", cursor: "pointer",
                        fontSize: 14, fontWeight: 600
                    }}>
                        <ChevronLeft size={18} /> Back
                    </button>
                )}

                {/* Logo */}
                <div style={{ textAlign: "center", marginBottom: 36 }}>
                    <div style={{
                        width: 72, height: 72, borderRadius: 22, margin: "0 auto 16px",
                        background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "0 12px 40px rgba(99,102,241,0.5)"
                    }}>
                        <span style={{ fontSize: 34 }}>🎓</span>
                    </div>
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

                {/* Error banner */}
                {error && (
                    <div style={{
                        background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
                        borderRadius: 12, padding: "10px 14px", marginBottom: 18,
                        display: "flex", alignItems: "flex-start", gap: 8
                    }}>
                        <AlertCircle size={16} color="#f87171" style={{ flexShrink: 0, marginTop: 1 }} />
                        <p style={{ margin: 0, fontSize: 12, color: "#fca5a5", lineHeight: 1.5 }}>{error}</p>
                    </div>
                )}

                {/* ── STEP: Choose method ── */}
                {step === "choose" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                        {/* Google */}
                        <button onClick={handleGoogle} disabled={googleLoading} style={{
                            width: "100%", padding: "16px", borderRadius: 16,
                            background: "#161b27", border: "1.5px solid rgba(255,255,255,0.1)",
                            color: "#e2e8f0", fontSize: 15, fontWeight: 700, cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
                            transition: "all 0.2s"
                        }}>
                            {googleLoading ? <Spinner /> : (
                                <>
                                    {/* Google coloured G */}
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

                        {/* Divider */}
                        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "4px 0" }}>
                            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
                            <span style={{ fontSize: 12, color: "#334155" }}>or</span>
                            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
                        </div>

                        {/* Email */}
                        <button onClick={() => { setAuthMode("signup"); setStep("email"); }} style={{
                            width: "100%", padding: "16px", borderRadius: 16,
                            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                            border: "none", color: "#fff", fontSize: 15, fontWeight: 700,
                            cursor: "pointer", display: "flex", alignItems: "center",
                            justifyContent: "center", gap: 10,
                            boxShadow: "0 6px 24px rgba(99,102,241,0.4)"
                        }}>
                            <Mail size={18} /> Sign Up with Email
                        </button>

                        <button onClick={() => { setAuthMode("login"); setStep("email"); }} style={{
                            width: "100%", padding: "14px", borderRadius: 16,
                            background: "transparent", border: "1.5px solid rgba(99,102,241,0.3)",
                            color: "#818cf8", fontSize: 14, fontWeight: 700, cursor: "pointer"
                        }}>
                            Already have an account? Sign In
                        </button>

                        <p style={{ textAlign: "center", margin: "8px 0 0", fontSize: 11, color: "#334155", lineHeight: 1.7 }}>
                            By continuing, you agree to our{" "}
                            <span onClick={() => router.push("/legal")} style={{ color: "#6366f1", cursor: "pointer" }}>Terms of Service</span>{" "}
                            &amp; <span onClick={() => router.push("/legal")} style={{ color: "#6366f1", cursor: "pointer" }}>Privacy Policy</span>
                        </p>
                    </div>
                )}

                {/* ── STEP: Email form ── */}
                {step === "email" && (
                    <div>
                        {/* Toggle login/signup */}
                        <div style={{ display: "flex", background: "#161b27", borderRadius: 12, padding: 4, marginBottom: 22, border: "1px solid rgba(255,255,255,0.06)" }}>
                            {(["login", "signup"] as AuthMode[]).map(m => (
                                <button key={m} onClick={() => { setAuthMode(m); setError(""); }} style={{
                                    flex: 1, padding: "9px", borderRadius: 9, border: "none",
                                    background: authMode === m ? "#6366f1" : "transparent",
                                    color: authMode === m ? "#fff" : "#64748b",
                                    fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s"
                                }}>
                                    {m === "login" ? "Sign In" : "Sign Up"}
                                </button>
                            ))}
                        </div>

                        {/* Email input */}
                        <div style={{ marginBottom: 12 }}>
                            <label style={{ display: "block", marginBottom: 7, fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6 }}>Email</label>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#161b27", border: `1.5px solid ${isValidEmail ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.08)"}`, borderRadius: 14, padding: "14px 16px" }}>
                                <Mail size={16} color="#6366f1" />
                                <input
                                    autoFocus
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    onKeyDown={e => e.key === "Enter" && document.getElementById("pass-input")?.focus()}
                                    style={{ flex: 1, background: "transparent", border: "none", color: "#e2e8f0", fontSize: 15, fontWeight: 600 }}
                                />
                                {isValidEmail && <CheckCircle size={16} color="#22c55e" />}
                            </div>
                        </div>

                        {/* Password input */}
                        <div style={{ marginBottom: 22 }}>
                            <label style={{ display: "block", marginBottom: 7, fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6 }}>Password</label>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#161b27", border: "1.5px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "14px 16px" }}>
                                <input
                                    id="pass-input"
                                    type={showPass ? "text" : "password"}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder={authMode === "signup" ? "Min 6 characters" : "Your password"}
                                    onKeyDown={e => e.key === "Enter" && handleEmail()}
                                    style={{ flex: 1, background: "transparent", border: "none", color: "#e2e8f0", fontSize: 15, fontWeight: 600 }}
                                />
                                <button onClick={() => setShowPass(!showPass)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 0, display: "flex" }}>
                                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button onClick={handleEmail} disabled={!isValidEmail || password.length < 6 || loading} style={{
                            width: "100%", padding: "17px", borderRadius: 16,
                            background: isValidEmail && password.length >= 6 && !loading ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(99,102,241,0.2)",
                            border: "none",
                            color: isValidEmail && password.length >= 6 && !loading ? "#fff" : "#4c4f6b",
                            fontSize: 16, fontWeight: 800,
                            cursor: isValidEmail && password.length >= 6 ? "pointer" : "not-allowed",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                            boxShadow: isValidEmail && password.length >= 6 ? "0 6px 24px rgba(99,102,241,0.4)" : "none",
                            transition: "all 0.2s"
                        }}>
                            {loading ? <Spinner /> : <>{authMode === "login" ? "Sign In" : "Create Account"} <ArrowRight size={18} /></>}
                        </button>

                        {authMode === "login" && (
                            <button style={{ display: "block", width: "100%", marginTop: 14, background: "none", border: "none", color: "#6366f1", fontSize: 13, fontWeight: 600, cursor: "pointer", textAlign: "center" }}>
                                Forgot password?
                            </button>
                        )}
                    </div>
                )}

                {/* ── STEP: Profile ── */}
                {step === "profile" && (
                    <div>
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: "block", marginBottom: 7, fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6 }}>Your Name</label>
                            <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#161b27", border: "1.5px solid rgba(99,102,241,0.25)", borderRadius: 14, padding: "14px 16px" }}>
                                <User size={18} color="#6366f1" />
                                <input
                                    autoFocus
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="e.g. Rahul Sharma"
                                    style={{ flex: 1, background: "transparent", border: "none", color: "#e2e8f0", fontSize: 16, fontWeight: 600 }}
                                />
                            </div>
                        </div>

                        <label style={{ display: "block", marginBottom: 10, fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6 }}>I am a...</label>
                        <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
                            {[
                                { key: "student", emoji: "📚", label: "Student", sub: "I want to learn" },
                                { key: "topper", emoji: "🏆", label: "Topper", sub: "I want to teach & earn" }
                            ].map(r => (
                                <button key={r.key} onClick={() => setRole(r.key as "student" | "topper")} style={{
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
                                <p style={{ margin: 0, fontSize: 12, color: "#4ade80", lineHeight: 1.6, fontWeight: 600 }}>
                                    ✅ Earn <strong>₹6/min</strong> for every session. You&apos;ll complete our application form next.
                                </p>
                            </div>
                        )}

                        <button onClick={completeProfile} disabled={!name.trim() || !role || loading} style={{
                            width: "100%", padding: "17px", borderRadius: 16,
                            background: name.trim() && role && !loading ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(99,102,241,0.2)",
                            border: "none", color: name.trim() && role && !loading ? "#fff" : "#4c4f6b",
                            fontSize: 16, fontWeight: 800,
                            cursor: name.trim() && role ? "pointer" : "not-allowed",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                            boxShadow: name.trim() && role ? "0 6px 24px rgba(99,102,241,0.4)" : "none"
                        }}>
                            {loading ? <Spinner /> : <>Let&apos;s Go! <ArrowRight size={18} /></>}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// Suspense wrapper required because useSearchParams needs it in Next.js 14
export default function LoginPage() {
    return (
        <Suspense fallback={<div style={{ minHeight: "100vh", background: "#0d1117" }} />}>
            <LoginPageInner />
        </Suspense>
    );
}
