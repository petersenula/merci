"use client";

import { ScrollProvider, useScroll } from "./ScrollContext";
import LandingAnalytics from "./LandingAnalytics";

type Props = {
  hero: React.ReactNode;
  value: React.ReactNode;
  individuals: React.ReactNode;
  teams: React.ReactNode;
  faq: React.ReactNode;
  how: React.ReactNode;
  features: React.ReactNode;
  flexibility: React.ReactNode;
  livePreview: React.ReactNode;
  tipjar: React.ReactNode;
  footer: React.ReactNode;
};

function Content(props: Props) {
  const { sections } = useScroll();

  return (
    <>
      <LandingAnalytics />
      <main className="flex flex-col">
        <section ref={sections.hero} data-analytics-section="hero">{props.hero}</section>
        <section ref={sections.how} data-analytics-section="how">{props.how}</section>
        <section ref={sections.features} data-analytics-section="features">{props.features}</section>
        <section ref={sections.flexibility} data-analytics-section="flexibility">{props.flexibility}</section>
        <section ref={sections.value} data-analytics-section="value">{props.value}</section>

        {/* FOR EMPLOYEES */}
        <section ref={sections.individuals} data-analytics-section="individuals">{props.individuals}</section>

        {/* FOR EMPLOYERS */}
        <section ref={sections.teams} data-analytics-section="teams">{props.teams}</section>

        <section ref={sections.faq} data-analytics-section="faq">{props.faq}</section>


      </main>

      {props.footer}
    </>
  );
}

export default function LandingClientShell(props: Props) {
  return (
    <ScrollProvider>
      <Content {...props} />
    </ScrollProvider>
  );
}