'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import EmployerQRModal from "./EmployerQRModal";
import EmployerDirectories from "./EmployerDirectories";
import { authenticatedFetch } from "@/lib/authenticatedFetch";
import { useT } from "@/lib/translation";
import { SearchableDropdown } from "@/components/ui/SearchableDropdown";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import SchemePayPageModal from "./SchemePayPageModal";
import DeleteSchemeModal from "@/components/DeleteSchemeModal";
import InfoModal from "@/components/ui/InfoModal";
import { ChevronDown } from "lucide-react";
import { cn } from '@/lib/utils';
import { getPublicAppUrl } from "@/lib/publicUrl";
import LoaderOverlay from "@/components/ui/LoaderOverlay";
import EmployerStripeAccountSetupModal from '@/components/stripe/EmployerStripeAccountSetupModal';
import QRWithLogo from "@/components/QRWithLogo";
import QRDownloadButtons from "@/components/QRDownloadButtons";

type Recipient = {
  slug?: string | null;
  id: string;
  name: string;
  type: "employer" | "earner";
  stripe: string | null;
  stripe_status?: string | null;  avatar_url?: string | null;
  goal_title?: string | null;
  goal_amount_cents?: number | null;
  goal_start_amount?: number | null;
  goal_earned_since_start?: number | null;
  currency?: string | null;

  is_active?: boolean;
  stripe_charges_enabled?: boolean;
  share_page_access?: boolean;
};


type Part = {
  part_index: number;
  label: string;
  percent: number | "";
  destination_kind: string;
  destination_id: string | null;
};

type PreviewOwnerProfile = {
  name: string;
  avatar: string | null;
  goalTitle: string | null;
  goalAmountCents: number | null;
  goalStartAmount: number;
  goalEarnedSinceStart: number;
  currency: string;
};

type PreviewFlags = {
  showGoal: boolean;
  showGoalAmount: boolean;
  showProgress: boolean;
};

type PageProps = {
  searchParams: {
    account?: string;
  };
};

export default function Schemes({ employerId }: { employerId: string }) {
  const { t, lang } = useT();
  const [schemes, setSchemes] = useState<any[]>([]);
  const [activeSection, setActiveSection] = useState<
    "lists" | "schemes" | "direct"
  >("lists");
  const [loading, setLoading] = useState(true);
  const [stripeActionLoading, setStripeActionLoading] = useState(false);
  const [showStripeSetupModal, setShowStripeSetupModal] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [employerDisplayProfile, setEmployerDisplayProfile] =
    useState<Recipient | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [focusedPercentIndex, setFocusedPercentIndex] = useState<number | null>(null);
  const employer = recipients.find(r => r.type === "employer");
  const [parts, setParts] = useState<Part[]>([
    {
      part_index: 1,
      label: '',
      percent: 100,
      destination_kind: 'earner',
      destination_id: null,
    },
  ]);

  const [employerProfile, setEmployerProfile] = useState<{
    stripe_account_id: string | null;
    stripe_status: string | null;
    stripe_charges_enabled: boolean | null;
    payment_account_mode: string;
  } | null>(null);

  const loadEmployerStripeStatus = async () => {
    try {
      const res = await authenticatedFetch("/api/employers/profile", {
        method: "POST",
      });

      if (!res.ok) {
        console.error("Employer profile load failed:", res.status);
        return null;
      }

      const data = await res.json();

      if (!data?.employer) {
        return null;
      }

      const freshProfile = {
        stripe_account_id: data.employer.stripe_account_id ?? null,
        stripe_status: data.employer.stripe_status ?? null,
        stripe_charges_enabled:
          data.employer.stripe_charges_enabled ?? false,
        payment_account_mode:
          data.employer.payment_account_mode ?? 'own_account',
      };

      setEmployerProfile(freshProfile);
      return freshProfile;
    } catch (e) {
      console.error("Employer profile load exception:", e);
      return null;
    }
  };

  const [errors, setErrors] = useState<{
    name?: boolean;
    parts?: {
      label?: boolean;
      percent?: boolean;
      recipient?: boolean;
    }[];
  }>({});

  const [infoModal, setInfoModal] = useState({
    open: false,
    title: "",
    message: ""
  });
  const showInfo = (title: string, message: string) => {
    setInfoModal({ open: true, title, message });
  };
  const total = parts.reduce((sum, p) => sum + (p.percent || 0), 0);

  const handleOpenStripeAccount = async (
    businessType: 'individual' | 'company'
  ) => {
    setStripeActionLoading(true);

    try {
      const res = await authenticatedFetch(
        '/api/employers/stripe-recreate',
        {
          method: 'POST',
          body: JSON.stringify({
            lang,
            stripe_business_type: businessType,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data?.onboardingUrl) {
        throw new Error(data?.error || 'Failed to create Stripe account');
      }

      window.location.href = data.onboardingUrl;
    } catch (error) {
      console.error(error);
      setStripeActionLoading(false);
      setShowStripeSetupModal(false);
      showInfo(t('error'), t('stripe_recreate_error'));
    }
  };

  const [deleteModal, setDeleteModal] = useState<{ open: boolean; schemeId?: string }>({
    open: false
  });

  const confirmDeleteScheme = async (id: string) => {
    setDeleteModal({ open: false });

    const res = await authenticatedFetch("/api/employers/schemes/delete", {
      method: "POST",
      body: JSON.stringify({ scheme_id: id }),
    });

    const data = await res.json();

    if (data.success) {
      loadSchemes();

      showInfo(
        t("schemes_deleted_title"),
        t("schemes_deleted_success")
      );

    } else {
      showInfo(
        t("error"),
        data.error
      );
    }
  };

  const [previewModal, setPreviewModal] = useState<{
    open: boolean;
    ownerProfile: PreviewOwnerProfile | null;
    flags: PreviewFlags | null;
  }>({
    open: false,
    ownerProfile: null,
    flags: null,
  });


  // ---- debounce timers ----
  const ownerSaveTimers = useRef<{ [schemeId: string]: any }>({});
  const displaySaveTimers = useRef<{ [schemeId: string]: any }>({});

  // ---- API: set payment owner ----
  const saveOwner = (
    schemeId: string,
    owner_type: string | null,
    owner_id: string | null
  ) => {
    clearTimeout(ownerSaveTimers.current[schemeId]);
    ownerSaveTimers.current[schemeId] = setTimeout(async () => {
      await authenticatedFetch("/api/employers/schemes/set-payment-owner", {
        method: "POST",
        body: JSON.stringify({ scheme_id: schemeId, owner_type, owner_id }),
      });
      loadSchemes();
    }, 500);
  };

  // ---- API: set display options ----
  const saveDisplay = (schemeId: string, field: string, value: boolean) => {
    clearTimeout(displaySaveTimers.current[schemeId]);
    displaySaveTimers.current[schemeId] = setTimeout(async () => {
      await authenticatedFetch("/api/employers/schemes/set-display-options", {
        method: "POST",
        body: JSON.stringify({ scheme_id: schemeId, [field]: value }),
      });
      loadSchemes();
    }, 1500);
  };

  const loadSchemes = async () => {
    setLoading(true);

    const res = await authenticatedFetch('/api/employers/schemes/list', {
      method: 'POST',
    });

    const data = await res.json();
    setSchemes(data.schemes || []);

    setLoading(false);
  };

  const loadRecipients = async () => {
    const res = await authenticatedFetch("/api/employers/employees/for-schemes", {
      method: "POST",
    });

    const data = await res.json();
    if (data.error) return null;

    const list: Recipient[] = [];
    let employerStripeId: string | null = null;

    if (data.employer) {
      console.log("EMPLOYER FROM API:", data.employer);
      employerStripeId = data.employer.stripe_account_id;

      const displayProfile: Recipient = {
        id: data.employer.user_id,
        type: "employer",
        slug: data.employer.slug,
        name: data.employer.display_name || data.employer.name || t("company"),
        avatar_url: data.employer.logo_url ?? null,
        goal_title: data.employer.goal_title ?? null,
        goal_amount_cents: data.employer.goal_amount_cents ?? 0,
        goal_start_amount: data.employer.goal_start_amount ?? 0,
        goal_earned_since_start:
          data.employer.goal_earned_since_start ?? 0,
        currency: data.employer.currency ?? "CHF",
        stripe: employerStripeId,
        stripe_status: data.employer.stripe_status ?? null,
        is_active: true,
        stripe_charges_enabled:
          data.employer.stripe_charges_enabled ?? false,
        share_page_access: true,
      };

      setEmployerDisplayProfile(displayProfile);

      const employerCanReceive =
        data.employer.payment_account_mode === "own_account" &&
        Boolean(employerStripeId);

      if (employerCanReceive) {
        list.push(displayProfile);
      }
    } else {
      setEmployerDisplayProfile(null);
    }

    (data.employees || []).forEach((e: any) => {
      const p = e.profiles_earner;
      list.push({
        id: e.earner_id,
        type: "earner",
        name: p.display_name,
        avatar_url: p.avatar_url ?? null,
        goal_title: p.goal_title ?? null,
        goal_amount_cents: p.goal_amount_cents ?? 0,
        goal_start_amount: p.goal_start_amount ?? 0,
        goal_earned_since_start: p.goal_earned_since_start ?? 0,
        currency: p.currency ?? "CHF",
        stripe: p.stripe_account_id,
        is_active: e.is_active,
        stripe_charges_enabled: p.stripe_charges_enabled ?? false,
        share_page_access: e.share_page_access ?? false,
      });
    });

    setRecipients(list);
    return employerStripeId;
  };

  const createScheme = async () => {
    const newErrors: {
      name?: boolean;
      parts?: {
        label?: boolean;
        percent?: boolean;
        recipient?: boolean;
      }[];
    } = {};

    let hasError = false;

    // ---- scheme name ----
    if (!newName.trim()) {
      newErrors.name = true;
      hasError = true;
    }

    // ---- parts ----
    newErrors.parts = parts.map((p) => {
      const partErrors: any = {};

      if (!p.label || !p.label.trim()) {
        partErrors.label = true;
        hasError = true;
      }

      if (!p.percent || Number(p.percent) <= 0) {
        partErrors.percent = true;
        hasError = true;
      }

      if (!p.destination_id) {
        partErrors.recipient = true;
        hasError = true;
      }

      return partErrors;
    });

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    // ---- total percent check ----
    if (total !== 100) {
      showInfo(
        t("error"),
        `${t("schemes_total_percent")}: ${total}%`
      );
      return;
    }

    const res = await authenticatedFetch('/api/employers/schemes/create', {
      method: 'POST',
      body: JSON.stringify({
        name: newName,
        parts,
      }),
    });

    const data = await res.json();

    if (data.success) {
      setNotice(t("schemes_created_notice"));
      setTimeout(() => setNotice(null), 3000);

      setNewName('');
      setParts([
        {
          part_index: 1,
          label: '',
          percent: 100,
          destination_kind: 'earner',
          destination_id: null,
        },
      ]);
      setErrors({});

      loadSchemes();
    } else {
      showInfo(t("error"), data.error);
    }
  };

  const addPart = () => {
    setParts((prev) => [
      ...prev,
      {
        part_index: prev.length + 1,
        label: '',
        percent: 0,
        destination_kind: 'earner',
        destination_id: null,
      },
    ]);
  };

  const removePart = (index: number) => {
    setParts((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((part, i) => ({
          ...part,
          part_index: i + 1,
        }))
    );

    setErrors((prev) => {
      if (!prev.parts) return prev;

      return {
        ...prev,
        parts: prev.parts.filter((_, i) => i !== index),
      };
    });

    setFocusedPercentIndex((current) => {
      if (current === null) return null;
      if (current === index) return null;
      return current > index ? current - 1 : current;
    });
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);

      // 1. Load the current employer state from our DB.
      const freshEmployerProfile = await loadEmployerStripeStatus();

      // 2. Load recipients and resolve the current Stripe account ID.
      const stripeAccountId = await loadRecipients();

      // 3. If an account exists, sync its real Stripe state.
      // Use the freshly loaded profile, not stale React state.
      if (
        stripeAccountId &&
        freshEmployerProfile?.stripe_status !== "deleted"
      ) {
        await syncEmployerStripe(stripeAccountId);

        // stripe-settings may have changed charges/payouts/status/account ID.
        // Reload before rendering the account status block.
        await loadEmployerStripeStatus();
      }

      // 4. Reload recipients because Stripe sync may have changed
      // recipient availability.
      await loadRecipients();
      await loadSchemes();

      setLoading(false);
    };

    init();
  }, [employerId]);

  const deleteScheme = (id: string) => {
    setDeleteModal({
      open: true,
      schemeId: id,
    });
  };

  const syncEmployerStripe = async (stripeAccountId: string | null) => {
    if (!stripeAccountId) return;

    await authenticatedFetch(
      '/api/employers/stripe-settings'
    );
  };

  const editScheme = async (s: any) => {
    const newName = prompt(t("schemes_edit_name"), s.name);
    if (newName === null) return;

    const active_from = prompt(
      t("schemes_edit_start"),
      s.active_from ? s.active_from.substring(0, 10) : ""
    );

    const active_to = prompt(
      t("schemes_edit_end"),
      s.active_to ? s.active_to.substring(0, 10) : ""
    );

    const res = await authenticatedFetch("/api/employers/schemes/update", {
      method: "POST",
      body: JSON.stringify({
        scheme_id: s.id,
        name: newName,
        active_from: active_from || null,
        active_to: active_to || null,
      }),
    });

    const data = await res.json();
    if (data.success) loadSchemes();
    else alert(t("error") + ": " + data.error);
  };

  const recipientOptions = recipients.map(r => ({
    code: `${r.type}:${r.id}`,
    label: r.name + (r.stripe ? "" : ` ⚠ ${t("schemes_no_stripe_short")}`)
  }));

  const [editingSchemeId, setEditingSchemeId] = useState<string | null>(null);
  const [editSchemeName, setEditSchemeName] = useState("");
  const [editParts, setEditParts] = useState<Part[]>([]);
  const [savingEditParts, setSavingEditParts] = useState(false);

  const startEditingParticipants = (scheme: any) => {
    const existingParts: Part[] = (scheme.parts || [])
      .slice()
      .sort(
        (a: any, b: any) =>
          Number(a.part_index ?? 0) - Number(b.part_index ?? 0)
      )
      .map((part: any, index: number) => ({
        part_index: index + 1,
        label: part.label ?? "",
        percent: Number(part.percent ?? 0),
        destination_kind: part.destination_kind ?? part.destination_type ?? "earner",
        destination_id: part.destination_id ?? null,
      }));

    setEditingSchemeId(scheme.id);
    setEditSchemeName(String(scheme.name ?? ""));
    setEditParts(
      existingParts.length > 0
        ? existingParts
        : [
            {
              part_index: 1,
              label: "",
              percent: 100,
              destination_kind: "earner",
              destination_id: null,
            },
          ]
    );
  };

  const cancelEditingParticipants = () => {
    setEditingSchemeId(null);
    setEditSchemeName("");
    setEditParts([]);
  };

  const addEditPart = () => {
    setEditParts((prev) => [
      ...prev,
      {
        part_index: prev.length + 1,
        label: "",
        percent: 0,
        destination_kind: "earner",
        destination_id: null,
      },
    ]);
  };

  const removeEditPart = (index: number) => {
    setEditParts((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((part, i) => ({
          ...part,
          part_index: i + 1,
        }))
    );
  };

  const saveEditedParticipants = async (scheme: any) => {
    if (savingEditParts) return;

    const trimmedName = editSchemeName.trim();

    if (!trimmedName) {
      showInfo(t("error"), t("schemes_name_required"));
      return;
    }

    const invalidPart = editParts.find(
      (part) =>
        !part.label.trim() ||
        !part.destination_id ||
        !part.percent ||
        Number(part.percent) <= 0
    );

    if (invalidPart) {
      showInfo(
        t("error"),
        "Please complete all participant fields before saving."
      );
      return;
    }

    const editTotal = editParts.reduce(
      (sum, part) => sum + Number(part.percent || 0),
      0
    );

    if (Math.abs(editTotal - 100) > 0.000001) {
      showInfo(
        t("error"),
        `${t("schemes_total_percent")}: ${editTotal}%`
      );
      return;
    }

    const selected = editParts
      .map((part) =>
        recipients.find(
          (recipient) =>
            recipient.id === part.destination_id &&
            recipient.type === part.destination_kind
        )
      )
      .filter(Boolean) as Recipient[];

    const problematic = selected.filter(
      (recipient) =>
        !recipient.is_active ||
        !recipient.stripe ||
        recipient.stripe_charges_enabled === false
    );

    if (problematic.length > 0) {
      const names = problematic.map((recipient) => recipient.name).join(", ");

      const confirmed = window.confirm(
        `Some participants cannot currently receive tips: ${names}. ` +
          `You can save the scheme, but payments to these participants may fail. ` +
          `Save anyway?`
      );

      if (!confirmed) return;
    }

    setSavingEditParts(true);

    try {
      const res = await authenticatedFetch("/api/employers/schemes/update-parts", {
        method: "POST",
        body: JSON.stringify({
          scheme_id: scheme.id,
          parts: editParts,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        showInfo(
          t("error"),
          data?.error || "Failed to update scheme participants."
        );
        return;
      }

      if (trimmedName !== String(scheme.name ?? "").trim()) {
        const metadataRes = await authenticatedFetch(
          "/api/employers/schemes/update",
          {
            method: "POST",
            body: JSON.stringify({
              scheme_id: scheme.id,
              name: trimmedName,
            }),
          }
        );

        const metadataData = await metadataRes.json();

        if (!metadataRes.ok || !metadataData.success) {
          showInfo(
            t("error"),
            metadataData?.error || "Failed to update scheme name."
          );
          return;
        }
      }

      setEditingSchemeId(null);
      setEditSchemeName("");
      setEditParts([]);
      await loadSchemes();

      if (Array.isArray(data.warnings) && data.warnings.length > 0) {
        const names = data.warnings
          .map((warning: any) => warning.name || warning.destination_id)
          .join(", ");

        showInfo(
          "Scheme updated",
          `The scheme was updated, but these participants are not fully ready to receive tips: ${names}.`
        );
      } else {
        showInfo(
          "Scheme updated",
          "Participants were updated successfully. The existing QR code remains unchanged."
        );
      }
    } catch (error) {
      console.error("Save scheme participants failed:", error);

      if (error instanceof Error && error.message === "Not authenticated") {
        showInfo(t("error"), "Your session has expired. Please sign in again.");
      } else {
        showInfo(t("error"), "Failed to update scheme participants.");
      }
    } finally {
      setSavingEditParts(false);
    }
  };

  const directEmployerQrUrl = useMemo(() => {
  const employer = recipients.find(r => r.type === "employer");

  if (
    !employer ||
    !employer.stripe ||
    !employerProfile?.stripe_charges_enabled ||
    !employerProfile?.stripe_account_id
  ) {
    return null;
  }

  // 🔥 ВАЖНО: тот же роут, что у работников
  return `${getPublicAppUrl()}/t/${employer.slug}`;
}, [recipients, employerProfile]);


  const generateQR = (schemeId: string) => {
    const url = `${getPublicAppUrl()}/c/${schemeId}`;
    setQrUrl(url);
  };

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        await loadEmployerStripeStatus(); // 🔹 инфо-блок
        await loadRecipients();           // 🔹 схемы
        await loadSchemes();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [employerId]);

  const selectedRecipients = parts
  .map((p) =>
    p.destination_id ? `${p.destination_kind}:${p.destination_id}` : null
  )
  .filter(Boolean);

  return (
    <div className="space-y-8 text-sm text-slate-700">
      <LoaderOverlay show={loading || stripeActionLoading} />
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          {t("tips_qr_title")}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {t("tips_qr_intro")}
        </p>
      </div>

      {employerProfile && (
        <div className="space-y-4">

          {/* Stripe account was closed */}
          {employerProfile.stripe_status === "deleted" && (
            <div className="rounded-lg bg-orange-50 border border-orange-200 p-4 space-y-3">
              <div>
                <p className="font-medium text-orange-800">
                  {t("stripe_account_deleted_title")}
                </p>
                <p className="mt-1 text-sm text-orange-700">
                  {t("stripe_account_deleted_text")}
                </p>
              </div>

              <Button
                variant="green"
                onClick={() => setShowStripeSetupModal(true)}
              >
                {t("stripe_create_again")}
              </Button>
            </div>
          )}

          {/* Employer intentionally manages the team without a payout account */}
          {employerProfile.stripe_status !== "deleted" &&
            employerProfile.payment_account_mode === "team_only" &&
            !employerProfile.stripe_account_id && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
                <div>
                  <p className="font-medium text-slate-900">
                    {t("stripe_account_not_opened_title")}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {t("stripe_account_not_opened_text")}
                  </p>
                </div>

                <Button
                  variant="green"
                  onClick={() => setShowStripeSetupModal(true)}
                >
                  {t("stripe_account_open_button")}
                </Button>
              </div>
            )}

          {/* Existing Stripe account */}
          {employerProfile.stripe_status !== "deleted" &&
            employerProfile.stripe_account_id && (
              <div
                className={
                  employerProfile.stripe_charges_enabled
                    ? "bg-green-50 border border-green-300 rounded p-4 text-green-800"
                    : "bg-orange-50 border border-orange-300 rounded p-4 text-orange-800"
                }
              >
                {employerProfile.stripe_charges_enabled ? (
                  <div className="flex items-center gap-2 font-medium">
                    <span className="text-green-600 text-lg">✔</span>
                    <span>{t("stripe_charges_enabled_ok")}</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 font-medium">
                      <span className="text-orange-600 text-lg">⚠</span>
                      <span>{t("stripe_charges_enabled_bad")}</span>
                    </div>

                    <button
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 text-sm font-medium"
                      onClick={async () => {
                        setStripeActionLoading(true);
                        const res = await authenticatedFetch(
                          "/api/employers/stripe-dashboard",
                          { method: "POST" },
                        );

                        const data = await res.json();

                        if (data?.url) {
                          window.location.href = data.url;
                        } else {
                          setStripeActionLoading(false);
                          showInfo(
                            t("error"),
                            data?.error || "Stripe error"
                          );
                        }
                      }}
                    >
                      {t("stripe_dashboard_button")}
                    </button>
                  </div>
                )}
              </div>
            )}
        </div>
      )}

      {/* TIPS & QR NAVIGATION */}
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
        {[
          { id: "lists" as const, label: t("tips_qr_tab_lists") },
          { id: "schemes" as const, label: t("tips_qr_tab_schemes") },
          { id: "direct" as const, label: t("tips_qr_tab_direct") },
        ].map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => setActiveSection(section.id)}
            className={cn(
              "rounded-lg px-3 py-2.5 text-sm font-medium transition",
              activeSection === section.id
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            )}
          >
            {section.label}
          </button>
        ))}
      </div>

      <p className="text-sm text-slate-500">
        {activeSection === "lists"
          ? t("tips_qr_lists_intro")
          : activeSection === "schemes"
          ? t("tips_qr_schemes_intro")
          : t("tips_qr_direct_intro")}
      </p>

      {activeSection === "direct" && directEmployerQrUrl && (
        <div className="border rounded p-4 bg-white space-y-4">
          <h2 className="text-lg font-semibold">
            {t("qr_company_title")}
          </h2>

          <p className="text-sm text-slate-600">
            {t("qr_company_description")}
          </p>

          <div className="flex justify-center">
            <QRWithLogo value={directEmployerQrUrl} />
          </div>

          <QRDownloadButtons value={directEmployerQrUrl} />
        </div>
      )}

      {activeSection === "schemes" && (
        <>
          <div className="border rounded p-4">
        <h2 className="text-lg font-semibold mb-3">{t("schemes_create_title")}</h2>

        <Input
          placeholder={t("schemes_name_placeholder")}
          value={newName}
          onChange={(e) => {
            setNewName(e.target.value);
            setErrors((prev) => ({ ...prev, name: false }));
          }}
          className={cn(
            "mb-3",
            errors.name && "border-red-500 focus-visible:ring-red-500"
          )}
        />

        {parts.map((p, i) => (
          <div key={i} className="border p-3 rounded mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium">
                {t("schemes_part")} #{i + 1}
              </p>

              {parts.length > 1 && i > 0 && (
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => removePart(i)}
                >
                  {t("schemes_remove_part")}
                </Button>
              )}
            </div>

            {/* LABEL */}
            <Input
              className={cn(
                "my-1",
                errors.parts?.[i]?.label && "border-red-500 focus-visible:ring-red-500"
              )}
              placeholder={t("schemes_part_label_placeholder")}
              value={p.label}
              onChange={(e) => {
                const copy = [...parts];
                copy[i].label = e.target.value;
                setParts(copy);

                setErrors((prev) => {
                  const next = { ...prev };
                  if (next.parts?.[i]) next.parts[i].label = false;
                  return next;
                });
                setErrors((prev) => {
                  const next = { ...prev };
                  if (next.parts?.[i]) next.parts[i].percent = false;
                  return next;
                });
              }}
            />

            {/* PERCENT + RECIPIENT IN ONE ROW */}
            <div className="flex gap-3 items-start my-1">
              {/* PERCENT */}
              <div className="w-[140px]">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t("schemes_choose_share")}
                </label>

                <Input
                  className={cn(
                    "w-full pr-8",
                    errors.parts?.[i]?.percent &&
                      "border-red-500 focus-visible:ring-red-500"
                  )}
                  type="number"
                  value={p.percent}
                  suffix={focusedPercentIndex === i ? null : "%"}
                  onFocus={() => {
                    setFocusedPercentIndex(i);

                    if (String(p.percent) === "0") {
                      const copy = [...parts];
                      copy[i].percent = "";
                      setParts(copy);
                    }
                  }}
                  onBlur={() => {
                    setFocusedPercentIndex(null);
                  }}
                  onChange={(e) => {
                    const copy = [...parts];
                    copy[i].percent =
                      e.target.value === "" ? "" : Number(e.target.value);
                    setParts(copy);

                    setErrors((prev) => {
                      const next = { ...prev };
                      if (next.parts?.[i]) next.parts[i].percent = false;
                      return next;
                    });
                  }}
                />

                {errors.parts?.[i]?.percent && (
                  <p className="mt-1 text-xs text-red-600">
                    {t("schemes_percent_positive_error")}
                  </p>
                )}
              </div>

              {/* RECIPIENT */}
              <div
                className={cn(
                  "flex-1",
                  errors.parts?.[i]?.recipient &&
                    "rounded-md ring-1 ring-red-500"
                )}
              >
                <SearchableDropdown
                  label={t("schemes_select_recipient")}
                  value={
                    p.destination_id
                      ? `${p.destination_kind}:${p.destination_id}`
                      : ""
                  }
                  onChange={(val) => {
                    const copy = [...parts];
                    if (!val) {
                      copy[i].destination_kind = "earner";
                      copy[i].destination_id = null;
                    } else {
                      const [kind, id] = val.split(":");
                      copy[i].destination_kind = kind;
                      copy[i].destination_id = id;
                    }
                    setParts(copy);
                    setErrors((prev) => {
                      const next = { ...prev };
                      if (next.parts?.[i]) next.parts[i].recipient = false;
                      return next;
                    });
                  }}
                  options={recipients
                    .filter((r) => {
                      const code = `${r.type}:${r.id}`;

                      // разрешаем текущий выбранный
                      if (
                        p.destination_id &&
                        code === `${p.destination_kind}:${p.destination_id}`
                      ) {
                        return true;
                      }

                      // исключаем уже выбранных в других частях
                      return !selectedRecipients.includes(code);
                    })
                    .map((r) => ({
                      code: `${r.type}:${r.id}`,
                      label:
                        r.name +
                        (r.is_active === false
                          ? ` ⚠ ${t("schemes_not_active_short")}`
                          : r.stripe_charges_enabled === false
                          ? ` ⚠ ${t("schemes_cannot_receive_short")}`
                          : ""),
                    }))}
                />
              </div>
            </div>
          </div>
        ))}

        <Button variant="outline" className="mr-2" onClick={addPart}>
          {t("schemes_add_part")}
        </Button>

        <Button
          variant="green"
          disabled={total !== 100}
          onClick={createScheme}
        >
          {total === 100
            ? `100% · ${t("schemes_btn_create")}`
            : `${total}%`}
        </Button>
      </div>

      {/* LIST OF SCHEMES */}
      <div>
        <h2 className="text-lg font-semibold mb-2">{t("schemes_list_title")}</h2>

        {qrUrl && (
          <EmployerQRModal
            url={qrUrl}
            onClose={() => setQrUrl(null)}
            title={t("schemes_qr_title")}
          />
        )}
        {notice && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-300 text-green-800 text-sm animate-fade-in">
            {notice}
          </div>
        )}
        {schemes.map((s) => {
          const now = Date.now();
          const from = s.active_from ? new Date(s.active_from).getTime() : null;
          const to = s.active_to ? new Date(s.active_to).getTime() : null;

          const isFuture = from && from > now;
          const isExpired = to && to < now;

          const resolvedParticipants = s.parts.map((p: any) => ({
            part: p,
            recipient:
              recipients.find(
                (x) =>
                  x.id === p.destination_id &&
                  x.type === p.destination_kind
              ) ?? null,
          }));

          const participants = resolvedParticipants
            .map((item: { part: any; recipient: Recipient | null }) => item.recipient)
            .filter(Boolean) as Recipient[];

          const missingParts = resolvedParticipants.filter(
            (item: { part: any; recipient: Recipient | null }) => !item.recipient
          );

          const inactiveParticipants = participants.filter(
            (r) => r.type === "earner" && r.is_active === false
          );

          const blockedParticipants = participants.filter(
            (r) => r.stripe_charges_enabled === false
          );

          const hasIssues =
            missingParts.length > 0 ||
            inactiveParticipants.length > 0 ||
            blockedParticipants.length > 0;

          // текущий выбранный владелец страницы
          const currentOwnerCode =
            s.payment_page_owner_type && s.payment_page_owner_id
              ? `${s.payment_page_owner_type}:${s.payment_page_owner_id}`
              : null;

          return (
            <details key={s.id} className="border rounded p-3 mb-2">
                <summary className="flex justify-between items-center cursor-pointer select-none">
                  <span className="font-medium flex items-center gap-2">
                    {s.name}
                    <ChevronDown size={18} className="text-slate-500" />
                  </span>

                <div className="flex gap-3 items-center text-sm">
                  {isExpired && (
                    <span className="text-red-600">{t("schemes_status_expired")}</span>
                  )}

                  {isFuture && (
                    <span className="text-blue-600">{t("schemes_status_future")}</span>
                  )}
                  {!isExpired && !isFuture && (
                    hasIssues ? (
                      <span className="text-orange-600">
                        ⚠ {t("schemes_status_has_issues")}
                      </span>
                    ) : (
                      <span className="text-green-600">✔ {t("schemes_status_active")}</span>
                    )
                  )}
                  <Button
                    variant="orange"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDeleteModal({ open: true, schemeId: s.id });
                    }}
                  >
                    {t("schemes_delete")}
                  </Button>
                </div>
              </summary>

              {/* PARTICIPANTS LIST */}
              <p className="text-xs text-slate-500 ml-4 mb-2">
                {t("schemes_owner_hint")}
              </p>
              <ul className="mt-3 ml-4 space-y-2">
                {s.parts.map((p: any) => {
                  const r = recipients.find(
                    (x) =>
                      x.id === p.destination_id &&
                      x.type === p.destination_kind
                  );

                  // код текущего участника: "earner:UUID" или "employer:UUID"
                  const optionCode = r ? `${r.type}:${r.id}` : "";

                  return (
                    <li key={p.id} className="border rounded p-2 bg-slate-50 flex justify-between items-center">
                      <div>
                        <p>
                          <b>
                            {p.label && p.label.trim()
                              ? p.label
                              : r
                              ? r.name
                              : t("schemes_recipient")}
                          </b>
                          : {p.percent}%
                        </p>

                        <p>
                          {t("schemes_recipient")}:{" "}
                          {r ? (
                            <>
                              {r.name}
                              {r.stripe ? (
                                <span className="font-mono text-xs ml-1 text-slate-600">
                                  → {r.stripe}
                                </span>
                              ) : (
                                <span className="text-orange-600 ml-1">
                                  ⚠ {t("schemes_no_stripe")}
                                </span>
                              )}
                            </>
                          ) : (
                            <i>{t("not_found")}</i>
                          )}
                        </p>
                      </div>

                      {/* OWNER SELECTOR – SWITCH ON THE RIGHT */}
                      {r && (
                        <ToggleSwitch
                          checked={currentOwnerCode === optionCode}
                          disabled={!r.share_page_access}
                          onChange={(checked) =>
                            checked
                              ? saveOwner(s.id, r.type, r.id)
                              : saveOwner(s.id, null, null)
                          }
                        />
                      )}
                    </li>
                  );
                })}
              </ul>

              {/* EDIT PARTICIPANTS */}
              <div className="mt-4">
                {editingSchemeId !== s.id ? (
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      startEditingParticipants(s);
                    }}
                  >
                    {t("schemes_edit_scheme")}
                  </Button>
                ) : (
                  <div className="mt-3 border rounded-lg p-4 bg-white space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {t("schemes_edit_scheme")}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          {t("schemes_edit_qr_unchanged")}
                        </p>
                      </div>

                      <div className="text-sm font-medium">
                        Total:{" "}
                        {editParts.reduce(
                          (sum, part) => sum + Number(part.percent || 0),
                          0
                        )}
                        %
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        {t("schemes_name_label")}
                      </label>
                      <Input
                        value={editSchemeName}
                        onChange={(e) => setEditSchemeName(e.target.value)}
                        placeholder={t("schemes_name_placeholder")}
                      />
                    </div>

                    {editParts.map((part, index) => {
                      const selectedEditRecipients = editParts
                        .map((candidate) =>
                          candidate.destination_id
                            ? `${candidate.destination_kind}:${candidate.destination_id}`
                            : null
                        )
                        .filter(Boolean);

                      return (
                        <div
                          key={`${s.id}-edit-${index}`}
                          className="border rounded p-3 bg-slate-50 space-y-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-medium">
                              {t("schemes_part")} #{index + 1}
                            </span>

                            {editParts.length > 1 && (
                              <Button
                                variant="outline"
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  removeEditPart(index);
                                }}
                              >
                                {t("schemes_remove_part")}
                              </Button>
                            )}
                          </div>

                          <Input
                            placeholder={t("schemes_part_label_placeholder")}
                            value={part.label}
                            onChange={(e) => {
                              const copy = [...editParts];
                              copy[index] = {
                                ...copy[index],
                                label: e.target.value,
                              };
                              setEditParts(copy);
                            }}
                          />

                          <div className="flex gap-3 items-start">
                            <div className="w-[140px]">
                              <label className="block text-sm font-medium text-slate-700 mb-1">
                                {t("schemes_choose_share")}
                              </label>

                              <Input
                                type="number"
                                value={part.percent}
                                onChange={(e) => {
                                  const copy = [...editParts];
                                  copy[index] = {
                                    ...copy[index],
                                    percent:
                                      e.target.value === ""
                                        ? ""
                                        : Number(e.target.value),
                                  };
                                  setEditParts(copy);
                                }}
                              />
                            </div>

                            <div className="flex-1">
                              <SearchableDropdown
                                label={t("schemes_select_recipient")}
                                value={
                                  part.destination_id
                                    ? `${part.destination_kind}:${part.destination_id}`
                                    : ""
                                }
                                onChange={(value) => {
                                  const copy = [...editParts];

                                  if (!value) {
                                    copy[index] = {
                                      ...copy[index],
                                      destination_kind: "earner",
                                      destination_id: null,
                                    };
                                  } else {
                                    const [kind, id] = value.split(":");

                                    copy[index] = {
                                      ...copy[index],
                                      destination_kind: kind,
                                      destination_id: id,
                                    };
                                  }

                                  setEditParts(copy);
                                }}
                                options={recipients
                                  .filter((recipient) => {
                                    const code = `${recipient.type}:${recipient.id}`;
                                    const currentCode = part.destination_id
                                      ? `${part.destination_kind}:${part.destination_id}`
                                      : null;

                                    if (currentCode === code) return true;

                                    return !selectedEditRecipients.includes(code);
                                  })
                                  .map((recipient) => ({
                                    code: `${recipient.type}:${recipient.id}`,
                                    label:
                                      recipient.name +
                                      (recipient.is_active === false
                                        ? ` ⚠ ${t("schemes_not_active_short")}`
                                        : !recipient.stripe ||
                                          recipient.stripe_charges_enabled === false
                                        ? ` ⚠ ${t("schemes_cannot_receive_short")}`
                                        : ""),
                                  }))}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          addEditPart();
                        }}
                      >
                        {t("schemes_add_part")}
                      </Button>

                      <Button
                        variant="green"
                        type="button"
                        disabled={
                          savingEditParts ||
                          Math.abs(
                            editParts.reduce(
                              (sum, part) =>
                                sum + Number(part.percent || 0),
                              0
                            ) - 100
                          ) > 0.000001
                        }
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          saveEditedParticipants(s);
                        }}
                      >
                        {savingEditParts
                          ? "Saving..."
                          : Math.abs(
                              editParts.reduce(
                                (sum, part) =>
                                  sum + Number(part.percent || 0),
                                0
                              ) - 100
                            ) <= 0.000001
                          ? `100% · Save changes`
                          : `${editParts.reduce(
                              (sum, part) =>
                                sum + Number(part.percent || 0),
                              0
                            )}%`}
                      </Button>

                      <Button
                        variant="outline"
                        type="button"
                        disabled={savingEditParts}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          cancelEditingParticipants();
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* ISSUES BLOCK */}
              {hasIssues && (
                <div className="mt-3 p-3 rounded bg-orange-50 border border-orange-200 text-orange-800 text-sm">
                  {missingParts.length > 0 && (
                    <div className="mb-2">
                      <p className="font-medium">
                        {t("schemes_missing_participants_title")}
                      </p>
                      <ul className="ml-4 list-disc">
                        {missingParts.map(({ part }: any) => (
                          <li key={part.id}>
                            {part.label || t("schemes_recipient")}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {inactiveParticipants.length > 0 && (
                    <div className="mb-2">
                      <p className="font-medium">{t("schemes_inactive_employees_title")}</p>
                      <ul className="ml-4 list-disc">
                        {inactiveParticipants.map((r) => (
                          <li key={r.id}>{r.name}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {blockedParticipants.length > 0 && (
                    <div>
                      <p className="font-medium">{t("schemes_blocked_participants_title")}</p>
                      <ul className="ml-4 list-disc">
                        {blockedParticipants.map((r) => (
                          <li key={r.id}>{r.name}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {hasIssues && (
                <div className="mt-3 p-3 rounded bg-orange-50 border border-orange-200 text-orange-800 text-sm">
                  ⚠ {t("schemes_qr_warning")}
                </div>
              )}

              {/* DISPLAY SETTINGS – INLINE ROW */}
              <div className="flex gap-6 mt-4 items-center flex-wrap">
                {/* Показывать цель */}
                <label className="flex items-center gap-2">
                  <ToggleSwitch
                    checked={s.show_goal}
                    onChange={(v) => saveDisplay(s.id, "show_goal", v)}
                  />
                  <span>{t("schemes_show_goal")}</span>
                </label>

                {/* Если цели показываем → появляется "показывать сумму" */}
                {s.show_goal && (
                  <label className="flex items-center gap-2">
                    <ToggleSwitch
                      checked={s.show_goal_amount}
                      onChange={(v) => saveDisplay(s.id, "show_goal_amount", v)}
                    />
                    <span>{t("schemes_show_goal_amount")}</span>
                  </label>
                )}

                {/* Прогресс Появляется ТОЛЬКО если: show_goal = true AND show_goal_amount = true */}
                {s.show_goal && s.show_goal_amount && (
                  <label className="flex items-center gap-2">
                    <ToggleSwitch
                      checked={s.show_progress}
                      onChange={(v) => saveDisplay(s.id, "show_progress", v)}
                    />
                    <span>{t("schemes_show_progress")}</span>
                  </label>
                )}
              </div>
              <Button
                variant="green"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  // определяем owner как на payment-page
                  const owner =
                    recipients.find(
                      r =>
                        r.type === s.payment_page_owner_type &&
                        r.id === s.payment_page_owner_id
                    ) ||
                    employerDisplayProfile;

                  setPreviewModal({
                    open: true,
                    ownerProfile: {
                      name: owner?.name ?? "—",
                      avatar: owner?.avatar_url ?? null,
                      goalTitle: owner?.goal_title ?? null,
                      goalAmountCents: owner?.goal_amount_cents ?? null,
                      goalStartAmount: owner?.goal_start_amount ?? 0,
                      goalEarnedSinceStart:
                        owner?.goal_earned_since_start ?? 0,
                      currency: owner?.currency ?? "CHF",
                    },
                    flags: {
                      showGoal: s.show_goal ?? true,
                      showGoalAmount: s.show_goal_amount ?? true,
                      showProgress: s.show_progress ?? true,
                    }
                  });
                }}
              >
                {t("schemes_preview")}
              </Button>
              {/* GENERATE QR */}
              <Button
                variant="orange"
                onClick={() => generateQR(s.id)}
                className="mt-4"
              >
                {t("schemes_generate_qr")}
              </Button>
            </details>
          );
        })}

        {schemes.length === 0 && !loading && (
          <p className="text-slate-500">{t("schemes_no_schemes")}</p>
        )}
      </div>

        </>
      )}

      {activeSection === "lists" && (
        <EmployerDirectories schemes={schemes} />
      )}

      {previewModal.open && previewModal.ownerProfile && (
        <SchemePayPageModal
          open={previewModal.open}
          onClose={() =>
            setPreviewModal({
              open: false,
              ownerProfile: null,
              flags: null,
            })
          }
          ownerProfile={previewModal.ownerProfile}
          flags={
            previewModal.flags ?? {
              showGoal: true,
              showGoalAmount: true,
              showProgress: true,
            }
          }
        />
      )}
      {deleteModal.open && (
        <DeleteSchemeModal
          open={deleteModal.open}
          schemeId={deleteModal.schemeId!}
          onClose={() => setDeleteModal({ open: false })}
          onConfirm={confirmDeleteScheme}
        />
      )}
      <EmployerStripeAccountSetupModal
        open={showStripeSetupModal}
        loading={stripeActionLoading}
        onClose={() => {
          if (!stripeActionLoading) {
            setShowStripeSetupModal(false);
          }
        }}
        onConfirm={handleOpenStripeAccount}
      />

      <InfoModal
        open={infoModal.open}
        title={infoModal.title}
        message={infoModal.message}
        onClose={() => setInfoModal({ open: false, title: "", message: "" })}
      />
    </div>
  );
}
