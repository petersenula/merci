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
  title: {
    default: "Click4Tip – Trinkgeld digital & einfach sammeln",
    template: "%s – Click4Tip",
  },

  description:
    "Trinkgeld digital sammeln – für Einzelpersonen und Teams. Schnell startklar, keine Einrichtungskosten. " +
    "Disponible en français · Disponibile in italiano · Available in English.",

  applicationName: "Click4Tip",

  metadataBase: new URL("https://www.click4tip.ch"),

  alternates: {
    canonical: "https://www.click4tip.ch",
    languages: {
      "de-CH": "https://www.click4tip.ch",
      "fr-CH": "https://www.click4tip.ch",
      "it-CH": "https://www.click4tip.ch",
      "en-CH": "https://www.click4tip.ch",
    },
  },

  openGraph: {
    type: "website",
    url: "https://www.click4tip.ch",
    siteName: "Click4Tip",
    title: "Click4Tip – Trinkgeld digital & einfach sammeln",
    description:
      "Digitale Trinkgeldlösung für Einzelpersonen und Teams. " +
      "Disponible en français · Disponibile in italiano · Available in English.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Click4Tip – Trinkgeld digital sammeln",
      },
    ],
    locale: "de_CH",
  },

  twitter: {
    card: "summary_large_image",
    title: "Click4Tip – Trinkgeld digital sammeln",
    description:
      "Digitale Trinkgeldlösung für Einzelpersonen und Teams. FR · IT · EN verfügbar.",
    images: ["/og.png"],
  },

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

          <Header />

          <MainWrapper>
            {children}
          </MainWrapper>

          </TranslationProvider>

      </body>
    </html>
  );
}
