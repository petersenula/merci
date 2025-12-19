"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useLandingLivePreviews } from "../useLandingLivePreviews";
import TipPreview from "../TipPreview";
import SuccessMessage from "@/components/SuccessMessage";

type Stage = "context" | "pay" | "success";

export default function LivePreviewSection() {
const { data, loading } = useLandingLivePreviews();

const [index, setIndex] = useState(0);
const [stage, setStage] = useState<Stage>("context");

const preview = data[index];

// stage loop
useEffect(() => {
    if (!preview) return;

    let timeout: NodeJS.Timeout;

    if (stage === "context") {
    timeout = setTimeout(() => setStage("pay"), 3000);
    }

    if (stage === "pay") {
    timeout = setTimeout(() => setStage("success"), 4000);
    }

    if (stage === "success") {
    timeout = setTimeout(() => {
        setStage("context");
        setIndex((prev) =>
        prev + 1 < data.length ? prev + 1 : 0
        );
    }, 2500);
    }

    return () => clearTimeout(timeout);
}, [stage, preview, data.length]);

return (
    <div className="w-full px-6 md:px-16 py-24 bg-background">
    <div className="max-w-6xl mx-auto flex flex-col gap-16">

        {/* TITLE */}
        <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-semibold mb-4">
            Live tip page preview
        </h2>
        <p className="text-lg text-foreground/70">
            See what your customers experience — from scan to success
        </p>
        </div>

        {/* STAGE */}
        <div className="flex justify-center items-center min-h-[520px]">
        {loading && (
            <div className="text-slate-400 text-sm">
            Loading preview…
            </div>
        )}

        {!loading && preview && (
            <>
            {stage === "context" && (
                <div className="w-full max-w-md rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm animate-fadeInUp">
                <Image
                    src={preview.context_image_url}
                    alt={preview.context_label}
                    width={600}
                    height={400}
                    className="w-full h-auto object-cover"
                />
                <div className="px-4 py-2 text-center text-sm text-slate-600">
                    {preview.context_label}
                </div>
                </div>
            )}

            {stage === "pay" && (
                <TipPreview
                name={preview.name}
                imageUrl={preview.payment_image_url ?? undefined}
                goalTitle={preview.goal_title ?? undefined}
                goalAmountCents={preview.goal_amount_cents}
                goalStartAmountCents={preview.goal_start_amount_cents ?? undefined}
                goalEarnedSinceStart={preview.goal_raised_amount_cents ?? undefined}
                currency={preview.currency}
                />
            )}

            {stage === "success" && (
                <SuccessMessage
                amount={preview.payment_amount_cents ?? undefined}
                currency={preview.currency}
                />
            )}
            </>
        )}
        </div>
    </div>
    </div>
);
}
