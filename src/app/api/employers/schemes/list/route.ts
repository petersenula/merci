import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { employer_id } = await req.json();

    if (!employer_id) {
      return NextResponse.json({ error: "Missing employer_id" }, { status: 400 });
    }

    // -------------------------------------------
    // 1️⃣ Загружаем работодателя
    // -------------------------------------------
    const { data: employer, error: employerErr } = await supabaseAdmin
      .from("employers")
      .select("user_id, name, stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled")
      .eq("user_id", employer_id)
      .single();

    if (employerErr || !employer) {
      return NextResponse.json({ error: "Employer not found" }, { status: 404 });
    }

    // -------------------------------------------
    // 2️⃣ Загружаем схемы + части
    // -------------------------------------------
    const { data: schemes, error: schemeErr } = await supabaseAdmin
      .from("allocation_schemes")
      .select("*, parts:allocation_scheme_parts(*)")
      .eq("employer_id", employer_id)
      .order("created_at");

    if (schemeErr) {
      return NextResponse.json({ error: "Failed to load schemes" }, { status: 500 });
    }

    // если схем нет – просто возвращаем работодателя
    if (!schemes.length) {
      return NextResponse.json({ schemes: [], employer });
    }

    // -------------------------------------------
    // 3️⃣ Собираем всех участников (участников схем)
    // -------------------------------------------
    const earnerIds: string[] = schemes
      .flatMap(s => s.parts)
      .filter(p => p.destination_kind === "earner")
      .map(p => p.destination_id)
      .filter((id): id is string => Boolean(id));

    let earners: any[] = [];

    if (earnerIds.length > 0) {
      const { data: earnersData } = await supabaseAdmin
        .from("profiles_earner")
        .select("id, display_name, stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled, is_active")
        .in("id", earnerIds);

      earners = earnersData || [];
    }

    // -------------------------------------------
    // 4️⃣ Функция обновления статуса в Supabase
    // -------------------------------------------
    async function refreshStripeStatus(stripeId: string | null, updateFn: (data: any) => Promise<any>) {
      if (!stripeId) return { charges: false, payouts: false };

      try {
        const acc = await stripe.accounts.retrieve(stripeId);

        const charges = acc.charges_enabled ?? false;
        const payouts = acc.payouts_enabled ?? false;

        await updateFn({
          stripe_charges_enabled: charges,
          stripe_payouts_enabled: payouts
        });

        return { charges, payouts };
      } catch (e) {
        console.warn("Stripe error for account:", stripeId, e);
        return { charges: false, payouts: false };
      }
    }

    // -------------------------------------------
    // 5️⃣ Обновляем работодателя
    // -------------------------------------------
    const freshEmployerStripe = await refreshStripeStatus(
      employer.stripe_account_id,
      async (data) =>
        await supabaseAdmin.from("employers").update(data).eq("user_id", employer.user_id)
    );

    employer.stripe_charges_enabled = freshEmployerStripe.charges;
    employer.stripe_payouts_enabled = freshEmployerStripe.payouts;

    // -------------------------------------------
    // 6️⃣ Обновляем каждого работника
    // -------------------------------------------
   const updatedEarners: {
      id: string;
      display_name: string | null;
      stripe_account_id: string | null;
      stripe_charges_enabled: boolean;
      stripe_payouts_enabled: boolean;
      is_active: boolean;
    }[] = [];

    for (const earner of earners) {
      const fresh = await refreshStripeStatus(
        earner.stripe_account_id,
        async (data) =>
          await supabaseAdmin.from("profiles_earner").update(data).eq("id", earner.id)
      );

      updatedEarners.push({
        ...earner,
        stripe_charges_enabled: fresh.charges,
        stripe_payouts_enabled: fresh.payouts
      });
    }

    // -------------------------------------------
    // 7️⃣ Генерируем ошибки схем
    // -------------------------------------------
    const schemesWithStatus = schemes.map(scheme => {
      const errors: string[] = [];

      // проверка компании
      if (!employer.stripe_charges_enabled) {
        errors.push("employer_stripe_disabled");
      }

      // проверяем части схемы
     scheme.parts.forEach((part: {
        destination_kind: string;
        destination_id: string | null;
      }) => {
        if (part.destination_kind === "earner") {
          const worker = updatedEarners.find(e => e.id === part.destination_id);

          if (!worker) {
            errors.push(`worker_missing_${part.destination_id}`);
            return;
          }

          if (!worker.is_active) {
            errors.push(`worker_not_active_${worker.display_name}`);
          }

          if (!worker.stripe_charges_enabled) {
            errors.push(`worker_stripe_disabled_${worker.display_name}`);
          }
        }
      });

      return {
        ...scheme,
        validation_errors: errors
      };
    });

    return NextResponse.json({
      employer,
      schemes: schemesWithStatus,
      earners: updatedEarners
    });

  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
