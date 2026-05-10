import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/server-session";
import { LandingPage } from "./_landing/landing-page";

export const metadata: Metadata = {
  title: "Sève — L'exploitation de votre restaurant, simplifiée.",
  description:
    "Sève réunit le service, la carte, les clients et les équipes en un seul outil pensé pour les restaurateurs français. Calme, fiable, et fait pour durer.",
  openGraph: {
    title: "Sève — L'exploitation de votre restaurant, simplifiée.",
    description: "Le tableau de bord de service pour les restaurateurs français. Pensé pour le rythme du soir.",
    type: "website",
    locale: "fr_FR",
    siteName: "Sève",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sève — L'exploitation de votre restaurant, simplifiée.",
    description: "Le tableau de bord de service pour les restaurateurs français.",
  },
};

export default async function RootPage() {
  const session = await getServerSession();
  if (session?.user) {
    redirect("/dashboard");
  }
  return <LandingPage />;
}
