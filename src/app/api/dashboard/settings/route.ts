import { NextRequest, NextResponse } from "next/server";
import { getDashboardBusinessId, getBusinessSettings, updateBusinessSettings } from "@/lib/supabase/queries";

export async function GET() {
  try {
    const ctx = await getDashboardBusinessId();
    if (!ctx) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    const prefs = await getBusinessSettings(ctx.businessId);
    return NextResponse.json(prefs);
  } catch (err) {
    console.error("Dashboard settings GET:", err);
    return NextResponse.json({ message: "Failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const ctx = await getDashboardBusinessId();
    if (!ctx || !ctx.isOwner) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    const body = (await req.json()) as { email_on_booking?: boolean; sms_on_reminder?: boolean };
    await updateBusinessSettings(ctx.businessId, body);
    const prefs = await getBusinessSettings(ctx.businessId);
    return NextResponse.json(prefs);
  } catch (err) {
    console.error("Dashboard settings PATCH:", err);
    return NextResponse.json({ message: "Failed" }, { status: 500 });
  }
}
