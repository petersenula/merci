'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import EmployerQRModal from "./EmployerQRModal";
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


type Recipient = {
  id: string;
  name: string;
  type: "employer" | "earner";
  stripe: string | null;

  avatar_url?: string | null;
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
  const { t } = useT();

  const [schemes, setSchemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
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

  const [deleteModal, setDeleteModal] = useState<{ open: boolean; schemeId?: string }>({
    open: false
  });

  const confirmDeleteScheme = async (id: string) => {
    setDeleteModal({ open: false });

    const res = await fetch("/api/employers/schemes/delete", {
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
  const saveOwner = (schemeId: string, owner_type: string, owner_id: string) => {
    clearTimeout(ownerSaveTimers.current[schemeId]);
    ownerSaveTimers.current[schemeId] = setTimeout(async () => {
      await fetch("/api/employers/schemes/set-payment-owner", {
        method: "POST",
        body: JSON.stringify({ scheme_id: schemeId, owner_type, owner_id }),
      });
      loadSchemes();
    }, 1500);
  };

  // ---- API: set display options ----
  const saveDisplay = (schemeId: string, field: string, value: boolean) => {
    clearTimeout(displaySaveTimers.current[schemeId]);
    displaySaveTimers.current[schemeId] = setTimeout(async () => {
      await fetch("/api/employers/schemes/set-display-options", {
        method: "POST",
        body: JSON.stringify({ scheme_id: schemeId, [field]: value }),
      });
      loadSchemes();
    }, 1500);
  };

  const loadSchemes = async () => {
    setLoading(true);
    const res = await fetch('/api/employers/schemes/list', {
      method: 'POST',
      body: JSON.stringify({ employer_id: employerId }),
    });

    const data = await res.json();
    setSchemes(data.schemes || []);
    setLoading(false);
  };

  const loadRecipients = async () => {
    const res = await fetch("/api/employers/employees/for-schemes", {
      method: "POST",
      body: JSON.stringify({ employer_id: employerId }),
    });

    const data = await res.json();
    if (data.error) return null;

    const list: Recipient[] = [];
    let employerStripeId: string | null = null;

    if (data.employer) {
      employerStripeId = data.employer.stripe_account_id;

      list.push({
        id: data.employer.user_id,
        type: "employer",
        name: data.employer.display_name || data.employer.name || t("company"),
        avatar_url: data.employer.logo_url ?? null,
        goal_title: data.employer.goal_title ?? null,
        goal_amount_cents: data.employer.goal_amount_cents ?? 0,
        goal_start_amount: data.employer.goal_start_amount ?? 0,
        goal_earned_since_start: data.employer.goal_earned_since_start ?? 0,
        currency: data.employer.currency ?? "CHF",
        stripe: employerStripeId,
        is_active: true,
        stripe_charges_enabled: data.employer.stripe_charges_enabled ?? false,
        share_page_access: true,
      });
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

    const res = await fetch('/api/employers/schemes/create', {
      method: 'POST',
      body: JSON.stringify({
        employer_id: employerId,
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

  useEffect(() => {
    const init = async () => {
      setLoading(true);

      // 1. читаем Supabase → получаем stripe_account_id
      const stripeAccountId = await loadRecipients();

      // 2. синкаем Stripe работодателя
      await syncEmployerStripe(stripeAccountId);

      // 3. перечитываем Supabase с обновлёнными флагами
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

    try {
      await fetch(
        `/api/employers/stripe-settings?accountId=${stripeAccountId}`
      );
    } catch (e) {
      console.error("Employer Stripe sync failed", e);
    }
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

    const res = await fetch("/api/employers/schemes/update", {
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

  const generateQR = (schemeId: string) => {
    const url = `${getPublicAppUrl()}/c/${schemeId}`;
    setQrUrl(url);
  };

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        const stripeAccountId = await loadRecipients();
        await syncEmployerStripe(stripeAccountId);
        await loadRecipients();
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
      <LoaderOverlay show={loading} />
      <div className="bg-white border rounded p-4 shadow-sm space-y-2">
        <p>{t("schemes_intro_text")}</p>
        <p>{t("schemes_intro_company_hint")}</p>
      </div>

      {employer && (
        <div
          className={
            employer.stripe_charges_enabled
              ? "bg-green-50 border border-green-300 rounded p-4 text-green-800"
              : "bg-orange-50 border border-orange-300 rounded p-4 text-orange-800"
          }
        >
          {employer.stripe_charges_enabled ? (
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
                  if (!employer?.stripe) return;

                  const res = await fetch("/api/employers/stripe-dashboard", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      accountId: employer.stripe,
                      chargesEnabled: employer.stripe_charges_enabled,
                    }),
                  });

                  const data = await res.json();

                  if (data?.url) {
                    window.location.href = data.url;
                  }
                }}
              >
                {employer.stripe
                  ? t("stripe_dashboard_button")
                  : t("payouts_complete_settings")}
              </button>
            </div>
          )}
        </div>
      )}

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

        <div className="mb-4 flex items-center gap-3">
          <p className="text-base font-medium">
            {t("schemes_total_percent")}: {total}%
          </p>

          {total === 100 ? (
            <span className="text-green-600 font-bold text-lg">✔</span>
          ) : (
            <span className="text-orange-600 font-bold text-lg">⚠</span>
          )}
        </div>

        {parts.map((p, i) => (
          <div key={i} className="border p-3 rounded mb-4">
            <p className="font-medium mb-2">
              {t("schemes_part")} #{i + 1}
            </p>

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
                  className="w-full pr-8"
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
                  }}
                />
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
          {t("schemes_btn_create")}
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

          const participants = s.parts
            .map((p: any) => {
              const match = recipients.find(
                (x) => x.id === p.destination_id && x.type === p.destination_kind
              );
              return match ?? null;
            })
            .filter(Boolean) as Recipient[];

          const inactiveParticipants = participants.filter(
            (r) => r.type === "earner" && r.is_active === false
          );

          const blockedParticipants = participants.filter(
            (r) => r.stripe_charges_enabled === false
          );

          const hasIssues =
            inactiveParticipants.length > 0 || blockedParticipants.length > 0;

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
                          onChange={() =>
                            saveOwner(s.id, r.type, r.id)
                          }
                        />
                      )}
                    </li>
                  );
                })}
              </ul>

              {/* ISSUES BLOCK */}
              {hasIssues && (
                <div className="mt-3 p-3 rounded bg-orange-50 border border-orange-200 text-orange-800 text-sm">
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
                    recipients.find(r => r.type === "employer");

                  setPreviewModal({
                    open: true,
                    ownerProfile: {
                      name: owner?.name ?? "—",
                      avatar: owner?.avatar_url ?? null,
                      goalTitle: owner?.goal_title ?? null,
                      goalAmountCents: owner?.goal_amount_cents ?? null,
                      goalStartAmount: owner?.goal_start_amount ?? 0,
                      goalEarnedSinceStart: 0,
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
      <InfoModal
        open={infoModal.open}
        title={infoModal.title}
        message={infoModal.message}
        onClose={() => setInfoModal({ open: false, title: "", message: "" })}
      />
    </div>
  );
}
