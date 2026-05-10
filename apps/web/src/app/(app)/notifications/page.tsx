import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/server-session";
import { NotificationsPageClient } from "./notifications-page-client";

export default async function NotificationsPage() {
  const session = await getServerSession();

  if (!session) redirect("/login?next=/notifications");

  return <NotificationsPageClient />;
}
