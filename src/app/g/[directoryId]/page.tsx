import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import SchemeDirectoryClient from "./SchemeDirectoryClient";

type Props = {
  params: { directoryId: string };
};

type SchemeRow = {
  id: string;
  payment_page_owner_type: string | null;
  payment_page_owner_id: string | null;
  active_from: string | null;
  active_to: string | null;
};

type DirectoryItem = {
  scheme_id: string;
  position: number;
  scheme: SchemeRow | SchemeRow[] | null;
};

function getScheme(item: DirectoryItem): SchemeRow | null {
  if (Array.isArray(item.scheme)) {
    return item.scheme[0] ?? null;
  }

  return item.scheme ?? null;
}

function unavailable() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-sm bg-white rounded-[2rem] shadow-xl px-6 py-10 text-center">
        <p className="text-slate-900 text-lg font-semibold mb-2">
          This tip list is not available.
        </p>
        <p className="text-slate-600 text-sm">
          Please check the QR code or ask a member of staff.
        </p>
      </div>
    </div>
  );
}

export default async function SchemeDirectoryPage(props: Props) {
  const { directoryId } = await props.params;
  const supabaseAdmin = getSupabaseAdmin();

  const { data: directory, error: directoryError } = await (
    supabaseAdmin as any
  )
    .from("scheme_directories")
    .select(`
      id,
      employer_id,
      is_active,
      items:scheme_directory_items (
        scheme_id,
        position,
        scheme:allocation_schemes (
          id,
          payment_page_owner_type,
          payment_page_owner_id,
          active_from,
          active_to
        )
      )
    `)
    .eq("id", directoryId)
    .maybeSingle();

  if (directoryError) {
    console.error("Public QR list load failed:", directoryError);
    return unavailable();
  }

  if (!directory || !directory.is_active) {
    return unavailable();
  }

  const { data: employer, error: employerError } = await supabaseAdmin
    .from("employers")
    .select("user_id, name, display_name, logo_url, is_active")
    .eq("user_id", directory.employer_id)
    .maybeSingle();

  if (employerError || !employer || !employer.is_active) {
    console.error("Public QR list employer load failed:", employerError);
    return unavailable();
  }

  const now = new Date();

  const activeItems = ((directory.items ?? []) as DirectoryItem[])
    .sort((a, b) => a.position - b.position)
    .filter((item) => {
      const scheme = getScheme(item);

      if (!scheme) return false;

      if (scheme.active_from) {
        const activeFrom = new Date(scheme.active_from);

        if (
          !Number.isNaN(activeFrom.getTime()) &&
          activeFrom > now
        ) {
          return false;
        }
      }

      if (scheme.active_to) {
        const activeTo = new Date(scheme.active_to);

        if (
          !Number.isNaN(activeTo.getTime()) &&
          activeTo < now
        ) {
          return false;
        }
      }

      return true;
    });

  const earnerOwnerIds = Array.from(
    new Set(
      activeItems
        .map((item) => getScheme(item))
        .filter(
          (scheme): scheme is SchemeRow =>
            Boolean(
              scheme &&
                scheme.payment_page_owner_type === "earner" &&
                scheme.payment_page_owner_id
            )
        )
        .map((scheme) => scheme.payment_page_owner_id!)
    )
  );

  let earners: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    is_active: boolean;
  }[] = [];

  if (earnerOwnerIds.length > 0) {
    const { data: earnerData, error: earnerError } = await supabaseAdmin
      .from("profiles_earner")
      .select("id, display_name, avatar_url, is_active")
      .in("id", earnerOwnerIds);

    if (earnerError) {
      console.error(
        "Public QR list earner owners load failed:",
        earnerError
      );
    }

    earners = earnerData ?? [];
  }

  const employerName =
    employer.display_name ?? employer.name ?? "";

  const people = activeItems
    .map((item) => {
      const scheme = getScheme(item);

      if (!scheme) return null;

      if (
        scheme.payment_page_owner_type === "earner" &&
        scheme.payment_page_owner_id
      ) {
        const earner = earners.find(
          (candidate) =>
            candidate.id === scheme.payment_page_owner_id
        );

        if (!earner || !earner.is_active) {
          return null;
        }

        return {
          schemeId: scheme.id,
          name: earner.display_name ?? "",
          avatar: earner.avatar_url ?? null,
        };
      }

      return {
        schemeId: scheme.id,
        name: employerName,
        avatar: employer.logo_url ?? null,
      };
    })
    .filter(
      (
        person
      ): person is {
        schemeId: string;
        name: string;
        avatar: string | null;
      } => Boolean(person?.name)
    );

  return <SchemeDirectoryClient people={people} />;
}
