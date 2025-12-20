// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import { TranslationProvider } from "@/lib/translation";
import PushManager from "@/components/PushManager";
import MainWrapper from "@/components/MainWrapper";

import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

// ⭐ Добавляем импорт LoadingProvider
import { LoadingProvider } from "@/context/LoadingContext";

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
  description: "Tip app",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>

        {/* ⬇️ Глобальный LoadingProvider */}
        <LoadingProvider>

          <TranslationProvider>
            <ServiceWorkerRegister />
            <PushManager />

          <Header />

          <MainWrapper>
            {children}
          </MainWrapper>

          </TranslationProvider>

        </LoadingProvider>
        {/* ⬆️ Оверлей теперь доступен в любой точке приложения */}

      </body>
    </html>
  );
}
