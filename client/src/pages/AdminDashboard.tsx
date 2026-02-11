import { useAdminStats, useAllBookings, useSiteSettings, useUpdateSettings } from "@/hooks/use-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Loader2, DollarSign, Users, Plane, TrendingUp, ShieldCheck, ShieldAlert, ToggleLeft, ToggleRight, Percent, Save, LogOut } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";

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
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  const currentTestMode = testModeData?.testMode ?? true;
  const tokenActive = testModeData?.activeTokenIsTest ?? true;
  const liveTokenReady = testModeData?.hasLiveToken ?? false;
  const testTokenReady = testModeData?.hasTestToken ?? false;

  return (
    <Card className={`border shadow-sm ${currentTestMode ? 'border-blue-200 bg-blue-50' : 'border-emerald-200 bg-emerald-50'}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
        <div className="flex items-center gap-3">
          {currentTestMode ? (
            <div className="h-12 w-12 rounded-xl border flex items-center justify-center shadow-inner text-blue-500 bg-blue-100 border-blue-200">
              <ShieldCheck className="h-6 w-6" />
            </div>
          ) : (
            <div className="h-12 w-12 rounded-xl border flex items-center justify-center shadow-inner text-emerald-500 bg-emerald-100 border-emerald-200">
              <ShieldAlert className="h-6 w-6" />
            </div>
          )}
          <div>
            <CardTitle className="text-lg text-gray-900">{t("admin.test_mode")}</CardTitle>
            <p className="text-xs text-gray-500 mt-1">{t("admin.test_mode_desc")}</p>
          </div>
        </div>
        <Badge
          data-testid="badge-test-mode-status"
          className={`text-xs font-bold px-3 py-1 ${
            currentTestMode 
              ? 'bg-blue-100 text-blue-700 border-blue-200' 
              : 'bg-emerald-100 text-emerald-700 border-emerald-200'
          }`}
        >
          {currentTestMode ? t("admin.test_mode_enabled") : t("admin.test_mode_disabled")}
        </Badge>
      </CardHeader>
      <CardContent className="p-6 pt-2 space-y-4">
        <div className="flex flex-col gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-sm text-gray-600">{t("admin.token_status")}:</span>
            <Badge
              data-testid="badge-active-token"
              className={`text-xs ${
                tokenActive 
                  ? 'bg-yellow-100 text-yellow-700 border-yellow-200' 
                  : 'bg-green-100 text-green-700 border-green-200'
              }`}
            >
              {tokenActive ? t("admin.token_test") : t("admin.token_production")}
            </Badge>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${testTokenReady ? 'bg-yellow-400' : 'bg-red-400'}`} />
              <span className="text-xs text-gray-500">DUFFEL_API_TOKEN: {testTokenReady ? 'OK' : 'Missing'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${liveTokenReady ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className="text-xs text-gray-500">DUFFEL_LIVE_TOKEN: {liveTokenReady ? 'OK' : 'Missing'}</span>
            </div>
          </div>
        </div>

        {!liveTokenReady && !currentTestMode && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs">
            {t("admin.test_mode_warning")}
          </div>
        )}

        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className={`text-sm font-medium ${currentTestMode ? 'text-blue-600' : 'text-emerald-600'}`}>
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

function CommissionControl() {
  const { t } = useI18n();
  const { toast } = useToast();
  const { data: settings, isLoading } = useSiteSettings();
  const updateSettings = useUpdateSettings();
  const [commissionValue, setCommissionValue] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (settings?.commissionPercentage) {
      setCommissionValue(settings.commissionPercentage);
    }
  }, [settings?.commissionPercentage]);

  const handleSave = async () => {
    const numValue = parseFloat(commissionValue);
    if (isNaN(numValue) || numValue < 0 || numValue > 100) {
      toast({
        title: t("admin.commission_error"),
        description: t("admin.commission_range"),
        variant: "destructive",
      });
      return;
    }

    try {
      await updateSettings.mutateAsync({
        commissionPercentage: numValue.toFixed(2),
        siteName: settings?.siteName || undefined,
        heroTitle: settings?.heroTitle || undefined,
        heroSubtitle: settings?.heroSubtitle || undefined,
        testMode: settings?.testMode ?? true,
      });
      setHasChanges(false);
      toast({
        title: t("admin.commission_saved"),
        description: `${t("admin.commission_updated")} ${numValue.toFixed(2)}%`,
      });
    } catch (error: any) {
      toast({
        title: t("admin.commission_error"),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border border-gray-200 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-2">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl border flex items-center justify-center shadow-inner text-teal-500 bg-teal-50 border-teal-200">
            <Percent className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-lg text-gray-900">{t("admin.commission_title")}</CardTitle>
            <p className="text-xs text-gray-500 mt-1">{t("admin.commission_desc")}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 pt-2 space-y-4">
        <div className="flex flex-col gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200">
          <Label htmlFor="commission-rate" className="text-sm text-gray-600">
            {t("admin.commission_label")}
          </Label>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Input
                id="commission-rate"
                data-testid="input-commission-rate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={commissionValue}
                onChange={(e) => {
                  setCommissionValue(e.target.value);
                  setHasChanges(true);
                }}
                className="bg-white border-gray-200 text-gray-900 pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
            </div>
            <Button
              data-testid="button-save-commission"
              onClick={handleSave}
              disabled={!hasChanges || updateSettings.isPending}
              className="gap-2"
            >
              {updateSettings.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {t("admin.commission_save")}
            </Button>
          </div>
          <p className="text-xs text-gray-400">
            {t("admin.commission_example")} {commissionValue ? `$${(1000 * parseFloat(commissionValue || "0") / 100).toFixed(2)}` : "$0.00"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: bookings } = useAllBookings();
  const { t } = useI18n();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: adminCheck, isLoading: adminCheckLoading } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/admin/check"],
  });

  const handleLogout = async () => {
    await fetch("/api/admin/logout", {
      method: "POST",
      credentials: "include",
    });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/check"] });
    setLocation("/");
  };

  useEffect(() => {
    if (!adminCheckLoading && !adminCheck?.isAdmin) {
      setLocation("/");
    }
  }, [adminCheck, adminCheckLoading, setLocation]);

  if (adminCheckLoading || statsLoading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;
  }

  if (!adminCheck?.isAdmin) {
    return null;
  }

  const statCards = [
    { title: t("admin.total_revenue"), value: `$${(stats?.totalRevenue ?? 0).toLocaleString()}`, icon: DollarSign, color: "text-emerald-500" },
    { title: t("admin.commissions"), value: `$${(stats?.totalCommission ?? 0).toLocaleString()}`, icon: TrendingUp, color: "text-blue-500" },
    { title: t("admin.total_bookings"), value: stats?.totalBookings ?? 0, icon: Plane, color: "text-teal-500" },
    { title: t("admin.recent_searches"), value: stats?.recentSearches ?? 0, icon: Users, color: "text-orange-500" },
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold font-display text-gray-900" data-testid="text-admin-title">{t("admin.dashboard")}</h1>
            <p className="text-gray-500">{t("admin.welcome")}. {t("admin.happening")}</p>
          </div>
          <Button
            data-testid="button-admin-logout"
            variant="outline"
            onClick={handleLogout}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            {t("admin.logout")}
          </Button>
        </div>

        <TestModeControl />
        <CommissionControl />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, i) => (
            <Card key={i} className="bg-white border border-gray-200 shadow-sm hover-elevate transition-colors">
              <CardContent className="p-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">{stat.title}</p>
                  <h3 className="text-2xl font-bold text-gray-900" data-testid={`text-stat-${i}`}>{stat.value}</h3>
                </div>
                <div className={`h-12 w-12 rounded-xl border flex items-center justify-center shadow-inner ${stat.color} bg-gray-50 border-gray-200`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900">{t("admin.revenue_overview")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.08)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'rgba(0,0,0,0.45)'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: 'rgba(0,0,0,0.45)'}} tickFormatter={(value) => `$${value}`} />
                    <Tooltip 
                      cursor={{fill: 'rgba(0,0,0,0.03)'}}
                      contentStyle={{borderRadius: '12px', border: '1px solid #e5e7eb', background: '#ffffff', color: '#111827', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                    />
                    <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-gray-900">{t("admin.recent_bookings")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bookings?.slice(0, 5).map((booking: any) => (
                  <div key={booking.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 hover-elevate transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 border border-blue-100 shadow-inner">
                        <Plane className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-gray-900">{booking.contactEmail}</p>
                        <p className="text-xs text-gray-500">ID: {booking.id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-gray-900">${booking.totalPrice}</p>
                      <span className="text-[10px] uppercase font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                        {booking.status}
                      </span>
                    </div>
                  </div>
                ))}
                {!bookings?.length && <p className="text-gray-400 text-sm text-center py-4">{t("admin.no_bookings")}</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
