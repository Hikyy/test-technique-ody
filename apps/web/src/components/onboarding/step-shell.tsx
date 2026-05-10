"use client";

import { Button } from "@ody/ui";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

interface StepShellProps {
  step: number;
  totalSteps: number;
  title: string;
  subtitle: string;
  children: ReactNode;
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
  onBack?: () => void;
  sample?: {
    hint: string;
    onClick: () => void;
    loading?: boolean;
  };
}

export function StepShell({
  step,
  totalSteps,
  title,
  subtitle,
  children,
  primaryLabel,
  onPrimary,
  primaryDisabled,
  primaryLoading,
  secondaryLabel,
  onSecondary,
  onBack,
  sample,
}: StepShellProps) {
  const tOnboarding = useTranslations("onboarding");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: pure visual progress segments
            key={i}
            className={`h-1 flex-1 rounded-full ${i < step ? "bg-accent" : "bg-line"}`}
          />
        ))}
      </div>
      <div className="text-[11.5px] uppercase tracking-[0.06em] text-ink-3">
        {tOnboarding("stepLabel", { current: step, total: totalSteps })}
      </div>

      <header>
        <h1 className="font-serif text-[34px] italic text-ink" style={{ letterSpacing: "-0.5px" }}>
          {title}
        </h1>
        <p className="mt-2 text-[14px] text-ink-2">{subtitle}</p>
      </header>

      <section className="flex flex-col gap-4 rounded-card border border-line bg-surface p-6">{children}</section>

      {sample ? (
        <section className="flex items-start justify-between gap-4 rounded-card border border-dashed border-line-mid bg-bg/50 p-5">
          <div>
            <div className="text-[12px] font-medium text-ink">{tOnboarding("samplePrompt")}</div>
            <p className="mt-1 text-[12.5px] text-ink-2">{sample.hint}</p>
          </div>
          <Button variant="outline" onClick={sample.onClick} disabled={sample.loading}>
            {tOnboarding("sampleCta")}
          </Button>
        </section>
      ) : null}

      <footer className="flex items-center justify-between pt-2">
        {onBack ? (
          <Button variant="ghost" onClick={onBack}>
            {tOnboarding("back")}
          </Button>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-3">
          {secondaryLabel && onSecondary ? (
            <Button variant="ghost" onClick={onSecondary}>
              {secondaryLabel}
            </Button>
          ) : null}
          <Button variant="ink" onClick={onPrimary} disabled={primaryDisabled || primaryLoading}>
            {primaryLabel}
          </Button>
        </div>
      </footer>
    </div>
  );
}
