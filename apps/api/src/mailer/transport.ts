import nodemailer, { type Transporter } from "nodemailer";
import { config } from "../config.js";
import { logger } from "../log.js";

let transporter: Transporter | null = null;

export function getTransporter(): Transporter {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: config.MAIL_HOST,
    port: config.MAIL_PORT,
    secure: config.MAIL_SECURE,
    auth: config.MAIL_USER ? { user: config.MAIL_USER, pass: config.MAIL_PASS ?? "" } : undefined,
  });

  return transporter;
}

export interface MailEnvelope {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendMail(envelope: MailEnvelope): Promise<void> {
  try {
    const info = await getTransporter().sendMail({
      from: config.MAIL_FROM,
      to: envelope.to,
      subject: envelope.subject,
      html: envelope.html,
      text: envelope.text,
    });

    logger.info({ to: envelope.to, subject: envelope.subject, messageId: info.messageId }, "mail sent");
  } catch (err) {
    logger.error({ err, to: envelope.to, subject: envelope.subject }, "mail send failed");
    throw err;
  }
}
