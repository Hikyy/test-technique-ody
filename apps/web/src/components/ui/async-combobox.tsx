"use client";

import { useTranslations } from "next-intl";
import { type KeyboardEvent, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";

export interface AsyncComboboxFetchResult<T> {
  items: T[];
  total: number;
}

export interface AsyncComboboxProps<T> {
  value: T | null;
  onChange: (value: T | null) => void;
  fetchItems: (search: string, page: number) => Promise<AsyncComboboxFetchResult<T>>;
  renderItem: (item: T) => ReactNode;
  itemKey: (item: T) => string;
  itemLabel: (item: T) => string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  loadMoreText?: string;
  loadingText?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
  disabled?: boolean;
  invalid?: boolean;
  id?: string;
  footerSlot?: ReactNode;
}

const TRIGGER_CLASS =
  "flex h-10 w-full items-center justify-between rounded-[8px] border border-line-mid bg-surface px-3 font-sans text-[13.5px] text-ink transition-colors hover:border-line-strong focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-50";

const TRIGGER_INVALID = "border-neg/60 focus-visible:border-neg focus-visible:ring-neg/30";

export function AsyncCombobox<T>({
  value,
  onChange,
  fetchItems,
  renderItem,
  itemKey,
  itemLabel,
  placeholder,
  searchPlaceholder,
  emptyText,
  loadMoreText,
  loadingText,
  allowEmpty = false,
  emptyLabel,
  disabled = false,
  invalid = false,
  id,
  footerSlot,
}: AsyncComboboxProps<T>) {
  const tOrders = useTranslations("orders");
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debounced = useDebouncedValue(search, 250);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const reqIdRef = useRef(0);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: setPage is a stable React setter; including only the inputs that should reset pagination
  useEffect(() => {
    if (!open) return;
    setPage(1);
  }, [debounced, open]);

  useEffect(() => {
    if (!open) return;
    const myReq = ++reqIdRef.current;
    setLoading(true);
    fetchItems(debounced.trim(), page)
      .then((res) => {
        if (reqIdRef.current !== myReq) return;
        setItems((prev) => (page === 1 ? res.items : [...prev, ...res.items]));
        setTotal(res.total);
        setLoading(false);
      })
      .catch(() => {
        if (reqIdRef.current !== myReq) return;
        setItems([]);
        setTotal(0);
        setLoading(false);
      });
  }, [debounced, page, open, fetchItems]);

  useEffect(() => {
    if (open) {
      setActiveIndex(-1);
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      setSearch("");
    }
  }, [open]);

  const optionCount = useMemo(() => items.length + (allowEmpty ? 1 : 0), [items.length, allowEmpty]);

  const select = useCallback(
    (item: T | null) => {
      onChange(item);
      setOpen(false);
    },
    [onChange],
  );

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(optionCount - 1, i + 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
      return;
    }
    if (e.key === "Enter") {
      if (activeIndex < 0) return;
      e.preventDefault();
      if (allowEmpty && activeIndex === 0) {
        select(null);
        return;
      }
      const idx = allowEmpty ? activeIndex - 1 : activeIndex;
      const it = items[idx];
      if (it !== undefined) select(it);
    }
  };

  const triggerLabel = value ? itemLabel(value) : (placeholder ?? "");
  const showLoadMore = items.length < total && !loading;

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`${TRIGGER_CLASS} ${invalid ? TRIGGER_INVALID : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={value ? "truncate text-ink" : "truncate text-ink-3"}>
          {value ? triggerLabel : placeholder}
        </span>
        <svg
          className="size-4 shrink-0 text-ink-3"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 flex max-h-80 flex-col rounded-card border border-line bg-surface p-2 shadow-md"
          onKeyDown={onKeyDown}
        >
          <input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            placeholder={searchPlaceholder ?? tOrders("searchPlaceholder")}
            className="mb-2 h-9 w-full rounded-[6px] border border-line-mid bg-bg px-2.5 font-sans text-[13px] text-ink focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
            aria-label={searchPlaceholder ?? tOrders("searchPlaceholder")}
          />

          <div role="listbox" className="flex flex-col overflow-auto">
            {allowEmpty && (
              <button
                type="button"
                role="option"
                aria-selected={value === null}
                onMouseEnter={() => setActiveIndex(0)}
                onClick={() => select(null)}
                className={`flex items-center rounded-[6px] px-2.5 py-2 text-left font-sans text-[13px] text-ink-3 transition-colors hover:bg-accent-soft ${activeIndex === 0 ? "bg-accent-soft" : ""}`}
              >
                — {emptyLabel ?? tOrders("noneOption")} —
              </button>
            )}

            {loading && items.length === 0 && (
              <div className="flex flex-col gap-1.5 py-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-8 animate-pulse rounded-[6px] bg-line/40" />
                ))}
              </div>
            )}

            {!loading && items.length === 0 && (
              <div className="px-2.5 py-3 text-center font-sans text-[12.5px] text-ink-3">
                {emptyText ?? tOrders("noResults")}
              </div>
            )}

            {items.map((it, i) => {
              const idxInList = allowEmpty ? i + 1 : i;
              const selected = value !== null && itemKey(value) === itemKey(it);
              return (
                <button
                  key={itemKey(it)}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onMouseEnter={() => setActiveIndex(idxInList)}
                  onClick={() => select(it)}
                  className={`flex items-center rounded-[6px] px-2.5 py-2 text-left font-sans text-[13px] text-ink transition-colors hover:bg-accent-soft ${activeIndex === idxInList ? "bg-accent-soft" : ""} ${selected ? "bg-accent-soft/60" : ""}`}
                >
                  {renderItem(it)}
                </button>
              );
            })}

            {showLoadMore && (
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                className="mt-1 inline-flex h-8 items-center justify-center rounded-[6px] border border-line-mid bg-bg font-sans text-[12.5px] text-ink-2 transition-colors hover:bg-accent-soft"
              >
                {loadMoreText ?? tOrders("loadMore")}
              </button>
            )}

            {loading && items.length > 0 && (
              <div className="px-2.5 py-1.5 text-center font-sans text-[11.5px] text-ink-3">
                {loadingText ?? tOrders("loadingShort")}
              </div>
            )}
          </div>

          {footerSlot ? <div className="mt-1 border-t border-line pt-1">{footerSlot}</div> : null}
        </div>
      )}
    </div>
  );
}

export type { AsyncComboboxProps as _Props };
