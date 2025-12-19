'use client';

import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import QRWithLogo from "@/components/QRWithLogo";
import { useT } from "@/lib/translation";
import QRDownloadButtons from "@/components/QRDownloadButtons";

type Props = {
  url: string;
  onClose: () => void;
  title?: string;
};

export default function EmployerQRModal({ url, onClose, title }: Props) {
  const { t } = useT();
  const downloadCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // 🔽 Скачать PNG большого размера
  const handleDownloadPng = () => {
    const canvas = downloadCanvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `qr-scheme.png`;
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">

        {/* TITLE */}
        <h2 className="text-lg font-semibold mb-2">
          {title || t("qr_title")}
        </h2>

        <p className="text-sm text-slate-600 mb-4">
          {t("qr_description")}
        </p>

        {/* QR WITH LOGO */}
        <div className="flex justify-center mb-4">
          <QRWithLogo value={url} />
        </div>

        {/* DOWNLOAD BUTTONS */}
        <QRDownloadButtons value={url} />

        {/* HIDDEN HQ QR FOR PNG DOWNLOAD */}
        <div className="hidden">
          <QRCodeCanvas
            ref={downloadCanvasRef}
            value={url}
            size={1024}
            level="H"
            includeMargin
            imageSettings={{
              src: "/images/logoQR.png",
              height: 256,
              width: 256,
              excavate: true,
            }}
          />
        </div>

        <button
          className="mt-4 w-full bg-slate-700 hover:bg-slate-800 text-white py-2 rounded-lg"
          onClick={onClose}
        >
          {t("close")}
        </button>
      </div>
    </div>
  );
}
