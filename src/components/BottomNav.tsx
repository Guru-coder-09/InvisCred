"use client";

import {
  LayoutDashboard,
  Link2,
  Scale,
  ShoppingCart,
  Wrench,
} from "lucide-react";
import type { NavTab } from "@/components/AppShell";

interface NavItem {
  id: NavTab;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={22} /> },
  { id: "supply-chain", label: "Supply Chain", icon: <Link2 size={22} /> },
  { id: "underwriting", label: "XAI", icon: <Scale size={22} /> },
  { id: "retail-vendor", label: "Retail", icon: <ShoppingCart size={22} /> },
  { id: "gig-workers", label: "Gig & Mfg", icon: <Wrench size={22} /> },
];

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-sidebar border-t border-white/10">
      <div className="flex items-center justify-around px-2 py-2 safe-area-inset-bottom">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-0 flex-1
                ${isActive ? "text-sky-400" : "text-white/40"}`}
            >
              <span className={isActive ? "" : "opacity-60"}>{item.icon}</span>
              <span className="text-[9px] font-medium truncate w-full text-center leading-tight">
                {item.label}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-sky-400 absolute -top-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
