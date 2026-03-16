import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const url = new URL(request.url);
  const segments = url.pathname.split("/").filter(Boolean);
  const locale = segments[0] && ["ar", "he", "en"].includes(segments[0])
    ? segments[0]
    : "ar";

  return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
}

