import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/Navbar";
import { ProfilePageClient } from "@/components/profile/ProfilePageClient";

type Props = { params: Promise<{ locale: string }> };

export default async function ProfileRoute({ params }: Props) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);
  const { data: profile } = await supabase.from("profiles").select("full_name, email, phone, role").eq("id", user.id).single();
  return (
    <div className="min-h-screen flex flex-col bg-dp-bg">
      <Navbar locale={locale} />
      <main className="flex-1 px-4 py-8 max-w-2xl mx-auto w-full">
        <ProfilePageClient locale={locale} profile={profile} />
      </main>
    </div>
  );
}
