import { headers } from "next/headers";
import { apiBaseUrl } from "./api-client";

export type ServerSession = {
  user: {
    id: string;
    email: string;
    name: string;
    role?: string;
  };
} | null;

export async function getServerSession(): Promise<ServerSession> {
  const h = await headers();
  const cookie = h.get("cookie") ?? "";
  if (!cookie) return null;

  try {
    const res = await fetch(`${apiBaseUrl}/api/auth/get-session`, {
      headers: { cookie },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as ServerSession;
    if (!data?.user) return null;
    return data;
  } catch {
    return null;
  }
}

// `null` on transport error — caller should fail open.
export async function getOnboardingState(): Promise<boolean | null> {
  const h = await headers();
  const cookie = h.get("cookie") ?? "";
  if (!cookie) return null;

  try {
    const res = await fetch(`${apiBaseUrl}/api/onboarding/status`, {
      headers: { cookie },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { data?: { attributes?: { onboarded_at?: string | null } } };
    return Boolean(data?.data?.attributes?.onboarded_at);
  } catch {
    return null;
  }
}
