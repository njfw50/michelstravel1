import { useAuth } from "@/hooks/use-auth";
import { useAdminStats, useAllBookings } from "@/hooks/use-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Loader2, DollarSign, Users, Plane, TrendingUp } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: bookings } = useAllBookings();
  const { t } = useI18n();

  if (authLoading || statsLoading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!user) {
    window.location.href = '/api/login';
    return null;
  }

  const statCards = [
    { title: t("admin.total_revenue"), value: `$${stats?.totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-emerald-400" },
    { title: t("admin.commissions"), value: `$${stats?.totalCommission.toLocaleString()}`, icon: TrendingUp, color: "text-amber-400" },
    { title: t("admin.total_bookings"), value: stats?.totalBookings, icon: Plane, color: "text-teal-400" },
    { title: t("admin.recent_searches"), value: stats?.recentSearches, icon: Users, color: "text-orange-400" },
  ];

  const chartData = [
    { name: 'Mon', revenue: 4000 },
    { name: 'Tue', revenue: 3000 },
    { name: 'Wed', revenue: 2000 },
    { name: 'Thu', revenue: 2780 },
    { name: 'Fri', revenue: 1890 },
    { name: 'Sat', revenue: 2390 },
    { name: 'Sun', revenue: 3490 },
  ];

  return (
    <div className="min-h-screen bg-transparent p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold font-display text-white drop-shadow-md">{t("admin.dashboard")}</h1>
            <p className="text-white/60">{t("admin.welcome")}, {user.firstName || 'Admin'}. {t("admin.happening")}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, i) => (
            <Card key={i} className="border border-white/10 shadow-lg bg-white/5 backdrop-blur-md hover:bg-white/10 transition-colors">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/60 mb-1">{stat.title}</p>
                  <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
                </div>
                <div className={`h-12 w-12 rounded-xl border flex items-center justify-center shadow-inner ${stat.color} bg-white/5 border-white/10`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 border border-white/10 shadow-lg bg-white/5 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-white">{t("admin.revenue_overview")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.5)'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.5)'}} tickFormatter={(value) => `$${value}`} />
                    <Tooltip 
                      cursor={{fill: 'rgba(255,255,255,0.05)'}}
                      contentStyle={{borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15, 23, 42, 0.9)', color: 'white', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.3)'}} 
                    />
                    <Bar dataKey="revenue" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-white/10 shadow-lg bg-white/5 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-white">{t("admin.recent_bookings")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bookings?.slice(0, 5).map((booking: any) => (
                  <div key={booking.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-white/10 rounded-full flex items-center justify-center text-amber-400 border border-white/10 shadow-inner">
                        <Plane className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-white">{booking.contactEmail}</p>
                        <p className="text-xs text-white/50">ID: {booking.id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-white">${booking.totalPrice}</p>
                      <span className="text-[10px] uppercase font-bold text-green-400 bg-green-500/20 border border-green-500/30 px-2 py-0.5 rounded-full">
                        {booking.status}
                      </span>
                    </div>
                  </div>
                ))}
                {!bookings?.length && <p className="text-white/40 text-sm text-center py-4">{t("admin.no_bookings")}</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
