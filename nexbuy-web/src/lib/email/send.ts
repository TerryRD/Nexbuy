import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { Resend } from "resend";
import { getServerEnv } from "@/lib/env";

export interface SendEmailInput {
  to: string[];
  cc?: string[];
  subject: string;
  text: string;
  html?: string;
  /** 留空用 EMAIL_FROM (Resend) / SMTP_USER (SMTP) 當 from */
  from?: string;
}

export interface SendEmailResult {
  id: string;
}

const SENDER_NAME = "精鋐眼鏡行";

let cachedTransport: Transporter | null = null;
let cachedResend: Resend | null = null;

function getResend(): Resend | null {
  const { RESEND_API_KEY } = getServerEnv();
  if (!RESEND_API_KEY) return null;
  if (!cachedResend) cachedResend = new Resend(RESEND_API_KEY);
  return cachedResend;
}

function getSmtp(): Transporter | null {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = getServerEnv();
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  if (!cachedTransport) {
    cachedTransport = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }
  return cachedTransport;
}

/**
 * 是否已設定 email — Resend 或 SMTP 任一即可。
 */
export function isEmailConfigured(): boolean {
  const { RESEND_API_KEY, SMTP_HOST, SMTP_USER, SMTP_PASS } = getServerEnv();
  if (RESEND_API_KEY) return true;
  return Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);
}

function resolveFrom(explicit: string | undefined): string {
  if (explicit) return explicit;
  const { EMAIL_FROM, SMTP_USER } = getServerEnv();
  if (EMAIL_FROM) return EMAIL_FROM;
  // SMTP 模式 fallback：用 SMTP_USER。Resend 未設 EMAIL_FROM 時這裡也會
  // 落到 SMTP_USER（Resend 會拒絕未驗證 domain，但這是設定問題）。
  return SMTP_USER ? `${SENDER_NAME} <${SMTP_USER}>` : SENDER_NAME;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const from = resolveFrom(input.from);

  // Resend 優先
  const resend = getResend();
  if (resend) {
    const { data, error } = await resend.emails.send({
      from,
      to: input.to,
      cc: input.cc,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
    if (error) {
      throw new Error(`[email] Resend 寄信失敗：${error.message}`);
    }
    return { id: data?.id ?? "" };
  }

  // SMTP fallback
  const transport = getSmtp();
  if (!transport) {
    throw new Error(
      "[email] 缺少 RESEND_API_KEY 或 SMTP 設定，無法寄信",
    );
  }

  const info = await transport.sendMail({
    from,
    to: input.to.join(", "),
    cc: input.cc && input.cc.length > 0 ? input.cc.join(", ") : undefined,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });

  return { id: info.messageId };
}

export function parseEmailList(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}
