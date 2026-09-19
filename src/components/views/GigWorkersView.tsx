"use client";

import { Wrench, Factory, Users, IndianRupee, Clock, Briefcase, MapPin } from "lucide-react";
import StatCard from "@/components/StatCard";
import CreditGauge from "@/components/CreditGauge";
import type { Applicant } from "@/lib/types/database";

interface GigWorkersViewProps {
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
  if (upi >= 40000) return "Approved";
  if (upi >= 18000) return "Review";
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
  else if (sl.includes("manufacturing") || sl.includes("service") || sl.includes("repair") || sl.includes("garment") || sl.includes("textile")) s += 10;
  return Math.max(435, Math.min(850, s));
}

const sectors = [
  { icon: "🔧", name: "Auto Component Mfg", riskBand: "Medium" },
  { icon: "👗", name: "Garment & Textiles", riskBand: "Low" },
  { icon: "🍕", name: "Gig Delivery", riskBand: "Low" },
  { icon: "🏠", name: "Home-Based Craft", riskBand: "Low" },
];

export default function GigWorkersView({ applicants, selectedApplicant }: GigWorkersViewProps) {
  const ap = selectedApplicant;
  const score = ap ? deriveScore(ap) : 0;
  const upi = ap?.upi_monthly_avg ?? 0;
  const status = ap ? deriveStatus(upi) : "Review";

  // Aggregate stats from filtered applicants
  const avgIncome = applicants.length > 0
    ? Math.round(applicants.reduce((sum, a) => sum + (a.upi_monthly_avg ?? 0), 0) / applicants.length)
    : 0;
  const approvedCount = applicants.filter(a => deriveStatus(a.upi_monthly_avg ?? 0) === "Approved").length;
  const repaymentRate = applicants.length > 0
    ? Math.round((approvedCount / applicants.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Micro-Manufacturing & Gig Workers</h1>
        <p className="text-sm text-white/40 mt-1">
          Embedded credit for platform gig workers, home manufacturers & Tier-3 suppliers
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Borrowers" value={String(applicants.length)} subValue="Active portfolio" icon={<Users size={18} />} color="sky" delay={0} />
        <StatCard title="Avg. Monthly Income" value={`₹ ${(avgIncome / 1000).toFixed(1)}K`} subValue="Gig economy cohort" icon={<IndianRupee size={18} />} color="emerald" delay={100} />
        <StatCard title="Approval Rate" value={`${repaymentRate}%`} subValue="Based on UPI data" icon={<Clock size={18} />} color="violet" delay={200} />
        <StatCard title="Portfolio NPA" value="3.1%" subValue="Well below 7% threshold" icon={<Factory size={18} />} color="amber" delay={300} />
      </div>

      {/* Sector breakdown */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Wrench size={16} className="text-amber-400" />
          <p className="text-xs font-medium text-white/50 uppercase tracking-wider">Sector Breakdown</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {sectors.map((s) => (
            <div key={s.name} className="bg-white/5 rounded-xl p-4 hover:bg-white/8 transition-colors">
              <div className="text-2xl mb-2">{s.icon}</div>
              <p className="text-sm font-semibold text-white leading-tight">{s.name}</p>
              <div className="mt-2">
                <div className="flex justify-between">
                  <span className="text-[10px] text-white/35">Risk Band</span>
                  <span className={`text-[10px] font-bold ${s.riskBand === "Low" ? "text-emerald-400" : "text-amber-400"}`}>
                    {s.riskBand}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Featured gig worker + list */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Featured — uses selectedApplicant */}
        <div className="lg:col-span-2 glass rounded-2xl p-5 flex flex-col items-center gap-4">
          {ap ? (
            <>
              <div className="w-full">
                <p className="text-[10px] text-white/30 uppercase tracking-wider">Selected Profile</p>
                <p className="text-base font-bold text-white mt-1">{ap.name}</p>
                <div className="flex items-center gap-1 text-[10px] text-white/40 mt-0.5">
                  <Briefcase size={10} className="text-sky-400" />
                  {ap.sector}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-white/40 mt-0.5">
                  <MapPin size={10} className="text-violet-400" />
                  {ap.city}
                </div>
              </div>
              <CreditGauge score={score} />
              <div className="w-full bg-white/5 rounded-xl p-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Income", value: `₹ ${(upi / 1000).toFixed(1)}K/mo` },
                    { label: "Loan Ask", value: ap.loan_amount ? `₹ ${(ap.loan_amount / 100000).toFixed(1)}L` : "N/A" },
                    { label: "GSTIN", value: ap.gstin ? "Verified" : "Exempt" },
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

        {/* List — uses all applicants */}
        <div className="lg:col-span-3 glass rounded-2xl p-5">
          <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-4">Gig Worker Applications</p>
          <div className="space-y-3">
            {applicants.map((w) => {
              const wScore = deriveScore(w);
              const wStatus = deriveStatus(w.upi_monthly_avg ?? 0);
              return (
                <div key={w.id} className={`bg-white/4 hover:bg-white/7 rounded-xl p-4 transition-colors cursor-pointer ${ap?.id === w.id ? "ring-1 ring-sky-500/50" : ""}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{w.name}</p>
                      <p className="text-[10px] text-white/40 mt-0.5">{w.sector}</p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-1 rounded-lg shrink-0 ${statusStyle[wStatus]}`}>
                      {wStatus}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    {[
                      { label: "Income", value: `₹ ${((w.upi_monthly_avg ?? 0) / 1000).toFixed(1)}K/mo` },
                      { label: "Sector", value: w.sector },
                      { label: "City", value: w.city },
                    ].map((f) => (
                      <div key={f.label}>
                        <p className="text-[10px] text-white/30">{f.label}</p>
                        <p className="text-[11px] font-semibold text-white leading-tight truncate">{f.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex-1 h-1 progress-bar-bg">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-sky-400"
                        style={{ width: `${(wScore / 850) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-white shrink-0">{wScore}</span>
                  </div>
                </div>
              );
            })}
            {applicants.length === 0 && (
              <p className="text-xs text-white/30 text-center py-6">No gig/manufacturing applicants in the database yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
