import { useRoute, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateBooking } from "@/hooks/use-bookings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Plane, AlertCircle, Clock, ArrowRight, Shield } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { useI18n } from "@/lib/i18n";

const bookingFormSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email address"),
  passportNumber: z.string().min(5, "Passport number is required"),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

const formatDuration = (duration: string) => {
  const hoursMatch = duration.match(/(\d+)H/);
  const minutesMatch = duration.match(/(\d+)M/);
  const hours = hoursMatch ? hoursMatch[1] : "0";
  const minutes = minutesMatch ? minutesMatch[1] : "0";
  return `${hours}h ${minutes}m`;
};

export default function Booking() {
  const [match, params] = useRoute("/book/:id");
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useI18n();
  
  const createBooking = useCreateBooking();

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      passportNumber: "",
    },
  });

  const [flight, setFlight] = useState<any>(null);

  useEffect(() => {
    if (params?.id) {
      fetch(`/api/flights/${params.id}`)
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                toast({
                    title: t("booking.error"),
                    description: t("booking.error_desc"),
                    variant: "destructive"
                });
            } else {
                setFlight(data);
            }
        })
        .catch(err => console.error("Failed to fetch flight", err));
    }
  }, [params?.id]);

  const onSubmit = (data: BookingFormValues) => {
    if (!flight) return;

    const bookingData = {
      contactEmail: data.email,
      totalPrice: flight.price.toString(),
      currency: flight.currency,
      flightData: { 
        id: flight.id, 
        airline: flight.airline,
        flightNumber: flight.flightNumber,
        origin: flight.originCode || "N/A",
        destination: flight.destinationCode || "N/A",
        departureTime: flight.departureTime,
        arrivalTime: flight.arrivalTime
      },
      passengerDetails: {
        firstName: data.firstName,
        lastName: data.lastName,
        passport: data.passportNumber,
      },
    };

    createBooking.mutate(bookingData, {
      onSuccess: (response: any) => {
        toast({
          title: t("booking.initiated"),
          description: t("booking.redirect"),
        });
        if (response.checkoutUrl) {
            window.location.href = response.checkoutUrl;
        } else {
            setLocation("/");
        }
      },
      onError: () => {
        toast({
          title: t("booking.failed"),
          description: t("booking.failed_desc"),
          variant: "destructive",
        });
      },
    });
  };

  const stopsLabel = flight 
    ? (flight.stops === 0 
        ? t("flight.direct") 
        : `${flight.stops} ${flight.stops > 1 ? t("flight.stops") : t("flight.stop")}`)
    : "";

  if (!flight && !params?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white/50">{t("booking.loading")}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-display text-white mb-2 drop-shadow-md">{t("booking.title")}</h1>
          <p className="text-white/50">{t("booking.subtitle")}</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border border-white/10 shadow-lg bg-white/5 backdrop-blur-md rounded-2xl">
              <CardHeader className="border-b border-white/10 gap-2">
                <CardTitle className="flex items-center gap-2 text-white">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  {t("booking.passenger_details")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-white/80">{t("booking.first_name")}</Label>
                      <Input
                        id="firstName"
                        {...form.register("firstName")}
                        className="bg-white/5 border-white/15 text-white placeholder:text-white/30 focus:border-amber-500/50 focus:ring-amber-500/20"
                        placeholder={t("booking.first_name")}
                        data-testid="input-first-name"
                      />
                      {form.formState.errors.firstName && (
                        <p className="text-sm text-red-400">{form.formState.errors.firstName.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-white/80">{t("booking.last_name")}</Label>
                      <Input
                        id="lastName"
                        {...form.register("lastName")}
                        className="bg-white/5 border-white/15 text-white placeholder:text-white/30 focus:border-amber-500/50 focus:ring-amber-500/20"
                        placeholder={t("booking.last_name")}
                        data-testid="input-last-name"
                      />
                      {form.formState.errors.lastName && (
                        <p className="text-sm text-red-400">{form.formState.errors.lastName.message}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white/80">{t("booking.email")}</Label>
                    <Input
                      id="email"
                      type="email"
                      {...form.register("email")}
                      className="bg-white/5 border-white/15 text-white placeholder:text-white/30 focus:border-amber-500/50 focus:ring-amber-500/20"
                      placeholder="your@email.com"
                      data-testid="input-email"
                    />
                    {form.formState.errors.email && (
                      <p className="text-sm text-red-400">{form.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="passportNumber" className="text-white/80">{t("booking.passport")}</Label>
                    <Input
                      id="passportNumber"
                      {...form.register("passportNumber")}
                      className="bg-white/5 border-white/15 text-white placeholder:text-white/30 focus:border-amber-500/50 focus:ring-amber-500/20"
                      placeholder="e.g. AB1234567"
                      data-testid="input-passport"
                    />
                    {form.formState.errors.passportNumber && (
                      <p className="text-sm text-red-400">{form.formState.errors.passportNumber.message}</p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full mt-4 h-12 text-base font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 shadow-lg shadow-amber-900/30 transition-all border-0 text-white rounded-xl" 
                    disabled={createBooking.isPending || !flight}
                    data-testid="button-pay"
                  >
                    {createBooking.isPending ? t("booking.processing") : `${t("booking.pay")} ${flight ? new Intl.NumberFormat('en-US', { style: 'currency', currency: flight.currency }).format(flight.price) : '...'}`}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border border-white/10 shadow-lg bg-white/5 backdrop-blur-md rounded-2xl">
              <CardHeader className="border-b border-white/10 gap-2">
                <CardTitle className="text-lg text-white">{t("booking.flight_summary")}</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                {flight ? (
                <>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-white/10 rounded-full flex items-center justify-center overflow-hidden p-2 border border-white/15 shadow-inner">
                    {flight.logoUrl ? <img src={flight.logoUrl} className="w-full h-full object-contain" alt={flight.airline} /> : <Plane className="h-5 w-5 text-white/50" />}
                  </div>
                  <div>
                    <div className="font-bold text-white">{flight.airline}</div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="bg-amber-500/15 text-amber-200 border border-amber-500/20 text-xs">
                        {flight.flightNumber}
                      </Badge>
                      {flight.aircraftType && (
                        <Badge variant="secondary" className="bg-teal-500/10 text-teal-200 border border-teal-500/20 text-xs">
                          {flight.aircraftType}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex justify-between items-center mb-3">
                    <div className="text-center">
                      <div className="text-xl font-bold text-white">{format(parseISO(flight.departureTime), "HH:mm")}</div>
                      <div className="text-xs text-white/50 font-medium uppercase">{flight.originCode || "DEP"}</div>
                      {flight.originCity && <div className="text-[10px] text-white/40">{flight.originCity}</div>}
                    </div>
                    <div className="flex flex-col items-center px-3">
                      <div className="text-xs text-white/50 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {flight.duration.startsWith("P") ? formatDuration(flight.duration) : flight.duration}
                      </div>
                      <ArrowRight className="h-4 w-4 text-amber-400 my-1" />
                      <div className={`text-xs font-bold ${flight.stops === 0 ? "text-emerald-400" : "text-amber-400"}`}>
                        {stopsLabel}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-white">{format(parseISO(flight.arrivalTime), "HH:mm")}</div>
                      <div className="text-xs text-white/50 font-medium uppercase">{flight.destinationCode || "ARR"}</div>
                      {flight.destinationCity && <div className="text-[10px] text-white/40">{flight.destinationCity}</div>}
                    </div>
                  </div>
                  <div className="text-xs text-white/40 text-center">
                    {format(parseISO(flight.departureTime), "EEEE, MMMM d, yyyy")}
                  </div>
                </div>
                
                <Separator className="bg-white/10" />
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">{t("booking.base_fare")}</span>
                    <span className="font-medium text-white">{new Intl.NumberFormat('en-US', { style: 'currency', currency: flight.currency }).format(flight.price * 0.9)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">{t("booking.taxes")}</span>
                    <span className="font-medium text-white">{new Intl.NumberFormat('en-US', { style: 'currency', currency: flight.currency }).format(flight.price * 0.1)}</span>
                  </div>
                </div>
                
                <Separator className="bg-white/10" />
                
                <div className="flex justify-between text-xl font-bold">
                  <span className="text-white">{t("booking.total")}</span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-400">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: flight.currency }).format(flight.price)}
                  </span>
                </div>
                </>
                ) : (
                  <div className="text-center py-4 text-white/40">{t("booking.loading")}</div>
                )}
              </CardContent>
            </Card>

            <div className="bg-emerald-500/10 p-4 rounded-xl flex gap-3 text-emerald-300 text-sm border border-emerald-500/20">
              <Shield className="h-5 w-5 shrink-0 text-emerald-400" />
              <p>{t("booking.secure_payment")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
