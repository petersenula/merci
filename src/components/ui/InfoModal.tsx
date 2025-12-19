"use client";

import { X } from "lucide-react";
import { useT } from "@/lib/translation";

type Props = {
  open: boolean;
  title?: string;
  message: string;
  onClose: () => void;
};

export default function InfoModal({ open, title, message, onClose }: Props) {
  const { t } = useT();

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-black"
        >
          <X size={22} />
        </button>

        {/* Title */}
        {title && (
          <h2 className="text-lg font-semibold mb-4 text-center">
            {title}
          </h2>
        )}

        {/* Message */}
        <p className="text-center text-slate-700 mb-6 leading-relaxed">
          {message}
        </p>

        {/* Button */}
        <button
          onClick={onClose}
          className="w-full bg-slate-700 hover:bg-slate-800 text-white py-2 rounded-lg"
        >
          {t("close")}
        </button>
      </div>
    </div>
  );
}
    