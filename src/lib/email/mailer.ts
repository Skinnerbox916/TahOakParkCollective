import nodemailer, { type Transporter } from "nodemailer";
import { appName } from "@/lib/site";

export interface Mail {
  to: string;
  subject: string;
  text: string;
  html: string;
}

let transport: Transporter | null = null;

function smtpTransport(): Transporter | null {
  if (!process.env.SMTP_HOST) return null;
  if (!transport) {
    const port = Number(process.env.SMTP_PORT || 465);
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
    });
  }
  return transport;
}

/**
 * Mail "sent" without SMTP (dev and tests). Tests read codes from here; it's
 * never filled in production, where missing SMTP is an error instead.
 */
export const consoleOutbox: Mail[] = [];

/** Send an email. Returns false (and logs why) if it couldn't be sent. */
export async function sendMail(mail: Mail): Promise<boolean> {
  const smtp = smtpTransport();

  if (!smtp) {
    if (process.env.NODE_ENV === "production") {
      console.error(`[mail] SMTP_HOST is not set; could not send "${mail.subject}"`);
      return false;
    }
    consoleOutbox.push(mail);
    if (consoleOutbox.length > 50) consoleOutbox.shift();
    console.info(`[mail] (console) To: ${mail.to}\nSubject: ${mail.subject}\n\n${mail.text}\n`);
    return true;
  }

  try {
    await smtp.sendMail({
      from: process.env.EMAIL_FROM || `"${appName()}" <${process.env.SMTP_USER}>`,
      replyTo: process.env.EMAIL_REPLY_TO || undefined,
      ...mail,
    });
    return true;
  } catch (error) {
    console.error(`[mail] Sending "${mail.subject}" failed:`, error);
    return false;
  }
}
