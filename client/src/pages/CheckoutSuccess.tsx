import { useLocation } from "wouter";
import { useBooking } from "@/hooks/use-bookings";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import { format, parseISO } from "date-fns";
import {
  CheckCircle,
  Copy,
  Check,
  Plane,
  Clock,
  Users,
  CreditCard,
  Mail,
  Phone,
  Printer,
  Home,
  Briefcase,
  Info,
  MapPin,
  Building2,
  Luggage,
  ArrowRight,
  Calendar,
  User,
  Globe,
  Shield,
} from "lucide-react";
import { SEO } from "@/components/SEO";

const formatDuration = (duration: string) => {
  if (!duration) return "";
  const hoursMatch = duration.match(/(\d+)H/);
  const minutesMatch = duration.match(/(\d+)M/);
  const hours = hoursMatch ? hoursMatch[1] : "0";
  const minutes = minutesMatch ? minutesMatch[1] : "0";
  return `${hours}h ${minutes}m`;
};

const formatCurrency = (amount: string, currency: string) => {
  const num = parseFloat(amount);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format(num);
};

const formatDateTime = (iso: string) => {
  try {
    return format(parseISO(iso), "MMM dd, yyyy 'at' HH:mm");
  } catch {
    return iso;
  }
};

const formatTime = (iso: string) => {
  try {
    return format(parseISO(iso), "HH:mm");
  } catch {
    return iso;
  }
};

const formatDate = (iso: string) => {
  try {
    return format(parseISO(iso), "EEE, MMM dd, yyyy");
  } catch {
    return iso;
  }
};

function SegmentCard({ segment, t }: { segment: any; t: (k: string) => string }) {
  const dur = segment.duration?.startsWith("P") ? formatDuration(segment.duration) : segment.duration;
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="flex-1">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="text-center min-w-[70px]">
            <div className="text-lg font-bold text-gray-900">{formatTime(segment.departureTime)}</div>
            <div className="text-xs text-gray-500 font-semibold uppercase">{segment.originCode}</div>
            {segment.originTerminal && <div className="text-[10px] text-gray-400">Terminal {segment.originTerminal}</div>}
          </div>
          <div className="flex flex-col items-center px-2 flex-1 max-w-[140px]">
            <div className="text-[11px] text-gray-500 flex items-center gap-1">
              <Clock className="h-3 w-3" />{dur}
            </div>
            <div className="w-full h-[1px] bg-gray-200 my-1 relative">
              <Plane className="h-3 w-3 text-blue-500 rotate-90 absolute left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="text-[11px] text-gray-400">{segment.flightNumber}</div>
          </div>
          <div className="text-center min-w-[70px]">
            <div className="text-lg font-bold text-gray-900">{formatTime(segment.arrivalTime)}</div>
            <div className="text-xs text-gray-500 font-semibold uppercase">{segment.destinationCode}</div>
            {segment.destinationTerminal && <div className="text-[10px] text-gray-400">Terminal {segment.destinationTerminal}</div>}
          </div>
        </div>
        <div className="text-[11px] text-gray-400 mt-1 text-center flex items-center justify-center gap-1 flex-wrap">
          <span>{segment.carrierName}</span>
          {segment.aircraftType && <span>· {segment.aircraftType}</span>}
        </div>
      </div>
    </div>
  );
}

function ProcessingScreen({ t }: { t: (k: string) => string }) {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = [
    { icon: CreditCard, label: t("confirm.processing_step1") || "Verifying payment..." },
    { icon: Shield, label: t("confirm.processing_step2") || "Confirming with the airline..." },
    { icon: Plane, label: t("confirm.processing_step3") || "Issuing your ticket..." },
    { icon: Mail, label: t("confirm.processing_step4") || "Preparing confirmation..." },
  ];

  useEffect(() => {
    const timers = steps.map((_, idx) =>
      setTimeout(() => setCurrentStep(idx), idx * 1200)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-blue-50 to-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <Card className="bg-white border-gray-200 shadow-2xl rounded-2xl overflow-visible">
          <CardContent className="pt-10 pb-10 px-8 flex flex-col items-center text-center space-y-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="h-16 w-16 rounded-full bg-blue-50 flex items-center justify-center border-2 border-blue-200"
            >
              <Plane className="h-8 w-8 text-blue-600" />
            </motion.div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold text-gray-900">
                {t("confirm.processing_title") || "Processing Your Booking"}
              </h1>
              <p className="text-gray-500 text-sm">
                {t("confirm.processing_subtitle") || "Please wait while we finalize everything..."}
              </p>
            </div>

            <div className="w-full space-y-3">
              {steps.map((step, idx) => {
                const StepIcon = step.icon;
                const isActive = idx === currentStep;
                const isDone = idx < currentStep;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: idx <= currentStep ? 1 : 0.3, x: 0 }}
                    transition={{ delay: idx * 0.15, duration: 0.3 }}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      isActive ? "bg-blue-50 border border-blue-200" :
                      isDone ? "bg-emerald-50 border border-emerald-200" :
                      "bg-gray-50 border border-gray-100"
                    }`}
                  >
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                      isDone ? "bg-emerald-100" :
                      isActive ? "bg-blue-100" :
                      "bg-gray-100"
                    }`}>
                      {isDone ? (
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                      ) : isActive ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        >
                          <StepIcon className="h-4 w-4 text-blue-600" />
                        </motion.div>
                      ) : (
                        <StepIcon className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    <span className={`text-sm font-medium ${
                      isDone ? "text-emerald-700" :
                      isActive ? "text-blue-700" :
                      "text-gray-400"
                    }`}>
                      {step.label}
                    </span>
                  </motion.div>
                );
              })}
            </div>

            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <motion.div
                className="h-full bg-blue-600 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default function CheckoutSuccess() {
  const [_, setLocation] = useLocation();
  const { t } = useI18n();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [showProcessing, setShowProcessing] = useState(true);

  const searchParams = new URLSearchParams(window.location.search);
  const bookingId = parseInt(searchParams.get("bookingId") || "0", 10);
  const isTestMode = searchParams.get("test") === "true";

  const { data: booking, isLoading, error, refetch } = useBooking(bookingId);
  const emailSentRef = useRef(false);
  const verifiedRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowProcessing(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (booking && bookingId && !verifiedRef.current) {
      verifiedRef.current = true;

      if (isTestMode || booking.status === 'confirmed') {
        if (!emailSentRef.current) {
          emailSentRef.current = true;
          fetch(`/api/bookings/${bookingId}/send-confirmation`, { method: "POST" })
            .catch(() => {});
        }
      } else {
        fetch(`/api/bookings/${bookingId}/verify-payment`, { method: "POST" })
          .then(res => res.json())
          .then(data => {
            if (data.verified) {
              refetch();
            }
          })
          .catch(() => {});
      }
    }
  }, [booking, bookingId, isTestMode, refetch]);

  const handleCopyRef = () => {
    if (booking?.referenceCode) {
      navigator.clipboard.writeText(booking.referenceCode);
      setCopied(true);
      toast({
        title: t("confirm.copied") || "Copied!",
        description: t("confirm.copied_desc") || "Reference code copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!bookingId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <Card className="w-full max-w-md bg-white border-gray-200 shadow-xl rounded-2xl">
          <CardContent className="pt-10 pb-10 px-6 flex flex-col items-center text-center space-y-4">
            <Info className="h-12 w-12 text-gray-400" />
            <h1 className="text-xl font-bold text-gray-900" data-testid="text-no-booking">
              {t("confirm.no_booking") || "No booking found"}
            </h1>
            <p className="text-gray-500 text-sm">
              {t("confirm.no_booking_desc") || "We couldn't find a booking ID in the URL."}
            </p>
            <Button onClick={() => setLocation("/")} data-testid="button-home-fallback">
              {t("confirm.back_home") || "Back to Home"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showProcessing || isLoading) {
    return <ProcessingScreen t={t} />;
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <Card className="w-full max-w-md bg-white border-gray-200 shadow-xl rounded-2xl">
          <CardContent className="pt-10 pb-10 px-6 flex flex-col items-center text-center space-y-4">
            <Info className="h-12 w-12 text-red-400" />
            <h1 className="text-xl font-bold text-gray-900" data-testid="text-booking-error">
              {t("confirm.error") || "Unable to load booking"}
            </h1>
            <p className="text-gray-500 text-sm">
              {t("confirm.error_desc") || "There was a problem fetching your booking details. Please try again."}
            </p>
            <Button onClick={() => setLocation("/")} data-testid="button-home-error">
              {t("confirm.back_home") || "Back to Home"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const flight = booking.flightData as any;
  const passengers = (booking.passengerDetails as any[]) || [];
  const slices = flight?.slices || [];
  const hasSlices = slices.length > 0;

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .print-container { box-shadow: none !important; border: none !important; max-width: 100% !important; }
        }
      `}</style>

      <SEO title="Reserva Confirmada" description="Sua reserva foi confirmada com sucesso." path="/checkout/success" noindex={true} />
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto space-y-6 print-container"
        >
          <Card className="bg-white border-gray-200 shadow-lg rounded-2xl overflow-visible" data-testid="card-success-header">
            <CardContent className="pt-8 pb-8 px-6 flex flex-col items-center text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <div className="h-20 w-20 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-200">
                  <CheckCircle className="h-10 w-10 text-emerald-500" />
                </div>
              </motion.div>

              <div className="space-y-1">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900" data-testid="text-checkout-success">
                  {t("confirm.title") || "Payment Confirmed!"}
                </h1>
                <p className="text-gray-500 text-sm">
                  {t("confirm.subtitle") || "Your flight has been booked successfully."}
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md px-6 py-4 w-full max-w-sm" data-testid="card-reference-code">
                <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-1">
                  {t("confirm.ref_code") || "Booking Reference"}
                </p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl md:text-3xl font-bold text-blue-700 tracking-widest font-mono" data-testid="text-reference-code">
                    {booking.referenceCode || "N/A"}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleCopyRef}
                    className="no-print text-blue-500"
                    data-testid="button-copy-reference"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <p className="text-xs text-gray-400 max-w-sm">
                {t("confirm.save_ref") || `Your booking confirmation has been sent to your email. Save your reference code ${booking.referenceCode || ""} for future lookups.`}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-lg rounded-2xl overflow-visible" data-testid="card-flight-details">
            <CardContent className="pt-6 pb-6 px-6 space-y-5">
              <div className="flex items-center gap-2">
                <Plane className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-bold text-gray-900">
                  {t("confirm.flight_details") || "Flight Details"}
                </h2>
              </div>

              {!hasSlices ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900" data-testid="text-departure-time">{formatTime(flight.departureTime)}</div>
                      <div className="text-sm font-semibold text-gray-600 uppercase" data-testid="text-origin">{flight.origin}</div>
                      <div className="text-xs text-gray-400">{formatDate(flight.departureTime)}</div>
                    </div>
                    <div className="flex flex-col items-center flex-1 max-w-[200px]">
                      <div className="w-full h-[1px] bg-gray-200 relative my-2">
                        <Plane className="h-4 w-4 text-blue-500 rotate-90 absolute left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <span>{flight.airline}</span> · <span>{flight.flightNumber}</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900" data-testid="text-arrival-time">{formatTime(flight.arrivalTime)}</div>
                      <div className="text-sm font-semibold text-gray-600 uppercase" data-testid="text-destination">{flight.destination}</div>
                      <div className="text-xs text-gray-400">{formatDate(flight.arrivalTime)}</div>
                    </div>
                  </div>
                  {flight.cabinClass && (
                    <div className="flex items-center gap-2">
                      <Badge className="text-xs bg-blue-50 text-blue-600 border-blue-200" data-testid="badge-cabin-class">
                        {flight.cabinClass}
                      </Badge>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-5">
                  {slices.map((slice: any, sliceIdx: number) => {
                    const sliceLabel = sliceIdx === 0
                      ? (t("confirm.outbound") || "Outbound")
                      : (t("confirm.return") || "Return");
                    const dur = slice.duration?.startsWith("P") ? formatDuration(slice.duration) : slice.duration;

                    return (
                      <div key={sliceIdx} data-testid={`card-slice-${sliceIdx}`}>
                        <div className="flex items-center gap-2 mb-3">
                          <Badge className="text-xs bg-blue-50 text-blue-600 border-blue-200">
                            {sliceLabel}
                          </Badge>
                          <span className="text-sm text-gray-600 font-semibold">
                            {slice.originCity || slice.originCode} <ArrowRight className="inline h-3 w-3" /> {slice.destinationCity || slice.destinationCode}
                          </span>
                          {dur && (
                            <span className="text-xs text-gray-400 flex items-center gap-1 ml-auto">
                              <Clock className="h-3 w-3" /> {dur}
                            </span>
                          )}
                        </div>

                        <div className="bg-gray-50 rounded-md p-3">
                          {slice.segments?.map((seg: any, segIdx: number) => (
                            <SegmentCard key={segIdx} segment={seg} t={t} />
                          ))}
                        </div>

                        {sliceIdx < slices.length - 1 && <Separator className="mt-4 bg-gray-200" />}
                      </div>
                    );
                  })}
                </div>
              )}

              {flight.cabinClass && hasSlices && (
                <div className="flex items-center gap-2 pt-1">
                  <Briefcase className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {t("confirm.cabin") || "Cabin Class"}:
                  </span>
                  <Badge className="text-xs bg-gray-100 text-gray-600 border-gray-200" data-testid="badge-cabin-class">
                    {flight.cabinClass}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-lg rounded-2xl overflow-visible" data-testid="card-passengers">
            <CardContent className="pt-6 pb-6 px-6 space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-bold text-gray-900">
                  {t("confirm.passengers") || "Passengers"} ({passengers.length})
                </h2>
              </div>

              <div className="space-y-3">
                {passengers.map((pax: any, idx: number) => {
                  const typeLabel = pax.type === "child"
                    ? (t("confirm.child") || "Child")
                    : pax.type === "infant_without_seat"
                      ? (t("confirm.infant") || "Infant")
                      : (t("confirm.adult") || "Adult");

                  return (
                    <div
                      key={idx}
                      className="bg-gray-50 rounded-md p-4 space-y-2"
                      data-testid={`card-passenger-${idx}`}
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-blue-500" />
                          <span className="font-bold text-gray-900" data-testid={`text-passenger-name-${idx}`}>
                            {pax.givenName} {pax.familyName}
                          </span>
                        </div>
                        <Badge className="text-[10px] bg-gray-100 text-gray-500 border-gray-200">
                          {typeLabel}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        {pax.email && (
                          <div className="flex items-center gap-1.5 text-gray-500">
                            <Mail className="h-3 w-3" />
                            <span data-testid={`text-passenger-email-${idx}`}>{pax.email}</span>
                          </div>
                        )}
                        {pax.phoneNumber && (
                          <div className="flex items-center gap-1.5 text-gray-500">
                            <Phone className="h-3 w-3" />
                            <span>{pax.phoneNumber}</span>
                          </div>
                        )}
                        {pax.bornOn && (
                          <div className="flex items-center gap-1.5 text-gray-500">
                            <Calendar className="h-3 w-3" />
                            <span>{pax.bornOn}</span>
                          </div>
                        )}
                        {pax.gender && (
                          <div className="flex items-center gap-1.5 text-gray-500">
                            <User className="h-3 w-3" />
                            <span>{pax.gender === "m" ? (t("confirm.male") || "Male") : (t("confirm.female") || "Female")}</span>
                          </div>
                        )}
                        {pax.documentType && pax.documentNumber && (
                          <div className="flex items-center gap-1.5 text-gray-500">
                            <Briefcase className="h-3 w-3" />
                            <span>{pax.documentType}: {pax.documentNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-lg rounded-2xl overflow-visible" data-testid="card-price-summary">
            <CardContent className="pt-6 pb-6 px-6 space-y-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-bold text-gray-900">
                  {t("confirm.price_summary") || "Price Summary"}
                </h2>
              </div>

              <div className="bg-gray-50 rounded-md p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{t("confirm.total_paid") || "Total Paid"}</span>
                  <span className="text-2xl font-bold text-gray-900" data-testid="text-total-price">
                    {formatCurrency(booking.totalPrice, booking.currency || "USD")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{t("confirm.currency_label") || "Currency"}</span>
                  <span data-testid="text-currency">{booking.currency || "USD"}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{t("confirm.status_label") || "Status"}</span>
                  <Badge className="text-[10px] bg-emerald-50 text-emerald-600 border-emerald-200" data-testid="badge-status">
                    {booking.status === "confirmed" ? (t("confirm.confirmed") || "Confirmed") : (booking.status || "Pending")}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-lg rounded-2xl overflow-visible" data-testid="card-important-info">
            <CardContent className="pt-6 pb-6 px-6 space-y-4">
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-amber-500" />
                <h2 className="text-lg font-bold text-gray-900">
                  {t("confirm.important_info") || "Important Information"}
                </h2>
              </div>

              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <Globe className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <p>{t("confirm.checkin_notice") || "Online check-in is usually available 24-48 hours before departure. Please check your airline's website for specific check-in times."}</p>
                </div>
                <div className="flex items-start gap-2">
                  <Luggage className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <p>{t("confirm.baggage_notice") || "Baggage allowance varies by airline and fare class. Please review your airline's baggage policy before traveling. Additional fees may apply for checked luggage."}</p>
                </div>
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <p>{t("confirm.id_notice") || "Ensure you carry a valid government-issued photo ID or passport for all flights. International travel requires a passport valid for at least 6 months beyond your travel date."}</p>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <p>{t("confirm.arrival_notice") || "We recommend arriving at the airport at least 2 hours before domestic flights and 3 hours before international flights."}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-lg rounded-2xl overflow-visible" data-testid="card-agency-contact">
            <CardContent className="pt-6 pb-6 px-6 space-y-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-bold text-gray-900">
                  {t("confirm.agency_title") || "Need Help?"}
                </h2>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-md p-4 space-y-2">
                <p className="font-bold text-blue-900 text-base">Michels Travel</p>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Mail className="h-3.5 w-3.5" />
                    <a href="mailto:reservastrens@gmail.com" className="underline" data-testid="link-agency-email">
                      reservastrens@gmail.com
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-blue-700">
                    <Phone className="h-3.5 w-3.5" />
                    <a href="tel:+18623501161" className="underline" data-testid="link-agency-phone">
                      +1 (862) 350-1161
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-blue-600 text-xs">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{t("confirm.registered") || "New Jersey, USA"}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row items-center gap-3 no-print" data-testid="card-actions">
            <Button
              onClick={handlePrint}
              variant="outline"
              className="w-full sm:w-auto gap-2"
              data-testid="button-print"
            >
              <Printer className="h-4 w-4" />
              {t("confirm.print") || "Print Confirmation"}
            </Button>
            <Button
              onClick={() => setLocation("/my-trips")}
              variant="outline"
              className="w-full sm:w-auto gap-2"
              data-testid="button-my-trips"
            >
              <Briefcase className="h-4 w-4" />
              {t("confirm.my_trips") || "My Trips"}
            </Button>
            <Button
              onClick={() => setLocation("/")}
              className="w-full sm:w-auto gap-2 bg-blue-600 text-white"
              data-testid="button-back-home"
            >
              <Home className="h-4 w-4" />
              {t("confirm.back_home") || "Back to Home"}
            </Button>
          </div>

          <div className="text-center text-xs text-gray-400 pb-4">
            <p>{t("confirm.booking_date") || "Booking made on"}: {booking.createdAt ? formatDateTime(booking.createdAt as unknown as string) : "N/A"}</p>
          </div>
        </motion.div>
      </div>
    </>
  );
}
