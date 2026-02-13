import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Lock, Shield, CheckCircle2, AlertCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useQuery } from "@tanstack/react-query";

let stripePromise: ReturnType<typeof loadStripe> | null = null;

function getStripePromise() {
  if (!stripePromise) {
    stripePromise = fetch("/api/stripe-key")
      .then((r) => r.json())
      .then((data) => loadStripe(data.publishableKey));
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
        setErrorMessage(submitError.message || t("payment.generic_error") || "Please complete all payment fields.");
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
        setErrorMessage(error.message || t("payment.generic_error") || "Payment failed. Please try again.");
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
      setErrorMessage(err.message || "An unexpected error occurred.");
      setIsProcessing(false);
      onError(err.message || "Payment error");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" data-testid="form-payment">
      <div className="flex items-center gap-2 mb-1">
        <CreditCard className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-bold text-gray-900">
          {t("payment.title") || "Payment Details"}
        </h3>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-xs text-blue-600 font-medium">
            {t("payment.booking_ref") || "Booking Reference"}
          </p>
          <p className="text-sm font-bold text-blue-800 font-mono" data-testid="text-payment-reference">
            {referenceCode}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-blue-600 font-medium">
            {t("payment.total") || "Total"}
          </p>
          <p className="text-xl font-bold text-blue-800" data-testid="text-payment-amount">
            {formattedAmount}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4" data-testid="container-stripe-elements">
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
          className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-md px-4 py-3"
          data-testid="text-payment-error"
        >
          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={!stripe || !elements || isProcessing}
        className="w-full h-14 text-base font-bold bg-blue-600 shadow-lg shadow-blue-600/20 transition-all border-0 text-white rounded-xl gap-2"
        data-testid="button-confirm-payment"
      >
        {isProcessing ? (
          <>
            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            {t("payment.processing") || "Processing..."}
          </>
        ) : (
          <>
            <Lock className="h-5 w-5" />
            {t("payment.pay_now") || "Pay"} {formattedAmount}
          </>
        )}
      </Button>

      <div className="space-y-2">
        <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
          <Shield className="h-3 w-3" />
          <span>{t("payment.secure_ssl") || "Secured with 256-bit SSL encryption"}</span>
        </div>
        <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            {t("payment.pci_compliant") || "PCI Compliant"}
          </span>
          <span className="flex items-center gap-1">
            <Lock className="h-3 w-3 text-blue-500" />
            {t("payment.stripe_powered") || "Powered by Stripe"}
          </span>
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
  const [stripeReady, setStripeReady] = useState(false);

  useEffect(() => {
    getStripePromise().then(() => setStripeReady(true));
  }, []);

  if (!stripeReady || !clientSecret) {
    return (
      <div className="flex items-center justify-center p-8" data-testid="loading-payment">
        <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Elements
      stripe={getStripePromise()}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#0074DE",
            colorBackground: "#ffffff",
            colorText: "#1a1a1a",
            colorDanger: "#ef4444",
            fontFamily: "'DM Sans', system-ui, sans-serif",
            borderRadius: "8px",
            spacingUnit: "4px",
          },
          rules: {
            ".Input": {
              border: "1px solid #e5e7eb",
              boxShadow: "none",
              padding: "10px 12px",
            },
            ".Input:focus": {
              border: "1px solid #0074DE",
              boxShadow: "0 0 0 1px #0074DE",
            },
            ".Label": {
              fontSize: "13px",
              fontWeight: "500",
              color: "#6b7280",
            },
            ".Tab": {
              border: "1px solid #e5e7eb",
              boxShadow: "none",
            },
            ".Tab--selected": {
              border: "1px solid #0074DE",
              backgroundColor: "#eff6ff",
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
