// src/components/CheckmarkAnimation.tsx
'use client';

export function CheckmarkAnimation() {
  return (
    <svg
      className="w-24 h-24 text-green-500 animate-draw-checkmark"
      viewBox="0 0 52 52"
    >
      <circle
        cx="26"
        cy="26"
        r="25"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        d="M14 27l7 7 17-17"
      />
    </svg>
  );
}
