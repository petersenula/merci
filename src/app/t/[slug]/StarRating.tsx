"use client";

import { useState } from "react";
import { Star } from "lucide-react";

export default function StarRating({ value, onChange }: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState<number | null>(null);

  return (
    <div className="flex justify-center gap-1 my-3">
      {[1, 2, 3, 4, 5].map((rating) => (
        <button
          key={rating}
          onMouseEnter={() => setHover(rating)}
          onMouseLeave={() => setHover(null)}
          onClick={() => onChange(rating)}
          className="p-1"
        >
          <Star
            size={22}
            className={
              (hover ?? value) >= rating
                ? "text-yellow-500 fill-yellow-500"
                : "text-slate-300"
            }
          />
        </button>
      ))}
    </div>
  );
}
