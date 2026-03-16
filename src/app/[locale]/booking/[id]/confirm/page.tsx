import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";

type Props = {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ token?: string }>;
};

export default async function BookingConfirmPage({ params, searchParams }: Props) {
  const { locale, id } = await params;
  const { token: guestToken } = await searchParams;
  const t = await getTranslations("booking");
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: appointment } = await (supabase as any)
    .from("appointments")
    .select(
      `
        id,
        start_at,
        end_at,
        status,
        businesses ( name_en ),
        appointment_services ( service_name_snapshot )
      `
    )
    .eq("id", id)
    .single();

  return (
    <div className="min-h-screen flex flex-col bg-dp-bg">
      <Navbar locale={locale} />
      <main className="flex-1">
        <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {!appointment ? (
            <p className="text-center text-sm text-dp-text-muted">
              Booking not found.
            </p>
          ) : (
            <div className="bg-dp-surface border border-dp-border rounded-card shadow-card p-6 space-y-3">
              <h1 className="text-xl font-bold text-dp-text-primary mb-1">
                {appointment.status === "confirmed"
                  ? t("booking_confirmed")
                  : t("booking_pending")}
              </h1>
              <p className="text-sm text-dp-text-secondary">
                {appointment.status === "confirmed"
                  ? t("booking_confirmed_desc")
                  : t("booking_pending_desc")}
              </p>
              <div className="text-sm text-dp-text-secondary space-y-1">
                {appointment.businesses?.name_en && (
                  <p>
                    Business:{" "}
                    <span className="font-semibold">
                      {appointment.businesses.name_en}
                    </span>
                  </p>
                )}
                <p>
                  Time:{" "}
                  <span className="font-semibold">
                    {new Date(appointment.start_at).toLocaleString(locale)}
                  </span>
                </p>
              </div>
              {guestToken && (
                <div className="mt-4 pt-4 border-t border-dp-border">
                  <p className="text-sm text-dp-text-secondary mb-2">
                    Use the link below to reschedule or cancel this booking
                    (no login required):
                  </p>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/${locale}/guest/booking/${encodeURIComponent(guestToken)}`}>
                      {t("view_booking")} — manage
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer locale={locale} />
    </div>
  );
}

