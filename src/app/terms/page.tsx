"use client";

import { useT } from "@/lib/translation";

export default function TermsPage() {
  const { t } = useT();

  return (
    <main className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-semibold mb-8">
        {t("terms_title")}
      </h1>

      {[1,2,3,4].map((n) => (
        <section key={n} className="mb-8">
          <h2 className="text-xl font-semibold mb-2">
            {t(`terms_section_${n}_title`)}
          </h2>
          <div
            className="prose prose-neutral"
            dangerouslySetInnerHTML={{
              __html: t(`terms_section_${n}_text`)
            }}
          />
        </section>
      ))}

      {/* NEW: Section 4a */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">
          {t("terms_section_4a_title")}
        </h2>
        <div
          className="prose prose-neutral"
          dangerouslySetInnerHTML={{
            __html: t("terms_section_4a_text"),
          }}
        />
      </section>

      {[5,6,7,8,9].map((n) => (
        <section key={n} className="mb-8">
          <h2 className="text-xl font-semibold mb-2">
            {t(`terms_section_${n}_title`)}
          </h2>
          <div
            className="prose prose-neutral"
            dangerouslySetInnerHTML={{
              __html: t(`terms_section_${n}_text`)
            }}
          />
        </section>
      ))}
    </main>
  );
}
