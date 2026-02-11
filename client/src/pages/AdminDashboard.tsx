import { useAuth } from "@/hooks/use-auth";
import { useAdminStats, useAllBookings } from "@/hooks/use-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Loader2, DollarSign, Users, Plane, TrendingUp, ShieldCheck, ShieldAlert, ToggleLeft, ToggleRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

function TestModeControl() {
  const { t } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isToggling, setIsToggling] = useState(false);

  const { data: testModeData, isLoading } = useQuery<{ testMode: boolean; activeTokenIsTest: boolean; hasLiveToken: boolean; hasTestToken: boolean }>({
    queryKey: ['/api/test-mode'],
  });

  const toggleMutation = useMutation({
    mutationFn: async (newTestMode: boolean) => {
      setIsToggling(true);
      const res = await fetch('/api/admin/test-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testMode: newTestMode }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to toggle test mode');
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/test-mode'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      toast({
        title: data.testMode ? t("admin.test_mode_enabled") : t("admin.test_mode_disabled"),
        description: data.testMode ? t("admin.test_mode_safe") : t("admin.test_mode_live"),
      });
      setIsToggling(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setIsToggling(false);
    },
  });

  if (isLoading) {
    return (
      <Card className="border border-white/10 shadow-lg bg-white/5 backdrop-blur-md">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-white/40" />
        </CardContent>
      </Card>
    );
  }

  const currentTestMode = testModeData?.testMode ?? true;
  const tokenActive = testModeData?.activeTokenIsTest ?? true;
  const liveTokenReady = testModeData?.hasLiveToken ?? false;
  const testTokenReady = testModeData?.hasTestToken ?? false;

  return (
    <Card className={`border shadow-lg backdrop-blur-md ${currentTestMode ? 'border-amber-500/30 bg-amber-500/5' : 'border-emerald-500/30 bg-emerald-500/5'}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
        <div className="flex items-center gap-3">
          {currentTestMode ? (
            <div className="h-12 w-12 rounded-xl border flex items-center justify-center shadow-inner text-amber-400 bg-amber-500/10 border-amber-500/20">
              <ShieldCheck className="h-6 w-6" />
            </div>
          ) : (
            <div className="h-12 w-12 rounded-xl border flex items-center justify-center shadow-inner text-emerald-400 bg-emerald-500/10 border-emerald-500/20">
              <ShieldAlert className="h-6 w-6" />
            </div>
          )}
          <div>
            <CardTitle className="text-lg text-white">{t("admin.test_mode")}</CardTitle>
            <p className="text-xs text-white/50 mt-1">{t("admin.test_mode_desc")}</p>
          </div>
        </div>
        <Badge
          data-testid="badge-test-mode-status"
          className={`text-xs font-bold px-3 py-1 ${
            currentTestMode 
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
          }`}
        >
          {currentTestMode ? t("admin.test_mode_enabled") : t("admin.test_mode_disabled")}
        </Badge>
      </CardHeader>
      <CardContent className="p-6 pt-2 space-y-4">
        <div className="flex flex-col gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-sm text-white/70">{t("admin.token_status")}:</span>
            <Badge
              data-testid="badge-active-token"
              className={`text-xs ${
                tokenActive 
                  ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' 
                  : 'bg-green-500/20 text-green-300 border-green-500/30'
              }`}
            >
              {tokenActive ? t("admin.token_test") : t("admin.token_production")}
            </Badge>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${testTokenReady ? 'bg-yellow-400' : 'bg-red-400'}`} />
              <span className="text-xs text-white/50">DUFFEL_API_TOKEN: {testTokenReady ? 'OK' : 'Missing'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${liveTokenReady ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className="text-xs text-white/50">DUFFEL_LIVE_TOKEN: {liveTokenReady ? 'OK' : 'Missing'}</span>
            </div>
          </div>
        </div>

        {!liveTokenReady && !currentTestMode && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
            {t("admin.test_mode_warning")}
          </div>
        )}

        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className={`text-sm font-medium ${currentTestMode ? 'text-amber-300' : 'text-emerald-300'}`}>
            {currentTestMode ? t("admin.test_mode_safe") : t("admin.test_mode_live")}
          </p>
          <Button
            data-testid="button-toggle-test-mode"
            variant={currentTestMode ? "default" : "destructive"}
            onClick={() => toggleMutation.mutate(!currentTestMode)}
            disabled={isToggling || toggleMutation.isPending}
            className="gap-2"
          >
            {isToggling || toggleMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : currentTestMode ? (
              <ToggleRight className="h-4 w-4" />
            ) : (
              <ToggleLeft className="h-4 w-4" />
            )}
            {currentTestMode ? t("admin.test_mode_toggle_off") : t("admin.test_mode_toggle_on")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

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
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold font-display text-white drop-shadow-md">{t("admin.dashboard")}</h1>
            <p className="text-white/60">{t("admin.welcome")}, {user.firstName || 'Admin'}. {t("admin.happening")}</p>
          </div>
        </div>

        <TestModeControl />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, i) => (
            <Card key={i} className="border border-white/10 shadow-lg bg-white/5 backdrop-blur-md hover:bg-white/10 transition-colors">
              <CardContent className="p-6 flex items-center justify-between gap-4">
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
                  <div key={booking.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
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
