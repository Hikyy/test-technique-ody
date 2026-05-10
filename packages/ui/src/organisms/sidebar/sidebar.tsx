"use client";

import { BookOpen, Calendar, Home, LogOut, Settings, Users, Utensils } from "lucide-react";
import * as React from "react";
import { Avatar, AvatarFallback } from "../../atoms/avatar/avatar";
import { cn } from "../../lib/cn";

export type SidebarKey = "home" | "orders" | "reservations" | "customers" | "menu" | "settings";

export interface SidebarItem {
  key: SidebarKey;
  label: string;
  href: string;
  icon: React.ReactNode;
}

export const DEFAULT_SIDEBAR_ITEMS: SidebarItem[] = [
  { key: "home", label: "Accueil", href: "/dashboard", icon: <Home className="size-3.5" /> },
  { key: "orders", label: "Commandes", href: "/orders", icon: <Calendar className="size-3.5" /> },
  { key: "reservations", label: "Réservations", href: "/reservations", icon: <BookOpen className="size-3.5" /> },
  { key: "customers", label: "Clients", href: "/customers", icon: <Users className="size-3.5" /> },
  { key: "menu", label: "Carte", href: "/menu", icon: <Utensils className="size-3.5" /> },
  { key: "settings", label: "Paramètres", href: "/settings", icon: <Settings className="size-3.5" /> },
];

export interface SidebarUser {
  name: string;
  role: string;
  initials?: string;
}

export interface SidebarProps {
  activeKey?: SidebarKey;
  items?: SidebarItem[];
  user?: SidebarUser;
  headerSlot?: React.ReactNode;
  linkAs?: (props: { href: string; className: string; children: React.ReactNode }) => React.ReactNode;
  className?: string;
  onSignOut?: () => void;
  signOutLabel?: string;
}

function defaultLink({ href, className, children }: { href: string; className: string; children: React.ReactNode }) {
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

export function Sidebar({
  activeKey = "home",
  items = DEFAULT_SIDEBAR_ITEMS,
  user,
  headerSlot,
  linkAs = defaultLink,
  className,
  onSignOut,
  signOutLabel = "Se déconnecter",
}: SidebarProps) {
  return (
    <aside className={cn("flex h-full w-[232px] flex-col border-r border-line bg-bg px-4 py-[22px]", className)}>
      <div className="mb-5 flex items-center gap-2.5 px-2">
        <div className="grid size-[26px] place-items-center rounded-[6px] bg-ink pb-0.5 font-serif text-[18px] italic leading-none text-bg">
          S
        </div>
        <div className="font-serif text-[19px] italic">Sève</div>
      </div>

      {headerSlot ? <div className="mb-4">{headerSlot}</div> : null}

      <nav className="flex flex-col gap-px" aria-label="Navigation principale">
        {items.map((it) => {
          const active = it.key === activeKey;
          return (
            <React.Fragment key={it.key}>
              {linkAs({
                href: it.href,
                className: cn(
                  "flex items-center gap-2.5 rounded-sm px-2.5 py-[7px] text-[13.5px] transition-colors",
                  active ? "bg-accent-soft text-ink font-medium" : "text-ink-2 hover:bg-accent-soft/50 hover:text-ink",
                ),
                children: (
                  <>
                    <span className="inline-flex size-3.5 items-center justify-center">{it.icon}</span>
                    {it.label}
                  </>
                ),
              })}
            </React.Fragment>
          );
        })}
      </nav>

      {user ? (
        <div className="mt-auto flex items-center gap-2.5 border-t border-line px-2.5 py-3">
          <Avatar className="size-7">
            <AvatarFallback>{user.initials ?? user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-[12.5px] font-medium text-ink">{user.name}</div>
            <div className="truncate text-[11px] text-ink-3">{user.role}</div>
          </div>
          {onSignOut ? (
            <button
              type="button"
              onClick={onSignOut}
              aria-label={signOutLabel}
              title={signOutLabel}
              className="grid size-7 shrink-0 place-items-center rounded-sm text-ink-3 transition-colors hover:bg-accent-soft hover:text-ink"
            >
              <LogOut className="size-3.5" />
            </button>
          ) : null}
        </div>
      ) : null}
    </aside>
  );
}
