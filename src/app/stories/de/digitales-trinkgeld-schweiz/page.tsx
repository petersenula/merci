import type { Metadata } from "next";
import Link from "next/link";
import StoryLandingCta from "../../StoryLandingCta";

const canonicalUrl =
  "https://www.click4tip.ch/stories/de/digitales-trinkgeld-schweiz";

export const metadata: Metadata = {
  title: "Digitales Trinkgeld in der Schweiz: Bargeld verschwindet. Trinkgeld nicht.",
  description:
    "Wie Trinkgeld in der Schweiz funktioniert, warum bargeldloses und QR-Trinkgeld wichtiger wird und was die politische Debatte 2026 verändern könnte.",
  alternates: {
    canonical: canonicalUrl,
    languages: {
      en: "https://www.click4tip.ch/stories/digital-tipping-switzerland",
      de: canonicalUrl,
      fr: "https://www.click4tip.ch/stories/fr/pourboire-digital-suisse",
      it: "https://www.click4tip.ch/stories/it/mance-digitali-svizzera",
    },
  },
  openGraph: {
    type: "article",
    url: canonicalUrl,
    title: "Digitales Trinkgeld in der Schweiz: Bargeld verschwindet. Trinkgeld nicht.",
    description:
      "Schweizer Gäste geben weiterhin Trinkgeld. Bargeld wird weniger wichtig. Digitales Trinkgeld wird damit zu einem echten Thema für Gastronomie und Hotellerie.",
    siteName: "Click4tip",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Digitales Trinkgeld in der Schweiz: Bargeld verschwindet. Trinkgeld nicht.",
  description:
    "Wie Trinkgeld in der Schweiz funktioniert, warum bargeldloses und QR-Trinkgeld wichtiger wird und was die politische Debatte 2026 verändern könnte.",
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
  inLanguage: "de",
  datePublished: "2026-09-12",
  dateModified: "2026-09-12",
};

export default function DigitalesTrinkgeldSchweizPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="min-h-screen bg-white px-6 pb-20 pt-16 sm:pt-20">
        <article className="mx-auto max-w-3xl">
          <Link
            href="/stories/de"
            className="text-sm font-semibold text-green-700 hover:text-green-800"
          >
            ← Zurück zu Stories
          </Link>

          <header className="mt-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
              Digitales Trinkgeld · Schweiz · Bargeldloses Bezahlen
            </p>

            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
              Digitales Trinkgeld in der Schweiz: Bargeld verschwindet. Trinkgeld nicht.
            </h1>

            <p className="mt-5 text-xl leading-8 text-slate-600">
              Die Schweiz hat schon vor Jahrzehnten aufgehört, Servicepersonal
              über Trinkgeld zu bezahlen. Trinkgeld selbst ist aber geblieben.
              Jetzt verschwindet das Bargeld — und die alte Gewohnheit braucht
              einen neuen Weg.
            </p>

            <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
              <span>Click4tip Stories</span>
              <span>·</span>
              <span>Ca. 8 Min. Lesezeit</span>
              <span>·</span>
              <span>Aktualisiert September 2026</span>
            </div>
          </header>

          <div className="mt-12 space-y-10 text-[17px] leading-8 text-slate-700">
            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Die Schweiz hat eine etwas besondere Trinkgeldgeschichte
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Wer heute in der Schweiz essen geht, muss kein Trinkgeld
                  geben. Der Service ist bereits im Preis enthalten.
                </p>

                <p>
                  Das klingt selbstverständlich. War es aber nicht immer.
                </p>

                <p>
                  Bis in die 1970er-Jahre hinein war Service in Teilen der
                  Gastronomie nicht vollständig im Preis enthalten. Ein Teil
                  wurde direkt über Trinkgeld finanziert.
                </p>

                <p>
                  1974 änderte sich das System. In der Schweizer Gastronomie
                  setzte sich das Prinzip <em>Service inbegriffen</em> durch.
                </p>

                <p>
                  Von da an sollten Löhne nicht mehr vom verpflichtenden
                  Trinkgeld abhängen. Alles, was Gäste zusätzlich geben,
                  wurde freiwillig.
                </p>

                <p>
                  Kurz gesagt: Der Lohn wurde zum Lohn — und das Trinkgeld
                  wieder zum Dankeschön.
                </p>
              </div>
            </section>

            <aside className="rounded-2xl border border-green-200 bg-green-50 p-6">
              <p className="font-semibold text-green-900">
                Die Schweizer Version von Trinkgeld
              </p>

              <p className="mt-2 text-green-900/80">
                Der Service ist im Preis enthalten. Trinkgeld ist freiwillig.
                Wenn Du welches gibst, entscheidest Du wie viel — und idealerweise
                auch, für wen.
              </p>
            </aside>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Die Schweizer geben weiterhin Trinkgeld
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Freiwillig bedeutet nicht selten.
                </p>

                <p>
                  Eine repräsentative ZHAW-Studie mit 1'000 Personen aus der
                  Deutschschweiz, der Romandie und der italienischsprachigen
                  Schweiz zeigt: Rund zwei Drittel der Gäste in Restaurants mit
                  Bedienung geben meistens oder immer Trinkgeld.
                </p>

                <p>
                  Die meisten Befragten nennen einen Betrag zwischen 5 % und
                  10 % der Rechnung.
                </p>

                <p>
                  Es gibt auch regionale Unterschiede: Rund 10 % sind in der
                  Deutschschweiz verbreiteter, während in der Romandie und im
                  Tessin 5 % häufiger genannt werden.
                </p>

                <p>
                  Die Grundidee lebt also weiter.
                </p>

                <p>
                  Schweizer Gäste möchten guten Service weiterhin belohnen.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Das Problem: Die Schweiz wird bargeldloser
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Die Art, wie wir bezahlen, verändert sich dagegen schnell.
                </p>

                <p>
                  Laut Swiss Payment Monitor von ZHAW und Universität St. Gallen
                  sind mobile Geräte inzwischen das am häufigsten genutzte
                  Zahlungsmittel in der Schweiz.
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
                      Debitkarte
                    </p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">
                      23,8 %
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-5">
                    <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                      Bargeld
                    </p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">
                      23,0 %
                    </p>
                  </div>
                </div>

                <p>
                  Daraus entsteht ein ziemlich typisches Schweizer Problem im Jahr 2026:
                </p>

                <div className="rounded-2xl bg-slate-100 p-6 text-slate-800">
                  <p>Restaurantrechnung mit dem Smartphone bezahlen.</p>
                  <p className="mt-2">Smartphone wieder einstecken.</p>
                  <p className="mt-2 font-semibold">
                    Und dann anfangen, nach Münzen fürs Trinkgeld zu suchen.
                  </p>
                </div>

                <p>
                  Der Wunsch, Trinkgeld zu geben, ist noch da.
                </p>

                <p>
                  Das Bargeld oft nicht.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Warum viele Gäste Trinkgeld trotzdem lieber bar geben
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Und hier wird es interessant.
                </p>

                <p>
                  Viele Menschen bezahlen die Rechnung digital und wechseln
                  fürs Trinkgeld trotzdem wieder zu Bargeld.
                </p>

                <p>
                  Die ZHAW-Studie nennt drei wichtige Gründe:
                </p>

                <ul className="list-disc space-y-2 pl-6">
                  <li>Kontrolle darüber, wohin das Geld geht,</li>
                  <li>der persönliche Charakter der Geste,</li>
                  <li>
                    und das Vertrauen, dass das Trinkgeld wirklich bei der
                    Serviceperson ankommt.
                  </li>
                </ul>

                <p>
                  Die eigentliche Herausforderung lautet also nicht nur:
                  <strong> „Wie machen wir Trinkgeld digital?“</strong>
                </p>

                <p>
                  Die bessere Frage ist:
                  <strong>
                    {" "}Wie machen wir Trinkgeld digital, ohne dass es weniger
                    persönlich wirkt?
                  </strong>
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Was ist digitales Trinkgeld überhaupt?
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Digitales Trinkgeld bedeutet ganz einfach: Trinkgeld geben,
                  ohne physisches Bargeld zu benutzen.
                </p>

                <p>
                  Das kann auf verschiedene Arten passieren.
                </p>

                <p>
                  Ein Kartenterminal kann vor der Zahlung fragen, ob Trinkgeld
                  hinzugefügt werden soll.
                </p>

                <p>
                  Ein Hotel kann eine digitale Trinkgeldseite anbieten.
                </p>

                <p>
                  Ein Gast kann einen QR-Code scannen und mit dem Smartphone
                  Trinkgeld geben.
                </p>

                <p>
                  Bezahlt werden kann dann zum Beispiel mit TWINT, Karte,
                  Apple Pay, Google Pay oder einer anderen verfügbaren
                  digitalen Zahlungsmethode.
                </p>

                <p>
                  Entscheidend ist aber nicht nur, wie das Geld technisch
                  übertragen wird.
                </p>

                <p>
                  Wichtig ist auch, was der Gast sieht und versteht, bevor er
                  bezahlt.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Warum Trinkgeld per QR-Code anders sein kann
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Ein QR-Code kann Trinkgeld von der eigentlichen Rechnung
                  trennen.
                </p>

                <p>
                  Das ist wichtig, weil Trinkgeld nicht einfach zu einer
                  weiteren Position in einer Restaurantzahlung werden muss.
                </p>

                <p>
                  Der QR-Code kann zu einer Seite für eine bestimmte Person,
                  ein Team, eine Hotelabteilung oder eine festgelegte
                  Trinkgeldverteilung führen.
                </p>

                <p>
                  Der Gast sieht vor der Zahlung, für wen das Trinkgeld gedacht
                  ist.
                </p>

                <p>
                  Damit kommt etwas zurück, was Bargeld sehr gut konnte:
                  Transparenz.
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 p-5">
                    <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                      Anonym
                    </p>
                    <p className="mt-3 text-lg font-semibold text-slate-900">
                      10 % Trinkgeld hinzufügen?
                    </p>
                    <p className="mt-2 text-slate-600">
                      Der Gast weiss möglicherweise nicht, wer es erhält.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
                    <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
                      Persönlich
                    </p>
                    <p className="mt-3 text-lg font-semibold text-slate-900">
                      Danke, Sofia
                    </p>
                    <p className="mt-2 text-slate-600">
                      Person oder Team sind vor der Zahlung sichtbar.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Und dann ist da noch die Steuerfrage
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Hier wird es weniger einfach.
                </p>

                <p>
                  Dass Trinkgeld freiwillig ist, bedeutet nicht automatisch,
                  dass jedes Trinkgeld steuerlich und sozialversicherungsrechtlich
                  gleich behandelt wird.
                </p>

                <p>
                  Nach den heutigen Schweizer Regeln kann Trinkgeld für die
                  Sozialversicherungen als massgebender Lohn gelten, wenn es
                  einen wesentlichen Teil des Einkommens ausmacht.
                </p>

                <p>
                  Gleichzeitig wurden freiwillige Trinkgelder in Branchen mit
                  bereits im Preis enthaltenem Service traditionell als
                  kleiner, zusätzlicher Betrag behandelt.
                </p>

                <p>
                  Beim direkten Bundessteuerrecht kommt eine weitere Ebene
                  hinzu: Trinkgeld gilt grundsätzlich als steuerbares Einkommen.
                </p>

                <p>
                  Solange Trinkgeld bar übergeben wird, bleibt vieles schwer
                  sichtbar. Bei digitalem Trinkgeld entstehen dagegen klare
                  elektronische Spuren.
                </p>

                <p className="text-sm text-slate-500">
                  Dieser Artikel ist eine allgemeine Übersicht und keine Steuer-
                  oder Rechtsberatung. Unternehmen sollten prüfen, welche Regeln
                  für ihre konkrete Situation gelten.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                2026: Digitales Trinkgeld erreicht das Schweizer Parlament
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  2026 wanderte diese Diskussion von Restaurants und
                  Lohnbuchhaltungen in die Bundespolitik.
                </p>

                <p>
                  Eine Motion von Ständerat Beat Rieder verlangt eine klarere
                  Regel: Freiwillige Trinkgelder in Branchen, in denen der
                  Service bereits im Preis enthalten ist, sollen grundsätzlich
                  weder als massgebender Lohn noch als steuerbares Einkommen
                  behandelt werden.
                </p>

                <p>
                  Im März 2026 nahm der Ständerat die Motion mit 42 zu 1 Stimmen
                  bei einer Enthaltung an.
                </p>

                <p>
                  Der Bundesrat lehnt den Vorschlag ab.
                </p>

                <p>
                  Sein Argument: Der Schutz durch Sozialversicherungen ist
                  wichtig, und eine vollständige Ausnahme könnte auch Fälle
                  erfassen, in denen Trinkgelder einen erheblichen Teil des
                  Einkommens ausmachen.
                </p>

                <p>
                  Die Befürworter argumentieren dagegen, dass freiwillige
                  digitale Trinkgelder nicht schlechter behandelt werden sollen
                  als Bargeld, nur weil sie leichter nachvollziehbar sind.
                </p>

                <p>
                  Die zuständige Kommission des Nationalrats empfahl später
                  mit 16 zu 9 Stimmen, die Motion anzunehmen.
                </p>

                <p>
                  Der Nationalrat wird sich voraussichtlich in der Herbstsession
                  2026 mit dem Thema befassen.
                </p>
              </div>
            </section>

            <aside className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <p className="font-semibold text-amber-900">
                Warum wir diese Seite aktualisieren werden
              </p>

              <p className="mt-2 text-amber-900/80">
                Die politische Diskussion läuft weiter. Sobald das Parlament
                den nächsten Entscheid trifft, aktualisieren wir diesen Artikel,
                statt eine veraltete Erklärung online stehen zu lassen.
              </p>
            </aside>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Was bedeutet das für Hotels, Restaurants und Dienstleistungsbetriebe?
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Das praktische Problem besteht unabhängig davon, wie das
                  Parlament entscheidet.
                </p>

                <p>
                  Gäste bezahlen immer häufiger digital.
                </p>

                <p>
                  Mitarbeitende schätzen Trinkgeld weiterhin.
                </p>

                <p>
                  Und Gäste möchten weiterhin wissen, wer es erhält.
                </p>

                <p>
                  Unternehmen brauchen deshalb digitale Trinkgeldlösungen, die
                  für Gäste einfach und für Teams transparent sind.
                </p>

                <p>
                  Das kann bedeuten, eine einzelne Person sichtbar zu machen,
                  ein Team zu zeigen oder klar zu erklären, wie das Trinkgeld
                  verteilt wird.
                </p>

                <p>
                  Die Technik sollte Reibung entfernen — nicht eine neue
                  Unsicherheit schaffen.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Digitales Trinkgeld sollte das Bargeldproblem lösen, ohne den Menschen zu verlieren
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Die Schweiz muss nicht zu einem alten System zurückkehren, in
                  dem Servicepersonal auf Trinkgeld angewiesen war, um einen
                  angemessenen Lohn zu erhalten.
                </p>

                <p>
                  Darum geht es nicht.
                </p>

                <p>
                  Die interessante Möglichkeit ist viel einfacher:
                </p>

                <p>
                  faire Löhne behalten, Trinkgeld freiwillig lassen und es
                  Gästen trotzdem leicht machen, Danke zu sagen — auch ohne
                  Bargeld in der Tasche.
                </p>

                <p>
                  Bei Click4tip finden wir digitale Trinkgeldlösungen dann am
                  besten, wenn die Technik fast unsichtbar wird.
                </p>

                <p>
                  Der Gast sieht die Person oder das Team, wählt einen Betrag,
                  bezahlt digital — und versteht, wohin das Geld geht.
                </p>
              </div>
            </section>

            <section className="rounded-3xl bg-slate-900 p-7 text-white sm:p-9">
              <h2 className="text-2xl font-semibold">
                Bargeld verändert sich. Das Dankeschön muss es nicht.
              </h2>

              <div className="mt-4 space-y-4 text-slate-200">
                <p>
                  Digitales Trinkgeld soll nicht die Bedeutung von Trinkgeld
                  ersetzen.
                </p>

                <p>
                  Es gibt einer alten Geste einfach eine Zahlungsmethode, die
                  heute noch in unseren Taschen steckt.
                </p>
              </div>

              <StoryLandingCta
                lang="de"
                label="Click4tip entdecken →"
              />
            </section>

            <section className="border-t border-slate-200 pt-8 text-sm leading-6 text-slate-500">
              <h2 className="font-semibold text-slate-700">
                Quellen & weiterführende Links
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
                  ZHAW & Universität St. Gallen —{" "}
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
                  Schweizer Parlament —{" "}
                  <a
                    href="https://www.parlament.ch/de/services/news/Seiten/2026/20260302180407926194158159026_bsd207.aspx"
                    target="_blank"
                    rel="noreferrer"
                    className="underline hover:text-slate-700"
                  >
                    Abstimmung im Ständerat zu freiwilligen Trinkgeldern
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
