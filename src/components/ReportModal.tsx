"use client";

import { X, Download, Printer, CheckCircle2 } from "lucide-react";
import type { Applicant } from "@/lib/types/database";

interface ReportModalProps {
  applicant: Applicant;
  score: number | null;
  rating: string | null;
  factors: { label: string; impact: number; description: string }[];
  onClose: () => void;
}

export default function ReportModal({ applicant, score, rating, factors, onClose }: ReportModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
            <div>
              <h2 className="text-white font-bold text-sm">Underwriting Summary Report</h2>
              <p className="text-[10px] text-white/50">Generated {new Date().toLocaleString("en-IN")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
              <Printer size={16} />
            </button>
            <button className="p-2 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
              <Download size={16} />
            </button>
            <div className="w-px h-6 bg-white/10 mx-1" />
            <button onClick={onClose} className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-white/[0.02]">
          
          {/* Section 1: Merchant Details */}
          <div className="mb-6">
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3 border-b border-white/10 pb-2">1. Borrower Profile</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white/5 rounded-xl p-4">
              <div>
                <p className="text-[10px] text-white/40 mb-1">Name</p>
                <p className="text-sm font-semibold text-white">{applicant.name}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/40 mb-1">Sector</p>
                <p className="text-sm font-semibold text-white">{applicant.sector}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/40 mb-1">Requested Loan</p>
                <p className="text-sm font-semibold text-white">₹{((applicant.loan_amount || 0) / 100000).toFixed(1)}L</p>
              </div>
              <div>
                <p className="text-[10px] text-white/40 mb-1">GSTIN</p>
                <p className="text-sm font-semibold text-white">{applicant.gstin || "Exempt"}</p>
              </div>
            </div>
          </div>

          {/* Section 2: Credit Decision */}
          <div className="mb-6">
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3 border-b border-white/10 pb-2">2. XAI Credit Assessment</h3>
            <div className="flex items-center gap-6 bg-white/5 rounded-xl p-4">
              <div className="text-center shrink-0">
                <div className="text-4xl font-black text-sky-400">{score ?? "N/A"}</div>
                <div className="text-[10px] text-white/50 mt-1">/ 850</div>
              </div>
              <div className="h-12 w-px bg-white/10" />
              <div>
                <div className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                  Rating: <span className="text-emerald-400">{rating ?? "Evaluating"}</span>
                </div>
                <p className="text-xs text-white/50 leading-relaxed">
                  Based on the fairness-optimized algorithm, this enterprise has demonstrated {rating === "Excellent" || rating === "Good" ? "strong repayment capacity" : "moderate risk"}.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Key Factors */}
          <div className="mb-6">
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3 border-b border-white/10 pb-2">3. Deterministic Factors</h3>
            <div className="space-y-2">
              {factors.length > 0 ? factors.map((f, i) => (
                <div key={i} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                  <div>
                    <p className="text-sm font-medium text-white">{f.label}</p>
                    <p className="text-[10px] text-white/40">{f.description}</p>
                  </div>
                  <div className={`text-xs font-bold px-2 py-1 rounded ${f.impact > 0 ? "text-emerald-400 bg-emerald-400/10" : f.impact < 0 ? "text-red-400 bg-red-400/10" : "text-slate-400 bg-slate-400/10"}`}>
                    {f.impact > 0 ? "+" : ""}{f.impact} pts
                  </div>
                </div>
              )) : (
                <p className="text-xs text-white/30 text-center py-4">No specific factors recorded. Sync data to generate factors.</p>
              )}
            </div>
          </div>

          {/* Footer Clause */}
          <p className="text-[10px] text-white/30 text-center mt-8">
            This report is auto-generated by Inviscred XAI Core. Aligned with RBI Digital Lending Guidelines 2022.
          </p>
        </div>
      </div>
    </div>
  );
}
