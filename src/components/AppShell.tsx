"use client";
import { Store } from "lucide-react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TopNav from "@/components/TopNav";
import ApplicantHeader from "@/components/ApplicantHeader";
import DashboardView from "@/components/views/DashboardView";
import SupplyChainView from "@/components/views/SupplyChainView";
import UnderwritingView from "@/components/views/UnderwritingView";
import RetailVendorView from "@/components/views/RetailVendorView";
import GigWorkersView from "@/components/views/GigWorkersView";
import type { Analyst, Applicant } from "@/lib/types/database";

export type NavTab =
  | "dashboard"
  | "supply-chain"
  | "underwriting"
  | "retail-vendor"
  | "gig-workers";

interface AppShellProps {
  analyst: Analyst | null;
  applicants: Applicant[];
}

export default function AppShell({ analyst, applicants }: AppShellProps) {
  const [activeTab, setActiveTab] = useState<NavTab>("dashboard");
  const [selectedApplicantId, setSelectedApplicantId] = useState<string | null>(
    applicants.length > 0 ? applicants[0].id : null
  );
  const router = useRouter();

  const selectedApplicant = applicants.find((a) => a.id === selectedApplicantId) || null;

  const renderView = () => {
    if (!selectedApplicant) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 border border-white/10">
            <Store size={24} className="text-white/40" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No Enterprise Selected</h2>
          <p className="text-sm text-white/50 max-w-sm">Please select a merchant from the top navigation dropdown to view their detailed underwriting profile.</p>
        </div>
      );
    }

    switch (activeTab) {
      case "dashboard":
        return <DashboardView analyst={analyst} applicants={applicants} selectedApplicant={selectedApplicant} refreshData={() => router.refresh()} />;
      case "supply-chain":
        return <SupplyChainView selectedApplicant={selectedApplicant} />;
      case "underwriting":
        return <UnderwritingView analyst={analyst} selectedApplicant={selectedApplicant} />;
      case "retail-vendor":
        return <RetailVendorView applicants={applicants.filter(a => a.sector.toLowerCase().includes("retail") || a.sector.toLowerCase().includes("food") || a.sector.toLowerCase().includes("flower"))} selectedApplicant={selectedApplicant} />;
      case "gig-workers":
        return <GigWorkersView applicants={applicants.filter(a => a.sector.toLowerCase().includes("gig") || a.sector.toLowerCase().includes("garment") || a.sector.toLowerCase().includes("manufacturing"))} selectedApplicant={selectedApplicant} />;
      default:
        return null;
    }
  };

  return (
    <div className="mesh-bg min-h-screen flex flex-col">
      <TopNav 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        analyst={analyst} 
        applicants={applicants}
        selectedApplicantId={selectedApplicantId}
        onApplicantChange={setSelectedApplicantId}
      />
      
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ApplicantHeader applicant={selectedApplicant} />
          {renderView()}
        </div>
      </main>
    </div>
  );
}
