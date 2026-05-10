import { Suspense } from "react";
import { OrdersPageClient } from "./orders-page-client";

interface OrdersPageProps {
  searchParams: Promise<{
    status?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const sp = await searchParams;
  return (
    <Suspense fallback={null}>
      <OrdersPageClient
        initialStatus={sp.status ?? null}
        initialSearch={sp.search ?? ""}
        initialPage={sp.page ? Number(sp.page) : 1}
      />
    </Suspense>
  );
}
