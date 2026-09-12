import type { Metadata } from "next";
import StoriesIndex from "../StoriesIndex";

export const metadata: Metadata = {
  title: "Storie sulla mancia",
  description:
    "Storie, idee e guide pratiche sulla mancia, sulle mance digitali e su come sta cambiando il nostro modo di dire grazie.",
  alternates: {
    canonical: "https://www.click4tip.ch/stories/it",
    languages: {
      en: "https://www.click4tip.ch/stories",
      de: "https://www.click4tip.ch/stories/de",
      fr: "https://www.click4tip.ch/stories/fr",
      it: "https://www.click4tip.ch/stories/it",
    },
  },
};

export default function StoriesItalianPage() {
  return (
    <StoriesIndex
      eyebrow="Click4tip Stories"
      title="Storie sulla mancia"
      intro="Una piccola raccolta su mance, persone e pagamenti — dalle monete in tasca ai QR code sul telefono."
      stories={[
        {
          title: "Mance digitali in Svizzera: il contante cala. Le mance restano.",
          excerpt:
            "Gli svizzeri continuano a lasciare mance. Il contante diventa meno importante. Ecco come le mance digitali si inseriscono nell’evoluzione dei pagamenti e nel dibattito politico del 2026.",
          href: "/stories/it/mance-digitali-svizzera",
          readTime: "Circa 8 min",
          status: "Leggi l’articolo →",
        },
        {
          title: "Dalle monete ai QR code: una breve storia della mancia",
          excerpt:
            "Da secoli diciamo grazie anche con una piccola somma di denaro. Il motivo è rimasto simile. La tecnologia no.",
          href: "/stories/it/storia-della-mancia",
          readTime: "Circa 6 min",
          status: "Leggi l’articolo →",
        },
      ]}
    />
  );
}
