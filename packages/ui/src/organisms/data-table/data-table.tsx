import type * as React from "react";
import { Skeleton } from "../../atoms/skeleton/skeleton";
import { cn } from "../../lib/cn";

export interface DataTableColumn<T> {
  key: string;
  header: React.ReactNode;
  className?: string;
  render: (row: T, index: number) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  skeletonRows?: number;
  rowKey?: (row: T, index: number) => string | number;
  onRowClick?: (row: T, index: number) => void;
  className?: string;
}

export function DataTable<T>({
  columns,
  rows,
  isLoading,
  emptyState,
  skeletonRows = 6,
  rowKey,
  onRowClick,
  className,
}: DataTableProps<T>) {
  const isEmpty = !isLoading && rows.length === 0;

  return (
    <div className={cn("overflow-hidden rounded-card border border-line bg-surface", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead className="sticky top-0 z-10 bg-surface">
            <tr className="border-b border-line">
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={cn(
                    "px-4 py-2.5 text-left text-[11.5px] font-medium uppercase tracking-[0.04em] text-ink-2",
                    c.className,
                  )}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: skeletonRows }, (_, i) => i).map((i) => (
                <tr key={`sk-row-${columns[0]?.key ?? "x"}-${i}`} className="border-b border-line">
                  {columns.map((c) => (
                    <td key={c.key} className={cn("px-4 py-3", c.className)}>
                      <Skeleton className="h-3.5 w-3/4" />
                    </td>
                  ))}
                </tr>
              ))}

            {!isLoading &&
              rows.map((row, i) => (
                <tr
                  key={rowKey ? rowKey(row, i) : i}
                  className={cn(
                    "border-b border-line last:border-b-0 transition-colors",
                    "hover:bg-accent-tint",
                    onRowClick && "cursor-pointer",
                  )}
                  onClick={onRowClick ? () => onRowClick(row, i) : undefined}
                >
                  {columns.map((c) => (
                    <td key={c.key} className={cn("px-4 py-3 text-ink", c.className)}>
                      {c.render(row, i)}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {isEmpty && <div className="border-t border-line">{emptyState}</div>}
    </div>
  );
}
