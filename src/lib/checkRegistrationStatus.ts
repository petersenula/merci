import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";

export async function checkRegistrationStatus(userId: string) {
  const supabase = getSupabaseBrowserClient();

  // 2. Проверяем WORKER (profiles_earner)
  const { data: earner } = await supabase
  .from("profiles_earner")
  .select("id, stripe_account_id, stripe_status")
  .eq("id", userId)
  .maybeSingle();

  if (earner) {
  // 🟢 Stripe был удалён — регистрация приложения ЗАВЕРШЕНА
  if (earner.stripe_status === "deleted") {
      return { status: "earner_with_stripe" };
  }

  // 🟡 Stripe существует
  if (earner.stripe_account_id) {
      return { status: "earner_with_stripe"};
  }

  // 🔄 Регистрация прервана (Stripe ещё не создан)
  return { status: "earner_no_stripe"};
  }

  // 3. Проверяем EMPLOYER
  const { data: employer } = await supabase
    .from("employers")
    .select("user_id, stripe_account_id, stripe_status, payment_account_mode")
    .eq("user_id", userId)
    .maybeSingle();

  if (employer) {
    // Team-only employers are fully registered even without Stripe.
    if (employer.payment_account_mode === "team_only") {
      return { status: "employer_with_stripe" };
    }

    // Existing own-account behaviour stays unchanged.
    if (employer.stripe_status === "deleted") {
      return { status: "employer_with_stripe" };
    }

    if (employer.stripe_account_id) {
      return { status: "employer_with_stripe" };
    }

    return { status: "employer_no_stripe" };
  }

  // 4. Пользователь есть в auth, но ни в одной таблице
  return { status: "auth_only"};
}
