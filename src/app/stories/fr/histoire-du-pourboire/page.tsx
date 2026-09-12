import type { Metadata } from "next";
import Link from "next/link";
import StoryLandingCta from "../../StoryLandingCta";

const canonicalUrl =
  "https://www.click4tip.ch/stories/fr/histoire-du-pourboire";

export const metadata: Metadata = {
  title: "Des pièces aux QR codes : une courte histoire du pourboire",
  description:
    "Comment le pourboire est passé des pièces et du 'gardez la monnaie' aux cartes, aux smartphones et aux QR codes — tout en restant un geste personnel.",
  alternates: {
    canonical: canonicalUrl,
    languages: {
      en: "https://www.click4tip.ch/stories/history-of-tipping",
      de: "https://www.click4tip.ch/stories/de/geschichte-des-trinkgelds",
      fr: canonicalUrl,
      it: "https://www.click4tip.ch/stories/it/storia-della-mancia",
    },
  },
  openGraph: {
    type: "article",
    url: canonicalUrl,
    title: "Des pièces aux QR codes : une courte histoire du pourboire",
    description:
      "Depuis des siècles, nous disons merci avec un pourboire. La raison a peu changé. La technologie, beaucoup plus.",
    siteName: "Click4tip",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Des pièces aux QR codes : une courte histoire du pourboire",
  description:
    "Comment le pourboire est passé des pièces et du 'gardez la monnaie' aux cartes, aux smartphones et aux QR codes.",
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
};

export default function HistoireDuPourboirePage() {
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
              Pourboire · Histoire · Paiements numériques
            </p>

            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
              Des pièces aux QR codes : une courte histoire du pourboire
            </h1>

            <p className="mt-5 text-xl leading-8 text-slate-600">
              Depuis des siècles, nous disons merci avec un pourboire.
              La raison a peu changé. La technologie, beaucoup plus.
            </p>

            <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
              <span>Click4tip Stories</span>
              <span>·</span>
              <span>Environ 6 min de lecture</span>
            </div>
          </header>

          <div className="mt-12 space-y-10 text-[17px] leading-8 text-slate-700">
            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Avant que le pourboire ne s'appelle pourboire
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Personne ne sait exactement quand quelqu'un a décidé pour la
                  première fois qu'un bon service méritait un petit supplément.
                </p>

                <p>
                  Une version de cette habitude remonte à l'Angleterre du
                  XVIe siècle. Les voyageurs aisés qui séjournaient chez
                  quelqu'un donnaient de l'argent au personnel de maison pour
                  le travail supplémentaire effectué pendant leur visite.
                  Ces paiements étaient appelés <em>vails</em>.
                </p>

                <p>
                  L'idée a pris. Peut-être même un peu trop bien.
                </p>

                <p>
                  Dès le XVIIIe siècle, des invités se plaignaient déjà du
                  montant qu'ils étaient censés laisser à la fin d'un séjour.
                  Il y eut même des tentatives organisées pour faire disparaître
                  cette habitude.
                </p>

                <p>
                  Elles ont échoué.
                </p>

                <p>
                  Donc si vous avez déjà regardé un écran de pourboire en vous
                  disant : « Le repas n'était-il pas déjà assez cher ? »,
                  félicitations : une version de cette discussion existait déjà
                  il y a plusieurs siècles.
                </p>
              </div>
            </section>

            <aside className="rounded-2xl border border-green-200 bg-green-50 p-6">
              <p className="font-semibold text-green-900">
                Petit détour par un mythe historique
              </p>

              <p className="mt-2 text-green-900/80">
                Vous avez peut-être entendu dire que TIP signifie
                « To Insure Promptness » ou « To Insure Prompt Service ».
                C'est une jolie histoire, mais ce n'est presque certainement
                pas l'origine du mot. Le terme était déjà utilisé avant les
                fameuses histoires de cafés auxquelles on attribue cet acronyme.
              </p>
            </aside>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Puis vint le « gardez la monnaie »
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Pendant très longtemps, le pourboire était quelque chose de
                  très concret.
                </p>

                <p>
                  L'addition était de 46. Vous donniez 50 et disiez :
                  « Gardez la monnaie. »
                </p>

                <p>
                  Toute la transaction prenait environ trois secondes.
                </p>

                <p>
                  Et surtout, il était évident pour qui le merci était destiné.
                  L'argent passait directement d'une main à l'autre.
                </p>

                <p>
                  Dans les hôtels, c'était similaire : quelques pièces pour
                  les bagages, quelque chose pour le personnel d'étage, un peu
                  plus pour quelqu'un qui avait résolu un problème ou rendu le
                  séjour plus agréable.
                </p>

                <p>
                  Le pourboire était de l'argent, mais aussi un petit moment
                  social :
                  <strong> J'ai vu ce que vous avez fait. Merci.</strong>
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Les cartes ont changé le paiement. Le cash a gardé le pourboire en vie.
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Les cartes de crédit et de débit ont changé notre façon de
                  payer l'addition, mais pendant longtemps, les pourboires sont
                  restés en espèces.
                </p>

                <p>
                  Addition par carte. Quelques pièces sur la table.
                  Problème réglé.
                </p>

                <p>
                  Jusqu'au jour où les pièces ont commencé à disparaître.
                </p>

                <p>
                  Les portefeuilles sont devenus plus petits. Les smartphones
                  ont commencé à remplacer les cartes. Le paiement sans contact
                  est devenu normal. Les paiements mobiles aussi.
                </p>

                <p>
                  Et une nouvelle situation est apparue :
                </p>

                <div className="rounded-2xl bg-slate-100 p-6 text-slate-800">
                  <p>
                    « Le service était excellent. J'aimerais laisser un pourboire. »
                  </p>
                  <p className="mt-2 font-semibold">
                    « Parfait. Vous avez du liquide ? »
                  </p>
                  <p className="mt-2">« ...non. »</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Le terminal de paiement a essayé d'aider
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Une solution semblait évidente : ajouter le pourboire sur le
                  même terminal que l'addition.
                </p>

                <p>
                  Ça fonctionne. C'est rapide. C'est pratique.
                </p>

                <p>
                  Mais quelque chose a changé.
                </p>

                <p>
                  Au lieu de donner cinq francs ou cinq euros directement à
                  Maria, qui s'est occupée de votre table, vous ajoutez
                  maintenant peut-être 10 % à une transaction avec une entreprise.
                </p>

                <p>
                  Où va l'argent ? À Maria ? À toute l'équipe ? En cuisine ?
                  Dans un pot commun ? En tant que client, vous ne le savez
                  souvent pas.
                </p>

                <p>
                  Le pourboire est devenu numérique. Mais aussi un peu plus
                  anonyme.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                L'envie de dire merci n'a pas disparu avec le cash
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  C'est là que ça devient intéressant.
                </p>

                <p>
                  Les gens n'ont pas soudainement cessé d'apprécier un bon
                  service simplement parce qu'ils paient désormais avec leur
                  téléphone.
                </p>

                <p>
                  L'habitude est restée. L'ancien mécanisme a disparu.
                </p>

                <p>
                  C'est pourquoi le pourboire numérique apparaît aujourd'hui
                  dans les restaurants, les hôtels, les services de livraison,
                  les salons, les taxis, les festivals et beaucoup d'autres
                  endroits où des personnes rendent un service personnel.
                </p>

                <p>
                  La question n'est plus vraiment de savoir si le pourboire peut
                  être numérique.
                </p>

                <p>
                  La question plus intéressante est :
                  <strong> peut-il rester personnel ?</strong>
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Le QR code entre en scène
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Les QR codes offrent une réponse étonnamment simple.
                </p>

                <p>
                  Scanner le code. Ouvrir la page. Choisir un montant.
                  Payer numériquement.
                </p>

                <p>
                  Pas d'application à télécharger. Pas de chasse aux pièces au
                  fond d'un sac. Et le pourboire n'a pas besoin d'être mélangé
                  à l'addition principale.
                </p>

                <p>
                  Le pourboire par QR code est déjà utilisé dans des contextes
                  très différents. Des chercheurs ont par exemple étudié les
                  artistes de rue du Edinburgh Fringe Festival utilisant des QR
                  codes pour recevoir des pourboires sans espèces.
                </p>

                <p>
                  Leur étude a montré quelque chose qui paraît évident une fois
                  qu'on y pense : ce qui apparaît après le scan compte aussi.
                </p>

                <p>
                  Le QR code n'est que la porte. Ce qu'il y a derrière est la
                  partie importante.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Numérique ne veut pas dire impersonnel
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Imaginez deux situations.
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 p-5">
                    <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                      Option A
                    </p>
                    <p className="mt-3 text-lg font-semibold text-slate-900">
                      Ajouter un pourboire ?
                    </p>
                    <p className="mt-2 text-slate-600">
                      5 % · 10 % · 15 %
                    </p>
                  </div>

                  <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
                    <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
                      Option B
                    </p>
                    <p className="mt-3 text-lg font-semibold text-slate-900">
                      Merci, Sofia
                    </p>
                    <p className="mt-2 text-slate-600">
                      Photo · nom · montant · évaluation
                    </p>
                  </div>
                </div>

                <p>
                  Les deux sont des paiements numériques.
                </p>

                <p>
                  Mais ils ne donnent pas tout à fait la même impression.
                </p>

                <p>
                  Un pourboire n'a jamais vraiment été seulement un transfert
                  de quelques unités monétaires d'un compte à un autre. C'est
                  un petit geste de reconnaissance.
                </p>

                <p>
                  Un bon pourboire numérique devrait préserver cette partie.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                De la personne au téléphone — puis de nouveau à la personne
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  C'est précisément cette idée que nous trouvons la plus
                  intéressante chez Click4tip.
                </p>

                <p>
                  Une entreprise peut utiliser des QR codes pour des employés
                  individuels, des équipes ou des répartitions de pourboires.
                  Le client voit à qui ou à quoi le pourboire est destiné,
                  choisit un montant et paie numériquement.
                </p>

                <p>
                  En coulisses, la technologie gère le paiement et, si
                  nécessaire, la répartition.
                </p>

                <p>
                  Pour le client, l'idée reste beaucoup plus simple :
                </p>

                <p className="text-xl font-semibold text-slate-900">
                  Garder la technologie en arrière-plan. Remettre la personne
                  au premier plan.
                </p>
              </div>
            </section>

            <section className="rounded-3xl bg-slate-900 p-7 text-white sm:p-9">
              <h2 className="text-2xl font-semibold">
                La technologie a changé. La raison, non.
              </h2>

              <div className="mt-4 space-y-4 text-slate-200">
                <p>
                  Les pièces sont devenues des cartes. Les cartes sont devenues
                  des téléphones. Les téléphones ont appris à scanner des QR codes.
                </p>

                <p>
                  Un pourboire reste une petite façon de dire :
                  <strong className="text-white">
                    {" "}J'ai vu ce que vous avez fait. Merci.
                  </strong>
                </p>

                <p>
                  Et cette partie mérite d'être conservée.
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
                  Federal Reserve Bank of Richmond —{" "}
                  <a
                    href="https://www.richmondfed.org/publications/research/econ_focus/2024/q1_q2_economic_history"
                    target="_blank"
                    rel="noreferrer"
                    className="underline hover:text-slate-700"
                  >
                    Tipping: From Scourge of Democracy to American Ritual
                  </a>
                </li>

                <li>
                  Journal of Cultural Economics —{" "}
                  <a
                    href="https://link.springer.com/article/10.1007/s10824-025-09559-9"
                    target="_blank"
                    rel="noreferrer"
                    className="underline hover:text-slate-700"
                  >
                    QR code-enabled tips to street performers at the Edinburgh Fringe Festival
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
