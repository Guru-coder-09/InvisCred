"use client";

import { useEffect, useState } from "react";

interface StatCardProps {
  title: string;
  value: string;
  subValue?: string;
  icon: React.ReactNode;
  trend?: { value: string; positive: boolean };
  color?: "sky" | "emerald" | "violet" | "amber";
  delay?: number;
}

const colorMap = {
  sky: {
    icon: "text-sky-400",
    iconBg: "bg-sky-400/10",
    glow: "shadow-sky-500/10",
    bar: "from-sky-500 to-cyan-400",
  },
  emerald: {
    icon: "text-emerald-400",
    iconBg: "bg-emerald-400/10",
    glow: "shadow-emerald-500/10",
    bar: "from-emerald-500 to-teal-400",
  },
  violet: {
    icon: "text-violet-400",
    iconBg: "bg-violet-400/10",
    glow: "shadow-violet-500/10",
    bar: "from-violet-500 to-purple-400",
  },
  amber: {
    icon: "text-amber-400",
    iconBg: "bg-amber-400/10",
    glow: "shadow-amber-500/10",
    bar: "from-amber-500 to-orange-400",
  },
};

export default function StatCard({
  title,
  value,
  subValue,
  icon,
  trend,
  color = "sky",
  delay = 0,
}: StatCardProps) {
  const [visible, setVisible] = useState(false);
  const c = colorMap[color];

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div
      className={`glass glass-hover rounded-2xl p-5 flex flex-col gap-3 transition-all duration-500 shadow-lg ${c.glow}
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-white/50 uppercase tracking-wider">{title}</p>
        <div className={`w-9 h-9 rounded-xl ${c.iconBg} flex items-center justify-center ${c.icon}`}>
          {icon}
        </div>
      </div>

      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        {subValue && (
          <p className="text-xs text-white/40 mt-0.5">{subValue}</p>
        )}
      </div>

      {trend && (
        <div className="flex items-center gap-1.5">
          <span
            className={`text-xs font-semibold ${
              trend.positive ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {trend.positive ? "▲" : "▼"} {trend.value}
          </span>
          <span className="text-[10px] text-white/30">vs last quarter</span>
        </div>
      )}

      {/* Bottom accent bar */}
      <div className="h-0.5 rounded-full bg-white/5 overflow-hidden">
        <div className={`h-full bg-gradient-to-r ${c.bar} w-3/4`} />
      </div>
    </div>
  );
}
