import type { Metadata } from "next";
import Link from "next/link";
import StoryLandingCta from "../../StoryLandingCta";

const canonicalUrl =
  "https://www.click4tip.ch/stories/it/cosa-sono-le-mance-digitali";

export const metadata: Metadata = {
  title: "Cosa sono le mance digitali? Come funzionano le mance cashless e tramite QR code",
  description:
    "Una guida semplice alle mance digitali: come funzionano i QR code, se serve un’app, chi riceve il denaro e dove vengono utilizzate.",
  alternates: {
    canonical: canonicalUrl,
    languages: {
      en: "https://www.click4tip.ch/stories/what-is-digital-tipping",
      de: "https://www.click4tip.ch/stories/de/was-ist-digitales-trinkgeld",
      fr: "https://www.click4tip.ch/stories/fr/quest-ce-que-le-pourboire-numerique",
      it: canonicalUrl,
    },
  },
  openGraph: {
    type: "article",
    url: canonicalUrl,
    title: "Cosa sono le mance digitali? Come funzionano le mance cashless e tramite QR code",
    description:
      "Le mance digitali spiegate in modo semplice: QR code, pagamenti cashless, metodi di pagamento, mance individuali e di team.",
    siteName: "Click4tip",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Cosa sono le mance digitali? Come funzionano le mance cashless e tramite QR code",
  description:
    "Una guida semplice alle mance digitali: come funzionano i QR code, se serve un’app, chi riceve il denaro e dove vengono utilizzate.",
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

export default function CosaSonoLeManceDigitaliPage() {
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
              Mance digitali · QR code · Pagamenti cashless
            </p>

            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
              Cosa sono le mance digitali? Come funzionano le mance cashless e tramite QR code
            </h1>

            <p className="mt-5 text-xl leading-8 text-slate-600">
              Le mance digitali permettono a un cliente di lasciare una mancia
              senza usare contanti. Può succedere su un terminale di pagamento,
              tramite una pagina digitale oppure scansionando un QR code con lo
              smartphone.
            </p>

            <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
              <span>Click4tip Stories</span>
              <span>·</span>
              <span>Circa 8 min di lettura</span>
              <span>·</span>
              <span>Settembre 2026</span>
            </div>
          </header>

          <div className="mt-12 space-y-10 text-[17px] leading-8 text-slate-700">
            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Cosa sono le mance digitali?
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Le mance digitali — chiamate anche mance cashless — sono
                  mance pagate elettronicamente invece che con monete o
                  banconote.
                </p>

                <p>
                  L’idea è semplice.
                </p>

                <p>
                  Un cliente vuole ringraziare qualcuno per un buon servizio.
                  Invece di cercare contanti, usa una carta o il telefono.
                </p>

                <p>
                  La mancia può essere aggiunta a un pagamento con carta,
                  versata su una pagina separata oppure inviata dopo aver
                  scansionato un QR code.
                </p>

                <p>
                  La tecnologia è nuova. Il motivo no.
                </p>

                <p>
                  Si tratta sempre di dire <strong>grazie</strong>.
                </p>
              </div>
            </section>

            <aside className="rounded-2xl border border-green-200 bg-green-50 p-6">
              <p className="font-semibold text-green-900">
                Le mance digitali in una frase
              </p>

              <p className="mt-2 text-green-900/80">
                Una mancia digitale è una mancia volontaria pagata
                elettronicamente invece che in contanti.
              </p>
            </aside>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Come funzionano le mance digitali?
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Il processo preciso dipende dal sistema, ma i passaggi di base
                  sono quasi sempre gli stessi.
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 p-5">
                    <p className="text-sm font-semibold text-green-700">1</p>
                    <p className="mt-2 font-semibold text-slate-900">
                      Aprire l’opzione mancia
                    </p>
                    <p className="mt-2 text-slate-600">
                      Scansionare un QR code, aprire un link oppure usare
                      l’opzione mancia su un terminale.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-5">
                    <p className="text-sm font-semibold text-green-700">2</p>
                    <p className="mt-2 font-semibold text-slate-900">
                      Scegliere l’importo
                    </p>
                    <p className="mt-2 text-slate-600">
                      Selezionare un importo suggerito oppure inserirne uno
                      personalizzato.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-5">
                    <p className="text-sm font-semibold text-green-700">3</p>
                    <p className="mt-2 font-semibold text-slate-900">
                      Pagare digitalmente
                    </p>
                    <p className="mt-2 text-slate-600">
                      Usare una carta, un wallet mobile o un metodo di pagamento
                      locale disponibile.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-5">
                    <p className="text-sm font-semibold text-green-700">4</p>
                    <p className="mt-2 font-semibold text-slate-900">
                      La mancia viene registrata
                    </p>
                    <p className="mt-2 text-slate-600">
                      Il sistema registra il pagamento e lo assegna o distribuisce
                      secondo la configurazione prevista.
                    </p>
                  </div>
                </div>

                <p>
                  Niente monete. Niente ricerca nelle tasche. E nessuno deve
                  chiedere se qualcuno può cambiare una banconota grande.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Cos’è una mancia tramite QR code?
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  La mancia tramite QR code è una forma di mancia digitale.
                </p>

                <p>
                  Un’azienda o una persona che fornisce un servizio mostra un
                  QR code. Può essere stampato su una carta, una ricevuta, un
                  supporto da tavolo, in una camera d’hotel, su un badge o in
                  un altro punto pratico.
                </p>

                <p>
                  Il cliente lo scansiona con la fotocamera dello smartphone.
                </p>

                <p>
                  Invece di aprire un menu o una pagina prodotto, il QR code
                  apre una pagina per lasciare la mancia.
                </p>

                <p>
                  Il cliente sceglie un importo e paga digitalmente.
                </p>

                <p>
                  La mancia può così essere completamente separata dal conto
                  principale.
                </p>

                <p>
                  Questo è utile quando la persona da ringraziare non è la
                  stessa che ha gestito il pagamento — per esempio il personale
                  housekeeping, un concierge o un facchino in hotel.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                La mancia tramite QR code è la stessa cosa della mancia sul terminale?
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Non proprio.
                </p>

                <p>
                  Sul terminale, la mancia viene normalmente proposta nello
                  stesso flusso di pagamento del conto.
                </p>

                <p>
                  Per esempio:
                </p>

                <div className="rounded-2xl bg-slate-100 p-6 text-center">
                  <p className="text-lg font-semibold text-slate-900">
                    Aggiungere una mancia?
                  </p>
                  <p className="mt-3 text-slate-600">
                    5% · 10% · 15% · Importo personalizzato
                  </p>
                </div>

                <p>
                  Con il QR code, la mancia può esistere indipendentemente
                  dall’acquisto principale.
                </p>

                <p>
                  Può quindi essere lasciata prima, durante o dopo il pagamento —
                  talvolta anche senza una cassa tradizionale.
                </p>

                <p>
                  Un ospite d’hotel, per esempio, può aver pagato la camera online
                  giorni prima di incontrare la persona che vuole ringraziare.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                I clienti devono scaricare un’app?
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Non dovrebbe essere necessario.
                </p>

                <p>
                  Una buona esperienza di mancia tramite QR code si apre
                  direttamente nel browser del telefono: scansione, scelta
                  dell’importo, pagamento.
                </p>

                <p>
                  Chiedere a qualcuno di scaricare un’app, creare un account e
                  ricordare una password soltanto per lasciare un piccolo grazie
                  aggiunge attrito nel momento sbagliato.
                </p>

                <p>
                  Le mance digitali funzionano meglio quando sono più rapide
                  della ricerca di contanti — non più lente.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Chi riceve davvero la mancia digitale?
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Dipende da come l’azienda ha configurato il proprio sistema.
                </p>

                <p>
                  Una mancia digitale può essere destinata a:
                </p>

                <ul className="list-disc space-y-2 pl-6">
                  <li>un singolo dipendente,</li>
                  <li>un team o un reparto,</li>
                  <li>più dipendenti che condividono la mancia,</li>
                  <li>
                    oppure un’azienda che la distribuisce successivamente
                    secondo le proprie regole.
                  </li>
                </ul>

                <p>
                  Questa è una delle differenze più importanti tra i vari
                  sistemi di mancia digitale.
                </p>

                <p>
                  Il pagamento è solo metà della questione.
                </p>

                <p>
                  L’altra metà è:
                  <strong> dove finisce il denaro?</strong>
                </p>

                <p>
                  Una buona soluzione dovrebbe renderlo chiaro al cliente.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Mancia individuale o mancia di team?
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Entrambe possono avere senso.
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
                    <p className="font-semibold text-slate-900">
                      Mancia individuale
                    </p>
                    <p className="mt-2 text-slate-600">
                      Il cliente vede una persona specifica e lascia la mancia
                      direttamente per quella persona.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-5">
                    <p className="font-semibold text-slate-900">
                      Mancia di team
                    </p>
                    <p className="mt-2 text-slate-600">
                      La mancia è destinata a un team e può essere distribuita
                      secondo una regola definita.
                    </p>
                  </div>
                </div>

                <p>
                  Il modello giusto dipende dal tipo di servizio.
                </p>

                <p>
                  Un parrucchiere può ricevere una mancia individuale. Un
                  ristorante può preferire condividerla tra sala e cucina.
                  Un hotel può avere modelli diversi per housekeeping,
                  reception, concierge e altri team.
                </p>

                <p>
                  I sistemi digitali rendono possibili questi modelli senza
                  dover avere un barattolo pieno di monete per ogni situazione.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Quali metodi di pagamento possono essere utilizzati?
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  I metodi disponibili dipendono dal Paese e dal fornitore.
                </p>

                <p>
                  Possono includere:
                </p>

                <ul className="list-disc space-y-2 pl-6">
                  <li>carte di credito e di debito,</li>
                  <li>Apple Pay,</li>
                  <li>Google Pay,</li>
                  <li>servizi di pagamento mobile,</li>
                  <li>e metodi specifici per determinati Paesi.</li>
                </ul>

                <p>
                  In Svizzera, per esempio, TWINT è particolarmente importante.
                </p>

                <p>
                  In genere è meglio non costringere tutti a usare un solo
                  metodo, ma offrire opzioni familiari quando possibile.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Dove sono utili le mance digitali?
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Sono particolarmente utili dove c’è un buon servizio ma il
                  contante è sempre meno comune.
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 p-5">
                    <p className="font-semibold text-slate-900">
                      Hotel
                    </p>
                    <p className="mt-2 text-slate-600">
                      Housekeeping, concierge, reception, facchini, team della
                      colazione e altri collaboratori a contatto con gli ospiti.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-5">
                    <p className="font-semibold text-slate-900">
                      Ristoranti & caffè
                    </p>
                    <p className="mt-2 text-slate-600">
                      Camerieri individuali, team, servizio al banco e locali
                      cashless.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-5">
                    <p className="font-semibold text-slate-900">
                      Saloni & servizi personali
                    </p>
                    <p className="mt-2 text-slate-600">
                      Parrucchieri, professionisti beauty e altri specialisti
                      con un rapporto diretto con il cliente.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-5">
                    <p className="font-semibold text-slate-900">
                      Consegne & servizi
                    </p>
                    <p className="mt-2 text-slate-600">
                      Situazioni in cui il servizio avviene lontano da una
                      cassa tradizionale.
                    </p>
                  </div>
                </div>

                <p>
                  Il filo comune è semplice: c’è qualcuno che il cliente vuole
                  ringraziare, ma in quel momento potrebbe non esserci alcuno
                  scambio di contanti.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Perché le mance digitali stanno diventando più importanti?
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Perché i pagamenti sono cambiati più velocemente delle nostre
                  abitudini sulle mance.
                </p>

                <p>
                  Le persone pagano sempre più spesso con carta, telefono o
                  wallet mobile e portano con sé poco o nessun contante.
                </p>

                <p>
                  Ma il desiderio di premiare un buon servizio non è scomparso
                  insieme alle monete dalle nostre tasche.
                </p>

                <p>
                  Questo crea un vuoto.
                </p>

                <p>
                  La mancia tradizionale presuppone che il cliente abbia contanti.
                  I moderni comportamenti di pagamento spesso significano che non
                  è così.
                </p>

                <p>
                  Le mance digitali colmano questo vuoto.
                </p>
              </div>
            </section>

            <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <p className="font-semibold text-slate-900">
                Una distinzione importante
              </p>

              <p className="mt-2 text-slate-600">
                Le mance digitali dovrebbero rendere possibile lasciare una
                mancia. Non dovrebbero far sentire il cliente obbligato.
              </p>
            </aside>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Cosa rende buona un’esperienza di mancia digitale?
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  I sistemi migliori riducono l’attrito senza eliminare la libertà
                  di scelta.
                </p>

                <p>
                  Per il cliente significa:
                </p>

                <ul className="list-disc space-y-2 pl-6">
                  <li>nessun download obbligatorio di un’app,</li>
                  <li>nessuna creazione inutile di un account,</li>
                  <li>una scelta chiara dell’importo,</li>
                  <li>la possibilità di inserire un importo personalizzato,</li>
                  <li>metodi di pagamento familiari,</li>
                  <li>e chiarezza su chi riceve la mancia.</li>
                </ul>

                <p>
                  Deve essere altrettanto facile dire di no.
                </p>

                <p>
                  Una mancia ha valore proprio perché è volontaria.
                </p>

                <p>
                  Trasformare un grazie in pressione andrebbe contro il senso
                  stesso del gesto.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Come Click4tip affronta le mance digitali
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Click4tip parte da un’idea semplice: mantenere visibile la
                  persona.
                </p>

                <p>
                  Un QR code può portare a una persona, a un team oppure a uno
                  schema di distribuzione definito.
                </p>

                <p>
                  Il cliente vede a chi è destinata la mancia, sceglie un
                  importo e paga digitalmente.
                </p>

                <p>
                  Per le aziende significa poter supportare diversi modelli di
                  mancia senza dover far passare ogni interazione dallo stesso
                  terminale.
                </p>

                <p>
                  L’obiettivo non è rendere le mance più complicate.
                </p>

                <p>
                  È fare in modo che la versione cashless sembri naturale
                  quanto dare una mancia direttamente a qualcuno.
                </p>
              </div>
            </section>

            <section className="rounded-3xl bg-slate-900 p-7 text-white sm:p-9">
              <h2 className="text-2xl font-semibold">
                Niente contanti? Puoi comunque dire grazie.
              </h2>

              <div className="mt-4 space-y-4 text-slate-200">
                <p>
                  Le mance digitali danno a una vecchia abitudine un metodo di
                  pagamento adatto a come paghiamo oggi.
                </p>
              </div>

              <StoryLandingCta
                lang="it"
                label="Scopri Click4tip →"
              />
            </section>

            <section className="border-t border-slate-200 pt-8">
              <h2 className="text-xl font-semibold text-slate-900">
                Articoli correlati
              </h2>

              <div className="mt-4 space-y-3">
                <Link
                  href="/stories/it/mance-digitali-svizzera"
                  className="block font-semibold text-green-700 hover:text-green-800"
                >
                  Mance digitali in Svizzera: il contante cala. Le mance restano. →
                </Link>

                <Link
                  href="/stories/it/storia-della-mancia"
                  className="block font-semibold text-green-700 hover:text-green-800"
                >
                  Dalle monete ai QR code: una breve storia della mancia →
                </Link>
              </div>
            </section>
          </div>
        </article>
      </main>
    </>
  );
}
