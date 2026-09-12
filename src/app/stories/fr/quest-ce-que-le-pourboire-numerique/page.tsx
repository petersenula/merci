import type { Metadata } from "next";
import Link from "next/link";
import StoryLandingCta from "../../StoryLandingCta";

const canonicalUrl =
  "https://www.click4tip.ch/stories/fr/quest-ce-que-le-pourboire-numerique";

export const metadata: Metadata = {
  title: "Qu’est-ce que le pourboire numérique ? Comment fonctionnent les pourboires sans espèces et par QR code",
  description:
    "Un guide simple sur le pourboire numérique : fonctionnement des QR codes, besoin ou non d’une application, destination de l’argent et secteurs où il est utilisé.",
  alternates: {
    canonical: canonicalUrl,
    languages: {
      en: "https://www.click4tip.ch/stories/what-is-digital-tipping",
      de: "https://www.click4tip.ch/stories/de/was-ist-digitales-trinkgeld",
      fr: canonicalUrl,
      it: "https://www.click4tip.ch/stories/it/cosa-sono-le-mance-digitali",
    },
  },
  openGraph: {
    type: "article",
    url: canonicalUrl,
    title: "Qu’est-ce que le pourboire numérique ? Comment fonctionnent les pourboires sans espèces et par QR code",
    description:
      "Le pourboire numérique expliqué simplement : QR codes, paiements sans espèces, moyens de paiement, pourboires individuels et collectifs.",
    siteName: "Click4tip",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Qu’est-ce que le pourboire numérique ? Comment fonctionnent les pourboires sans espèces et par QR code",
  description:
    "Un guide simple sur le pourboire numérique : fonctionnement des QR codes, besoin ou non d’une application, destination de l’argent et secteurs où il est utilisé.",
  author: {
    "@type": "Organization",
    name: "Click4tip",
    url: "https://www.click4tip.ch",
  },
  publisher: {
    "@type": "Organization",
    name: "Click4tip",
    url: "https://www.click4tip.ch",
  },
  mainEntityOfPage: canonicalUrl,
  inLanguage: "fr",
  datePublished: "2026-09-12",
  dateModified: "2026-09-12",
};

export default function QuestCeQueLePourboireNumeriquePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="min-h-screen bg-white px-6 pb-20 pt-16 sm:pt-20">
        <article className="mx-auto max-w-3xl">
          <Link
            href="/stories/fr"
            className="text-sm font-semibold text-green-700 hover:text-green-800"
          >
            ← Retour aux Stories
          </Link>

          <header className="mt-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
              Pourboire numérique · QR codes · Paiements sans espèces
            </p>

            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
              Qu’est-ce que le pourboire numérique ? Comment fonctionnent les pourboires sans espèces et par QR code
            </h1>

            <p className="mt-5 text-xl leading-8 text-slate-600">
              Le pourboire numérique permet à un client de laisser un pourboire
              sans utiliser d’espèces. Cela peut se faire sur un terminal de
              paiement, via une page de pourboire numérique ou en scannant un
              QR code avec un smartphone.
            </p>

            <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
              <span>Click4tip Stories</span>
              <span>·</span>
              <span>Environ 8 min de lecture</span>
              <span>·</span>
              <span>Septembre 2026</span>
            </div>
          </header>

          <div className="mt-12 space-y-10 text-[17px] leading-8 text-slate-700">
            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Qu’est-ce que le pourboire numérique ?
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Le pourboire numérique — parfois appelé pourboire sans espèces
                  — consiste à laisser un pourboire par voie électronique plutôt
                  qu’avec des pièces ou des billets.
                </p>

                <p>
                  L’idée est simple.
                </p>

                <p>
                  Un client souhaite remercier quelqu’un pour un bon service.
                  Au lieu de chercher du cash, il utilise une carte ou son téléphone.
                </p>

                <p>
                  Le pourboire peut être ajouté à un paiement par carte, payé
                  sur une page séparée ou envoyé après avoir scanné un QR code.
                </p>

                <p>
                  La technologie est nouvelle. La raison ne l’est pas.
                </p>

                <p>
                  Il s’agit toujours de dire <strong>merci</strong>.
                </p>
              </div>
            </section>

            <aside className="rounded-2xl border border-green-200 bg-green-50 p-6">
              <p className="font-semibold text-green-900">
                Le pourboire numérique en une phrase
              </p>

              <p className="mt-2 text-green-900/80">
                Un pourboire numérique est un pourboire volontaire payé
                électroniquement au lieu d’être remis en espèces.
              </p>
            </aside>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Comment fonctionne le pourboire numérique ?
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Le processus exact dépend du système utilisé, mais les étapes
                  de base sont généralement les mêmes.
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 p-5">
                    <p className="text-sm font-semibold text-green-700">1</p>
                    <p className="mt-2 font-semibold text-slate-900">
                      Ouvrir l’option de pourboire
                    </p>
                    <p className="mt-2 text-slate-600">
                      Scanner un QR code, ouvrir un lien ou utiliser l’option de
                      pourboire sur un terminal.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-5">
                    <p className="text-sm font-semibold text-green-700">2</p>
                    <p className="mt-2 font-semibold text-slate-900">
                      Choisir le montant
                    </p>
                    <p className="mt-2 text-slate-600">
                      Sélectionner un montant proposé ou saisir un montant libre.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-5">
                    <p className="text-sm font-semibold text-green-700">3</p>
                    <p className="mt-2 font-semibold text-slate-900">
                      Payer numériquement
                    </p>
                    <p className="mt-2 text-slate-600">
                      Utiliser une carte, un portefeuille mobile ou un moyen de
                      paiement local disponible.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-5">
                    <p className="text-sm font-semibold text-green-700">4</p>
                    <p className="mt-2 font-semibold text-slate-900">
                      Le pourboire est enregistré
                    </p>
                    <p className="mt-2 text-slate-600">
                      Le système enregistre le paiement et le dirige ou le
                      répartit selon la configuration choisie.
                    </p>
                  </div>
                </div>

                <p>
                  Pas de pièces. Pas de recherche au fond des poches. Pas besoin
                  de demander si quelqu’un peut faire de la monnaie.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Qu’est-ce que le pourboire par QR code ?
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Le pourboire par QR code est une forme de pourboire numérique.
                </p>

                <p>
                  Une entreprise ou une personne qui fournit un service affiche
                  un QR code. Il peut être imprimé sur une carte, un reçu, un
                  support de table, dans une chambre d’hôtel, sur un badge ou à
                  un autre endroit pratique.
                </p>

                <p>
                  Le client le scanne avec l’appareil photo de son smartphone.
                </p>

                <p>
                  Au lieu d’ouvrir un menu ou une page produit, le QR code ouvre
                  une page de pourboire.
                </p>

                <p>
                  Le client choisit un montant et paie numériquement.
                </p>

                <p>
                  Le pourboire peut ainsi être totalement séparé de l’addition.
                </p>

                <p>
                  Cela peut être utile lorsque la personne à remercier n’est pas
                  celle qui a encaissé le paiement — par exemple le personnel
                  d’étage, un concierge ou un bagagiste dans un hôtel.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Le pourboire par QR code est-il la même chose que le pourboire sur un terminal ?
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Pas tout à fait.
                </p>

                <p>
                  Sur un terminal, le pourboire est généralement proposé dans le
                  même parcours de paiement que l’addition.
                </p>

                <p>
                  Par exemple :
                </p>

                <div className="rounded-2xl bg-slate-100 p-6 text-center">
                  <p className="text-lg font-semibold text-slate-900">
                    Ajouter un pourboire ?
                  </p>
                  <p className="mt-3 text-slate-600">
                    5 % · 10 % · 15 % · Montant libre
                  </p>
                </div>

                <p>
                  Avec le QR code, le pourboire peut exister indépendamment de
                  l’achat principal.
                </p>

                <p>
                  Il peut être laissé avant, pendant ou après la transaction —
                  parfois même lorsqu’il n’y a pas de caisse classique.
                </p>

                <p>
                  Un client d’hôtel peut par exemple avoir payé sa chambre en
                  ligne plusieurs jours avant de rencontrer la personne qu’il
                  souhaite remercier.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Les clients ont-ils besoin d’une application ?
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Ils ne devraient pas en avoir besoin.
                </p>

                <p>
                  Une bonne expérience de pourboire par QR code s’ouvre
                  directement dans le navigateur du téléphone : scanner,
                  choisir un montant, payer.
                </p>

                <p>
                  Demander à quelqu’un de télécharger une application, créer un
                  compte et mémoriser un mot de passe simplement pour laisser
                  un petit merci ajoute des frictions au pire moment.
                </p>

                <p>
                  Le pourboire numérique fonctionne mieux lorsqu’il est plus
                  rapide que de chercher du cash — pas plus lent.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Qui reçoit réellement le pourboire numérique ?
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Cela dépend de la manière dont l’entreprise a configuré son
                  système de pourboire.
                </p>

                <p>
                  Un pourboire numérique peut être destiné à :
                </p>

                <ul className="list-disc space-y-2 pl-6">
                  <li>un employé en particulier,</li>
                  <li>une équipe ou un département,</li>
                  <li>plusieurs employés qui se partagent le pourboire,</li>
                  <li>
                    ou une entreprise qui le redistribue ensuite selon ses
                    propres règles.
                  </li>
                </ul>

                <p>
                  C’est l’une des différences les plus importantes entre les
                  systèmes de pourboire numérique.
                </p>

                <p>
                  Le paiement n’est que la moitié de la question.
                </p>

                <p>
                  L’autre moitié est :
                  <strong> où va l’argent ?</strong>
                </p>

                <p>
                  Une bonne solution devrait rendre cela clair pour le client.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Pourboire individuel ou pourboire d’équipe ?
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Les deux peuvent avoir du sens.
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
                    <p className="font-semibold text-slate-900">
                      Pourboire individuel
                    </p>
                    <p className="mt-2 text-slate-600">
                      Le client voit une personne précise et laisse le pourboire
                      directement pour elle.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-5">
                    <p className="font-semibold text-slate-900">
                      Pourboire d’équipe
                    </p>
                    <p className="mt-2 text-slate-600">
                      Le pourboire est destiné à une équipe et peut être réparti
                      selon une règle définie.
                    </p>
                  </div>
                </div>

                <p>
                  Le bon modèle dépend du type de service.
                </p>

                <p>
                  Un coiffeur peut recevoir un pourboire individuel. Un
                  restaurant peut préférer partager entre le service et la
                  cuisine. Un hôtel peut avoir des modèles différents pour le
                  housekeeping, la réception ou le concierge.
                </p>

                <p>
                  Les systèmes numériques permettent ces modèles sans devoir
                  installer un pot de pièces différent pour chaque situation.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Quels moyens de paiement peuvent être utilisés ?
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Les moyens disponibles dépendent du pays et du fournisseur.
                </p>

                <p>
                  Ils peuvent inclure :
                </p>

                <ul className="list-disc space-y-2 pl-6">
                  <li>cartes de crédit et de débit,</li>
                  <li>Apple Pay,</li>
                  <li>Google Pay,</li>
                  <li>services de paiement mobile,</li>
                  <li>et moyens de paiement spécifiques à certains pays.</li>
                </ul>

                <p>
                  En Suisse, par exemple, TWINT est particulièrement important.
                </p>

                <p>
                  Le mieux est généralement de ne pas imposer un seul moyen de
                  paiement, mais de proposer des options familières.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Où le pourboire numérique est-il utile ?
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Il est particulièrement utile là où il y a un bon service,
                  mais de moins en moins de cash.
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 p-5">
                    <p className="font-semibold text-slate-900">
                      Hôtels
                    </p>
                    <p className="mt-2 text-slate-600">
                      Housekeeping, concierge, réception, bagagistes, équipes
                      du petit-déjeuner et autres collaborateurs en contact
                      avec les clients.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-5">
                    <p className="font-semibold text-slate-900">
                      Restaurants & cafés
                    </p>
                    <p className="mt-2 text-slate-600">
                      Serveurs individuels, équipes, service au comptoir et
                      établissements sans espèces.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-5">
                    <p className="font-semibold text-slate-900">
                      Salons & services personnels
                    </p>
                    <p className="mt-2 text-slate-600">
                      Coiffeurs, professionnels de la beauté et autres
                      spécialistes ayant une relation directe avec leurs clients.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-5">
                    <p className="font-semibold text-slate-900">
                      Livraison & services
                    </p>
                    <p className="mt-2 text-slate-600">
                      Situations où le service se déroule loin d’un comptoir de
                      paiement traditionnel.
                    </p>
                  </div>
                </div>

                <p>
                  Le point commun est simple : il y a quelqu’un que le client
                  souhaite remercier, mais pas forcément d’échange de cash à ce
                  moment-là.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Pourquoi le pourboire numérique devient-il plus important ?
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Parce que nos moyens de paiement ont changé plus vite que nos
                  habitudes de pourboire.
                </p>

                <p>
                  Les gens paient de plus en plus par carte, téléphone ou
                  portefeuille mobile et transportent peu ou pas de cash.
                </p>

                <p>
                  Mais l’envie de récompenser un bon service n’a pas disparu
                  avec les pièces dans nos poches.
                </p>

                <p>
                  Cela crée un décalage.
                </p>

                <p>
                  Le pourboire traditionnel suppose que le client a du cash sur
                  lui. Le comportement de paiement moderne signifie souvent
                  exactement le contraire.
                </p>

                <p>
                  Le pourboire numérique comble ce vide.
                </p>
              </div>
            </section>

            <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <p className="font-semibold text-slate-900">
                Une distinction importante
              </p>

              <p className="mt-2 text-slate-600">
                Le pourboire numérique doit permettre de laisser un pourboire.
                Il ne doit pas donner au client l’impression d’y être obligé.
              </p>
            </aside>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Qu’est-ce qui fait une bonne expérience de pourboire numérique ?
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Les meilleurs systèmes réduisent les frictions sans supprimer
                  le choix.
                </p>

                <p>
                  Pour le client, cela signifie :
                </p>

                <ul className="list-disc space-y-2 pl-6">
                  <li>pas de téléchargement obligatoire d’application,</li>
                  <li>pas de création de compte inutile,</li>
                  <li>un choix clair du montant,</li>
                  <li>la possibilité d’entrer un montant libre,</li>
                  <li>des moyens de paiement familiers,</li>
                  <li>et une indication claire de qui reçoit le pourboire.</li>
                </ul>

                <p>
                  Il doit aussi être facile de dire non.
                </p>

                <p>
                  Un pourboire a du sens précisément parce qu’il est volontaire.
                </p>

                <p>
                  Transformer un merci en pression irait à l’encontre du but.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Comment Click4tip aborde le pourboire numérique
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Click4tip repose sur une idée simple : garder la personne
                  visible.
                </p>

                <p>
                  Un QR code peut mener vers une personne, une équipe ou un
                  schéma de répartition défini.
                </p>

                <p>
                  Le client voit à qui le pourboire est destiné, choisit un
                  montant et paie numériquement.
                </p>

                <p>
                  Pour les entreprises, cela permet de prendre en charge
                  différents modèles de pourboire sans faire passer chaque
                  interaction de service par le même terminal.
                </p>

                <p>
                  Le but n’est pas de rendre le pourboire plus compliqué.
                </p>

                <p>
                  Il s’agit de rendre la version sans espèces aussi naturelle
                  que le fait de donner autrefois un pourboire directement à
                  quelqu’un.
                </p>
              </div>
            </section>

            <section className="rounded-3xl bg-slate-900 p-7 text-white sm:p-9">
              <h2 className="text-2xl font-semibold">
                Pas de cash ? On peut toujours dire merci.
              </h2>

              <div className="mt-4 space-y-4 text-slate-200">
                <p>
                  Le pourboire numérique donne à une vieille habitude un moyen
                  de paiement adapté à la manière dont nous payons aujourd’hui.
                </p>
              </div>

              <StoryLandingCta
                lang="fr"
                label="Découvrir Click4tip →"
              />
            </section>

            <section className="border-t border-slate-200 pt-8">
              <h2 className="text-xl font-semibold text-slate-900">
                À lire aussi
              </h2>

              <div className="mt-4 space-y-3">
                <Link
                  href="/stories/fr/pourboire-digital-suisse"
                  className="block font-semibold text-green-700 hover:text-green-800"
                >
                  Pourboire numérique en Suisse : le cash recule, le pourboire reste. →
                </Link>

                <Link
                  href="/stories/fr/histoire-du-pourboire"
                  className="block font-semibold text-green-700 hover:text-green-800"
                >
                  Des pièces aux QR codes : une courte histoire du pourboire →
                </Link>
              </div>
            </section>
          </div>
        </article>
      </main>
    </>
  );
}
