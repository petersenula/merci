"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import type { EarnerProfile } from "./ProfileLayout";
import QRWithLogo from "@/components/QRWithLogo";
import { QRCodeCanvas } from "qrcode.react";
import { useT } from "@/lib/translation";
import QRDownloadButtons from "@/components/QRDownloadButtons";

type Props = {
  profile: EarnerProfile;
};

export function ProfileQR({ profile }: Props) {
  const { t } = useT();
  const downloadCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Stripe status UI
  const [checkingStripe, setCheckingStripe] = useState(false);
  const [chargesEnabled, setChargesEnabled] = useState<boolean | null>(
    profile.stripe_charges_enabled ?? null
  );
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [openingDashboard, setOpeningDashboard] = useState(false);

  // 1️⃣ QR value
  const qrValue = useMemo(() => {
    if (typeof window === "undefined") return "";

    const origin = window.location.origin;
    const slug = profile.slug;

    if (!slug) return "";
    return `${origin}/t/${slug}`;
  }, [profile]);

  // 2️⃣ Check Stripe status on tab open
  useEffect(() => {
    async function checkStripe() {
      setStripeError(null);

      const accountId = profile.stripe_account_id;
      if (!accountId) {
        setChargesEnabled(false);
        return;
      }

      try {
        setCheckingStripe(true);

        const res = await fetch(
          `/api/earners/stripe-settings?accountId=${encodeURIComponent(
            accountId
          )}`,
          { method: "GET" }
        );

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          setStripeError(data?.error ?? "Failed to check Stripe status");
          setChargesEnabled(false);
          return;
        }

        const data = await res.json();
        const enabled = Boolean(data?.accountStatus?.charges_enabled);
        setChargesEnabled(enabled);
      } catch (e) {
        console.error(e);
        setStripeError("Failed to check Stripe status");
        setChargesEnabled(false);
      } finally {
        setCheckingStripe(false);
      }
    }

    checkStripe();
  }, [profile.stripe_account_id]);

  // 3️⃣ Open Stripe Dashboard
  const handleOpenStripeDashboard = async () => {
    const accountId = profile.stripe_account_id;
    if (!accountId) return;

    try {
      setOpeningDashboard(true);
      setStripeError(null);

      const res = await fetch("/api/earners/stripe-dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
        accountId,
        chargesEnabled: chargesEnabled === true,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setStripeError(data?.error ?? "Failed to open Stripe dashboard");
        return;
      }

      const data = await res.json();
      if (!data?.url) {
        setStripeError("Stripe dashboard link not returned");
        return;
      }

      window.location.href = data.url;
    } catch (e) {
      console.error(e);
      setStripeError("Failed to open Stripe dashboard");
    } finally {
      setOpeningDashboard(false);
    }
  };

  if (!qrValue) {
    return (
      <div className="text-sm text-slate-600">
        {t("qr_error_no_slug") ?? "QR code link is not available."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold mb-1">
          {t("qr_title")}
        </h2>
        <p className="text-sm text-slate-600">
          {t("qr_description")}
        </p>
      </div>

      {/* Stripe status */}
      <div className="rounded-lg border p-4 bg-white">
        {checkingStripe ? (
          <p className="text-sm text-slate-600">
            {t("stripe_checking_status")}
          </p>
        ) : chargesEnabled ? (
          <p className="text-sm text-green-700 flex items-center gap-2">
            <span aria-hidden>✅</span>
            {t("stripe_charges_enabled_ok")}
          </p>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-red-700 flex items-start gap-2">
              <span aria-hidden>⚠️</span>
              <span>
                {t("stripe_charges_enabled_bad")}
              </span>
            </p>

            <button
              type="button"
              onClick={handleOpenStripeDashboard}
              disabled={openingDashboard || !profile.stripe_account_id}
              className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium bg-orange-600 text-white disabled:opacity-60"
            >
              {openingDashboard
                ? t("stripe_opening_dashboard")
                : t("stripe_dashboard_button")}
            </button>
          </div>
        )}

        {stripeError && (
          <p className="text-sm text-red-600 mt-3">{stripeError}</p>
        )}
      </div>

      {/* QR code — ALWAYS visible */}
      <div className="flex justify-center">
        <QRWithLogo value={qrValue} />
      </div>

      {/* Download buttons */}
      <div className="space-y-2">
        <QRDownloadButtons value={qrValue} />

        <div className="hidden">
          <QRCodeCanvas
            ref={downloadCanvasRef}
            value={qrValue}
            size={1024}
            level="H"
            includeMargin
            imageSettings={{
              src: "/images/logoQR.png",
              height: 256,
              width: 256,
              excavate: true,
            }}
          />
        </div>
      </div>
    </div>
  );
}
