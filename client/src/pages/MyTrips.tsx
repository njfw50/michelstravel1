import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import {
  Plane,
  Clock,
  MapPin,
  Calendar,
  Search,
  Luggage,
  ArrowRight,
  FileText,
  User,
  Mail,
  Phone,
  Building2,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Printer,
  AlertCircle,
  CheckCircle,
  XCircle,
  HelpCircle,
  Receipt,
  Ticket,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Booking } from "@shared/schema";
import { SEO } from "@/components/SEO";
import { openLoginDialog } from "@/lib/auth-utils";
import {
  AGENCY_EMAIL,
  AGENCY_WHATSAPP_DISPLAY,
  buildWhatsAppHref,
  buildWhatsAppMessage,
} from "@/lib/contact";

function formatDuration(duration: string) {
  if (!duration) return "";
  const h = duration.match(/(\d+)H/);
  const m = duration.match(/(\d+)M/);
  return `${h ? h[1] : "0"}h ${m ? m[1] : "0"}m`;
}

function safeDateFormat(dateStr: string, fmt: string) {
  try {
    return format(parseISO(dateStr), fmt);
  } catch {
    return dateStr;
  }
}

function StatusBadge({ status }: { status: string }) {
  const { t } = useI18n();
  const config: Record<string, { label: string; className: string }> = {
    confirmed: { label: t("trips.status.confirmed") || "Confirmed", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    pending: { label: t("trips.status.pending") || "Pending", className: "bg-amber-50 text-amber-700 border-amber-200" },
    test: { label: t("trips.status.test") || "Test", className: "bg-blue-50 text-blue-700 border-blue-200" },
    cancelled: { label: t("trips.status.cancelled") || "Cancelled", className: "bg-red-50 text-red-700 border-red-200" },
  };
  const c = config[status] || { label: status, className: "bg-gray-50 text-gray-700 border-gray-200" };
  return <Badge className={c.className}>{c.label}</Badge>;
}

function BookingCard({ booking, defaultExpanded = false }: { booking: Booking; defaultExpanded?: boolean }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [copied, setCopied] = useState(false);
  const [, setLocation] = useLocation();
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [cancelResult, setCancelResult] = useState<{ success: boolean; message?: string; refundAmount?: string } | null>(null);

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/bookings/${booking.id}/cancel`);
      return await res.json();
    },
    onSuccess: (data: { success: boolean; message?: string; refundAmount?: string }) => {
      setCancelResult(data);
      setCancelConfirm(false);
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
        queryClient.invalidateQueries({ queryKey: ["/api/bookings/lookup"] });
      }
    },
    onError: () => {
      setCancelResult({ success: false, message: "Failed to cancel" });
      setCancelConfirm(false);
    },
  });

  const fd = booking.flightData as any;
  const passengers = booking.passengerDetails as any[];
  const slices = fd?.slices || [];

  const copyRef = () => {
    navigator.clipboard.writeText(booking.referenceCode || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const canCancel = booking.status !== "cancelled" && booking.status !== "refunded";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-white border-gray-200 shadow-sm rounded-2xl overflow-hidden" data-testid={`card-booking-${booking.id}`}>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="w-full text-left p-5 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
          data-testid={`button-expand-booking-${booking.id}`}
        >
          <div className="flex items-center gap-4 flex-1 min-w-0 flex-wrap">
            <div className="h-11 w-11 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100 shrink-0">
              <Plane className="h-5 w-5 text-blue-500" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-gray-900 text-sm">
                  {fd?.origin || "---"} <ArrowRight className="inline h-3 w-3 text-gray-400" /> {fd?.destination || "---"}
                </span>
                <StatusBadge status={booking.status || "pending"} />
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {fd?.departureTime ? safeDateFormat(fd.departureTime, "dd MMM yyyy") : "---"}
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {booking.referenceCode || "---"}
                </span>
                <span className="font-semibold text-gray-900">
                  {booking.currency} {Number(booking.totalPrice).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
          {expanded ? <ChevronUp className="h-5 w-5 text-gray-400 shrink-0" /> : <ChevronDown className="h-5 w-5 text-gray-400 shrink-0" />}
        </button>

        {expanded && (
          <div className="border-t border-gray-200">
            <div className="p-5 space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">{t("confirm.ref_code") || "Reference Code"}</span>
                  <span className="font-mono font-bold text-blue-600 text-lg" data-testid={`text-ref-code-${booking.id}`}>{booking.referenceCode}</span>
                  <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); copyRef(); }} data-testid={`button-copy-ref-${booking.id}`}>
                    {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-gray-400" />}
                  </Button>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {booking.status === "confirmed" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 border-gray-200 text-gray-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        fetch(`/api/bookings/${booking.id}/receipt`)
                          .then(r => r.json())
                          .then(data => {
                            if (data.receiptUrl) {
                              window.open(data.receiptUrl, '_blank');
                            } else {
                              toast({
                                title: t("confirm.receipt_unavailable") || "Receipt not available yet",
                                description: t("confirm.receipt_unavailable_desc") || "The payment receipt will be available shortly. Please try again in a few minutes.",
                              });
                            }
                          })
                          .catch(() => {
                            toast({
                              title: t("confirm.receipt_error") || "Error",
                              description: t("confirm.receipt_error_desc") || "Could not load receipt. Please try again.",
                              variant: "destructive",
                            });
                          });
                      }}
                      data-testid={`button-view-receipt-${booking.id}`}
                    >
                      <Receipt className="h-3.5 w-3.5" />
                      {t("confirm.view_receipt") || "View Receipt"}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 border-gray-200 text-gray-600"
                    onClick={(e) => { e.stopPropagation(); setLocation(`/checkout/success?bookingId=${booking.id}`); }}
                    data-testid={`button-view-confirmation-${booking.id}`}
                  >
                    <Printer className="h-3.5 w-3.5" />
                    {t("confirm.print") || "View / Print"}
                  </Button>
                </div>
              </div>

              <Separator className="bg-gray-100" />

              {slices.length > 0 ? (
                <div className="space-y-4">
                  {slices.map((slice: any, si: number) => (
                    <div key={si}>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-blue-50 text-blue-600 border-blue-200 text-[10px]">
                          {si === 0 ? (t("booking.outbound") || "Outbound") : (t("booking.return_flight") || "Return")}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {slice.originCode} <ArrowRight className="inline h-3 w-3" /> {slice.destinationCode}
                        </span>
                        {slice.duration && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" />{slice.duration?.startsWith("P") ? formatDuration(slice.duration) : slice.duration}
                          </span>
                        )}
                      </div>
                      {slice.segments?.map((seg: any, sgi: number) => (
                        <div key={sgi} className="ml-4 pl-4 border-l-2 border-blue-100 py-2">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="text-sm">
                              <span className="font-bold text-gray-900">{safeDateFormat(seg.departureTime, "HH:mm")}</span>
                              <span className="text-gray-400 mx-1">{seg.originCode}</span>
                              <ArrowRight className="inline h-3 w-3 text-gray-300 mx-1" />
                              <span className="font-bold text-gray-900">{safeDateFormat(seg.arrivalTime, "HH:mm")}</span>
                              <span className="text-gray-400 mx-1">{seg.destinationCode}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {seg.carrierName || fd?.airline} {seg.flightNumber}
                              {seg.aircraftType && <span className="ml-1 text-gray-400">({seg.aircraftType})</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-3 py-2">
                  <div className="text-sm">
                    <span className="font-bold text-gray-900">{fd?.airline}</span>
                    <span className="text-gray-400 mx-2">{fd?.flightNumber}</span>
                    <span className="text-gray-600">{fd?.origin} <ArrowRight className="inline h-3 w-3" /> {fd?.destination}</span>
                  </div>
                </div>
              )}

              <Separator className="bg-gray-100" />

              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <User className="h-3.5 w-3.5" />
                  {t("booking.passenger_details") || "Passengers"} ({passengers?.length || 0})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {passengers?.map((pax: any, pi: number) => (
                    <div key={pi} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 border border-blue-100 shrink-0">
                        <User className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-gray-900">{pax.givenName} {pax.familyName}</div>
                        <div className="text-xs text-gray-500">{pax.email}</div>
                      </div>
                      <Badge className="bg-gray-100 text-gray-500 border-gray-200 text-[10px] ml-auto shrink-0">
                        {pax.type === "child" ? (t("booking.child") || "Child") : pax.type === "infant_without_seat" ? (t("booking.infant") || "Infant") : (t("booking.adult") || "Adult")}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="bg-gray-100" />

              <div className="flex items-center justify-between flex-wrap gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100">
                <div>
                  <span className="text-xs text-blue-600 font-bold uppercase tracking-wider">{t("booking.total") || "Total"}</span>
                  <div className="text-xl font-bold text-blue-700">
                    {booking.currency} {Number(booking.totalPrice).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500">{t("trips.booked_on") || "Booked on"}</span>
                  <div className="text-sm text-gray-700 font-medium">
                    {booking.createdAt ? safeDateFormat(booking.createdAt.toString(), "dd MMM yyyy, HH:mm") : "---"}
                  </div>
                </div>
              </div>

              {(booking as any).ticketStatus && (booking as any).ticketStatus !== 'pending' && (
                <div className={`p-3 rounded-xl border text-sm ${
                  (booking as any).ticketStatus === 'issued' ? 'bg-emerald-50 border-emerald-200' :
                  (booking as any).ticketStatus === 'schedule_changed' ? 'bg-amber-50 border-amber-200' :
                  (booking as any).ticketStatus === 'cancelled' ? 'bg-red-50 border-red-200' :
                  (booking as any).ticketStatus === 'failed' ? 'bg-red-50 border-red-200' :
                  'bg-gray-50 border-gray-200'
                }`} data-testid={`section-ticket-info-${booking.id}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Ticket className={`h-4 w-4 ${
                      (booking as any).ticketStatus === 'issued' ? 'text-emerald-600' :
                      (booking as any).ticketStatus === 'schedule_changed' ? 'text-amber-600' :
                      'text-red-600'
                    }`} />
                    <span className="font-bold text-xs uppercase tracking-wider">
                      {(booking as any).ticketStatus === 'issued' ? (t("trips.ticket_issued") || "Ticket Issued") :
                       (booking as any).ticketStatus === 'schedule_changed' ? (t("trips.schedule_changed") || "Schedule Changed by Airline") :
                       (booking as any).ticketStatus === 'cancelled' ? (t("trips.ticket_cancelled") || "Ticket Cancelled") :
                       (booking as any).ticketStatus === 'failed' ? (t("trips.ticket_failed") || "Ticket Issue Failed") :
                       (booking as any).ticketStatus}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {(booking as any).duffelBookingReference && (
                      <div>
                        <span className="text-gray-500">{t("trips.airline_ref") || "Airline Reference"}:</span>
                        <span className="font-mono font-bold ml-1" data-testid={`text-airline-ref-${booking.id}`}>{(booking as any).duffelBookingReference}</span>
                      </div>
                    )}
                    {(booking as any).ticketNumber && (
                      <div>
                        <span className="text-gray-500">{t("trips.ticket_number") || "Ticket Number"}:</span>
                        <span className="font-mono font-bold ml-1" data-testid={`text-ticket-number-${booking.id}`}>{(booking as any).ticketNumber}</span>
                      </div>
                    )}
                  </div>
                  {(booking as any).ticketStatus === 'schedule_changed' && (
                    <div className="mt-2 flex items-center gap-2 text-amber-700">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      <span className="text-xs">{t("trips.schedule_changed_desc") || "The airline has made changes to your flight schedule. Please review the updated details above."}</span>
                    </div>
                  )}
                  {(booking as any).ticketStatus === 'failed' && (
                    <div className="mt-2 flex items-center gap-2 text-red-700">
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span className="text-xs">{t("trips.ticket_failed_desc") || "There was an issue issuing your ticket. Our team has been notified and will contact you shortly."}</span>
                    </div>
                  )}
                </div>
              )}

              {cancelResult && (
                <div className={`p-3 rounded-xl border text-sm ${cancelResult.success ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"}`}>
                  <div className="flex items-center gap-2">
                    {cancelResult.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    <span className="font-medium">{cancelResult.success ? (t("trips.cancelled_success") || "Booking cancelled successfully") : (cancelResult.message || "Cancellation failed")}</span>
                  </div>
                  {cancelResult.refundAmount && (
                    <div className="mt-1 text-xs">{t("trips.refund_amount") || "Refund"}: {booking.currency} {cancelResult.refundAmount}</div>
                  )}
                </div>
              )}

              {canCancel && !cancelResult?.success && (
                <div className="flex items-center justify-end gap-3">
                  {cancelConfirm ? (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 w-full">
                      <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                      <span className="text-sm text-red-700 flex-1">{t("trips.cancel_confirm") || "Are you sure you want to cancel this booking?"}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCancelConfirm(false)}
                        className="border-gray-200"
                        data-testid={`button-cancel-no-${booking.id}`}
                      >
                        {t("booking.no") || "No"}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => cancelMutation.mutate()}
                        disabled={cancelMutation.isPending}
                        className="bg-red-600 hover:bg-red-700 text-white border-0"
                        data-testid={`button-cancel-yes-${booking.id}`}
                      >
                        {cancelMutation.isPending ? "..." : (t("trips.yes_cancel") || "Yes, Cancel")}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCancelConfirm(true)}
                      className="gap-2 border-red-200 text-red-600 hover:bg-red-50"
                      data-testid={`button-cancel-booking-${booking.id}`}
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      {t("trips.cancel_booking") || "Cancel Booking"}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}

function BookingLookupSection() {
  const { t } = useI18n();
  const [reference, setReference] = useState("");
  const [email, setEmail] = useState("");
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [, setLocation] = useLocation();

  const { data: foundBooking, isLoading, isError } = useQuery<Booking>({
    queryKey: ["/api/bookings/lookup", reference, email],
    queryFn: async () => {
      const res = await fetch(`/api/bookings/lookup?reference=${encodeURIComponent(reference)}&email=${encodeURIComponent(email)}`, {
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Not found");
      }
      return res.json();
    },
    enabled: searchTriggered && !!reference.trim() && !!email.trim(),
    retry: false,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (reference.trim() && email.trim()) {
      setSearchTriggered(true);
    }
  };

  return (
    <Card className="bg-white border-gray-200 shadow-sm rounded-2xl" data-testid="card-booking-lookup">
      <CardContent className="p-5">
        <h3 className="font-bold text-gray-900 text-sm mb-1 flex items-center gap-2">
          <Search className="h-4 w-4 text-blue-500" />
          {t("trips.lookup_title") || "Look Up a Booking"}
        </h3>
        <p className="text-xs text-gray-500 mb-4">{t("trips.lookup_desc") || "Enter your reference code and email to find your booking"}</p>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder={t("trips.lookup_ref_placeholder") || "Reference (e.g. MT-ABC123)"}
            value={reference}
            onChange={(e) => { setReference(e.target.value.toUpperCase()); setSearchTriggered(false); }}
            className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
            data-testid="input-lookup-reference"
          />
          <Input
            type="email"
            placeholder={t("trips.lookup_email_placeholder") || "Email used for booking"}
            value={email}
            onChange={(e) => { setEmail(e.target.value); setSearchTriggered(false); }}
            className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
            data-testid="input-lookup-email"
          />
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold shrink-0" data-testid="button-lookup-search">
            <Search className="h-4 w-4 mr-2" />
            {t("trips.lookup_button") || "Search"}
          </Button>
        </form>

        {searchTriggered && isLoading && (
          <div className="mt-4 text-center text-sm text-gray-500">{t("trips.lookup_searching") || "Searching..."}</div>
        )}

        {searchTriggered && isError && (
          <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3" data-testid="text-lookup-error">
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-700">{t("trips.lookup_not_found") || "Booking not found"}</p>
              <p className="text-xs text-red-500">{t("trips.lookup_not_found_desc") || "Please check your reference code and email address."}</p>
            </div>
          </div>
        )}

        {searchTriggered && foundBooking && (
          <div className="mt-4">
            <BookingCard booking={foundBooking} defaultExpanded />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function MyTrips() {
  const { user, isLoading: authLoading } = useAuth();
  const { t } = useI18n();
  const [, setLocation] = useLocation();
  const whatsAppHref = buildWhatsAppHref(
    buildWhatsAppMessage({
      topic: "Ajuda com minhas viagens",
      details: ["Pagina: My Trips"],
    }),
  );

  const { data: bookings, isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
    queryFn: async () => {
      const res = await fetch("/api/bookings", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!user,
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <SEO title="Minhas Viagens" description="Acompanhe suas reservas de voo e gerencie suas viagens." path="/my-trips" noindex={true} />
      <div className="bg-white border-b border-gray-200 shadow-sm pt-8 pb-6 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-bold font-display text-gray-900" data-testid="text-my-trips-title">
              {t("trips.title") || "My Trips"}
            </h1>
            <p className="text-gray-500 mt-1">
              {t("trips.subtitle") || "View your booking history, check flight details, and manage your trips"}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 mt-8 space-y-6">
        {!user && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <BookingLookupSection />

            <Card className="bg-white border-gray-200 shadow-sm rounded-2xl mt-6" data-testid="card-login-prompt">
              <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
                  <User className="h-7 w-7 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{t("trips.login_title") || "Sign in for full access"}</h3>
                  <p className="text-sm text-gray-500 mt-1">{t("trips.login_desc") || "Sign in to see all your bookings in one place, track flight status, and access your complete travel history."}</p>
                </div>
                <Button
                  onClick={() => openLoginDialog()}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                  data-testid="button-login-from-trips"
                >
                  {t("nav.signin") || "Sign In"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {user && (
          <>
            <BookingLookupSection />

            {bookingsLoading && (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="bg-white border-gray-200 rounded-2xl">
                    <CardContent className="p-5">
                      <div className="animate-pulse flex items-center gap-4">
                        <div className="h-11 w-11 rounded-xl bg-gray-200" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-48 bg-gray-200 rounded" />
                          <div className="h-3 w-32 bg-gray-100 rounded" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {!bookingsLoading && (!bookings || bookings.length === 0) && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card className="bg-white border-gray-200 shadow-sm rounded-2xl">
                  <CardContent className="p-10 flex flex-col items-center text-center space-y-4">
                    <div className="h-16 w-16 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
                      <Plane className="h-7 w-7 text-gray-300" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-700 text-lg">{t("trips.no_trips") || "No trips yet"}</h3>
                      <p className="text-sm text-gray-500 mt-1">{t("trips.no_trips_desc") || "When you book a flight, it will appear here with all the details."}</p>
                    </div>
                    <Button onClick={() => setLocation("/")} className="bg-blue-600 hover:bg-blue-700 text-white font-bold" data-testid="button-search-flights">
                      <Plane className="h-4 w-4 mr-2" />
                      {t("trips.search_flights") || "Search Flights"}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {!bookingsLoading && bookings && bookings.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                    {t("trips.your_bookings") || "Your Bookings"} ({bookings.length})
                  </h2>
                </div>
                {bookings.map((b) => (
                  <BookingCard key={b.id} booking={b} />
                ))}
              </div>
            )}
          </>
        )}

        <Separator className="bg-gray-200 my-8" />

        <Card className="bg-white border-gray-200 shadow-sm rounded-2xl" data-testid="card-agency-contact">
          <CardContent className="p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-500" />
              {t("confirm.agency_title") || "Need Help? Contact Us"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100">
                  <Mail className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">Email</div>
                  <a href={`mailto:${AGENCY_EMAIL}`} className="text-sm font-medium text-blue-600 hover:underline" data-testid="link-contact-email">{AGENCY_EMAIL}</a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100">
                  <Phone className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">WhatsApp</div>
                  <a href={whatsAppHref} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-600 hover:underline" data-testid="link-contact-phone">{AGENCY_WHATSAPP_DISPLAY}</a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100">
                  <MapPin className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">{t("confirm.agency_location") || "Localização"}</div>
                  <span className="text-sm font-medium text-gray-700">New Jersey, USA</span>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-100">
              <p className="text-xs text-amber-700 flex items-start gap-2">
                <HelpCircle className="h-4 w-4 shrink-0 mt-0.5" />
                {t("trips.contact_note") || "For changes, cancellations, or baggage questions, contact us at least 24 hours before your flight departure. We're here to help!"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
