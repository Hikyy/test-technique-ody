import "dotenv/config";
import { renderInvitationEmail } from "../src/mailer/templates/invitation.js";
import { sendMail } from "../src/mailer/transport.js";

async function main(): Promise<void> {
  const url = "http://localhost:3000/accept-invite?token=test_dev_token_xxxxxxxxxxxxxxxxxxxxx";
  const { subject, html, text } = renderInvitationEmail({
    restaurantName: "Sève",
    inviterName: "Léa Martin",
    inviteUrl: url,
    role: "manager",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  await sendMail({ to: "test@seve.local", subject, html, text });

  console.log("✓ test mail sent — open http://localhost:8125 to view");
}

main().catch((err: unknown) => {
  console.error("✗ test mail failed:", err);
  process.exitCode = 1;
});
