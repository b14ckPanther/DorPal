import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BookingWizard } from "@/components/business/BookingWizard";
import { getBusinessBySlug, getAvailableSlots } from "@/lib/supabase/queries";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ service?: string }>;
};

export default async function BusinessBookPage({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  const { service } = await searchParams;

  const business = await getBusinessBySlug(slug);

  return (
    <div className="min-h-screen flex flex-col bg-dp-bg">
      <Navbar locale={locale} />
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {business ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <h1 className="text-xl sm:text-2xl font-bold text-dp-text-primary mb-1">
                  {business.name_en}
                </h1>
                <p className="text-sm text-dp-text-muted mb-4">
                  {/* Simple subtitle; strings can be localized later */}
                  Choose a service, date, and time to request a booking.
                </p>

                <BookingWizard
                  locale={locale}
                  business={business}
                  initialServiceId={service}
                  fetchAvailability={async ({ serviceIds, staffId, date }) => {
                    "use server";
                    const slots = await getAvailableSlots({
                      businessId: business.id,
                      serviceIds,
                      fromDate: date,
                      toDate: date,
                      staffId,
                    });
                    return slots;
                  }}
                />
              </div>
              <aside className="space-y-3">
                {/* Simple summary sidebar; can be enriched later */}
                <div className="bg-dp-surface border border-dp-border rounded-card p-4 text-sm text-dp-text-secondary">
                  <p className="font-semibold text-dp-text-primary mb-1">
                    What happens next?
                  </p>
                  <ul className="list-disc ms-4 space-y-1">
                    <li>Select service and time.</li>
                    <li>Fill in your contact details.</li>
                    <li>In the next phase we''ll confirm with payment.</li>
                  </ul>
                </div>
              </aside>
            </div>
          ) : (
            <p className="text-center text-dp-text-muted py-16 text-sm">
              Business not found.
            </p>
          )}
        </div>
      </main>
      <Footer locale={locale} />
    </div>
  );
}

