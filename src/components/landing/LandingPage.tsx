import HeroSection from "./sections/HeroSection";
import HowItWorksSection from "./sections/HowItWorksSection";
import TrustSection from "./sections/TrustSection";
import TipJarSection from "./sections/TipJarSection";
import EmployerSection from "./sections/EmployerSection";
import EmployeeSection from "./sections/EmployeeSection";
import ValueSection from "./sections/ValueSection";
import LivePreviewSection from "./sections/LivePreviewSection";
import Footer from "@/components/Footer";
import LandingClientShell from "./LandingClientShell";
import HeroSectionServer from "./sections/HeroSection.server";

export default function LandingPage() {
  return (
    <LandingClientShell
      hero={
        <>
          <HeroSectionServer />
          <HeroSection />
        </>
      }
      value={<ValueSection />}
      individuals={<EmployeeSection />}
      teams={<EmployerSection />}
      how={<HowItWorksSection />}
      features={<TrustSection />}
      livePreview={<LivePreviewSection />}
      tipjar={<TipJarSection />}
      footer={<Footer />}
    />
  );
}