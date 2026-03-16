import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BookingDetailPage } from "@/components/booking/BookingDetailPage";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyGuestBookingToken } from "@/lib/guest-token";

type Props = {
  params: Promise<{ locale: string; token: string }>;
};

export default async function GuestBookingPage({ params }: Props) {
  const { locale, token } = await params;

  const payload = verifyGuestBookingToken(token);
  if (!payload) {
    return (
      <div className="min-h-screen flex flex-col bg-dp-bg">
        <Navbar locale={locale} />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <p className="text-dp-text-muted mb-2">
              This link is invalid or has expired.
            </p>
            <p className="text-sm text-dp-text-secondary">
              If you have a new link from your confirmation email, use that
              instead.
            </p>
          </div>
        </main>
        <Footer locale={locale} />
      </div>
    );
  }

  const admin = await createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: appointment, error } = await (admin as any)
    .from("appointments")
    .select(
      `
      id, business_id, staff_id, start_at, end_at, status, total_duration_minutes, total_price, currency,
      businesses ( id, name_en, slug ),
      appointment_services ( service_id, service_name_snapshot, duration_minutes_snapshot, price_snapshot )
    `
    )
    .eq("id", payload.appointmentId)
    .single();

  if (error || !appointment) {
    return (
      <div className="min-h-screen flex flex-col bg-dp-bg">
        <Navbar locale={locale} />
        <main className="flex-1 flex items-center justify-center px-4">
          <p className="text-dp-text-muted">Booking not found.</p>
        </main>
        <Footer locale={locale} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-dp-bg">
      <Navbar locale={locale} />
      <main className="flex-1">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-4 px-3 py-2 rounded-lg bg-dp-surface-alt border border-dp-border text-sm text-dp-text-secondary">
            You’re viewing this booking as a guest. Use this page to reschedule
            or cancel.
          </div>
          <BookingDetailPage
            locale={locale}
            appointment={appointment as Parameters<typeof BookingDetailPage>[0]["appointment"]}
            guestToken={token}
          />
        </div>
      </main>
      <Footer locale={locale} />
    </div>
  );
}
