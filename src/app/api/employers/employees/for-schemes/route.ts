import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  const { employer_id } = await req.json();
  const supabaseAdmin = getSupabaseAdmin();

  if (!employer_id) {
    return NextResponse.json({ error: 'Missing employer_id' }, { status: 400 });
  }

  // Получаем работников
  const { data: employees, error: empError } = await supabaseAdmin
    .from('employers_earners')
    .select(`
      id,
      earner_id,
      role,
      is_active,
      share_page_access,
      profiles_earner (
        id,
        display_name,
        avatar_url,
        goal_title,
        goal_amount_cents,
        goal_start_amount,
        goal_earned_since_start,
        currency,
        stripe_account_id,
        stripe_charges_enabled,
        stripe_payouts_enabled
      )
    `)
    .eq('employer_id', employer_id)
    .eq('is_active', true);

  if (empError) {
    console.error(empError);
    return NextResponse.json({ error: empError }, { status: 500 });
  }

  // Получаем работодателя (его stripe account)
  const { data: employer, error: empErr2 } = await supabaseAdmin
    .from('employers')
    .select(`
      user_id,
      slug,
      name,
      display_name,
      logo_url,
      goal_title,
      goal_amount_cents,
      goal_start_amount,
      currency,
      stripe_account_id,
      stripe_charges_enabled,
      stripe_payouts_enabled
    `)
    .eq('user_id', employer_id)
    .single();

  if (empErr2) {
    console.error(empErr2);
    return NextResponse.json({ error: empErr2 }, { status: 500 });
  }

  return NextResponse.json({
    employer,
    employees,
  });
}
