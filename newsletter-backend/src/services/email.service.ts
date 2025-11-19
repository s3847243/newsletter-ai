import fetch from "node-fetch";
import { env } from "../config/env";

export interface SendEmailOptions {
  to: string[];
  subject: string;
  html: string;
}

class EmailServiceClass {
  private apiKey = env.mailgunApiKey;
  private domain = env.mailgunDomain;
  private from = env.mailgunFromEmail;

  async send(options: SendEmailOptions) {
    if (!options.to.length) {
      console.log("[EmailService] No recipients, skipping send.");
      return;
    }

    const url = `https://api.mailgun.net/v3/${this.domain}/messages`;

    const formData = new URLSearchParams();
    formData.append("from", this.from);
    for (const recipient of options.to) {
      formData.append("to", recipient);
    }
    formData.append("subject", options.subject);
    formData.append("html", options.html);

    const auth = Buffer.from(`api:${this.apiKey}`).toString("base64");

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[EmailService] Mailgun error:", text);
      throw new Error(`Mailgun send failed: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    console.log("[EmailService] Sent:", data);
  }
}

export const EmailService = new EmailServiceClass();
