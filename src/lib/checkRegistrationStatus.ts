import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";

export async function checkRegistrationStatus() {
  const supabase = getSupabaseBrowserClient();

  // 1. Получаем текущего пользователя
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "no_user" };
  }

  const userId = user.id;

  // 2. Проверяем WORKER (profiles_earner)
  const { data: earner } = await supabase
    .from("profiles_earner")
    .select("id, stripe_account_id")
    .eq("id", userId)
    .maybeSingle();

  if (earner) {
    if (earner.stripe_account_id) {
      return { status: "earner_with_stripe", user };
    }

    return { status: "earner_no_stripe", user };
  }

  // 3. Проверяем EMPLOYER
  const { data: employer } = await supabase
    .from("employers")
    .select("user_id, stripe_account_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (employer) {
    if (employer.stripe_account_id) {
      return { status: "employer_with_stripe", user };
    }

    return { status: "employer_no_stripe", user };
  }

  // 4. Пользователь есть в auth, но ни в одной таблице
  return { status: "auth_only", user };
}
