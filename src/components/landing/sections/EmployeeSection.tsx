"use client";

import Image from "next/image";
import { useLandingDistributionSchemes } from "../useLandingDistributionSchemes";

export default function EmployeeSection() {
  const { data } = useLandingDistributionSchemes("employee");

  return (
    <section className="w-full px-6 md:px-16 py-24 bg-white">
      <div className="max-w-6xl mx-auto flex flex-col gap-16">

        <div className="max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-semibold mb-4 text-slate-900">
            Works for you — no matter how you work
          </h2>
          <p className="text-lg text-slate-600">
            Collect tips independently or join your employer — even multiple ones.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {data.map((scheme) => {
            const title = scheme.title ?? "Tip scheme";
            const imageUrl = scheme.image_url ?? null;

            return (
                <div
                key={scheme.id}
                className="bg-slate-50 rounded-2xl border border-slate-200 p-6"
                >
                <div className="relative w-full h-[240px] mb-4">
                    {imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt={title}
                        fill
                        className="object-contain"
                    />
                    ) : (
                    <div className="w-full h-full rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 text-sm">
                        No image
                    </div>
                    )}
                </div>

                <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                <p className="text-sm text-slate-600">{scheme.description ?? ""}</p>
                </div>
            );
            })}
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-6 text-slate-700">
          <li>✔ Collect tips on your own</li>
          <li>✔ Join one or multiple employers</li>
          <li>✔ Always see your tips clearly</li>
        </ul>
      </div>
    </section>
  );
}
