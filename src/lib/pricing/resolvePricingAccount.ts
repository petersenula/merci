import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export type PricingAccountType = "TEAM" | "INDIVIDUAL";

export type PricingAccount = {
  accountType: PricingAccountType;
  accountId: string;
};

export async function resolvePricingAccount(
  userId: string
): Promise<PricingAccount | null> {
  const supabaseAdmin = getSupabaseAdmin();

  const [
    { data: employer, error: employerError },
    { data: earner, error: earnerError },
  ] = await Promise.all([
    supabaseAdmin
      .from("employers")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle(),

    supabaseAdmin
      .from("profiles_earner")
      .select("id")
      .eq("id", userId)
      .maybeSingle(),
  ]);

  if (employerError) {
    console.error("PRICING EMPLOYER LOOKUP ERROR:", employerError);
    throw new Error("Failed to resolve pricing account");
  }

  if (earnerError) {
    console.error("PRICING EARNER LOOKUP ERROR:", earnerError);
    throw new Error("Failed to resolve pricing account");
  }

  if (employer && earner) {
    console.error(
      "PRICING ACCOUNT AMBIGUOUS: user exists as TEAM and INDIVIDUAL",
      userId
    );
    throw new Error("Ambiguous pricing account");
  }

  if (employer) {
    return {
      accountType: "TEAM",
      accountId: employer.user_id,
    };
  }

  if (earner) {
    return {
      accountType: "INDIVIDUAL",
      accountId: earner.id,
    };
  }

  return null;
}
