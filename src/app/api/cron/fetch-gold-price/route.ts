import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { sendPriceAlert } from "@/lib/resend";

// This route is called by Vercel Cron (GET) every hour.
// Protect it with a shared secret so only Vercel can trigger it.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function fetchGoldPrice(): Promise<number> {
  const apiKey = process.env.METAL_PRICE_API_KEY;

  if (!apiKey) {
    throw new Error("METAL_PRICE_API_KEY is not set");
  }

  const res = await fetch(
    `https://api.metalpriceapi.com/v1/latest?api_key=${apiKey}&base=USD&currencies=XAU`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    throw new Error(`MetalpriceAPI error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();

  if (!json.success) {
    throw new Error(`MetalpriceAPI returned an error: ${JSON.stringify(json)}`);
  }

  // The API returns XAU per USD (e.g. 0.000388). Invert to get USD per troy oz.
  const xauPerUsd: number = json.rates?.XAU;
  if (!xauPerUsd || xauPerUsd <= 0) {
    throw new Error("Invalid XAU rate received from API");
  }

  return 1 / xauPerUsd;
}

export async function GET(req: NextRequest) {
  // Verify cron secret – Vercel sets Authorization: Bearer <CRON_SECRET>
  const authHeader = req.headers.get("authorization");
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  let priceUsd: number;
  try {
    priceUsd = await fetchGoldPrice();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Failed to fetch gold price:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }

  // Insert new price record
  const { error: insertError } = await supabase
    .from("gold_prices")
    .insert({ price_usd: priceUsd });

  if (insertError) {
    console.error("Failed to insert gold price:", insertError);
    return NextResponse.json({ error: "Database insert failed" }, { status: 500 });
  }

  // Fetch the two most recent records to check for a significant move
  const { data: recent, error: fetchError } = await supabase
    .from("gold_prices")
    .select("price_usd, fetched_at")
    .order("fetched_at", { ascending: false })
    .limit(2);

  if (fetchError || !recent || recent.length < 2) {
    // No previous price yet – just return success
    return NextResponse.json({ success: true, price: priceUsd });
  }

  const previousPrice = recent[1].price_usd as number;
  const changePercent = ((priceUsd - previousPrice) / previousPrice) * 100;

  if (Math.abs(changePercent) >= 1) {
    // Fetch all opted-in subscribers and send alerts
    const { data: subscribers, error: subError } = await supabase
      .from("alert_subscribers")
      .select("email")
      .eq("opted_in", true);

    if (!subError && subscribers && subscribers.length > 0) {
      const emails = subscribers.map((s: { email: string }) => s.email);
      const direction: "up" | "down" = changePercent > 0 ? "up" : "down";
      try {
        await sendPriceAlert({
          to: emails,
          currentPrice: priceUsd,
          previousPrice,
          changePercent: Math.abs(changePercent),
          direction,
        });
      } catch (emailErr) {
        console.error("Failed to send alert emails:", emailErr);
        // Don't fail the cron job because of email errors
      }
    }
  }

  return NextResponse.json({
    success: true,
    price: priceUsd,
    changePercent,
  });
}
