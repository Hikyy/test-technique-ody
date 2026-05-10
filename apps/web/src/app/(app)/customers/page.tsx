import { Suspense } from "react";
import { CustomersPageClient } from "./customers-page-client";

interface CustomersPageProps {
  searchParams: Promise<{
    search?: string;
    page?: string;
  }>;
}

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const sp = await searchParams;
  return (
    <Suspense fallback={null}>
      <CustomersPageClient initialSearch={sp.search ?? ""} initialPage={sp.page ? Number(sp.page) : 1} />
    </Suspense>
  );
}
