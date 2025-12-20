"use client";

import { usePathname } from "next/navigation";

export default function MainWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isPaymentPage =
    pathname?.startsWith("/t/") ||
    pathname?.startsWith("/c/");

  return (
    <main className={isPaymentPage ? "" : "pt-16"}>
      {children}
    </main>
  );
}
