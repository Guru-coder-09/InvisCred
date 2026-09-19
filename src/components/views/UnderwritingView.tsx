"use client";

import { Scale, BookOpen, CheckCircle2, XCircle, AlertTriangle, Eye, Plus, Loader2 } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import CreditGauge from "@/components/CreditGauge";
import XAIReasoning from "@/components/XAIReasoning";
import { createClient } from "@/lib/supabase/client";
import type { Analyst, DecisionRecord, Applicant } from "@/lib/types/database";

interface UnderwritingViewProps {
  analyst: Analyst | null;
  selectedApplicant?: Applicant | null;
}

const decisionStyle: Record<string, string> = {
  Approved: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  Review: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  Declined: "text-red-400 bg-red-400/10 border-red-400/20",
};

const DecisionIcon = ({ d }: { d: string }) => {
  if (d === "Approved") return <CheckCircle2 size={12} className="text-emerald-400" />;
  if (d === "Declined") return <XCircle size={12} className="text-red-400" />;
  return <AlertTriangle size={12} className="text-amber-400" />;
};

export default function UnderwritingView({ analyst, selectedApplicant }: UnderwritingViewProps) {
  const supabase = createClient();
  const [decisions, setDecisions] = useState<DecisionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [liveScore, setLiveScore] = useState<number | null>(null);
  const [liveRating, setLiveRating] = useState<string | null>(null);
  const [liveFactors, setLiveFactors] = useState<{ label: string; impact: number; description: string }[]>([]);

  // Derive a quick score from applicant data as a fallback
  const derivedScore = (() => {
    if (!selectedApplicant) return 500;
    let s = 500;
    const upi = selectedApplicant.upi_monthly_avg ?? 0;
    if (upi >= 150000) s += 60; else if (upi >= 80000) s += 40; else if (upi >= 40000) s += 20;
    if (selectedApplicant.gstin) s += 40;
    s += 40; // digital vintage
    const sl = selectedApplicant.sector.toLowerCase();
    if (sl.includes("kirana") || sl.includes("pharma") || sl.includes("food") || sl.includes("grocery")) s += 25;
    else if (sl.includes("manufacturing") || sl.includes("service") || sl.includes("repair")) s += 10;
    return Math.max(435, Math.min(850, s));
  })();

  const derivedFactors = (() => {
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

  const displayScore = liveScore ?? derivedScore;
  const displayRating = liveRating ?? (displayScore >= 750 ? "Excellent" : displayScore >= 650 ? "Good" : displayScore >= 550 ? "Fair" : "Moderate Risk");
  const displayFactors = liveFactors.length > 0 ? liveFactors : derivedFactors;

  // Fetch real score from DB when applicant changes
  useEffect(() => {
    if (!selectedApplicant) return;
    (async () => {
      const { data: scoreRow } = await supabase
        .from("credit_scores")
        .select("score, rating, xai_factors(*)")
        .eq("applicant_id", selectedApplicant.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (scoreRow) {
        setLiveScore(scoreRow.score);
        setLiveRating(scoreRow.rating);
        const factors = (scoreRow as any).xai_factors ?? [];
        setLiveFactors(factors.map((f: any) => ({ label: f.label, impact: f.impact, description: f.description ?? "" })));
      } else {
        setLiveScore(null);
        setLiveRating(null);
        setLiveFactors([]);
      }
    })();
  }, [selectedApplicant, supabase]);

  const fetchDecisions = useCallback(async () => {
    let query = supabase
      .from("decisions")
      .select(`
        *,
        applicants(name, sector),
        analysts(full_name, role)
      `)
      .order("created_at", { ascending: false })
      .limit(15);

    if (selectedApplicant) {
      query = query.eq("applicant_id", selectedApplicant.id);
    }

    const { data } = await query;

    setDecisions((data as DecisionRecord[]) ?? []);
    setLoading(false);
  }, [supabase, selectedApplicant]);

  useEffect(() => {
    fetchDecisions();

    // Realtime subscription — decisions table
    const channel = supabase
      .channel("decisions-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "decisions" },
        (payload) => {
          // Prepend new decision to list
          setDecisions((prev) => [payload.new as DecisionRecord, ...prev]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchDecisions, supabase]);

  const handleQuickDecision = async (decision: "Approved" | "Review" | "Declined") => {
    if (!analyst || !selectedApplicant) return;
    setSubmitting(true);

    await supabase.from("decisions").insert({
      applicant_id: selectedApplicant.id,
      decision,
      officer_id: analyst.id,
      notes: `Decision for ${selectedApplicant.name} via XAI dashboard — ${new Date().toLocaleString("en-IN")}`,
    });

    await fetchDecisions();
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Transparent Underwriting (XAI)</h1>
        <p className="text-sm text-white/40 mt-1">
          Every credit decision is fully explainable, auditable & stored in real-time
        </p>
      </div>

      {/* Principles */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Scale size={16} className="text-violet-400" />
          <p className="text-xs font-medium text-white/50 uppercase tracking-wider">Underwriting Principles</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: "🧠", title: "AI-Powered, Human-Checked", desc: "Every AI recommendation is reviewed by a trained credit officer before disbursal." },
            { icon: "🔍", title: "Full Transparency", desc: "Borrowers can request their score breakdown. No black-box decisions." },
            { icon: "⚖️", title: "RBI Compliant", desc: "Aligned with Digital Lending Guidelines 2022 & Fair Practice Code." },
          ].map((p) => (
            <div key={p.title} className="bg-white/5 rounded-xl p-4">
              <span className="text-2xl">{p.icon}</span>
              <p className="text-sm font-semibold text-white mt-2 mb-1">{p.title}</p>
              <p className="text-[11px] text-white/40 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Score + factors */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 glass rounded-2xl p-6 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <Eye size={16} className="text-sky-400" />
            <p className="text-xs font-medium text-white/50 uppercase tracking-wider">Live Score Preview</p>
          </div>

          {liveScore ? (
            <>
              <CreditGauge score={displayScore} label="XAI Credit Score" />
              <div className="w-full text-center">
                <p className="text-[10px] text-white/30">Score generated: {new Date().toLocaleDateString("en-IN")}</p>
                <p className={`text-[10px] mt-0.5 ${displayScore >= 650 ? "text-emerald-400" : "text-amber-400"}`}>
                  {displayScore >= 650 ? "✓ Eligible for approval" : "⚑ Manual review recommended"}
                </p>
              </div>

              {/* Quick decision buttons */}
              {analyst && (
                <div className="w-full space-y-2">
                  <p className="text-[10px] text-white/30 uppercase tracking-wider text-center">Record Decision</p>
                  <div className="flex gap-2">
                    {(["Approved", "Review", "Declined"] as const).map((d) => (
                      <button
                        key={d}
                        onClick={() => handleQuickDecision(d)}
                        disabled={submitting}
                        className={`flex-1 py-2 rounded-xl text-[11px] font-semibold border transition-all duration-150
                          disabled:opacity-50 ${decisionStyle[d]}`}
                      >
                        {submitting ? <Loader2 size={12} className="animate-spin mx-auto" /> : d}
                      </button>
                    ))}
                  </div>
                  <p className="text-[9px] text-white/20 text-center">
                    Decisions saved to DB · Visible to all analysts instantly
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <AlertTriangle size={28} className="text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white mb-1">No Score Available</p>
                <p className="text-xs text-white/50 leading-relaxed max-w-[220px]">
                  Go to Dashboard → upload Bank Statement, GST Returns, or ITR to generate a credit score.
                </p>
              </div>
              <div className="w-full bg-amber-500/8 border border-amber-500/15 rounded-xl p-3">
                <p className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">⚠ Documents Required</p>
                <p className="text-[10px] text-white/40 mt-1">Score is solely evaluated based on uploaded financial documents.</p>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-3 glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={16} className="text-emerald-400" />
            <p className="text-xs font-medium text-white/50 uppercase tracking-wider">Factor Breakdown</p>
          </div>
          {liveScore ? (
            <XAIReasoning reasons={displayFactors} />
          ) : (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <p className="text-sm font-medium text-white/50">No XAI Factors Yet</p>
              <p className="text-xs text-white/35 max-w-sm leading-relaxed">
                Upload financial documents on the Dashboard tab first. The explainable score factors will appear here automatically.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Live decision log */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <p className="text-xs font-medium text-white/40 uppercase tracking-wider">Decision Audit Log</p>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
              Live · Realtime
            </span>
          </div>
          <Plus
            size={16}
            className="text-white/30 cursor-pointer hover:text-white/60 transition-colors"
            onClick={fetchDecisions}
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={20} className="text-sky-400 animate-spin" />
          </div>
        ) : decisions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-white/30 text-sm">No decisions recorded yet.</p>
            <p className="text-white/20 text-xs mt-1">Use the Record Decision buttons above to create one.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {decisions.map((d) => (
              <div
                key={d.id}
                className="flex flex-wrap sm:flex-nowrap items-center gap-3 bg-white/4 hover:bg-white/6 rounded-xl p-3 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">
                    {(d.applicants as { name: string } | undefined)?.name ?? "Unknown Applicant"}
                  </p>
                  <p className="text-[10px] text-white/35">
                    {new Date(d.created_at).toLocaleString("en-IN")} · {(d.analysts as { full_name: string } | undefined)?.full_name ?? "System"}
                  </p>
                </div>
                <span className={`flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-lg border ${decisionStyle[d.decision]}`}>
                  <DecisionIcon d={d.decision} />
                  {d.decision}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
