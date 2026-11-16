import { createClient } from "@supabase/supabase-js";

// Free Supabase projects pause after a week without traffic; a daily Vercel cron hits this to keep the database awake.
export const dynamic = "force-dynamic";

export async function GET() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false },
  });
  const { error } = await sb.from("settings").select("id").eq("id", 1).single();
  return Response.json({ ok: !error }, { status: error ? 503 : 200 });
}
