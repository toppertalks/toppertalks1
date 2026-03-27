/* eslint-disable react/button-has-type */
"use client";

import { Video } from "lucide-react";
import { useRouter } from "next/navigation";
import { requireAuth } from "@/lib/auth-guard";

export interface Topper {
  id: string;
  name: string;
  college: string;
  exam: "JEE" | "NEET";
  ratePerMinute: number;
  avatarUrl: string;
  isOnline: boolean;
}

interface TopperCardProps {
  topper: Topper;
  onCallClick?: (topperId: string) => void;
}

export function TopperCard({ topper, onCallClick }: TopperCardProps) {
  const router = useRouter();
  const statusColor = topper.isOnline ? "#22c55e" : "#f59e0b";
  const statusText = topper.isOnline ? "Online" : "Busy";

  return (
    <div
      onClick={() => router.push(`/topperprofile/${topper.id}`)}
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "3 / 4",
        borderRadius: 18,
        overflow: "hidden",
        backgroundColor: "#1a1a1a",
        cursor: "pointer",
        boxShadow: "0 2px 12px rgba(0,0,0,0.18)",
        transition: "transform 0.15s, box-shadow 0.15s"
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.transform = "scale(1.02)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px rgba(99,102,241,0.3)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.transform = "scale(1)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.18)";
      }}
    >
      {/* ── Full-bleed portrait photo ── */}
      <img
        src={topper.avatarUrl}
        alt={topper.name}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "top center"
        }}
      />

      {/* ── Bottom gradient overlay ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.28) 45%, transparent 70%)"
        }}
      />

      {/* ── Status badge — top left ── */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          display: "flex",
          alignItems: "center",
          gap: 5,
          background: "rgba(0,0,0,0.48)",
          backdropFilter: "blur(6px)",
          borderRadius: 20,
          padding: "3px 9px"
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: statusColor,
            display: "inline-block",
            boxShadow: `0 0 5px ${statusColor}`
          }}
        />
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "#fff"
          }}
        >
          {statusText}
        </span>
      </div>

      {/* ── Bottom info row ── */}
      <div
        style={{
          position: "absolute",
          bottom: 10,
          left: 10,
          right: 10,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between"
        }}
      >
        {/* Name + college + exam */}
        <div style={{ flex: 1, paddingRight: 8 }}>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              fontWeight: 700,
              color: "#ffffff",
              lineHeight: 1.2,
              textShadow: "0 1px 4px rgba(0,0,0,0.6)"
            }}
          >
            {topper.name}
          </p>
          <p
            style={{
              margin: "3px 0 0",
              fontSize: 10,
              color: "#d1d5db",
              lineHeight: 1.2
            }}
          >
            🇮🇳 {topper.college}
          </p>
          <p
            style={{
              margin: "2px 0 0",
              fontSize: 10,
              color: "#9ca3af"
            }}
          >
            ₹50 / 5 min
          </p>
        </div>

        {/* Pink video call button — bottom right */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            // Auth guard — redirect to login with ?next= pointing back here
            if (!requireAuth(router, `/messages/${topper.id}`)) return;
            onCallClick?.(topper.id);
          }}
          style={{
            flexShrink: 0,
            width: 42,
            height: 42,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #ff4d6d, #ec4899)",
            color: "#fff",
            border: "2px solid rgba(255,255,255,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 14px rgba(236,72,153,0.55)",
            cursor: "pointer",
            transition: "transform 0.15s"
          }}
          onMouseDown={(e) =>
          ((e.currentTarget as HTMLButtonElement).style.transform =
            "scale(0.92)")
          }
          onMouseUp={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1)")
          }
        >
          <Video size={18} />
        </button>
      </div>
    </div>
  );
}