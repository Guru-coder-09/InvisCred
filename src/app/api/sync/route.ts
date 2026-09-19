import { createAdminClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// POST /api/sync
// Simulates an RBI Account Aggregator data pull.
// Writes realistic financial_metrics rows for the target applicant.
export async function POST(request: Request) {
  const supabase = await createClient();
  const admin = createAdminClient();

  // Auth guard
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const applicantId: string | undefined = body.applicant_id;

  if (!applicantId) {
    return NextResponse.json({ error: "applicant_id required" }, { status: 400 });
  }

  // Verify applicant exists
  const { data: applicant, error: appErr } = await supabase
    .from("applicants")
    .select("id, name, upi_monthly_avg")
    .eq("id", applicantId)
    .single();

  if (appErr || !applicant) {
    return NextResponse.json({ error: "Applicant not found" }, { status: 404 });
  }

  // Generate realistic financial metrics (simulated AA data)
  const base = applicant.upi_monthly_avg ?? 80000;
  const metrics = [
    { metric_type: "upi_monthly_inflow", value: base, period_months: 12 },
    { metric_type: "upi_monthly_inflow", value: base * 0.97, period_months: 11 },
    { metric_type: "upi_monthly_inflow", value: base * 1.04, period_months: 10 },
    { metric_type: "revenue_stability_score", value: 87, period_months: 12 },
    { metric_type: "payment_regularity_pct", value: 94, period_months: 18 },
    { metric_type: "utility_variance_score", value: 68, period_months: 6 },
    { metric_type: "bank_balance_avg", value: base * 0.6, period_months: 3 },
    { metric_type: "cash_withdrawal_pct", value: 22, period_months: 3 },
  ].map((m) => ({
    ...m,
    applicant_id: applicantId,
    synced_at: new Date().toISOString(),
  }));

  const { error: insertErr } = await admin
    .from("financial_metrics")
    .insert(metrics);

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: `Synced ${metrics.length} metrics for ${applicant.name}`,
    accounts_linked: 12,
    synced_at: new Date().toISOString(),
  });
}
