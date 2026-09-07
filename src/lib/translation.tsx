'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type TranslationProviderProps = {
  children: ReactNode;
};

const TranslationContext = createContext({
  lang: "en",
  t: (key: string) => key,
  setLang: (lang: string) => {},
});

export function TranslationProvider({ children }: TranslationProviderProps) {
  const [lang, setLang] = useState("en");
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [englishMessages, setEnglishMessages] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("lang") || "de";
    setLang(saved);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;

    async function load() {
      try {
        const [selectedRes, englishRes] = await Promise.all([
          fetch(`/locales/${lang}/translations.json`),
          fetch(`/locales/en/translations.json`),
        ]);

        const englishJson = englishRes.ok
          ? await englishRes.json()
          : {};

        const selectedJson = selectedRes.ok
          ? await selectedRes.json()
          : {};

        setEnglishMessages(englishJson);
        setMessages(selectedJson);
      } catch (e) {
        console.error("Translation load error:", e);

        try {
          const englishRes = await fetch("/locales/en/translations.json");

          if (englishRes.ok) {
            const englishJson = await englishRes.json();
            setEnglishMessages(englishJson);
            setMessages({});
          }
        } catch (fallbackError) {
          console.error("English translation fallback load error:", fallbackError);
        }
      }
    }

    load();
  }, [lang, ready]);

  const changeLang = (l: string) => {
    setLang(l);
    localStorage.setItem("lang", l);
  };

  const t = (key: string) =>
    messages[key] || englishMessages[key] || key;

  // Пока язык не готов, не рендерим ничего → нет гидратации несоответствия
  if (!ready) return null;

  return (
    <TranslationContext.Provider value={{ lang, t, setLang: changeLang }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useT() {
  return useContext(TranslationContext);
}
