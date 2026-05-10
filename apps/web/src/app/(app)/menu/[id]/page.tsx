import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DishDetailPage({ params }: Props) {
  await params;
  redirect("/menu");
}
