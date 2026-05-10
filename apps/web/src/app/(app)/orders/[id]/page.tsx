import { OrderDetailFullPage } from "./order-detail-full-page";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  return <OrderDetailFullPage orderId={id} />;
}
