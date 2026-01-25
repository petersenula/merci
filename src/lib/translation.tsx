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
        const res = await fetch(`/locales/${lang}/translations.json`);
        const json = await res.json();
        setMessages(json);
      } catch (e) {
        console.error("Translation load error:", e);
      }
    }
    load();
  }, [lang, ready]);

  const changeLang = (l: string) => {
    setLang(l);
    localStorage.setItem("lang", l);
  };

  const t = (key: string) => messages[key] || key;

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
