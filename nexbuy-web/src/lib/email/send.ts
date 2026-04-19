// Thin wrapper around Resend. Fire-and-forget from API routes / actions so
// a Resend outage doesn't fail the underlying database operation.
//
// If RESEND_API_KEY === "dummy" (local dev / preview without Resend setup),
// we log to console instead of sending. This keeps the booking / order
// flows functional end-to-end without forcing every developer to wire up
// a real Resend account.

import { Resend } from "resend";
import { getServerEnv } from "@/lib/env";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

let cachedClient: Resend | null = null;
function getClient(): Resend | null {
  const env = getServerEnv();
  if (env.RESEND_API_KEY === "dummy" || !env.RESEND_API_KEY.startsWith("re_")) {
    return null;
  }
  if (!cachedClient) cachedClient = new Resend(env.RESEND_API_KEY);
  return cachedClient;
}

/**
 * Send an email. Errors are logged but never thrown — callers should not
 * await / depend on email success for their flow's correctness.
 */
export async function sendEmail(msg: EmailMessage): Promise<void> {
  const env = getServerEnv();
  const client = getClient();

  if (!client) {
    console.log(
      `[email/dummy] would send to=${msg.to} subject="${msg.subject}"`,
    );
    return;
  }

  try {
    const { error } = await client.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to: msg.to,
      subject: msg.subject,
      html: msg.html,
      text: msg.text,
    });
    if (error) {
      console.error(`[email] resend error to=${msg.to}:`, error);
    }
  } catch (err) {
    console.error(`[email] unexpected error to=${msg.to}:`, err);
  }
}
