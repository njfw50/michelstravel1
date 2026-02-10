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
import { CheckCircle2, Plane, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";

// Define form schema
const bookingFormSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email address"),
  passportNumber: z.string().min(5, "Passport number is required"),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

export default function Booking() {
  const [match, params] = useRoute("/book/:id");
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
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

  // Fetch flight details
  useEffect(() => {
    if (params?.id) {
      fetch(`/api/flights/${params.id}`)
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                toast({
                    title: "Error",
                    description: "Could not find flight details.",
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

    // Construct the payload matching the schema
    const bookingData = {
      contactEmail: data.email,
      totalPrice: flight.price.toString(),
      currency: flight.currency,
      flightData: { 
        id: flight.id, 
        airline: flight.airline,
        flightNumber: flight.flightNumber,
        origin: "Origin", // Duffel simplified object doesn't have origin/dest codes directly exposed in simplified type, but we can assume them or add them
        destination: "Destination",
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
          title: "Booking Initiated!",
          description: "Redirecting to payment...",
          className: "bg-blue-50 border-blue-200 text-blue-900",
        });
        // Redirect to Stripe Checkout
        if (response.checkoutUrl) {
            window.location.href = response.checkoutUrl;
        } else {
            // Fallback
            setLocation("/");
        }
      },
      onError: () => {
        toast({
          title: "Booking Failed",
          description: "There was an error processing your booking.",
          variant: "destructive",
        });
      },
    });
  };

  if (!flight && !params?.id) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading flight details...</div>;
  if (flight && flight.error) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Flight not found</div>;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold font-display text-slate-900 mb-8">Complete Your Booking</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-sm">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Passenger Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" {...form.register("firstName")} />
                      {form.formState.errors.firstName && (
                        <p className="text-sm text-red-500">{form.formState.errors.firstName.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" {...form.register("lastName")} />
                      {form.formState.errors.lastName && (
                        <p className="text-sm text-red-500">{form.formState.errors.lastName.message}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" {...form.register("email")} />
                    {form.formState.errors.email && (
                      <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="passportNumber">Passport Number</Label>
                    <Input id="passportNumber" {...form.register("passportNumber")} />
                    {form.formState.errors.passportNumber && (
                      <p className="text-sm text-red-500">{form.formState.errors.passportNumber.message}</p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full mt-6 h-12 text-lg font-bold shadow-lg shadow-primary/20" 
                    disabled={createBooking.isPending || !flight}
                  >
                    {createBooking.isPending ? "Processing..." : `Pay ${flight ? new Intl.NumberFormat('en-US', { style: 'currency', currency: flight.currency }).format(flight.price) : '...'}`}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-none shadow-sm bg-slate-900 text-white">
              <CardHeader className="border-b border-slate-800">
                <CardTitle className="text-lg">Flight Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {flight ? (
                <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 bg-white/10 rounded-full flex items-center justify-center overflow-hidden p-1">
                    {flight.logoUrl ? <img src={flight.logoUrl} className="w-full h-full object-contain" /> : <Plane className="h-5 w-5" />}
                  </div>
                  <div>
                    <div className="font-bold">{flight.airline} {flight.flightNumber}</div>
                    <div className="text-sm text-slate-400">{flight.duration} duration</div>
                  </div>
                </div>
                
                <Separator className="bg-slate-800" />
                
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Base Fare</span>
                  <span className="font-medium">{new Intl.NumberFormat('en-US', { style: 'currency', currency: flight.currency }).format(flight.price * 0.9)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Taxes & Fees</span>
                  <span className="font-medium">{new Intl.NumberFormat('en-US', { style: 'currency', currency: flight.currency }).format(flight.price * 0.1)}</span>
                </div>
                
                <Separator className="bg-slate-800" />
                
                <div className="flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: flight.currency }).format(flight.price)}</span>
                </div>
                </>
                ) : (
                    <div className="text-center py-4">Loading flight details...</div>
                )}
              </CardContent>
            </Card>

            <div className="bg-blue-50 p-4 rounded-xl flex gap-3 text-blue-800 text-sm">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p>Free cancellation within 24 hours of booking. No hidden fees.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
