"use client";

import { Bell } from "lucide-react";
import type * as React from "react";
import { cn } from "../../lib/cn";
import { SearchBar } from "../../molecules/search-bar/search-bar";

export interface TopbarProps {
  rightSlot?: React.ReactNode;
  searchValue?: string;
  searchPlaceholder?: string;
  onSearchChange?: (v: string) => void;
  onSearchSubmit?: (v: string) => void;
  className?: string;
}

export function Topbar({
  rightSlot,
  searchValue,
  searchPlaceholder,
  onSearchChange,
  onSearchSubmit,
  className,
}: TopbarProps) {
  return (
    <header className={cn("flex h-14 items-center justify-between gap-4 border-b border-line bg-bg px-10", className)}>
      <div className="flex flex-1 items-center gap-4">
        <form
          className="flex-1 max-w-md"
          onSubmit={(e) => {
            e.preventDefault();
            const v = ((e.currentTarget.elements.namedItem("q") as HTMLInputElement | null)?.value ?? "").trim();
            onSearchSubmit?.(v);
          }}
        >
          <SearchBar
            name="q"
            value={searchValue}
            placeholder={searchPlaceholder}
            onChange={onSearchChange ? (e) => onSearchChange(e.currentTarget.value) : undefined}
          />
        </form>
      </div>
      <div className="flex items-center gap-2">
        {rightSlot ?? (
          <button
            type="button"
            className="grid size-9 place-items-center rounded-[8px] text-ink-2 transition-colors hover:bg-accent-soft hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Notifications"
          >
            <Bell className="size-4" />
          </button>
        )}
      </div>
    </header>
  );
}
