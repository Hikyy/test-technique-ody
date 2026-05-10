import { createHash, randomBytes } from "node:crypto";
import { db } from "@ody/db/client";
import { invitations, restaurantMembers, restaurants, users } from "@ody/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { auth } from "../../../auth/auth.js";
import { provisioningContext } from "../../../auth/provisioning.js";
import { config } from "../../../config.js";
import { logger } from "../../../log.js";
import { renderInvitationEmail } from "../../../mailer/templates/invitation.js";
import { sendMail } from "../../../mailer/transport.js";

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type InvitationRole = "manager" | "staff";

export interface InvitationRow {
  id: string;
  restaurantId: string;
  email: string;
  role: "owner" | "manager" | "staff";
  expiresAt: Date;
  acceptedAt: Date | null;
  createdAt: Date;
  createdBy: string | null;
}

interface CreateInvitationResult {
  invitation: InvitationRow;
  plainToken: string;
  inviteUrl: string;
}

const sha256Hex = (input: string): string => createHash("sha256").update(input).digest("hex");

const buildInviteUrl = (token: string): string => {
  const base = config.WEB_URL.replace(/\/$/, "");

  return `${base}/accept-invite?token=${encodeURIComponent(token)}`;
};

interface DispatchInvitationInput {
  to: string;
  inviteUrl: string;
  role: "manager" | "staff";
  expiresAt: Date;
  restaurantName: string;
  inviterName?: string;
}

async function dispatchInvitationEmail(input: DispatchInvitationInput): Promise<void> {
  const { subject, html, text } = renderInvitationEmail({
    restaurantName: input.restaurantName,
    inviterName: input.inviterName,
    inviteUrl: input.inviteUrl,
    role: input.role,
    expiresAt: input.expiresAt,
  });

  try {
    await sendMail({ to: input.to, subject, html, text });
  } catch (err) {
    logger.warn({ err, to: input.to }, "invitation email transport failed — owner can copy the dev link manually");
  }
}

/**
 * Create or refresh an invitation. If a pending invite exists for the same
 * restaurant+email, its token is rotated rather than creating a duplicate.
 *
 * Returns the plain token exactly once — it is never persisted in cleartext.
 */
export async function createInvitation(
  restaurantId: string,
  email: string,
  role: InvitationRole,
  createdBy: string,
): Promise<CreateInvitationResult> {
  const plainToken = randomBytes(32).toString("base64url");
  const tokenHash = sha256Hex(plainToken);
  const expiresAt = new Date(Date.now() + INVITATION_TTL_MS);
  const normalizedEmail = email.trim().toLowerCase();

  const inviteRow = await db.transaction(async (tx) => {
    const existing = await tx
      .select()
      .from(invitations)
      .where(
        and(
          eq(invitations.restaurantId, restaurantId),
          eq(invitations.email, normalizedEmail),
          isNull(invitations.acceptedAt),
        ),
      )
      .limit(1);

    const previous = existing[0];

    if (previous) {
      const updated = await tx
        .update(invitations)
        .set({ tokenHash, expiresAt, role, createdBy })
        .where(eq(invitations.id, previous.id))
        .returning();
      const row = updated[0];

      if (!row) throw new Error("Failed to refresh invitation");

      return row;
    }

    const inserted = await tx
      .insert(invitations)
      .values({
        restaurantId,
        email: normalizedEmail,
        role,
        tokenHash,
        expiresAt,
        createdBy,
      })
      .returning();
    const row = inserted[0];

    if (!row) throw new Error("Failed to create invitation");

    return row;
  });

  const inviteUrl = buildInviteUrl(plainToken);

  const [restaurantRow] = await db
    .select({ name: restaurants.name })
    .from(restaurants)
    .where(eq(restaurants.id, restaurantId))
    .limit(1);
  const [inviter] = await db.select({ name: users.name }).from(users).where(eq(users.id, createdBy)).limit(1);

  await dispatchInvitationEmail({
    to: normalizedEmail,
    inviteUrl,
    role: role,
    expiresAt: (inviteRow as InvitationRow).expiresAt,
    restaurantName: restaurantRow?.name ?? "Sève",
    inviterName: inviter?.name,
  });

  return {
    invitation: inviteRow as InvitationRow,
    plainToken,
    inviteUrl,
  };
}

export async function listPendingInvitations(restaurantId: string): Promise<InvitationRow[]> {
  const rows = await db
    .select()
    .from(invitations)
    .where(and(eq(invitations.restaurantId, restaurantId), isNull(invitations.acceptedAt)));

  return rows as InvitationRow[];
}

export async function revokeInvitation(restaurantId: string, id: string): Promise<boolean> {
  const result = await db
    .delete(invitations)
    .where(and(eq(invitations.restaurantId, restaurantId), eq(invitations.id, id), isNull(invitations.acceptedAt)))
    .returning({ id: invitations.id });

  return result.length > 0;
}

export interface InvitationLookupResult {
  invitation: InvitationRow;
  restaurantName: string;
}

export async function findInvitationByPlainToken(token: string): Promise<InvitationLookupResult | null> {
  const tokenHash = sha256Hex(token);
  const rows = await db
    .select({
      invitation: invitations,
      restaurantName: restaurants.name,
    })
    .from(invitations)
    .innerJoin(restaurants, eq(restaurants.id, invitations.restaurantId))
    .where(eq(invitations.tokenHash, tokenHash))
    .limit(1);

  const row = rows[0];

  if (!row) return null;

  const inv = row.invitation as InvitationRow;

  if (inv.acceptedAt) return null;

  if (inv.expiresAt.getTime() < Date.now()) return null;

  return { invitation: inv, restaurantName: row.restaurantName };
}

export interface AcceptInvitationOutput {
  userId: string;
  restaurantId: string;
  // Better-auth's signUpEmail returns a token used by the bearer plugin; the
  // actual session cookie is set on the response from the controller layer.
  token: string | null;
}

/**
 * Accept an invitation: provisions a brand-new user (suppressing the default
 * "auto-create restaurant" hook) and attaches them to the inviting restaurant
 * with the invitation's role.
 */
export async function acceptInvitation(input: {
  token: string;
  name: string;
  password: string;
}): Promise<AcceptInvitationOutput | { error: "INVALID_TOKEN" | "EXPIRED" | "ALREADY_USED" | "EMAIL_TAKEN" }> {
  const lookup = await findInvitationByPlainToken(input.token);

  if (!lookup) {
    // Could be invalid, expired, or already accepted — coalesce to a single
    // public error to avoid leaking which.
    return { error: "INVALID_TOKEN" };
  }

  const { invitation } = lookup;

  // Suppress the auth hook's auto-restaurant provisioning: the new user joins
  // an existing tenant via this invite.
  const signUpResult = await provisioningContext.run({ skipAutoRestaurant: true }, async () => {
    try {
      return await auth.api.signUpEmail({
        body: {
          email: invitation.email,
          name: input.name,
          password: input.password,
        },
      });
    } catch (err) {
      logger.error({ err }, "invitation: signUpEmail failed");

      return null;
    }
  });

  if (!signUpResult) {
    return { error: "EMAIL_TAKEN" };
  }

  const newUserId = signUpResult.user?.id;

  if (!newUserId) {
    return { error: "EMAIL_TAKEN" };
  }

  // Tie the user to the inviting restaurant + mark the invitation accepted.
  await db.transaction(async (tx) => {
    await tx
      .insert(restaurantMembers)
      .values({
        restaurantId: invitation.restaurantId,
        userId: newUserId,
        role: invitation.role,
      })
      .onConflictDoNothing({
        target: [restaurantMembers.restaurantId, restaurantMembers.userId],
      });

    await tx.update(invitations).set({ acceptedAt: new Date() }).where(eq(invitations.id, invitation.id));
  });

  return {
    userId: newUserId,
    restaurantId: invitation.restaurantId,
    token: signUpResult.token ?? null,
  };
}

// Re-exported for unit tests / introspection.
export const _internals = { sha256Hex, buildInviteUrl };
