'use client';

type LoaderOverlayProps = {
  show: boolean;
};

export default function LoaderOverlay({ show }: LoaderOverlayProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-transparent">
      <div className="w-10 h-10 border-4 border-slate-300 border-t-green-500 rounded-full animate-spin" />
    </div>
  );
}
