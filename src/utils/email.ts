import { logger } from './logger.js';
import nodemailer from 'nodemailer';

type SendEmailOptions = {
  to: string;
  subject: string;
  html?: string;
  text?: string;
};

export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT
    ? Number(process.env.SMTP_PORT)
    : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  let from =
    process.env.SMTP_FROM ||
    process.env.SUPPORT_EMAIL ||
    `no-reply@${process.env.APP_DOMAIN || 'localhost'}`;

  // If using Gmail, prefer using the SMTP_USER as the from address to avoid
  // sender rewriting and auth issues. Also fix common placeholder values.
  if (host?.includes('gmail') && user) {
    const looksLikePlaceholder = /yourgmailaddress@gmail\.com/i.test(from);
    const containsUser = new RegExp(
      `<\s*${user.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\s*>|^\s*${user}\s*$`,
      'i',
    ).test(from);
    if (looksLikePlaceholder || !containsUser) {
      const display = process.env.APP_NAME || 'App';
      from = `${display} <${user}>`;
      logger.warn(
        { from },
        'Adjusted SMTP_FROM to match Gmail SMTP_USER to prevent rejections',
      );
    }
  }

  if (!host || !port || !user || !pass) {
    try {
      const testAccount = await nodemailer.createTestAccount();
      const etherealTransport = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      const info = await etherealTransport.sendMail({
        from,
        to,
        subject,
        text,
        html,
      });
      logger.warn(
        { to, subject },
        'SMTP not configured – using Ethereal test SMTP',
      );
      logger.info(
        { previewUrl: nodemailer.getTestMessageUrl(info) },
        'Ethereal preview URL',
      );
      return;
    } catch (e) {
      logger.warn(
        { to, subject, error: (e as Error).message },
        'Ethereal fallback failed; logging only',
      );
      logger.info({ to, subject, html, text }, 'Email content (DEV)');
      return;
    }
  }

  const secure = port === 465; // true for 465, false for other ports
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  try {
    const info = await transporter.sendMail({ from, to, subject, text, html });
    logger.info({ messageId: info.messageId }, 'SMTP email dispatched');
  } catch (err) {
    const e = err as any;
    const code = e?.code;
    const response: string | undefined = e?.response;
    const isGmail = host?.includes('gmail');

    if (code === 'EAUTH' && isGmail) {
      const gmailHintNeeded =
        /application-specific password required|invalidsecondfactor/i.test(
          response || '',
        );
      if (gmailHintNeeded) {
        logger.error(
          {
            code,
            responseCode: e?.responseCode,
            hint: 'Gmail requires a 16-character App Password when 2-Step Verification is enabled. Create one and use it as SMTP_PASS.',
            steps: [
              '1) Turn on 2-Step Verification: https://myaccount.google.com/security',
              '2) Create App Password (Mail > Other): https://myaccount.google.com/apppasswords',
              '3) Set SMTP_USER to your Gmail address and SMTP_PASS to the App Password',
              '4) Set SMTP_FROM to the same Gmail address (or leave blank to auto-match)',
            ],
          },
          'Gmail SMTP authentication failed (App Password required)'.trim(),
        );
      }
    }

    // Re-throw so upstream handlers can surface the error as needed
    throw err;
  }
}

export function extractFirstUrl(payload: unknown): string | undefined {
  try {
    const json = JSON.stringify(payload);
    const match = json.match(/https?:\/\/[^"\s]+/i);
    return match?.[0];
  } catch {
    return undefined;
  }
}
