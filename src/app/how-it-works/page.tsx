import type { Metadata } from "next";
import HowItWorksClient from "./HowItWorksClient";

export const metadata: Metadata = {
  title: "Click4Tip – Step-by-step guide",
  description:
    "Learn how Click4tip works for employers and employees: QR codes, tip distribution, Stripe, profiles and payouts.",
};

export default function HowItWorksPage() {
  return <HowItWorksClient />;
}
