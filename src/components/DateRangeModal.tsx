'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

type Props = {
  onClose: () => void;
  onApply: (from: string, to: string) => void;
};

export default function DateRangeModal({ onClose, onApply }: Props) {
  const today = new Date().toISOString().slice(0, 10);

  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);

  // читаем язык
  const lang =
    typeof window !== "undefined"
      ? localStorage.getItem("app_lang") ?? "en"
      : "en";

  const [dict, setDict] = useState<any>(null);

  // подгружаем словарь
  useEffect(() => {
    async function loadDict() {
      const res = await fetch(`/locales/report/${lang}.json`);
      const json = await res.json();
      setDict(json);
    }
    loadDict();
  }, [lang]);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-sm space-y-4 shadow-xl">
        
        <h2 className="text-lg font-semibold">
          {dict?.modalChoosePeriod ?? "Choose period"}
        </h2>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            {dict?.modalStartDate ?? "Start date"}
          </label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="border px-3 py-2 rounded w-full"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            {dict?.modalEndDate ?? "End date"}
          </label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="border px-3 py-2 rounded w-full"
          />
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" onClick={onClose}>
            {dict?.modalCancel ?? "Cancel"}
          </Button>

          <Button variant="green" onClick={() => onApply(from, to)}>
            {dict?.modalApply ?? "Apply"}
          </Button>
        </div>
      </div>
    </div>
  );
}
