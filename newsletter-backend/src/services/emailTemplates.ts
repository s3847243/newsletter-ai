interface NewsletterEmailTemplateParams {
  creatorName: string;
  issueTitle: string;
  intro?: string | null;
  readUrl: string;
  unsubscribeUrl: string;
}

export function buildNewsletterEmailHtml(params: NewsletterEmailTemplateParams): string {
  const { creatorName, issueTitle, intro, readUrl, unsubscribeUrl } = params;

  return `
  <html>
    <body style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #f7f7f7; padding: 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden;">
        <tr>
          <td style="padding: 24px;">
            <h1 style="font-size: 24px; margin: 0 0 8px 0;">${issueTitle}</h1>
            <p style="margin: 0 0 16px 0; color: #555;">by ${creatorName}</p>

            ${
              intro
                ? `<p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.5; color: #333;">${intro}</p>`
                : ""
            }

            <p style="margin: 0 0 24px 0; font-size: 14px; color: #555;">
              Click the button below to read this issue online.
            </p>

            <p style="margin: 0 0 24px 0;">
              <a href="${readUrl}" style="display: inline-block; padding: 12px 20px; background-color: #111827; color: #ffffff; text-decoration: none; border-radius: 9999px; font-size: 14px; font-weight: 600;">
                Read online
              </a>
            </p>

            <p style="margin: 0 0 8px 0; font-size: 12px; color: #999;">
              If the button doesn't work, copy and paste this link into your browser:
              <br />
              <a href="${readUrl}" style="color: #4b5563;">${readUrl}</a>
            </p>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />

            <p style="margin: 0; font-size: 12px; color: #9ca3af;">
              You are receiving this email because you subscribed to updates from ${creatorName}.
              <br />
              <a href="${unsubscribeUrl}" style="color: #6b7280;">Unsubscribe</a>
            </p>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
}
