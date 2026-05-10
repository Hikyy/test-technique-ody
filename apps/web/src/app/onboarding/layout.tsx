"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export default function OnboardingLayout({ children }: Props) {
  const tCommon = useTranslations("common");

  return (
    <main className="min-h-screen bg-bg">
      <header className="flex items-center justify-between border-b border-line px-8 py-5">
        <div className="flex items-center gap-2.5">
          <div className="grid size-[26px] place-items-center rounded-[6px] bg-ink pb-0.5 font-serif text-[18px] italic leading-none text-bg">
            S
          </div>
          <div className="font-serif text-[19px] italic">{tCommon("appName")}</div>
        </div>
      </header>
      <div className="mx-auto max-w-[640px] px-6 py-10">{children}</div>
    </main>
  );
}
