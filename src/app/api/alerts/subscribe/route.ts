import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let email: string;
  try {
    const body = await req.json();
    email = (body.email ?? "").trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Upsert subscriber: insert or update opted_in to true
  const { error } = await supabase
    .from("alert_subscribers")
    .upsert({ email, opted_in: true }, { onConflict: "email" });

  if (error) {
    console.error("Failed to subscribe email:", error);
    return NextResponse.json({ error: "Subscription failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  let email: string;
  try {
    const body = await req.json();
    email = (body.email ?? "").trim().toLowerCase();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("alert_subscribers")
    .update({ opted_in: false })
    .eq("email", email);

  if (error) {
    console.error("Failed to unsubscribe email:", error);
    return NextResponse.json({ error: "Unsubscribe failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
