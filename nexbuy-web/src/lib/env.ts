import { z } from "zod";

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  // Email：兩條路任一即可。Resend 優先（有 API key 就走 Resend），沒設
  // 才走 SMTP。整組未設時 sendEmail 會 throw、呼叫端自行 warn + skip。
  RESEND_API_KEY: z.string().default(""),
  EMAIL_FROM: z.string().default(""),
  // 系統通知收件人（低庫存 digest 等）。逗號分隔多人。
  ADMIN_EMAIL: z.string().default(""),
  SMTP_HOST: z.string().default(""),
  SMTP_PORT: z.coerce.number().int().positive().default(465),
  SMTP_USER: z.string().default(""),
  SMTP_PASS: z.string().default(""),
  // IndexNow：8–128 字元 hex / a-f / 0-9。產一次後固定不要動，否則
  // /api/seo/indexnow-key 跟 ping payload 會對不起來、被搜尋引擎丟棄。
  // 沒設時所有 indexNow ping 變 no-op，不影響其他流程。
  INDEXNOW_KEY: z.string().default(""),
});

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.url(),
  // Google Search Console 驗證 token：你新增資源拿到的 content="..."。
  // 沒設就不渲染 meta tag。設了 deploy 後就能 verify。
  NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION: z.string().default(""),
});

// Public env：client-safe
export const publicEnv = publicSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION:
    process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? "",
});

// Server env：只在 server-side 檔案 import 這個
export function getServerEnv() {
  return serverSchema.parse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY ?? "",
    EMAIL_FROM: process.env.EMAIL_FROM ?? "",
    ADMIN_EMAIL: process.env.ADMIN_EMAIL ?? "",
    SMTP_HOST: process.env.SMTP_HOST ?? "",
    SMTP_PORT: process.env.SMTP_PORT ?? "465",
    SMTP_USER: process.env.SMTP_USER ?? "",
    SMTP_PASS: process.env.SMTP_PASS ?? "",
    INDEXNOW_KEY: process.env.INDEXNOW_KEY ?? "",
  });
}
