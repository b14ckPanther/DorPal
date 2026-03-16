import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SearchPage } from "@/components/search/SearchPage";
import { getLocalities, getCategories, getActiveBusinesses } from "@/lib/supabase/queries";

type SearchPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    q?: string;
    locality?: string;
    category?: string;
    sort?: string;
    has_offers?: string;
  }>;
};

export default async function SearchRoute({
  params,
  searchParams,
}: SearchPageProps) {
  const { locale } = await params;
  const sp = await searchParams;

  const [localities, categories, businesses] = await Promise.all([
    getLocalities(),
    getCategories(),
    getActiveBusinesses(100),
  ]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar locale={locale} />
      <main className="flex-1">
        <SearchPage
          locale={locale}
          initialQuery={sp.q ?? ""}
          initialLocality={sp.locality ?? ""}
          initialCategory={sp.category ?? ""}
          initialSort={sp.sort ?? "rating"}
          initialHasOffers={sp.has_offers === "true"}
          localities={localities}
          categories={categories}
          businesses={businesses}
        />
      </main>
      <Footer locale={locale} />
    </div>
  );
}
