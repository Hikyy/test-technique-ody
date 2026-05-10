"use client";

import { fr } from "@ody/i18n/messages/fr";
import { ApiClientProvider } from "@ody/sdk";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { NextIntlClientProvider } from "next-intl";
import { type ReactNode, useState } from "react";
import { Toaster } from "sonner";
import { WebTenantProvider } from "@/components/tenant-provider";
import { createQueryClient } from "@/lib/query-client";
import { sdkClient } from "@/lib/sdk-client";

type Props = {
  children: ReactNode;
  locale: string;
  timeZone: string;
};

export function Providers({ children, locale, timeZone }: Props) {
  const [client] = useState(() => createQueryClient());

  return (
    <NextIntlClientProvider locale={locale} timeZone={timeZone} messages={fr}>
      <QueryClientProvider client={client}>
        <ApiClientProvider client={sdkClient}>
          <WebTenantProvider>{children}</WebTenantProvider>
        </ApiClientProvider>
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            classNames: {
              toast: "rounded-card border border-line bg-surface text-ink",
            },
          }}
        />
        {process.env.NODE_ENV === "development" ? (
          <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
        ) : null}
      </QueryClientProvider>
    </NextIntlClientProvider>
  );
}
