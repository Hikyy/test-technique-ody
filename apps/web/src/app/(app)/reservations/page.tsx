import { Suspense } from "react";
import { ReservationsPageClient } from "./reservations-page-client";

export default function ReservationsPage() {
  return (
    <Suspense fallback={null}>
      <ReservationsPageClient />
    </Suspense>
  );
}
