import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST() {
  return NextResponse.json(
    { error: 'This Stripe onboarding endpoint is no longer available' },
    { status: 410 },
  );
}
