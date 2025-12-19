// src/app/api/employers/schemes/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const { employer_id, name, description, parts } = await req.json();
    const supabaseAdmin = getSupabaseAdmin();

    if (!employer_id || !name) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    // 1. создаём схему
    const { data: scheme, error: createError } = await supabaseAdmin
      .from('allocation_schemes')
      .insert({
        employer_id,
        name,
        description: description || null,
        is_default: false,
      })
      .select()
      .single();

    if (createError || !scheme) {
      console.error('SCHEME ERROR:', createError);
      return NextResponse.json(
        { error: 'Failed to create scheme' },
        { status: 500 }
      );
    }

    // 2. сохраняем части схемы
    for (const part of parts) {
      const { error: partError } = await supabaseAdmin
        .from('allocation_scheme_parts')
        .insert({
          scheme_id: scheme.id,
          part_index: part.part_index,
          label: part.label,
          percent: part.percent,

          // ВАЖНО: записываем тип и получателя
          destination_kind: part.destination_kind ?? 'earner', // enum tip_destination_kind
          destination_type: part.destination_kind ?? 'earner', // текстовая копия (можно убрать, если не нужна)
          destination_id: part.destination_id ?? null,

          // на будущее: если появятся отдельные payout-аккаунты
          employer_payout_account_id: null,
        });

      if (partError) {
        console.error('PART ERROR:', partError);
        return NextResponse.json(
          { error: 'Failed to save scheme parts' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true, scheme_id: scheme.id });
  } catch (e: any) {
    console.error('SERVER ERROR:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
