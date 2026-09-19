"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Landmark, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import type { Role } from "@/lib/types/database";

type AuthMode = "signin" | "signup";

const ROLES: { value: Role; label: string; desc: string }[] = [
  { value: "junior_analyst", label: "Junior Analyst", desc: "View & evaluate applications" },
  { value: "senior_analyst", label: "Senior Analyst", desc: "Approve up to ₹10L, override decisions" },
  { value: "admin", label: "Admin", desc: "Full access, user management" },
];

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<Role>("junior_analyst");
  const [branch, setBranch] = useState("Mumbai HQ");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/dashboard");
        router.refresh();
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, role, branch },
          },
        });
        if (error) throw error;
        setSuccessMsg("Account created! Check your email to confirm, then sign in.");
        setMode("signin");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mesh-bg min-h-screen flex items-center justify-center px-4 py-12">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Brand header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-400 to-emerald-400 flex items-center justify-center shadow-xl shadow-sky-500/30 mb-4">
            <Landmark size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Inviscred Platform</h1>
          <p className="text-sm text-white/40 mt-1">Intelligence-powered credit evaluation</p>
        </div>

        {/* Glass card */}
        <div className="glass rounded-3xl p-8 shadow-2xl">
          {/* Tab toggle */}
          <div className="flex rounded-xl bg-white/5 p-1 mb-7">
            {(["signin", "signup"] as AuthMode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null); setSuccessMsg(null); }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200
                  ${mode === m
                    ? "bg-white/10 text-white shadow"
                    : "text-white/40 hover:text-white/60"
                  }`}
              >
                {m === "signin" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          {/* Error / success banners */}
          {error && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-5">
              <AlertCircle size={15} className="text-red-400 mt-0.5 shrink-0" />
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}
          {successMsg && (
            <div className="flex items-start gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 mb-5">
              <p className="text-xs text-emerald-300">✓ {successMsg}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full name (signup only) */}
            {mode === "signup" && (
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="Priya Menon"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3
                    text-sm text-white placeholder-white/20
                    focus:outline-none focus:border-sky-400/50 focus:bg-white/8
                    transition-all duration-200"
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="analyst@bank.in"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3
                  text-sm text-white placeholder-white/20
                  focus:outline-none focus:border-sky-400/50 focus:bg-white/8
                  transition-all duration-200"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Min. 8 characters"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-11
                    text-sm text-white placeholder-white/20
                    focus:outline-none focus:border-sky-400/50 focus:bg-white/8
                    transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Role + Branch (signup only) */}
            {mode === "signup" && (
              <>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wider">
                    Analyst Role
                  </label>
                  <div className="space-y-2">
                    {ROLES.map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setRole(r.value)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-150
                          ${role === r.value
                            ? "border-sky-400/50 bg-sky-400/10 text-white"
                            : "border-white/10 bg-white/3 text-white/50 hover:bg-white/5 hover:text-white/70"
                          }`}
                      >
                        <div className={`w-2 h-2 rounded-full shrink-0 ${role === r.value ? "bg-sky-400" : "bg-white/20"}`} />
                        <div>
                          <p className="text-xs font-semibold">{r.label}</p>
                          <p className="text-[10px] opacity-60 mt-0.5">{r.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">
                    Branch
                  </label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3
                      text-sm text-white focus:outline-none focus:border-sky-400/50
                      transition-all duration-200 appearance-none"
                  >
                    {["Mumbai HQ", "Delhi NCR", "Bengaluru", "Chennai", "Pune", "Hyderabad"].map((b) => (
                      <option key={b} value={b} className="bg-[#0d1b2a]">{b}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 mt-2
                bg-gradient-to-r from-sky-500 to-emerald-500
                hover:from-sky-400 hover:to-emerald-400
                disabled:opacity-50 disabled:cursor-not-allowed
                text-white font-semibold text-sm py-3.5 rounded-xl
                shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40
                transition-all duration-200 active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : mode === "signin" ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-[11px] text-white/20 mt-6">
            RBI Compliant · Digital Lending Guidelines 2022 · AES-256 Encrypted
          </p>
        </div>

        {/* Demo credentials hint */}
        <div className="glass rounded-2xl px-5 py-3 mt-4 flex items-center gap-3">
          <span className="text-lg">💡</span>
          <p className="text-[11px] text-white/40">
            First time? Click <strong className="text-white/60">Create Account</strong> to register as an analyst.
            Email confirmation may be required.
          </p>
        </div>
      </div>
    </div>
  );
}
