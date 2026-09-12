import type { Metadata } from "next";
import Link from "next/link";
import StoryLandingCta from "../StoryLandingCta";

const canonicalUrl =
  "https://www.click4tip.ch/stories/digital-tipping-switzerland";

export const metadata: Metadata = {
  title: "Digital Tipping in Switzerland: Cash Is Disappearing. Tipping Isn’t.",
  description:
    "How tipping works in Switzerland, why cashless and QR tipping are becoming more relevant, and what the 2026 political debate could change.",
  alternates: {
    canonical: canonicalUrl,
    languages: {
      en: canonicalUrl,
      de: "https://www.click4tip.ch/stories/de/digitales-trinkgeld-schweiz",
      fr: "https://www.click4tip.ch/stories/fr/pourboire-digital-suisse",
      it: "https://www.click4tip.ch/stories/it/mance-digitali-svizzera",
    },
  },
  openGraph: {
    type: "article",
    url: canonicalUrl,
    title: "Digital Tipping in Switzerland: Cash Is Disappearing. Tipping Isn’t.",
    description:
      "Swiss guests still tip. Cash is becoming less important. Digital tipping is moving from convenience to a real hospitality issue.",
    siteName: "Click4tip",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Digital Tipping in Switzerland: Cash Is Disappearing. Tipping Isn’t.",
  description:
    "How tipping works in Switzerland, why cashless and QR tipping are becoming more relevant, and what the 2026 political debate could change.",
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

export default function DigitalTippingSwitzerlandPage() {
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
              Digital tipping · Switzerland · Cashless payments
            </p>

            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
              Digital Tipping in Switzerland: Cash Is Disappearing. Tipping Isn’t.
            </h1>

            <p className="mt-5 text-xl leading-8 text-slate-600">
              Switzerland stopped relying on tips to pay service staff decades
              ago. But people never stopped tipping. Now cash is fading, and the
              old habit needs a new way to survive.
            </p>

            <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
              <span>Click4tip Stories</span>
              <span>·</span>
              <span>About 8 min read</span>
              <span>·</span>
              <span>Updated September 2026</span>
            </div>
          </header>

          <div className="mt-12 space-y-10 text-[17px] leading-8 text-slate-700">
            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Switzerland has a slightly unusual tipping story
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  If you visit Switzerland today, tipping is voluntary.
                  Restaurant prices already include service.
                </p>

                <p>
                  That sounds normal now, but it was not always the case.
                </p>

                <p>
                  Until the 1970s, service in parts of the hospitality industry
                  was not fully included in the price. Guests were expected to
                  pay part of the service directly through tips.
                </p>

                <p>
                  In 1974, the system changed. The principle of
                  <em> Service inbegriffen</em> — service included — became the
                  standard in Swiss hospitality.
                </p>

                <p>
                  From that point on, staff wages were no longer supposed to
                  depend on compulsory tipping. Any extra amount left by the
                  guest became voluntary.
                </p>

                <p>
                  In other words: the salary became the salary, and the tip
                  became a thank you.
                </p>
              </div>
            </section>

            <aside className="rounded-2xl border border-green-200 bg-green-50 p-6">
              <p className="font-semibold text-green-900">
                The Swiss version of tipping
              </p>

              <p className="mt-2 text-green-900/80">
                Service is included in the price. A tip is optional. If you give
                one, you decide how much — and, ideally, who it is for.
              </p>
            </aside>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                The Swiss still tip
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Voluntary does not mean rare.
                </p>

                <p>
                  A representative ZHAW study of 1,000 people living in
                  German-, French- and Italian-speaking Switzerland found that
                  around two thirds of guests in full-service restaurants
                  usually or always leave a tip.
                </p>

                <p>
                  Most respondents said they give between 5% and 10% of the
                  bill.
                </p>

                <p>
                  There are regional differences too. Around 10% is more common
                  in German-speaking Switzerland, while 5% is more typical in
                  French- and Italian-speaking regions.
                </p>

                <p>
                  So the basic idea is very much alive.
                </p>

                <p>
                  Swiss guests still want to reward good service.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                The problem: Switzerland is becoming cashless
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  The way people pay, however, is changing quickly.
                </p>

                <p>
                  According to the Swiss Payment Monitor published by ZHAW and
                  the University of St. Gallen, mobile devices are now the most
                  commonly used payment method in Switzerland.
                </p>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 p-5">
                    <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                      Mobile
                    </p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">
                      31.4%
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-5">
                    <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                      Debit card
                    </p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">
                      23.8%
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-5">
                    <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                      Cash
                    </p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">
                      23.0%
                    </p>
                  </div>
                </div>

                <p>
                  That creates a very Swiss 2026 problem:
                </p>

                <div className="rounded-2xl bg-slate-100 p-6 text-slate-800">
                  <p>Pay the restaurant bill with your phone.</p>
                  <p className="mt-2">Put the phone back in your pocket.</p>
                  <p className="mt-2 font-semibold">
                    Then start searching for coins to leave a tip.
                  </p>
                </div>

                <p>
                  The desire to tip is still there.
                </p>

                <p>
                  The cash often is not.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Why many guests still prefer cash for tips
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  This is where the story gets more interesting.
                </p>

                <p>
                  Many people who pay the bill digitally still switch back to
                  cash for the tip.
                </p>

                <p>
                  The ZHAW study found three important reasons:
                </p>

                <ul className="list-disc space-y-2 pl-6">
                  <li>control over where the money goes,</li>
                  <li>the personal nature of the gesture,</li>
                  <li>
                    and trust that the tip actually reaches the service person.
                  </li>
                </ul>

                <p>
                  That means the challenge is not simply:
                  <strong> “How do we make tips digital?”</strong>
                </p>

                <p>
                  The better question is:
                  <strong>
                    {" "}How do we make tips digital without making them feel
                    less personal?
                  </strong>
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                So what is digital tipping?
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Digital tipping simply means leaving a tip without using
                  physical cash.
                </p>

                <p>
                  That can happen in several ways.
                </p>

                <p>
                  A restaurant terminal can ask whether you want to add a tip
                  before you pay the bill.
                </p>

                <p>
                  A hotel can offer a digital tipping page.
                </p>

                <p>
                  A guest can scan a QR code and tip from a phone.
                </p>

                <p>
                  The payment might then be made with TWINT, card, Apple Pay,
                  Google Pay or another available digital method.
                </p>

                <p>
                  The important difference is not only how the money moves.
                </p>

                <p>
                  It is also what the guest sees and understands before sending
                  it.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Why QR code tipping can be different
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  A QR code can separate the tip from the main bill.
                </p>

                <p>
                  That matters because a tip does not have to become just
                  another line inside a restaurant payment.
                </p>

                <p>
                  The QR code can lead to a page for a specific employee, a
                  team, a hotel department or a predefined tip-sharing scheme.
                </p>

                <p>
                  The guest can see who the tip is for before paying.
                </p>

                <p>
                  That brings back something cash was very good at:
                  transparency.
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 p-5">
                    <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                      Anonymous
                    </p>
                    <p className="mt-3 text-lg font-semibold text-slate-900">
                      Add 10% tip?
                    </p>
                    <p className="mt-2 text-slate-600">
                      The guest may not know who receives it.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
                    <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
                      Personal
                    </p>
                    <p className="mt-3 text-lg font-semibold text-slate-900">
                      Thank you, Sofia
                    </p>
                    <p className="mt-2 text-slate-600">
                      The recipient or team is visible before payment.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                And then there is the tax question
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  This is where things become less simple.
                </p>

                <p>
                  The fact that a tip is voluntary does not automatically mean
                  that every tip is treated the same way for tax and social
                  insurance purposes.
                </p>

                <p>
                  Under current Swiss rules, tips can count as relevant salary
                  for social insurance if they form a significant part of the
                  employee's remuneration.
                </p>

                <p>
                  At the same time, sectors that have integrated service into
                  their prices have traditionally treated voluntary tips as a
                  separate, minor extra.
                </p>

                <p>
                  Direct federal tax rules add another layer: tips are in
                  principle taxable income.
                </p>

                <p>
                  The result is a situation that becomes harder to ignore once
                  tips are digital and therefore much easier to record.
                </p>

                <p className="text-sm text-slate-500">
                  This article is a general overview, not tax or legal advice.
                  Businesses should check the rules that apply to their specific
                  situation.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                2026: digital tipping reaches the Swiss Parliament
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  In 2026, this debate moved from restaurants and payroll
                  offices into federal politics.
                </p>

                <p>
                  A motion from Council of States member Beat Rieder asks for a
                  clearer rule: voluntary tips in sectors where service is
                  already included in prices should generally not be treated as
                  relevant salary or taxable income.
                </p>

                <p>
                  In March 2026, the Council of States supported the motion by
                  42 votes to 1, with one abstention.
                </p>

                <p>
                  The Federal Council opposes the proposal.
                </p>

                <p>
                  Its argument is that social insurance protection matters, and
                  that a complete exemption could also cover cases where tips
                  make up a substantial part of a person's income.
                </p>

                <p>
                  Supporters of the motion argue that voluntary digital tips
                  should not be treated less favourably than cash tips simply
                  because they are easier to track.
                </p>

                <p>
                  The responsible committee of the National Council later
                  recommended accepting the motion by 16 votes to 9.
                </p>

                <p>
                  The National Council is expected to deal with the issue in
                  the autumn 2026 session.
                </p>
              </div>
            </section>

            <aside className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <p className="font-semibold text-amber-900">
                Why we will update this page
              </p>

              <p className="mt-2 text-amber-900/80">
                The political discussion is still moving. When Parliament takes
                the next decision, we will update this article rather than
                leaving an old explanation online pretending nothing happened.
              </p>
            </aside>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                What does this mean for hotels, restaurants and service businesses?
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  The practical problem exists regardless of what Parliament
                  decides next.
                </p>

                <p>
                  Guests increasingly pay digitally.
                </p>

                <p>
                  Employees still value tips.
                </p>

                <p>
                  Guests still care about who receives them.
                </p>

                <p>
                  Businesses therefore need digital tipping systems that are
                  simple for the guest and transparent for the team.
                </p>

                <p>
                  That can mean showing an individual employee, showing a team,
                  or clearly explaining how a tip will be shared.
                </p>

                <p>
                  The technology should remove friction, not add another layer
                  of uncertainty.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-slate-900">
                Digital tipping should solve the cash problem without losing the human part
              </h2>

              <div className="mt-4 space-y-4">
                <p>
                  Switzerland does not need to bring back the old system where
                  service staff depended on tips to be paid properly.
                </p>

                <p>
                  That is not the point.
                </p>

                <p>
                  The interesting opportunity is much simpler:
                </p>

                <p>
                  keep fair wages, keep tipping voluntary, and make it easy for
                  a guest to say thank you even when there is no cash in the
                  pocket.
                </p>

                <p>
                  At Click4tip, we think the best digital tipping experience is
                  one where the technology almost disappears.
                </p>

                <p>
                  The guest sees the person or team, chooses a tip, pays
                  digitally — and understands where the money is going.
                </p>
              </div>
            </section>

            <section className="rounded-3xl bg-slate-900 p-7 text-white sm:p-9">
              <h2 className="text-2xl font-semibold">
                Cash is changing. The thank you does not have to.
              </h2>

              <div className="mt-4 space-y-4 text-slate-200">
                <p>
                  Digital tipping is not about replacing the meaning of a tip.
                </p>

                <p>
                  It is about giving an old gesture a payment method that still
                  exists in people's pockets.
                </p>
              </div>

              <StoryLandingCta
                lang="en"
                label="Discover Click4tip →"
              />
            </section>

            <section className="border-t border-slate-200 pt-8 text-sm leading-6 text-slate-500">
              <h2 className="font-semibold text-slate-700">
                Sources & further reading
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
                  ZHAW & University of St. Gallen —{" "}
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
                  Swiss Parliament —{" "}
                  <a
                    href="https://www.parlament.ch/de/services/news/Seiten/2026/20260302180407926194158159026_bsd207.aspx"
                    target="_blank"
                    rel="noreferrer"
                    className="underline hover:text-slate-700"
                  >
                    Council of States vote on voluntary tips
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
