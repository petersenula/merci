'use client';

import { useState } from "react";
import type { Database } from "@/types/supabase";
import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";
import { useT } from "@/lib/translation";
import { useSearchParams } from "next/navigation";
import { EmployerOverview } from "./EmployerOverview";
import Employees from "./Employees";
import Schemes from './EmployerSchemes';
import { EmployerMyPage } from "./EmployerMyPage";
import EmployerPayouts from './EmployerPayouts';
import EmployerReports from "./EmployerReports";
import { EmployerOnboardingChecklist } from "./EmployerOnboardingChecklist";

export type EmployerProfile = Database["public"]["Tables"]["employers"]["Row"];

type Props = {
  profile: EmployerProfile;
  onProfileUpdated?: (profile: EmployerProfile) => void;
};

export function EmployerProfileLayout({ profile }: Props) {
  const [freshProfile, setFreshProfile] = useState(profile);
  const { t } = useT();
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  // LIST OF TABS + step numbers
  const Step = ({ n }: { n: number }) => (
    <span className="text-green-600 text-lg italic font-semibold">
      {n} <span className="mx-0.5">·</span>
    </span>
  );

  const tabs = [
    { key: "overview", label: t("tab_overview") },
    { key: "mypage", label: t("tab_myPage") },
    { key: "employees", label: t("tab_employees") },
    { key: "schemes", label: t("tab_schemes") },
    { key: "reports", label: t("tab_reports") },
    { key: "stripe", label: t("tab_payouts") },
  ];

  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab");

  const [activeTab, setActiveTab] = useState(tabFromUrl || "overview");
  const goToTab = (key: string) => {
  setActiveTab(key);
  router.push(`?tab=${key}`, { scroll: false });
};

  // STEP INFO TEXT BLOCKS
  const stepDescription = {
    overview: t("step1_overview"),
    mypage: t("step2_mypage"),
    employees: t("step3_employees"),
    schemes: t("step4_schemes"),
    reports: t("step5_reports"),
    stripe: t("step6_payouts")
  };

  async function refreshProfile() {
    const { data } = await supabase
      .from("employers")
      .select("*")
      .eq("user_id", profile.user_id)
      .single();

    if (data) {
      setFreshProfile(data);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4">
      <Header />

      <div className="max-w-3xl mx-auto space-y-6 pt-5">

        {/* Header Card */}
        <Card className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold">
                {t("welcome").replace("{name}", freshProfile.name)}
              </h1>
              <p className="text-sm text-slate-600">{t("accountReady")}</p>
            </div>
            <EmployerOnboardingChecklist
              employerId={freshProfile.user_id}
              personalDetailsDone={Boolean(freshProfile.display_name)}
              profilePhotoDone={Boolean(freshProfile.logo_url)}
              payoutsDone={Boolean(freshProfile.stripe_payouts_enabled)}
              onboardingChecks={
                typeof freshProfile.onboarding_checks === "object" &&
                freshProfile.onboarding_checks !== null
                  ? (freshProfile.onboarding_checks as { qr_placed?: boolean })
                  : {}
              }
              onRefreshProfile={refreshProfile}
              onNavigate={goToTab}
            />
          </div>
        </Card>
        {/* Tabs */}
        <Tabs 
          activeTab={activeTab} 
          onChange={(key) => {
            setActiveTab(key);
            router.push(`?tab=${key}`, { scroll: false });
          }}
          tabs={tabs} 
        />

        {/* Content */}
        <Card className="p-4">
          {activeTab === "overview" && (
            <EmployerOverview
              profile={freshProfile}
              onProfileUpdated={setFreshProfile}
            />
          )}

          {activeTab === "mypage" && <EmployerMyPage profile={freshProfile} />}

          {activeTab === "schemes" && (
            <Schemes employerId={freshProfile.user_id} />
          )}

          {activeTab === "employees" && (
            <Employees
              employerId={freshProfile.user_id}
              inviteCode={freshProfile.invite_code ?? ""}
            />
          )}

          {activeTab === "reports" && <EmployerReports profile={freshProfile} />}

          {activeTab === "stripe" && <EmployerPayouts profile={freshProfile} />}
        </Card>
      </div>
    </div>
  );
}
