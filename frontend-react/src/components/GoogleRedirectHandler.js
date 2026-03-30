import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { logActivity } from "../lib/logger";

export default function GoogleRedirectHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    const pending = sessionStorage.getItem("tt_google_redirect");
    if (!pending) return;

    (async () => {
      try {
        const { getGoogleRedirectResult, getUserProfile } = await import("../lib/auth");
        const user = await getGoogleRedirectResult();
        if (!user) return;

        logActivity({ event: "signin_success", provider: "google_redirect", uid: user.uid, email: user.email });
        localStorage.setItem("tt_user_uid", user.uid);

        const profile = await getUserProfile(user.uid);
        if (profile?.name && profile?.role) {
          const { setLocalUser } = await import("../lib/auth-guard");
          setLocalUser(user.uid, profile.name, profile.role);
          navigate(profile.role === "topper" ? "/topper" : "/");
        } else {
          navigate("/login?next=/");
        }
      } catch (err) {
        console.error("Google redirect handler error:", err);
        sessionStorage.removeItem("tt_google_redirect");
      }
    })();
  }, [navigate]);

  return null;
}
