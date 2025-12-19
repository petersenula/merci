'use client';

import Image from "next/image";

type TipPreviewProps = {
  avatar?: string;
  name: string;
  goalTitle?: string;
  progressPercent: number;
  progressLabel: string;
  currency: string;
};

export function TipPreview({
  avatar,
  name,
  goalTitle,
  progressPercent,
  progressLabel,
  currency,
}: TipPreviewProps) {
  return (
    <div className="relative w-[260px] mx-auto">

      {/* PHONE FRAME */}
        <Image
        src="/images/mockup-phone-v2.png"
        alt="Tip preview"
        width={390}
        height={770}
        className="pointer-events-none select-none"
        />

      {/* OVERLAY CONTENT */}
      <div className="absolute top-[85px] left-0 w-full px-6 text-center">

        {/* WELCOME */}
        <p className="text-[10px] text-slate-700 font-medium leading-tight">
          Thanks for using our service!
          <br />
          Hope you enjoyed it.
        </p>

        {/* AVATAR */}
        <div className="flex justify-center mt-3">
          {avatar ? (
            <img
              src={avatar}
              className="w-16 h-16 rounded-full object-cover border border-slate-200"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-slate-300" />
          )}
        </div>

        {/* NAME */}
        <p className="mt-2 font-semibold text-slate-900 text-sm">
          Hello, I'm {name}
        </p>

        {/* GOAL */}
        <p className="text-xs text-slate-700 mt-1 leading-tight">
          Every tip brings me closer to my goal:
          <br />
          <span className="font-medium">{goalTitle}</span>
        </p>

        {/* PROGRESS BAR */}
        <div className="mt-3 w-full bg-slate-200 h-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#0DA067] transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* PROGRESS LABEL */}
        <p className="text-[10px] mt-1 text-slate-600">
          {progressLabel}
        </p>

      </div>
    </div>
  );
}
