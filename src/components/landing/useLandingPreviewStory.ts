"use client";

import { useEffect, useState } from "react";
import { LandingTipPreview } from "./useLandingTipPreview";

type StoryFrame = {
  row: LandingTipPreview;
  earnedCents: number;
};

export function useLandingPreviewStory(
  rows: LandingTipPreview[] | null,
  intervalMs = 1000
) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [frames, setFrames] = useState<StoryFrame[]>([]);

  // build frames when rows change
  useEffect(() => {
    if (!rows || rows.length === 0) return;

    const newFrames: StoryFrame[] = [];

    rows.forEach((row) => {
    const goal = row.goal_amount_cents ?? 0;

      newFrames.push(
      { row, earnedCents: 0 },
      { row, earnedCents: Math.floor(goal * 0.25) },
      { row, earnedCents: Math.floor(goal * 0.5) },
      { row, earnedCents: Math.floor(goal * 0.75) },
      { row, earnedCents: goal }
      );
    });

    setFrames(newFrames);
    setFrameIndex(0);
  }, [rows]);

  // rotation timer
  useEffect(() => {
    if (frames.length === 0) return;

    const timer = setInterval(() => {
      setFrameIndex((i) => (i + 1) % frames.length);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [frames, intervalMs]);

  return frames.length > 0 ? frames[frameIndex] : null;
}
