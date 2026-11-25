import { logger } from "@/server/logger";
import {
  authBaseUrl,
  isEmailServiceConfigured,
} from "@/server/auth/config";

type SendResult =
  | { sent: true }
  | { sent: false; reason: "EMAIL_NOT_CONFIGURED" | "SEND_FAILED" };

export async function sendAuthEmail(
  to: string,
  subject: string,
  html: string,
): Promise<SendResult> {
  if (!isEmailServiceConfigured()) {
    logger.warn("Auth email skipped — RESEND_API_KEY or AUTH_EMAIL_FROM missing", {
      to,
      subject,
    });
    return { sent: false, reason: "EMAIL_NOT_CONFIGURED" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.AUTH_EMAIL_FROM,
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      logger.error("Resend API error", { status: response.status });
      return { sent: false, reason: "SEND_FAILED" };
    }

    return { sent: true };
  } catch (error) {
    logger.error("Failed to send auth email", { error: String(error) });
    return { sent: false, reason: "SEND_FAILED" };
  }
}

export function verificationEmailHtml(token: string, email: string): string {
  const link = `${authBaseUrl()}/api/auth/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
  return `<p>Verify your DARKBYTE account:</p><p><a href="${link}">${link}</a></p>`;
}

export function resetPasswordEmailHtml(token: string): string {
  const link = `${authBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  return `<p>Reset your DARKBYTE password:</p><p><a href="${link}">${link}</a></p>`;
}