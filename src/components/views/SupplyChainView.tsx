"use client";

import { Link2, ArrowRight, TrendingUp, Package, Truck, DollarSign, AlertCircle } from "lucide-react";
import type { Applicant } from "@/lib/types/database";
import StatCard from "@/components/StatCard";

const statusStyle: Record<string, string> = {
  pending: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  overdue: "text-red-400 bg-red-400/10 border-red-400/20",
  approved: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
};

// Generate context-aware invoices from the selected applicant
function generateInvoices(ap: Applicant) {
  const upi = ap.upi_monthly_avg ?? 30000;
  const base = Math.round(upi * 0.6);
  return [
    { id: `INV-${new Date().getFullYear()}-0891`, buyer: "Metro Wholesale", amount: `₹ ${(base * 1.2 / 1000).toFixed(1)}K`, due: "3 days", status: "pending", risk: "Low" },
    { id: `INV-${new Date().getFullYear()}-0887`, buyer: `${ap.city} Traders`, amount: `₹ ${(base * 0.5 / 1000).toFixed(1)}K`, due: "Overdue 4d", status: "overdue", risk: "Medium" },
    { id: `INV-${new Date().getFullYear()}-0879`, buyer: "FreshMart Chain", amount: `₹ ${(base * 2.5 / 1000).toFixed(1)}K`, due: "12 days", status: "approved", risk: "Low" },
    { id: `INV-${new Date().getFullYear()}-0865`, buyer: "Lakshmi Wholesale", amount: `₹ ${(base * 1.6 / 1000).toFixed(1)}K`, due: "18 days", status: "pending", risk: "Low" },
  ];
}

export default function SupplyChainView({ selectedApplicant }: { selectedApplicant?: Applicant | null }) {
  const ap = selectedApplicant;
  const upi = ap?.upi_monthly_avg ?? 0;
  const invoices = ap ? generateInvoices(ap) : [];
  const totalReceivables = ap ? `₹ ${((upi * 4.8) / 100000).toFixed(1)}L` : "N/A";

  // Derive anchor buyer scores from the applicant's sector/city
  const buyers = ap ? [
    { buyer: "Metro Wholesale", score: Math.min(95, 60 + Math.round(upi / 5000)), trend: "+2" },
    { buyer: "FreshMart Chain", score: Math.min(95, 70 + Math.round(upi / 8000)), trend: "+5" },
    { buyer: `${ap.city} Traders`, score: Math.max(40, 50 + Math.round(upi / 15000) - 5), trend: "-8" },
  ] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">B2B Supply Chain Finance</h1>
        <p className="text-sm text-white/40 mt-1">Invoice financing, receivables discounting & trade credit</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Receivables" value={totalReceivables} subValue={ap ? `${invoices.length} open invoices` : "—"} icon={<DollarSign size={18} />} color="sky" delay={0} />
        <StatCard title="Avg. Payment Cycle" value={ap ? "28 days" : "—"} subValue="Industry avg: 42 days" icon={<TrendingUp size={18} />} color="emerald" trend={{ value: "14d faster", positive: true }} delay={100} />
        <StatCard title="Inventory Turnover" value={ap ? "4.2×" : "—"} subValue="Annual rate" icon={<Package size={18} />} color="violet" delay={200} />
        <StatCard title="Active Trade Lines" value={ap ? "6" : "—"} subValue="3 buyers, 3 suppliers" icon={<Truck size={18} />} color="amber" delay={300} />
      </div>

      {/* Supply chain diagram */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Link2 size={16} className="text-sky-400" />
          <p className="text-xs font-medium text-white/50 uppercase tracking-wider">Trade Flow Map</p>
        </div>
        <div className="flex items-center justify-center gap-2 flex-wrap py-4">
          {[
            { label: "Supplier", sub: ap ? `${ap.city} Agro Pvt Ltd` : "—", color: "border-violet-400/40 text-violet-300" },
            null,
            { label: "MSME Borrower", sub: ap?.name ?? "—", color: "border-sky-400/60 text-sky-300", highlight: true },
            null,
            { label: "Buyer", sub: "Metro Wholesale", color: "border-emerald-400/40 text-emerald-300" },
          ].map((node, i) =>
            node === null ? (
              <ArrowRight key={i} size={20} className="text-white/20 shrink-0" />
            ) : (
              <div
                key={i}
                className={`glass rounded-xl px-4 py-3 border text-center min-w-[130px] ${node.color}
                  ${node.highlight ? "shadow-lg shadow-sky-500/20" : ""}`}
              >
                <p className="text-[10px] text-white/40 uppercase tracking-wider">{node.label}</p>
                <p className={`text-sm font-semibold mt-0.5 ${node.color.split(" ")[1]}`}>{node.sub}</p>
              </div>
            )
          )}
        </div>
      </div>

      {/* Invoice table */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Package size={16} className="text-amber-400" />
            <p className="text-xs font-medium text-white/50 uppercase tracking-wider">Invoice Pipeline</p>
          </div>
        </div>
        {invoices.length > 0 ? (
          <div className="space-y-2">
            {invoices.map((inv) => (
              <div key={inv.id} className="flex flex-wrap sm:flex-nowrap items-center gap-3 bg-white/4 hover:bg-white/6 rounded-xl p-3 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{inv.id}</p>
                  <p className="text-[10px] text-white/40">{inv.buyer}</p>
                </div>
                <div className="text-right min-w-[80px]">
                  <p className="text-sm font-bold text-white">{inv.amount}</p>
                  <p className="text-[10px] text-white/35">Due: {inv.due}</p>
                </div>
                <div className="flex gap-2 items-center">
                  <span className={`text-[10px] font-semibold px-2 py-1 rounded-lg border ${statusStyle[inv.status]}`}>
                    {inv.status.toUpperCase()}
                  </span>
                  {inv.risk === "Medium" && (
                    <AlertCircle size={14} className="text-orange-400" />
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-white/30 text-center py-6">Select an enterprise to see its invoice pipeline.</p>
        )}
      </div>

      {/* Anchor Buyer Risk */}
      <div className="glass rounded-2xl p-5">
        <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">Anchor Buyer Credit Health</p>
        {buyers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {buyers.map((b) => (
              <div key={b.buyer} className="bg-white/5 rounded-xl p-3">
                <p className="text-xs font-semibold text-white">{b.buyer}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-1.5 progress-bar-bg">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-400"
                      style={{ width: `${b.score}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-white">{b.score}</span>
                  <span className={`text-[10px] ${b.trend.startsWith("+") ? "text-emerald-400" : "text-red-400"}`}>
                    {b.trend}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-white/30 text-center py-4">Select an enterprise to view buyer health.</p>
        )}
      </div>
    </div>
  );
}
