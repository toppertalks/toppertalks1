import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Mail, AlertCircle } from "lucide-react";
import { logActivity } from "../../lib/logger";

export default function LoginModal({ reason = "use this feature", onClose, returnTo = "/" }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    logActivity({ event: "signin_attempt", provider: "google", page: "login_modal", reason });
    try {
      const { signInWithGoogle, getUserProfile } = await import("../../lib/auth");
      const user = await signInWithGoogle();
      logActivity({ event: "signin_success", provider: "google", uid: user.uid, email: user.email, page: "login_modal" });
      localStorage.setItem("tt_user_uid", user.uid);
      const profile = await getUserProfile(user.uid);
      logActivity({ event: "profile_fetch", uid: user.uid, found: !!(profile?.name) });
      if (profile?.name) {
        localStorage.setItem("tt_user_name", profile.name);
        localStorage.setItem("tt_user_role", profile.role);
        onClose();
        setTimeout(() => window.location.reload(), 100);
      } else {
        navigate(`/login?next=${encodeURIComponent(returnTo)}`);
      }
    } catch (err) {
      const code = err?.code ?? "";
      const msg = err instanceof Error ? err.message : String(err);
      logActivity({ event: "signin_error", provider: "google", errorCode: code, error: msg, page: "login_modal" });
      if (msg.includes("Redirecting to Google")) return;
      setError(`[${code}] ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const goToEmailLogin = () => {
    onClose();
    navigate(`/login?next=${encodeURIComponent(returnTo)}`);
  };

  return (
    <div className="login-modal-backdrop" onClick={onClose}>
      <div className="login-modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="login-modal-handle" />

        {/* Header */}
        <div className="login-modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="login-modal-logo">🎓</div>
            <div>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#e2e8f0" }}>Sign in to continue</p>
              <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>To {reason}</p>
            </div>
          </div>
          <button className="login-modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="error-banner">
            <AlertCircle size={14} color="#f87171" />
            <p>{error}</p>
          </div>
        )}

        <div className="login-modal-divider" />

        {/* Google */}
        <button className="login-modal-google-btn" onClick={handleGoogle} disabled={loading}>
          {loading ? <div className="spinner-sm" /> : (
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

        {/* Email */}
        <button className="login-modal-email-btn" onClick={goToEmailLogin}>
          <Mail size={16} /> Sign up with Email
        </button>

        <p className="login-modal-dismiss">
          <span onClick={onClose}>Not now — continue browsing</span>
        </p>
      </div>
    </div>
  );
}
