"use client";

import type { LucideIcon } from "lucide-react";
import { ChefHat, Cog, Plus, Users, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface Shortcut {
  key: "newOrder" | "newCustomer" | "newDish" | "viewMenu" | "viewCustomers" | "viewSettings";
  href: string;
  icon: LucideIcon;
  emphasis?: boolean;
}

const SHORTCUTS: readonly Shortcut[] = [
  { key: "newOrder", href: "/orders?new=1", icon: Plus, emphasis: true },
  { key: "newCustomer", href: "/customers?new=1", icon: Plus },
  { key: "newDish", href: "/menu?new=1", icon: Plus },
  { key: "viewMenu", href: "/menu", icon: UtensilsCrossed },
  { key: "viewCustomers", href: "/customers", icon: Users },
  { key: "viewSettings", href: "/settings", icon: Cog },
] as const;

export function QuickActions() {
  const tShortcuts = useTranslations("dashboard.shortcuts");

  return (
    <div className="lg:col-span-2 rounded-card border border-line bg-surface px-5 py-4">
      <div className="mb-3 flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.04em] text-ink-2">
        <ChefHat className="size-3.5" aria-hidden />
        {tShortcuts("title")}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {SHORTCUTS.map((s) => (
          <ShortcutLink key={s.key} shortcut={s} label={tShortcuts(s.key)} />
        ))}
      </div>
    </div>
  );
}

function ShortcutLink({ shortcut, label }: { shortcut: Shortcut; label: string }) {
  const Icon = shortcut.icon;
  const base =
    "group inline-flex h-[58px] flex-col items-center justify-center gap-1 rounded-[10px] px-3 text-[12.5px] font-medium transition-colors";
  const variant = shortcut.emphasis
    ? "bg-ink text-bg hover:bg-ink/90"
    : "border border-line bg-bg text-ink hover:border-line-mid hover:bg-accent-soft";
  const iconClass = shortcut.emphasis ? "size-[16px] text-bg/90" : "size-[16px] text-ink-2 group-hover:text-ink";

  return (
    <Link href={shortcut.href} className={`${base} ${variant}`}>
      <Icon className={iconClass} aria-hidden />
      <span className="text-center leading-tight">{label}</span>
    </Link>
  );
}
