"use client";

import { ScrollProvider, useScroll } from "./ScrollContext";
import HeroSection from "./sections/HeroSection";
import HowItWorksSection from "./sections/HowItWorksSection";
import TrustSection from "./sections/TrustSection";
import TipJarSection from "./sections/TipJarSection";
import EmployerSection from "./sections/EmployerSection";
import EmployeeSection from "./sections/EmployeeSection";


function Content() {
  const { sections } = useScroll();

  return (
    <main className="flex flex-col">
      <section ref={sections.hero}>
        <HeroSection />
      </section>

      {/* FOR EMPLOYERS */}
      <EmployerSection />

      {/* FOR EMPLOYEES */}
      <EmployeeSection />

      <section ref={sections.how}>
        <HowItWorksSection />
      </section>

      <section ref={sections.features}>
        <TrustSection />
      </section>

      <section ref={sections.tipjar}>
        <TipJarSection />
      </section>
    </main>
  );
}

export default function LandingPage() {
  return (
    <ScrollProvider>
      <Content />
    </ScrollProvider>
  );
}
