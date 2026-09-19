"use client";

import { useEffect, useState } from "react";

interface ReasonItem {
  label: string;
  impact: number; // -100 to +100, positive = good
  description: string;
}

interface XAIReasoningProps {
  reasons: ReasonItem[];
}

export default function XAIReasoning({ reasons }: XAIReasoningProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="space-y-3">
      {reasons.map((r, i) => {
        const positive = r.impact >= 0;
        const abs = Math.abs(r.impact);
        const barColor = positive
          ? "bg-gradient-to-r from-emerald-500 to-teal-400"
          : "bg-gradient-to-r from-red-500 to-orange-400";
        const textColor = positive ? "text-emerald-400" : "text-red-400";
        const sign = positive ? "+" : "−";

        return (
          <div key={i} className="group">
            <div className="flex items-start justify-between mb-1.5 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`text-xs font-bold shrink-0 w-7 text-right ${textColor}`}
                  aria-label={`${sign}${abs} points`}
                >
                  {sign}{abs}
                </span>
                <span className="text-xs text-white/75 leading-tight">{r.label}</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="flex items-center gap-2">
              <div className="w-7 shrink-0" aria-hidden />
              <div className="flex-1 h-1.5 progress-bar-bg">
                <div
                  className={`h-full ${barColor} progress-bar-fill`}
                  style={{ width: mounted ? `${abs}%` : "0%" }}
                  role="progressbar"
                  aria-valuenow={abs}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
              <span className="text-[10px] text-white/30 w-16 shrink-0 leading-tight">
                {r.description}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
