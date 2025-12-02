type VerificationEmailParams = {
  appName: string;
  verifyUrl: string;
  supportEmail?: string;
};

export function buildVerificationEmail({
  appName,
  verifyUrl,
  supportEmail,
}: VerificationEmailParams) {
  const subject = `Verify your ${appName} account`;
  const text = `Welcome to ${appName}!

Please verify your email address by opening the link below:
${verifyUrl}

If you didn’t create this account, you can ignore this email.
${supportEmail ? `\nNeed help? Contact us: ${supportEmail}` : ''}`;

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${subject}</title>
    <style>
      body { margin:0; padding:0; background:#f6f7f9; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, "Apple Color Emoji", "Segoe UI Emoji"; }
      .container { max-width:560px; margin:0 auto; padding:24px; }
      .card { background:#ffffff; border-radius:12px; box-shadow:0 1px 3px rgba(0,0,0,0.06); padding:32px; }
      .brand { font-weight:700; font-size:20px; color:#111827; }
      .title { font-size:18px; font-weight:600; color:#111827; margin:20px 0 8px; }
      .muted { color:#6b7280; line-height:1.6; }
      .button { display:inline-block; margin:24px 0; background:#111827; color:#ffffff !important; text-decoration:none; padding:12px 18px; border-radius:10px; font-weight:600; }
      .link { word-break:break-all; color:#2563eb; text-decoration:underline; }
      .footer { margin-top:24px; font-size:12px; color:#6b7280; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="card">
        <div class="brand">${appName}</div>
        <div class="title">Confirm your email</div>
        <p class="muted">Thanks for signing up. Please confirm that <strong>this email address is yours</strong> to activate your account.</p>
        <p>
          <a class="button" href="${verifyUrl}" target="_blank" rel="noopener noreferrer">Verify email</a>
        </p>
        <p class="muted">If the button doesn’t work, copy and paste this link into your browser:</p>
        <p><a class="link" href="${verifyUrl}" target="_blank" rel="noopener noreferrer">${verifyUrl}</a></p>
        <div class="footer">
          <p>If you didn’t request this, you can safely ignore this email.</p>
          ${supportEmail ? `<p>Need help? Contact us at ${supportEmail}</p>` : ''}
        </div>
      </div>
    </div>
  </body>
</html>`;

  return { subject, text, html };
}
