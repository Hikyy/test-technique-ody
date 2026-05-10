"use client";

import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";

export interface TenantState {
  organizationId: string | null;
  restaurantId: string | null;
}

export interface TenantStore extends TenantState {
  setOrganization: (id: string | null) => void;
  setRestaurant: (id: string | null) => void;
}

const TenantContext = createContext<TenantStore | null>(null);

export interface TenantPersistAdapter {
  load: () => TenantState;
  save: (next: TenantState) => void;
}

export interface TenantProviderProps {
  children: ReactNode;
  adapter?: TenantPersistAdapter;
  initial?: TenantState;
}

const inMemoryDefault: TenantState = { organizationId: null, restaurantId: null };

export function TenantProvider({ children, adapter, initial }: TenantProviderProps) {
  const [state, setState] = useState<TenantState>(() => {
    if (initial) return initial;
    if (adapter) return adapter.load();
    return inMemoryDefault;
  });

  const setOrganization = useCallback(
    (id: string | null) => {
      setState((prev) => {
        const next: TenantState = { organizationId: id, restaurantId: null };
        adapter?.save(next);
        return prev.organizationId === id && prev.restaurantId === null ? prev : next;
      });
    },
    [adapter],
  );

  const setRestaurant = useCallback(
    (id: string | null) => {
      setState((prev) => {
        if (prev.restaurantId === id) return prev;
        const next: TenantState = { ...prev, restaurantId: id };
        adapter?.save(next);
        return next;
      });
    },
    [adapter],
  );

  const value = useMemo<TenantStore>(
    () => ({ ...state, setOrganization, setRestaurant }),
    [state, setOrganization, setRestaurant],
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant(): TenantStore {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error("useTenant must be used inside <TenantProvider>");
  return ctx;
}

export function useActiveOrganization(): string | null {
  return useTenant().organizationId;
}

export function useActiveRestaurant(): string | null {
  return useTenant().restaurantId;
}

export function useSwitchOrganization(): (id: string | null) => void {
  return useTenant().setOrganization;
}

export function useSwitchRestaurant(): (id: string | null) => void {
  return useTenant().setRestaurant;
}

export function buildTenantHeaders(state: TenantState): Record<string, string> {
  const headers: Record<string, string> = {};
  if (state.organizationId) headers["x-organization-id"] = state.organizationId;
  if (state.restaurantId) headers["x-restaurant-id"] = state.restaurantId;
  return headers;
}
