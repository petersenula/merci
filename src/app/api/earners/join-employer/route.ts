import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const { invite_code, earner_id, share_page_access } = await req.json();
    const supabaseAdmin = getSupabaseAdmin();

    // --- Проверка данных ---
    if (!invite_code || !earner_id) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    // --- 1. Находим работодателя по invite_code ---
    const { data: employer, error: employerError } = await supabaseAdmin
      .from('employers')
      .select('user_id, invite_code')
      .eq('invite_code', invite_code)
      .single();

    if (employerError || !employer) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 });
    }

    // --- 2. Проверяем, была ли уже связь между работником и этим работодателем ---
    const { data: existing, error: existingError } = await supabaseAdmin
      .from('employers_earners')
      .select('id, role, pending, is_active, since_date, until_date, share_page_access')
      .eq('employer_id', employer.user_id)
      .eq('earner_id', earner_id)
      .maybeSingle();

    if (existingError) {
      console.error('EXISTING CHECK ERROR:', existingError);
      return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }

    // --- 3. Если связь уже была — обновляем её (возвращаем к pending) ---
    if (existing) {
      const { error: updateErr } = await supabaseAdmin
        .from('employers_earners')
        .update({
          role: 'worker',
          pending: true,
          is_active: false,
          since_date: null,
          until_date: null,
          share_page_access:
            share_page_access ?? existing.share_page_access ?? false,
        })
        .eq('id', existing.id);

      if (updateErr) {
        console.error('REJOIN UPDATE ERROR:', updateErr);
        return NextResponse.json({ error: 'Re-join failed' }, { status: 500 });
      }

      return NextResponse.json({ success: true, pending: true });
    }

    // --- 4. Если связи не было — создаём новую запись ---
    const { error: insertError } = await supabaseAdmin
      .from('employers_earners')
      .insert({
        employer_id: employer.user_id,
        earner_id,
        role: 'worker',
        pending: true,
        is_active: false,
        since_date: null,
        until_date: null,
        share_page_access: share_page_access ?? false,
      });

    if (insertError) {
      console.error('INSERT ERROR:', insertError);
      return NextResponse.json({ error: 'Join failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true, pending: true });

  } catch (e) {
    console.error('JOIN EMPLOYER SERVER ERROR:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
