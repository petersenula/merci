"use client";

import { usePathname } from "next/navigation";

export default function HideHeaderWhenPayment({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // страницы оплаты — это /t/[slug]
  const isPaymentPage = pathname?.startsWith("/t/");

  if (isPaymentPage) {
    return null; // Header не рендерим
  }

  return <>{children}</>;
}
