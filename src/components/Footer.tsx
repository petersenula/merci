"use client";

import Link from "next/link";
import { useT } from "@/lib/translation";

export default function Footer() {
  const { t } = useT();

  return (
    <footer className="w-full border-t border-border bg-background">
      <div className="max-w-6xl mx-auto px-6 md:px-16 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-foreground/70">

        {/* LEFT */}
        <div>
          © {new Date().getFullYear()} {t("footer_company_name")}
        </div>

        {/* RIGHT */}
        <div className="flex gap-6">
          <Link href="/terms" className="hover:text-foreground underline-offset-4 hover:underline">
            {t("terms_title")}
          </Link>

          <Link href="/privacy" className="hover:text-foreground underline-offset-4 hover:underline">
            {t("privacy_title")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
