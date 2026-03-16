import { Navbar } from "@/components/layout/Navbar";
import { SignupForm } from "@/components/auth/SignupForm";

type Props = { params: Promise<{ locale: string }> };

export default async function SignupPage({ params }: Props) {
  const { locale } = await params;
  return (
    <div className="min-h-screen flex flex-col bg-dp-bg">
      <Navbar locale={locale} />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <SignupForm locale={locale} />
      </main>
    </div>
  );
}
