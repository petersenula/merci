import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import LedgerImportClient from "./LedgerImportClient";

export default async function Page() {
  console.log("🟡 [ADMIN PAGE] start");

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set({ name, value, ...options });
          });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.getSession();

  console.log("🟡 [ADMIN PAGE] session error:", error);
  console.log("🟡 [ADMIN PAGE] session data:", data);

  const user = data?.session?.user;

  //if (!user) {
  //console.log("🔴 [ADMIN PAGE] NO USER → redirect signin");
  //redirect("/admin/signin");
  //}

  //console.log("🟢 [ADMIN PAGE] user.id =", user.id);

  //const { data: admin, error: adminError } = await supabase
  // .from("admin_users")
  // .select("user_id")
  //  .eq("user_id", user.id)
  //  .maybeSingle();

  //console.log("🟡 [ADMIN PAGE] admin row:", admin);
  // console.log("🟡 [ADMIN PAGE] admin error:", adminError);

  //if (!admin) {
  //  console.log("🔴 [ADMIN PAGE] NOT ADMIN → redirect signin");
  //  redirect("/admin/signin");
  // }

  //console.log("✅ [ADMIN PAGE] ADMIN OK, render client");

  return <LedgerImportClient />;
}
