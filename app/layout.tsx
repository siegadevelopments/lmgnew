import { Providers } from "./Providers";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";
import { MarketingScripts } from "@/components/MarketingScripts";
import { MessengerBubble } from "@/components/chat/GlobalChat";
import { GlobalPopup } from "@/components/GlobalPopup";
import { AppInstallPopup } from "@/components/AppInstallPopup";
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Lifestyle Medicine Gateway',
  description: 'Wellness Marketplace & Lifestyle Medicine Resources',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.className}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body>
        <Providers>
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
