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

export default function EmployerHelp() {
  const { t } = useT();

  const faqItems = [
    ["employer_help_faq_stripe_q", "employer_help_faq_stripe_a"],
    ["employer_help_faq_employee_stripe_q", "employer_help_faq_employee_stripe_a"],
    ["employer_help_faq_not_ready_q", "employer_help_faq_not_ready_a"],
    ["employer_help_faq_list_scheme_q", "employer_help_faq_list_scheme_a"],
    ["employer_help_faq_profile_distribution_q", "employer_help_faq_profile_distribution_a"],
    ["employer_help_faq_change_q", "employer_help_faq_change_a"],
    ["employer_help_faq_qr_change_q", "employer_help_faq_qr_change_a"],
    ["employer_help_faq_multiple_q", "employer_help_faq_multiple_a"],
    ["employer_help_faq_invoice_q", "employer_help_faq_invoice_a"],
    ["employer_help_faq_customer_q", "employer_help_faq_customer_a"],
    ["employer_help_faq_reports_q", "employer_help_faq_reports_a"],
    ["employer_help_faq_support_q", "employer_help_faq_support_a"],
  ] as const;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          {t("employer_help_title")}
        </h1>

        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
          {t("employer_help_subtitle")}
        </p>
      </div>

      <section className="rounded-xl border border-green-200 bg-green-50 p-5">
        <h2 className="text-base font-semibold text-slate-900">
          {t("employer_help_quick_title")}
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-700">
          {t("employer_help_quick_text")}
        </p>

        <div className="mt-4 grid gap-2 sm:grid-cols-4">
          <div className="rounded-lg bg-white px-3 py-3 text-center text-sm font-medium text-slate-700">
            {t("employer_help_quick_scan")}
          </div>

          <div className="rounded-lg bg-white px-3 py-3 text-center text-sm font-medium text-slate-700">
            {t("employer_help_quick_page")}
          </div>

          <div className="rounded-lg bg-white px-3 py-3 text-center text-sm font-medium text-slate-700">
            {t("employer_help_quick_tip")}
          </div>

          <div className="rounded-lg bg-white px-3 py-3 text-center text-sm font-medium text-slate-700">
            {t("employer_help_quick_distribution")}
          </div>
        </div>
      </section>

      <div className="space-y-4">
        {/* STEP 1 */}
        <StepCard
          number={1}
          title={t("employer_help_step1_title")}
          intro={t("employer_help_step1_intro")}
          icon={<Building2 size={20} />}
        >
          <GuideSection title={t("employer_help_what_to_do")}>
            <ol className="list-decimal space-y-1 pl-5">
              <li>{t("employer_help_step1_do_1")}</li>
              <li>{t("employer_help_step1_do_2")}</li>
              <li>{t("employer_help_step1_do_3")}</li>
            </ol>
          </GuideSection>

          <GuideSection title={t("employer_help_what_happens_next")}>
            <p>{t("employer_help_step1_next")}</p>
          </GuideSection>

          <GuideSection
            title={t("employer_help_important")}
            tone="important"
          >
            <p>{t("employer_help_step1_important")}</p>
          </GuideSection>
        </StepCard>

        {/* STEP 2 */}
        <StepCard
          number={2}
          title={t("employer_help_step2_title")}
          intro={t("employer_help_step2_intro")}
          icon={<CircleDollarSign size={20} />}
        >
          <GuideSection title={t("employer_help_what_to_do")}>
            <ol className="list-decimal space-y-1 pl-5">
              <li>{t("employer_help_step2_do_1")}</li>
              <li>{t("employer_help_step2_do_2")}</li>
              <li>{t("employer_help_step2_do_3")}</li>
            </ol>
          </GuideSection>

          <GuideSection title={t("employer_help_step2_may_need")}>
            <ul className="list-disc space-y-1 pl-5">
              <li>{t("employer_help_step2_item_name")}</li>
              <li>{t("employer_help_step2_item_phone")}</li>
              <li>{t("employer_help_step2_item_iban")}</li>
              <li>{t("employer_help_step2_item_company")}</li>
              <li>{t("employer_help_step2_item_register")}</li>
              <li>{t("employer_help_step2_item_id")}</li>
            </ul>
          </GuideSection>

          <GuideSection title={t("employer_help_what_happens_next")}>
            <p>{t("employer_help_step2_next")}</p>
          </GuideSection>

          <GuideSection
            title={t("employer_help_important")}
            tone="important"
          >
            <div className="space-y-2">
              <p>{t("employer_help_step2_privacy")}</p>
              <p>{t("employer_help_step2_important")}</p>
            </div>
          </GuideSection>
        </StepCard>

        {/* STEP 3 */}
        <StepCard
          number={3}
          title={t("employer_help_step3_title")}
          intro={t("employer_help_step3_intro")}
          icon={<Users size={20} />}
        >
          <GuideSection title={t("employer_help_what_to_do")}>
            <ol className="list-decimal space-y-1 pl-5">
              <li>{t("employer_help_step3_do_1")}</li>
              <li>{t("employer_help_step3_do_2")}</li>
              <li>{t("employer_help_step3_do_3")}</li>
              <li>{t("employer_help_step3_do_4")}</li>
              <li>{t("employer_help_step3_do_5")}</li>
              <li>{t("employer_help_step3_do_6")}</li>
            </ol>
          </GuideSection>

          <GuideSection title={t("employer_help_what_happens_next")}>
            <p>{t("employer_help_step3_next")}</p>
          </GuideSection>

          <GuideSection
            title={t("employer_help_important")}
            tone="important"
          >
            <p>{t("employer_help_step3_important")}</p>
          </GuideSection>
        </StepCard>

        {/* STEP 4 */}
        <StepCard
          number={4}
          title={t("employer_help_step4_title")}
          intro={t("employer_help_step4_intro")}
          icon={<QrCode size={20} />}
        >
          <GuideSection title={t("employer_help_step4_payment_title")}>
            <div className="space-y-2">
              <p>{t("employer_help_step4_payment_text_1")}</p>
              <p>{t("employer_help_step4_payment_text_2")}</p>
            </div>
          </GuideSection>

          <GuideSection title={t("employer_help_step4_goal_title")}>
            <p>{t("employer_help_step4_goal_intro")}</p>

            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>{t("employer_help_step4_goal_item_1")}</li>
              <li>{t("employer_help_step4_goal_item_2")}</li>
              <li>{t("employer_help_step4_goal_item_3")}</li>
              <li>{t("employer_help_step4_goal_item_4")}</li>
            </ul>

            <p className="mt-2">
              {t("employer_help_step4_goal_effect")}
            </p>

            <p className="mt-2 font-medium">
              {t("employer_help_step4_goal_optional")}
            </p>
          </GuideSection>

          <GuideSection title={t("employer_help_step4_options_title")}>
            <p>{t("employer_help_step4_options_intro")}</p>
          </GuideSection>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-900">
                {t("employer_help_qr_lists_title")}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {t("employer_help_qr_lists_text")}
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                {t("employer_help_qr_lists_example")}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-900">
                {t("employer_help_schemes_title")}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {t("employer_help_schemes_text")}
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                {t("employer_help_schemes_example")}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-900">
                {t("employer_help_employee_direct_title")}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {t("employer_help_employee_direct_text")}
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                {t("employer_help_employee_direct_example")}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-900">
                {t("employer_help_direct_title")}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {t("employer_help_direct_text")}
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                {t("employer_help_direct_example")}
              </p>
            </div>
          </div>

          <GuideSection title={t("employer_help_what_to_do")}>
            <p>{t("employer_help_step4_do")}</p>
          </GuideSection>

          <GuideSection
            title={t("employer_help_important")}
            tone="important"
          >
            <p>{t("employer_help_step4_important")}</p>
          </GuideSection>
        </StepCard>

        {/* STEP 5 */}
        <StepCard
          number={5}
          title={t("employer_help_step5_title")}
          intro={t("employer_help_step5_intro")}
          icon={<FileText size={20} />}
        >
          <GuideSection title={t("employer_help_what_to_do")}>
            <ol className="list-decimal space-y-1 pl-5">
              <li>{t("employer_help_step5_do_1")}</li>
              <li>{t("employer_help_step5_do_2")}</li>
              <li>{t("employer_help_step5_do_3")}</li>
              <li>{t("employer_help_step5_do_4")}</li>
            </ol>
          </GuideSection>

          <GuideSection
            title={t("employer_help_important")}
            tone="important"
          >
            <p className="font-medium">
              {t("employer_help_step5_important")}
            </p>
          </GuideSection>
        </StepCard>

        {/* STEP 6 */}
        <StepCard
          number={6}
          title={t("employer_help_step6_title")}
          intro={t("employer_help_step6_intro")}
          icon={<QrCode size={20} />}
        >
          <GuideSection title={t("employer_help_what_to_do")}>
            <ol className="list-decimal space-y-1 pl-5">
              <li>{t("employer_help_step6_do_1")}</li>
              <li>{t("employer_help_step6_do_2")}</li>
              <li>{t("employer_help_step6_do_3")}</li>
              <li>{t("employer_help_step6_do_4")}</li>
            </ol>
          </GuideSection>

          <GuideSection title={t("employer_help_step6_where")}>
            <p>{t("employer_help_step6_where_text")}</p>
          </GuideSection>

          <GuideSection
            title={t("employer_help_important")}
            tone="important"
          >
            <p>{t("employer_help_step6_important")}</p>
          </GuideSection>
        </StepCard>

        {/* STEP 7 */}
        <StepCard
          number={7}
          title={t("employer_help_step7_title")}
          intro={t("employer_help_step7_intro")}
          icon={<Star size={20} />}
        >
          <GuideSection title={t("employer_help_what_to_do")}>
            <ol className="list-decimal space-y-1 pl-5">
              <li>{t("employer_help_step7_do_1")}</li>
              <li>{t("employer_help_step7_do_2")}</li>
              <li>{t("employer_help_step7_do_3")}</li>
            </ol>
          </GuideSection>

          <GuideSection title={t("employer_help_what_you_can_see")}>
            <ul className="list-disc space-y-1 pl-5">
              <li>{t("employer_help_step7_see_1")}</li>
              <li>{t("employer_help_step7_see_2")}</li>
              <li>{t("employer_help_step7_see_3")}</li>
              <li>{t("employer_help_step7_see_4")}</li>
            </ul>
          </GuideSection>

          <GuideSection
            title={t("employer_help_important")}
            tone="important"
          >
            <p>{t("employer_help_step7_important")}</p>
          </GuideSection>
        </StepCard>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">
          {t("employer_help_faq_title")}
        </h2>

        <p className="mt-1 text-sm text-slate-600">
          {t("employer_help_faq_subtitle")}
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
          {t("employer_help_support_title")}
        </h2>

        <p className="mt-1 text-sm leading-6 text-slate-600">
          {t("employer_help_support_text")}
        </p>

        <Link
          href="/support"
          className="mt-4 inline-flex rounded-md bg-[#1FB94A] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#16963B]"
        >
          {t("employer_help_support_button")}
        </Link>
      </div>
    </div>
  );
}
