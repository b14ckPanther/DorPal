import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/server";
import { ChevronRight, ChevronLeft } from "lucide-react";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function MyBookingsPage({ params }: Props) {
  const { locale } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-dp-bg">
        <Navbar locale={locale} />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-sm text-dp-text-muted">
            Please log in to see your bookings.
          </p>
        </main>
        <Footer locale={locale} />
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: bookings } = await (supabase as any)
    .from("appointments")
    .select(
      `
        id,
        start_at,
        end_at,
        status,
        businesses ( name_en )
      `
    )
    .eq("customer_id", user.id)
    .order("start_at", { ascending: false });

  return (
    <div className="min-h-screen flex flex-col bg-dp-bg">
      <Navbar locale={locale} />
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-xl font-bold text-dp-text-primary mb-4">
            My bookings
          </h1>
          {!bookings || bookings.length === 0 ? (
            <p className="text-sm text-dp-text-muted">
              You do not have any bookings yet.
            </p>
          ) : (
            <div className="space-y-3">
              {bookings.map((b: { id: string; start_at: string; end_at: string; status: string; businesses: { name_en?: string } | null }) => (
                <Link
                  key={b.id}
                  href={`/${locale}/bookings/${b.id}`}
                  className="block bg-dp-surface border border-dp-border rounded-card p-4 hover:border-brand-iris/40 hover:bg-brand-iris/5 transition-all"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm text-dp-text-secondary">
                      <p className="font-semibold text-dp-text-primary">
                        {b.businesses?.name_en ?? "Business"}
                      </p>
                      <p>
                        {new Date(b.start_at).toLocaleString(locale)} –{" "}
                        <span className="capitalize">{b.status}</span>
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-dp-text-muted shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer locale={locale} />
    </div>
  );
}

