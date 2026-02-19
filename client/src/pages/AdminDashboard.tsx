import { useAdminStats, useAllBookings, useSiteSettings, useUpdateSettings } from "@/hooks/use-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Loader2, DollarSign, Users, Plane, TrendingUp, ShieldCheck, ShieldAlert, ToggleLeft, ToggleRight, Percent, Save, LogOut, MessageSquare, AlertTriangle, CheckCircle2, XCircle, Lock, Phone } from "lucide-react";
import { VoiceEscalations } from "@/components/VoiceEscalations";
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
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingMode, setPendingMode] = useState<boolean | null>(null);
  const [preflightData, setPreflightData] = useState<{
    ready: boolean;
    duffelReady: boolean;
    stripeReady: boolean;
    issues: string[];
    targetMode: string;
  } | null>(null);
  const [preflightLoading, setPreflightLoading] = useState(false);

  const { data: testModeData, isLoading } = useQuery<{ testMode: boolean; activeTokenIsTest: boolean; hasLiveToken: boolean; hasTestToken: boolean }>({
    queryKey: ['/api/test-mode'],
  });

  const toggleMutation = useMutation({
    mutationFn: async (newTestMode: boolean) => {
      const res = await fetch('/api/admin/test-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testMode: newTestMode, confirmed: true }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to toggle mode');
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/test-mode'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/flight-board'] });
      toast({
        title: data.testMode ? t("admin.test_mode_enabled") : t("admin.test_mode_disabled"),
        description: data.testMode ? t("admin.test_mode_safe") : t("admin.test_mode_live"),
      });
      setShowConfirmDialog(false);
      setPendingMode(null);
      setPreflightData(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setShowConfirmDialog(false);
      setPendingMode(null);
      setPreflightData(null);
    },
  });

  const handleToggleClick = async (newTestMode: boolean) => {
    setPendingMode(newTestMode);
    setPreflightLoading(true);
    setPreflightData(null);
    setShowConfirmDialog(true);

    try {
      const target = newTestMode ? 'test' : 'production';
      const res = await fetch(`/api/admin/test-mode/preflight?target=${target}`, {
        credentials: 'include',
      });
      const data = await res.json();
      setPreflightData(data);
    } catch {
      setPreflightData({
        ready: false,
        duffelReady: false,
        stripeReady: false,
        issues: ["Failed to check API status"],
        targetMode: newTestMode ? 'test' : 'production',
      });
    } finally {
      setPreflightLoading(false);
    }
  };

  const handleConfirm = () => {
    if (pendingMode !== null) {
      toggleMutation.mutate(pendingMode);
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

  const currentTestMode = testModeData?.testMode ?? true;
  const tokenActive = testModeData?.activeTokenIsTest ?? true;
  const liveTokenReady = testModeData?.hasLiveToken ?? false;
  const testTokenReady = testModeData?.hasTestToken ?? false;

  return (
    <>
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
              <span className="text-sm font-medium text-gray-700">Duffel (Flights)</span>
              <Badge
                data-testid="badge-duffel-status"
                className={`text-xs ${
                  tokenActive 
                    ? 'bg-yellow-100 text-yellow-700 border-yellow-200' 
                    : 'bg-green-100 text-green-700 border-green-200'
                }`}
              >
                {tokenActive ? 'TEST' : 'PRODUCTION'}
              </Badge>
            </div>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-700">Stripe (Payments)</span>
              <Badge
                data-testid="badge-stripe-status"
                className={`text-xs ${
                  currentTestMode 
                    ? 'bg-yellow-100 text-yellow-700 border-yellow-200' 
                    : 'bg-green-100 text-green-700 border-green-200'
                }`}
              >
                {currentTestMode ? 'TEST' : 'PRODUCTION'}
              </Badge>
            </div>
            <div className="border-t border-gray-200 pt-3 mt-1">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${testTokenReady ? 'bg-yellow-400' : 'bg-red-400'}`} />
                  <span className="text-xs text-gray-500">Duffel Test: {testTokenReady ? 'OK' : 'Missing'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${liveTokenReady ? 'bg-green-400' : 'bg-red-400'}`} />
                  <span className="text-xs text-gray-500">Duffel Live: {liveTokenReady ? 'OK' : 'Missing'}</span>
                </div>
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
              onClick={() => handleToggleClick(!currentTestMode)}
              disabled={toggleMutation.isPending}
              className="gap-2"
            >
              {toggleMutation.isPending ? (
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

      <AlertDialog open={showConfirmDialog} onOpenChange={(open) => { 
        if (!open && !toggleMutation.isPending) { 
          setShowConfirmDialog(false); 
          setPendingMode(null); 
          setPreflightData(null); 
        } 
      }}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {pendingMode === false ? (
                <>
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Switch to Production?
                </>
              ) : (
                <>
                  <ShieldCheck className="h-5 w-5 text-blue-500" />
                  Switch to Test Mode?
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  {pendingMode === false 
                    ? "This will switch BOTH Duffel (flights) and Stripe (payments) to production mode. Real charges will be processed."
                    : "This will switch BOTH Duffel (flights) and Stripe (payments) to test mode. No real charges will be processed."
                  }
                </p>

                {preflightLoading ? (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 border border-gray-200">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                    <span className="text-sm text-gray-500">Checking API status...</span>
                  </div>
                ) : preflightData ? (
                  <div className="space-y-2">
                    <div className={`flex items-center gap-2 p-2 rounded-lg ${preflightData.duffelReady ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                      {preflightData.duffelReady ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                      )}
                      <span className={`text-sm ${preflightData.duffelReady ? 'text-green-700' : 'text-red-700'}`}>
                        Duffel {preflightData.duffelReady ? 'ready' : 'not ready'}
                      </span>
                    </div>
                    <div className={`flex items-center gap-2 p-2 rounded-lg ${preflightData.stripeReady ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                      {preflightData.stripeReady ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                      )}
                      <span className={`text-sm ${preflightData.stripeReady ? 'text-green-700' : 'text-red-700'}`}>
                        Stripe {preflightData.stripeReady ? 'ready' : 'not ready'}
                      </span>
                    </div>
                    {preflightData.issues.length > 0 && (
                      <div className="p-2 rounded-lg bg-amber-50 border border-amber-200">
                        <p className="text-xs font-medium text-amber-700 mb-1">Issues found:</p>
                        {preflightData.issues.map((issue, i) => (
                          <p key={i} className="text-xs text-amber-600">- {issue}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              data-testid="button-cancel-mode-switch"
              disabled={toggleMutation.isPending}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-testid="button-confirm-mode-switch"
              onClick={handleConfirm}
              disabled={preflightLoading || toggleMutation.isPending || (preflightData ? !preflightData.ready : true)}
              className={pendingMode === false ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
            >
              {toggleMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {pendingMode === false ? 'OK, Switch to Production' : 'OK, Switch to Test'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
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

function AdminLoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/check"] });
      }
    } catch {
      setError("Connection error. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm border border-gray-200 shadow-sm">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto h-14 w-14 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
            <Lock className="h-7 w-7 text-blue-600" />
          </div>
          <CardTitle className="text-xl text-gray-900">Admin Access</CardTitle>
          <p className="text-sm text-gray-500">Enter your admin password to continue</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-password" className="text-sm text-gray-700">Password</Label>
              <Input
                id="admin-password"
                data-testid="input-admin-password"
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
            </div>
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm" data-testid="text-login-error">
                {error}
              </div>
            )}
            <Button
              data-testid="button-admin-login"
              type="submit"
              className="w-full gap-2"
              disabled={isLoading || !password}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
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
  };

  if (adminCheckLoading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;
  }

  if (!adminCheck?.isAdmin) {
    return <AdminLoginForm />;
  }

  if (statsLoading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;
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
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              data-testid="button-admin-live-chat"
              variant="default"
              onClick={() => setLocation("/admin/live-chat")}
              className="gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Atendimento ao Vivo
            </Button>
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
        </div>

        <TestModeControl />
        <CommissionControl />
        
        {/* Voice Escalations Section */}
        <VoiceEscalations />

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
