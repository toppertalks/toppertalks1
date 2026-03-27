"use client";
import { LucideIcon, Home, Sparkles, MessageCircle, User, Search } from "lucide-react";
import Link from "next/link";

type ItemKey = "home" | "search" | "random" | "chats" | "profile";

interface BottomNavProps {
  active?: ItemKey;
}

const items: {
  key: ItemKey;
  icon: LucideIcon;
  label: string;
  href: string;
}[] = [
    { key: "home", icon: Home, label: "Home", href: "/" },
    { key: "search", icon: Search, label: "Search", href: "/search" },
    { key: "random", icon: Sparkles, label: "Random", href: "/random" },
    { key: "chats", icon: MessageCircle, label: "Chats", href: "/messages" },
    { key: "profile", icon: User, label: "Profile", href: "/profile" },
  ];

// All tabs navigate freely — each page handles its own auth via a slide-up modal popup
export function BottomNav({ active = "home" }: BottomNavProps) {
  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: 480,
        background: "rgba(13,17,23,0.97)",
        borderTop: "1px solid rgba(99,102,241,0.18)",
        backdropFilter: "blur(16px)",
        zIndex: 50
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          padding: "8px 0 10px"
        }}
      >
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.key === active;
          return (
            <Link
              key={item.key}
              href={item.href}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                fontSize: 10,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? "#818cf8" : "#475569",
                textDecoration: "none",
                minWidth: 56,
                position: "relative",
                transition: "color 0.15s"
              }}
            >
              {/* Active indicator bar */}
              {isActive && (
                <span
                  style={{
                    position: "absolute",
                    top: -9,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 28,
                    height: 3,
                    borderRadius: 2,
                    background: "linear-gradient(90deg,#6366f1,#8b5cf6)"
                  }}
                />
              )}
              <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}