import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";

export default async function Home() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch the logged-in analyst's profile
  const { data: analyst } = await supabase
    .from("analysts")
    .select("*")
    .eq("id", user.id)
    .single();

  // Fetch all applicants for the dashboard
  const { data: applicants } = await supabase
    .from("applicants")
    .select("*")
    .order("created_at", { ascending: false });

  return <AppShell analyst={analyst} applicants={applicants ?? []} />;
}
