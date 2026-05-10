import { Suspense } from "react";
import { MenuPageClient } from "./menu-page-client";

interface MenuPageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function MenuPage({ searchParams }: MenuPageProps) {
  const sp = await searchParams;
  return (
    <Suspense fallback={null}>
      <MenuPageClient initialCategoryId={sp.category ?? null} />
    </Suspense>
  );
}
