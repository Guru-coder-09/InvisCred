"use client";

import { ShoppingCart, MapPin, Smartphone, Star, TrendingUp, Users } from "lucide-react";
import CreditGauge from "@/components/CreditGauge";
import StatCard from "@/components/StatCard";
import type { Applicant } from "@/lib/types/database";

interface RetailVendorViewProps {
  applicants: Applicant[];
  selectedApplicant?: Applicant | null;
}

const statusStyle: Record<string, string> = {
  Approved: "text-emerald-400 bg-emerald-400/10",
  Review: "text-amber-400 bg-amber-400/10",
  Declined: "text-red-400 bg-red-400/10",
  Pending: "text-slate-400 bg-slate-400/10",
};

function deriveStatus(upi: number): string {
  if (upi <= 0) return "Pending";
  if (upi >= 50000) return "Approved";
  if (upi >= 25000) return "Review";
  return "Declined";
}

function deriveScore(a: Applicant): number {
  let s = 500;
  const upi = a.upi_monthly_avg ?? 0;
  if (upi >= 150000) s += 60;
  else if (upi >= 80000) s += 40;
  else if (upi >= 40000) s += 20;
  if (a.gstin) s += 40;
  s += 40; // digital vintage bonus
  const sl = a.sector.toLowerCase();
  if (sl.includes("kirana") || sl.includes("pharma") || sl.includes("food") || sl.includes("grocery")) s += 25;
  else if (sl.includes("manufacturing") || sl.includes("service") || sl.includes("repair")) s += 10;
  return Math.max(435, Math.min(850, s));
}

export default function RetailVendorView({ applicants, selectedApplicant }: RetailVendorViewProps) {
  const ap = selectedApplicant;
  const score = ap ? deriveScore(ap) : 0;
  const upi = ap?.upi_monthly_avg ?? 0;
  const status = ap ? deriveStatus(upi) : "Review";

  // Compute aggregate stats from the filtered applicant list
  const avgUpi = applicants.length > 0
    ? Math.round(applicants.reduce((sum, a) => sum + (a.upi_monthly_avg ?? 0), 0) / applicants.length)
    : 0;
  const avgScore = applicants.length > 0
    ? Math.round(applicants.reduce((sum, a) => sum + deriveScore(a), 0) / applicants.length)
    : 0;
  const approvedCount = applicants.filter(a => deriveStatus(a.upi_monthly_avg ?? 0) === "Approved").length;
  const approvalRate = applicants.length > 0 ? Math.round((approvedCount / applicants.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Retail & Street Vendor Approvals</h1>
        <p className="text-sm text-white/40 mt-1">
          Alternative data-driven lending for informal economy workers
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Applications" value={String(applicants.length)} subValue="Retail cohort" icon={<Users size={18} />} color="sky" delay={0} />
        <StatCard title="Approval Rate" value={`${approvalRate}%`} subValue="Based on UPI inflows" icon={<TrendingUp size={18} />} color="emerald" delay={100} />
        <StatCard title="Avg UPI Volume" value={`₹ ${(avgUpi / 1000).toFixed(0)}K`} subValue="Monthly median" icon={<Smartphone size={18} />} color="violet" delay={200} />
        <StatCard title="Avg Credit Score" value={String(avgScore)} subValue="Retail vendors cohort" icon={<Star size={18} />} color="amber" delay={300} />
      </div>

      {/* Alternative Data Sources */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <ShoppingCart size={16} className="text-sky-400" />
          <p className="text-xs font-medium text-white/50 uppercase tracking-wider">Alternative Data Sources Used</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: "📱", label: "UPI Transactions", desc: "12-month inflow pattern" },
            { icon: "🏪", label: "Location Stability", desc: "Physical presence > 6 months" },
            { icon: "⭐", label: "Platform Ratings", desc: "Swiggy / Zomato / Google" },
            { icon: "💡", label: "Utility Payments", desc: "Electricity & mobile bills" },
          ].map((d) => (
            <div key={d.label} className="bg-white/5 rounded-xl p-3 text-center">
              <div className="text-2xl mb-2">{d.icon}</div>
              <p className="text-xs font-semibold text-white">{d.label}</p>
              <p className="text-[10px] text-white/35 mt-0.5">{d.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Featured application + list */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Featured score — uses selectedApplicant */}
        <div className="lg:col-span-2 glass rounded-2xl p-5 flex flex-col items-center gap-4">
          {ap ? (
            <>
              <div className="w-full">
                <p className="text-[10px] text-white/30 uppercase tracking-wider">Selected Application</p>
                <p className="text-base font-bold text-white mt-1">{ap.name}</p>
                <div className="flex items-center gap-1 text-[10px] text-white/40 mt-0.5">
                  <MapPin size={10} className="text-sky-400" />
                  {ap.city} · {ap.sector}
                </div>
              </div>
              <CreditGauge score={score} />
              <div className="w-full bg-white/5 rounded-xl p-3">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "UPI Volume", value: `₹ ${(upi / 1000).toFixed(1)}K/mo` },
                    { label: "GSTIN", value: ap.gstin ? "Verified ✓" : "Exempt" },
                    { label: "Loan Ask", value: ap.loan_amount ? `₹ ${(ap.loan_amount / 100000).toFixed(1)}L` : "N/A" },
                    { label: "Employees", value: String(ap.employment_count) },
                  ].map((item) => (
                    <div key={item.label}>
                      <p className="text-[10px] text-white/30">{item.label}</p>
                      <p className="text-xs font-semibold text-white">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-white/40 py-10">Select an enterprise to view details</p>
          )}
        </div>

        {/* Applications list — uses all applicants from the filtered list */}
        <div className="lg:col-span-3 glass rounded-2xl p-5">
          <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-4">All Applications</p>
          <div className="space-y-3">
            {applicants.map((v) => {
              const vScore = deriveScore(v);
              const vStatus = deriveStatus(v.upi_monthly_avg ?? 0);
              return (
                <div
                  key={v.id}
                  className={`bg-white/4 hover:bg-white/7 rounded-xl p-4 transition-colors cursor-pointer ${ap?.id === v.id ? "ring-1 ring-sky-500/50" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{v.name}</p>
                      <div className="flex items-center gap-1 text-[10px] text-white/35 mt-0.5">
                        <MapPin size={9} className="text-sky-400/60" />
                        {v.city}
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-1 rounded-lg shrink-0 ${statusStyle[vStatus]}`}>
                      {vStatus}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-3">
                    <div>
                      <p className="text-[10px] text-white/30">UPI Volume</p>
                      <p className="text-xs font-bold text-white">₹ {((v.upi_monthly_avg ?? 0) / 1000).toFixed(1)}K/mo</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/30">Category</p>
                      <p className="text-xs font-semibold text-white">{v.sector}</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-[10px] text-white/30">Score</p>
                      <p className="text-sm font-bold text-white">{vScore}</p>
                    </div>
                  </div>
                  <div className="mt-2 h-1 progress-bar-bg">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-400"
                      style={{ width: `${(vScore / 850) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {applicants.length === 0 && (
              <p className="text-xs text-white/30 text-center py-6">No retail/food vendors in the database yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
