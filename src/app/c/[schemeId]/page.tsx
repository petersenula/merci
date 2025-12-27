// src/app/c/[schemeId]/page.tsx
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import PaymentScreen from "@/app/t/[slug]/PaymentScreen";

export default async function SchemePayPage(props: { params: Promise<{ schemeId: string }> }) {
  const { schemeId } = await props.params;
  const supabaseAdmin = getSupabaseAdmin();

  // -----------------------------
  // 1) Загружаем схему
  // -----------------------------
  const { data: scheme, error: schemeErr } = await supabaseAdmin
    .from("allocation_schemes")
    .select(`
      id,
      employer_id,
      payment_page_owner_type,
      payment_page_owner_id,
      show_goal,
      show_goal_amount,
      show_progress
    `)
    .eq("id", schemeId)
    .maybeSingle();

    if (schemeErr) console.error("Scheme load error:", schemeErr);

    if (!scheme) {
      return (
        <div className="min-h-screen flex items-center justify-center text-slate-600">
          Scheme not found.
        </div>
      );
    }

    // -----------------------------
    // 2) Загружаем список участников схемы
    // -----------------------------
    const { data: parts, error: partsErr } = await supabaseAdmin
      .from("allocation_scheme_parts")
      .select("destination_id, destination_type")
      .eq("scheme_id", schemeId);

    if (partsErr) console.error("Parts load error:", partsErr);

    // Ищем работника в схеме
    const earnerForScheme = parts?.find((p) => p.destination_type === "earner");

    // Это earnerId для create-payment-intent.
    // - если есть работник → берём его id
    // - если работников нет → используем employer_id как "виртуальный"
    let earnerIdForPayments: string;

    if (earnerForScheme && earnerForScheme.destination_id) {
      earnerIdForPayments = earnerForScheme.destination_id;
    } else {
      earnerIdForPayments = scheme.employer_id;
    }
    // -----------------------------
    // 3) Определяем OWNER страницы
    // -----------------------------
    // -----------------------------
    // 3) Определяем владельца payment-page
    // -----------------------------
    let ownerType = scheme.payment_page_owner_type;
    let ownerId = scheme.payment_page_owner_id;

    // -----------------------------
    // DEFAULT FALLBACK:
    // Если работодатель НЕ настроил параметры,
    // то показываем профиль работодателя
    // + включаем ВСЕ поля (goal, amount, progress)
    // -----------------------------
    let fallbackShowGoal = scheme.show_goal ?? true;
    let fallbackShowGoalAmount = scheme.show_goal_amount ?? true;
    let fallbackShowProgress = scheme.show_progress ?? true;

    if (!ownerType || !ownerId) {
    ownerType = "employer";
    ownerId = scheme.employer_id;
  }

  let ownerProfile: any = null;

  // -----------------------------
  // 4A) Если владелец — работник
  // -----------------------------
  if (ownerType === "earner") {
    const { data: earner } = await supabaseAdmin
      .from("profiles_earner")
      .select(`
        id,
        slug,
        display_name,
        avatar_url,
        goal_title,
        goal_amount_cents,
        goal_start_amount,
        goal_start_date,
        goal_earned_since_start,
        currency,
        is_active
      `)
      .eq("id", ownerId)
      .maybeSingle();

    if (!earner || !earner.is_active) {
      return (
        <div className="min-h-screen flex items-center justify-center text-slate-600">
          Selected employee is not active.
        </div>
      );
    }

    ownerProfile = {
      slug: earner.slug,
      id: earner.id,
      name: earner.display_name,
      avatar: earner.avatar_url,
      goalTitle: earner.goal_title ?? null,
      goalAmountCents: earner.goal_amount_cents ?? null,
      goalStartAmount: earner.goal_start_amount ?? 0,
      goalEarnedSinceStart: earner.goal_earned_since_start ?? 0,
      currency: earner.currency ?? "CHF",
    };
  }

  // -----------------------------
  // 4B) Если владелец — работодатель
  // -----------------------------
  else if (ownerType === "employer") {
    const { data: employer } = await supabaseAdmin
      .from("employers")
      .select(`
        user_id,
        slug,
        name,
        display_name,
        logo_url,
        goal_title,
        goal_amount_cents,
        goal_start_amount,
        goal_start_date,
        goal_earned_since_start,
        currency,
        is_active
      `)
      .eq("user_id", ownerId)
      .maybeSingle();

    if (!employer || !employer.is_active) {
      return (
        <div className="min-h-screen flex items-center justify-center text-slate-600">
          Employer not found or inactive.
        </div>
      );
    }

    ownerProfile = {
      slug: employer.slug ?? "employer",
      id: employer.user_id,
      name: employer.display_name ?? employer.name,
      avatar: employer.logo_url,
      goalTitle: employer.goal_title ?? null,
      goalAmountCents: employer.goal_amount_cents ?? null,
      goalStartAmount: employer.goal_start_amount ?? 0,
      goalEarnedSinceStart: employer.goal_earned_since_start ?? 0,
      currency: employer.currency ?? "CHF",
    };
  }

  if (!ownerProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-600">
        Cannot load payment page owner.
      </div>
    );
  }

  // -----------------------------
  // 5) Передаём в PaymentScreen
  // -----------------------------
  return (
    <PaymentScreen
      slug={ownerProfile.slug}
      earnerId={earnerIdForPayments}      // ← важно: оплата идёт по схеме!
      name={ownerProfile.name}
      avatar={ownerProfile.avatar}
      goalTitle={ownerProfile.goalTitle}
      goalAmountCents={ownerProfile.goalAmountCents}
      goalStartAmount={ownerProfile.goalStartAmount}
      goalEarnedSinceStart={ownerProfile.goalEarnedSinceStart}
      currency={ownerProfile.currency}

      // NEW — передаём флаги отображения
      showGoal={fallbackShowGoal}
      showGoalAmount={fallbackShowGoalAmount}
      showProgress={fallbackShowProgress}

      // Контекст схемы для createIntent
      schemeId={schemeId}
      employerId={scheme.employer_id}
    />
  );
}
