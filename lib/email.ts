import type { Resend } from "resend";

let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Resend: R } = require("resend") as typeof import("resend");
    _resend = new R(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const FROM = "DISPO Cleaner <noreply@outerjoin.co.za>";

export async function sendWelcomeEmail(
  email: string,
  name: string,
  tempPassword: string
): Promise<void> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dispo-cleaner.vercel.app";
  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: "Welcome to DISPO Cleaner",
    html: `
      <h2>Welcome, ${name}!</h2>
      <p>Your DISPO Cleaner account has been created.</p>
      <p><strong>Email:</strong> ${email}<br/>
      <strong>Temporary password:</strong> ${tempPassword}</p>
      <p>You'll be prompted to change your password on first login.</p>
      <p><a href="${siteUrl}/login">Log in now</a></p>
    `,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  tempPassword: string
): Promise<void> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dispo-cleaner.vercel.app";
  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: "DISPO Cleaner — Password Reset",
    html: `
      <h2>Password Reset</h2>
      <p>Hi ${name}, your password has been reset.</p>
      <p><strong>Temporary password:</strong> ${tempPassword}</p>
      <p>You'll be prompted to set a new password on your next login.</p>
      <p><a href="${siteUrl}/login">Log in now</a></p>
    `,
  });
}
