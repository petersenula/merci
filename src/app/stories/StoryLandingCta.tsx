"use client";

import { useRouter } from "next/navigation";

type StoryLang = "en" | "de" | "fr" | "it";

type Props = {
  lang: StoryLang;
  label: string;
};

export default function StoryLandingCta({ lang, label }: Props) {
  const router = useRouter();

  const handleClick = () => {
    localStorage.setItem("lang", lang);
    document.documentElement.lang = lang;
    router.push("/");
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="mt-6 inline-flex rounded-lg bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
    >
      {label}
    </button>
  );
}
