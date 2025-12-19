"use client";

import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download } from "lucide-react";

export default function QRDownloadButtons({
  value,
  logo = "/images/logoQR.png",
}: {
  value: string;
  logo?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const renderQR = (size: number): Promise<HTMLCanvasElement> => {
    return new Promise((resolve) => {
      const qrCanvas = document.createElement("canvas");
      const qrCtx = qrCanvas.getContext("2d")!;
      qrCanvas.width = size;
      qrCanvas.height = size;

      setTimeout(() => {
        const realQR = document.querySelector("canvas");
        if (realQR) {
          qrCtx.drawImage(realQR, 0, 0, size, size);
          resolve(qrCanvas);
        }
      }, 50);
    });
  };

  const downloadPNG = async (size: number) => {
    const qr = await renderQR(size);
    const link = document.createElement("a");
    link.href = qr.toDataURL("image/png");
    link.download = `qr_${size}.png`;
    link.click();
  };

  const downloadJPG = async () => {
    const qr = await renderQR(1024);
    const link = document.createElement("a");
    link.href = qr.toDataURL("image/jpeg", 0.95);
    link.download = `qr_1024.jpg`;
    link.click();
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
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
