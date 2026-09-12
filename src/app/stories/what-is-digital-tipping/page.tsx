import type { Metadata } from "next";
import Link from "next/link";
import StoryLandingCta from "../StoryLandingCta";

const canonicalUrl =
  "https://www.click4tip.ch/stories/what-is-digital-tipping";

export const metadata: Metadata = {
  title: "What Is Digital Tipping? How Cashless & QR Tipping Works",
  description:
    "A simple guide to digital tipping: how QR code and cashless tips work, whether guests need an app, who receives the money, and where digital tipping is used.",
  alternates: {
    canonical: canonicalUrl,
    languages: {
      en: canonicalUrl,
      de: "https://www.click4tip.ch/stories/de/was-ist-digitales-trinkgeld",
      fr: "https://www.click4tip.ch/stories/fr/quest-ce-que-le-pourboire-numerique",
      it: "https://www.click4tip.ch/stories/it/cosa-sono-le-mance-digitali",
    },
  },
  openGraph: {
    type: "article",
    url: canonicalUrl,
    title: "What Is Digital Tipping? How Cashless & QR Tipping Works",
    description:
      "Digital tipping explained simply: QR codes, cashless tips, payment methods, individual and team tips, and what makes a good tipping experience.",
    siteName: "Click4tip",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "What Is Digital Tipping? How Cashless & QR Tipping Works",
  description:
    "A simple guide to digital tipping: how QR code and cashless tips work, whether guests need an app, who receives the money, and where digital tipping is used.",
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
  inLanguage: "en",
  datePublished: "2026-09-12",
  dateModified: "2026-09-12",
};

export default function WhatIsDigitalTippingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="min-h-screen bg-white px-6 pb-20 pt-16 sm:pt-20">
        <article className="mx-auto max-w-3xl">
          <Link
            href="/stories"
            className="text-sm font-semibold text-green-700 hover:text-green-800"
          >
            ← Back to Stories
          </Link>

          <header className="mt-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
              Digital tipping · QR codes · Cashless payments
            </p>

            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
              What Is Digital Tipping? How Cashless & QR Tipping Works
            </h1>

            <p className="mt-5 text-xl leading-8 text-slate-600">
              Digital tipping lets a customer leave a tip without cash. It can
              happen on a payment terminal, through a digital tipping page or
              by scanning a QR code and paying from a phone.
            </p>

            <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
              <span>Click4tip Stories</span>
              <span>·</span>
              <span>About 8 min read</span>
              <span>·</span>
              <span>September 2026</span>
            </div>
          </header>

          <div className="mt-12 space-y-10 text-[17px] leading-8 text-slate-700">
            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                What is digital tipping?
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Digital tipping — sometimes called cashless tipping — means
                  leaving a tip using a digital payment instead of coins or
                  banknotes.
                </p>

                <p>
                  The idea is simple.
                </p>

                <p>
                  A customer wants to thank someone for good service. Instead of
                  reaching for cash, the customer uses a card or phone.
                </p>

                <p>
                  The tip can be added to a card payment, paid on a separate
                  tipping page or sent after scanning a QR code.
                </p>

                <p>
                  The technology is new. The reason for using it is not.
                </p>

                <p>
                  It is still a way to say: <strong>thank you.</strong>
                </p>
              </div>
            </section>

            <aside className="rounded-2xl border border-green-200 bg-green-50 p-6">
              <p className="font-semibold text-green-900">
                Digital tipping in one sentence
              </p>

              <p className="mt-2 text-green-900/80">
                A digital tip is a voluntary tip paid electronically instead of
                with physical cash.
              </p>
            </aside>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                How does digital tipping work?
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  The exact process depends on the system, but most digital
                  tipping follows the same basic steps.
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 p-5">
                    <p className="text-sm font-semibold text-green-700">
                      1
                    </p>
                    <p className="mt-2 font-semibold text-slate-900">
                      Open the tipping option
                    </p>
                    <p className="mt-2 text-slate-600">
                      Scan a QR code, open a link or use the tip option on a
                      payment terminal.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-5">
                    <p className="text-sm font-semibold text-green-700">
                      2
                    </p>
                    <p className="mt-2 font-semibold text-slate-900">
                      Choose the tip
                    </p>
                    <p className="mt-2 text-slate-600">
                      Select a suggested amount or enter a custom amount.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-5">
                    <p className="text-sm font-semibold text-green-700">
                      3
                    </p>
                    <p className="mt-2 font-semibold text-slate-900">
                      Pay digitally
                    </p>
                    <p className="mt-2 text-slate-600">
                      Use an available digital payment method such as a card,
                      mobile wallet or local payment method.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-5">
                    <p className="text-sm font-semibold text-green-700">
                      4
                    </p>
                    <p className="mt-2 font-semibold text-slate-900">
                      The tip is recorded
                    </p>
                    <p className="mt-2 text-slate-600">
                      The system records the payment and routes or allocates it
                      according to the tipping setup.
                    </p>
                  </div>
                </div>

                <p>
                  No coins. No awkward search through pockets. No need to ask
                  whether anyone can break a large banknote.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                What is QR code tipping?
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  QR code tipping is one form of digital tipping.
                </p>

                <p>
                  A business or service worker displays a QR code. The code can
                  be printed on a card, receipt, table sign, room information,
                  badge, counter or another convenient place.
                </p>

                <p>
                  The customer scans it with a smartphone camera.
                </p>

                <p>
                  Instead of opening a menu or product page, the QR code opens a
                  tipping page.
                </p>

                <p>
                  The customer chooses an amount and completes the payment
                  digitally.
                </p>

                <p>
                  This means the tip can be completely separate from the main
                  bill.
                </p>

                <p>
                  That can be useful when the person receiving the tip is not
                  the same person who handled the payment — for example a hotel
                  housekeeper, concierge, porter or another member of a service
                  team.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Is QR tipping the same as tipping on a payment terminal?
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Not quite.
                </p>

                <p>
                  With terminal tipping, the tip is usually offered as part of
                  the same payment flow as the bill.
                </p>

                <p>
                  You might see:
                </p>

                <div className="rounded-2xl bg-slate-100 p-6 text-center">
                  <p className="text-lg font-semibold text-slate-900">
                    Add a tip?
                  </p>
                  <p className="mt-3 text-slate-600">
                    5% · 10% · 15% · Custom
                  </p>
                </div>

                <p>
                  With QR tipping, the tipping flow can exist independently of
                  the purchase.
                </p>

                <p>
                  That makes it possible to leave a tip before, during or after
                  the main transaction — and sometimes even when there was no
                  traditional checkout at all.
                </p>

                <p>
                  A hotel guest, for example, may have paid for the room online
                  days before meeting the person they later want to thank.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Do customers need an app to leave a digital tip?
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  They should not have to.
                </p>

                <p>
                  A good QR tipping experience opens directly in the phone's
                  browser. The customer scans, chooses a tip and pays.
                </p>

                <p>
                  Requiring someone to download an app, create an account and
                  remember a password just to leave a small thank-you adds
                  friction at exactly the wrong moment.
                </p>

                <p>
                  Digital tipping works best when it is faster than finding
                  cash, not slower.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Who actually receives a digital tip?
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  This depends on how the business has set up its tipping
                  system.
                </p>

                <p>
                  A digital tip can be intended for:
                </p>

                <ul className="list-disc space-y-2 pl-6">
                  <li>one individual employee,</li>
                  <li>a team or department,</li>
                  <li>several employees sharing a tip,</li>
                  <li>
                    or a business that later distributes tips according to its
                    internal rules.
                  </li>
                </ul>

                <p>
                  This is one of the most important differences between digital
                  tipping systems.
                </p>

                <p>
                  The payment itself is only half of the question.
                </p>

                <p>
                  The other half is:
                  <strong> where does the money go?</strong>
                </p>

                <p>
                  A good tipping experience should make that understandable to
                  the customer.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Individual tips or team tips?
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Both can make sense.
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
                    <p className="font-semibold text-slate-900">
                      Individual tipping
                    </p>
                    <p className="mt-2 text-slate-600">
                      The customer sees a specific person and leaves the tip for
                      that person.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-5">
                    <p className="font-semibold text-slate-900">
                      Team tipping
                    </p>
                    <p className="mt-2 text-slate-600">
                      The tip is intended for a team and can be distributed
                      according to a defined scheme.
                    </p>
                  </div>
                </div>

                <p>
                  The right model depends on the service.
                </p>

                <p>
                  A hairdresser may be tipped individually. A restaurant may
                  prefer to share tips between service staff and kitchen. A
                  hotel may use different arrangements for housekeeping,
                  reception, concierge and other teams.
                </p>

                <p>
                  Digital systems make these different models possible without
                  requiring a separate jar full of coins for every situation.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                What payment methods can be used for digital tips?
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Available payment methods depend on the country and the
                  tipping provider.
                </p>

                <p>
                  They can include:
                </p>

                <ul className="list-disc space-y-2 pl-6">
                  <li>credit and debit cards,</li>
                  <li>Apple Pay,</li>
                  <li>Google Pay,</li>
                  <li>mobile payment services,</li>
                  <li>and country-specific payment methods.</li>
                </ul>

                <p>
                  In Switzerland, for example, TWINT is an important mobile
                  payment method.
                </p>

                <p>
                  The best choice is usually not to force every customer into
                  one payment method, but to make familiar options available
                  where possible.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Where is digital tipping useful?
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Digital tipping is especially useful wherever good service
                  happens but cash is becoming less common.
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 p-5">
                    <p className="font-semibold text-slate-900">
                      Hotels
                    </p>
                    <p className="mt-2 text-slate-600">
                      Housekeeping, concierge, reception, porters, breakfast
                      teams and other guest-facing staff.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-5">
                    <p className="font-semibold text-slate-900">
                      Restaurants & cafés
                    </p>
                    <p className="mt-2 text-slate-600">
                      Individual servers, shared teams, counter service and
                      cashless locations.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-5">
                    <p className="font-semibold text-slate-900">
                      Salons & personal services
                    </p>
                    <p className="mt-2 text-slate-600">
                      Hairdressers, beauty professionals and other specialists
                      who build a direct relationship with customers.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-5">
                    <p className="font-semibold text-slate-900">
                      Delivery & service work
                    </p>
                    <p className="mt-2 text-slate-600">
                      Situations where the service happens away from a
                      traditional payment counter.
                    </p>
                  </div>
                </div>

                <p>
                  The common thread is simple: there is someone a customer may
                  want to thank, but there may be no cash exchange at that
                  moment.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Why is digital tipping becoming more relevant?
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Because payments changed faster than tipping habits.
                </p>

                <p>
                  People increasingly pay by card, phone and mobile wallet.
                  Many carry little or no cash.
                </p>

                <p>
                  But the desire to reward good service did not disappear when
                  coins disappeared from people's pockets.
                </p>

                <p>
                  That creates a gap.
                </p>

                <p>
                  Traditional tipping assumes the customer has cash available.
                  Modern payment behaviour often means they do not.
                </p>

                <p>
                  Digital tipping exists to bridge that gap.
                </p>
              </div>
            </section>

            <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <p className="font-semibold text-slate-900">
                A useful distinction
              </p>

              <p className="mt-2 text-slate-600">
                Digital tipping should make it possible to tip. It should not
                make customers feel forced to tip.
              </p>
            </aside>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                What makes a good digital tipping experience?
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  The best systems remove friction without removing choice.
                </p>

                <p>
                  For the customer, that means:
                </p>

                <ul className="list-disc space-y-2 pl-6">
                  <li>no mandatory app download,</li>
                  <li>no unnecessary account creation,</li>
                  <li>a clear choice of tip amount,</li>
                  <li>the ability to enter a custom amount,</li>
                  <li>familiar payment methods,</li>
                  <li>and clarity about who receives the tip.</li>
                </ul>

                <p>
                  It should also be easy to say no.
                </p>

                <p>
                  A tip is meaningful because it is voluntary.
                </p>

                <p>
                  Turning a thank-you into a pressure tactic rather defeats the
                  point.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                How Click4tip approaches digital tipping
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Click4tip is built around a simple idea: keep the person
                  visible.
                </p>

                <p>
                  A QR code can lead to an individual employee, a team or a
                  defined tipping scheme.
                </p>

                <p>
                  The customer can see who the tip is for, choose an amount and
                  pay digitally.
                </p>

                <p>
                  For businesses, this makes it possible to support different
                  tipping structures without forcing every service interaction
                  through the same payment terminal.
                </p>

                <p>
                  The goal is not to make tipping more complicated.
                </p>

                <p>
                  It is to make the cashless version feel as natural as handing
                  someone a tip used to feel.
                </p>
              </div>
            </section>

            <section className="rounded-3xl bg-slate-900 p-7 text-white sm:p-9">
              <h2 className="text-2xl font-semibold">
                No cash? You can still say thank you.
              </h2>

              <div className="mt-4 space-y-4 text-slate-200">
                <p>
                  Digital tipping gives an old habit a payment method that fits
                  the way people pay today.
                </p>
              </div>

              <StoryLandingCta
                lang="en"
                label="Discover Click4tip →"
              />
            </section>

            <section className="border-t border-slate-200 pt-8">
              <h2 className="text-xl font-semibold text-slate-900">
                Related reading
              </h2>

              <div className="mt-4 space-y-3">
                <Link
                  href="/stories/digital-tipping-switzerland"
                  className="block font-semibold text-green-700 hover:text-green-800"
                >
                  Digital Tipping in Switzerland: Cash Is Disappearing. Tipping Isn’t. →
                </Link>

                <Link
                  href="/stories/history-of-tipping"
                  className="block font-semibold text-green-700 hover:text-green-800"
                >
                  From Coins to QR Codes: A Short History of Tipping →
                </Link>
              </div>
            </section>
          </div>
        </article>
      </main>
    </>
  );
}
