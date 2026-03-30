import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { logActivity } from "../lib/logger";

export default function PageTracker() {
  const location = useLocation();

  useEffect(() => {
    const uid = localStorage.getItem("tt_user_uid");
    logActivity({ event: "page_view", page: location.pathname, uid });
  }, [location.pathname]);

  return null;
}
