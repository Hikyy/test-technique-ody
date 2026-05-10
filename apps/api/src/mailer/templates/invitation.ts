import { renderLayout } from "./layout.js";

export interface InvitationTemplateInput {
  restaurantName: string;
  inviterName?: string;
  inviteUrl: string;
  role: "manager" | "staff";
  expiresAt: Date;
}

const ROLE_LABEL: Record<"manager" | "staff", string> = {
  manager: "Manager",
  staff: "Service",
};

const DATE_FMT = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

export function renderInvitationEmail(input: InvitationTemplateInput): {
  subject: string;
  html: string;
  text: string;
} {
  const { restaurantName, inviterName, inviteUrl, role, expiresAt } = input;
  const roleLabel = ROLE_LABEL[role];
  const expires = DATE_FMT.format(expiresAt);
  const subject = `Vous avez été invité à rejoindre ${restaurantName}`;
  const inviter = inviterName ? `${inviterName} ` : "";

  const text = [
    `Bonjour,`,
    ``,
    `${inviter}vous invite à rejoindre l'équipe de ${restaurantName} sur Sève en tant que ${roleLabel}.`,
    ``,
    `Acceptez l'invitation en suivant ce lien :`,
    inviteUrl,
    ``,
    `Ce lien expire le ${expires}.`,
    ``,
    `À bientôt,`,
    `L'équipe Sève`,
  ].join("\n");

  const body = `
    <h1 style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:30px;color:#5b6e4f;margin:0 0 8px;">Vous avez été invité.</h1>
    <p style="font-size:14.5px;line-height:1.55;color:rgba(21,20,15,0.78);margin:0 0 18px;">
      ${inviterName ? `<strong>${inviterName}</strong> vous invite` : "Vous êtes invité"} à rejoindre l'équipe de
      <strong>${restaurantName}</strong> sur Sève en tant que <strong>${roleLabel}</strong>.
    </p>
    <p style="margin:24px 0;">
      <a href="${inviteUrl}"
        style="display:inline-block;background:#15140f;color:#fbfaf6;text-decoration:none;padding:12px 22px;border-radius:8px;font-size:13.5px;font-weight:500;">
        Accepter l'invitation
      </a>
    </p>
    <p style="font-size:12.5px;color:rgba(21,20,15,0.55);margin:14px 0 0;">
      Ou copiez ce lien dans votre navigateur :<br />
      <span style="font-family:ui-monospace,Menlo,monospace;font-size:11.5px;color:rgba(21,20,15,0.65);word-break:break-all;">${inviteUrl}</span>
    </p>
    <p style="font-size:12px;color:rgba(21,20,15,0.42);margin:18px 0 0;">
      Ce lien expire le <strong>${expires}</strong>.
    </p>
  `;

  return {
    subject,
    text,
    html: renderLayout({ title: subject, preheader: `Rejoignez ${restaurantName} sur Sève.`, body }),
  };
}
