import { getAuthEnv } from "../env.js";
import { passwordResetCodeEmail, resetPasswordEmail, verificationCodeEmail, verificationEmail, type EmailTemplate } from "./templates.js";

type SendEmailInput = EmailTemplate & {
  to: string;
};

type Fetcher = typeof fetch;

function assertEmailConfigured() {
  const env = getAuthEnv();
  if (!env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is required to send Passway authentication emails.");
  }
  return env;
}

export async function sendResendEmail(input: SendEmailInput, fetcher: Fetcher = fetch) {
  const env = assertEmailConfigured();
  const response = await fetcher("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.RESEND_FROM_EMAIL,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend email delivery failed with status ${response.status}.`);
  }
}

function deliver(input: SendEmailInput) {
  const delivery = sendResendEmail(input);
  if (process.env.NODE_ENV === "development") return delivery;
  delivery.catch(() => undefined);
  return undefined;
}

export function sendVerificationCodeEmail(to: string, code: string) {
  return deliver({ to, ...verificationCodeEmail(code) });
}

export function sendPasswordResetCodeEmail(to: string, code: string) {
  return deliver({ to, ...passwordResetCodeEmail(code) });
}

export function sendVerificationEmail(to: string, url: string) {
  return deliver({ to, ...verificationEmail(url) });
}

export function sendResetPasswordEmail(to: string, url: string) {
  return deliver({ to, ...resetPasswordEmail(url) });
}