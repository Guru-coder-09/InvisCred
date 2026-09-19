"use client";

import { useEffect, useRef, useState } from "react";

interface CreditGaugeProps {
  score: number; // 0–850
  maxScore?: number;
  label?: string;
}

export default function CreditGauge({
  score,
  maxScore = 850,
  label = "Alternative Credit Score",
}: CreditGaugeProps) {
  const [animated, setAnimated] = useState(false);
  const ref = useRef<SVGCircleElement>(null);

  const radius = 80;
  const circumference = Math.PI * radius; // semicircle arc = πr
  const pct = Math.min(score / maxScore, 1);
  const offset = circumference * (1 - pct);

  const getColor = () => {
    if (pct < 0.4) return "#f87171"; // red
    if (pct < 0.65) return "#fb923c"; // orange
    if (pct < 0.8) return "#facc15"; // yellow
    return "#34d399"; // green
  };

  const getRating = () => {
    if (pct < 0.4) return { label: "High Risk", color: "text-red-400" };
    if (pct < 0.65) return { label: "Moderate Risk", color: "text-orange-400" };
    if (pct < 0.8) return { label: "Low Risk", color: "text-yellow-400" };
    return { label: "Creditworthy", color: "text-emerald-400" };
  };

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 200);
    return () => clearTimeout(timer);
  }, [score]);

  const rating = getRating();

  // SVG viewBox: 200×120 — a half-ring that spans the bottom
  const cx = 100;
  const cy = 100;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-56 h-32">
        <svg
          viewBox="0 0 200 110"
          className="w-full h-full"
          role="img"
          aria-label={`${label}: ${score} out of ${maxScore}`}
        >
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#34d399" />
              <stop offset="100%" stopColor={getColor()} />
            </linearGradient>
          </defs>

          {/* Track */}
          <path
            d={`M ${cx - radius},${cy} A ${radius},${radius} 0 0,1 ${cx + radius},${cy}`}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="14"
            strokeLinecap="round"
          />

          {/* Fill */}
          <path
            d={`M ${cx - radius},${cy} A ${radius},${radius} 0 0,1 ${cx + radius},${cy}`}
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={animated ? circumference * (1 - pct) : circumference}
            style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.4, 0, 0.2, 1)" }}
          />

          {/* Tick marks */}
          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const angle = Math.PI * (1 - t);
            const x = cx + radius * Math.cos(angle);
            const y = cy - radius * Math.sin(angle);
            const x2 = cx + (radius - 10) * Math.cos(angle);
            const y2 = cy - (radius - 10) * Math.sin(angle);
            return (
              <line
                key={t}
                x1={x} y1={y} x2={x2} y2={y2}
                stroke="rgba(255,255,255,0.25)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            );
          })}

          {/* Score text */}
          <text x={cx} y={cy - 14} textAnchor="middle" className="fill-white" style={{ fontSize: 28, fontWeight: 700, fill: "white" }}>
            {animated ? score : 0}
          </text>
          <text x={cx} y={cy + 2} textAnchor="middle" style={{ fontSize: 9, fill: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            out of {maxScore}
          </text>
        </svg>

        {/* Min / Max labels */}
        <span className="absolute left-1 bottom-0 text-[10px] text-white/30">0</span>
        <span className="absolute right-1 bottom-0 text-[10px] text-white/30">{maxScore}</span>
      </div>

      {/* Rating badge */}
      <div className={`mt-1 text-sm font-semibold ${rating.color}`}>{rating.label}</div>

      {/* Score band scale */}
      <div className="mt-3 w-48 h-1.5 rounded-full overflow-hidden flex">
        <div className="flex-1 bg-red-500/60" />
        <div className="flex-1 bg-orange-500/60" />
        <div className="flex-1 bg-yellow-500/60" />
        <div className="flex-1 bg-emerald-500/60" />
      </div>
      <div className="flex justify-between w-48 mt-1">
        {["Poor", "Fair", "Good", "Excellent"].map((t) => (
          <span key={t} className="text-[9px] text-white/25">{t}</span>
        ))}
      </div>
    </div>
  );
}
