import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Search, Sparkles, MessageCircle, User } from "lucide-react";

const items = [
  { key: "home", icon: Home, label: "Home", href: "/" },
  { key: "search", icon: Search, label: "Search", href: "/search" },
  { key: "random", icon: Sparkles, label: "Random", href: "/random" },
  { key: "chats", icon: MessageCircle, label: "Chats", href: "/messages" },
  { key: "profile", icon: User, label: "Profile", href: "/profile" },
];

export default function BottomNav({ active }) {
  const location = useLocation();

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-inner">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = active
            ? item.key === active
            : location.pathname === item.href;
          return (
            <Link
              key={item.key}
              to={item.href}
              className={`bottom-nav-item ${isActive ? "active" : ""}`}
            >
              {isActive && <span className="bottom-nav-indicator" />}
              <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
