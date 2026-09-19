"use client";

import {
  LayoutDashboard,
  Link2,
  Scale,
  ShoppingCart,
  Wrench,
  ChevronRight,
  Landmark,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { NavTab } from "@/components/AppShell";
import type { Analyst } from "@/lib/types/database";
import { ROLE_LABELS, ROLE_BADGE_COLORS } from "@/lib/types/database";

interface NavItem {
  id: NavTab;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
  { id: "supply-chain", label: "B2B Supply Chain Finance", icon: <Link2 size={20} />, badge: "12" },
  { id: "underwriting", label: "Transparent Underwriting", icon: <Scale size={20} /> },
  { id: "retail-vendor", label: "Retail & Street Vendors", icon: <ShoppingCart size={20} />, badge: "5" },
  { id: "gig-workers", label: "Micro-Mfg & Gig Workers", icon: <Wrench size={20} /> },
];

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  analyst: Analyst | null;
}

export default function Sidebar({ activeTab, onTabChange, analyst }: SidebarProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="hidden md:flex glass-sidebar flex-col w-64 min-h-screen sticky top-0 z-30 py-6">
      {/* Brand */}
      <div className="px-5 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-emerald-400 flex items-center justify-center shadow-lg shadow-sky-500/30">
            <Landmark size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-tight">Inviscred</p>
            <p className="text-[10px] text-white/40 uppercase tracking-widest">Intelligence Platform</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group
                ${isActive
                  ? "nav-active"
                  : "text-white/50 hover:text-white/80 hover:bg-white/5"
                }`}
            >
              <span className={isActive ? "text-sky-400" : "text-white/40 group-hover:text-white/60"}>
                {item.icon}
              </span>
              <span className="flex-1 text-sm font-medium leading-tight">{item.label}</span>
              {item.badge && (
                <span className="text-[10px] font-bold bg-sky-400/20 text-sky-300 rounded-full px-2 py-0.5">
                  {item.badge}
                </span>
              )}
              {isActive && <ChevronRight size={14} className="text-sky-400/60" />}
            </button>
          );
        })}
      </nav>

      {/* Analyst profile */}
      <div className="px-4 mt-6 space-y-2">
        {analyst && (
          <div className="glass rounded-xl p-3">
            <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Logged in as</p>
            <p className="text-xs font-semibold text-white">{analyst.full_name}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ROLE_BADGE_COLORS[analyst.role]}`}>
                {ROLE_LABELS[analyst.role]}
              </span>
              <span className="text-[10px] text-white/30">{analyst.branch}</span>
            </div>
          </div>
        )}

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl
            text-white/40 hover:text-red-400 hover:bg-red-400/8
            transition-all duration-200 text-sm"
        >
          <LogOut size={16} />
          <span className="text-xs font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
