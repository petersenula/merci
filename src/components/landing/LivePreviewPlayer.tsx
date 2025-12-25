"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useLandingLivePreviews } from "./useLandingLivePreviews";
import TipPreview from "./TipPreview";
import SuccessMessage from "@/components/SuccessMessage";

type Stage = "context" | "pay" | "success";

export default function LivePreviewPlayer() {
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
        setIndex((prev) => (prev + 1 < data.length ? prev + 1 : 0));
      }, 2500);
    }

    return () => clearTimeout(timeout);
  }, [stage, preview, data.length]);

  if (loading) {
    return (
      <div className="text-slate-400 text-sm">
        Loading preview…
      </div>
    );
  }

  if (!preview) return null;

  return (
    <div className="w-full flex flex-col items-center justify-center h-[520px] overflow-hidden">
      {stage === "context" && (
        <div className="w-full max-w-md h-full flex items-center justify-center animate-fadeInUp">
          <Image
            src={preview.context_image_url}
            alt={preview.context_label}
            width={600}
            height={400}
            className="w-full h-auto object-cover"
          />
        </div>
      )}

      {stage === "pay" && (
      <div className="w-full h-full flex items-center justify-center animate-fadeInUp">
          <div className="scale-[0.6] origin-center">
          <TipPreview
              name={preview.name}
              imageUrl={preview.payment_image_url ?? undefined}
              goalTitle={preview.goal_title ?? undefined}
              goalAmountCents={preview.goal_amount_cents}
              goalStartAmountCents={preview.goal_start_amount_cents ?? undefined}
              goalEarnedSinceStart={preview.goal_raised_amount_cents ?? undefined}
              currency={preview.currency}
          />
          </div>
      </div>
      )}

      {stage === "success" && (
        <div className="w-full h-full flex items-center justify-center animate-fadeInUp">
          <SuccessMessage
            amount={preview.payment_amount_cents ?? undefined}
            currency={preview.currency}
          />
        </div>
      )}
    </div>
  );
}
