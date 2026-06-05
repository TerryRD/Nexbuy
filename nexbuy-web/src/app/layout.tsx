import type { Metadata } from "next";
import {
  Noto_Sans_TC,
  Noto_Serif_TC,
  Cormorant_Garamond,
  JetBrains_Mono,
} from "next/font/google";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { LineFab } from "@/components/site/LineFab";
import { ThemeProvider } from "@/components/site/ThemeProvider";
import { CompareBar } from "@/components/site/CompareBar";
import { CartSync } from "@/components/site/CartSync";
import { MobileNav } from "@/components/site/MobileNav";
import { publicEnv } from "@/lib/env";
import "./globals.css";

// 內文 / UI
const notoSansTC = Noto_Sans_TC({
  variable: "--font-noto-sans-tc",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

// 中文標題 / 商品名
const notoSerifTC = Noto_Serif_TC({
  variable: "--font-noto-serif-tc",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

// 英文 display（價格、斜體標語、編號）
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["italic", "normal"],
  display: "swap",
});

// 編號 / 規格 mm / eyebrow
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
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
      className={`${notoSansTC.variable} ${notoSerifTC.variable} ${cormorant.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Header />
          <main className="flex-1 pb-14 nav:pb-0">{children}</main>
          <Footer />
          <MobileNav />
          <CompareBar />
          <CartSync />
          <LineFab />
        </ThemeProvider>
      </body>
    </html>
  );
}
