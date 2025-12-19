import { supabaseClient } from "@/lib/supabaseClient";
import PaymentScreen from "./PaymentScreen";

type Props = {
  params: { slug: string };
};

export default async function TipPage(props: Props) {
   const { slug } = await props.params; 

  // 1. Загружаем данные исполнителя
  const { data: earner, error } = await supabaseClient
    .from("earners_public")
    .select(`
      id,
      slug,
      display_name,
      avatar_url,
      goal_title,
      goal_amount_cents,
      goal_start_amount,
      goal_start_date,
      currency,
      is_active
    `)
    .eq("slug", slug)
    .maybeSingle();

    if (error) {
      console.error("Supabase error:", error);
    }
    if (!earner || !earner.is_active) {
      return (
        <div className="min-h-screen flex items-center justify-center text-slate-600">
          Worker not found or disabled.
        </div>
      );
    }

    if (!earner.id || !earner.slug || !earner.currency) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-600">
        Worker data incomplete.
      </div>
    );
  }
  // 2. Считаем сумму чаевых
  let earnedSinceStartCents = 0;

  if (earner.goal_start_date) {
    const { data: tips, error: tipsErr } = await supabaseClient
      .from("tips")
      .select("amount_gross_cents, created_at")
      .eq("earner_id", earner.id)
      .gte("created_at", earner.goal_start_date);

    if (tipsErr) console.error("Tips load error:", tipsErr);

    earnedSinceStartCents =
      (tips ?? []).reduce(
        (sum, t) => sum + (t.amount_gross_cents ?? 0),
        0
      ) ?? 0;
  }

  // 3. Передаём данные в PaymentScreen
  return (
    <PaymentScreen
      slug={earner.slug ?? ""}
      earnerId={earner.id ?? ""}
      name={earner.display_name ?? ""}
      avatar={earner.avatar_url ?? null}
      goalTitle={earner.goal_title ?? null}
      goalAmountCents={earner.goal_amount_cents ?? null}
      goalStartAmount={earner.goal_start_amount ?? 0}
      goalEarnedSinceStart={earnedSinceStartCents}
      currency={earner.currency ?? "CHF"}
    />
  );
}
