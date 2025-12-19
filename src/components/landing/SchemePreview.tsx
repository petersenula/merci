'use client';

import Image from "next/image";
import { useState } from "react";

export default function SchemePreview({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* PREVIEW */}
      <div className="relative group cursor-zoom-in">
        <Image
          src={src}
          alt={alt}
          width={520}
          height={360}
          unoptimized
          className="rounded-xl shadow-sm"
        />

        {/* CENTER ZOOM BUTTON */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
          <div className="bg-black/60 text-white text-sm px-4 py-2 rounded-full">
            Click to zoom
          </div>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="absolute inset-0"
          aria-label="Zoom preview"
        />
      </div>

      {/* MODAL */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative max-w-5xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={src}
              alt={alt}
              width={1400}
              height={900}
              unoptimized
              className="rounded-lg"
            />
          </div>
        </div>
      )}
    </>
  );
}
