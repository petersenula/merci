"use client";

import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download } from "lucide-react";
import { trackEvent } from "@/lib/analytics/trackEvent";

export default function QRDownloadButtons({
  value,
  logo = "/images/logoQR.png",
  analyticsType,
}: {
  value: string;
  logo?: string;
  analyticsType?: "earner" | "employer_direct" | "employer_scheme" | "employer_directory";
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const renderQR = async (size: number): Promise<HTMLCanvasElement> => {
    const source = canvasRef.current;
    if (!source) {
      throw new Error("QR canvas is not available");
    }

    const qrCanvas = document.createElement("canvas");
    qrCanvas.width = size;
    qrCanvas.height = size;

    const context = qrCanvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas context is not available");
    }

    context.drawImage(source, 0, 0, size, size);
    return qrCanvas;
  };

  const downloadPNG = async (size: number) => {
    const qr = await renderQR(size);
    const link = document.createElement("a");
    link.href = qr.toDataURL("image/png");
    link.download = `qr_${size}.png`;
    link.click();
    if (analyticsType) trackEvent("qr_downloaded", `${analyticsType}_png_${size}`);
  };

  const downloadJPG = async () => {
    const qr = await renderQR(1024);
    const link = document.createElement("a");
    link.href = qr.toDataURL("image/jpeg", 0.95);
    link.download = `qr_1024.jpg`;
    link.click();
    if (analyticsType) trackEvent("qr_downloaded", `${analyticsType}_jpg_1024`);
  };

  const downloadSVG = async () => {
    const qr = await renderQR(1024);
    const pngData = qr.toDataURL("image/png");

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">
        <image href="${pngData}" width="1024" height="1024" />
      </svg>
    `;
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "qr.svg";
    link.click();
    if (analyticsType) trackEvent("qr_downloaded", `${analyticsType}_svg`);
  };

  // 🎨 Общий стиль кнопки
  const lightButton =
    "px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-100 transition whitespace-nowrap";

  return (
    <div className="flex items-center gap-3 mt-4 flex-wrap">
      {/* Иконка Lucide Download */}
      <div className="flex items-center text-slate-600">
        <Download size={18} />
      </div>

      {/* Кнопки в строку */}
      <button onClick={() => downloadPNG(512)} className={lightButton}>
        PNG 512
      </button>

      <button onClick={() => downloadPNG(1024)} className={lightButton}>
        PNG 1024
      </button>

      <button onClick={downloadJPG} className={lightButton}>
        JPG 1024
      </button>

      <button onClick={downloadSVG} className={lightButton}>
        SVG
      </button>

      {/* Скрытый canvas для генерации */}
      <div className="hidden" aria-hidden="true">
        <QRCodeCanvas
          ref={canvasRef}
          value={value}
          size={1024}
          level="H"
          includeMargin
          imageSettings={{
            src: logo,
            height: 256,
            width: 256,
            excavate: true,
          }}
        />
      </div>
    </div>
  );
}
