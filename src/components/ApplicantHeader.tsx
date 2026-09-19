"use client";

import { Store, MapPin, Hash, Briefcase, Trash2, Loader2 } from "lucide-react";
import type { Applicant } from "@/lib/types/database";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function ApplicantHeader({ applicant }: { applicant: Applicant | null }) {
  const [deleting, setDeleting] = useState(false);
  const supabase = createClient();

  if (!applicant) return null;

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete ${applicant.name}?`)) {
      setDeleting(true);
      try {
        const res = await fetch(`/api/applicants?id=${applicant.id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to delete");
        window.location.reload();
      } catch (e) {
        console.error(e);
        alert("Could not delete vendor due to database constraints.");
        setDeleting(false);
      }
    }
  };

  return (
    <div className="glass rounded-3xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 animate-in slide-in-from-top-4 duration-500 relative group">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-400 to-emerald-400 flex items-center justify-center shadow-lg shadow-sky-500/20">
          <Store size={28} className="text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            {applicant.name}
            <button 
              onClick={handleDelete}
              disabled={deleting}
              className="text-red-400/50 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 p-1"
              title="Delete Vendor"
            >
              {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            </button>
          </h2>
          <div className="flex flex-wrap items-center gap-3 text-xs text-white/60 font-medium">
            <span className="flex items-center gap-1.5"><Briefcase size={14} className="text-sky-400" /> {applicant.sector}</span>
            <span className="flex items-center gap-1.5"><MapPin size={14} className="text-emerald-400" /> {applicant.city}</span>
            <span className="flex items-center gap-1.5"><Hash size={14} className="text-violet-400" /> {applicant.gstin}</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-8 bg-white/5 border border-white/10 rounded-2xl px-6 py-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1">Requested Loan</p>
          <p className="text-xl font-bold text-emerald-400">₹ {((applicant.loan_amount || 0) / 100000).toFixed(2)}L</p>
        </div>
        <div className="w-px h-10 bg-white/10" />
        <div>
          <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1">Employees</p>
          <p className="text-lg font-bold text-white flex items-center gap-2">
            {applicant.employment_count}
          </p>
        </div>
      </div>
    </div>
  );
}
