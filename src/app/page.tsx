"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, Database, BrainCircuit, Activity } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="mesh-bg min-h-screen text-white font-sans flex flex-col">
      {/* Navbar */}
      <nav className="w-full p-6 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-emerald-400 flex items-center justify-center shadow-md">
            <Database size={16} className="text-white" />
          </div>
          <span className="font-bold text-xl tracking-wide">Inviscred</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
            Sign In
          </Link>
          <Link 
            href="/login" 
            className="text-sm font-bold bg-white text-slate-900 px-5 py-2.5 rounded-full hover:bg-sky-50 transition-colors shadow-lg"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 mt-12 md:mt-0">
        <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm font-medium text-emerald-300 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Next-Gen MSME Credit Underwriting
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
            Fund the <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400">Unbanked.</span><br/>
            With Complete Clarity.
          </h1>
          
          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
            A state-of-the-art lending platform designed to evaluate micro-businesses, retail vendors, and gig workers using Alternative Data and Explainable AI (XAI).
          </p>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/login" 
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl shadow-emerald-500/20 transition-all hover:scale-105"
            >
              Access Dashboard
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 pb-20 px-4">
          <div className="glass p-8 rounded-3xl text-left transition-all hover:bg-white/10">
            <div className="w-12 h-12 bg-sky-500/20 rounded-2xl flex items-center justify-center mb-6">
              <Database size={24} className="text-sky-400" />
            </div>
            <h3 className="text-xl font-bold mb-3">Account Aggregator</h3>
            <p className="text-white/60 leading-relaxed text-sm">
              Instantly fetch verified bank statements and GST data through the RBI AA framework. No more manual document collection.
            </p>
          </div>

          <div className="glass p-8 rounded-3xl text-left transition-all hover:bg-white/10">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-6">
              <BrainCircuit size={24} className="text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold mb-3">Explainable AI (XAI)</h3>
            <p className="text-white/60 leading-relaxed text-sm">
              Our AI doesn't just give a score—it tells you exactly why. See the SHAP values driving every approval or rejection.
            </p>
          </div>

          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-6">
              <Activity size={24} className="text-violet-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Dynamic Credit Profiling</h3>
            <p className="text-slate-400 leading-relaxed">
              Continuously track financial telemetry—such as UPI payment regularity, cash withdrawal patterns, and revenue stability—to maintain an up-to-date assessment of portfolio health.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
