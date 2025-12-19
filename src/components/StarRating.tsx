'use client';

import { useState } from 'react';

export default function StarRating({ value, onChange }: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="text-yellow-400 text-xl"
        >
          {n <= value ? '★' : '☆'}
        </button>
      ))}
    </div>
  );
}
