import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { ThemeProvider } from "@/components/site/ThemeProvider";
import { CompareBar } from "@/components/site/CompareBar";
import { CartSync } from "@/components/site/CartSync";
import { publicEnv } from "@/lib/env";
import "./globals.css";

// 三個字型都加 display:swap：
// - Geist 預設 'auto'，瀏覽器會走「block period」三秒看不到字（FOIT）。
//   swap 改成立刻顯示 fallback、字型載完才換，CLS 略增但 LCP 大幅改善。
// - 中文字 Tailwind --font-sans / --font-heading 會 fallback 到系統字型，
//   所以 swap 期間使用者看到的是 PingFang TC 等系統字（很正常）。
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700"],
});

const SITE_NAME = "精鋐眼鏡行";
const SITE_DESCRIPTION =
  "精鋐眼鏡行：成品眼鏡線上直接購買，處方鏡架線上預約到店驗光配鏡。慢工細活、實體店家親手服務。";

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.NEXT_PUBLIC_APP_URL),
  title: {
    default: `${SITE_NAME} — 在家挑框，到店配鏡`,
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ["眼鏡", "驗光", "處方眼鏡", "太陽眼鏡", "眼鏡行", "精鋐眼鏡行"],
  authors: [{ name: SITE_NAME }],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "zh_TW",
    url: "/",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — 在家挑框，到店配鏡`,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — 在家挑框，到店配鏡`,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  formatDetection: {
    telephone: false,
  },
  // GSC 驗證：env 沒設 → 不渲染 meta；設了 → Next.js 自動產
  // <meta name="google-site-verification" content="...">
  ...(publicEnv.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? {
        verification: {
          google: publicEnv.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
        },
      }
    : {}),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-TW"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <CompareBar />
          <CartSync />
        </ThemeProvider>
      </body>
    </html>
  );
}
