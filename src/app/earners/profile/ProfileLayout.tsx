// src/app/earners/profile/ProfileLayout.tsx
'use client';

import { useState, useEffect } from 'react';
import type { Database } from '@/types/supabase';
import { Tabs } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";
import Header from '@/components/Header';
import EmployersTab from './EmployersTab';
import Reports from './Reports';
import Payouts from './Payouts';
import { useT } from "@/lib/translation";
import { ProfileOverview } from './ProfileOverview';
import { ProfileMyPage } from './ProfileMyPage';
import { ProfileQR } from './ProfileQR';
import { EarnerOnboardingChecklist } from "./EarnerOnboardingChecklist";

export type EarnerProfile = Database['public']['Tables']['profiles_earner']['Row'];

type Props = {
  profile: EarnerProfile;
};

export function ProfileLayout({ profile }: Props) {
  const [freshProfile, setFreshProfile] = useState(profile);
  const { t } = useT();
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const searchParams = useSearchParams();

  // читаем вкладку из URL
  const tabFromUrl = searchParams.get("tab");

  // локальный стейт с fallback
  const [activeTab, setActiveTab] = useState(tabFromUrl || 'overview');
  const goToTab = (key: string) => {
    setActiveTab(key);
    router.push(`?tab=${key}`, { scroll: false });
  };

  const tabs = [
    { key: 'overview', label: t("tab_overview") },
    { key: 'mypage', label: t("tab_myPage") },
    { key: 'qr', label: t("tab_qrCode") },
    { key: 'employers', label: t("tab_employers") },
    { key: 'reports', label: t("tab_reports") },
    { key: 'payouts', label: t("tab_payouts") },

  ];

  async function refreshProfile() {
    const { data } = await supabase
      .from("profiles_earner")
      .select("*")
      .eq("id", profile.id)
      .single();

    if (data) setFreshProfile(data);
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4">
      <Header />

      <div className="max-w-3xl mx-auto space-y-6 pt-5">
        <Card className="p-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">
              {t("welcome").replace("{name}", freshProfile.display_name)}
            </h1>
            <p className="text-sm text-slate-600">{t("accountReady")}</p>
          </div>  
          <EarnerOnboardingChecklist
            earnerId={freshProfile.id}
            personalDetailsDone={Boolean(freshProfile.display_name)}
            profilePhotoDone={Boolean(freshProfile.avatar_url)}
            payoutsDone={Boolean(freshProfile.stripe_charges_enabled)}
            onboardingChecks={
              (freshProfile.onboarding_checks as { qr_placed?: boolean }) ?? {}
            }
            onRefreshProfile={refreshProfile}
            onNavigate={goToTab}
          />
        </Card>
        {/* Tabs with URL sync */}
        <Tabs 
          activeTab={activeTab}
          onChange={(key) => {
            setActiveTab(key);
            router.push(`?tab=${key}`, { scroll: false });
          }}
          tabs={tabs}
        />
        <Card className="p-4">
          {activeTab === 'overview' && (
            <ProfileOverview
              profile={freshProfile}
              onProfileUpdated={setFreshProfile}
            />
          )}
          {activeTab === 'mypage' && <ProfileMyPage profile={freshProfile} />}
          {activeTab === 'qr' && <ProfileQR profile={freshProfile} />} 
          {activeTab === 'employers' && <EmployersTab earnerId={freshProfile.id} />}
          {activeTab === 'reports' && <Reports profile={freshProfile} />}
          {activeTab === 'payouts' && <Payouts profile={freshProfile} />}
        </Card>
      </div>
    </div>
  );
}
