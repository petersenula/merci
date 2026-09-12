import type { Metadata } from "next";
import StoriesIndex from "../StoriesIndex";

export const metadata: Metadata = {
  title: "Geschichten rund ums Trinkgeld",
  description:
    "Geschichten, Ideen und praktische Beiträge über Trinkgeld, digitales Trinkgeld und die Frage, wie sich unser Dankeschön verändert.",
  alternates: {
    canonical: "https://www.click4tip.ch/stories/de",
    languages: {
      en: "https://www.click4tip.ch/stories",
      de: "https://www.click4tip.ch/stories/de",
      fr: "https://www.click4tip.ch/stories/fr",
      it: "https://www.click4tip.ch/stories/it",
    },
  },
};

export default function StoriesGermanPage() {
  return (
    <StoriesIndex
      eyebrow="Click4tip Stories"
      title="Geschichten rund ums Trinkgeld"
      intro="Eine kleine Sammlung über Trinkgeld, Menschen und Bezahlen — von Münzen in der Tasche bis zum QR-Code auf dem Smartphone."
      stories={[
        {
          title: "Was ist digitales Trinkgeld? So funktionieren QR- und bargeldlose Trinkgelder",
          excerpt:
            "Ein einfacher Guide zu digitalem Trinkgeld: QR-Codes, bargeldlose Zahlungen, wer das Trinkgeld erhält, ob Gäste eine App brauchen und wo es eingesetzt wird.",
          href: "/stories/de/was-ist-digitales-trinkgeld",
          readTime: "Ca. 8 Min.",
          status: "Guide lesen →",
        },
        {
          title: "Digitales Trinkgeld in der Schweiz: Bargeld verschwindet. Trinkgeld nicht.",
          excerpt:
            "Schweizer Gäste geben weiterhin Trinkgeld. Bargeld wird weniger wichtig. Wie digitales Trinkgeld zur Schweizer Zahlungskultur und zur politischen Debatte 2026 passt.",
          href: "/stories/de/digitales-trinkgeld-schweiz",
          readTime: "Ca. 8 Min.",
          status: "Artikel lesen →",
        },
        {
          title: "Von Münzen zu QR-Codes: Eine kurze Geschichte des Trinkgelds",
          excerpt:
            "Seit Jahrhunderten sagen Menschen mit einem kleinen Geldbetrag Danke. Der Grund dafür ist erstaunlich ähnlich geblieben. Die Technik nicht.",
          href: "/stories/de/geschichte-des-trinkgelds",
          readTime: "Ca. 6 Min.",
          status: "Artikel lesen →",
        },
      ]}
    />
  );
}
