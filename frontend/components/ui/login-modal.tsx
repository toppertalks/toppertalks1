"use client";
/**
 * LoginModal — A slide-up sheet that asks users to sign in.
 * Shows over current page content. Has an ✕ to dismiss.
 * Used on Random, Chats, and Profile pages.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Mail, AlertCircle } from "lucide-react";

interface LoginModalProps {
    /** What the user was trying to do — shown in the title */
    reason?: string;
    /** Called when user taps ✕ or outside */
    onClose: () => void;
    /** Where to go after a successful login */
    returnTo?: string;
}

export function LoginModal({ reason = "use this feature", onClose, returnTo = "/" }: LoginModalProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleGoogle = async () => {
        setError("");
        setLoading(true);
        try {
            const { signInWithGoogle, getUserProfile } = await import("@/lib/auth");
            const user = await signInWithGoogle();
            localStorage.setItem("tt_user_uid", user.uid);
            const profile = await getUserProfile(user.uid);
            if (profile?.name) {
                localStorage.setItem("tt_user_name", profile.name);
                localStorage.setItem("tt_user_role", profile.role);
                onClose();
                // Small delay so onClose can update parent state
                setTimeout(() => router.refresh(), 100);
            } else {
                // New user — go to profile setup
                router.push(`/login?next=${encodeURIComponent(returnTo)}`);
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            if (msg.includes("popup-closed")) setError("Sign-in cancelled. Try again.");
            else if (msg.includes("unauthorized-domain")) setError("Add localhost to Firebase Authorized Domains.");
            else setError("Google sign-in failed. Check connection.");
        } finally {
            setLoading(false);
        }
    };

    const goToEmailLogin = () => {
        onClose();
        router.push(`/login?next=${encodeURIComponent(returnTo)}`);
    };

    const Spinner = () => (
        <div style={{ width: 18, height: 18, border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    );

    return (
        /* Backdrop */
        <div
            onClick={onClose}
            style={{
                position: "fixed", inset: 0, zIndex: 300,
                background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)",
                display: "flex", alignItems: "flex-end", justifyContent: "center"
            }}
        >
            <style>{`@keyframes slideSheet{from{transform:translateY(100%)}to{transform:translateY(0)}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>

            {/* Sheet — stop propagation so click inside doesn't close */}
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    width: "100%", maxWidth: 480,
                    background: "linear-gradient(180deg,#13192b 0%,#0d1117 100%)",
                    borderRadius: "24px 24px 0 0",
                    borderTop: "1px solid rgba(99,102,241,0.25)",
                    padding: "8px 20px 42px",
                    animation: "slideSheet 0.32s cubic-bezier(0.32,0.72,0,1)",
                    boxShadow: "0 -20px 60px rgba(0,0,0,0.6)"
                }}
            >
                {/* Drag handle */}
                <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)", margin: "10px auto 18px" }} />

                {/* Header row */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: 13,
                            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            boxShadow: "0 4px 16px rgba(99,102,241,0.5)"
                        }}>
                            <span style={{ fontSize: 22 }}>🎓</span>
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#e2e8f0" }}>Sign in to continue</p>
                            <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>To {reason}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            width: 32, height: 32, borderRadius: "50%",
                            background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
                            color: "#64748b", cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center"
                        }}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div style={{
                        background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
                        borderRadius: 10, padding: "8px 12px", margin: "12px 0",
                        display: "flex", alignItems: "center", gap: 7
                    }}>
                        <AlertCircle size={14} color="#f87171" />
                        <p style={{ margin: 0, fontSize: 11, color: "#fca5a5" }}>{error}</p>
                    </div>
                )}

                {/* Divider */}
                <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "18px 0 16px" }} />

                {/* Google button */}
                <button
                    onClick={handleGoogle}
                    disabled={loading}
                    style={{
                        width: "100%", padding: "14px", borderRadius: 14,
                        background: "#161b27", border: "1.5px solid rgba(255,255,255,0.1)",
                        color: "#e2e8f0", fontSize: 14, fontWeight: 700, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                        marginBottom: 10, transition: "all 0.2s"
                    }}
                >
                    {loading ? <Spinner /> : (
                        <>
                            <svg width="18" height="18" viewBox="0 0 48 48">
                                <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.2 6.5 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-9 20-20 0-1.3-.1-2.7-.4-4z" />
                                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.2 6.5 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.3-5.2C29.4 35.6 26.8 36 24 36c-5.2 0-9.7-3.4-11.3-8H6.3C9.7 35.7 16.3 44 24 44z" />
                                <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.3 5.2C41.2 35.7 44 30.3 44 24c0-1.3-.1-2.7-.4-4z" />
                            </svg>
                            Continue with Google
                        </>
                    )}
                </button>

                {/* Email button */}
                <button
                    onClick={goToEmailLogin}
                    style={{
                        width: "100%", padding: "14px", borderRadius: 14,
                        background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                        border: "none", color: "#fff", fontSize: 14, fontWeight: 700,
                        cursor: "pointer", display: "flex", alignItems: "center",
                        justifyContent: "center", gap: 10, marginBottom: 14,
                        boxShadow: "0 4px 20px rgba(99,102,241,0.4)"
                    }}
                >
                    <Mail size={16} /> Sign up with Email
                </button>

                {/* Dismiss link */}
                <p style={{ textAlign: "center", margin: 0, fontSize: 12, color: "#475569" }}>
                    <span onClick={onClose} style={{ cursor: "pointer", textDecoration: "underline" }}>
                        Not now — continue browsing
                    </span>
                </p>
            </div>
        </div>
    );
}
