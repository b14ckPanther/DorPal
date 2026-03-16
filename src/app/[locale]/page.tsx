import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { CategoriesSection } from "@/components/home/CategoriesSection";
import { FeaturedBusinesses } from "@/components/home/FeaturedBusinesses";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { ForBusinessSection } from "@/components/home/ForBusinessSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { getLocalities, getCategories } from "@/lib/supabase/queries";

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const [localities, categories] = await Promise.all([
    getLocalities(),
    getCategories(),
  ]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar locale={locale} />
      <main className="flex-1">
        <HeroSection locale={locale} localities={localities} categories={categories} />
        <CategoriesSection locale={locale} />
        <FeaturedBusinesses locale={locale} />
        <HowItWorksSection locale={locale} />
        <TestimonialsSection locale={locale} />
        <ForBusinessSection locale={locale} />
      </main>
      <Footer locale={locale} />
    </div>
  );
}
