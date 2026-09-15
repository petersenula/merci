import { NextRequest, NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/authenticateApiRequest";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getActiveMarketConfig, getCountryConfig } from "@/lib/marketConfig";

const activeMarket = getActiveMarketConfig();

export async function POST(req: NextRequest) {
  const user = await authenticateApiRequest(req);

  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  const { link_id } = await req.json();

  if (!link_id) {
    return NextResponse.json(
      { error: "Missing link_id" },
      { status: 400 }
    );
  }

  const supabaseAdmin = getSupabaseAdmin();

  const { data: relation, error: relationError } = await supabaseAdmin
    .from("employers_earners")
    .select("id, employer_id, earner_id")
    .eq("id", link_id)
    .eq("employer_id", user.id)
    .maybeSingle();

  if (relationError) {
    console.error("EMPLOYEE RELATION LOAD ERROR:", relationError);
    return NextResponse.json(
      { error: "Failed to load employee relation" },
      { status: 500 }
    );
  }

  if (!relation) {
    return NextResponse.json(
      { error: "Employee relation not found" },
      { status: 404 }
    );
  }

  const [
    { data: employer, error: employerError },
    { data: earner, error: earnerError },
  ] = await Promise.all([
    supabaseAdmin
      .from("employers")
      .select("user_id, country_code, currency")
      .eq("user_id", relation.employer_id)
      .maybeSingle(),

    supabaseAdmin
      .from("profiles_earner")
      .select("id, country_code, currency")
      .eq("id", relation.earner_id)
      .maybeSingle(),
  ]);

  if (employerError || !employer) {
    console.error("EMPLOYER LOAD ERROR:", employerError);
    return NextResponse.json(
      { error: "Employer profile not found" },
      { status: 400 }
    );
  }

  if (earnerError || !earner) {
    console.error("EARNER LOAD ERROR:", earnerError);
    return NextResponse.json(
      { error: "Employee profile not found" },
      { status: 400 }
    );
  }

  const employerCountry =
    typeof employer.country_code === "string"
      ? getCountryConfig(activeMarket.market, employer.country_code)
      : undefined;

  const earnerCountry =
    typeof earner.country_code === "string"
      ? getCountryConfig(activeMarket.market, earner.country_code)
      : undefined;

  if (!employerCountry || !earnerCountry) {
    return NextResponse.json(
      { error: "Employer and employee must belong to the same market" },
      { status: 400 }
    );
  }

  const employerCurrency = String(employer.currency ?? "").toUpperCase();
  const earnerCurrency = String(earner.currency ?? "").toUpperCase();

  if (
    employerCurrency !== employerCountry.currency ||
    earnerCurrency !== earnerCountry.currency
  ) {
    return NextResponse.json(
      { error: "Account currency does not match account country" },
      { status: 400 }
    );
  }

  if (employerCurrency !== earnerCurrency) {
    return NextResponse.json(
      { error: "Employer and employee must use the same currency" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("employers_earners")
    .update({
      pending: false,
      is_active: true,
    })
    .eq("id", relation.id)
    .eq("employer_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("EMPLOYEE APPROVE ERROR:", error);
    return NextResponse.json({ error }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json(
      { error: "Employee relation not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
