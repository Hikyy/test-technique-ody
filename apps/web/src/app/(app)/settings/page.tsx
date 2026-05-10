import { Suspense } from "react";
import { SettingsPageClient } from "./settings-page-client";

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsPageClient />
    </Suspense>
  );
}
