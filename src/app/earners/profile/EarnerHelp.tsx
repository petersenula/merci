"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import {
  Building2,
  ChevronDown,
  CircleDollarSign,
  FileText,
  Info,
  QrCode,
  Star,
  UserRound,
  Users,
} from "lucide-react";
import { useT } from "@/lib/translation";
import { cn } from "@/lib/utils";

type GuideSectionProps = {
  title: string;
  children: ReactNode;
  tone?: "default" | "important";
};

function GuideSection({
  title,
  children,
  tone = "default",
}: GuideSectionProps) {
  return (
    <div
      className={cn(
        "rounded-lg p-4",
        tone === "important"
          ? "border border-amber-200 bg-amber-50"
          : "bg-slate-50"
      )}
    >
      <div className="flex items-start gap-2">
        {tone === "important" && (
          <Info size={16} className="mt-0.5 shrink-0 text-amber-700" />
        )}

        <div className="min-w-0">
          <p
            className={cn(
              "text-xs font-semibold uppercase tracking-wide",
              tone === "important"
                ? "text-amber-800"
                : "text-slate-500"
            )}
          >
            {title}
          </p>

          <div className="mt-2 text-sm leading-6 text-slate-700">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

type StepCardProps = {
  number: number;
  title: string;
  intro: string;
  icon: ReactNode;
  children: ReactNode;
};

function StepCard({
  number,
  title,
  intro,
  icon,
  children,
}: StepCardProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-700">
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-green-700">
              {number}.
            </span>
            <h2 className="text-base font-semibold text-slate-900">
              {title}
            </h2>
          </div>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            {intro}
          </p>

          <div className="mt-4 space-y-3">{children}</div>
        </div>
      </div>
    </section>
  );
}

type FaqItemProps = {
  question: string;
  answer: string;
};

function FaqItem({ question, answer }: FaqItemProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-slate-200 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
      >
        <span className="text-sm font-medium text-slate-900">
          {question}
        </span>

        <ChevronDown
          size={18}
          className={cn(
            "shrink-0 text-slate-500 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <p className="pb-4 pr-8 text-sm leading-6 text-slate-600">
          {answer}
        </p>
      )}
    </div>
  );
}

export default function EarnerHelp() {
  const { t } = useT();

  const faqItems = [
    ["earner_help_faq_employer_required_q", "earner_help_faq_employer_required_a"],
    ["earner_help_faq_qr_difference_q", "earner_help_faq_qr_difference_a"],
    ["earner_help_faq_profile_share_q", "earner_help_faq_profile_share_a"],
    ["earner_help_faq_all_tip_q", "earner_help_faq_all_tip_a"],
    ["earner_help_faq_profile_change_q", "earner_help_faq_profile_change_a"],
    ["earner_help_faq_disable_share_q", "earner_help_faq_disable_share_a"],
    ["earner_help_faq_multiple_employers_q", "earner_help_faq_multiple_employers_a"],
    ["earner_help_faq_leave_q", "earner_help_faq_leave_a"],
    ["earner_help_faq_stripe_q", "earner_help_faq_stripe_a"],
    ["earner_help_faq_money_q", "earner_help_faq_money_a"],
    ["earner_help_faq_goal_q", "earner_help_faq_goal_a"],
    ["earner_help_faq_support_q", "earner_help_faq_support_a"],
  ] as const;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          {t("earner_help_title")}
        </h1>

        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
          {t("earner_help_subtitle")}
        </p>
      </div>

      <section className="rounded-xl border border-green-200 bg-green-50 p-5">
        <h2 className="text-base font-semibold text-slate-900">
          {t("earner_help_quick_title")}
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-700">
          {t("earner_help_quick_text")}
        </p>

        <div className="mt-4 grid gap-2 sm:grid-cols-4">
          <div className="rounded-lg bg-white px-3 py-3 text-center text-sm font-medium text-slate-700">
            {t("earner_help_quick_scan")}
          </div>
          <div className="rounded-lg bg-white px-3 py-3 text-center text-sm font-medium text-slate-700">
            {t("earner_help_quick_page")}
          </div>
          <div className="rounded-lg bg-white px-3 py-3 text-center text-sm font-medium text-slate-700">
            {t("earner_help_quick_tip")}
          </div>
          <div className="rounded-lg bg-white px-3 py-3 text-center text-sm font-medium text-slate-700">
            {t("earner_help_quick_result")}
          </div>
        </div>
      </section>

      <div className="space-y-4">
        {/* STEP 1 */}
        <StepCard
          number={1}
          title={t("earner_help_step1_title")}
          intro={t("earner_help_step1_intro")}
          icon={<UserRound size={20} />}
        >
          <GuideSection title={t("earner_help_what_to_do")}>
            <ol className="list-decimal space-y-1 pl-5">
              <li>{t("earner_help_step1_do_1")}</li>
              <li>{t("earner_help_step1_do_2")}</li>
              <li>{t("earner_help_step1_do_3")}</li>
            </ol>
          </GuideSection>

          <GuideSection title={t("earner_help_what_happens_next")}>
            <p>{t("earner_help_step1_next")}</p>
          </GuideSection>

          <GuideSection title={t("earner_help_important")} tone="important">
            <p>{t("earner_help_step1_important")}</p>
          </GuideSection>
        </StepCard>

        {/* STEP 2 */}
        <StepCard
          number={2}
          title={t("earner_help_step2_title")}
          intro={t("earner_help_step2_intro")}
          icon={<CircleDollarSign size={20} />}
        >
          <GuideSection title={t("earner_help_what_to_do")}>
            <ol className="list-decimal space-y-1 pl-5">
              <li>{t("earner_help_step2_do_1")}</li>
              <li>{t("earner_help_step2_do_2")}</li>
              <li>{t("earner_help_step2_do_3")}</li>
            </ol>
          </GuideSection>

          <GuideSection title={t("earner_help_step2_may_need")}>
            <ul className="list-disc space-y-1 pl-5">
              <li>{t("earner_help_step2_item_name")}</li>
              <li>{t("earner_help_step2_item_phone")}</li>
              <li>{t("earner_help_step2_item_iban")}</li>
              <li>{t("earner_help_step2_item_id")}</li>
            </ul>
          </GuideSection>

          <GuideSection title={t("earner_help_what_happens_next")}>
            <p>{t("earner_help_step2_next")}</p>
          </GuideSection>

          <GuideSection title={t("earner_help_important")} tone="important">
            <div className="space-y-2">
              <p>{t("earner_help_step2_privacy")}</p>
              <p>{t("earner_help_step2_important")}</p>
            </div>
          </GuideSection>
        </StepCard>

        {/* STEP 3 */}
        <StepCard
          number={3}
          title={t("earner_help_step3_title")}
          intro={t("earner_help_step3_intro")}
          icon={<Star size={20} />}
        >
          <GuideSection title={t("earner_help_what_to_do")}>
            <ol className="list-decimal space-y-1 pl-5">
              <li>{t("earner_help_step3_do_1")}</li>
              <li>{t("earner_help_step3_do_2")}</li>
              <li>{t("earner_help_step3_do_3")}</li>
              <li>{t("earner_help_step3_do_4")}</li>
            </ol>
          </GuideSection>

          <GuideSection title={t("earner_help_what_happens_next")}>
            <p>{t("earner_help_step3_next")}</p>
          </GuideSection>

          <GuideSection title={t("earner_help_important")} tone="important">
            <p>{t("earner_help_step3_important")}</p>
          </GuideSection>
        </StepCard>

        {/* STEP 4 */}
        <StepCard
          number={4}
          title={t("earner_help_step4_title")}
          intro={t("earner_help_step4_intro")}
          icon={<QrCode size={20} />}
        >
          <GuideSection title={t("earner_help_what_to_do")}>
            <ol className="list-decimal space-y-1 pl-5">
              <li>{t("earner_help_step4_do_1")}</li>
              <li>{t("earner_help_step4_do_2")}</li>
              <li>{t("earner_help_step4_do_3")}</li>
            </ol>
          </GuideSection>

          <GuideSection title={t("earner_help_step4_where")}>
            <p>{t("earner_help_step4_where_text")}</p>
          </GuideSection>

          <GuideSection title={t("earner_help_important")} tone="important">
            <p>{t("earner_help_step4_important")}</p>
          </GuideSection>
        </StepCard>

        {/* STEP 5 */}
        <StepCard
          number={5}
          title={t("earner_help_step5_title")}
          intro={t("earner_help_step5_intro")}
          icon={<Building2 size={20} />}
        >
          <GuideSection title={t("earner_help_what_to_do")}>
            <ol className="list-decimal space-y-1 pl-5">
              <li>{t("earner_help_step5_do_1")}</li>
              <li>{t("earner_help_step5_do_2")}</li>
              <li>{t("earner_help_step5_do_3")}</li>
              <li>{t("earner_help_step5_do_4")}</li>
              <li>{t("earner_help_step5_do_5")}</li>
            </ol>
          </GuideSection>

          <GuideSection title={t("earner_help_what_happens_next")}>
            <p>{t("earner_help_step5_next")}</p>
          </GuideSection>

          <GuideSection title={t("earner_help_important")} tone="important">
            <p>{t("earner_help_step5_important")}</p>
          </GuideSection>
        </StepCard>

        {/* STEP 6 */}
        <StepCard
          number={6}
          title={t("earner_help_step6_title")}
          intro={t("earner_help_step6_intro")}
          icon={<Users size={20} />}
        >
          <GuideSection title={t("earner_help_step6_profile_title")}>
            <p>{t("earner_help_step6_profile_text")}</p>
          </GuideSection>

          <GuideSection title={t("earner_help_step6_money_title")}>
            <p>{t("earner_help_step6_money_text")}</p>
          </GuideSection>

          <GuideSection title={t("earner_help_step6_schemes_title")}>
            <p>{t("earner_help_step6_schemes_text")}</p>
          </GuideSection>

          <GuideSection title={t("earner_help_important")} tone="important">
            <p>{t("earner_help_step6_important")}</p>
          </GuideSection>
        </StepCard>

        {/* STEP 7 */}
        <StepCard
          number={7}
          title={t("earner_help_step7_title")}
          intro={t("earner_help_step7_intro")}
          icon={<FileText size={20} />}
        >
          <GuideSection title={t("earner_help_step7_reports_title")}>
            <p>{t("earner_help_step7_reports_text")}</p>
          </GuideSection>

          <GuideSection title={t("earner_help_step7_payouts_title")}>
            <p>{t("earner_help_step7_payouts_text")}</p>
          </GuideSection>

          <GuideSection title={t("earner_help_what_you_can_see")}>
            <ul className="list-disc space-y-1 pl-5">
              <li>{t("earner_help_step7_see_1")}</li>
              <li>{t("earner_help_step7_see_2")}</li>
              <li>{t("earner_help_step7_see_3")}</li>
              <li>{t("earner_help_step7_see_4")}</li>
            </ul>
          </GuideSection>
        </StepCard>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">
          {t("earner_help_faq_title")}
        </h2>

        <p className="mt-1 text-sm text-slate-600">
          {t("earner_help_faq_subtitle")}
        </p>

        <div className="mt-3 rounded-xl border border-slate-200 bg-white px-5">
          {faqItems.map(([question, answer]) => (
            <FaqItem
              key={question}
              question={t(question)}
              answer={t(answer)}
            />
          ))}
        </div>
      </section>

      <div className="rounded-xl border border-green-200 bg-green-50 p-5">
        <h2 className="font-semibold text-slate-900">
          {t("earner_help_support_title")}
        </h2>

        <p className="mt-1 text-sm leading-6 text-slate-600">
          {t("earner_help_support_text")}
        </p>

        <Link
          href="/support"
          className="mt-4 inline-flex rounded-md bg-[#1FB94A] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#16963B]"
        >
          {t("earner_help_support_button")}
        </Link>
      </div>
    </div>
  );
}
