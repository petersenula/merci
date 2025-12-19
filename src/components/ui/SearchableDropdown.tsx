"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";

type Option = { code: string; label: string };

type Props = {
  value: string;
  onChange: (val: string) => void;
  label: string;
  options: Option[];
};

export function SearchableDropdown({ value, onChange, label, options }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const selected = options.find((o) => o.code === value);

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    return options.filter((o) =>
      o.label.toLowerCase().startsWith(search.toLowerCase())
    );
  }, [options, search]);

  // 👉 Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!wrapperRef.current) return;

      if (!wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  // 👉 Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      {/* Label */}
      <label className="block text-sm font-medium mb-1">{label}</label>

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="
          w-full flex items-center justify-between 
          border rounded-lg px-3 py-2 bg-white text-sm 
          hover:bg-gray-50 transition
        "
      >
        {selected?.label ?? value}
        <ChevronDown size={16} className="opacity-70" />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="
            absolute left-0 right-0 mt-1 bg-white border rounded-lg shadow-xl 
            z-50 max-h-40 overflow-y-auto animate-fadeIn
          "
        >
          {/* Search field */}
          <div className="flex items-center gap-2 px-3 py-2 border-b bg-gray-50 sticky top-0 z-10">
            <Search size={16} className="opacity-50" />
            <input
              type="text"
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-sm outline-none bg-transparent"
            />
          </div>

          {/* Options */}
          {filtered.map((o) => (
            <button
              key={o.code}
              type="button"
              onClick={() => {
                onChange(o.code);
                setSearch("");
                setOpen(false);
              }}
              className="
                block w-full text-left px-3 py-2 
                hover:bg-gray-100 text-sm transition
              "
            >
              {o.label}
            </button>
          ))}

          {filtered.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-500">No matches</div>
          )}
        </div>
      )}
    </div>
  );
}
