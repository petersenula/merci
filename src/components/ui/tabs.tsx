"use client";

import { useRef, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React from "react";

type Tab = { key: string; label: React.ReactNode };

type Props = {
  tabs: Tab[];
  activeTab: string;
  onChange: (key: string) => void;
};

export function Tabs({ tabs, activeTab, onChange }: Props) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;

    setCanScrollLeft(el.scrollLeft > 5);
    setCanScrollRight(el.scrollWidth - el.clientWidth - el.scrollLeft > 5);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);

    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, []);

  const scrollByAmount = (amount: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: amount, behavior: "smooth" });
  };

  return (
    <div className="relative w-full">
      {canScrollLeft && (
        <button
          onClick={() => scrollByAmount(-150)}
          className="
            absolute left-0 top-0 bottom-0 flex items-center px-1 z-20
            bg-gradient-to-r from-white to-transparent
          "
        >
          <ChevronLeft size={26} className="text-slate-500" />
        </button>
      )}

      <div
        ref={scrollRef}
        className="
          flex gap-6 overflow-x-auto whitespace-nowrap px-8
          no-scrollbar
        "
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`
              pb-2 text-sm font-medium border-b-2 transition 
              whitespace-nowrap
              ${
                activeTab === tab.key
                ? "border-green-600 text-green-600"
                : "border-transparent text-slate-600 hover:text-green-600"
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {canScrollRight && (
        <button
          onClick={() => scrollByAmount(150)}
          className="
            absolute right-0 top-0 bottom-0 flex items-center px-1 z-20
            bg-gradient-to-l from-white to-transparent
          "
        >
          <ChevronRight size={26} className="text-slate-500" />
        </button>
      )}
    </div>
  );
}
