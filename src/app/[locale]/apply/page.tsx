import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ApplyPageContent } from "@/components/apply/ApplyPageContent";
import { getLocalities, getCategories } from "@/lib/supabase/queries";

type Props = { params: Promise<{ locale: string }> };

export default async function ApplyPage({ params }: Props) {
  const { locale } = await params;
  const [localities, categories] = await Promise.all([
    getLocalities(),
    getCategories(),
  ]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar locale={locale} />
      <main className="flex-1">
        <ApplyPageContent
          locale={locale}
          localities={localities}
          categories={categories}
        />
      </main>
      <Footer locale={locale} />
    </div>
  );
}
