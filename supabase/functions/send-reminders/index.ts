// Supabase Edge Function: send-reminders
// Invoke via cron (e.g. every 15 min) or POST with Bearer service role.
//
// Finds confirmed appointments in reminder windows (24h: 23–25h from now; 1h: 30–90 min from now),
// checks reminder_sent idempotency and business tier reminder_quota_per_month, then inserts
// reminder_sent and triggers send-notification for each.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";

const REMINDER_24H = "24h";
const REMINDER_1H = "1h";

function getWindows() {
  const now = new Date();
  const ms = now.getTime();
  return [
    {
      type: REMINDER_24H,
      start: new Date(ms + 23 * 60 * 60 * 1000).toISOString(),
      end: new Date(ms + 25 * 60 * 60 * 1000).toISOString(),
    },
    {
      type: REMINDER_1H,
      start: new Date(ms + 30 * 60 * 1000).toISOString(),
      end: new Date(ms + 90 * 60 * 1000).toISOString(),
    },
  ];
}

serve(async (req) => {
  if (req.method !== "POST" && req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const results: { type: string; appointment_id: string; sent: boolean; reason?: string }[] = [];

  try {
    for (const { type, start, end } of getWindows()) {
      const { data: appointments, error: fetchErr } = await supabase
        .from("appointments")
        .select("id, business_id")
        .eq("status", "confirmed")
        .gte("start_at", start)
        .lte("start_at", end);

      if (fetchErr) {
        console.error(`send-reminders fetch ${type}:`, fetchErr);
        continue;
      }

      for (const apt of appointments ?? []) {
        const appointmentId = apt.id as string;
        const businessId = apt.business_id as string;

        const { data: existing } = await supabase
          .from("reminder_sent")
          .select("id")
          .eq("appointment_id", appointmentId)
          .eq("reminder_type", type)
          .maybeSingle();

        if (existing) {
          results.push({ type, appointment_id: appointmentId, sent: false, reason: "already_sent" });
          continue;
        }

        const { data: quotaRow } = await supabase.rpc("get_plan_feature_value", {
          p_business_id: businessId,
          p_feature_key: "reminder_quota_per_month",
        });
        const quota = Number(quotaRow ?? 0);
        if (quota <= 0) {
          results.push({ type, appointment_id: appointmentId, sent: false, reason: "no_quota" });
          continue;
        }

        const monthStart = new Date();
        monthStart.setUTCDate(1);
        monthStart.setUTCHours(0, 0, 0, 0);
        const monthStartIso = monthStart.toISOString();

        const { data: bizAppointments } = await supabase
          .from("appointments")
          .select("id")
          .eq("business_id", businessId);
        const bizAptIds = (bizAppointments ?? []).map((a: { id: string }) => a.id);

        let sentThisMonth = 0;
        if (bizAptIds.length > 0) {
          const { count: c } = await supabase
            .from("reminder_sent")
            .select("*", { count: "exact", head: true })
            .in("appointment_id", bizAptIds)
            .gte("sent_at", monthStartIso);
          sentThisMonth = c ?? 0;
        }

        if (sentThisMonth >= quota) {
          results.push({ type, appointment_id: appointmentId, sent: false, reason: "quota_exceeded" });
          continue;
        }

        const { error: insertErr } = await supabase.from("reminder_sent").insert({
          appointment_id: appointmentId,
          reminder_type: type,
        });

        if (insertErr) {
          console.error("reminder_sent insert:", insertErr);
          results.push({ type, appointment_id: appointmentId, sent: false, reason: insertErr.message });
          continue;
        }

        try {
          await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify({
              type: type === REMINDER_24H ? "reminder_24h" : "reminder_1h",
              booking_id: appointmentId,
            }),
          });
        } catch (e) {
          console.error("send-notification reminder:", e);
        }
        results.push({ type, appointment_id: appointmentId, sent: true });
      }
    }

    return new Response(
      JSON.stringify({ ok: true, results }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("send-reminders error", error);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
