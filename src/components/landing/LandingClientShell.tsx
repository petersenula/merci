"use client";

import { ScrollProvider, useScroll } from "./ScrollContext";

type Props = {
  hero: React.ReactNode;
  value: React.ReactNode;
  individuals: React.ReactNode;
  teams: React.ReactNode;
  how: React.ReactNode;
  features: React.ReactNode;
  livePreview: React.ReactNode;
  tipjar: React.ReactNode;
  footer: React.ReactNode;
};

function Content(props: Props) {
  const { sections } = useScroll();

  return (
    <>
      <main className="flex flex-col">
        <section ref={sections.hero}>{props.hero}</section>
        <section ref={sections.value}>{props.value}</section>

        {/* FOR EMPLOYEES */}
        <section ref={sections.individuals}>{props.individuals}</section>

        {/* FOR EMPLOYERS */}
        <section ref={sections.teams}>{props.teams}</section>

        <section ref={sections.how}>{props.how}</section>
        <section ref={sections.features}>{props.features}</section>

        <section>{props.livePreview}</section>

        <section ref={sections.tipjar}>{props.tipjar}</section>
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