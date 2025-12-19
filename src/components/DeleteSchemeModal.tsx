"use client";

import { X } from "lucide-react";
import { useT } from "@/lib/translation";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  schemeId: string;
  onClose: () => void;
  onConfirm: (id: string) => void;
};

export default function DeleteSchemeModal({ open, schemeId, onClose, onConfirm }: Props) {
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
        <h2 className="text-lg font-semibold mb-4 text-center">
          {t("schemes_delete_title")}
        </h2>

        {/* Text */}
        <p className="text-center text-slate-700 mb-6 leading-relaxed">
          {t("schemes_delete_confirm")}
        </p>

        {/* Buttons */}
        <div className="flex gap-3 mt-4">
          <Button
            variant="green"
            className="flex-1"
            onClick={onClose}
          >
            {t("schemes_delete_no")}
          </Button>

          <Button
            variant="orange"
            className="flex-1"
            onClick={() => onConfirm(schemeId)}
          >
            {t("schemes_delete_yes")}
          </Button>
        </div>
      </div>
    </div>
  );
}
