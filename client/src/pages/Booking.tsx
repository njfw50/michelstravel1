import { useLocation, useRoute } from "wouter";
import { Layout } from "@/components/Layout";
import { useCreateBooking } from "@/hooks/use-bookings";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { insertBookingSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, Plane, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

// Extension schema for the form (client-side specific fields)
const bookingFormSchema = z.object({
  fullName: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Valid phone number required"),
  passportNumber: z.string().min(6, "Passport number required"),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

export default function Booking() {
  const [_, params] = useRoute("/book/:id");
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1]);
  const passengers = searchParams.get("passengers") || "1";
  const { user } = useAuth();
  
  const createBooking = useCreateBooking();
  const [isSuccess, setIsSuccess] = useState(false);

  // Mock fetching flight data since we don't have a real persistent flight DB
  // In a real app, useQuery for flight details by ID
  const flightDetails = {
    id: params?.id,
    airline: "Delta Airlines",
    flightNumber: "DL123",
    departureTime: "10:00 AM",
    arrivalTime: "02:00 PM",
    origin: "NYC",
    destination: "LHR",
    price: 450,
    currency: "USD",
  };

  const totalPrice = flightDetails.price * parseInt(passengers);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      fullName: user ? `${user.firstName} ${user.lastName}` : "",
      email: user?.email || "",
      phone: "",
      passportNumber: "",
    },
  });

  const onSubmit = (data: BookingFormValues) => {
    createBooking.mutate({
      userId: user?.id || null, // Allow guest checkout
      flightData: flightDetails,
      passengerDetails: { ...data, passengers: parseInt(passengers) },
      totalPrice: totalPrice,
      currency: "USD",
      contactEmail: data.email,
      status: "pending",
      commissionRate: "0.05"
    }, {
      onSuccess: () => {
        setIsSuccess(true);
        toast({
          title: "Booking Confirmed!",
          description: "We've sent the details to your email.",
        });
      },
      onError: (error) => {
        toast({
          title: "Booking Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  };

  if (isSuccess) {
    return (
      <Layout>
        <div className="container max-w-lg mx-auto py-20 px-4 text-center">
          <div className="bg-green-50 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Booking Confirmed!</h1>
          <p className="text-muted-foreground mb-8">
            Thank you for booking with us. Your e-ticket has been sent to your email.
          </p>
          <Button className="w-full bg-primary" onClick={() => window.location.href = "/"}>
            Return Home
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-slate-50 min-h-screen py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold mb-8">Finalize Your Booking</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Booking Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Passenger Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Full Name</Label>
                        <Input {...form.register("fullName")} placeholder="As on passport" />
                        {form.formState.errors.fullName && <p className="text-red-500 text-xs">{form.formState.errors.fullName.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label>Passport Number</Label>
                        <Input {...form.register("passportNumber")} placeholder="X0000000" />
                        {form.formState.errors.passportNumber && <p className="text-red-500 text-xs">{form.formState.errors.passportNumber.message}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Email Address</Label>
                        <Input {...form.register("email")} type="email" />
                        {form.formState.errors.email && <p className="text-red-500 text-xs">{form.formState.errors.email.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label>Phone Number</Label>
                        <Input {...form.register("phone")} type="tel" />
                        {form.formState.errors.phone && <p className="text-red-500 text-xs">{form.formState.errors.phone.message}</p>}
                      </div>
                    </div>

                    <Separator className="my-6" />

                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Payment Method</h3>
                      <div className="p-4 border rounded-xl bg-slate-50 text-center text-muted-foreground text-sm">
                        🔒 Secure Payment Gateway Placeholder
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-12 text-lg font-bold bg-primary hover:bg-blue-600 mt-4"
                      disabled={createBooking.isPending}
                    >
                      {createBooking.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                        </>
                      ) : (
                        `Pay $${totalPrice.toFixed(2)}`
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Flight Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24 bg-slate-900 text-white border-none">
                <CardHeader>
                  <CardTitle className="text-white">Flight Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{flightDetails.origin}</div>
                      <div className="text-xs text-slate-400">{flightDetails.departureTime}</div>
                    </div>
                    <Plane className="h-6 w-6 text-primary mx-4" />
                    <div className="text-center">
                      <div className="text-2xl font-bold">{flightDetails.destination}</div>
                      <div className="text-xs text-slate-400">{flightDetails.arrivalTime}</div>
                    </div>
                  </div>

                  <Separator className="bg-slate-800" />

                  <div className="space-y-2 text-sm text-slate-300">
                    <div className="flex justify-between">
                      <span>Airline</span>
                      <span className="font-medium text-white">{flightDetails.airline}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Flight No</span>
                      <span className="font-medium text-white">{flightDetails.flightNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Passengers</span>
                      <span className="font-medium text-white">{passengers} Adults</span>
                    </div>
                  </div>

                  <Separator className="bg-slate-800" />

                  <div className="flex justify-between items-end">
                    <span className="text-slate-300">Total Price</span>
                    <span className="text-3xl font-bold text-primary">${totalPrice}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
