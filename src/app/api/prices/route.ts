import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createAdminClient();

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("gold_prices")
    .select("id, price_usd, fetched_at")
    .gte("fetched_at", since)
    .order("fetched_at", { ascending: true });

  if (error) {
    console.error("Error fetching prices:", error);
    return NextResponse.json({ error: "Failed to fetch prices" }, { status: 500 });
  }

  return NextResponse.json({ prices: data ?? [] });
}
