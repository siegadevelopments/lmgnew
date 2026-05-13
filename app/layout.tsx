// Triggering fresh build - 2026-05-13 v1.0.9
import { Providers } from "./Providers";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";
import { MarketingScripts } from "@/components/MarketingScripts";
import { MessengerBubble } from "@/components/chat/GlobalChat";
import { GlobalPopup } from "@/components/GlobalPopup";
import { AppInstallPopup } from "@/components/AppInstallPopup";
import { CacheBuster } from "@/components/CacheBuster";
import { Inter } from 'next/font/google';
import type { Metadata, Viewport } from 'next';

const inter = Inter({ subsets: ['latin'] });

const SITE_URL = 'https://www.lifestylemedicinegateway.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Lifestyle Medicine Gateway — Wellness Marketplace & Health Resources',
    template: '%s | Lifestyle Medicine Gateway',
  },
  description: 'Discover wellness products, professional health services, evidence-based articles, healthy recipes, and natural remedies. Your trusted gateway to lifestyle medicine.',
  keywords: [
    'lifestyle medicine', 'wellness marketplace', 'health products', 'natural remedies',
    'healthy recipes', 'wellness services', 'holistic health', 'evidence-based medicine',
    'supplements', 'organic products', 'health articles', 'wellness tips',
  ],
  authors: [{ name: 'Lifestyle Medicine Gateway' }],
  creator: 'Lifestyle Medicine Gateway',
  publisher: 'Lifestyle Medicine Gateway',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_AU',
    url: SITE_URL,
    siteName: 'Lifestyle Medicine Gateway',
    title: 'Lifestyle Medicine Gateway — Wellness Marketplace & Health Resources',
    description: 'Discover wellness products, professional health services, evidence-based articles, healthy recipes, and natural remedies.',
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Lifestyle Medicine Gateway',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lifestyle Medicine Gateway',
    description: 'Discover wellness products, professional health services, evidence-based articles, healthy recipes, and natural remedies.',
    images: [`${SITE_URL}/og-image.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  category: 'health',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  console.log("LMG RootLayout v1.0.7 Loaded");
  return (
    <html lang="en" className={inter.className}>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.getRegistrations().then(function(registrations) {
                for(let registration of registrations) {
                  registration.unregister();
                  console.log('Unregistered stale service worker');
                }
              });
            }
          `
        }} />
      </head>
      <body>
        <Providers>
          <CacheBuster />
          <div className="flex flex-col min-h-screen bg-background text-foreground">
            <MarketingScripts />

            <Header />
            <main className="flex-grow relative">
              {children}
            </main>
            <Footer />
            <BackToTop />
            <MessengerBubble />
            <GlobalPopup />
            <AppInstallPopup />
          </div>
        </Providers>
      </body>
    </html>
  );
}
