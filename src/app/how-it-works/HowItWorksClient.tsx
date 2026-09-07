"use client";

import { useState } from "react";
import {
  Building2,
  ChevronDown,
  CircleDollarSign,
  FileText,
  QrCode,
  Star,
  UserRound,
  Users,
} from "lucide-react";

import Footer from "@/components/Footer";
import { useT } from "@/lib/translation";
import { cn } from "@/lib/utils";

type Audience = "employer" | "earner";

type GuideStep = {
  number: number;
  title: string;
  intro: string;
  icon: React.ReactNode;
  body: React.ReactNode;
};

function AccordionStep({
  step,
  defaultOpen = false,
}: {
  step: GuideStep;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-start gap-4 p-5 text-left sm:p-6"
        aria-expanded={open}
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-700">
          {step.icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
                Step {step.number}
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900">
                {step.title}
              </h2>
            </div>

            <ChevronDown
              size={20}
              className={cn(
                "mt-1 shrink-0 text-slate-400 transition-transform",
                open && "rotate-180"
              )}
            />
          </div>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            {step.intro}
          </p>
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100 px-5 pb-6 pt-5 sm:px-6">
          {step.body}
        </div>
      )}
    </section>
  );
}

function SectionBlock({
  title,
  children,
  important = false,
}: {
  title: string;
  children: React.ReactNode;
  important?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl p-4",
        important
          ? "border border-amber-200 bg-amber-50"
          : "bg-slate-50"
      )}
    >
      <p
        className={cn(
          "text-xs font-semibold uppercase tracking-wide",
          important ? "text-amber-800" : "text-slate-500"
        )}
      >
        {title}
      </p>

      <div className="mt-2 text-sm leading-6 text-slate-700">
        {children}
      </div>
    </div>
  );
}

function PublicFaqItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-slate-200 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-slate-900">
          {question}
        </span>

        <ChevronDown
          size={18}
          className={cn(
            "shrink-0 text-slate-400 transition-transform",
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

function EmployerGuide() {
  const { t } = useT();

  const steps: GuideStep[] = [
    {
      number: 1,
      title: t("employer_help_step1_title"),
      intro: t("employer_help_step1_intro"),
      icon: <Building2 size={21} />,
      body: (
        <div className="space-y-3">
          <SectionBlock title={t("employer_help_what_to_do")}>
            <ol className="list-decimal space-y-1 pl-5">
              <li>{t("employer_help_step1_do_1")}</li>
              <li>{t("employer_help_step1_do_2")}</li>
              <li>{t("employer_help_step1_do_3")}</li>
            </ol>
          </SectionBlock>
          <SectionBlock title={t("employer_help_what_happens_next")}>
            {t("employer_help_step1_next")}
          </SectionBlock>
          <SectionBlock title={t("employer_help_important")} important>
            {t("employer_help_step1_important")}
          </SectionBlock>
        </div>
      ),
    },
    {
      number: 2,
      title: t("employer_help_step2_title"),
      intro: t("employer_help_step2_intro"),
      icon: <CircleDollarSign size={21} />,
      body: (
        <div className="space-y-3">
          <SectionBlock title={t("employer_help_what_to_do")}>
            <ol className="list-decimal space-y-1 pl-5">
              <li>{t("employer_help_step2_do_1")}</li>
              <li>{t("employer_help_step2_do_2")}</li>
              <li>{t("employer_help_step2_do_3")}</li>
            </ol>
          </SectionBlock>

          <SectionBlock title={t("employer_help_step2_may_need")}>
            <ul className="list-disc space-y-1 pl-5">
              <li>{t("employer_help_step2_item_name")}</li>
              <li>{t("employer_help_step2_item_phone")}</li>
              <li>{t("employer_help_step2_item_iban")}</li>
              <li>{t("employer_help_step2_item_company")}</li>
              <li>{t("employer_help_step2_item_register")}</li>
              <li>{t("employer_help_step2_item_id")}</li>
            </ul>
          </SectionBlock>

          <SectionBlock title={t("employer_help_what_happens_next")}>
            {t("employer_help_step2_next")}
          </SectionBlock>

          <SectionBlock title={t("employer_help_important")} important>
            <div className="space-y-2">
              <p>{t("employer_help_step2_privacy")}</p>
              <p>{t("employer_help_step2_important")}</p>
            </div>
          </SectionBlock>
        </div>
      ),
    },
    {
      number: 3,
      title: t("employer_help_step3_title"),
      intro: t("employer_help_step3_intro"),
      icon: <Users size={21} />,
      body: (
        <div className="space-y-3">
          <SectionBlock title={t("employer_help_what_to_do")}>
            <ol className="list-decimal space-y-1 pl-5">
              <li>{t("employer_help_step3_do_1")}</li>
              <li>{t("employer_help_step3_do_2")}</li>
              <li>{t("employer_help_step3_do_3")}</li>
              <li>{t("employer_help_step3_do_4")}</li>
              <li>{t("employer_help_step3_do_5")}</li>
              <li>{t("employer_help_step3_do_6")}</li>
            </ol>
          </SectionBlock>

          <SectionBlock title={t("employer_help_what_happens_next")}>
            {t("employer_help_step3_next")}
          </SectionBlock>

          <SectionBlock title={t("employer_help_important")} important>
            {t("employer_help_step3_important")}
          </SectionBlock>
        </div>
      ),
    },
    {
      number: 4,
      title: t("employer_help_step4_title"),
      intro: t("employer_help_step4_intro"),
      icon: <QrCode size={21} />,
      body: (
        <div className="space-y-3">
          <SectionBlock title={t("employer_help_step4_payment_title")}>
            <div className="space-y-2">
              <p>{t("employer_help_step4_payment_text_1")}</p>
              <p>{t("employer_help_step4_payment_text_2")}</p>
            </div>
          </SectionBlock>

          <SectionBlock title={t("employer_help_step4_goal_title")}>
            <p>{t("employer_help_step4_goal_intro")}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>{t("employer_help_step4_goal_item_1")}</li>
              <li>{t("employer_help_step4_goal_item_2")}</li>
              <li>{t("employer_help_step4_goal_item_3")}</li>
              <li>{t("employer_help_step4_goal_item_4")}</li>
            </ul>
            <p className="mt-2">{t("employer_help_step4_goal_effect")}</p>
            <p className="mt-2 font-medium">
              {t("employer_help_step4_goal_optional")}
            </p>
          </SectionBlock>

          <div className="grid gap-3 md:grid-cols-2">
            {[
              ["employer_help_qr_lists_title", "employer_help_qr_lists_text", "employer_help_qr_lists_example"],
              ["employer_help_schemes_title", "employer_help_schemes_text", "employer_help_schemes_example"],
              ["employer_help_employee_direct_title", "employer_help_employee_direct_text", "employer_help_employee_direct_example"],
              ["employer_help_direct_title", "employer_help_direct_text", "employer_help_direct_example"],
            ].map(([title, text, example]) => (
              <div
                key={title}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <h3 className="font-semibold text-slate-900">{t(title)}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {t(text)}
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  {t(example)}
                </p>
              </div>
            ))}
          </div>

          <SectionBlock title={t("employer_help_important")} important>
            {t("employer_help_step4_important")}
          </SectionBlock>
        </div>
      ),
    },
    {
      number: 5,
      title: t("employer_help_step5_title"),
      intro: t("employer_help_step5_intro"),
      icon: <UserRound size={21} />,
      body: (
        <div className="space-y-3">
          <SectionBlock title={t("employer_help_what_to_do")}>
            <ol className="list-decimal space-y-1 pl-5">
              <li>{t("employer_help_step5_do_1")}</li>
              <li>{t("employer_help_step5_do_2")}</li>
              <li>{t("employer_help_step5_do_3")}</li>
              <li>{t("employer_help_step5_do_4")}</li>
            </ol>
          </SectionBlock>

          <SectionBlock title={t("employer_help_important")} important>
            {t("employer_help_step5_important")}
          </SectionBlock>
        </div>
      ),
    },
    {
      number: 6,
      title: t("employer_help_step6_title"),
      intro: t("employer_help_step6_intro"),
      icon: <QrCode size={21} />,
      body: (
        <div className="space-y-3">
          <SectionBlock title={t("employer_help_what_to_do")}>
            <ol className="list-decimal space-y-1 pl-5">
              <li>{t("employer_help_step6_do_1")}</li>
              <li>{t("employer_help_step6_do_2")}</li>
              <li>{t("employer_help_step6_do_3")}</li>
              <li>{t("employer_help_step6_do_4")}</li>
            </ol>
          </SectionBlock>

          <SectionBlock title={t("employer_help_step6_where")}>
            {t("employer_help_step6_where_text")}
          </SectionBlock>

          <SectionBlock title={t("employer_help_important")} important>
            {t("employer_help_step6_important")}
          </SectionBlock>
        </div>
      ),
    },
    {
      number: 7,
      title: t("employer_help_step7_title"),
      intro: t("employer_help_step7_intro"),
      icon: <FileText size={21} />,
      body: (
        <div className="space-y-3">
          <SectionBlock title={t("employer_help_what_to_do")}>
            <ol className="list-decimal space-y-1 pl-5">
              <li>{t("employer_help_step7_do_1")}</li>
              <li>{t("employer_help_step7_do_2")}</li>
              <li>{t("employer_help_step7_do_3")}</li>
            </ol>
          </SectionBlock>

          <SectionBlock title={t("employer_help_what_you_can_see")}>
            <ul className="list-disc space-y-1 pl-5">
              <li>{t("employer_help_step7_see_1")}</li>
              <li>{t("employer_help_step7_see_2")}</li>
              <li>{t("employer_help_step7_see_3")}</li>
              <li>{t("employer_help_step7_see_4")}</li>
            </ul>
          </SectionBlock>

          <SectionBlock title={t("employer_help_important")} important>
            {t("employer_help_step7_important")}
          </SectionBlock>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <AccordionStep
          key={step.number}
          step={step}
          defaultOpen={index === 0}
        />
      ))}
    </div>
  );
}

function EarnerGuide() {
  const { t } = useT();

  const steps: GuideStep[] = [
    {
      number: 1,
      title: t("earner_help_step1_title"),
      intro: t("earner_help_step1_intro"),
      icon: <UserRound size={21} />,
      body: (
        <div className="space-y-3">
          <SectionBlock title={t("earner_help_what_to_do")}>
            <ol className="list-decimal space-y-1 pl-5">
              <li>{t("earner_help_step1_do_1")}</li>
              <li>{t("earner_help_step1_do_2")}</li>
              <li>{t("earner_help_step1_do_3")}</li>
            </ol>
          </SectionBlock>
          <SectionBlock title={t("earner_help_what_happens_next")}>
            {t("earner_help_step1_next")}
          </SectionBlock>
          <SectionBlock title={t("earner_help_important")} important>
            {t("earner_help_step1_important")}
          </SectionBlock>
        </div>
      ),
    },
    {
      number: 2,
      title: t("earner_help_step2_title"),
      intro: t("earner_help_step2_intro"),
      icon: <CircleDollarSign size={21} />,
      body: (
        <div className="space-y-3">
          <SectionBlock title={t("earner_help_what_to_do")}>
            <ol className="list-decimal space-y-1 pl-5">
              <li>{t("earner_help_step2_do_1")}</li>
              <li>{t("earner_help_step2_do_2")}</li>
              <li>{t("earner_help_step2_do_3")}</li>
            </ol>
          </SectionBlock>
          <SectionBlock title={t("earner_help_step2_may_need")}>
            <ul className="list-disc space-y-1 pl-5">
              <li>{t("earner_help_step2_item_name")}</li>
              <li>{t("earner_help_step2_item_phone")}</li>
              <li>{t("earner_help_step2_item_iban")}</li>
              <li>{t("earner_help_step2_item_id")}</li>
            </ul>
          </SectionBlock>
          <SectionBlock title={t("earner_help_what_happens_next")}>
            {t("earner_help_step2_next")}
          </SectionBlock>
          <SectionBlock title={t("earner_help_important")} important>
            <div className="space-y-2">
              <p>{t("earner_help_step2_privacy")}</p>
              <p>{t("earner_help_step2_important")}</p>
            </div>
          </SectionBlock>
        </div>
      ),
    },
    {
      number: 3,
      title: t("earner_help_step3_title"),
      intro: t("earner_help_step3_intro"),
      icon: <Star size={21} />,
      body: (
        <div className="space-y-3">
          <SectionBlock title={t("earner_help_what_to_do")}>
            <ol className="list-decimal space-y-1 pl-5">
              <li>{t("earner_help_step3_do_1")}</li>
              <li>{t("earner_help_step3_do_2")}</li>
              <li>{t("earner_help_step3_do_3")}</li>
              <li>{t("earner_help_step3_do_4")}</li>
            </ol>
          </SectionBlock>
          <SectionBlock title={t("earner_help_what_happens_next")}>
            {t("earner_help_step3_next")}
          </SectionBlock>
          <SectionBlock title={t("earner_help_important")} important>
            {t("earner_help_step3_important")}
          </SectionBlock>
        </div>
      ),
    },
    {
      number: 4,
      title: t("earner_help_step4_title"),
      intro: t("earner_help_step4_intro"),
      icon: <QrCode size={21} />,
      body: (
        <div className="space-y-3">
          <SectionBlock title={t("earner_help_what_to_do")}>
            <ol className="list-decimal space-y-1 pl-5">
              <li>{t("earner_help_step4_do_1")}</li>
              <li>{t("earner_help_step4_do_2")}</li>
              <li>{t("earner_help_step4_do_3")}</li>
            </ol>
          </SectionBlock>
          <SectionBlock title={t("earner_help_step4_where")}>
            {t("earner_help_step4_where_text")}
          </SectionBlock>
          <SectionBlock title={t("earner_help_important")} important>
            {t("earner_help_step4_important")}
          </SectionBlock>
        </div>
      ),
    },
    {
      number: 5,
      title: t("earner_help_step5_title"),
      intro: t("earner_help_step5_intro"),
      icon: <Building2 size={21} />,
      body: (
        <div className="space-y-3">
          <SectionBlock title={t("earner_help_what_to_do")}>
            <ol className="list-decimal space-y-1 pl-5">
              <li>{t("earner_help_step5_do_1")}</li>
              <li>{t("earner_help_step5_do_2")}</li>
              <li>{t("earner_help_step5_do_3")}</li>
              <li>{t("earner_help_step5_do_4")}</li>
              <li>{t("earner_help_step5_do_5")}</li>
            </ol>
          </SectionBlock>
          <SectionBlock title={t("earner_help_what_happens_next")}>
            {t("earner_help_step5_next")}
          </SectionBlock>
          <SectionBlock title={t("earner_help_important")} important>
            {t("earner_help_step5_important")}
          </SectionBlock>
        </div>
      ),
    },
    {
      number: 6,
      title: t("earner_help_step6_title"),
      intro: t("earner_help_step6_intro"),
      icon: <Users size={21} />,
      body: (
        <div className="space-y-3">
          <SectionBlock title={t("earner_help_step6_profile_title")}>
            {t("earner_help_step6_profile_text")}
          </SectionBlock>
          <SectionBlock title={t("earner_help_step6_money_title")}>
            {t("earner_help_step6_money_text")}
          </SectionBlock>
          <SectionBlock title={t("earner_help_step6_schemes_title")}>
            {t("earner_help_step6_schemes_text")}
          </SectionBlock>
          <SectionBlock title={t("earner_help_important")} important>
            {t("earner_help_step6_important")}
          </SectionBlock>
        </div>
      ),
    },
    {
      number: 7,
      title: t("earner_help_step7_title"),
      intro: t("earner_help_step7_intro"),
      icon: <FileText size={21} />,
      body: (
        <div className="space-y-3">
          <SectionBlock title={t("earner_help_step7_reports_title")}>
            {t("earner_help_step7_reports_text")}
          </SectionBlock>
          <SectionBlock title={t("earner_help_step7_payouts_title")}>
            {t("earner_help_step7_payouts_text")}
          </SectionBlock>
          <SectionBlock title={t("earner_help_what_you_can_see")}>
            <ul className="list-disc space-y-1 pl-5">
              <li>{t("earner_help_step7_see_1")}</li>
              <li>{t("earner_help_step7_see_2")}</li>
              <li>{t("earner_help_step7_see_3")}</li>
              <li>{t("earner_help_step7_see_4")}</li>
            </ul>
          </SectionBlock>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <AccordionStep
          key={step.number}
          step={step}
          defaultOpen={index === 0}
        />
      ))}
    </div>
  );
}

export default function HowItWorksClient() {
  const { t } = useT();
  const [audience, setAudience] = useState<Audience>("employer");

  const employer = audience === "employer";

  const employerFaq = [
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

  const earnerFaq = [
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

  const faq = employer ? employerFaq : earnerFaq;

  return (
    <>
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {t("how_it_works_public_title")}
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">
              {t("how_it_works_public_subtitle")}
            </p>
          </div>

          <div className="mx-auto mt-8 grid max-w-xl grid-cols-2 gap-1 rounded-xl bg-slate-200 p-1">
            <button
              type="button"
              onClick={() => setAudience("employer")}
              className={cn(
                "rounded-lg px-4 py-3 text-sm font-semibold transition",
                employer
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              {t("how_it_works_for_employers")}
            </button>

            <button
              type="button"
              onClick={() => setAudience("earner")}
              className={cn(
                "rounded-lg px-4 py-3 text-sm font-semibold transition",
                !employer
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              {t("how_it_works_for_employees")}
            </button>
          </div>

          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-50 text-sm font-bold text-green-700">
                0
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-slate-900">
                  {t("how_it_works_registration_title")}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {t("how_it_works_registration_intro")}
                </p>

                <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-700">
                  <li>{t("how_it_works_registration_step1")}</li>

                  <li>
                    {t("how_it_works_registration_step2")}
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      <li>
                        <span className="font-medium">
                          {t("how_it_works_registration_individual_title")}
                        </span>{" "}
                        {t("how_it_works_registration_individual_text")}
                      </li>

                      <li>
                        <span className="font-medium">
                          {t("how_it_works_registration_team_title")}
                        </span>{" "}
                        {t("how_it_works_registration_team_text")}
                      </li>
                    </ul>
                  </li>

                  <li>{t("how_it_works_registration_step3")}</li>
                  <li>{t("how_it_works_registration_step4")}</li>
                  <li>{t("how_it_works_registration_step5")}</li>
                </ol>
              </div>
            </div>
          </section>

          <section className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-5 sm:p-6">
            <h2 className="font-semibold text-slate-900">
              {employer
                ? t("employer_help_quick_title")
                : t("earner_help_quick_title")}
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-700">
              {employer
                ? t("employer_help_quick_text")
                : t("earner_help_quick_text")}
            </p>

            <div className="mt-5 grid gap-2 sm:grid-cols-4">
              {(
                employer
                  ? [
                      "employer_help_quick_scan",
                      "employer_help_quick_page",
                      "employer_help_quick_tip",
                      "employer_help_quick_distribution",
                    ]
                  : [
                      "earner_help_quick_scan",
                      "earner_help_quick_page",
                      "earner_help_quick_tip",
                      "earner_help_quick_result",
                    ]
              ).map((key) => (
                <div
                  key={key}
                  className="rounded-xl bg-white px-3 py-4 text-center text-sm font-medium text-slate-700"
                >
                  {t(key)}
                </div>
              ))}
            </div>
          </section>

          <div className="mt-10">
            <div className="mb-5">
              <h2 className="text-2xl font-semibold text-slate-900">
                {employer
                  ? t("employer_help_title")
                  : t("earner_help_title")}
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                {employer
                  ? t("employer_help_subtitle")
                  : t("earner_help_subtitle")}
              </p>
            </div>

            {employer ? <EmployerGuide /> : <EarnerGuide />}
          </div>

          <section className="mt-12">
            <h2 className="text-2xl font-semibold text-slate-900">
              {employer
                ? t("employer_help_faq_title")
                : t("earner_help_faq_title")}
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              {employer
                ? t("employer_help_faq_subtitle")
                : t("earner_help_faq_subtitle")}
            </p>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-white px-5 sm:px-6">
              {faq.map(([question, answer]) => (
                <PublicFaqItem
                  key={question}
                  question={t(question)}
                  answer={t(answer)}
                />
              ))}
            </div>
          </section>

          <section className="mt-10 rounded-2xl bg-slate-900 px-6 py-8 text-center text-white sm:px-10">
            <h2 className="text-2xl font-semibold">
              {t("how_it_works_ready_title")}
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-300">
              {t("how_it_works_ready_text")}
            </p>

            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <a
                href="/signup"
                className="inline-flex items-center justify-center rounded-lg bg-[#1FB94A] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#16963B]"
              >
                {t("register")}
              </a>

              <a
                href="/support"
                className="inline-flex items-center justify-center rounded-lg border border-slate-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                {t("support_title")}
              </a>
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </>
  );
}
