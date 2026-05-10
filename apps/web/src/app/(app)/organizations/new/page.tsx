"use client";

import { useCreateOrganization, useOrganizations, useSwitchOrganization, useSwitchRestaurant } from "@ody/sdk";
import { Button, FormField } from "@ody/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function NewOrganizationPage() {
  const router = useRouter();
  const t = useTranslations("organization");
  const tCommon = useTranslations("common");
  const orgs = useOrganizations();
  const create = useCreateOrganization();
  const setOrganization = useSwitchOrganization();
  const setRestaurant = useSwitchRestaurant();

  const ownsOrg = orgs.data?.items.some((o) => o.attributes.role === "owner") ?? false;

  useEffect(() => {
    if (ownsOrg) router.replace("/dashboard");
  }, [ownsOrg, router]);

  const [name, setName] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    create.mutate(
      { name: name.trim() },
      {
        onSuccess: (org) => {
          setOrganization(org.id);
          setRestaurant(null);
          toast.success(t("organizationCreated"));
          router.replace(`/organizations/${org.id}/restaurants/new`);
          router.refresh();
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <div>
        <Link href="/dashboard" className="text-[12.5px] text-ink-2 hover:text-ink">
          ← {tCommon("back")}
        </Link>
      </div>

      <header>
        <div className="text-[12px] uppercase tracking-[0.04em] text-ink-3">{t("eyebrow")}</div>
        <h1 className="mt-1.5 font-serif text-[36px] italic text-ink" style={{ letterSpacing: "-0.4px" }}>
          {t("newOrganization")}
        </h1>
      </header>

      <form onSubmit={onSubmit} className="flex flex-col gap-4 rounded-card border border-line bg-surface p-6">
        <FormField
          label={t("nameLabel")}
          required
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          autoFocus
        />
        <Button type="submit" variant="ink" disabled={!name.trim() || create.isPending}>
          {create.isPending ? t("creating") : t("create")}
        </Button>
      </form>
    </div>
  );
}
