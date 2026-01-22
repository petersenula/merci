// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import { TranslationProvider } from "@/lib/translation";
import PushManager from "@/components/PushManager";
import MainWrapper from "@/components/MainWrapper";

import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Click4Tip",
  description: "Digital tipping made simple",

  manifest: "/manifest.json",

  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

// ✅ themeColor ТОЛЬКО ЗДЕСЬ
export const viewport: Viewport = {
  themeColor: "#22c55e",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>

          <TranslationProvider>
            <ServiceWorkerRegister />
            <PushManager />

          <Header />

          <MainWrapper>
            {children}
          </MainWrapper>

          </TranslationProvider>

      </body>
    </html>
  );
}
