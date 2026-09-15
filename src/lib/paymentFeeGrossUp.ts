import type { StripeFeeProfile } from "@/lib/stripeFeeConfig";

export type PaymentFeeBreakdown = {
  tipAmountCents: number;
  paymentAmountCents: number;
  feeCoverageCents: number;
  platformFeeCents: number;
  stripeFeeCents: number;
  recipientNetCents: number;
};

function assertValidInputs(
  tipAmountCents: number,
  feePercent: number,
  stripeFeeProfile: StripeFeeProfile
) {
  if (
    !Number.isInteger(tipAmountCents) ||
    tipAmountCents < 0
  ) {
    throw new Error("tipAmountCents must be a non-negative integer");
  }

  if (
    !Number.isFinite(feePercent) ||
    feePercent < 0 ||
    !Number.isFinite(stripeFeeProfile.percentRate) ||
    stripeFeeProfile.percentRate < 0 ||
    !Number.isInteger(stripeFeeProfile.fixedFeeMinor) ||
    stripeFeeProfile.fixedFeeMinor < 0 ||
    feePercent / 100 + stripeFeeProfile.percentRate >= 1
  ) {
    throw new Error("Invalid fee configuration");
  }
}

function calculateFees(
  paymentAmountCents: number,
  feePercent: number,
  stripeFeeProfile: StripeFeeProfile
) {
  const platformFeeCents = Math.round(
    paymentAmountCents * feePercent / 100
  );

  const stripeFeeCents = Math.round(
    stripeFeeProfile.fixedFeeMinor +
    paymentAmountCents * stripeFeeProfile.percentRate
  );

  const recipientNetCents = Math.max(
    paymentAmountCents -
      platformFeeCents -
      stripeFeeCents,
    0
  );

  return {
    platformFeeCents,
    stripeFeeCents,
    recipientNetCents,
  };
}

function calculateGrossedUpAmount(
  tipAmountCents: number,
  feePercent: number,
  stripeFeeProfile: StripeFeeProfile
) {
  const combinedRate =
    feePercent / 100 + stripeFeeProfile.percentRate;

  let paymentAmountCents = Math.ceil(
    (tipAmountCents + stripeFeeProfile.fixedFeeMinor) /
      (1 - combinedRate)
  );

  while (
    calculateFees(
      paymentAmountCents,
      feePercent,
      stripeFeeProfile
    ).recipientNetCents < tipAmountCents
  ) {
    paymentAmountCents += 1;
  }

  while (
    paymentAmountCents > tipAmountCents &&
    calculateFees(
      paymentAmountCents - 1,
      feePercent,
      stripeFeeProfile
    ).recipientNetCents >= tipAmountCents
  ) {
    paymentAmountCents -= 1;
  }

  return paymentAmountCents;
}

export function calculatePaymentAmount(params: {
  tipAmountCents: number;
  feePercent: number;
  coverFees: boolean;
  stripeFeeProfile: StripeFeeProfile;
}): PaymentFeeBreakdown {
  const {
    tipAmountCents,
    feePercent,
    coverFees,
    stripeFeeProfile,
  } = params;

  assertValidInputs(
    tipAmountCents,
    feePercent,
    stripeFeeProfile
  );

  const paymentAmountCents = coverFees
    ? calculateGrossedUpAmount(
        tipAmountCents,
        feePercent,
        stripeFeeProfile
      )
    : tipAmountCents;

  const {
    platformFeeCents,
    stripeFeeCents,
    recipientNetCents,
  } = calculateFees(
    paymentAmountCents,
    feePercent,
    stripeFeeProfile
  );

  return {
    tipAmountCents,
    paymentAmountCents,
    feeCoverageCents:
      paymentAmountCents - tipAmountCents,
    platformFeeCents,
    stripeFeeCents,
    recipientNetCents,
  };
}
