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

type OtpEmailParams = {
  appName: string;
  otp: string;
  type: 'sign-in' | 'email-verification' | 'forget-password';
  supportEmail?: string;
  expiresInSeconds?: number;
};

export function buildOtpEmail({
  appName,
  otp,
  type,
  supportEmail,
  expiresInSeconds = 60,
}: OtpEmailParams) {
  const purposeMap: Record<
    string,
    { title: string; lead: string; action: string }
  > = {
    'sign-in': {
      title: 'Your sign-in code',
      lead: 'Use this one-time passcode to finish signing in.',
      action: 'Sign in',
    },
    'email-verification': {
      title: 'Verify your email',
      lead: 'Enter this code to verify your email address and activate your account.',
      action: 'Verify email',
    },
    'forget-password': {
      title: 'Reset password code',
      lead: 'Enter this code to reset your password securely.',
      action: 'Reset password',
    },
  };
  const meta = purposeMap[type] || {
    title: 'Security Code',
    lead: 'This is your one-time passcode.',
    action: 'Proceed',
  };
  const subject = `${appName} • ${meta.title}`;
  const minutes = Math.max(1, Math.round(expiresInSeconds / 60));
  const text = `${meta.title} for ${appName}\n\n${meta.lead}\n\nOTP: ${otp}\nExpires in ${minutes} minute${minutes === 1 ? '' : 's'}.\nDo not share this code with anyone.\n${supportEmail ? `Need help? Contact us: ${supportEmail}` : ''}`;
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${subject}</title><style>body{margin:0;padding:0;background:#f6f7f9;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,Helvetica Neue,Arial} .container{max-width:560px;margin:0 auto;padding:24px} .card{background:#fff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.06);padding:32px} .brand{font-weight:700;font-size:20px;color:#111827} .title{font-size:18px;font-weight:600;color:#111827;margin:20px 0 4px} .muted{color:#6b7280;line-height:1.55} .otp{font-size:32px;letter-spacing:4px;font-weight:700;background:#111827;color:#fff;padding:12px 16px;border-radius:10px;display:inline-block;margin:16px 0} .footer{margin-top:24px;font-size:12px;color:#6b7280} .warn{color:#dc2626;font-size:12px;margin-top:8px}</style></head><body><div class="container"><div class="card"><div class="brand">${appName}</div><div class="title">${meta.title}</div><p class="muted">${meta.lead}</p><div class="otp" aria-label="One time passcode">${otp}</div><p class="muted">This code expires in <strong>${minutes} minute${minutes === 1 ? '' : 's'}</strong>. Do not share it with anyone.</p><p class="warn">If you did not request this code you can ignore this email.</p><div class="footer">${supportEmail ? `<p>Need help? Contact us at ${supportEmail}</p>` : ''}</div></div></div></body></html>`;
  return { subject, text, html };
}
