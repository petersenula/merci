import type { Metadata } from "next";
import Link from "next/link";
import StoryLandingCta from "../../StoryLandingCta";

const canonicalUrl =
  "https://www.click4tip.ch/stories/it/mance-digitali-svizzera";

export const metadata: Metadata = {
  title: "Mance digitali in Svizzera: il contante cala. Le mance restano.",
  description:
    "Come funzionano le mance in Svizzera, perché le mance digitali e tramite QR code stanno diventando più importanti e cosa potrebbe cambiare con il dibattito politico del 2026.",
  alternates: {
    canonical: canonicalUrl,
    languages: {
      en: "https://www.click4tip.ch/stories/digital-tipping-switzerland",
      de: "https://www.click4tip.ch/stories/de/digitales-trinkgeld-schweiz",
      fr: "https://www.click4tip.ch/stories/fr/pourboire-digital-suisse",
      it: canonicalUrl,
    },
  },
  openGraph: {
    type: "article",
    url: canonicalUrl,
    title: "Mance digitali in Svizzera: il contante cala. Le mance restano.",
    description:
      "Gli svizzeri continuano a lasciare mance. Il contante diventa meno importante. Le mance digitali stanno diventando un tema concreto per ristorazione e hotellerie.",
    siteName: "Click4tip",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Mance digitali in Svizzera: il contante cala. Le mance restano.",
  description:
    "Come funzionano le mance in Svizzera, perché le mance digitali e tramite QR code stanno diventando più importanti e cosa potrebbe cambiare con il dibattito politico del 2026.",
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
  datePublished: "2026-09-12",
  dateModified: "2026-09-12",
};

export default function ManceDigitaliSvizzeraPage() {
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
              Mance digitali · Svizzera · Pagamenti senza contanti
            </p>

            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
              Mance digitali in Svizzera: il contante cala. Le mance restano.
            </h1>

            <p className="mt-5 text-xl leading-8 text-slate-600">
              La Svizzera ha smesso da decenni di far dipendere gli stipendi del
              personale di servizio dalle mance. Le mance, però, sono rimaste.
              Ora il contante sta diminuendo — e questa vecchia abitudine ha
              bisogno di un nuovo modo per continuare.
            </p>

            <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
              <span>Click4tip Stories</span>
              <span>·</span>
              <span>Circa 8 min di lettura</span>
              <span>·</span>
              <span>Aggiornato a settembre 2026</span>
            </div>
          </header>

          <div className="mt-12 space-y-10 text-[17px] leading-8 text-slate-700">
            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                La Svizzera ha una storia delle mance un po’ particolare
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Oggi in Svizzera la mancia è facoltativa.
                  Il servizio è già incluso nel prezzo.
                </p>

                <p>
                  Sembra normale. Ma non è sempre stato così.
                </p>

                <p>
                  Fino agli anni Settanta, in una parte della ristorazione il
                  servizio non era completamente incluso nel prezzo. Una parte
                  veniva finanziata direttamente attraverso le mance.
                </p>

                <p>
                  Nel 1974 il sistema cambiò. Il principio del
                  <em> servizio incluso</em> divenne lo standard nella
                  ristorazione svizzera.
                </p>

                <p>
                  Da quel momento gli stipendi non dovevano più dipendere dalle
                  mance obbligatorie. Ogni importo extra lasciato dal cliente
                  diventava volontario.
                </p>

                <p>
                  In breve: lo stipendio è diventato stipendio — e la mancia è
                  tornata a essere un grazie.
                </p>
              </div>
            </section>

            <aside className="rounded-2xl border border-green-200 bg-green-50 p-6">
              <p className="font-semibold text-green-900">
                La versione svizzera della mancia
              </p>

              <p className="mt-2 text-green-900/80">
                Il servizio è incluso nel prezzo. La mancia è facoltativa.
                Se la lasci, decidi tu quanto dare — e, idealmente, anche a chi.
              </p>
            </aside>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Gli svizzeri continuano a lasciare mance
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Facoltativa non significa rara.
                </p>

                <p>
                  Uno studio rappresentativo della ZHAW condotto su 1.000
                  persone nella Svizzera tedesca, francese e italiana mostra
                  che circa due terzi dei clienti nei ristoranti con servizio
                  lasciano di solito o sempre una mancia.
                </p>

                <p>
                  La maggior parte degli intervistati indica un importo compreso
                  tra il 5% e il 10% del conto.
                </p>

                <p>
                  Esistono anche differenze regionali: circa il 10% è più comune
                  nella Svizzera tedesca, mentre il 5% è più frequente nella
                  Svizzera francese e italiana.
                </p>

                <p>
                  L’idea di base, quindi, è ancora molto viva.
                </p>

                <p>
                  I clienti svizzeri vogliono ancora premiare un buon servizio.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Il problema: la Svizzera sta diventando sempre più cashless
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Il modo in cui paghiamo, invece, sta cambiando rapidamente.
                </p>

                <p>
                  Secondo lo Swiss Payment Monitor di ZHAW e Università di
                  San Gallo, i dispositivi mobili sono ormai il metodo di
                  pagamento più utilizzato in Svizzera.
                </p>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 p-5">
                    <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                      Mobile
                    </p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">
                      31,4%
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-5">
                    <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                      Carta di debito
                    </p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">
                      23,8%
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-5">
                    <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                      Contanti
                    </p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">
                      23,0%
                    </p>
                  </div>
                </div>

                <p>
                  Ed ecco un problema molto svizzero del 2026:
                </p>

                <div className="rounded-2xl bg-slate-100 p-6 text-slate-800">
                  <p>Pagare il conto del ristorante con il telefono.</p>
                  <p className="mt-2">Rimettere il telefono in tasca.</p>
                  <p className="mt-2 font-semibold">
                    E poi iniziare a cercare monete per lasciare la mancia.
                  </p>
                </div>

                <p>
                  La voglia di lasciare una mancia c’è ancora.
                </p>

                <p>
                  Il contante molto meno.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Perché molti clienti preferiscono ancora i contanti per le mance
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Ed è qui che la storia diventa interessante.
                </p>

                <p>
                  Molte persone pagano il conto digitalmente, ma tornano ai
                  contanti quando arriva il momento della mancia.
                </p>

                <p>
                  Lo studio della ZHAW evidenzia tre ragioni importanti:
                </p>

                <ul className="list-disc space-y-2 pl-6">
                  <li>controllo su dove finisce il denaro,</li>
                  <li>il carattere personale del gesto,</li>
                  <li>
                    e la fiducia che la mancia arrivi davvero alla persona che
                    ha fornito il servizio.
                  </li>
                </ul>

                <p>
                  La vera sfida non è quindi soltanto:
                  <strong> “Come rendiamo digitale la mancia?”</strong>
                </p>

                <p>
                  La domanda migliore è:
                  <strong>
                    {" "}Come rendiamo digitale la mancia senza renderla meno
                    personale?
                  </strong>
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Che cos’è una mancia digitale?
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Una mancia digitale è semplicemente una mancia lasciata senza
                  utilizzare contanti fisici.
                </p>

                <p>
                  Può funzionare in diversi modi.
                </p>

                <p>
                  Un terminale può chiedere se vuoi aggiungere una mancia prima
                  di pagare il conto.
                </p>

                <p>
                  Un hotel può offrire una pagina digitale per le mance.
                </p>

                <p>
                  Un cliente può scansionare un QR code e lasciare la mancia
                  direttamente dal telefono.
                </p>

                <p>
                  Il pagamento può poi essere effettuato con TWINT, carta,
                  Apple Pay, Google Pay o un altro metodo digitale disponibile.
                </p>

                <p>
                  La differenza importante non è soltanto come si sposta il
                  denaro.
                </p>

                <p>
                  Conta anche ciò che il cliente vede e comprende prima di
                  pagare.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Perché la mancia tramite QR code può essere diversa
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Un QR code può separare la mancia dal conto principale.
                </p>

                <p>
                  Questo è importante perché la mancia non deve diventare
                  semplicemente un’altra riga all’interno del pagamento del
                  ristorante.
                </p>

                <p>
                  Il QR code può portare alla pagina di una persona specifica,
                  di un team, di un reparto di hotel o di uno schema di
                  distribuzione delle mance.
                </p>

                <p>
                  Il cliente vede a chi è destinata la mancia prima di pagare.
                </p>

                <p>
                  In questo modo torna qualcosa che il contante sapeva fare
                  molto bene: la trasparenza.
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 p-5">
                    <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                      Anonimo
                    </p>
                    <p className="mt-3 text-lg font-semibold text-slate-900">
                      Aggiungere il 10% di mancia?
                    </p>
                    <p className="mt-2 text-slate-600">
                      Il cliente potrebbe non sapere chi la riceve.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
                    <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
                      Personale
                    </p>
                    <p className="mt-3 text-lg font-semibold text-slate-900">
                      Grazie, Sofia
                    </p>
                    <p className="mt-2 text-slate-600">
                      La persona o il team sono visibili prima del pagamento.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                E poi c’è la questione fiscale
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Qui le cose diventano meno semplici.
                </p>

                <p>
                  Il fatto che una mancia sia volontaria non significa
                  automaticamente che tutte le mance vengano trattate allo
                  stesso modo dal punto di vista fiscale e delle assicurazioni
                  sociali.
                </p>

                <p>
                  Secondo le regole svizzere attuali, una mancia può essere
                  considerata salario determinante per le assicurazioni sociali
                  se rappresenta una parte significativa della remunerazione.
                </p>

                <p>
                  Allo stesso tempo, nei settori in cui il servizio è già
                  incluso nel prezzo, le mance volontarie sono state
                  tradizionalmente considerate un piccolo extra separato.
                </p>

                <p>
                  L’imposta federale diretta aggiunge un ulteriore livello:
                  in linea di principio, la mancia è reddito imponibile.
                </p>

                <p>
                  Finché la mancia viene data in contanti, molte cose rimangono
                  difficili da vedere. Le mance digitali, invece, lasciano
                  tracce elettroniche molto più chiare.
                </p>

                <p className="text-sm text-slate-500">
                  Questo articolo offre una panoramica generale e non costituisce
                  consulenza fiscale o legale. Le aziende dovrebbero verificare
                  le regole applicabili alla propria situazione specifica.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                2026: le mance digitali arrivano al Parlamento svizzero
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Nel 2026 il dibattito è passato dai ristoranti e dagli uffici
                  paghe alla politica federale.
                </p>

                <p>
                  Una mozione del consigliere agli Stati Beat Rieder chiede una
                  regola più chiara: le mance volontarie nei settori in cui il
                  servizio è già incluso nei prezzi non dovrebbero, in linea di
                  principio, essere considerate né salario determinante né
                  reddito imponibile.
                </p>

                <p>
                  Nel marzo 2026 il Consiglio degli Stati ha approvato la
                  mozione con 42 voti contro 1 e un’astensione.
                </p>

                <p>
                  Il Consiglio federale si oppone alla proposta.
                </p>

                <p>
                  Il suo argomento è che la protezione tramite le assicurazioni
                  sociali è importante e che un’esenzione totale potrebbe
                  includere anche casi in cui le mance costituiscono una parte
                  significativa del reddito.
                </p>

                <p>
                  I sostenitori della mozione sostengono invece che le mance
                  digitali volontarie non dovrebbero essere trattate peggio
                  delle mance in contanti soltanto perché sono più facili da
                  tracciare.
                </p>

                <p>
                  La commissione competente del Consiglio nazionale ha poi
                  raccomandato di approvare la mozione con 16 voti contro 9.
                </p>

                <p>
                  Il Consiglio nazionale dovrebbe occuparsi del tema durante
                  la sessione autunnale del 2026.
                </p>
              </div>
            </section>

            <aside className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <p className="font-semibold text-amber-900">
                Perché aggiorneremo questa pagina
              </p>

              <p className="mt-2 text-amber-900/80">
                Il dibattito politico è ancora in corso. Quando il Parlamento
                prenderà la prossima decisione, aggiorneremo questo articolo
                invece di lasciare online una spiegazione diventata obsoleta.
              </p>
            </aside>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Cosa significa per hotel, ristoranti e aziende di servizi?
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Il problema pratico esiste indipendentemente dalla prossima
                  decisione del Parlamento.
                </p>

                <p>
                  I clienti pagano sempre più spesso digitalmente.
                </p>

                <p>
                  I dipendenti continuano ad apprezzare le mance.
                </p>

                <p>
                  E i clienti vogliono ancora sapere chi le riceve.
                </p>

                <p>
                  Le aziende hanno quindi bisogno di soluzioni di mancia
                  digitale semplici per il cliente e trasparenti per il team.
                </p>

                <p>
                  Questo può significare mostrare una singola persona, un team
                  oppure spiegare chiaramente come verrà distribuita la mancia.
                </p>

                <p>
                  La tecnologia dovrebbe ridurre gli attriti, non creare una
                  nuova incertezza.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Le mance digitali dovrebbero risolvere il problema del contante senza perdere il lato umano
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  La Svizzera non ha bisogno di tornare a un vecchio sistema in
                  cui il personale di servizio dipendeva dalle mance per avere
                  una retribuzione adeguata.
                </p>

                <p>
                  Non è questo il punto.
                </p>

                <p>
                  L’opportunità interessante è molto più semplice:
                </p>

                <p>
                  mantenere salari corretti, lasciare la mancia volontaria e
                  rendere comunque facile per il cliente dire grazie — anche
                  senza contanti in tasca.
                </p>

                <p>
                  In Click4tip pensiamo che la migliore esperienza di mancia
                  digitale sia quella in cui la tecnologia quasi scompare.
                </p>

                <p>
                  Il cliente vede la persona o il team, sceglie un importo,
                  paga digitalmente — e capisce dove sta andando il denaro.
                </p>
              </div>
            </section>

            <section className="rounded-3xl bg-slate-900 p-7 text-white sm:p-9">
              <h2 className="text-2xl font-semibold">
                Il contante cambia. Il grazie non deve cambiare.
              </h2>

              <div className="mt-4 space-y-4 text-slate-200">
                <p>
                  Le mance digitali non servono a sostituire il significato
                  della mancia.
                </p>

                <p>
                  Danno semplicemente a un vecchio gesto un metodo di pagamento
                  che abbiamo ancora in tasca.
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
                  ZHAW & Università di San Gallo —{" "}
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
                  Parlamento svizzero —{" "}
                  <a
                    href="https://www.parlament.ch/de/services/news/Seiten/2026/20260302180407926194158159026_bsd207.aspx"
                    target="_blank"
                    rel="noreferrer"
                    className="underline hover:text-slate-700"
                  >
                    Votazione del Consiglio degli Stati sulle mance volontarie
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
