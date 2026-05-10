"use client";

import {
  type OrganizationData,
  type RestaurantInOrgData,
  useActiveOrganization,
  useActiveRestaurant,
  useOrganizations,
  useRestaurantsInOrg,
  useSwitchOrganization,
  useSwitchRestaurant,
} from "@ody/sdk";
import { Building2, ChevronsUpDown, Plus, Store } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

function useClickOutside(ref: React.RefObject<HTMLDivElement | null>, onClose: () => void) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onClose]);
}

export function TenantSwitcher() {
  const router = useRouter();
  const orgs = useOrganizations();
  const activeOrgId = useActiveOrganization();
  const activeRestaurantId = useActiveRestaurant();
  const setOrganization = useSwitchOrganization();
  const setRestaurant = useSwitchRestaurant();

  const items = orgs.data?.items ?? [];
  const activeOrg = items.find((o) => o.id === activeOrgId) ?? items[0];

  useEffect(() => {
    if (!activeOrgId && activeOrg) setOrganization(activeOrg.id);
  }, [activeOrgId, activeOrg, setOrganization]);

  const restaurants = useRestaurantsInOrg(activeOrg?.id ?? null);
  const restaurantItems = restaurants.data?.items ?? [];
  const activeRestaurant = restaurantItems.find((r) => r.id === activeRestaurantId) ?? restaurantItems[0];

  useEffect(() => {
    if (!activeRestaurantId && activeRestaurant) setRestaurant(activeRestaurant.id);
  }, [activeRestaurantId, activeRestaurant, setRestaurant]);

  return (
    <div className="flex flex-col gap-2 px-2">
      <OrgPicker
        items={items}
        active={activeOrg}
        onSelect={(id) => {
          setOrganization(id);
          router.refresh();
        }}
      />
      {activeOrg ? (
        <RestaurantPicker
          items={restaurantItems}
          active={activeRestaurant}
          onSelect={(id) => {
            setRestaurant(id);
            router.refresh();
          }}
          orgId={activeOrg.id}
          canCreate={activeOrg.attributes.role === "owner" || activeOrg.attributes.role === "admin"}
        />
      ) : null}
    </div>
  );
}

function OrgPicker({
  items,
  active,
  onSelect,
}: {
  items: OrganizationData[];
  active?: OrganizationData;
  onSelect: (id: string) => void;
}) {
  const t = useTranslations("organization");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));
  const ownsOrg = items.some((o) => o.attributes.role === "owner");

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-[8px] border border-line bg-surface px-2.5 py-2 text-left transition-colors hover:border-line-mid focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
      >
        <Building2 className="size-3.5 shrink-0 text-ink-2" aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12.5px] font-medium text-ink">{active?.attributes.name ?? "—"}</div>
        </div>
        <ChevronsUpDown className="size-3 shrink-0 text-ink-3" aria-hidden />
      </button>
      {open ? (
        <div className="absolute left-0 right-0 z-30 mt-1 max-h-72 overflow-auto rounded-[8px] border border-line bg-bg p-1 shadow-md">
          {items.map((it) => (
            <button
              key={it.id}
              type="button"
              onClick={() => {
                onSelect(it.id);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 rounded-[6px] px-2 py-1.5 text-left text-[12.5px] transition-colors hover:bg-accent-soft ${
                it.id === active?.id ? "bg-accent-soft text-ink" : "text-ink-2"
              }`}
            >
              <Building2 className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">{it.attributes.name}</span>
            </button>
          ))}
          {ownsOrg ? null : (
            <Link
              href="/organizations/new"
              onClick={() => setOpen(false)}
              className="mt-1 flex items-center gap-2 rounded-[6px] border-t border-line px-2 py-1.5 text-[12px] text-accent transition-colors hover:bg-accent-soft"
            >
              <Plus className="size-3.5" aria-hidden />
              {t("newOrganization")}
            </Link>
          )}
        </div>
      ) : null}
    </div>
  );
}

function RestaurantPicker({
  items,
  active,
  onSelect,
  orgId,
  canCreate,
}: {
  items: RestaurantInOrgData[];
  active?: RestaurantInOrgData;
  onSelect: (id: string) => void;
  orgId: string;
  canCreate: boolean;
}) {
  const t = useTranslations("organization");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={items.length === 0}
        className="flex w-full items-center gap-2 rounded-[8px] border border-line bg-bg px-2.5 py-2 text-left transition-colors hover:border-line-mid focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:opacity-50"
      >
        <Store className="size-3.5 shrink-0 text-ink-2" aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12px] text-ink-2">{active?.attributes.name ?? t("noRestaurant")}</div>
        </div>
        <ChevronsUpDown className="size-3 shrink-0 text-ink-3" aria-hidden />
      </button>
      {open ? (
        <div className="absolute left-0 right-0 z-30 mt-1 max-h-72 overflow-auto rounded-[8px] border border-line bg-bg p-1 shadow-md">
          {items.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => {
                onSelect(r.id);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 rounded-[6px] px-2 py-1.5 text-left text-[12.5px] transition-colors hover:bg-accent-soft ${
                r.id === active?.id ? "bg-accent-soft text-ink" : "text-ink-2"
              }`}
            >
              <Store className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">{r.attributes.name}</span>
            </button>
          ))}
          {canCreate ? (
            <Link
              href={`/organizations/${orgId}/restaurants/new`}
              onClick={() => setOpen(false)}
              className="mt-1 flex items-center gap-2 rounded-[6px] border-t border-line px-2 py-1.5 text-[12px] text-accent transition-colors hover:bg-accent-soft"
            >
              <Plus className="size-3.5" aria-hidden />
              {t("newRestaurant")}
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
