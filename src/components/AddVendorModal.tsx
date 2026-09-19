"use client";

import { useState } from "react";
import { X, Store, MapPin, Briefcase, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface AddVendorModalProps {
  onClose: () => void;
  onAdded: (id: string) => void;
}

export default function AddVendorModal({ onClose, onAdded }: AddVendorModalProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    sector: "Retail / Street Food Vendor",
    city: "",
    business_type: "Sole Proprietorship",
    purpose: "Working Capital",
    loan_amount: 100000,
    employment_count: 1,
    gstin: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: user } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("applicants")
        .insert({
          ...formData,
          upi_monthly_avg: 0, // Will be updated by statement upload
          created_by: user.user?.id
        })
        .select()
        .single();

      if (error) throw error;
      if (data) onAdded(data.id);
    } catch (err: any) {
      setError(err.message || "Failed to add vendor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass w-full max-w-lg rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-bold text-white">Add New Vendor</h2>
            <p className="text-xs text-white/50">Register a new applicant for evaluation</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-[10px] text-white/50 uppercase tracking-wider mb-1">Business Name</label>
              <input 
                required
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-400/50"
                placeholder="E.g. Ramesh Electronics" 
              />
            </div>
            
            <div>
              <label className="block text-[10px] text-white/50 uppercase tracking-wider mb-1">Sector</label>
              <select 
                value={formData.sector}
                onChange={e => setFormData({...formData, sector: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-400/50 appearance-none"
              >
                <option className="bg-[#0d1b2a]">Retail / Street Food Vendor</option>
                <option className="bg-[#0d1b2a]">Electronics Repair</option>
                <option className="bg-[#0d1b2a]">Manufacturing</option>
                <option className="bg-[#0d1b2a]">Garment & Textiles</option>
                <option className="bg-[#0d1b2a]">Logistics / Gig</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-white/50 uppercase tracking-wider mb-1">City</label>
              <input 
                required
                type="text" 
                value={formData.city}
                onChange={e => setFormData({...formData, city: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-400/50"
                placeholder="Mumbai" 
              />
            </div>

            <div>
              <label className="block text-[10px] text-white/50 uppercase tracking-wider mb-1">Loan Amount (₹)</label>
              <input 
                required
                type="number" 
                min={10000}
                value={formData.loan_amount}
                onChange={e => setFormData({...formData, loan_amount: parseInt(e.target.value)})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-400/50"
              />
            </div>

            <div>
              <label className="block text-[10px] text-white/50 uppercase tracking-wider mb-1">Employees</label>
              <input 
                required
                type="number" 
                min={1}
                value={formData.employment_count}
                onChange={e => setFormData({...formData, employment_count: parseInt(e.target.value)})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-400/50"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-[10px] text-white/50 uppercase tracking-wider mb-1">GSTIN (Optional)</label>
              <input 
                type="text" 
                value={formData.gstin}
                onChange={e => setFormData({...formData, gstin: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-400/50 uppercase"
                placeholder="27AADCS..." 
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white text-sm font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {loading ? "Registering..." : <><Plus size={16} /> Register Vendor</>}
          </button>
        </form>
      </div>
    </div>
  );
}
