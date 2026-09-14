const STRIPE_FIXED_FEE_CENTS = 30;
const STRIPE_PERCENT_RATE = 0.029;

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
  feePercent: number
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
    feePercent / 100 + STRIPE_PERCENT_RATE >= 1
  ) {
    throw new Error("Invalid feePercent");
  }
}

function calculateFees(
  paymentAmountCents: number,
  feePercent: number
) {
  const platformFeeCents = Math.round(
    paymentAmountCents * feePercent / 100
  );

  const stripeFeeCents = Math.round(
    STRIPE_FIXED_FEE_CENTS +
    paymentAmountCents * STRIPE_PERCENT_RATE
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
  feePercent: number
) {
  const combinedRate =
    feePercent / 100 + STRIPE_PERCENT_RATE;

  let paymentAmountCents = Math.ceil(
    (tipAmountCents + STRIPE_FIXED_FEE_CENTS) /
      (1 - combinedRate)
  );

  // Match the exact cent-based rounding used by the payment flow.
  while (
    calculateFees(paymentAmountCents, feePercent)
      .recipientNetCents < tipAmountCents
  ) {
    paymentAmountCents += 1;
  }

  // Ensure this is the minimum whole-cent gross amount
  // that still leaves at least the requested tip.
  while (
    paymentAmountCents > tipAmountCents &&
    calculateFees(paymentAmountCents - 1, feePercent)
      .recipientNetCents >= tipAmountCents
  ) {
    paymentAmountCents -= 1;
  }

  return paymentAmountCents;
}

export function calculatePaymentAmount(params: {
  tipAmountCents: number;
  feePercent: number;
  coverFees: boolean;
}): PaymentFeeBreakdown {
  const {
    tipAmountCents,
    feePercent,
    coverFees,
  } = params;

  assertValidInputs(tipAmountCents, feePercent);

  const paymentAmountCents = coverFees
    ? calculateGrossedUpAmount(
        tipAmountCents,
        feePercent
      )
    : tipAmountCents;

  const {
    platformFeeCents,
    stripeFeeCents,
    recipientNetCents,
  } = calculateFees(
    paymentAmountCents,
    feePercent
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
