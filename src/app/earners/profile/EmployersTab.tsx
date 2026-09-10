'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useT } from "@/lib/translation";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { authenticatedFetch } from "@/lib/authenticatedFetch";
import RequestSentModal from '@/components/RequestSentModal';

type EmployerScheme = {
  employer_id: string;
  scheme_id: string;
  scheme_name?: string;
  percent?: number;
  label?: string;
};

type EmployerRelation = {
  id: string;
  share_page_access: boolean;
  employers: {
    user_id: string;
    name: string;
  };
};

export default function EmployersTab() {
  const [inviteCode, setInviteCode] = useState('');
  const [pending, setPending] = useState<EmployerRelation[]>([]);
  const [active, setActive] = useState<EmployerRelation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [schemes, setSchemes] = useState<EmployerScheme[]>([]);
  const [shareAccess, setShareAccess] = useState(false);
  const [updateTimer, setUpdateTimer] = useState<NodeJS.Timeout | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  // локализация для namespace "employers_tab"
  const { t } = useT();

  const load = async () => {
    setLoading(true);

  const res = await authenticatedFetch('/api/earners/employers/list', {
    method: 'POST'
  });

  const data = await res.json();

    setPending(data.pending || []);
    setActive(data.active || []);

    const res2 = await authenticatedFetch('/api/earners/employers/schemes', {
      method: 'POST',
    });
    const data2 = await res2.json();
    setSchemes(data2.schemes || []);

    setLoading(false);
  };

  const schemesByEmployer: Record<string, any[]> = {};
  schemes.forEach((s) => {
    if (!schemesByEmployer[s.employer_id]) {
      schemesByEmployer[s.employer_id] = [];
    }
    schemesByEmployer[s.employer_id].push(s);
  });

  const updateShareAccess = async (employerId: string, newValue: boolean) => {
    if (updateTimer) clearTimeout(updateTimer);

    const timer = setTimeout(async () => {
      const res = await authenticatedFetch("/api/earners/update-share-access", {
        method: "POST",
        body: JSON.stringify({
          employer_id: employerId,
          share_page_access: newValue,
        }),
      });

      if (res.ok) {
        load();
      } else {
        console.error("Update failed");
      }
    }, 1500);

    setUpdateTimer(timer);
  };

  const sendRequest = async () => {
    const res = await authenticatedFetch('/api/earners/join-employer', {
      method: 'POST',
      body: JSON.stringify({
        invite_code: inviteCode,
        share_page_access: shareAccess
      }),
    });

    const data = await res.json();
    if (data.success) {
      setModalMessage(t('requestSentModalMessage'));
      setModalOpen(true);
      setInviteCode('');
      load();
    } else {
      setModalMessage(
        data.error
          ? t('inviteCodeInvalid')
          : t('inviteCodeInvalid')
      );
      setModalOpen(true);
    }
  };

  const leaveEmployer = async (employerId: string) => {
    if (!confirm(t('leaveConfirm'))) return;

    const res = await authenticatedFetch("/api/earners/leave-employer", {
      method: "POST",
      body: JSON.stringify({
        employer_id: employerId,
      }),
    });

    if (res.ok) {
      load(); // обновляем список работодателей
    } else {
      alert("Error");
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6 text-sm text-slate-700">
      {/* --- Ввод кода приглашения --- */}
      <div className="border rounded p-4">
        <h2 className="text-lg font-semibold mb-2">
          {t('joinTitle')}
        </h2>
        <div>
          <Input
            className="w-full"
            placeholder={t('invitePlaceholder')}
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
          />
        </div>
        {/* Disclaimer */}
        <p className="text-xs text-slate-500 mb-3">
          {t('disclaimer')}
        </p>

        {/* Toggle — разрешать ли использовать страницу */}
        <div className="flex items-center gap-3 mb-3">
          <ToggleSwitch
            checked={shareAccess}
            onChange={setShareAccess}
          />
          <span className="text-slate-500 mt-1">{t('shareAccessLabel')}</span>
        </div>  
        <p className="text-slate-500 text-xs mb-4">
          {t('shareAccessInfo')}
        </p>

        <Button
          onClick={sendRequest}
          variant="green"
          className="w-full mb-3"
        >
          {t('inviteSend')}
        </Button>

        <p className="text-slate-500 mt-1">
          {t('inviteInfo')}
        </p>
      </div>

      {/* --- Pending работодатели --- */}
      <div>
        <h3 className="text-lg font-semibold mb-2">
          {t('pendingTitle')}
        </h3>

        {pending.length === 0 && (
          <p className="text-slate-500">
            {t('pendingEmpty')}
          </p>
        )}

        {pending.map((e) => (
          <div key={e.id} className="border rounded p-3 my-2 bg-yellow-50">
            <p className="font-medium">{e.employers.name}</p>
            <p className="text-slate-500 text-sm">
              {t('pendingItemStatus') /* если хочешь отдельный текст, иначе можно оставить русский */}
            </p>
          </div>
        ))}
      </div>

      {/* --- Активные работодатели --- */}
      <div>
        <h3 className="text-lg font-semibold mb-2">
          {t('employersTitle')}
        </h3>
        {active.length === 0 && (
          <p className="text-slate-500">
            {t('noEmployers')}
          </p>
        )}
        {active.map((e) => {
          const employerId = e.employers.user_id;
          const employerSchemes = schemesByEmployer[employerId] || [];

          return (
            <div key={e.id} className="border rounded p-3 my-2 space-y-4">
              
              {/* Employer header */}
              <div>
                <p className="font-medium">{e.employers.name}</p>
                <p className="text-slate-500 text-sm">
                  {t('activeEmployee')}
                </p>
              </div>

              {/* Share Access Toggle */}
              <div className="flex items-center gap-2">
                <span className="text-slate-500">{t('shareAccessLabel')}:</span>
                <ToggleSwitch
                  checked={e.share_page_access}
                  onChange={(val) => {
                    updateShareAccess(e.employers.user_id, val);
                    e.share_page_access = val;
                    setActive([...active]);
                  }}
                />
              </div>

              {/* Allocation Schemes */}
              <div>
                <p className="text-sm font-medium text-slate-600">
                  {t('schemesTitle')}
                </p>

                {employerSchemes.length > 0 ? (
                  <div className="pl-4 border-l-2 border-slate-200 space-y-2">
                    {employerSchemes.map((s) => (
                      <div
                        key={s.scheme_id}
                        className="text-sm text-slate-700 flex flex-col"
                      >
                        <span>
                          <strong>{t('schemeName')}:</strong> {s.scheme_name}
                        </span>

                        <span>
                          <strong>{t('schemeShare')}:</strong> {s.percent}% ({s.label})
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">
                    {t('noSchemes')}
                  </p>
                )}
              </div>

              {/* Leave Employer Button (always visible) */}
              <div className="pt-2">
                <Button
                  variant="orange"              
                  onClick={() => {
                    if (!confirm(t('leaveConfirm'))) return;
                    leaveEmployer(e.employers.user_id);
                  }}
                >
                  {t('leaveEmployer')}
                </Button>
              </div>

            </div>
          );
        })}
      </div>
      <RequestSentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        message={modalMessage}
      />
    </div>
  );
}