"use client";

import { createContext, useContext, useRef } from "react";

type SectionKey = "hero" | "how" | "tipjar" | "features" | "cta";

type ScrollContextType = {
  sections: Record<SectionKey, React.RefObject<HTMLDivElement | null>>;
  scrollTo: (key: SectionKey) => void;
};

const ScrollContext = createContext<ScrollContextType | null>(null);

export function ScrollProvider({ children }: { children: React.ReactNode }) {
    const sections: Record<SectionKey, React.RefObject<HTMLDivElement | null>> = {
    hero: useRef<HTMLDivElement>(null),
    how: useRef<HTMLDivElement>(null),
    tipjar: useRef<HTMLDivElement>(null),
    features: useRef<HTMLDivElement>(null),
    cta: useRef<HTMLDivElement>(null),
    };

    const scrollTo = (key: SectionKey) => {
    sections[key]?.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <ScrollContext.Provider value={{ sections, scrollTo }}>
      {children}
    </ScrollContext.Provider>
  );
}

export function useScroll() {
  const ctx = useContext(ScrollContext);
  if (!ctx) throw new Error("useScroll must be used inside ScrollProvider");
  return ctx;
}
