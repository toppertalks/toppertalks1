import React from "react";
import { useNavigate } from "react-router-dom";
import { Video } from "lucide-react";
import { requireAuth } from "../lib/auth-guard";

export default function TopperCard({ topper, onCallClick }) {
  const navigate = useNavigate();
  const statusColor = topper.isOnline ? "#22c55e" : "#f59e0b";
  const statusText = topper.isOnline ? "Online" : "Busy";

  return (
    <div
      className="topper-card"
      onClick={() => navigate(`/topperprofile/${topper.id}`)}
    >
      <img src={topper.avatarUrl} alt={topper.name} />
      <div className="topper-card-gradient" />

      {/* Status */}
      <div className="topper-card-status">
        <span
          className="topper-card-status-dot"
          style={{ background: statusColor, boxShadow: `0 0 5px ${statusColor}` }}
        />
        <span className="topper-card-status-text">{statusText}</span>
      </div>

      {/* Bottom info */}
      <div className="topper-card-info">
        <div style={{ flex: 1, paddingRight: 8 }}>
          <p className="topper-card-name">{topper.name}</p>
          <p className="topper-card-college">🇮🇳 {topper.college}</p>
          <p className="topper-card-rate">₹50 / 5 min</p>
        </div>
        <button
          className="topper-card-call-btn"
          onClick={(e) => {
            e.stopPropagation();
            if (!requireAuth(navigate, `/messages/${topper.id}`)) return;
            onCallClick?.(topper.id);
          }}
        >
          <Video size={18} />
        </button>
      </div>
    </div>
  );
}
