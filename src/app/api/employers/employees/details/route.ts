import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  const { employer_id, earner_id } = await req.json();
  const supabaseAdmin = getSupabaseAdmin();

  if (!employer_id || !earner_id) {
    return NextResponse.json(
      { error: 'Missing employer_id or earner_id' },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from('employers_earners')
    .select(`
      id,
      role,
      is_active,
      pending,
      profiles_earner (
        id,
        display_name,
        avatar_url,
        goal_title,
        goal_amount_cents,
        goal_start_amount,
        goal_start_date,
        stripe_account_id,
        stripe_onboarding_complete,
        stripe_charges_enabled,
        stripe_payouts_enabled
      )
    `)
    .eq('employer_id', employer_id)
    .eq('earner_id', earner_id)
    .single();

  if (error) {
    console.error('DETAILS ERROR:', error);
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ employee: data });
}
