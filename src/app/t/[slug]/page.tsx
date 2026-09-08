import { getSupabaseServerClient } from "@/lib/supabaseServer";
import PaymentScreen from "./PaymentScreen";

type Props = {
  params: { slug: string };
};

export default async function TipPage(props: Props) {
  const { slug } = await props.params;

  const supabase = getSupabaseServerClient();

  // ----------------------------------------------------
  // 1) Пробуем найти earner по slug (как было раньше)
  // ----------------------------------------------------
  const { data: earner, error: earnerError } = await supabase
    .from("earners_public")
    .select(
      `
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
      `
    )
    .eq("slug", slug)
    .maybeSingle();

  if (earnerError) {
    console.error("Supabase earner error:", earnerError);
  }

  // ✅ earner найден и активен → показываем earner direct
  if (earner && earner.is_active) {
    if (!earner.id || !earner.slug || !earner.currency) {
      return (
        <div className="min-h-screen flex items-center justify-center text-slate-600">
          Worker data incomplete.
        </div>
      );
    }

    return (
      <PaymentScreen
        slug={earner.slug}
        earnerId={earner.id}
        name={earner.display_name ?? ""}
        avatar={earner.avatar_url ?? null}
        goalTitle={earner.goal_title ?? null}
        goalAmountCents={earner.goal_amount_cents ?? null}
        goalStartAmount={earner.goal_start_amount ?? 0}
        goalEarnedSinceStart={earner.goal_earned_since_start ?? 0}
        currency={earner.currency ?? "CHF"}
      />
    );
  }

  // ----------------------------------------------------
  // 2) Earner не найден → пробуем employer по slug
  // ----------------------------------------------------
  const { data: employer, error: employerError } = (await supabase
    .from("employers_public_view")
    .select(
      `
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
      `
    )
    .eq("slug", slug)
    .maybeSingle()) as { data: any; error: any };

  if (employerError) {
    console.error("Supabase employer error:", employerError);
  }

  // 🧪 Диагностика (server logs)
  console.log("[/t/[slug]] slug =", slug);
  console.log(
    "[/t/[slug]] earner found? =",
    !!earner,
    "active =",
    earner?.is_active
  );
  console.log(
    "[/t/[slug]] employer found? =",
    !!employer,
    "active =",
    employer?.is_active
  );

  if (!employer || !employer.is_active) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-600">
        Page not found or disabled.
      </div>
    );
  }

  if (!employer.user_id || !employer.slug || !employer.currency) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-600">
        Employer data incomplete.
      </div>
    );
  }


  // ----------------------------------------------------
  // 3) Employer direct payment
  //    schemeId не передаём
  //    earnerId делаем пустым (сейчас PaymentScreen требует string)
  //    employerId передаём
  // ----------------------------------------------------
  return (
    <PaymentScreen
      slug={employer.slug}
      earnerId={""}
      name={employer.display_name ?? employer.name ?? ""}
      avatar={employer.logo_url ?? null}
      goalTitle={employer.goal_title ?? null}
      goalAmountCents={employer.goal_amount_cents ?? null}
      goalStartAmount={employer.goal_start_amount ?? 0}
      goalEarnedSinceStart={employer.goal_earned_since_start ?? 0}
      currency={employer.currency ?? "CHF"}
    />
  );
}
