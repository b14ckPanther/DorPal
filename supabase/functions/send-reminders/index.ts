// Supabase Edge Function: send-reminders
// Invoke via cron (e.g. every 15 min) or POST with Bearer service role.
//
// Finds confirmed appointments in reminder windows (24h: 23–25h from now; 1h: 30–90 min from now),
// checks reminder_sent idempotency and business tier reminder_quota_per_month, then inserts
// reminder_sent and triggers send-notification for each.

export {};
