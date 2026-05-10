"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type AcceptInvitationInput, acceptInvitationSchema } from "@ody/sdk";
import { Button, FormField } from "@ody/ui";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { apiBaseUrl } from "@/lib/api-client";
import { authClient } from "@/lib/auth-client";

interface InvitationPreview {
  email: string;
  role: "owner" | "manager" | "staff";
  restaurant_name: string;
  expires_at: string;
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={null}>
      <AcceptInviteForm />
    </Suspense>
  );
}

function AcceptInviteForm() {
  const tAuth = useTranslations("auth");
  const tErrors = useTranslations("errors");
  const router = useRouter();
  const sp = useSearchParams();
  const token = sp?.get("token") ?? "";

  const [preview, setPreview] = useState<InvitationPreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(true);

  const form = useForm<AcceptInvitationInput>({
    resolver: zodResolver(acceptInvitationSchema),
    defaultValues: { token, name: "", password: "" },
    mode: "onSubmit",
  });

  useEffect(() => {
    form.setValue("token", token);

    if (!token) {
      setPreviewError(tAuth("inviteInvalidBody"));
      setPreviewLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const session = await authClient.getSession();

        if (session.data?.user) {
          await authClient.signOut();
        }

        const r = await fetch(`${apiBaseUrl}/api/invitations/by-token/${encodeURIComponent(token)}`, {
          credentials: "include",
        });

        if (!r.ok) {
          if (!cancelled) setPreviewError(tAuth("inviteInvalidBody"));
          return;
        }

        const json = (await r.json()) as { data: { attributes: InvitationPreview } };

        if (!cancelled) setPreview(json.data.attributes);
      } catch {
        if (!cancelled) setPreviewError(tErrors("network"));
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, form, tAuth, tErrors]);

  const submitting = form.formState.isSubmitting;

  async function onSubmit(values: AcceptInvitationInput) {
    try {
      const r = await fetch(`${apiBaseUrl}/api/invitations/accept`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify(values),
      });

      if (r.status === 409) {
        toast.error(tAuth("inviteSignOutFirst"));
        return;
      }

      if (!r.ok) {
        toast.error(tAuth("inviteInvalidBody"));
        return;
      }

      toast.success(tAuth("inviteSuccess"));
      router.replace(`/login?email=${encodeURIComponent(preview?.email ?? "")}`);
      router.refresh();
    } catch {
      toast.error(tErrors("network"));
    }
  }

  const nameError = form.formState.errors.name ? tAuth("nameRequired") : undefined;
  const passwordError = form.formState.errors.password ? tAuth("passwordTooShort") : undefined;

  return (
    <main className="grid min-h-screen place-items-center bg-bg px-6">
      <div className="w-full max-w-[380px] rounded-card border border-line bg-surface p-8">
        <div className="mb-6 flex items-center gap-2.5">
          <div className="grid size-[26px] place-items-center rounded-[6px] bg-ink pb-0.5 font-serif text-[18px] italic leading-none text-bg">
            S
          </div>
          <div className="font-serif text-[19px] italic">Sève</div>
        </div>

        {previewLoading ? (
          <p className="text-[13px] text-ink-2">…</p>
        ) : previewError || !preview ? (
          <>
            <h1 className="font-serif text-[26px] italic text-ink">{tAuth("inviteInvalidTitle")}</h1>
            <p className="mt-2 text-[13px] text-ink-2">{previewError ?? tAuth("inviteInvalidBody")}</p>
            <Link href="/login" className="mt-6 inline-block text-[13px] text-accent hover:underline">
              {tAuth("signIn")}
            </Link>
          </>
        ) : (
          <>
            <h1 className="font-serif text-[26px] italic text-ink">{tAuth("acceptInviteTitle")}</h1>
            <p className="mt-1 text-[13px] text-ink-2">
              {tAuth("acceptInviteSubtitle", { restaurant: preview.restaurant_name })}
            </p>
            <p className="mt-3 font-mono text-[12px] text-ink-3">{preview.email}</p>

            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4" noValidate>
              <FormField
                label={tAuth("name")}
                type="text"
                autoComplete="name"
                error={nameError}
                {...form.register("name")}
              />
              <FormField
                label={tAuth("password")}
                type="password"
                autoComplete="new-password"
                error={passwordError}
                {...form.register("password")}
              />
              <input type="hidden" {...form.register("token")} />
              <Button type="submit" disabled={submitting} className="mt-2 w-full">
                {submitting ? tAuth("accepting") : tAuth("acceptInvite")}
              </Button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
