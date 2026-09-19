// TypeScript types matching the Supabase database schema

export type Role = "junior_analyst" | "senior_analyst" | "admin";
export type DecisionType = "Approved" | "Review" | "Declined";
export type FactorType = "behavioral" | "financial" | "compliance" | "sector";

export interface Analyst {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  branch: string;
  created_at: string;
  updated_at: string;
}

export interface Applicant {
  id: string;
  name: string;
  sector: string;
  city: string;
  business_type: string;
  purpose: string | null;
  loan_amount: number | null;
  employment_count: number;
  upi_monthly_avg: number;
  gstin: string | null;
  status: "active" | "archived";
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreditScore {
  id: string;
  applicant_id: string;
  score: number;
  rating: string;
  recommendation: string | null;
  suggested_limit: number | null;
  interest_rate: number | null;
  evaluated_by: string | null;
  created_at: string;
}

export interface XAIFactor {
  id: string;
  score_id: string;
  label: string;
  impact: number; // -100 to +100
  description: string | null;
  factor_type: FactorType;
}

export interface DecisionRecord {
  id: string;
  applicant_id: string;
  score_id: string | null;
  decision: DecisionType;
  officer_id: string;
  notes: string | null;
  created_at: string;
  // Joined fields
  applicants?: Pick<Applicant, "name" | "sector">;
  analysts?: Pick<Analyst, "full_name" | "role">;
}

export interface FinancialMetric {
  id: string;
  applicant_id: string;
  metric_type: string;
  value: number;
  period_months: number;
  synced_at: string;
}

/** Role display metadata */
export const ROLE_LABELS: Record<Role, string> = {
  junior_analyst: "Junior Analyst",
  senior_analyst: "Senior Analyst",
  admin: "Admin",
};

export const ROLE_BADGE_COLORS: Record<Role, string> = {
  junior_analyst: "text-sky-400 bg-sky-400/10",
  senior_analyst: "text-emerald-400 bg-emerald-400/10",
  admin: "text-violet-400 bg-violet-400/10",
};
