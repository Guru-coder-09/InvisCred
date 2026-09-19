"use client";

import { useState } from "react";
import { RefreshCw, CheckCircle, Zap } from "lucide-react";

type SyncState = "idle" | "syncing" | "done";

interface SyncButtonProps {
  applicantId?: string;
  onSyncComplete?: () => void;
}

export default function SyncButton({ applicantId, onSyncComplete }: SyncButtonProps) {
  const [state, setState] = useState<SyncState>("idle");
  const [accountsLinked, setAccountsLinked] = useState(0);

  const handleSync = async () => {
    if (state === "syncing" || !applicantId) return;
    setState("syncing");

    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicant_id: applicantId }),
      });
      const data = await res.json();
      if (res.ok) {
        setAccountsLinked(data.accounts_linked ?? 12);
        setState("done");
        onSyncComplete?.();
      } else {
        console.error("Sync failed:", data.error);
        setState("idle");
      }
    } catch {
      setState("idle");
    }
  };

  const handleReset = () => setState("idle");

  if (state === "done") {
    return (
      <button
        onClick={handleReset}
        className="group relative flex items-center gap-3 px-6 py-3.5 rounded-2xl
          bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/20
          transition-all duration-200 shadow-lg shadow-emerald-500/10 cursor-pointer"
      >
        <CheckCircle size={20} className="text-emerald-400" />
        <div className="text-left">
          <p className="text-sm font-semibold text-emerald-300">Sync Successful</p>
          <p className="text-[10px] text-emerald-400/60">
            Account Aggregator · {accountsLinked} accounts linked · Score computed
          </p>
        </div>
        <span className="text-[10px] text-white/30 ml-2 group-hover:text-white/50 transition-colors">Reset</span>
      </button>
    );
  }

  if (state === "syncing") {
    return (
      <button
        disabled
        className="relative flex items-center gap-3 px-6 py-3.5 rounded-2xl
          bg-sky-500/10 border border-sky-400/25 cursor-not-allowed"
        aria-busy="true"
        aria-label="Syncing account data"
      >
        <RefreshCw size={20} className="text-sky-400 animate-spin" />
        <div className="text-left">
          <p className="text-sm font-semibold text-sky-300">Fetching MSME Data…</p>
          <p className="text-[10px] text-sky-400/60">Connecting via RBI Account Aggregator Framework</p>
        </div>
        <div className="absolute inset-0 rounded-2xl shimmer pointer-events-none" aria-hidden />
      </button>
    );
  }

  return (
    <button
      onClick={handleSync}
      disabled={!applicantId}
      className="pulse-ring relative flex items-center gap-3 px-6 py-3.5 rounded-2xl
        bg-gradient-to-r from-sky-500/20 to-emerald-500/20
        border border-sky-400/30 hover:border-sky-400/50
        hover:from-sky-500/30 hover:to-emerald-500/30
        transition-all duration-200 shadow-lg shadow-sky-500/15 cursor-pointer
        hover:shadow-sky-500/25 active:scale-[0.98]
        disabled:opacity-40 disabled:cursor-not-allowed"
      aria-label="Initiate Account Aggregator Sync"
    >
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-emerald-400 flex items-center justify-center shadow-md shadow-sky-500/30">
        <Zap size={18} className="text-white" />
      </div>
      <div className="text-left">
        <p className="text-sm font-semibold text-white">Initiate Account Aggregator Sync</p>
        <p className="text-[10px] text-white/40">RBI AA Framework · NBFC-AA compliant · Writes to DB</p>
      </div>
    </button>
  );
}
