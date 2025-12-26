"use client";

import { useT } from "@/lib/translation";

export default function PrivacyPage() {
  const { t } = useT();

  return (
    <main className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-semibold mb-8">
        {t("privacy_title")}
      </h1>

      {[1,2,3,4,5,6,7,8,9].map((n) => (
        <section key={n} className="mb-8">
          <h2 className="text-xl font-semibold mb-2">
            {t(`privacy_section_${n}_title`)}
          </h2>

          <div
            className="prose prose-neutral"
            dangerouslySetInnerHTML={{
              __html: t(`privacy_section_${n}_text`)
            }}
          />
        </section>
      ))}
    </main>
  );
}
