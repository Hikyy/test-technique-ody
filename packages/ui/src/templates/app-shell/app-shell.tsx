import type * as React from "react";
import { cn } from "../../lib/cn";
import { Sidebar, type SidebarProps } from "../../organisms/sidebar/sidebar";
import { Topbar, type TopbarProps } from "../../organisms/topbar/topbar";

export interface AppShellProps {
  sidebarProps?: SidebarProps;
  topbarProps?: TopbarProps;
  children: React.ReactNode;
  className?: string;
}

export function AppShell({ sidebarProps, topbarProps, children, className }: AppShellProps) {
  return (
    <div className={cn("flex h-screen w-full overflow-hidden bg-bg text-ink", className)}>
      <Sidebar {...sidebarProps} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar {...topbarProps} />
        <main className="flex-1 overflow-y-auto px-10 py-8">{children}</main>
      </div>
    </div>
  );
}
