'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import EmployeePayPageModal from "./EmployeePayPageModal";
import { useT } from "@/lib/translation";

type EmployeesProps = {
  employerId: string;
  inviteCode: string;
};

export default function Employees({ employerId, inviteCode }: EmployeesProps) {
  const { t } = useT();

  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [details, setDetails] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/employers/employees/list', {
      method: 'POST', 
      body: JSON.stringify({ employer_id: employerId }),
    });

    const data = await res.json();
    setEmployees(data.employees || []);
    setLoading(false);
  };

  const deactivate = async (relId: string) => {
    const res = await fetch('/api/employers/employees/deactivate', {
      method: 'POST',
      body: JSON.stringify({ relation_id: relId }),
    });
    await load();
  };

  const loadDetails = async (earnerId: string) => {
    const res = await fetch('/api/employers/employees/details', {
      method: 'POST',
      body: JSON.stringify({
        employer_id: employerId,
        earner_id: earnerId,
      }),
    });

    const data = await res.json();
    if (data.employee) {
      setDetails({
        ...data.employee,
        earner_id: earnerId
      });

      setSelected(earnerId);
    }
  };

  const [pending, setPending] = useState<any[]>([]);

  const loadPending = async () => {
    const res = await fetch('/api/employers/employees/pending', {
      method: 'POST',
      body: JSON.stringify({ employer_id: employerId }),
    });

    const data = await res.json();
    setPending(data.employees || []);
  };

  useEffect(() => {
    load();
    loadPending();
  }, []);

  const approve = async (linkId: string) => {
    const res = await fetch('/api/employers/employees/approve', {
      method: 'POST',
      body: JSON.stringify({ link_id: linkId }),
    });

    const data = await res.json();
    if (data.success) {
      await load();
      await loadPending();
    } else {
      alert('Ошибка: ' + data.error);
    }
  };

  const reject = async (id: string) => {
    await fetch('/api/employers/employees/reject', {
      method: 'POST',
      body: JSON.stringify({ relation_id: id }),
    });
    loadPending();
  };

  return (
    <div className="space-y-6 text-sm text-slate-700">

      {/* STEP DESCRIPTION */}
      <div className="bg-white border rounded p-4 shadow-sm">
        <p>{t("step3_employees")}</p>
      </div>

      {/* INVITE CODE */}
      <div className="border rounded p-4">
        <p className="font-semibold">{t("employees.invite_title")}</p>
        <p className="mt-1 font-mono bg-slate-200 px-2 py-1 rounded inline-block">
          {inviteCode}
        </p>
        <p className="mt-1 text-slate-600">
          {t("employees.invite_hint")}
        </p>
      </div>

      {/* PENDING */}
      <div>
        <h2 className="text-lg font-semibold mb-2">{t("employees.pending_title")}</h2>

        {pending.length === 0 && (
          <p className="text-slate-500">{t("employees.pending_empty")}</p>
        )}

        {pending.map((e) => (
          <div
            key={e.id}
            className="border rounded p-3 my-2 flex justify-between items-center"
          >
            <div>
              <p className="font-medium">{e.profiles_earner.display_name}</p>
              <p className="text-slate-500">{t("employees.pending_request")}</p>
            </div>

            <div className="flex gap-2">
              <Button variant="green" onClick={() => approve(e.id)}>
                {t("employees.accept")}
              </Button>
              <Button variant="orange" onClick={() => reject(e.id)}>
                {t("employees.reject")}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* EMPLOYEES */}
      <div>
        <h2 className="text-lg font-semibold mb-2">{t("employees.list_title")}</h2>

        {loading && <p>{t("employees.loading")}</p>}
        {!loading && employees.length === 0 && (
          <p className="text-slate-600">{t("employees.empty")}</p>
        )}

        {employees.map((e) => {
          const isOpen = selected === e.earner_id;

          return (
            <div key={e.id} className="border rounded p-3 my-2">
              
              {/* HEADER */}
              <div
                className="flex justify-between items-center cursor-pointer"
                onClick={async () => {
                  if (isOpen) {
                    setSelected(null);
                    return;
                  }

                  setSelected(e.earner_id);
                  await loadDetails(e.earner_id);
                }}
              >
                <div>
                  <p className="font-medium">{e.profiles_earner.display_name}</p>

                  <p className="text-slate-500">
                    {t("employees.status")}:{" "}
                    {e.is_active
                      ? t("employees.status_active")
                      : t("employees.status_disabled")}
                  </p>

                  <p className="text-slate-500">
                    {t("employees.role")}: {e.role}
                  </p>

                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-slate-600">{t("employees.payment_page")}</span>
                    {e.share_page_access ? (
                      <button
                        className="text-white bg-green-600 hover:bg-green-700 text-xs px-2 py-1 rounded"
                        onClick={async (ev) => {
                          ev.stopPropagation();
                          await loadDetails(e.earner_id);
                          setShowModal(true);
                        }}
                      >
                        {t("employees.payment_open")}
                      </button>
                    ) : (
                      <button
                        disabled
                        className="text-xs px-2 py-1 rounded bg-slate-300 text-slate-500 cursor-not-allowed"
                      >
                        {t("employees.payment_closed")}
                      </button>
                    )}
                  </div>
                </div>

                {e.is_active && (
                  <button
                    className="text-xs bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 rounded"
                    onClick={async (ev) => {
                      ev.stopPropagation();
                      if (confirm(t("employees.delete_confirm"))) {
                        await deactivate(e.id);
                      }
                    }}
                  >
                    {t("employees.delete")}
                  </button>
                )}
              </div>

              {/* DETAILS */}
              {isOpen && details && details.earner_id === e.earner_id && (
                <div className="mt-4 bg-slate-50 p-4 rounded border">
                  <p><strong>{t("employees.details_name")}</strong> {details.profiles_earner.display_name}</p>

                  {details.profiles_earner.avatar_url && (
                    <img
                      src={details.profiles_earner.avatar_url}
                      alt="avatar"
                      className="w-20 h-20 rounded-full mt-2"
                    />
                  )}

                  <p className="mt-2">
                    <strong>{t("employees.details_goal")}</strong> {details.profiles_earner.goal_title}
                  </p>

                  <p>
                    <strong>{t("employees.details_goal_amount")}</strong>{" "}
                    {(details.profiles_earner.goal_amount_cents / 100).toFixed(2)} CHF
                  </p>

                  <p className="mt-2">
                    <strong>{t("employees.details_stripe_id")}</strong>{" "}
                    {details.profiles_earner.stripe_account_id || "—"}
                  </p>

                  <p className="mt-2 flex items-center gap-2">
                    {details.profiles_earner.stripe_charges_enabled ? (
                      <>
                        <span className="text-green-600 text-lg">✔</span>
                        <span>{t("employees.stripe_ready_text")}</span>
                      </>
                    ) : (
                      <>
                        <span className="text-red-600 text-lg">⚠</span>
                        <span>{t("employees.stripe_not_ready_text")}</span>
                      </>
                    )}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MODAL */}
      {showModal && details && (
        <EmployeePayPageModal
          open={showModal}
          onClose={() => setShowModal(false)}
          profile={details}
        />
      )}
    </div>
  );
}
