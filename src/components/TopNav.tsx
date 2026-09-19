"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  Link2,
  Scale,
  ShoppingCart,
  Wrench,
  Landmark,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { NavTab } from "@/components/AppShell";
import type { Analyst, Applicant } from "@/lib/types/database";

interface NavItem {
  id: NavTab;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { id: "supply-chain", label: "B2B Supply", icon: <Link2 size={18} /> },
  { id: "underwriting", label: "Underwriting", icon: <Scale size={18} /> },
  { id: "retail-vendor", label: "Retail", icon: <ShoppingCart size={18} /> },
  { id: "gig-workers", label: "Gig Workers", icon: <Wrench size={18} /> },
];

interface TopNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  analyst: Analyst | null;
  applicants: Applicant[];
  selectedApplicantId: string | null;
  onApplicantChange: (id: string) => void;
}

export default function TopNav({ 
  activeTab, 
  onTabChange, 
  analyst,
  applicants,
  selectedApplicantId,
  onApplicantChange
}: TopNavProps) {
  const router = useRouter();
  const supabase = createClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const handleNavClick = (id: NavTab) => {
    onTabChange(id);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Desktop & Mobile Header */}
      <header className="sticky top-0 z-50 w-full bg-slate-900/80 backdrop-blur-xl border-b border-white/10 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo & Dropdown Container */}
            <div className="flex items-center gap-6 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-emerald-400 flex items-center justify-center shadow-md">
                  <Landmark size={16} className="text-white" />
                </div>
                <p className="hidden md:block text-sm font-bold text-white leading-tight tracking-wide">Inviscred</p>
              </div>

              {/* Global Applicant Selector */}
              <div className="relative">
                <select
                  value={selectedApplicantId || ""}
                  onChange={(e) => onApplicantChange(e.target.value)}
                  className="appearance-none bg-white/10 border border-white/20 text-white text-sm pl-3 pr-8 py-1.5 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 max-w-[200px] truncate"
                >
                  <option value="" disabled className="text-slate-900">Select Enterprise...</option>
                  {applicants.map((a) => (
                    <option key={a.id} value={a.id} className="text-slate-900">
                      {a.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white/50">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 mx-6">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                      ${isActive
                        ? "bg-white/10 text-sky-400 shadow-sm"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                      }`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                );
              })}
            </nav>

            {/* User Profile & Sign Out (Desktop) */}
            <div className="hidden md:flex items-center gap-4 shrink-0">
              {analyst && (
                <div className="text-right">
                  <p className="text-xs font-semibold text-white">{analyst.full_name}</p>
                  <p className="text-[10px] text-emerald-400">{analyst.role.replace("_", " ").toUpperCase()}</p>
                </div>
              )}
              <button
                onClick={handleSignOut}
                className="p-2 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                title="Sign Out"
              >
                <LogOut size={18} />
              </button>
            </div>

            {/* Mobile Menu Toggle */}
            <div className="flex md:hidden items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-white/60 hover:text-white rounded-lg transition-colors"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden glass border-t border-white/10 animate-in slide-in-from-top-2 duration-200">
            <div className="px-4 pt-2 pb-4 space-y-1">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                      ${isActive
                        ? "bg-white/10 text-sky-400"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                      }`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                );
              })}
              
              <div className="pt-4 mt-2 border-t border-white/10">
                {analyst && (
                  <div className="px-4 mb-4">
                    <p className="text-xs text-white/40 mb-1">Signed in as</p>
                    <p className="text-sm font-semibold text-white">{analyst.full_name}</p>
                  </div>
                )}
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-400/10 transition-colors"
                >
                  <LogOut size={18} />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
