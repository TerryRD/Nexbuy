import "server-only";
import { getServerEnv } from "@/lib/env";

export interface SendEmailInput {
  to: string[];
  cc?: string[];
  subject: string;
  text: string;
  /** 留空用 Resend 測試寄件人；上線前要改成驗證過的網域 */
  from?: string;
}

export interface SendEmailResult {
  id: string;
}

const RESEND_API_URL = "https://api.resend.com/emails";
const DEFAULT_FROM = "精鋐眼鏡行 <onboarding@resend.dev>";

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const { RESEND_API_KEY } = getServerEnv();
  if (!RESEND_API_KEY) {
    throw new Error("[email] 缺少 RESEND_API_KEY，無法寄信");
  }

  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: input.from ?? DEFAULT_FROM,
      to: input.to,
      cc: input.cc && input.cc.length > 0 ? input.cc : undefined,
      subject: input.subject,
      text: input.text,
    }),
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = (await res.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      // 忽略 JSON parse 失敗，保留 statusText
    }
    throw new Error(`[email] Resend 回應錯誤 (${res.status}): ${message}`);
  }

  const body = (await res.json()) as { id?: string };
  return { id: body.id ?? "unknown" };
}

export function parseEmailList(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}
