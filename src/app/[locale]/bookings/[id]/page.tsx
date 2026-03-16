import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BookingDetailPage } from "@/components/booking/BookingDetailPage";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function BookingDetailRoute({ params }: Props) {
  const { locale, id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-dp-bg">
        <Navbar locale={locale} />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <p className="text-dp-text-muted mb-4">
              Please log in to view this booking.
            </p>
            <Link
              href={`/${locale}/login?redirect=/${locale}/bookings/${id}`}
              className="text-brand-iris font-medium hover:underline"
            >
              Log in
            </Link>
          </div>
        </main>
        <Footer locale={locale} />
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: appointment, error } = await (supabase as any)
    .from("appointments")
    .select(
      `
      id, business_id, staff_id, start_at, end_at, status, total_duration_minutes, total_price, currency,
      businesses ( id, name_en, slug ),
      appointment_services ( service_id, service_name_snapshot, duration_minutes_snapshot, price_snapshot )
    `
    )
    .eq("id", id)
    .eq("customer_id", user.id)
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
          <BookingDetailPage
            locale={locale}
            appointment={appointment as Parameters<typeof BookingDetailPage>[0]["appointment"]}
            guestToken={null}
          />
        </div>
      </main>
      <Footer locale={locale} />
    </div>
  );
}
