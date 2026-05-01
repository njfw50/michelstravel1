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
import type { Booking, BookingLog } from "@shared/schema";
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

function StandardTripCard({ booking, defaultExpanded = false }: { booking: Booking; defaultExpanded?: boolean }) {
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
  const canCancel = booking.status !== "cancelled" && booking.status !== "refunded";

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card className="bg-white border-gray-200 shadow-sm rounded-2xl overflow-hidden">
        <button type="button" onClick={() => setExpanded(!expanded)} className="w-full text-left p-5 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
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
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{fd?.departureTime ? safeDateFormat(fd.departureTime, "dd MMM yyyy") : "---"}</span>
                <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{booking.referenceCode || "---"}</span>
              </div>
            </div>
          </div>
          {expanded ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
        </button>

        {expanded && (
          <div className="border-t border-gray-200 p-5 space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">PNR / Airline Ref</span>
                <span className="font-mono font-bold text-blue-600 text-lg">{(booking as any).duffelBookingReference || booking.referenceCode}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button size="sm" variant="outline" className="gap-2 border-gray-200 text-gray-600" onClick={() => toast({ title: "Check-in Nativo", description: "O fluxo consumirá a API da Duffel." })}>
                  <CheckCircle className="h-3.5 w-3.5" /> Fazer Check-in
                </Button>
                <Button size="sm" variant="outline" className="gap-2 border-gray-200 text-gray-600" onClick={() => toast({ title: "Serviços", description: "Consumindo /seat_maps e /services da Duffel." })}>
                  <Luggage className="h-3.5 w-3.5" /> Assentos & Malas
                </Button>
                <Button size="sm" variant="outline" className="gap-2 border-gray-200 text-gray-600" onClick={() => setLocation(`/checkout/success?bookingId=${booking.id}`)}>
                  <Receipt className="h-3.5 w-3.5" /> E-Ticket / PDF
                </Button>
              </div>
            </div>

            <Separator className="bg-gray-100" />
            
            {/* Itinerário Rápido */}
            <div className="space-y-4">
              {slices.map((slice: any, si: number) => (
                <div key={si} className="text-sm">
                  <div className="font-bold text-gray-900 mb-1">{si === 0 ? "Voo de Ida" : "Voo de Volta"}</div>
                  {slice.segments?.map((seg: any, sgi: number) => (
                    <div key={sgi} className="flex justify-between items-center text-gray-600 border-l-2 border-blue-200 pl-3 ml-2 mb-2">
                      <div>
                        <b>{seg.originCode}</b> {safeDateFormat(seg.departureTime, "HH:mm")} <ArrowRight className="inline h-3 w-3 mx-1" />
                        <b>{seg.destinationCode}</b> {safeDateFormat(seg.arrivalTime, "HH:mm")}
                      </div>
                      <span className="text-xs">{seg.carrierName} {seg.flightNumber}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <Separator className="bg-gray-100" />
            
            {cancelResult && (
              <div className={`p-3 rounded-xl border text-sm ${cancelResult.success ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"}`}>
                <div className="flex items-center gap-2">
                  {cancelResult.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  <span className="font-medium">{cancelResult.success ? "Cancelamento via Duffel Concluído" : cancelResult.message}</span>
                </div>
              </div>
            )}

            {canCancel && !cancelResult?.success && (
              <div className="flex justify-end">
                {cancelConfirm ? (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setCancelConfirm(false)}>Não</Button>
                    <Button size="sm" className="bg-red-600 text-white" onClick={() => cancelMutation.mutate()} disabled={cancelMutation.isPending}>Confirmar Cancelamento Nativo</Button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setCancelConfirm(true)} className="text-red-600 border-red-200 hover:bg-red-50">Cancelar Viagem</Button>
                )}
              </div>
            )}
          </div>
        )}
      </Card>
    </motion.div>
  );
}

function SeniorTripCard({ booking, defaultExpanded = false }: { booking: Booking; defaultExpanded?: boolean }) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(defaultExpanded);
  
  const fd = booking.flightData as any;
  const slices = fd?.slices || [];
  const whatsAppHref = buildWhatsAppHref(buildWhatsAppMessage({ topic: "Assessoria Sênior de Viagem", details: [`Referência: ${booking.referenceCode}`] }));

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card className="bg-white border-blue-200 shadow-md rounded-2xl overflow-hidden border-2">
        <button type="button" onClick={() => setExpanded(!expanded)} className="w-full text-left p-6 flex items-center justify-between gap-4 hover:bg-blue-50 transition-colors">
          <div className="flex items-center gap-5 flex-1 flex-wrap">
            <div className="h-14 w-14 rounded-2xl bg-blue-100 flex items-center justify-center border border-blue-200 shrink-0">
              <Plane className="h-7 w-7 text-blue-600" />
            </div>
            <div>
              <div className="font-bold text-gray-900 text-xl mb-1">
                Sua Viagem para {fd?.destination || "---"}
              </div>
              <div className="text-base text-gray-600 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                {fd?.departureTime ? safeDateFormat(fd.departureTime, "dd de MMMM de yyyy") : "---"}
              </div>
            </div>
          </div>
          {expanded ? <ChevronUp className="h-8 w-8 text-blue-500" /> : <ChevronDown className="h-8 w-8 text-blue-500" />}
        </button>

        {expanded && (
          <div className="border-t-2 border-blue-100 p-6 space-y-6">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="block text-sm text-blue-700 font-bold mb-1">Seu Código de Embarque:</span>
                <span className="font-mono font-black text-blue-900 text-2xl tracking-widest">{(booking as any).duffelBookingReference || booking.referenceCode}</span>
              </div>
              <a href={whatsAppHref} target="_blank" rel="noreferrer" className="w-full sm:w-auto text-center inline-flex items-center justify-center px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-lg transition-colors shadow-lg shadow-emerald-200">
                <Phone className="mr-2 h-5 w-5" /> Nós fazemos o seu Check-in
              </a>
            </div>

            <div className="space-y-6">
              {slices.map((slice: any, si: number) => {
                const firstSeg = slice.segments?.[0];
                const lastSeg = slice.segments?.[slice.segments.length - 1];
                return (
                  <div key={si} className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
                    <h3 className="font-black text-lg text-gray-900 mb-4">{si === 0 ? "Seu Voo de Ida" : "Seu Voo de Volta"}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <div className="text-sm text-gray-500 mb-1">Saída:</div>
                        <div className="font-black text-2xl text-gray-900">{safeDateFormat(firstSeg?.departureTime, "HH:mm")}</div>
                        <div className="text-base font-bold text-gray-700">{firstSeg?.originCode}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 mb-1">Chegada:</div>
                        <div className="font-black text-2xl text-gray-900">{safeDateFormat(lastSeg?.arrivalTime, "HH:mm")}</div>
                        <div className="text-base font-bold text-gray-700">{lastSeg?.destinationCode}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button size="lg" className="w-full text-base font-bold h-14 bg-blue-100 text-blue-800 hover:bg-blue-200" onClick={() => window.location.href = `/checkout/success?bookingId=${booking.id}`}>
                <Printer className="mr-2 h-5 w-5" /> Imprimir Documento Simples
              </Button>
              <a href={whatsAppHref} target="_blank" rel="noreferrer" className="w-full inline-flex items-center justify-center h-14 px-4 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl text-base transition-colors">
                <HelpCircle className="mr-2 h-5 w-5" /> Preciso de Ajuda Rápida
              </a>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
});
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
            <StandardTripCard booking={foundBooking} defaultExpanded />
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

  const [simulationMode, setSimulationMode] = useState<"standard" | "senior">("standard");

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <SEO title="Minhas Viagens" description="Acompanhe suas reservas de voo e gerencie suas viagens." path="/my-trips" noindex={true} />
      <div className="bg-white border-b border-gray-200 shadow-sm pt-8 pb-6 px-4">
        <div className="container mx-auto max-w-4xl flex justify-between items-center flex-wrap gap-4">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-bold font-display text-gray-900" data-testid="text-my-trips-title">
              {t("trips.title") || "My Trips"}
            </h1>
            <p className="text-gray-500 mt-1">
              {t("trips.subtitle") || "View your booking history, check flight details, and manage your trips"}
            </p>
          </motion.div>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setSimulationMode("standard")}
              className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${simulationMode === "standard" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
            >
              Fluxo Regular
            </button>
            <button
              onClick={() => setSimulationMode("senior")}
              className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${simulationMode === "senior" ? "bg-blue-600 text-white shadow-sm" : "text-gray-500"}`}
            >
              Fluxo Sênior / Premium
            </button>
          </div>
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
                    <div className="h-16 w-16 rounded-full bg-gray-50 flex items-center justify-center border border-blue-100">
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
                  simulationMode === "senior" ? (
                    <SeniorTripCard key={b.id} booking={b} />
                  ) : (
                    <StandardTripCard key={b.id} booking={b} />
                  )
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
