import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useAdminStats, useAdminBookings, useSiteSettings, useUpdateSiteSettings } from "@/hooks/use-admin";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Loader2, DollarSign, Users, Plane, Settings } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "@/hooks/use-toast";

export default function AdminDashboard() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: bookings, isLoading: bookingsLoading } = useAdminBookings();
  const { data: settings } = useSiteSettings();
  const updateSettings = useUpdateSiteSettings();

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = "/api/login";
    }
  }, [authLoading, isAuthenticated]);

  if (authLoading || statsLoading || bookingsLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Settings Form
  const SettingsForm = () => {
    const { register, handleSubmit } = useForm({
      defaultValues: settings || {
        siteName: "SkyScanner Clone",
        commissionPercentage: "5.00",
        heroTitle: "Find Your Next Adventure",
        heroSubtitle: "Best prices on flights worldwide."
      }
    });

    const onSubmit = (data: any) => {
      updateSettings.mutate(data, {
        onSuccess: () => toast({ title: "Settings Updated" })
      });
    };

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
        <div className="space-y-2">
          <Label>Site Name</Label>
          <Input {...register("siteName")} />
        </div>
        <div className="space-y-2">
          <Label>Commission Percentage (%)</Label>
          <Input type="number" step="0.01" {...register("commissionPercentage")} />
        </div>
        <div className="space-y-2">
          <Label>Hero Title</Label>
          <Input {...register("heroTitle")} />
        </div>
        <div className="space-y-2">
          <Label>Hero Subtitle</Label>
          <Input {...register("heroSubtitle")} />
        </div>
        <Button type="submit" disabled={updateSettings.isPending}>
          {updateSettings.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    );
  };

  // Mock data for chart
  const chartData = [
    { name: 'Mon', revenue: 400 },
    { name: 'Tue', revenue: 300 },
    { name: 'Wed', revenue: 550 },
    { name: 'Thu', revenue: 450 },
    { name: 'Fri', revenue: 800 },
    { name: 'Sat', revenue: 900 },
    { name: 'Sun', revenue: 600 },
  ];

  return (
    <Layout>
      <div className="bg-slate-50 min-h-screen pb-20">
        <div className="bg-slate-900 text-white py-12">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-slate-400">Welcome back, {user?.firstName}</p>
          </div>
        </div>

        <div className="container mx-auto px-4 -mt-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="shadow-lg border-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats?.totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">+20.1% from last month</p>
              </CardContent>
            </Card>
            <Card className="shadow-lg border-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Commissions</CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">${stats?.totalCommission.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">High margin!</p>
              </CardContent>
            </Card>
            <Card className="shadow-lg border-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bookings</CardTitle>
                <Plane className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalBookings}</div>
              </CardContent>
            </Card>
            <Card className="shadow-lg border-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Searches</CardTitle>
                <Users className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.recentSearches}</div>
                <p className="text-xs text-muted-foreground">Past 24 hours</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-white p-1 rounded-xl shadow-sm border">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-md border-none">
                  <CardHeader>
                    <CardTitle>Revenue Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} prefix="$" />
                        <Tooltip 
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                          cursor={{ fill: 'transparent' }}
                        />
                        <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="shadow-md border-none">
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest bookings and user actions.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {bookings?.slice(0, 5).map((booking) => (
                        <div key={booking.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                              {booking.contactEmail.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{booking.contactEmail}</p>
                              <p className="text-xs text-muted-foreground">Booked a flight for ${booking.totalPrice}</p>
                            </div>
                          </div>
                          <div className="text-xs text-slate-500">
                            {new Date(booking.createdAt!).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="bookings">
              <Card className="shadow-md border-none">
                <CardHeader>
                  <CardTitle>All Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>User Email</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings?.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell className="font-medium">#{booking.id}</TableCell>
                          <TableCell>{booking.contactEmail}</TableCell>
                          <TableCell>${booking.totalPrice}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              booking.status === 'confirmed' ? 'bg-green-100 text-green-700' : 
                              booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {booking.status}
                            </span>
                          </TableCell>
                          <TableCell>{new Date(booking.createdAt!).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card className="shadow-md border-none">
                <CardHeader>
                  <CardTitle>Site Settings</CardTitle>
                  <CardDescription>Configure commission rates and site metadata.</CardDescription>
                </CardHeader>
                <CardContent>
                  <SettingsForm />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}
