// components/icons/Click4TipIcon.tsx
export function Click4TipIcon({ size = 20, color = "#00B167" }) {
  return (
    <svg
      width={size}
      height={(size * 110) / 100}
      viewBox="0 0 100 110"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Верхняя дуга */}
      <path
        d="M10 32C22 18 40 13 50 13C60 13 78 18 90 32"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
      />

      {/* Средняя дуга */}
      <path
        d="M20 52C30 42 40 39 50 39C60 39 70 42 80 52"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
      />

      {/* Нижняя дуга */}
      <path
        d="M30 70C36 64 43 62 50 62C57 62 64 64 70 70"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
      />

      {/* Сердечко */}
      <path
        d="M50 82C45 76 35 75 35 85C35 92 45 97 50 102C55 97 65 92 65 85C65 75 55 76 50 82Z"
        fill={color}
      />
    </svg>
  );
}
