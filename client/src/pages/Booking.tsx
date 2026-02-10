import { useRoute, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useBooking, useCreateBooking } from "@/hooks/use-bookings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Plane, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { api } from "@shared/routes";

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
  
  // Note: In a real app, we would fetch the specific flight offer details again 
  // or pass them via state. For MVP, we'll assume we pass enough data or fetch it.
  // Here we'll simulate fetching the flight details or just show a placeholder if missing.
  // Ideally, useFlightOffer(id) would exist.

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

  const onSubmit = (data: BookingFormValues) => {
    // Construct the payload matching the schema
    const bookingData = {
      contactEmail: data.email,
      totalPrice: "500.00", // Mock price as we don't have flight data in this context without re-fetch
      currency: "USD",
      flightData: { id: params?.id, airline: "Mock Airline" }, // Simplified
      passengerDetails: {
        firstName: data.firstName,
        lastName: data.lastName,
        passport: data.passportNumber,
      },
    };

    createBooking.mutate(bookingData, {
      onSuccess: () => {
        toast({
          title: "Booking Confirmed!",
          description: "Your flight has been booked successfully.",
          className: "bg-green-50 border-green-200 text-green-900",
        });
        setLocation("/");
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
                    disabled={createBooking.isPending}
                  >
                    {createBooking.isPending ? "Processing..." : "Confirm & Pay"}
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
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 bg-white/10 rounded-full flex items-center justify-center">
                    <Plane className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-bold">Flight #{params?.id?.slice(0, 8)}</div>
                    <div className="text-sm text-slate-400">Mock Airline</div>
                  </div>
                </div>
                
                <Separator className="bg-slate-800" />
                
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Base Fare</span>
                  <span className="font-medium">$450.00</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Taxes & Fees</span>
                  <span className="font-medium">$50.00</span>
                </div>
                
                <Separator className="bg-slate-800" />
                
                <div className="flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span>$500.00</span>
                </div>
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
