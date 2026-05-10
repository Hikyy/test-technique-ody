import { Suspense } from "react";
import { CustomerDetailPage } from "./customer-detail-page";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetail({ params }: Props) {
  const { id } = await params;
  return (
    <Suspense fallback={null}>
      <CustomerDetailPage customerId={id} />
    </Suspense>
  );
}
