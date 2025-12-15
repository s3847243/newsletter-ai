import nodemailer from "nodemailer";
import { env } from "../config/env";

export interface TransactionalEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class TransactionalEmailService {
  private transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: Number(env.smtpPort),
    secure: env.smtpSecure === "true",
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
  });

  async send(options: TransactionalEmailOptions) {
    if (!options.to) {
      console.log("[TransactionalEmail] No recipient, skipping send.");
      return;
    }

    const info = await this.transporter.sendMail({
      from: env.smtpFrom,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    console.log("[TransactionalEmail] Sent:", info.messageId);
  }
}

export const TransactionalEmail = new TransactionalEmailService();
