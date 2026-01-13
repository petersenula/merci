"use client";

import { useEffect, useState } from "react";

export default function PaymentProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let current = 0;
    let rafId: number;

    const tick = () => {
      // Медленно растём до 90%
      if (current < 90) {
        current += Math.random() * 1.5; // очень мягко
        if (current > 90) current = 90;
        setProgress(current);
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="w-full">
      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-600 rounded-full transition-[width] duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
