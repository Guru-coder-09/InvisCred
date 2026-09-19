import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { applicant_id, metrics } = body;
  
  if (!applicant_id || !metrics || !Array.isArray(metrics)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // metrics is an array of { metric_type: string, value: number }
  const rows = metrics.map((m: any) => ({
    applicant_id,
    metric_type: m.metric_type,
    value: m.value,
    period_months: 12,
    synced_at: new Date().toISOString()
  }));

  const { error } = await supabase.from("financial_metrics").insert(rows);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  return NextResponse.json({ success: true, count: rows.length });
}
