import type { Metadata } from "next";
import Link from "next/link";
import StoryLandingCta from "../../StoryLandingCta";

const canonicalUrl =
  "https://www.click4tip.ch/stories/it/storia-della-mancia";

export const metadata: Metadata = {
  title: "Dalle monete ai QR code: una breve storia della mancia",
  description:
    "Come la mancia è passata dalle monete e dal 'tenga il resto' alle carte, agli smartphone e ai QR code — senza perdere il suo lato personale.",
  alternates: {
    canonical: canonicalUrl,
    languages: {
      en: "https://www.click4tip.ch/stories/history-of-tipping",
      de: "https://www.click4tip.ch/stories/de/geschichte-des-trinkgelds",
      fr: "https://www.click4tip.ch/stories/fr/histoire-du-pourboire",
      it: canonicalUrl,
    },
  },
  openGraph: {
    type: "article",
    url: canonicalUrl,
    title: "Dalle monete ai QR code: una breve storia della mancia",
    description:
      "Da secoli diciamo grazie anche con una mancia. Il motivo è rimasto simile. La tecnologia decisamente no.",
    siteName: "Click4tip",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Dalle monete ai QR code: una breve storia della mancia",
  description:
    "Come la mancia è passata dalle monete e dal 'tenga il resto' alle carte, agli smartphone e ai QR code.",
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
  inLanguage: "it",
};

export default function StoriaDellaManciaPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="min-h-screen bg-white px-6 pb-20 pt-16 sm:pt-20">
        <article className="mx-auto max-w-3xl">
          <Link
            href="/stories/it"
            className="text-sm font-semibold text-green-700 hover:text-green-800"
          >
            ← Torna alle Stories
          </Link>

          <header className="mt-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
              Mance · Storia · Pagamenti digitali
            </p>

            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
              Dalle monete ai QR code: una breve storia della mancia
            </h1>

            <p className="mt-5 text-xl leading-8 text-slate-600">
              Da secoli diciamo grazie anche con una mancia.
              Il motivo è rimasto sorprendentemente simile. La tecnologia no.
            </p>

            <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
              <span>Click4tip Stories</span>
              <span>·</span>
              <span>Circa 6 min di lettura</span>
            </div>
          </header>

          <div className="mt-12 space-y-10 text-[17px] leading-8 text-slate-700">
            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Prima che la mancia si chiamasse mancia
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Nessuno sa esattamente quando qualcuno abbia deciso per la
                  prima volta che un buon servizio meritava qualcosa in più.
                </p>

                <p>
                  Una versione di questa abitudine risale all'Inghilterra del
                  XVI secolo. I viaggiatori benestanti che soggiornavano a casa
                  di altre persone lasciavano del denaro alla servitù per il
                  lavoro extra svolto durante la visita. Questi pagamenti erano
                  chiamati <em>vails</em>.
                </p>

                <p>
                  L'idea prese piede. Forse anche un po' troppo.
                </p>

                <p>
                  Già nel XVIII secolo gli ospiti si lamentavano di quanto
                  fossero tenuti a lasciare alla fine del soggiorno. Ci furono
                  perfino tentativi organizzati di eliminare questa abitudine.
                </p>

                <p>
                  Non funzionarono.
                </p>

                <p>
                  Quindi, se hai mai guardato uno schermo per la mancia pensando
                  "Ma la cena non costava già abbastanza?", complimenti:
                  una versione della stessa discussione esisteva già qualche
                  secolo fa.
                </p>
              </div>
            </section>

            <aside className="rounded-2xl border border-green-200 bg-green-50 p-6">
              <p className="font-semibold text-green-900">
                Piccola pausa per sfatare un mito
              </p>

              <p className="mt-2 text-green-900/80">
                Potresti aver sentito dire che TIP significa
                "To Insure Promptness" oppure "To Insure Prompt Service".
                È una bella storia, ma quasi certamente non è questa l'origine
                della parola. Il termine veniva già utilizzato prima delle
                famose storie sui caffè a cui viene attribuito questo acronimo.
              </p>
            </aside>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Poi arrivò il “tenga il resto”
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Per molto tempo la mancia è stata qualcosa di completamente
                  fisico.
                </p>

                <p>
                  Il conto era 46. Davi 50 e dicevi:
                  “Tenga il resto.”
                </p>

                <p>
                  L'intera operazione durava circa tre secondi.
                </p>

                <p>
                  E soprattutto era chiarissimo a chi fosse destinato quel
                  grazie. Il denaro passava direttamente da una mano all'altra.
                </p>

                <p>
                  Negli hotel funzionava più o meno allo stesso modo: qualche
                  moneta per chi portava i bagagli, qualcosa per il personale
                  delle camere, un extra per chi aveva risolto un problema o
                  reso il soggiorno più piacevole.
                </p>

                <p>
                  La mancia era denaro. Ma era anche un piccolo momento umano:
                  <strong> Ho visto quello che hai fatto. Grazie.</strong>
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Le carte hanno cambiato il pagamento. Il contante ha tenuto viva la mancia.
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Le carte di credito e di debito hanno cambiato il modo in cui
                  paghiamo il conto, ma per molto tempo la mancia è rimasta in
                  contanti.
                </p>

                <p>
                  Conto con la carta. Qualche moneta sul tavolo.
                  Problema risolto.
                </p>

                <p>
                  Finché le monete hanno iniziato a sparire.
                </p>

                <p>
                  I portafogli sono diventati più piccoli. Gli smartphone hanno
                  iniziato a fare il lavoro delle carte. Il contactless è
                  diventato normale. Anche i pagamenti mobili.
                </p>

                <p>
                  E così è comparsa una nuova situazione:
                </p>

                <div className="rounded-2xl bg-slate-100 p-6 text-slate-800">
                  <p>
                    “Il servizio è stato ottimo. Vorrei lasciare una mancia.”
                  </p>
                  <p className="mt-2 font-semibold">
                    “Perfetto. Hai contanti?”
                  </p>
                  <p className="mt-2">“...no.”</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Il terminale di pagamento ha provato ad aiutare
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Una soluzione sembrava ovvia: aggiungere la mancia sullo
                  stesso terminale utilizzato per il conto.
                </p>

                <p>
                  Funziona. È veloce. È comodo.
                </p>

                <p>
                  Ma qualcosa è cambiato.
                </p>

                <p>
                  Invece di dare cinque franchi o cinque euro direttamente a
                  Maria, che si è occupata del tuo tavolo, ora magari aggiungi
                  il 10% a una transazione con un'azienda.
                </p>

                <p>
                  Dove finiscono quei soldi? A Maria? A tutto il team? In
                  cucina? In un fondo comune? Come cliente, spesso non lo sai.
                </p>

                <p>
                  La mancia è diventata digitale. Ma anche un po' più anonima.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Il desiderio di dire grazie non è scomparso insieme al contante
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Ed è qui che la cosa diventa interessante.
                </p>

                <p>
                  Le persone non hanno improvvisamente smesso di apprezzare un
                  buon servizio solo perché ora pagano con il telefono.
                </p>

                <p>
                  L'abitudine è rimasta. È scomparso il vecchio meccanismo.
                </p>

                <p>
                  Per questo la mancia digitale sta comparendo nei ristoranti,
                  negli hotel, nei servizi di consegna, nei saloni, nei taxi,
                  nei festival e in molti altri luoghi dove una persona offre
                  un servizio personale.
                </p>

                <p>
                  La domanda ormai non è più se una mancia possa essere digitale.
                </p>

                <p>
                  La domanda più interessante è:
                  <strong> può restare personale?</strong>
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Entra in scena il QR code
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  I QR code offrono una risposta sorprendentemente semplice.
                </p>

                <p>
                  Scansiona il codice. Apri la pagina. Scegli un importo.
                  Paga digitalmente.
                </p>

                <p>
                  Nessuna app da scaricare. Nessuna caccia alle monete sul
                  fondo della borsa. E la mancia non deve essere aggiunta al
                  conto principale.
                </p>

                <p>
                  Le mance tramite QR code vengono già utilizzate in contesti
                  molto diversi. Alcuni ricercatori, per esempio, hanno
                  studiato gli artisti di strada all'Edinburgh Fringe Festival
                  che utilizzavano QR code per ricevere mance senza contanti.
                </p>

                <p>
                  Lo studio ha mostrato qualcosa che sembra ovvio appena lo
                  senti: conta anche ciò che una persona vede dopo la scansione.
                </p>

                <p>
                  Il QR code è solo la porta. Quello che c'è dietro è la parte
                  importante.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Digitale non significa impersonale
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Immagina due situazioni.
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 p-5">
                    <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                      Opzione A
                    </p>
                    <p className="mt-3 text-lg font-semibold text-slate-900">
                      Aggiungere una mancia?
                    </p>
                    <p className="mt-2 text-slate-600">
                      5% · 10% · 15%
                    </p>
                  </div>

                  <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
                    <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
                      Opzione B
                    </p>
                    <p className="mt-3 text-lg font-semibold text-slate-900">
                      Grazie, Sofia
                    </p>
                    <p className="mt-2 text-slate-600">
                      Foto · nome · importo · valutazione
                    </p>
                  </div>
                </div>

                <p>
                  Entrambe sono pagamenti digitali.
                </p>

                <p>
                  Ma non trasmettono esattamente la stessa sensazione.
                </p>

                <p>
                  Una mancia non è mai stata soltanto il trasferimento di
                  qualche unità di valuta da un conto a un altro. È un piccolo
                  gesto di riconoscimento.
                </p>

                <p>
                  Una buona esperienza di mancia digitale dovrebbe conservare
                  proprio questa parte.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Dalla persona al telefono — e di nuovo alla persona
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  È proprio questa l'idea che troviamo più interessante in
                  Click4tip.
                </p>

                <p>
                  Un'azienda può utilizzare QR code per singoli dipendenti,
                  team o sistemi condivisi di distribuzione delle mance.
                  Il cliente vede a chi o a cosa è destinata la mancia,
                  sceglie un importo e paga digitalmente.
                </p>

                <p>
                  Dietro le quinte, la tecnologia gestisce il pagamento e, se
                  necessario, anche la distribuzione.
                </p>

                <p>
                  Per il cliente, invece, l'idea resta molto più semplice:
                </p>

                <p className="text-xl font-semibold text-slate-900">
                  Tenere la tecnologia sullo sfondo. Riportare la persona in
                  primo piano.
                </p>
              </div>
            </section>

            <section className="rounded-3xl bg-slate-900 p-7 text-white sm:p-9">
              <h2 className="text-2xl font-semibold">
                La tecnologia è cambiata. Il motivo no.
              </h2>

              <div className="mt-4 space-y-4 text-slate-200">
                <p>
                  Le monete sono diventate carte. Le carte sono diventate
                  telefoni. I telefoni hanno imparato a scansionare QR code.
                </p>

                <p>
                  Una mancia resta un piccolo modo per dire:
                  <strong className="text-white">
                    {" "}Ho visto quello che hai fatto. Grazie.
                  </strong>
                </p>

                <p>
                  E questa parte vale la pena conservarla.
                </p>
              </div>

              <StoryLandingCta
                lang="it"
                label="Scopri Click4tip →"
              />
            </section>

            <section className="border-t border-slate-200 pt-8 text-sm leading-6 text-slate-500">
              <h2 className="font-semibold text-slate-700">
                Fonti e approfondimenti
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
