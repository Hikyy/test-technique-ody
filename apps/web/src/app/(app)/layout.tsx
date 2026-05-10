import { redirect } from "next/navigation";
import { AppShellClient } from "@/components/app-shell-client";
import { getOnboardingState, getServerSession } from "@/lib/server-session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [session, onboarded] = await Promise.all([getServerSession(), getOnboardingState()]);
  if (!session) {
    redirect("/login");
  }
  if (onboarded === false) {
    redirect("/onboarding");
  }

  return <AppShellClient>{children}</AppShellClient>;
}
