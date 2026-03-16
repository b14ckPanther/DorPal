import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/AdminShell";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function AdminLayout({ children, params }: Props) {
  const { locale } = await params;

  // Skip auth check if using placeholder Supabase URL (development)
  if (process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder.supabase.co") {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      redirect(`/${locale}/login`);
    }
    const { data: profileData } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const profile = profileData as { role?: string } | null;
    if (profile?.role !== "super_admin") {
      redirect(`/${locale}/dashboard`);
    }
  }

  return (
    <AdminShell locale={locale}>
      {children}
    </AdminShell>
  );
}
