"use client";

import { AppShell, type SidebarKey } from "@ody/ui";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { type ReactNode, Suspense, useEffect, useState } from "react";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { TenantSwitcher } from "@/components/tenant-switcher";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { useSettings } from "@/lib/hooks/use-settings";

const SEGMENT_TO_KEY: Record<string, SidebarKey> = {
  "": "home",
  dashboard: "home",
  orders: "orders",
  reservations: "reservations",
  customers: "customers",
  menu: "menu",
  settings: "settings",
};

const SEARCHABLE: ReadonlySet<SidebarKey> = new Set(["customers", "orders", "menu"]);

function deriveKey(pathname: string | null): SidebarKey {
  if (!pathname || pathname === "/") return "home";
  const segment = pathname.split("/").filter(Boolean)[0] ?? "";
  return SEGMENT_TO_KEY[segment] ?? "home";
}

function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return (parts[0] ?? "?").slice(0, 2).toUpperCase();
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function AppShellClient({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <AppShellInner>{children}</AppShellInner>
    </Suspense>
  );
}

function AppShellInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const sp = useSearchParams();
  const tCommon = useTranslations("common");
  const tRoles = useTranslations("roles");
  const activeKey = deriveKey(pathname);

  const me = useCurrentUser();
  const settings = useSettings();

  const userName = me.data?.name?.trim() || "";
  const role = me.data?.role;
  const userRole =
    role === "owner" || role === "manager" || role === "staff" || role === "chef" || role === "admin"
      ? tRoles(role)
      : (role ?? "");
  const restaurantName = settings.data?.attributes.name?.trim() || "";

  const sidebarUser =
    userName.length > 0
      ? {
          name: userName,
          role: [userRole, restaurantName].filter(Boolean).join(" · "),
          initials: deriveInitials(userName),
        }
      : undefined;

  const [search, setSearch] = useState("");

  useEffect(() => {
    setSearch(SEARCHABLE.has(activeKey) ? (sp?.get("search") ?? "") : "");
  }, [activeKey, sp]);

  const handleSubmit = (value: string) => {
    const target = SEARCHABLE.has(activeKey) ? `/${activeKey}` : "/customers";
    const next = new URLSearchParams();
    if (value) next.set("search", value);
    const qs = next.toString();
    router.push(qs ? `${target}?${qs}` : target);
  };

  const handleSignOut = async () => {
    try {
      await fetch("/logout", { method: "POST", credentials: "include" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  };

  return (
    <AppShell
      sidebarProps={{
        activeKey,
        user: sidebarUser,
        headerSlot: <TenantSwitcher />,
        onSignOut: handleSignOut,
        signOutLabel: tCommon("signOut"),
      }}
      topbarProps={{
        searchValue: search,
        searchPlaceholder: tCommon("searchPlaceholder"),
        onSearchChange: setSearch,
        onSearchSubmit: handleSubmit,
        rightSlot: <NotificationBell />,
      }}
    >
      {children}
    </AppShell>
  );
}
