import "server-only";
import { createClient } from "@supabase/supabase-js";
import { toMenuItem, toSettings, toZone } from "./db";
import type { Catalog } from "./types";

/** Public menu, zones and settings for the storefront (anon key, read-only via RLS). */
export async function getCatalog(): Promise<Catalog> {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false },
  });
  const [menu, zones, settings] = await Promise.all([
    sb.from("menu_items").select("*").order("sort").order("name"),
    sb.from("zones").select("*").order("sort").order("name"),
    sb.from("settings").select("*").eq("id", 1).single(),
  ]);
  if (menu.error || zones.error || settings.error) throw new Error("Could not load the menu. Please refresh.");
  return { menu: menu.data.map(toMenuItem), zones: zones.data.map(toZone), settings: toSettings(settings.data) };
}
