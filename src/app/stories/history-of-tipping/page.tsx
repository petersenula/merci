import type { Metadata } from "next";
import Link from "next/link";
import StoryLandingCta from "../StoryLandingCta";

const canonicalUrl =
  "https://www.click4tip.ch/stories/history-of-tipping";

export const metadata: Metadata = {
  title: "From Coins to QR Codes: A Short History of Tipping",
  description:
    "How tipping travelled from coins and 'keep the change' to cards, phones and QR codes — and why a digital thank you can still feel personal.",
  alternates: {
    canonical: canonicalUrl,
    languages: {
      en: canonicalUrl,
      de: "https://www.click4tip.ch/stories/de/geschichte-des-trinkgelds",
      fr: "https://www.click4tip.ch/stories/fr/histoire-du-pourboire",
      it: "https://www.click4tip.ch/stories/it/storia-della-mancia",
    },
  },
  openGraph: {
    type: "article",
    url: canonicalUrl,
    title: "From Coins to QR Codes: A Short History of Tipping",
    description:
      "People have been saying thank you with money for centuries. The reason stayed similar. The technology definitely did not.",
    siteName: "Click4tip",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "From Coins to QR Codes: A Short History of Tipping",
  description:
    "How tipping travelled from coins and 'keep the change' to cards, phones and QR codes.",
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
};

export default function HistoryOfTippingPage() {
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
              Tipping · History · Digital payments
            </p>

            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
              From Coins to QR Codes: A Short History of Tipping
            </h1>

            <p className="mt-5 text-xl leading-8 text-slate-600">
              People have been saying thank you with money for centuries.
              The reason stayed surprisingly similar. The technology did not.
            </p>

            <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
              <span>Click4tip Stories</span>
              <span>·</span>
              <span>About 6 min read</span>
            </div>
          </header>

          <div className="mt-12 space-y-10 text-[17px] leading-8 text-slate-700">
            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Before tips were called tips
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Nobody knows the exact moment when the first person decided
                  that good service deserved a little extra money.
                </p>

                <p>
                  Historians have traced one version of the custom back to
                  England in the 1500s. Wealthy travellers staying in another
                  person's home would leave money for the servants who had done
                  extra work during the visit. These payments were known as
                  <em> vails</em>.
                </p>

                <p>
                  The idea caught on. Possibly a little too well.
                </p>

                <p>
                  By the 1700s, guests were already complaining about how much
                  they were expected to leave behind. There were even organised
                  attempts to get rid of the custom.
                </p>

                <p>
                  They failed.
                </p>

                <p>
                  So if you have ever looked at a tip screen and thought,
                  "Wasn't dinner expensive enough already?", congratulations:
                  people were having a version of the same discussion hundreds
                  of years ago.
                </p>
              </div>
            </section>

            <aside className="rounded-2xl border border-green-200 bg-green-50 p-6">
              <p className="font-semibold text-green-900">
                Small historical myth break
              </p>

              <p className="mt-2 text-green-900/80">
                You may have heard that TIP stands for "To Insure Promptness"
                or "To Insure Prompt Service". It makes a nice story. It is
                almost certainly not where the word came from. The word was
                already being used before the famous coffee-house stories that
                supposedly created the acronym.
              </p>
            </aside>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Then came “keep the change”
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  For a very long time, tipping remained physical.
                </p>

                <p>
                  A waiter brought the bill. The bill was 46. You handed over
                  50 and said, "Keep the change."
                </p>

                <p>
                  The whole transaction took about three seconds.
                </p>

                <p>
                  More importantly, it was obvious who the thank you was for.
                  The money moved directly from one hand to another.
                </p>

                <p>
                  Hotels worked in much the same way. A few coins for the
                  person carrying your bags. Something for housekeeping. A
                  little extra for somebody who solved a problem or made the
                  stay better.
                </p>

                <p>
                  Tipping was money, but it was also a tiny social moment:
                  <strong> I noticed what you did. Thank you.</strong>
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Cards changed the payment. Cash kept the tip alive.
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Credit and debit cards changed how we paid the bill, but for
                  years many people still tipped in cash.
                </p>

                <p>
                  Pay the restaurant by card. Leave a few coins on the table.
                  Problem solved.
                </p>

                <p>
                  Until people stopped carrying the coins.
                </p>

                <p>
                  Wallets became smaller. Phones started doing the work of
                  cards. Contactless payments became normal. Mobile payments
                  became normal.
                </p>

                <p>
                  And a new situation appeared:
                </p>

                <div className="rounded-2xl bg-slate-100 p-6 text-slate-800">
                  <p>
                    “That was great service. I would love to leave a tip.”
                  </p>
                  <p className="mt-2 font-semibold">
                    “Excellent. Do you have cash?”
                  </p>
                  <p className="mt-2">“...no.”</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                The payment terminal tried to help
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  One solution was obvious: put the tip on the same payment
                  terminal as the bill.
                </p>

                <p>
                  It works. It is fast. It is convenient.
                </p>

                <p>
                  But something changed.
                </p>

                <p>
                  Instead of giving five francs, euros or pounds to Maria, who
                  looked after your table, you may now be adding 10% to a
                  transaction with a business.
                </p>

                <p>
                  Where does it go? To Maria? To the whole team? To the kitchen?
                  Into a pool? The guest may not know.
                </p>

                <p>
                  The tip became digital, but it also became a little more
                  anonymous.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                The desire to say thank you did not disappear with cash
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  This is the interesting part.
                </p>

                <p>
                  People did not suddenly stop appreciating good service
                  because they started paying with phones.
                </p>

                <p>
                  The habit stayed. The old mechanism disappeared.
                </p>

                <p>
                  That is why digital tipping has started appearing in
                  restaurants, hotels, delivery services, salons, taxis,
                  festivals and many other places where people provide a
                  personal service.
                </p>

                <p>
                  The question is no longer whether a tip can be digital.
                </p>

                <p>
                  The more interesting question is:
                  <strong> can digital tipping still feel personal?</strong>
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Enter the QR code
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  QR codes offer a surprisingly simple answer.
                </p>

                <p>
                  Scan a code. A page opens. Choose an amount. Pay digitally.
                </p>

                <p>
                  No app download. No hunt for coins at the bottom of a bag.
                  No need to add the tip to the main bill.
                </p>

                <p>
                  QR tipping is already being used in very different settings.
                  Researchers studying street performers at the Edinburgh
                  Fringe Festival, for example, looked at how audiences used QR
                  codes to leave cashless tips.
                </p>

                <p>
                  Their research found something that sounds obvious once you
                  hear it: what people see after they scan matters too.
                </p>

                <p>
                  The QR code is only the door. The experience behind it is the
                  important part.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Digital does not have to mean impersonal
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Imagine two situations.
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 p-5">
                    <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                      Option A
                    </p>
                    <p className="mt-3 text-lg font-semibold text-slate-900">
                      Add tip?
                    </p>
                    <p className="mt-2 text-slate-600">
                      5% · 10% · 15%
                    </p>
                  </div>

                  <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
                    <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
                      Option B
                    </p>
                    <p className="mt-3 text-lg font-semibold text-slate-900">
                      Thank you, Sofia
                    </p>
                    <p className="mt-2 text-slate-600">
                      Photo · name · tip amount · rating
                    </p>
                  </div>
                </div>

                <p>
                  Both are digital payments.
                </p>

                <p>
                  But they do not feel quite the same.
                </p>

                <p>
                  A tip has never really been about moving a few units of
                  currency from one account to another. It is a small act of
                  recognition.
                </p>

                <p>
                  Good digital tipping should keep that part.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                From person to phone — and back to person
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  At Click4tip, this is the idea we find most interesting.
                </p>

                <p>
                  A business can use QR codes for individual employees, teams
                  or shared tip schemes. The guest can see who or what the tip
                  is for, choose an amount and pay digitally.
                </p>

                <p>
                  Behind the scenes, technology handles the payment and, where
                  needed, the distribution.
                </p>

                <p>
                  In front of the scenes, the idea is much simpler:
                </p>

                <p className="text-xl font-semibold text-slate-900">
                  Keep the technology in the background. Put the person back in
                  the foreground.
                </p>
              </div>
            </section>

            <section className="rounded-3xl bg-slate-900 p-7 text-white sm:p-9">
              <h2 className="text-2xl font-semibold">
                The technology changed. The reason didn’t.
              </h2>

              <div className="mt-4 space-y-4 text-slate-200">
                <p>
                  Coins became cards. Cards became phones. Phones learned to
                  scan QR codes.
                </p>

                <p>
                  A tip is still a small way of saying:
                  <strong className="text-white">
                    {" "}I noticed what you did. Thank you.
                  </strong>
                </p>

                <p>
                  And that part is worth keeping.
                </p>
              </div>

              <StoryLandingCta
                lang="en"
                label="Discover Click4tip →"
              />
            </section>

            <section className="border-t border-slate-200 pt-8 text-sm leading-6 text-slate-500">
              <h2 className="font-semibold text-slate-700">Sources & further reading</h2>

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
