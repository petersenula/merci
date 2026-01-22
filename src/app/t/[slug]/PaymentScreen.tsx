"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

import TipPayment from "./TipPayment";
import StarRating from "./StarRating";
import ProgressBarSmart from "@/components/ProgressBarSmart";
import { useT } from "@/lib/translation";
import { useSearchParams } from "next/navigation";
import SuccessMessage from "@/components/SuccessMessage";
import PaymentProgressBar from "@/components/PaymentProgressBar";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

type Props = {
  slug: string;
  earnerId: string;
  name: string;
  avatar: string | null;
  goalTitle: string | null;
  goalAmountCents: number | null;
  goalStartAmount: number;
  goalEarnedSinceStart: number;
  currency: string;
  schemeId?: string;
  employerId?: string;

  // NEW — flags from allocation_schemes
  showGoal?: boolean;
  showGoalAmount?: boolean;
  showProgress?: boolean;
};

export default function PaymentScreen(props: Props) {
  const {
    slug,
    earnerId,
    name,
    avatar,
    goalTitle,
    goalAmountCents,
    goalStartAmount,
    goalEarnedSinceStart,
    currency,
    schemeId,
    employerId,

    // NEW
    showGoal = true,
    showGoalAmount = true,
    showProgress = true,
  } = props;

  const { lang, setLang, t } = useT();

  const languages = [
    { code: "en", label: "EN" },
    { code: "de", label: "DE" },
    { code: "fr", label: "FR" },
    { code: "it", label: "IT" },
    { code: "es", label: "ES" },
    { code: "zh", label: "中文" },
  ];

  const params = useSearchParams();
  const redirectStatus = params.get("redirect_status");
  const paymentIntentIdFromUrl = params.get("payment_intent");
  const [paidAmount, setPaidAmount] = useState<number | null>(null);
  const [paidCurrency, setPaidCurrency] = useState<string | null>(null);
  const [paymentResult, setPaymentResult] = useState<
    "success" | "failed" | "loading" | null
    >(null);

  const [paymentErrorMessage, setPaymentErrorMessage] = useState<string | null>(
  null
  );

  // ===========================
  // LOAD paymentIntent after redirect
  // ===========================
  useEffect(() => {
    let cancelled = false;

    // 🔒 Guard: если пользователь вернулся назад с уже завершённым payment_intent
    // не даём повторно показывать форму оплаты
    if (paymentIntentIdFromUrl) {
      fetch(
        `/api/payment-status?payment_intent_id=${encodeURIComponent(
          paymentIntentIdFromUrl
        )}`
      )
        .then((r) => r.json())
        .then((data) => {
          if (cancelled) return;

          if (data?.state === "succeeded") {
            setPaidAmount(data.amountCents ?? null);
            setPaidCurrency(data.currency ?? currency);
            setPaymentResult("success");
          }
        })
        .catch(() => {
          // ничего не делаем — fallback ниже отработает
        });
    }

    async function pollPaymentStatus(paymentIntentId: string) {
      const maxAttempts = 20; // ~30 секунд при 1.5s
      const delayMs = 1500;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        if (cancelled) return;

        try {
          const res = await fetch(
            `/api/payment-status?payment_intent_id=${encodeURIComponent(
              paymentIntentId
            )}`
          );
          const data = await res.json();

          if (!data?.ok) {
            // Если API временно упал — просто продолжаем пытаться
          } else if (data.state === "succeeded") {
            setPaidAmount(data.amountCents ?? 0);
            setPaidCurrency((data.currency ?? currency).toUpperCase());
            setPaymentResult("success");
            return;
          } else if (data.state === "failed") {
            setPaymentResult("failed");
            setPaymentErrorMessage(t("payment_failed_message"));
            return;
          }
          // иначе processing — продолжаем
        } catch {
          // сеть/ошибка — продолжаем
        }

        await new Promise((r) => setTimeout(r, delayMs));
      }

      // Таймаут: webhook мог задержаться или пользователь вернулся странно
      setPaymentResult("failed");
      setPaymentErrorMessage(t("payment_processing_timeout"));
    }

    async function loadAfterRedirect() {
      // Stripe часто добавляет эти параметры сам:
      const clientSecret =
        params.get("payment_intent_client_secret") ||
        params.get("payment_intent_client_secret".toLowerCase());

      // Stripe иногда добавляет payment_intent (id) напрямую
      const paymentIntentIdFromUrl = params.get("payment_intent");

      // Если нет вообще признаков возврата — выходим (обычный заход на страницу)
      const hasAnyStripeParam =
        !!clientSecret || !!paymentIntentIdFromUrl || !!params.get("redirect_status");

      if (!hasAnyStripeParam) return;

      // С этого момента мы НИКОГДА не показываем fast-failed.
      // Любая неопределённость = processing + проверка по webhook через API.
      setPaymentResult("loading");
      setPaymentErrorMessage(null);

      // 1) Если у нас есть payment_intent_id из URL — супер, сразу poll API
      if (paymentIntentIdFromUrl) {
        await pollPaymentStatus(paymentIntentIdFromUrl);
        return;
      }

      // 2) Если payment_intent_id нет, но есть clientSecret — попробуем быстро проверить Stripe
      //    (и если вдруг succeeded — сразу покажем success для "удовлетворения")
      if (clientSecret) {
        const stripe = await stripePromise;
        if (!stripe) {
          // Stripe не загрузился — просто остаёмся в processing и не можем poll без id
          setPaymentResult("failed");
          setPaymentErrorMessage(t("payment_cannot_verify"));
          return;
        }

        const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);

        if (!paymentIntent) {
          setPaymentResult("failed");
          setPaymentErrorMessage(t("payment_cannot_verify"));
          return;
        }

        // ✅ Fast success (без ожидания webhook)
        if (paymentIntent.status === "succeeded") {
          setPaidAmount(paymentIntent.amount);
          setPaidCurrency((paymentIntent.currency ?? currency).toUpperCase());
          setPaymentResult("success");
          return;
        }

        // Не succeeded → processing + API, используя paymentIntent.id
        await pollPaymentStatus(paymentIntent.id);
        return;
      }

      // 3) Если нет ни id, ни clientSecret, мы не можем проверить ничего.
      // В таком случае показываем контролируемый failed с понятным текстом.
      setPaymentResult("failed");
      setPaymentErrorMessage(t("payment_cannot_verify"));
    }

    loadAfterRedirect();

    return () => {
      cancelled = true;
    };
  }, [params, t, currency]);

  const [rating, setRating] = useState(5);
  const [currentTipAmount, setCurrentTipAmount] = useState(0);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // ===========================
  // PAYMENT RESULT SCREENS
  // ===========================
  if (paymentResult === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="w-full max-w-sm bg-white rounded-[2rem] shadow-xl px-6 py-8">
          <SuccessMessage
            amount={paidAmount ?? 0}
            currency={paidCurrency ?? currency}
          />
        </div>
      </div>
    );
  }

  if (paymentResult === "failed") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="w-full max-w-sm bg-white rounded-[2rem] shadow-xl px-6 py-8 text-center">
          <p className="text-red-600 font-semibold mb-2">
            {t("payment_failed_title")}
          </p>

          <p className="text-slate-600 text-sm mb-6">
            {paymentErrorMessage ?? t("payment_failed_message")}
          </p>
          <button
            onClick={() => {
              setPaymentResult(null);
              setClientSecret(null);
              setPaymentErrorMessage(null);
            }}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg"
          >
            {t("try_again")}
          </button>
        </div>
      </div>
    );
  }

  if (paymentResult === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="w-full max-w-sm bg-white rounded-[2rem] shadow-xl px-6 py-10 text-center animate-fadeIn">
          
          {/* Заголовок */}
          <p className="text-slate-900 text-lg font-semibold mb-2">
            {t("payment_processing_title")}
          </p>

          {/* Подтекст */}
          <p className="text-slate-600 text-sm mb-6 leading-relaxed">
            {t("payment_processing_message")}
          </p>

          {/* Прогресс */}
          <div className="mb-6">
            <PaymentProgressBar />
          </div>

          {/* Успокаивающая подсказка */}
          <p className="text-slate-500 text-xs leading-relaxed">
            {t("payment_processing_hint")}
          </p>
        </div>
      </div>
    );
  }

  // ===========================
  //  CREATE INTENT
  // ===========================
  async function createIntent(amountCents: number, selectedCurrency: string) {
    try {
      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountCents,
          currency: selectedCurrency.toLowerCase(),
          earnerId,
          rating,
          schemeId,
          employerId,
        }),
      });

      const data = await res.json();
      if (data.clientSecret) setClientSecret(data.clientSecret);
      else alert("Error creating payment intent.");
    } catch {
      alert("Network error.");
    }
  }

  // ===========================
  // CARD FORM
  // ===========================
  function CardForm() {
    const stripe = useStripe();
    const elements = useElements();

    async function confirmPay() {
      if (!stripe || !elements) return;

      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: schemeId
            ? `${window.location.origin}/c/${schemeId}?status=success`
            : `${window.location.origin}/t/${slug}?status=success`,
          payment_method_data: {
            billing_details: {
              name: "Anonymous Tipper",
              email: "anonymous@example.com",
              phone: "+11111111111",
              address: {
                country: "CH",
                line1: "Unknown Street 1",
                city: "Unknown City",
                postal_code: "0000",
                state: "Unknown State",
              },
            },
          },
        },
      });

      if (result.error) alert(result.error.message);
    }

    return (
      <div className="space-y-4 mt-6">
        <div className="border rounded-xl p-4 bg-slate-50">
          <PaymentElement options={{ fields: { billingDetails: "never" } }} />
        </div>

        <button
          onClick={confirmPay}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg"
        >
          Confirm Pay
        </button>
      </div>
    );
  }

  // ===========================
  // MAIN UI
  // ===========================
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-sm bg-white rounded-[2rem] shadow-xl px-6 py-8">
        
        {/* LOGO */}
        <div className="flex justify-center mb-4">
          <Image src="/images/logo.png" width={160} height={40} alt="click4tip" />
        </div>

        {/* LANGUAGE SWITCHER */}
        <div className="flex justify-center gap-2 mb-4">
          {languages.map((l) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={
                lang === l.code
                  ? "px-3 py-1 rounded-full bg-green-600 text-white text-xs font-medium shadow"
                  : "px-3 py-1 rounded-full border border-slate-300 text-slate-600 text-xs hover:bg-slate-100"
              }
            >
              {l.label}
            </button>
          ))}
        </div>

        <p className="text-center text-sm text-slate-700 mb-2">
          {t("tip_welcome_message")}
        </p>

        {/* AVATAR */}
        <div className="flex justify-center mb-2">
          {avatar ? (
            <Image
              src={avatar}
              alt={name}
              width={80}
              height={80}
              className="rounded-full object-cover border"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-slate-300" />
          )}
        </div>

        {/* NAME */}
        <h2 className="text-center text-lg font-semibold">
          {t("tip_im")} {name}
        </h2>

        {/* GOAL TEXT + SUM + PROGRESS LOGIC (schemes only) */}
        {goalTitle && goalTitle.trim() !== "" && (
        <>
            {/* 1) Показать только цель */}
            {showGoal && !showGoalAmount && (
            <p className="text-center text-sm text-slate-600 mt-1">
                {t("tip_goal_phrase")} {goalTitle}
            </p>
            )}

            {/* 2) Показать цель + сумму (если сумма включена и прогресс выключен) */}
            {showGoal &&
            showGoalAmount &&
            !showProgress &&
            goalAmountCents &&
            goalAmountCents > 0 && (
                <p className="text-center text-sm text-slate-600 mt-1">
                {t("tip_goal_phrase")} {goalTitle} ({(goalAmountCents / 100).toFixed(2)} {currency})
                </p>
            )}

            {/* 3) Показать только цель, если прогресс включен */}
            {showGoal && showProgress && (
            <p className="text-center text-sm text-slate-600 mt-1">
                {t("tip_goal_phrase")} {goalTitle}
            </p>
            )}
        </>
        )}

        {/* PROGRESS BAR */}
        {goalTitle &&
        goalTitle.trim() !== "" &&
        showProgress &&
        goalAmountCents !== null &&
        goalAmountCents > 0 && (
            <ProgressBarSmart
            goalAmountCents={goalAmountCents}
            goalStartAmount={goalStartAmount}
            goalEarnedSinceStart={goalEarnedSinceStart}
            currentTipCents={currentTipAmount}
            currency={currency}
            />
        )}

        {/* RATING */}
        <p className="text-center text-sm text-slate-700 mb-2 mt-2">
          {t("rating_title")}
        </p>
        <StarRating value={rating} onChange={setRating} />

        {/* TIP PAYMENT UI */}
        <TipPayment
          earnerId={earnerId}
          currency={currency}
          rating={rating}
          onAmountChange={setCurrentTipAmount}
          onCreateIntent={createIntent}
          disabled={!!clientSecret}
        />

        {/* STRIPE ELEMENTS */}
        {clientSecret && (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              locale: lang as any,
            }}
          >
            <CardForm />
          </Elements>
        )}
      </div>
    </div>
  );
}
