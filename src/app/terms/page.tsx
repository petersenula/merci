"use client";

import { useT } from "@/lib/translation";

export default function TermsPage() {
  const { t } = useT();

  return (
    <main className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-semibold mb-8">{t("terms_title")}</h1>

      {/* Sections 1–4 */}
      {[1, 2, 3, 4].map((n) => (
        <section key={n} className="mb-8">
          <h2 className="text-xl font-semibold mb-2">
            {t(`terms_section_${n}_title`)}
          </h2>
          <div
            className="prose prose-neutral"
            dangerouslySetInnerHTML={{
              __html: t(`terms_section_${n}_text`),
            }}
          />
        </section>
      ))}

      {/* Section 4a */}
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

      {/* Section 4b */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">
          {t("terms_section_4b_title")}
        </h2>
        <div
          className="prose prose-neutral"
          dangerouslySetInnerHTML={{
            __html: t("terms_section_4b_text"),
          }}
        />
      </section>

      {/* Sections 5–10 */}
      {[5, 6, 7, 8, 9, 10].map((n) => (
        <section key={n} className="mb-8">
          <h2 className="text-xl font-semibold mb-2">
            {t(`terms_section_${n}_title`)}
          </h2>
          <div
            className="prose prose-neutral"
            dangerouslySetInnerHTML={{
              __html: t(`terms_section_${n}_text`),
            }}
          />
        </section>
      ))}
    </main>
  );
}