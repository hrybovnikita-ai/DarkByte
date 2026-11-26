import { billingFromAddress } from "@/server/billing/email";
import { containsPrimaryAccountNumber } from "@/server/billing/card";
import { logger } from "@/server/logger";

export type DemoReceiptInput = {
  to: string;
  planName: string;
  amountCents: number;
  transactionId: string;
  paymentMethod: "visa" | "mastercard" | "google_pay" | "apple_pay";
  billingPeriodLabel: string;
  paidAt: Date;
};

const METHOD_LABELS: Record<DemoReceiptInput["paymentMethod"], string> = {
  visa: "Visa (demo)",
  mastercard: "Mastercard (demo)",
  google_pay: "Google Pay (demo)",
  apple_pay: "Apple Pay (demo)",
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char] ?? char
  ));
}

function money(cents: number) {
  return "$" + (cents / 100).toFixed(2);
}

export function renderDemoSubscriptionReceipt(input: DemoReceiptInput) {
  const when = input.paidAt.toISOString().replace("T", " ").replace(/\.\d{3}Z$/, " UTC");
  const subject = `[DEMO PAYMENT] DARKBYTE ${input.planName} subscription (simulated)`;
  const html = `<!doctype html>
<html>
  <body style="margin:0;background:#111;color:#f4f4f5;font-family:ui-monospace,Consolas,monospace;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#111;padding:24px 12px;">
      <tr><td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#1a1a1a;border:1px solid #3f3f46;border-radius:16px;padding:28px;">
          <tr><td>
            <p style="margin:0 0 4px;font-size:18px;font-weight:700;">DARKBYTE Billing</p>
            <p style="margin:0;color:#a1a1aa;font-size:14px;">Demo payment confirmation</p>
            <p style="margin:16px 0 0;"><span style="display:inline-block;background:#713f12;color:#fcd34d;border-radius:999px;padding:4px 10px;font-size:12px;font-weight:700;">DEMO MODE</span></p>
            <h1 style="margin:28px 0 8px;font-size:28px;">Payment successful!</h1>
            <p style="margin:0 0 20px;font-size:16px;line-height:1.5;">This was a demo simulation. Demo credits are isolated and do not unlock real paid benefits. Never enter real banking details in demo checkout.</p>
            <table role="presentation" width="100%" style="border-top:1px solid #3f3f46;border-bottom:1px solid #3f3f46;margin:8px 0 16px;">
              <tr><td style="padding:12px 0;color:#a1a1aa;">Payment status</td><td align="right" style="color:#4ade80;font-weight:700;">Successful</td></tr>
              <tr><td style="padding:12px 0;color:#a1a1aa;">Subscription</td><td align="right" style="font-weight:700;">${escapeHtml(input.planName)}</td></tr>
              <tr><td style="padding:12px 0;color:#a1a1aa;">Billing period</td><td align="right">${escapeHtml(input.billingPeriodLabel)}</td></tr>
              <tr><td style="padding:12px 0;color:#a1a1aa;">Amount (simulated)</td><td align="right">${escapeHtml(money(input.amountCents))} USD</td></tr>
              <tr><td style="padding:12px 0;color:#a1a1aa;">Transaction ID</td><td align="right">${escapeHtml(input.transactionId)}</td></tr>
              <tr><td style="padding:12px 0;color:#a1a1aa;">Date</td><td align="right">${escapeHtml(when)}</td></tr>
              <tr><td style="padding:12px 0;color:#a1a1aa;">Payment method</td><td align="right">${escapeHtml(METHOD_LABELS[input.paymentMethod])}</td></tr>
              <tr><td style="padding:12px 0;color:#a1a1aa;">Real money charged</td><td align="right">$0.00</td></tr>
            </table>
            <p style="margin:0;background:#09090b;border-radius:8px;padding:14px;color:#e4e4e7;">DEMO MODE — no card data was stored or transmitted to a payment processor.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
  if (containsPrimaryAccountNumber(subject) || containsPrimaryAccountNumber(html)) {
    throw new Error("RECEIPT_REDACTION_FAILED");
  }
  return { subject, html };
}

export async function sendDemoSubscriptionReceipt(input: DemoReceiptInput) {
  const from = billingFromAddress();
  if (!process.env.RESEND_API_KEY || !from) return { sent: false as const, reason: "EMAIL_NOT_CONFIGURED" as const };
  const { subject, html } = renderDemoSubscriptionReceipt(input);
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [input.to], subject, html }),
    });
    if (!response.ok) {
      logger.error("Demo billing receipt was rejected by the email provider", { status: response.status });
      return { sent: false as const, reason: "SEND_FAILED" as const };
    }
    return { sent: true as const };
  } catch (error) {
    logger.error("Demo billing receipt request failed", { error: error instanceof Error ? error.name : "Error" });
    return { sent: false as const, reason: "SEND_FAILED" as const };
  }
}