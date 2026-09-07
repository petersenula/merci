"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type PersonCard = {
  schemeId: string;
  name: string;
  avatar: string | null;
};

type Props = {
  people: PersonCard[];
};

const copy = {
  en: {
    thanks: "Thanks for choosing our service — we hope your experience was great!",
    choose: "Please choose who you would like to thank.",
    empty: "No tipping options are currently available.",
  },
  de: {
    thanks: "Vielen Dank, dass Sie unseren Service genutzt haben — wir hoffen, Sie waren zufrieden!",
    choose: "Bitte wählen Sie aus, wem Sie danken möchten.",
    empty: "Zurzeit sind keine Trinkgeldoptionen verfügbar.",
  },
  fr: {
    thanks: "Merci d’avoir utilisé notre service — nous espérons que votre expérience vous a plu !",
    choose: "Veuillez choisir la personne que vous souhaitez remercier.",
    empty: "Aucune option de pourboire n’est disponible actuellement.",
  },
  it: {
    thanks: "Grazie per aver utilizzato il nostro servizio — speriamo che la tua esperienza sia stata piacevole!",
    choose: "Scegli chi desideri ringraziare.",
    empty: "Al momento non sono disponibili opzioni per la mancia.",
  },
  es: {
    thanks: "Gracias por utilizar nuestro servicio — esperamos que tu experiencia haya sido excelente.",
    choose: "Elige a quién te gustaría agradecer.",
    empty: "Actualmente no hay opciones de propina disponibles.",
  },
  zh: {
    thanks: "感谢您使用我们的服务，希望您有一次愉快的体验！",
    choose: "请选择您想感谢的人。",
    empty: "目前没有可用的小费选项。",
  },
} as const;

export default function SchemeDirectoryClient({ people }: Props) {
  const [lang, setLang] = useState<keyof typeof copy>("en");

  const languages = [
    { code: "en", label: "EN" },
    { code: "de", label: "DE" },
    { code: "fr", label: "FR" },
    { code: "it", label: "IT" },
    { code: "es", label: "ES" },
    { code: "zh", label: "中文" },
  ] as const;

  const current =
    copy[lang as keyof typeof copy] ?? copy.en;

  return (
    <main className="h-dvh overflow-hidden bg-slate-100 px-4 py-6 flex justify-center">
      <div className="w-full max-w-sm h-full bg-white rounded-[2rem] shadow-xl px-6 py-7 flex flex-col">

        {/* CLICK4TIP LOGO */}
        <div className="flex justify-center">
          <Image
            src="/images/logo.png"
            alt="Click4Tip"
            width={170}
            height={44}
            className="h-11 w-auto"
            priority
          />
        </div>

        {/* LANGUAGE SELECTOR */}
        <div className="flex justify-center gap-2 mt-4 flex-wrap">
          {languages.map((language) => {
            const active = lang === language.code;

            return (
              <button
                key={language.code}
                type="button"
                onClick={() => setLang(language.code)}
                className={
                  active
                    ? "px-3 py-1 rounded-full text-xs bg-green-600 text-white"
                    : "px-3 py-1 rounded-full text-xs border border-slate-300 text-slate-600 bg-white"
                }
              >
                {language.label}
              </button>
            );
          })}
        </div>

        {/* WELCOME */}
        <div className="text-center mt-5">
          <p className="text-sm text-slate-600 leading-relaxed">
            {current.thanks}
          </p>

          <h1 className="text-xl font-semibold text-slate-900 mt-5">
            {current.choose}
          </h1>
        </div>

        {/* SCROLLABLE PEOPLE LIST */}
        <div className="mt-6 space-y-3 overflow-y-auto pr-1 min-h-0 flex-1">
          {people.length > 0 ? (
            people.map((person) => (
              <Link
                key={person.schemeId}
                href={`/c/${person.schemeId}`}
                className="flex items-center gap-4 border border-slate-200 rounded-2xl px-4 py-3 hover:bg-slate-50 hover:border-slate-300 transition"
              >
                {person.avatar ? (
                  <Image
                    src={person.avatar}
                    alt={person.name}
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-xl font-semibold text-slate-500 shrink-0">
                    {person.name.trim().charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="font-semibold text-slate-900 text-base min-w-0 flex-1">
                  {person.name}
                </div>

                <span
                  aria-hidden="true"
                  className="text-slate-400 text-xl shrink-0"
                >
                  ›
                </span>
              </Link>
            ))
          ) : (
            <p className="text-sm text-slate-500 text-center py-6">
              {current.empty}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
