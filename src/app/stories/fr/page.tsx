import type { Metadata } from "next";
import StoriesIndex from "../StoriesIndex";

export const metadata: Metadata = {
  title: "Histoires autour du pourboire",
  description:
    "Des histoires, des idées et des guides pratiques sur le pourboire, le pourboire numérique et l'évolution de notre façon de dire merci.",
  alternates: {
    canonical: "https://www.click4tip.ch/stories/fr",
    languages: {
      en: "https://www.click4tip.ch/stories",
      de: "https://www.click4tip.ch/stories/de",
      fr: "https://www.click4tip.ch/stories/fr",
      it: "https://www.click4tip.ch/stories/it",
    },
  },
};

export default function StoriesFrenchPage() {
  return (
    <StoriesIndex
      eyebrow="Click4tip Stories"
      title="Histoires autour du pourboire"
      intro="Une petite collection sur les pourboires, les personnes et les paiements — des pièces de monnaie aux QR codes."
      stories={[
        {
          title: "Pourboire numérique en Suisse : le cash recule, le pourboire reste.",
          excerpt:
            "Les Suisses continuent de laisser des pourboires. Le cash devient moins important. Voici comment le pourboire numérique s’inscrit dans l’évolution des paiements et le débat politique de 2026.",
          href: "/stories/fr/pourboire-digital-suisse",
          readTime: "Env. 8 min",
          status: "Lire l’article →",
        },
        {
          title: "Des pièces aux QR codes : une courte histoire du pourboire",
          excerpt:
            "Depuis des siècles, nous disons merci avec un petit montant. La raison a peu changé. La technologie, beaucoup plus.",
          href: "/stories/fr/histoire-du-pourboire",
          readTime: "Env. 6 min",
          status: "Lire l’article →",
        },
      ]}
    />
  );
}
