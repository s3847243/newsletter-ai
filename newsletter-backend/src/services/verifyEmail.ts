export function buildVerifyEmailHtml(opts: { verifyUrl: string }) {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>Verify your email</h2>
      <p>Click the button below to verify your email address.</p>
      <p>
        <a href="${opts.verifyUrl}"
           style="display:inline-block;padding:10px 14px;border-radius:8px;background:#4f46e5;color:#fff;text-decoration:none;">
          Verify email
        </a>
      </p>
      <p>If you didn’t create an account, you can ignore this email.</p>
    </div>
  `;
}
