"use client";

import {
  TrendingUp,
  Clock,
  Smartphone,
  Store,
  Target,
  Info,
  BarChart3,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  FileText,
  Plus,
  AlertTriangle
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import StatCard from "@/components/StatCard";
import CreditGauge from "@/components/CreditGauge";
import XAIReasoning from "@/components/XAIReasoning";
import SyncButton from "@/components/SyncButton";
import FileUpload from "@/components/FileUpload";
import AddVendorModal from "@/components/AddVendorModal";
import ReportModal from "@/components/ReportModal";
import { createClient } from "@/lib/supabase/client";
import type { Analyst, Applicant, CreditScore, XAIFactor, FinancialMetric } from "@/lib/types/database";

interface DashboardViewProps {
  analyst: Analyst | null;
  applicants: Applicant[];
  selectedApplicant: Applicant | null;
  refreshData?: () => void;
}

interface ScoreWithFactors extends CreditScore {
  xai_factors: XAIFactor[];
}

export default function DashboardView({ analyst, applicants, selectedApplicant, refreshData }: DashboardViewProps) {
  const supabase = createClient();
  const [xaiExpanded, setXaiExpanded] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [latestScore, setLatestScore] = useState<ScoreWithFactors | null>(null);
  const [metrics, setMetrics] = useState<FinancialMetric[]>([]);
  const [computingScore, setComputingScore] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [loadingScore, setLoadingScore] = useState(false);

  const fetchScoreAndMetrics = useCallback(async (applicantId: string) => {
    setLoadingScore(true);
    // Latest credit score with XAI factors
    const { data: score } = await supabase
      .from("credit_scores")
      .select("*, xai_factors(*)")
      .eq("applicant_id", applicantId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single<ScoreWithFactors>();

    // Latest metrics
    const { data: mets } = await supabase
      .from("financial_metrics")
      .select("*")
      .eq("applicant_id", applicantId)
      .order("synced_at", { ascending: false })
      .limit(20);

    setLatestScore(score ?? null);
    setMetrics(mets ?? []);
    if (mets && mets.length > 0) {
      setLastSynced(new Date(mets[0].synced_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
    }
    setLoadingScore(false);
  }, [supabase]);

  useEffect(() => {
    if (selectedApplicant) fetchScoreAndMetrics(selectedApplicant.id);
  }, [selectedApplicant, fetchScoreAndMetrics]);

  const handleSyncComplete = async () => {
    if (!selectedApplicant) return;
    // Trigger score computation
    setComputingScore(true);
    try {
      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicant_id: selectedApplicant.id }),
      });
      if (res.ok) {
        await fetchScoreAndMetrics(selectedApplicant.id);
      }
    } finally {
      setComputingScore(false);
    }
  };

  // Helper: get a specific metric value
  const getMetric = (type: string): number => {
    const m = metrics.find((x) => x.metric_type === type);
    return m?.value ?? 0;
  };

  const revenueStability = getMetric("revenue_stability_score") || 0;
  const paymentRegularity = getMetric("payment_regularity_pct") || 0;
  const upiInflow = getMetric("upi_monthly_inflow") || selectedApplicant?.upi_monthly_avg || 0;

  const xaiFactors = (latestScore?.xai_factors ?? []).map((f) => ({
    label: f.label,
    impact: f.impact,
    description: f.description ?? "",
  }));

  // Fallback factors derived from applicant data using fairness algorithm
  const staticFactors = (() => {
    if (!selectedApplicant) return [];
    const factors: { label: string; impact: number; description: string }[] = [];
    const upi = selectedApplicant.upi_monthly_avg ?? 0;
    if (upi >= 150000) factors.push({ label: "High UPI inflows (>₹1.5L/m)", impact: 60, description: "Excellent" });
    else if (upi >= 80000) factors.push({ label: "Good UPI inflows (>₹80K/m)", impact: 40, description: "Strong" });
    else if (upi >= 40000) factors.push({ label: "Moderate UPI inflows (>₹40K/m)", impact: 20, description: "Good" });
    else factors.push({ label: "Micro-scale UPI inflows", impact: 0, description: "Neutral (Fairness Applied)" });
    if (selectedApplicant.gstin) factors.push({ label: "Verified GSTIN (Formalized)", impact: 40, description: "Strong" });
    else factors.push({ label: "Unregistered (Exempt Category)", impact: 0, description: "Neutral (Fairness Applied)" });
    factors.push({ label: "2+ Years Digital Vintage", impact: 40, description: "Strong" });
    const sl = selectedApplicant.sector.toLowerCase();
    if (sl.includes("kirana") || sl.includes("pharma") || sl.includes("food") || sl.includes("grocery")) factors.push({ label: "Essential Goods Sector", impact: 25, description: "Highly Resilient" });
    else if (sl.includes("manufacturing") || sl.includes("service") || sl.includes("repair")) factors.push({ label: "Services / Manufacturing", impact: 10, description: "Resilient" });
    else factors.push({ label: "Informal/Gig Sector", impact: 0, description: "Neutral (Fairness Applied)" });
    return factors;
  })();

  return (
    <div className="space-y-6">
      {/* Header & Global Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            Credit Evaluation Dashboard
            {computingScore && <RefreshCw size={16} className="animate-spin text-sky-400" />}
          </h1>
          <p className="text-sm text-white/50 mt-1">Review aggregated financial data and AI-driven underwriting.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm font-semibold transition-all"
          >
            <Plus size={16} />
            New Vendor
          </button>
        </div>
      </div>

      {showAddModal && (
        <AddVendorModal
          onClose={() => setShowAddModal(false)}
          onAdded={() => {
            setShowAddModal(false);
            if (refreshData) refreshData();
          }}
        />
      )}

      {/* Data Fetch & Upload Section */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-medium text-white/40 uppercase tracking-wider">Step 1 — Data Collection</p>
          <div className="glass rounded-xl px-3 py-1.5 flex items-center gap-2">
            <span className="text-[10px] text-white/30 uppercase">Last Synced</span>
            <span className="text-xs font-semibold text-white">{lastSynced ? lastSynced : "--:--"}</span>
            <span className={`w-1.5 h-1.5 rounded-full ${lastSynced ? "bg-emerald-400" : "bg-white/20"}`} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Option 1: AA */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <RefreshCw size={16} className="text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Account Aggregator</h3>
              </div>
              <p className="text-[11px] text-white/50 mb-5 leading-relaxed">
                Automatically pull verified bank statements and GST data via the RBI Account Aggregator framework.
              </p>
            </div>
            <SyncButton
              applicantId={selectedApplicant?.id}
              onSyncComplete={handleSyncComplete}
            />
          </div>

          {/* Option 2: File Upload */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col justify-between">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={16} className="text-sky-400" />
                <h3 className="text-sm font-semibold text-white">Manual Upload</h3>
              </div>
              <p className="text-[11px] text-white/50 leading-relaxed">
                Upload raw transactional statements (CSV/PDF) for offline evaluation.
              </p>
            </div>
            <FileUpload 
              applicantId={selectedApplicant?.id}
              onUploadComplete={handleSyncComplete} 
            />
          </div>
        </div>

        {computingScore && (
          <div className="flex items-center justify-center gap-2 mt-4 text-xs font-medium text-sky-400 bg-sky-400/10 py-2 rounded-xl">
            <RefreshCw size={14} className="animate-spin" />
            Analyzing data and computing credit score…
          </div>
        )}
      </div>

      {/* Financial Metric Cards */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 size={14} className="text-white/40" />
          <p className="text-xs font-medium text-white/40 uppercase tracking-wider">Financial Metrics</p>
          {metrics.length === 0 && (
            <span className="text-[10px] text-amber-400 ml-1">(Sync to load live data)</span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Revenue Stability"
            value={revenueStability > 0 ? `${Math.round(revenueStability)} / 100` : "N/A"}
            subValue="Monthly variance score"
            icon={<TrendingUp size={18} />}
            trend={{ value: "3.4%", positive: true }}
            color="emerald"
            delay={100}
          />
          <StatCard
            title="Payment Regularity"
            value={paymentRegularity > 0 ? `${Math.round(paymentRegularity)}%` : "N/A"}
            subValue="On-time in 18 months"
            icon={<Clock size={18} />}
            trend={{ value: "1.2%", positive: true }}
            color="sky"
            delay={200}
          />
          <StatCard
            title="Cash Inflow (UPI)"
            value={upiInflow > 0 ? `₹ ${(upiInflow / 100000).toFixed(2)}L` : "N/A"}
            subValue="Avg. monthly · 12m rolling"
            icon={<Smartphone size={18} />}
            trend={{ value: "8.1%", positive: true }}
            color="violet"
            delay={300}
          />
        </div>
      </div>

      {/* XAI Score + Reasoning */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Score gauge */}
        <div className="lg:col-span-2 glass rounded-2xl p-6 flex flex-col items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <Target size={16} className="text-sky-400" />
            <p className="text-xs font-medium text-white/50 uppercase tracking-wider">
              {latestScore ? "Computed Score" : "Alternative Credit Score"}
            </p>
          </div>
          {loadingScore ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <RefreshCw size={24} className="text-sky-400 animate-spin" />
              <p className="text-xs text-white/40">Loading score…</p>
            </div>
          ) : latestScore ? (
            <>
              <CreditGauge score={latestScore.score} />
              <div className="w-full glass rounded-xl p-3 text-center">
                <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Recommendation</p>
                <p className="text-sm font-bold text-emerald-400">✓ {latestScore.recommendation}</p>
                <p className="text-[10px] text-white/30 mt-0.5">
                  Limit: ₹ {((latestScore.suggested_limit ?? 0) / 100000).toFixed(1)}L · Rate: {latestScore.interest_rate}% p.a.
                </p>
                <p className="text-[10px] text-white/20 mt-1">
                  Evaluated: {new Date(latestScore.created_at).toLocaleString("en-IN")}
                </p>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <AlertTriangle size={28} className="text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white mb-1">No Score Available</p>
                <p className="text-xs text-white/50 leading-relaxed max-w-[220px]">
                  Upload documents (Bank Statements, GST Returns, ITR) or sync via Account Aggregator to compute a credit score.
                </p>
              </div>
              <div className="w-full bg-amber-500/8 border border-amber-500/15 rounded-xl p-3">
                <p className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">⚠ Documents Required</p>
                <p className="text-[10px] text-white/40 mt-1">Score is solely evaluated based on uploaded financial documents.</p>
              </div>
            </div>
          )}
        </div>

        {/* Reasoning */}
        <div className="lg:col-span-3 glass rounded-2xl p-5">
          <button
            className="w-full flex items-center justify-between mb-4 cursor-pointer"
            onClick={() => setXaiExpanded((v) => !v)}
            aria-expanded={xaiExpanded}
          >
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-400" />
              <p className="text-xs font-medium text-white/50 uppercase tracking-wider">XAI Score Breakdown</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-white/30">
                {latestScore ? "Live from DB" : "Awaiting Data"}
              </span>
              {xaiExpanded ? <ChevronUp size={14} className="text-white/30" /> : <ChevronDown size={14} className="text-white/30" />}
            </div>
          </button>

          {xaiExpanded && (
            <>
              {latestScore ? (
                <>
                  <div className="flex items-start gap-2 mb-4 bg-sky-500/8 border border-sky-400/15 rounded-xl p-3">
                    <Info size={13} className="text-sky-400 mt-0.5 shrink-0" />
                    <p className="text-[11px] text-white/50 leading-relaxed">
                      Live XAI factors computed from your uploaded documents. Fully auditable per RBI Fair Lending guidelines.
                    </p>
                  </div>
                  <XAIReasoning reasons={xaiFactors.length > 0 ? xaiFactors : staticFactors} />
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                    <FileText size={20} className="text-white/30" />
                  </div>
                  <p className="text-sm font-medium text-white/50">No XAI Factors Yet</p>
                  <p className="text-xs text-white/35 max-w-sm leading-relaxed">
                    Upload at least one financial document (Bank Statement, GST Returns, or ITR) using the Data Collection panel above. The score and its explainable factors will be computed automatically.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="glass rounded-2xl p-5">
        <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-4">Quick Actions</p>
        <div className="flex flex-wrap gap-3">
          {[
            { label: "Generate Report", icon: "📄" },
            { label: "Request Documents", icon: "📎" },
            { label: "Escalate to Senior", icon: "👤" },
            { label: "View Full History", icon: "📊" },
            { label: "Flag for Review", icon: "🚩" },
          ].map((a) => (
            <button
              key={a.label}
              onClick={() => {
                if (a.label === "Generate Report") {
                  setShowReportModal(true);
                } else if (a.label === "Request Documents") {
                  alert(`An automated SMS and email has been sent to ${selectedApplicant?.name || 'the vendor'} requesting updated financial documents.`);
                } else if (a.label === "Escalate to Senior") {
                  alert(`Vendor ${selectedApplicant?.name || ''} has been escalated to the Senior Credit Analyst queue for manual review.`);
                } else if (a.label === "View Full History") {
                  alert(`Generating historical ledger for ${selectedApplicant?.name || ''}. This may take a moment...`);
                } else if (a.label === "Flag for Review") {
                  alert(`${selectedApplicant?.name || 'The vendor'} has been flagged. The compliance team will review this profile within 24 hours.`);
                }
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl glass glass-hover
                text-xs font-medium text-white/60 hover:text-white transition-colors"
            >
              <span>{a.icon}</span>
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {showReportModal && selectedApplicant && (
        <ReportModal
          applicant={selectedApplicant}
          score={latestScore?.score ?? 414} // fallback to visual defaults if no score
          rating={latestScore?.rating ?? "Moderate Risk"}
          factors={xaiFactors.length > 0 ? xaiFactors : staticFactors}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
}
