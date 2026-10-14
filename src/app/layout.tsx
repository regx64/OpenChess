import type { Metadata, Viewport } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Noto_Sans_KR, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/layout/footer";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme/theme-provider";
import ErrorBoundary from "@/components/ErrorBoundary";
import { MobileNav, SiteHeader } from "@/components/layout/SiteHeader";
import PwaRegister from "@/components/pwa/PwaRegister";

const notoSansKR = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false, // 모노스페이스 폰트는 필요할 때만 로드
});

export const metadata: Metadata = {
  title: {
    default: "OpenChess",
    template: "%s | OpenChess",
  },
  description:
    "3,177개 체스 오프닝을 찾고, 익히고, 내 것으로 만드는 오프닝 학습 앱",
  keywords: ["chess", "openings", "체스", "오프닝", "레퍼토리", "트레이너"],
  applicationName: "OpenChess",
  appleWebApp: {
    capable: true,
    title: "OpenChess",
    statusBarStyle: "black-translucent",
  },
  icons: { apple: "/icons/apple-touch-icon.png" },
  authors: [{ name: "OpenChess Team" }],
  creator: "OpenChess Team",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://openchess.vercel.app",
    title: "OpenChess",
    description:
      "3,177개 체스 오프닝을 찾고, 익히고, 내 것으로 만드는 오프닝 학습 앱",
    siteName: "OpenChess",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#111111" },
  ],
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`${notoSansKR.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            disableTransitionOnChange
          >
            <SiteHeader />
            {/* 모바일 하단 탭 바에 가리지 않도록 아래 여백 */}
            <div className="pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0">
              <main className="min-h-[calc(100dvh-3rem)] lg:min-h-[calc(100dvh-3.5rem)]">
                {children}
              </main>
              <Footer />
            </div>
            <MobileNav />
            <Toaster />
            <PwaRegister />
          </ThemeProvider>
        </ErrorBoundary>
        <SpeedInsights />
      </body>
    </html>
  );
}
