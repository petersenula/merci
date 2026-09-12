import type { Metadata } from "next";
import Link from "next/link";
import StoryLandingCta from "../../StoryLandingCta";

const canonicalUrl =
  "https://www.click4tip.ch/stories/fr/pourboire-digital-suisse";

export const metadata: Metadata = {
  title: "Pourboire numérique en Suisse : le cash recule, le pourboire reste.",
  description:
    "Comment fonctionne le pourboire en Suisse, pourquoi les pourboires sans espèces et par QR code deviennent plus importants, et ce que le débat politique de 2026 pourrait changer.",
  alternates: {
    canonical: canonicalUrl,
    languages: {
      en: "https://www.click4tip.ch/stories/digital-tipping-switzerland",
      de: "https://www.click4tip.ch/stories/de/digitales-trinkgeld-schweiz",
      fr: canonicalUrl,
      it: "https://www.click4tip.ch/stories/it/mance-digitali-svizzera",
    },
  },
  openGraph: {
    type: "article",
    url: canonicalUrl,
    title: "Pourboire numérique en Suisse : le cash recule, le pourboire reste.",
    description:
      "Les Suisses continuent de laisser des pourboires. Le cash devient moins important. Le pourboire numérique devient un vrai sujet pour la restauration et l’hôtellerie.",
    siteName: "Click4tip",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Pourboire numérique en Suisse : le cash recule, le pourboire reste.",
  description:
    "Comment fonctionne le pourboire en Suisse, pourquoi les pourboires sans espèces et par QR code deviennent plus importants, et ce que le débat politique de 2026 pourrait changer.",
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

export default function PourboireDigitalSuissePage() {
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
              Pourboire numérique · Suisse · Paiements sans espèces
            </p>

            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
              Pourboire numérique en Suisse : le cash recule, le pourboire reste.
            </h1>

            <p className="mt-5 text-xl leading-8 text-slate-600">
              La Suisse a cessé depuis longtemps de faire dépendre le salaire
              du personnel de service des pourboires. Les pourboires, eux, sont
              restés. Aujourd’hui, le cash recule — et cette vieille habitude a
              besoin d’un nouveau moyen de paiement.
            </p>

            <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
              <span>Click4tip Stories</span>
              <span>·</span>
              <span>Environ 8 min de lecture</span>
              <span>·</span>
              <span>Mis à jour en septembre 2026</span>
            </div>
          </header>

          <div className="mt-12 space-y-10 text-[17px] leading-8 text-slate-700">
            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                La Suisse a une histoire du pourboire un peu particulière
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Aujourd’hui, en Suisse, le pourboire est facultatif.
                  Le service est déjà compris dans le prix.
                </p>

                <p>
                  Cela paraît normal aujourd’hui. Mais cela n’a pas toujours
                  été le cas.
                </p>

                <p>
                  Jusqu’aux années 1970, dans une partie de la restauration,
                  le service n’était pas entièrement inclus dans le prix. Une
                  partie était financée directement par les pourboires.
                </p>

                <p>
                  En 1974, le système a changé. Le principe du
                  <em> service compris</em> est devenu la norme dans
                  l’hospitalité suisse.
                </p>

                <p>
                  Dès lors, le salaire ne devait plus dépendre du pourboire
                  obligatoire. Tout montant supplémentaire laissé par le client
                  devenait volontaire.
                </p>

                <p>
                  En bref : le salaire est devenu le salaire — et le pourboire
                  est redevenu un merci.
                </p>
              </div>
            </section>

            <aside className="rounded-2xl border border-green-200 bg-green-50 p-6">
              <p className="font-semibold text-green-900">
                La version suisse du pourboire
              </p>

              <p className="mt-2 text-green-900/80">
                Le service est compris dans le prix. Le pourboire est
                facultatif. Si vous en laissez un, vous décidez du montant —
                et, idéalement, à qui il est destiné.
              </p>
            </aside>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Les Suisses continuent de laisser des pourboires
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Facultatif ne veut pas dire rare.
                </p>

                <p>
                  Une étude représentative de la ZHAW menée auprès de
                  1 000 personnes en Suisse alémanique, romande et italienne
                  montre qu’environ deux tiers des clients dans les restaurants
                  avec service laissent généralement ou toujours un pourboire.
                </p>

                <p>
                  La plupart des personnes interrogées indiquent un montant
                  compris entre 5 % et 10 % de l’addition.
                </p>

                <p>
                  Il existe aussi des différences régionales : environ 10 % sont
                  plus fréquents en Suisse alémanique, tandis que 5 % sont plus
                  courants en Suisse romande et italienne.
                </p>

                <p>
                  L’idée de base est donc toujours bien vivante.
                </p>

                <p>
                  Les clients suisses veulent toujours récompenser un bon
                  service.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Le problème : la Suisse devient de plus en plus sans espèces
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  En revanche, notre manière de payer évolue rapidement.
                </p>

                <p>
                  Selon le Swiss Payment Monitor de la ZHAW et de l’Université
                  de Saint-Gall, les appareils mobiles sont désormais le moyen
                  de paiement le plus utilisé en Suisse.
                </p>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 p-5">
                    <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                      Mobile
                    </p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">
                      31,4 %
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-5">
                    <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                      Carte de débit
                    </p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">
                      23,8 %
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-5">
                    <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                      Espèces
                    </p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">
                      23,0 %
                    </p>
                  </div>
                </div>

                <p>
                  Et cela crée un problème très suisse en 2026 :
                </p>

                <div className="rounded-2xl bg-slate-100 p-6 text-slate-800">
                  <p>Payer l’addition avec son téléphone.</p>
                  <p className="mt-2">Ranger le téléphone.</p>
                  <p className="mt-2 font-semibold">
                    Puis commencer à chercher des pièces pour le pourboire.
                  </p>
                </div>

                <p>
                  L’envie de laisser un pourboire est toujours là.
                </p>

                <p>
                  Les espèces, beaucoup moins.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Pourquoi beaucoup de clients préfèrent encore le cash pour les pourboires
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  C’est là que les choses deviennent intéressantes.
                </p>

                <p>
                  Beaucoup de personnes paient l’addition numériquement, mais
                  reviennent aux espèces pour le pourboire.
                </p>

                <p>
                  L’étude de la ZHAW met en avant trois raisons importantes :
                </p>

                <ul className="list-disc space-y-2 pl-6">
                  <li>le contrôle sur la destination de l’argent,</li>
                  <li>le caractère personnel du geste,</li>
                  <li>
                    et la confiance que le pourboire arrive vraiment à la
                    personne qui a fourni le service.
                  </li>
                </ul>

                <p>
                  Le vrai défi n’est donc pas seulement :
                  <strong> « Comment rendre le pourboire numérique ? »</strong>
                </p>

                <p>
                  La meilleure question est :
                  <strong>
                    {" "}Comment rendre le pourboire numérique sans le rendre
                    moins personnel ?
                  </strong>
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Qu’est-ce qu’un pourboire numérique ?
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Un pourboire numérique, c’est tout simplement un pourboire
                  laissé sans utiliser d’espèces physiques.
                </p>

                <p>
                  Cela peut se faire de plusieurs manières.
                </p>

                <p>
                  Un terminal peut demander si vous souhaitez ajouter un
                  pourboire avant de payer l’addition.
                </p>

                <p>
                  Un hôtel peut proposer une page de pourboire numérique.
                </p>

                <p>
                  Un client peut scanner un QR code et laisser un pourboire
                  depuis son téléphone.
                </p>

                <p>
                  Le paiement peut ensuite se faire par TWINT, carte,
                  Apple Pay, Google Pay ou un autre moyen numérique disponible.
                </p>

                <p>
                  La différence importante n’est pas seulement la manière dont
                  l’argent circule.
                </p>

                <p>
                  C’est aussi ce que le client voit et comprend avant de payer.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Pourquoi le pourboire par QR code peut être différent
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Un QR code peut séparer le pourboire de l’addition principale.
                </p>

                <p>
                  C’est important, car le pourboire n’a pas besoin de devenir
                  simplement une ligne supplémentaire dans un paiement de
                  restaurant.
                </p>

                <p>
                  Le QR code peut mener à la page d’un employé précis, d’une
                  équipe, d’un département d’hôtel ou d’un système de répartition
                  des pourboires.
                </p>

                <p>
                  Le client voit à qui le pourboire est destiné avant de payer.
                </p>

                <p>
                  Cela permet de retrouver quelque chose que le cash faisait
                  très bien : la transparence.
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 p-5">
                    <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                      Anonyme
                    </p>
                    <p className="mt-3 text-lg font-semibold text-slate-900">
                      Ajouter 10 % de pourboire ?
                    </p>
                    <p className="mt-2 text-slate-600">
                      Le client ne sait pas forcément qui le reçoit.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
                    <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
                      Personnel
                    </p>
                    <p className="mt-3 text-lg font-semibold text-slate-900">
                      Merci, Sofia
                    </p>
                    <p className="mt-2 text-slate-600">
                      La personne ou l’équipe est visible avant le paiement.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Et puis il y a la question fiscale
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Ici, les choses deviennent moins simples.
                </p>

                <p>
                  Le fait qu’un pourboire soit volontaire ne signifie pas
                  automatiquement que tous les pourboires sont traités de la
                  même manière sur le plan fiscal et social.
                </p>

                <p>
                  Selon les règles suisses actuelles, un pourboire peut être
                  considéré comme un salaire déterminant pour les assurances
                  sociales s’il représente une part importante de la
                  rémunération.
                </p>

                <p>
                  Parallèlement, dans les secteurs où le service est déjà inclus
                  dans le prix, les pourboires volontaires ont traditionnellement
                  été considérés comme un petit supplément distinct.
                </p>

                <p>
                  L’impôt fédéral direct ajoute encore une couche :
                  le pourboire est en principe un revenu imposable.
                </p>

                <p>
                  Tant que le pourboire est donné en espèces, beaucoup de choses
                  restent difficiles à voir. Le pourboire numérique laisse, lui,
                  des traces électroniques claires.
                </p>

                <p className="text-sm text-slate-500">
                  Cet article donne une vue d’ensemble générale et ne constitue
                  pas un conseil fiscal ou juridique. Les entreprises doivent
                  vérifier les règles applicables à leur situation.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                2026 : le pourboire numérique arrive au Parlement suisse
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  En 2026, le débat est passé des restaurants et des services
                  de paie à la politique fédérale.
                </p>

                <p>
                  Une motion du conseiller aux États Beat Rieder demande une
                  règle plus claire : les pourboires volontaires dans les
                  secteurs où le service est déjà inclus dans les prix ne
                  devraient, en principe, être considérés ni comme un salaire
                  déterminant ni comme un revenu imposable.
                </p>

                <p>
                  En mars 2026, le Conseil des États a accepté la motion par
                  42 voix contre 1, avec une abstention.
                </p>

                <p>
                  Le Conseil fédéral s’oppose à cette proposition.
                </p>

                <p>
                  Son argument : la protection sociale est importante, et une
                  exemption totale pourrait aussi couvrir des situations où les
                  pourboires représentent une part importante du revenu.
                </p>

                <p>
                  Les partisans de la motion estiment au contraire que les
                  pourboires numériques volontaires ne devraient pas être
                  traités moins favorablement que les pourboires en espèces
                  simplement parce qu’ils sont plus faciles à tracer.
                </p>

                <p>
                  La commission compétente du Conseil national a ensuite
                  recommandé d’accepter la motion par 16 voix contre 9.
                </p>

                <p>
                  Le Conseil national devrait traiter le sujet pendant la
                  session d’automne 2026.
                </p>
              </div>
            </section>

            <aside className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <p className="font-semibold text-amber-900">
                Pourquoi nous mettrons cette page à jour
              </p>

              <p className="mt-2 text-amber-900/80">
                Le débat politique continue. Dès que le Parlement prendra une
                nouvelle décision, nous mettrons cet article à jour au lieu de
                laisser en ligne une explication devenue obsolète.
              </p>
            </aside>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Que signifie tout cela pour les hôtels, restaurants et entreprises de service ?
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Le problème pratique existe, quelle que soit la prochaine
                  décision du Parlement.
                </p>

                <p>
                  Les clients paient de plus en plus numériquement.
                </p>

                <p>
                  Les employés apprécient toujours les pourboires.
                </p>

                <p>
                  Et les clients veulent toujours savoir qui les reçoit.
                </p>

                <p>
                  Les entreprises ont donc besoin de solutions de pourboire
                  numérique simples pour les clients et transparentes pour les
                  équipes.
                </p>

                <p>
                  Cela peut signifier montrer une personne précise, une équipe
                  ou expliquer clairement comment le pourboire sera réparti.
                </p>

                <p>
                  La technologie doit réduire les frictions, pas créer une
                  nouvelle incertitude.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Le pourboire numérique doit résoudre le problème du cash sans perdre le côté humain
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  La Suisse n’a pas besoin de revenir à un ancien système où le
                  personnel de service dépendait des pourboires pour être
                  correctement payé.
                </p>

                <p>
                  Ce n’est pas le but.
                </p>

                <p>
                  L’opportunité est beaucoup plus simple :
                </p>

                <p>
                  garder des salaires corrects, garder le pourboire volontaire,
                  et permettre aux clients de dire merci facilement même sans
                  espèces dans la poche.
                </p>

                <p>
                  Chez Click4tip, nous pensons que la meilleure expérience de
                  pourboire numérique est celle où la technologie devient
                  presque invisible.
                </p>

                <p>
                  Le client voit la personne ou l’équipe, choisit un montant,
                  paie numériquement — et comprend où va l’argent.
                </p>
              </div>
            </section>

            <section className="rounded-3xl bg-slate-900 p-7 text-white sm:p-9">
              <h2 className="text-2xl font-semibold">
                Le cash change. Le merci n’a pas besoin de changer.
              </h2>

              <div className="mt-4 space-y-4 text-slate-200">
                <p>
                  Le pourboire numérique ne remplace pas la signification du
                  pourboire.
                </p>

                <p>
                  Il donne simplement à un vieux geste un moyen de paiement que
                  nous avons encore dans nos poches.
                </p>
              </div>

              <StoryLandingCta
                lang="fr"
                label="Découvrir Click4tip →"
              />
            </section>

            <section className="border-t border-slate-200 pt-8 text-sm leading-6 text-slate-500">
              <h2 className="font-semibold text-slate-700">
                Sources & lectures complémentaires
              </h2>

              <ul className="mt-3 space-y-2">
                <li>
                  GastroSuisse —{" "}
                  <a
                    href="https://gastrosuisse.ch/de/branchenwissen/wissenswertes/a-bis-z/trinkgeld"
                    target="_blank"
                    rel="noreferrer"
                    className="underline hover:text-slate-700"
                  >
                    Trinkgeld
                  </a>
                </li>

                <li>
                  ZHAW School of Management and Law —{" "}
                  <a
                    href="https://digitalcollection.zhaw.ch/items/eb83376f-6407-4433-bff7-d9cd5843fcfe"
                    target="_blank"
                    rel="noreferrer"
                    className="underline hover:text-slate-700"
                  >
                    Trinkgeld im Wandel
                  </a>
                </li>

                <li>
                  ZHAW & Université de Saint-Gall —{" "}
                  <a
                    href="https://www.zhaw.ch/en/about-us/news/news-releases/news-detail/event-news/after-temporary-stabilization-cash-is-in-decline-again"
                    target="_blank"
                    rel="noreferrer"
                    className="underline hover:text-slate-700"
                  >
                    Swiss Payment Monitor 2026
                  </a>
                </li>

                <li>
                  Parlement suisse —{" "}
                  <a
                    href="https://www.parlament.ch/de/services/news/Seiten/2026/20260302180407926194158159026_bsd207.aspx"
                    target="_blank"
                    rel="noreferrer"
                    className="underline hover:text-slate-700"
                  >
                    Vote du Conseil des États sur les pourboires volontaires
                  </a>
                </li>

                <li>
                  htr hotelrevue —{" "}
                  <a
                    href="https://www.htr.ch/story/hotellerie/jetzt-entscheidet-der-nationalrat-ueber-digitale-trinkgelder-46365"
                    target="_blank"
                    rel="noreferrer"
                    className="underline hover:text-slate-700"
                  >
                    Jetzt entscheidet der Nationalrat über digitale Trinkgelder
                  </a>
                </li>
              </ul>
            </section>
          </div>
        </article>
      </main>
    </>
  );
}
