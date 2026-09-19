import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { Applicant } from "@/lib/types/database";

function computeScore(applicant: Applicant, metrics: Record<string, number>) {
  let score = 500;
  const factors: { label: string; impact: number; description: string; factor_type: string }[] = [];

  // 1. UPI Inflow (No penalties for micro-inflows)
  const upi = metrics["upi_monthly_inflow"] ?? applicant.upi_monthly_avg ?? 0;
  if (upi >= 150000) {
    score += 60; factors.push({ label: "High UPI inflows (>₹1.5L/m)", impact: 60, description: "Excellent", factor_type: "financial" });
  } else if (upi >= 80000) {
    score += 40; factors.push({ label: "Good UPI inflows (>₹80K/m)", impact: 40, description: "Strong", factor_type: "financial" });
  } else if (upi >= 40000) {
    score += 20; factors.push({ label: "Moderate UPI inflows (>₹40K/m)", impact: 20, description: "Good", factor_type: "financial" });
  } else if (upi > 0) {
    factors.push({ label: "Micro-scale UPI inflows (<₹40K/m)", impact: 0, description: "Neutral (Fairness Applied)", factor_type: "financial" });
  }

  // 2. Revenue Stability
  const stability = metrics["revenue_stability_score"];
  if (stability !== undefined) {
    if (stability >= 80) {
      score += 60; factors.push({ label: "Highly stable revenue pattern", impact: 60, description: "Very Strong", factor_type: "financial" });
    } else if (stability >= 60) {
      score += 30; factors.push({ label: "Moderately stable revenue", impact: 30, description: "Strong", factor_type: "financial" });
    } else {
      score -= 15; factors.push({ label: "Volatile/seasonal revenue", impact: -15, description: "Moderate Risk", factor_type: "financial" });
    }
  }

  // 3. Payment Regularity
  const regularity = metrics["payment_regularity_pct"];
  if (regularity !== undefined) {
    if (regularity >= 90) {
      score += 75; factors.push({ label: "Excellent payment regularity (90%+)", impact: 75, description: "Very Strong", factor_type: "behavioral" });
    } else if (regularity >= 75) {
      score += 40; factors.push({ label: "Good payment regularity (75-89%)", impact: 40, description: "Strong", factor_type: "behavioral" });
    } else {
      score -= 20; factors.push({ label: "Poor payment regularity (<75%)", impact: -20, description: "High Risk", factor_type: "behavioral" });
    }
  }

  // 4. Cash Withdrawal Ratio
  const cashWd = metrics["cash_withdrawal_pct"];
  if (cashWd !== undefined) {
    if (cashWd < 30) {
      score += 20; factors.push({ label: "Low cash withdrawal ratio (<30%)", impact: 20, description: "Strong", factor_type: "behavioral" });
    } else if (cashWd <= 50) {
      factors.push({ label: "Standard cash withdrawal (30-50%)", impact: 0, description: "Neutral (MSME Standard)", factor_type: "behavioral" });
    } else {
      score -= 15; factors.push({ label: "High cash withdrawal (>50%)", impact: -15, description: "Risk Factor", factor_type: "behavioral" });
    }
  }

  // 5. Utility Variance
  const utilVar = metrics["utility_variance_score"];
  if (utilVar !== undefined) {
    if (utilVar >= 70) {
      score += 30; factors.push({ label: "Consistent utility payments", impact: 30, description: "Strong", factor_type: "behavioral" });
    } else {
      score -= 15; factors.push({ label: "High variance in utility payments", impact: -15, description: "Moderate Risk", factor_type: "behavioral" });
    }
  }

  // 6. GSTIN Verification (Fairness Fix: No penalty for unregistered)
  if (applicant.gstin && applicant.gstin.trim() !== "") {
    score += 40; factors.push({ label: "Verified GSTIN (Formalized)", impact: 40, description: "Strong", factor_type: "compliance" });
  } else {
    factors.push({ label: "Unregistered (Exempt Category)", impact: 0, description: "Neutral (Fairness Applied)", factor_type: "compliance" });
  }

  // 7. Digital Footprint Vintage (Assuming 2+ years for demo, or read from metrics)
  const vintageMonths = metrics["digital_vintage_months"] ?? 25; // Default 2+ years
  if (vintageMonths >= 24) {
    score += 40; factors.push({ label: "2+ Years Digital Vintage", impact: 40, description: "Strong", factor_type: "behavioral" });
  } else if (vintageMonths >= 12) {
    score += 20; factors.push({ label: "1-2 Years Digital Vintage", impact: 20, description: "Good", factor_type: "behavioral" });
  } else {
    factors.push({ label: "<1 Year Digital Vintage", impact: 0, description: "Neutral", factor_type: "behavioral" });
  }

  // 8. Sector Resilience
  const sectorLower = applicant.sector.toLowerCase();
  let sectorPoints = 0;
  if (sectorLower.includes("kirana") || sectorLower.includes("pharma") || sectorLower.includes("food staples") || sectorLower.includes("essential") || sectorLower.includes("grocery")) {
    sectorPoints = 25;
    score += 25; factors.push({ label: "Essential Goods Sector", impact: 25, description: "Highly Resilient", factor_type: "sector" });
  } else if (sectorLower.includes("manufacturing") || sectorLower.includes("service") || sectorLower.includes("repair")) {
    sectorPoints = 10;
    score += 10; factors.push({ label: "Services / Manufacturing", impact: 10, description: "Resilient", factor_type: "sector" });
  } else {
    factors.push({ label: "Informal/Gig Sector", impact: 0, description: "Neutral (Fairness Applied)", factor_type: "sector" });
  }

  // 9. Document Deductions
  if (!metrics["upi_monthly_inflow"]) {
    score -= 30; factors.push({ label: "Missing Bank Statements", impact: -30, description: "Data Penalty", factor_type: "compliance" });
  }

  // Cap score between 435 and 850 as per fairness logic
  score = Math.max(435, Math.min(850, score));

  // Rating and Limits
  let rating = "High Risk";
  if (score >= 750) rating = "Excellent";
  else if (score >= 650) rating = "Good";
  else if (score >= 550) rating = "Fair";
  else if (score >= 450) rating = "Moderate Risk";

  const loanAmt = applicant.loan_amount ?? 100000;
  const suggestedLimit = score >= 650 ? loanAmt : score >= 550 ? loanAmt * 0.8 : loanAmt * 0.5;
  const interestRate = score >= 750 ? 11.5 : score >= 650 ? 13.5 : score >= 550 ? 16.5 : 21;
  const recommendation = score >= 650 ? "Approve" : score >= 550 ? "Approve with Monitoring" : "Manual Review Required";

  return { score, rating, recommendation, suggestedLimit, interestRate, factors };
}

// POST /api/score  — compute and persist a credit score
export async function POST(request: Request) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const applicantId: string = body.applicant_id;
  if (!applicantId) return NextResponse.json({ error: "applicant_id required" }, { status: 400 });

  // Fetch applicant
  const { data: applicant } = await supabase.from("applicants").select("*").eq("id", applicantId).single();
  if (!applicant) return NextResponse.json({ error: "Applicant not found" }, { status: 404 });

  // Fetch latest metrics
  const { data: rawMetrics } = await supabase
    .from("financial_metrics")
    .select("metric_type, value")
    .eq("applicant_id", applicantId)
    .order("synced_at", { ascending: false })
    .limit(20);

  // Reduce to latest value per metric_type
  const metrics: Record<string, number> = {};
  for (const m of rawMetrics ?? []) {
    if (!(m.metric_type in metrics)) metrics[m.metric_type] = m.value;
  }

  const result = computeScore(applicant, metrics);

  // Insert credit score
  const { data: scoreRow, error: scoreErr } = await admin
    .from("credit_scores")
    .insert({
      applicant_id: applicantId,
      score: result.score,
      rating: result.rating,
      recommendation: result.recommendation,
      suggested_limit: result.suggestedLimit,
      interest_rate: result.interestRate,
      evaluated_by: user.id,
    })
    .select("id")
    .single();

  if (scoreErr) return NextResponse.json({ error: scoreErr.message }, { status: 500 });

  // Insert XAI factors
  const xaiRows = result.factors.map((f) => ({
    score_id: scoreRow.id,
    label: f.label,
    impact: f.impact,
    description: f.description,
    factor_type: f.factor_type,
  }));
  await admin.from("xai_factors").insert(xaiRows);

  return NextResponse.json({
    score_id: scoreRow.id,
    score: result.score,
    rating: result.rating,
    recommendation: result.recommendation,
    suggested_limit: result.suggestedLimit,
    interest_rate: result.interestRate,
    factors: result.factors,
  });
}
