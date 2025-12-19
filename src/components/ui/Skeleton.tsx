export function Skeleton({ className = "" }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-gray-300/60 ${className}`}
    />
  );
}
