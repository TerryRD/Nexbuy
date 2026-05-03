import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { getServerEnv } from "@/lib/env";

export interface SendEmailInput {
  to: string[];
  cc?: string[];
  subject: string;
  text: string;
  /** 留空用 SMTP_USER 當 from；Gmail 會強制 from 與 auth user 一致 */
  from?: string;
}

export interface SendEmailResult {
  id: string;
}

const SENDER_NAME = "精鋐眼鏡行";

let cachedTransport: Transporter | null = null;

function getTransport(): Transporter | null {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = getServerEnv();
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return null;
  }
  if (!cachedTransport) {
    cachedTransport = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465, // 465 = SSL；587 = STARTTLS
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }
  return cachedTransport;
}

/**
 * 是否已設定 SMTP — 呼叫端用來在 try 之前先 warn-skip。
 */
export function isEmailConfigured(): boolean {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = getServerEnv();
  return Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const transport = getTransport();
  if (!transport) {
    throw new Error("[email] 缺少 SMTP 設定 (SMTP_HOST / USER / PASS)，無法寄信");
  }

  const { SMTP_USER } = getServerEnv();
  const from = input.from ?? `${SENDER_NAME} <${SMTP_USER}>`;

  const info = await transport.sendMail({
    from,
    to: input.to.join(", "),
    cc: input.cc && input.cc.length > 0 ? input.cc.join(", ") : undefined,
    subject: input.subject,
    text: input.text,
  });

  return { id: info.messageId };
}

export function parseEmailList(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}
