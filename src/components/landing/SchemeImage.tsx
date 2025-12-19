"use client";

import { useEffect, useState } from "react";

type Props = {
  src: string;
  alt: string;
};

export default function SchemeImage({ src, alt }: Props) {
  const [open, setOpen] = useState(false);

  // 🔒 блокируем скролл body
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* PREVIEW */}
      <div
        className="relative w-full h-[320px] rounded-xl overflow-hidden bg-slate-100 cursor-zoom-in"
        onClick={() => setOpen(true)}
      >
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-contain"
        />

        {/* hint */}
        <div className="absolute bottom-2 right-2 text-xs bg-black/60 text-white px-2 py-1 rounded">
          Click to zoom
        </div>
      </div>

      {/* MODAL */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6"
          onClick={() => setOpen(false)}
        >
          <div
            className="
              relative
              bg-white
              rounded-xl
              max-h-[90vh]
              w-[70vw]
              max-w-[1100px]
              overflow-y-auto
            "
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={src}
              alt={alt}
              className="w-full h-auto"
            />

            {/* CLOSE */}
            <button
              onClick={() => setOpen(false)}
              className="
                sticky
                top-4
                ml-auto
                mr-4
                mt-4
                bg-black/70
                text-white
                rounded-full
                w-9
                h-9
                flex
                items-center
                justify-center
                text-lg
              "
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}
