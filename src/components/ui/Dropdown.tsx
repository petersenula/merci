"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

type Option = { code: string; label: string };

type Props = {
  value: string;
  onChange: (val: string) => void;
  label: string;
  options: Option[];
  placeholder?: string;
};

export function Dropdown({
  value,
  onChange,
  label,
  options,
  placeholder,
}: Props) {
  const [open, setOpen] = useState(false);

  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const selected = options.find(o => o.code === value);

  // 👉 Close on outside click
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

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <label className="block text-sm font-medium mb-1">{label}</label>
        <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className="
            w-full flex items-center justify-between 
            border rounded-lg px-3 py-2 bg-white text-sm 
            hover:bg-gray-50 transition
        "
        >
        <span
            className={
            selected
                ? "text-slate-900"
                : "text-slate-400"
            }
        >
            {selected
            ? selected.label
            : placeholder ?? ""}
        </span>

        <ChevronDown size={16} className="opacity-70" />
        </button>
      {open && (
        <div className="absolute left-0 right-0 mt-1 bg-white border rounded-lg shadow-md z-20 max-h-64 overflow-y-auto">
          {options.map(o => (
            <button
              key={o.code}
              type="button"
              onClick={() => {
                onChange(o.code);
                setOpen(false);
              }}
              className="block w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
