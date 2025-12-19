'use client';

export default function LoadingOverlay({ show }: { show: boolean }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="animate-spin h-14 w-14 border-4 border-green-600 border-t-transparent rounded-full"></div>
    </div>
  );
}
