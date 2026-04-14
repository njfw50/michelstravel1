import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { AlertCircle, CheckCircle2, CreditCard, Loader2, Lock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

let stripePromise: ReturnType<typeof loadStripe> | null = null;
let cachedPublishableKey: string | null = null;

function getStripePromise(publishableKey?: string) {
  if (publishableKey && publishableKey !== cachedPublishableKey) {
    stripePromise = loadStripe(publishableKey);
    cachedPublishableKey = publishableKey;
  }

  if (!stripePromise) {
    stripePromise = fetch("/api/stripe-key")
      .then((r) => r.json())
      .then((data) => {
        cachedPublishableKey = data.publishableKey;
        return loadStripe(data.publishableKey);
      });
  }

  return stripePromise;
}

interface PaymentFormProps {
  clientSecret: string;
  bookingId: number;
  referenceCode: string;
  amount: number;
  currency: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

function CheckoutForm({
  bookingId,
  referenceCode,
  amount,
  currency,
  onSuccess,
  onError,
}: Omit<PaymentFormProps, "clientSecret">) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { t } = useI18n();

  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format(amount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setErrorMessage(
          submitError.message ||
            t("payment.complete_fields")
        );
        setIsProcessing(false);
        return;
      }

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success?bookingId=${bookingId}`,
        },
        redirect: "if_required",
      });

      if (error) {
        setErrorMessage(error.message || t("payment.failed"));
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        onSuccess();
      } else if (paymentIntent && paymentIntent.status === "requires_action") {
        setErrorMessage(null);
        setIsProcessing(false);
      } else {
        setIsProcessing(false);
      }
    } catch (err: any) {
      const message = err.message || t("payment.unexpected_error");
      setErrorMessage(message);
      setIsProcessing(false);
      onError(message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" data-testid="form-payment">
      <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-slate-950/95 p-5 shadow-[0_30px_90px_rgba(2,6,23,0.45)] sm:p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,127,80,0.16),transparent_28%)]" />

        <div className="relative space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-[#ff7f50]/25 bg-[#ff7f50]/15 text-[#ff9f7d] shadow-[0_14px_34px_rgba(255,127,80,0.18)]">
                <CreditCard className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-400">
                  {t("payment.midnight_checkout")}
                </p>
                <h3 className="text-xl font-bold tracking-tight text-white">
                  {t("payment.title") || "Payment Details"}
                </h3>
                <p className="text-sm text-slate-300">
                  {t("payment.stripe_powered") || "Powered by Stripe"}
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-200">
              <Shield className="h-3.5 w-3.5" />
              <span>{t("payment.secure_ssl") || "Secured with 256-bit SSL encryption"}</span>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
            <div className="glass rounded-[24px] border-white/10 bg-white/5 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
                {t("payment.booking_ref") || "Booking Reference"}
              </p>
              <p
                className="mt-3 break-all font-mono text-sm font-bold tracking-[0.18em] text-slate-100 sm:text-base"
                data-testid="text-payment-reference"
              >
                {referenceCode}
              </p>
            </div>

            <div className="rounded-[24px] border border-[#ff7f50]/20 bg-gradient-to-br from-[#ff7f50]/18 via-[#ff7f50]/10 to-transparent px-5 py-4 shadow-[0_18px_40px_rgba(255,127,80,0.14)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#ffb293]">
                {t("payment.total") || "Total"}
              </p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-white" data-testid="text-payment-amount">
                {formattedAmount}
              </p>
            </div>
          </div>

          <div
            className="glass-dark rounded-[26px] border border-white/10 bg-slate-900/70 p-4 shadow-inner shadow-black/20 sm:p-5"
            data-testid="container-stripe-elements"
          >
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
                  {t("payment.card_wallets")}
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  {t("payment.pay_now") || "Pay"} {formattedAmount}
                </p>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
                <Lock className="h-3.5 w-3.5 text-[#ff9f7d]" />
                <span>{t("payment.pci_compliant") || "PCI Compliant"}</span>
              </div>
            </div>

            <PaymentElement
              options={{
                layout: "tabs",
                business: { name: "Michels Travel" },
              }}
              onChange={(event) => {
                if (event.complete) setErrorMessage(null);
              }}
            />
          </div>

          {errorMessage && (
            <div
              className="flex items-start gap-3 rounded-[22px] border border-red-400/20 bg-red-500/10 px-4 py-3 text-red-100"
              data-testid="text-payment-error"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
              <p className="text-sm leading-6">{errorMessage}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={!stripe || !elements || isProcessing}
            className="h-14 w-full rounded-2xl border-0 bg-gradient-to-r from-[#ff7f50] via-[#ff926f] to-[#ff684a] text-base font-bold text-slate-950 shadow-[0_22px_45px_rgba(255,127,80,0.28)] transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
            data-testid="button-confirm-payment"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {t("payment.processing") || "Processing..."}
              </>
            ) : (
              <>
                <Lock className="mr-2 h-5 w-5" />
                {t("payment.pay_now") || "Pay"} {formattedAmount}
              </>
            )}
          </Button>

          <div className="flex flex-col gap-3 rounded-[22px] border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-300 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-sky-300" />
              <span>{t("payment.secure_ssl") || "Secured with 256-bit SSL encryption"}</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                {t("payment.pci_compliant") || "PCI Compliant"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-[#ff9f7d]" />
                {t("payment.stripe_powered") || "Powered by Stripe"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

export default function PaymentForm({
  clientSecret,
  bookingId,
  referenceCode,
  amount,
  currency,
  onSuccess,
  onError,
}: PaymentFormProps) {
  const { t } = useI18n();
  const [stripeReady, setStripeReady] = useState(false);
  const [currentStripePromise, setCurrentStripePromise] = useState<ReturnType<typeof loadStripe> | null>(null);

  useEffect(() => {
    fetch("/api/stripe-key")
      .then((r) => r.json())
      .then((data) => {
        const promise = getStripePromise(data.publishableKey);
        setCurrentStripePromise(promise);
        return promise;
      })
      .then(() => setStripeReady(true))
      .catch((err) => {
        console.error("Failed to load Stripe:", err);
        onError("Failed to load payment system");
      });
  }, [onError]);

  if (!stripeReady || !clientSecret || !currentStripePromise) {
    return (
      <div
        className="flex min-h-[260px] items-center justify-center rounded-[30px] border border-white/10 bg-slate-950/95 p-8 shadow-[0_30px_90px_rgba(2,6,23,0.45)]"
        data-testid="loading-payment"
      >
        <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-200">
          <Loader2 className="h-5 w-5 animate-spin text-[#ff9f7d]" />
          <span>{t("payment.loading")}</span>
        </div>
      </div>
    );
  }

  return (
    <Elements
      stripe={currentStripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "night",
          variables: {
            colorPrimary: "#ff7f50",
            colorBackground: "#0f172a",
            colorText: "#f8fafc",
            colorTextSecondary: "#cbd5e1",
            colorDanger: "#f87171",
            colorSuccess: "#34d399",
            colorIcon: "#94a3b8",
            colorTextPlaceholder: "#64748b",
            accessibleColorOnColorPrimary: "#0f172a",
            fontFamily: "'DM Sans', system-ui, sans-serif",
            borderRadius: "18px",
            spacingUnit: "4px",
          },
          rules: {
            ".Block": {
              backgroundColor: "rgba(15, 23, 42, 0.82)",
              boxShadow: "none",
            },
            ".Input": {
              backgroundColor: "rgba(15, 23, 42, 0.82)",
              border: "1px solid rgba(148, 163, 184, 0.18)",
              boxShadow: "none",
              padding: "12px 14px",
            },
            ".Input:focus": {
              border: "1px solid rgba(255, 127, 80, 0.9)",
              boxShadow: "0 0 0 1px rgba(255, 127, 80, 0.65)",
            },
            ".Label": {
              fontSize: "12px",
              fontWeight: "600",
              color: "#cbd5e1",
            },
            ".Tab": {
              backgroundColor: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(148, 163, 184, 0.16)",
              boxShadow: "none",
            },
            ".Tab:hover": {
              color: "#ffffff",
            },
            ".Tab--selected": {
              border: "1px solid rgba(255, 127, 80, 0.9)",
              backgroundColor: "rgba(255, 127, 80, 0.14)",
              boxShadow: "0 10px 24px rgba(255, 127, 80, 0.12)",
            },
            ".PickerItem": {
              backgroundColor: "rgba(15, 23, 42, 0.82)",
              border: "1px solid rgba(148, 163, 184, 0.18)",
            },
            ".PickerItem--selected": {
              border: "1px solid rgba(255, 127, 80, 0.9)",
              color: "#ffffff",
            },
          },
        },
      }}
    >
      <CheckoutForm
        bookingId={bookingId}
        referenceCode={referenceCode}
        amount={amount}
        currency={currency}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  );
}
