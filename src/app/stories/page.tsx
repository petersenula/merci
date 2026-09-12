import type { Metadata } from "next";
import StoriesIndex from "./StoriesIndex";

export const metadata: Metadata = {
  title: "Stories about tipping",
  description:
    "Stories, ideas and practical guides about tipping, digital tipping and how the way we say thank you is changing.",
  alternates: {
    canonical: "https://www.click4tip.ch/stories",
    languages: {
      en: "https://www.click4tip.ch/stories",
      de: "https://www.click4tip.ch/stories/de",
      fr: "https://www.click4tip.ch/stories/fr",
      it: "https://www.click4tip.ch/stories/it",
    },
  },
};

export default function StoriesPage() {
  return (
    <StoriesIndex
      eyebrow="Click4tip Stories"
      title="Stories about tipping"
      intro="A small collection about tipping, people and payments — from coins in a pocket to QR codes on a phone."
      stories={[
        {
          title: "Digital Tipping in Switzerland: Cash Is Disappearing. Tipping Isn’t.",
          excerpt:
            "Swiss guests still tip. Cash is becoming less important. Here is how digital tipping fits into Switzerland’s changing payment culture — and the 2026 political debate.",
          href: "/stories/digital-tipping-switzerland",
          readTime: "About 8 min",
          status: "Read story →",
        },
        {
          title: "From Coins to QR Codes: A Short History of Tipping",
          excerpt:
            "People have been saying thank you with money for centuries. The reason stayed surprisingly similar. The technology did not.",
          href: "/stories/history-of-tipping",
          readTime: "About 6 min",
          status: "Read story →",
        },
      ]}
    />
  );
}
