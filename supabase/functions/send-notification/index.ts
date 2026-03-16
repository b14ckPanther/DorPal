// Supabase Edge Function: send-notification
// POST /functions/v1/send-notification

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const { type, booking_id } = await req.json() as {
      type: string;
      booking_id?: string;
    };

    if (!type) {
      return new Response(JSON.stringify({ error: "type is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (type === "booking_confirmation" && booking_id) {
      const { data: appointment } = await supabase
        .from("appointments")
        .select(
          `
            id,
            start_at,
            status,
            businesses ( name_en ),
            profiles!appointments_customer_id_fkey ( email, full_name )
          `
        )
        .eq("id", booking_id)
        .single();

      console.log("Would send booking confirmation", appointment);
    }

    if ((type === "reminder_24h" || type === "reminder_1h") && booking_id) {
      const { data: appointment } = await supabase
        .from("appointments")
        .select(
          `
            id,
            start_at,
            guest_email,
            guest_name,
            businesses ( name_en ),
            profiles!appointments_customer_id_fkey ( email, full_name )
          `
        )
        .eq("id", booking_id)
        .single();

      console.log(`Would send ${type} reminder`, appointment);
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("send-notification error", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

