"use client";

import {
  type CreateInvitationDTO,
  type InvitationRole,
  useCreateInvitation,
  useInvitations,
  useRevokeInvitation,
} from "@ody/sdk";
import { Button, FormField } from "@ody/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

const DATE_FMT = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

export function InvitationsSection() {
  const tInvitations = useTranslations("invitations");
  const tCommon = useTranslations("common");

  const list = useInvitations();
  const create = useCreateInvitation();
  const revoke = useRevokeInvitation();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InvitationRole>("staff");
  const [lastLink, setLastLink] = useState<string | null>(null);

  const items = list.data?.items ?? [];
  const pending = items.filter((i) => !i.attributes.accepted_at);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = email.trim();
    if (!trimmed) return;

    const payload: CreateInvitationDTO = { email: trimmed, role };

    create.mutate(payload, {
      onSuccess: (created) => {
        toast.success(tInvitations("sent"));
        setEmail("");
        if (created.attributes.invite_url) setLastLink(created.attributes.invite_url);
      },
      onError: (err) => toast.error(err.message),
    });
  };

  const handleRevoke = (id: string) => {
    if (!window.confirm(tInvitations("confirmRevoke"))) return;

    revoke.mutate(
      { id },
      {
        onSuccess: () => toast.success(tInvitations("revoked")),
        onError: (err) => toast.error(err.message),
      },
    );
  };

  return (
    <section className="rounded-card border border-line bg-surface px-7 py-6">
      <header className="mb-4">
        <h2 className="font-serif text-[22px] italic text-ink">{tInvitations("title")}</h2>
        <p className="mt-1 text-[12px] text-ink-2">{tInvitations("subtitle")}</p>
      </header>

      <form onSubmit={handleSubmit} className="grid grid-cols-[1fr_180px_auto] items-end gap-3">
        <FormField
          label={tInvitations("email")}
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-medium uppercase tracking-[0.04em] text-ink-2" htmlFor="invite-role">
            {tInvitations("role")}
          </label>
          <select
            id="invite-role"
            value={role}
            onChange={(e) => setRole(e.currentTarget.value as InvitationRole)}
            className="h-10 rounded-[8px] border border-line-mid bg-surface px-3 font-sans text-[13.5px] text-ink focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
          >
            <option value="staff">{tInvitations("roleStaff")}</option>
            <option value="manager">{tInvitations("roleManager")}</option>
          </select>
        </div>

        <Button type="submit" variant="ink" disabled={!email.trim() || create.isPending}>
          {create.isPending ? tInvitations("sending") : tInvitations("invite")}
        </Button>
      </form>

      {lastLink ? (
        <div className="mt-4 flex items-center gap-3 rounded-card border border-dashed border-line-mid bg-bg/50 p-4">
          <div className="min-w-0 flex-1">
            <div className="text-[11px] uppercase tracking-[0.04em] text-ink-3">{tInvitations("devLinkLabel")}</div>
            <div className="mt-1 truncate font-mono text-[12px] text-ink-2">{lastLink}</div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              void navigator.clipboard.writeText(lastLink);
              toast.success(tCommon("saved"));
            }}
          >
            {tCommon("save")}
          </Button>
        </div>
      ) : null}

      <div className="mt-6">
        <h3 className="mb-2 text-[12px] font-medium uppercase tracking-[0.04em] text-ink-2">
          {tInvitations("pending")}
        </h3>

        {list.isLoading ? (
          <p className="text-[13px] text-ink-3">{tCommon("loading")}</p>
        ) : pending.length === 0 ? (
          <p className="text-[13px] text-ink-3">{tInvitations("pendingEmpty")}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {pending.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] text-ink">{inv.attributes.email}</div>
                  <div className="mt-0.5 font-mono text-[11px] text-ink-3">
                    {inv.attributes.role === "manager" ? tInvitations("roleManager") : tInvitations("roleStaff")} ·{" "}
                    {tInvitations("expiresAt", { date: DATE_FMT.format(new Date(inv.attributes.expires_at)) })}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleRevoke(inv.id)}
                  disabled={revoke.isPending}
                >
                  {tInvitations("revoke")}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
