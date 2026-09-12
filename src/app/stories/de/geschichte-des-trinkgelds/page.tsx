import type { Metadata } from "next";
import Link from "next/link";
import StoryLandingCta from "../../StoryLandingCta";

const canonicalUrl =
  "https://www.click4tip.ch/stories/de/geschichte-des-trinkgelds";

export const metadata: Metadata = {
  title: "Von Münzen zu QR-Codes: Eine kurze Geschichte des Trinkgelds",
  description:
    "Wie sich Trinkgeld von Münzen und 'Stimmt so' zu Karten, Smartphones und QR-Codes entwickelt hat — und warum digitales Trinkgeld trotzdem persönlich bleiben kann.",
  alternates: {
    canonical: canonicalUrl,
    languages: {
      en: "https://www.click4tip.ch/stories/history-of-tipping",
      de: canonicalUrl,
      fr: "https://www.click4tip.ch/stories/fr/histoire-du-pourboire",
      it: "https://www.click4tip.ch/stories/it/storia-della-mancia",
    },
  },
  openGraph: {
    type: "article",
    url: canonicalUrl,
    title: "Von Münzen zu QR-Codes: Eine kurze Geschichte des Trinkgelds",
    description:
      "Menschen bedanken sich seit Jahrhunderten mit Trinkgeld. Der Grund ist ähnlich geblieben. Die Technik ganz und gar nicht.",
    siteName: "Click4tip",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Von Münzen zu QR-Codes: Eine kurze Geschichte des Trinkgelds",
  description:
    "Wie sich Trinkgeld von Münzen und 'Stimmt so' zu Karten, Smartphones und QR-Codes entwickelt hat.",
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
};

export default function GeschichteDesTrinkgeldsPage() {
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
              Trinkgeld · Geschichte · Digitales Bezahlen
            </p>

            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
              Von Münzen zu QR-Codes: Eine kurze Geschichte des Trinkgelds
            </h1>

            <p className="mt-5 text-xl leading-8 text-slate-600">
              Menschen bedanken sich seit Jahrhunderten mit Trinkgeld.
              Der Grund ist erstaunlich ähnlich geblieben. Die Technik nicht.
            </p>

            <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
              <span>Click4tip Stories</span>
              <span>·</span>
              <span>Ca. 6 Min. Lesezeit</span>
            </div>
          </header>

          <div className="mt-12 space-y-10 text-[17px] leading-8 text-slate-700">
            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Bevor Trinkgeld Trinkgeld hiess
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Niemand weiss genau, wann zum ersten Mal jemand beschlossen
                  hat, dass guter Service ein bisschen Extra-Geld verdient.
                </p>

                <p>
                  Eine Form dieser Gewohnheit lässt sich bis ins England des
                  16. Jahrhunderts zurückverfolgen. Wohlhabende Reisende, die
                  bei anderen zu Gast waren, gaben dem Hauspersonal Geld für
                  zusätzliche Arbeit während ihres Aufenthalts. Diese Zahlungen
                  wurden <em>vails</em> genannt.
                </p>

                <p>
                  Die Idee setzte sich durch. Vielleicht ein bisschen zu gut.
                </p>

                <p>
                  Schon im 18. Jahrhundert beschwerten sich Gäste darüber, wie
                  viel sie am Ende eines Besuchs zusätzlich zahlen sollten.
                  Es gab sogar organisierte Versuche, diese Gewohnheit wieder
                  abzuschaffen.
                </p>

                <p>
                  Hat nicht geklappt.
                </p>

                <p>
                  Falls Du also schon einmal auf einen Trinkgeld-Bildschirm
                  geschaut und gedacht hast: "War das Essen nicht schon teuer
                  genug?" — Glückwunsch. Eine Version dieser Diskussion gab es
                  schon vor ein paar hundert Jahren.
                </p>
              </div>
            </section>

            <aside className="rounded-2xl border border-green-200 bg-green-50 p-6">
              <p className="font-semibold text-green-900">
                Kleiner historischer Mythos-Check
              </p>

              <p className="mt-2 text-green-900/80">
                Vielleicht hast Du schon gehört, dass TIP für "To Insure
                Promptness" oder "To Insure Prompt Service" stehen soll.
                Klingt nett, ist aber sehr wahrscheinlich nicht der Ursprung
                des Wortes. Das Wort wurde schon verwendet, bevor diese
                berühmte Kaffeehaus-Geschichte überhaupt entstanden sein soll.
              </p>
            </aside>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Dann kam „Stimmt so“
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Sehr lange war Trinkgeld etwas ganz Physisches.
                </p>

                <p>
                  Die Rechnung war 46. Du hast 50 gegeben und gesagt:
                  „Stimmt so.“
                </p>

                <p>
                  Die ganze Sache dauerte ungefähr drei Sekunden.
                </p>

                <p>
                  Und vor allem war völlig klar, für wen das Dankeschön gedacht
                  war. Das Geld ging direkt von einer Hand in die andere.
                </p>

                <p>
                  Im Hotel war es ähnlich: ein paar Münzen für das Gepäck,
                  etwas für das Housekeeping, etwas extra für jemanden, der ein
                  Problem gelöst oder den Aufenthalt besonders angenehm gemacht
                  hat.
                </p>

                <p>
                  Trinkgeld war Geld. Aber eben auch ein kleiner sozialer
                  Moment:
                  <strong> Ich habe gesehen, was Du gemacht hast. Danke.</strong>
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Karten änderten das Bezahlen. Bargeld hielt das Trinkgeld am Leben.
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Kredit- und Debitkarten haben verändert, wie wir Rechnungen
                  bezahlen. Trinkgeld blieb aber lange trotzdem bar.
                </p>

                <p>
                  Rechnung mit Karte. Ein paar Münzen auf den Tisch.
                  Problem gelöst.
                </p>

                <p>
                  Bis die Münzen verschwanden.
                </p>

                <p>
                  Geldbörsen wurden kleiner. Smartphones übernahmen die Arbeit
                  der Karten. Kontaktloses Bezahlen wurde normal. Mobile
                  Payments ebenfalls.
                </p>

                <p>
                  Und plötzlich gab es diese Situation:
                </p>

                <div className="rounded-2xl bg-slate-100 p-6 text-slate-800">
                  <p>
                    „Der Service war super. Ich würde gern Trinkgeld geben.“
                  </p>
                  <p className="mt-2 font-semibold">
                    „Perfekt. Hast Du Bargeld?“
                  </p>
                  <p className="mt-2">„...nein.“</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Das Kartenterminal wollte helfen
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Eine Lösung lag nahe: Trinkgeld direkt über dasselbe Terminal
                  wie die Rechnung zahlen.
                </p>

                <p>
                  Das funktioniert. Es ist schnell. Es ist bequem.
                </p>

                <p>
                  Aber etwas hat sich verändert.
                </p>

                <p>
                  Statt fünf Franken oder Euro direkt Maria zu geben, die sich
                  um Deinen Tisch gekümmert hat, fügst Du jetzt vielleicht 10 %
                  zu einer Zahlung an ein Unternehmen hinzu.
                </p>

                <p>
                  Wo landet das Geld? Bei Maria? Beim ganzen Team? In der Küche?
                  In einem Pool? Als Gast weisst Du es oft nicht.
                </p>

                <p>
                  Das Trinkgeld wurde digital. Aber auch ein bisschen anonymer.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Der Wunsch, Danke zu sagen, ist mit dem Bargeld nicht verschwunden
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Und genau das ist der interessante Teil.
                </p>

                <p>
                  Menschen haben nicht plötzlich aufgehört, guten Service zu
                  schätzen, nur weil sie inzwischen mit dem Smartphone zahlen.
                </p>

                <p>
                  Die Gewohnheit blieb. Der alte Weg verschwand.
                </p>

                <p>
                  Deshalb taucht digitales Trinkgeld heute in Restaurants,
                  Hotels, Lieferdiensten, Salons, Taxis, auf Festivals und an
                  vielen anderen Orten auf, an denen Menschen persönliche
                  Dienstleistungen erbringen.
                </p>

                <p>
                  Die Frage ist längst nicht mehr, ob Trinkgeld digital sein
                  kann.
                </p>

                <p>
                  Spannender ist:
                  <strong> Kann digitales Trinkgeld trotzdem persönlich bleiben?</strong>
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Der QR-Code betritt die Bühne
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  QR-Codes bieten darauf eine erstaunlich einfache Antwort.
                </p>

                <p>
                  Code scannen. Seite öffnen. Betrag wählen. Digital bezahlen.
                </p>

                <p>
                  Keine App installieren. Keine Münzen am Boden der Tasche
                  suchen. Und das Trinkgeld muss nicht Teil der eigentlichen
                  Rechnung sein.
                </p>

                <p>
                  QR-Trinkgeld wird inzwischen in sehr unterschiedlichen
                  Situationen eingesetzt. Forschende haben zum Beispiel
                  Strassenkünstler beim Edinburgh Fringe Festival untersucht,
                  die QR-Codes für bargeldloses Trinkgeld nutzen.
                </p>

                <p>
                  Dabei zeigte sich etwas, das ziemlich logisch klingt, sobald
                  man es hört: Auch das, was nach dem Scan erscheint, ist
                  wichtig.
                </p>

                <p>
                  Der QR-Code ist nur die Tür. Entscheidend ist, was dahinter
                  kommt.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Digital muss nicht unpersönlich sein
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Stell Dir zwei Situationen vor.
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 p-5">
                    <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                      Variante A
                    </p>
                    <p className="mt-3 text-lg font-semibold text-slate-900">
                      Trinkgeld hinzufügen?
                    </p>
                    <p className="mt-2 text-slate-600">
                      5 % · 10 % · 15 %
                    </p>
                  </div>

                  <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
                    <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
                      Variante B
                    </p>
                    <p className="mt-3 text-lg font-semibold text-slate-900">
                      Danke, Sofia
                    </p>
                    <p className="mt-2 text-slate-600">
                      Foto · Name · Trinkgeldbetrag · Bewertung
                    </p>
                  </div>
                </div>

                <p>
                  Beides sind digitale Zahlungen.
                </p>

                <p>
                  Aber sie fühlen sich nicht ganz gleich an.
                </p>

                <p>
                  Bei Trinkgeld ging es nie nur darum, ein paar Geldeinheiten
                  von einem Konto auf ein anderes zu verschieben. Es ist ein
                  kleines Zeichen von Anerkennung.
                </p>

                <p>
                  Gutes digitales Trinkgeld sollte genau diesen Teil behalten.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Vom Menschen zum Smartphone — und zurück zum Menschen
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Genau diese Idee finden wir bei Click4tip besonders spannend.
                </p>

                <p>
                  Ein Unternehmen kann QR-Codes für einzelne Mitarbeitende,
                  Teams oder gemeinsame Trinkgeldverteilungen verwenden. Der
                  Gast sieht, für wen oder was das Trinkgeld gedacht ist,
                  wählt einen Betrag und bezahlt digital.
                </p>

                <p>
                  Im Hintergrund kümmert sich die Technik um die Zahlung und,
                  falls nötig, um die Verteilung.
                </p>

                <p>
                  Für den Gast bleibt die Idee viel einfacher:
                </p>

                <p className="text-xl font-semibold text-slate-900">
                  Die Technik bleibt im Hintergrund. Der Mensch kommt wieder in
                  den Vordergrund.
                </p>
              </div>
            </section>

            <section className="rounded-3xl bg-slate-900 p-7 text-white sm:p-9">
              <h2 className="text-2xl font-semibold">
                Die Technik hat sich verändert. Der Grund nicht.
              </h2>

              <div className="mt-4 space-y-4 text-slate-200">
                <p>
                  Münzen wurden zu Karten. Karten wurden zu Smartphones.
                  Smartphones lernten QR-Codes zu scannen.
                </p>

                <p>
                  Trinkgeld ist immer noch eine kleine Art zu sagen:
                  <strong className="text-white">
                    {" "}Ich habe gesehen, was Du gemacht hast. Danke.
                  </strong>
                </p>

                <p>
                  Und genau das sollten wir behalten.
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
