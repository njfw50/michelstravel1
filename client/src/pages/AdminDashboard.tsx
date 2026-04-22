import { useAdminStats, useAllBookings, useSiteSettings, useUpdateSettings } from "@/hooks/use-admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Line, ComposedChart } from 'recharts';
import { Loader2, DollarSign, Users, Plane, TrendingUp, ShieldCheck, ShieldAlert, ToggleLeft, ToggleRight, Percent, Save, LogOut, MessageSquare, AlertTriangle, CheckCircle2, XCircle, Lock, Phone, Smartphone, Megaphone, Plus, Trash2, ExternalLink, Copy, Search, RefreshCw, ChevronDown, ChevronUp, Calendar, MapPin, ArrowRightLeft, LayoutDashboard, Settings, BookOpen, Activity } from "lucide-react";
import { VoiceEscalations } from "@/components/VoiceEscalations";
import { AutoFitText } from "@/components/ui/auto-fit-text";
import { DocumentScannerForm } from "@/components/document/DocumentScannerForm";
import { AdminCommandCenter } from "@/components/AdminCommandCenter";
import { SeniorCareDesk } from "@/components/SeniorCareDesk";
import { useI18n } from "@/lib/i18n";
import { AdminKnowledgeHub } from "@/components/AdminKnowledgeHub";
import { AdminCustomerInsights } from "@/components/AdminCustomerInsights";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import React, { useState, useEffect, Fragment } from "react";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { format, parseISO } from "date-fns";
import type { FeaturedDeal } from "@shared/schema";
import type { AppReleaseManifest } from "@shared/mobile-release";

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
      <Card className={`glass-card overflow-hidden border-white/5 transition-all duration-500 relative group`}>
        {/* Ambient status background glow */}
        <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] pointer-events-none -mr-16 -mt-16 transition-colors duration-700 ${currentTestMode ? 'bg-indigo-500/20' : 'bg-emerald-500/20'}`} />
        
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-6 relative z-10 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className={`h-14 w-14 rounded-2xl border flex items-center justify-center shadow-2xl transition-all duration-500 ${
              currentTestMode 
                ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30 shadow-indigo-500/10' 
                : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30 shadow-emerald-500/10'
            }`}>
              {currentTestMode ? (
                <ShieldCheck className="h-7 w-7" />
              ) : (
                <ShieldAlert className="h-7 w-7" />
              )}
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-white font-display tracking-tight">{t("admin.test_mode")}</CardTitle>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400 mt-1">{t("admin.test_mode_desc")}</p>
            </div>
          </div>
          <Badge
            data-testid="badge-test-mode-status"
            className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border transition-all duration-500 ${
              currentTestMode 
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
            }`}
          >
            {currentTestMode ? t("admin.test_mode_enabled") : t("admin.test_mode_disabled")}
          </Badge>
        </CardHeader>

        <CardContent className="p-8 space-y-8 relative z-10">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all group/item">
              <div className="flex items-center gap-3">
                <div className={`h-2 w-2 rounded-full shadow-[0_0_8px_currentColor] ${tokenActive ? 'bg-amber-400 text-amber-400' : 'bg-emerald-400 text-emerald-400'}`} />
                <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Duffel (Flights)</span>
              </div>
              <Badge className={`text-[10px] font-black uppercase tracking-tighter ${
                tokenActive ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              }`}>
                {tokenActive ? 'Sandbox' : 'Production'}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all group/item">
              <div className="flex items-center gap-3">
                <div className={`h-2 w-2 rounded-full shadow-[0_0_8px_currentColor] ${currentTestMode ? 'bg-amber-400 text-amber-400' : 'bg-emerald-400 text-emerald-400'}`} />
                <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Stripe (Payments)</span>
              </div>
              <Badge className={`text-[10px] font-black uppercase tracking-tighter ${
                currentTestMode ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              }`}>
                {currentTestMode ? 'Sandbox' : 'Production'}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-6 p-4 rounded-2xl bg-slate-900/50 border border-white/5">
             <div className="flex items-center gap-2">
               <div className={`h-2 w-2 rounded-full ${testTokenReady ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]'}`} />
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Duffel Test: {testTokenReady ? 'Ready' : 'Not Configured'}</span>
             </div>
             <div className="flex items-center gap-2">
               <div className={`h-2 w-2 rounded-full ${liveTokenReady ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]'}`} />
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Duffel Live: {liveTokenReady ? 'Ready' : 'Not Configured'}</span>
             </div>
          </div>

          {!liveTokenReady && !currentTestMode && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex gap-3 items-start animate-pulse">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <p>{t("admin.test_mode_warning")}</p>
            </div>
          )}

          <div className="flex items-center justify-between flex-wrap gap-4 pt-4 border-t border-white/5">
            <p className={`text-xs font-bold uppercase tracking-widest ${currentTestMode ? 'text-indigo-400' : 'text-emerald-400'}`}>
              {currentTestMode ? t("admin.test_mode_safe") : t("admin.test_mode_live")}
            </p>
            <Button
              data-testid="button-toggle-test-mode"
              onClick={() => handleToggleClick(!currentTestMode)}
              disabled={toggleMutation.isPending}
              className={`gap-2.5 px-8 py-6 rounded-2xl font-bold transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-xl ${
                currentTestMode 
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-500/20' 
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-500/20'
              }`}
            >
              {toggleMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : currentTestMode ? (
                <ToggleRight className="h-5 w-5" />
              ) : (
                <ToggleLeft className="h-5 w-5" />
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
    <Card className="glass-card border-white/5 relative group overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 blur-[40px] -mr-12 -mt-12" />
      
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-6 border-b border-white/5 relative z-10">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl border border-teal-500/20 bg-teal-500/10 flex items-center justify-center text-teal-400 shadow-lg shadow-teal-500/5">
            <Percent className="h-7 w-7" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-white font-display tracking-tight">{t("admin.commission_title")}</CardTitle>
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400 mt-1">{t("admin.commission_desc")}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-8 pt-6 space-y-6 relative z-10">
        <div className="flex flex-col gap-4 p-6 rounded-2xl bg-white/5 border border-white/5 group-hover:border-white/10 transition-all duration-500">
          <Label htmlFor="commission-rate" className="text-xs font-bold text-slate-300 uppercase tracking-widest">
            {t("admin.commission_label")}
          </Label>
          <div className="flex items-center gap-4">
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
                className="bg-slate-950/50 border-white/10 text-white font-bold h-14 rounded-2xl focus:ring-indigo-500/50 text-lg px-6"
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xl">%</span>
            </div>
            <Button
              data-testid="button-save-commission"
              onClick={handleSave}
              disabled={!hasChanges || updateSettings.isPending}
              className={`h-14 px-8 rounded-2xl font-bold gap-3 transition-all duration-500 transform hover:scale-[1.02] active:scale-[0.98] ${
                hasChanges 
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-xl shadow-indigo-500/20' 
                  : 'bg-white/5 text-slate-500'
              }`}
            >
              {updateSettings.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Save className="h-5 w-5" />
              )}
              {t("admin.commission_save")}
            </Button>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {t("admin.commission_example")} 
            </p>
            <span className="text-sm font-black text-teal-400">
              {commissionValue ? `$${(1000 * parseFloat(commissionValue || "0") / 100).toFixed(2)}` : "$0.00"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MobileAppChannelControl() {
  const { toast } = useToast();
  const { data: settings, isLoading } = useSiteSettings();
  const updateSettings = useUpdateSettings();

  const currentEnvironment = settings?.testMode ? "test" : "production";

  const updateChannel = async (field: "mobileAppTestEnabled" | "mobileAppProductionEnabled", value: boolean) => {
    if (!settings) return;

    try {
      await updateSettings.mutateAsync({
        siteName: settings.siteName || undefined,
        commissionPercentage: settings.commissionPercentage || undefined,
        heroTitle: settings.heroTitle || undefined,
        heroSubtitle: settings.heroSubtitle || undefined,
        testMode: settings.testMode ?? true,
        mobileAppTestEnabled: field === "mobileAppTestEnabled" ? value : settings.mobileAppTestEnabled ?? true,
        mobileAppProductionEnabled: field === "mobileAppProductionEnabled" ? value : settings.mobileAppProductionEnabled ?? true,
      });

      toast({
        title: "App mobile atualizado",
        description: field === "mobileAppTestEnabled"
          ? `Canal de teste ${value ? "ativado" : "desativado"}.`
          : `Canal de produção ${value ? "ativado" : "desativado"}.`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar o app mobile",
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
    <Card className="glass-card border-white/5 relative group overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[50px] -mr-16 -mt-16" />
      
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-6 border-b border-white/5 relative z-10">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl border border-indigo-500/20 bg-indigo-500/10 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/5">
            <Smartphone className="h-7 w-7" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-white font-display tracking-tight">Canais do App Mobile</CardTitle>
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400 mt-1">
              Controle de ambiente compartilhado (Flights & Payments)
            </p>
          </div>
        </div>
        <Badge className={`text-[10px] uppercase font-black px-4 py-1.5 rounded-full border tracking-widest ${
          currentEnvironment === "test" 
            ? "bg-amber-500/20 text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.1)]" 
            : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
        }`}>
          Ambiente: {currentEnvironment === "test" ? "Sandbox" : "Live"}
        </Badge>
      </CardHeader>

      <CardContent className="p-8 space-y-8 relative z-10">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-[24px] border border-white/5 bg-white/5 p-6 hover:border-white/10 transition-all group/item overflow-hidden relative">
            <div className={`absolute top-0 right-0 w-16 h-16 blur-[30px] -mr-8 -mt-8 transition-colors ${ (settings?.mobileAppTestEnabled ?? true) ? 'bg-indigo-500/10' : 'bg-slate-500/10' }`} />
            <div className="flex items-center justify-between gap-4 relative z-10">
              <div>
                <p className="text-sm font-black text-white uppercase tracking-tight">App em Sandbox</p>
                <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-widest leading-relaxed">Permitir acesso quando o backend estiver em modo teste.</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                disabled={updateSettings.isPending}
                onClick={() => updateChannel("mobileAppTestEnabled", !(settings?.mobileAppTestEnabled ?? true))}
                className={`rounded-xl px-5 border transition-all font-black text-[10px] uppercase tracking-widest ${
                  (settings?.mobileAppTestEnabled ?? true) 
                    ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/30" 
                    : "bg-slate-500/10 text-slate-500 border-white/5"
                }`}
              >
                {(settings?.mobileAppTestEnabled ?? true) ? "Habilitado" : "Bloqueado"}
              </Button>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/5 bg-white/5 p-6 hover:border-white/10 transition-all group/item overflow-hidden relative">
             <div className={`absolute top-0 right-0 w-16 h-16 blur-[30px] -mr-8 -mt-8 transition-colors ${ (settings?.mobileAppProductionEnabled ?? true) ? 'bg-emerald-500/10' : 'bg-slate-500/10' }`} />
            <div className="flex items-center justify-between gap-4 relative z-10">
              <div>
                <p className="text-sm font-black text-white uppercase tracking-tight">App em Produção</p>
                <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase tracking-widest leading-relaxed">Permitir acesso quando o backend estiver em modo real.</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                disabled={updateSettings.isPending}
                onClick={() => updateChannel("mobileAppProductionEnabled", !(settings?.mobileAppProductionEnabled ?? true))}
                className={`rounded-xl px-5 border transition-all font-black text-[10px] uppercase tracking-widest ${
                  (settings?.mobileAppProductionEnabled ?? true) 
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
                    : "bg-slate-500/10 text-slate-500 border-white/5"
                }`}
              >
                {(settings?.mobileAppProductionEnabled ?? true) ? "Habilitado" : "Bloqueado"}
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5 text-xs font-bold text-indigo-300/80 leading-relaxed uppercase tracking-wider">
          O app consumer usa a mesma API compartilhada do site. Se este canal for desativado no ambiente atual, o app recebe bloqueio server-side e mostra indisponibilidade antes da busca.
        </div>
      </CardContent>
    </Card>
  );
}

type MobileReleaseStatusResponse = {
  channel: "senior" | "admin";
  published: AppReleaseManifest["senior"];
  artifact: {
    fileName: string;
    directDownloadUrl: string;
    version: string | null;
    packageName: string | null;
    minAndroid: string | null;
    sizeLabel: string;
    sha256: string;
    updateRequired: boolean;
  } | null;
};

type MobileReleaseVerifyResponse = MobileReleaseStatusResponse & {
  commit: {
    shortHash: string;
    fullHash: string;
    url: string;
    message: string;
    authoredAt: string | null;
  };
};

function MobileAppReleaseControl() {
  const { t } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [commitHash, setCommitHash] = useState("");
  const [verifiedRelease, setVerifiedRelease] = useState<MobileReleaseVerifyResponse | null>(null);

  const { data: manifest } = useQuery<AppReleaseManifest>({
    queryKey: ["/api/app-release"],
    queryFn: async () => {
      const res = await fetch("/api/app-release", { credentials: "include" });
      if (!res.ok) throw new Error("Falha ao carregar release pública");
      return res.json();
    },
  });

  const { data: releaseStatus, isLoading: statusLoading } = useQuery<MobileReleaseStatusResponse>({
    queryKey: ["/api/admin/mobile-release/status", "senior"],
    queryFn: async () => {
      const res = await fetch("/api/admin/mobile-release/status?channel=senior", { credentials: "include" });
      if (!res.ok) throw new Error("Falha ao carregar status do app mobile");
      return res.json();
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (hash: string) => {
      const res = await fetch(`/api/admin/mobile-release/verify?channel=senior&commit=${encodeURIComponent(hash)}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Nao foi possivel validar o commit");
      return data as MobileReleaseVerifyResponse;
    },
    onSuccess: (data) => {
      setVerifiedRelease(data);
      toast({
        title: "Commit verificado",
        description: `${data.commit.shortHash} pronto para publicar o APK atual.`,
      });
    },
    onError: (error: Error) => {
      setVerifiedRelease(null);
      toast({
        title: "Falha ao validar commit",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (hash: string) => {
      const res = await fetch("/api/admin/mobile-release/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ channel: "senior", commitHash: hash }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Nao foi possivel publicar o app");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/app-release"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/mobile-release/status", "senior"] });
      setVerifiedRelease(null);
      toast({
        title: "App publicado",
        description: "O botao do site e a checagem de atualizacao agora apontam para o APK atual.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Falha ao publicar app",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const published = manifest?.senior.android ?? releaseStatus?.published.android;
  const publishedUrl = published?.directDownloadUrl || manifest?.senior.installPagePath || "/apps/michels-travel";

  return (
    <Card className="glass-card border-white/5 overflow-hidden group relative">
       <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[50px] -mr-16 -mt-16" />
       
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-6 border-b border-white/5 relative z-10">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl border border-indigo-500/20 bg-indigo-500/10 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/5">
            <Smartphone className="h-7 w-7" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-white font-display tracking-tight">Deployment & Releases Mobile</CardTitle>
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400 mt-1">
              Publicação direta de artefatos APK via GitHub Manifest
            </p>
          </div>
        </div>
        <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/40 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full">
          Auto-Update Engine
        </Badge>
      </CardHeader>

      <CardContent className="p-8 space-y-8 relative z-10">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-[24px] border border-white/5 bg-white/5 p-6 space-y-4 hover:border-white/10 transition-all">
            <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400 font-black">Build em Produção</p>
            <div>
              <p className="text-xl font-black text-white">
                v{published?.version || "0.0.0"}
              </p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 opacity-60 break-all">{published?.packageName || t("common.waiting")}</p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Commit: {published?.commitHash?.slice(0,7) || "---"}</span>
              <a href={publishedUrl} target="_blank" rel="noreferrer" className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2 hover:text-indigo-300 transition-colors">
                Public URL <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/5 bg-white/5 p-6 space-y-4 hover:border-white/10 transition-all">
            <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400 font-black">Artefato Detectado</p>
            {statusLoading ? (
              <div className="flex items-center gap-3">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Lendo pipeline...</p>
              </div>
            ) : releaseStatus?.artifact ? (
              <>
                <div>
                   <p className="text-xl font-black text-white">
                    v{releaseStatus.artifact.version || "?.?.?"} · {releaseStatus.artifact.sizeLabel}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 opacity-60 break-all">{releaseStatus.artifact.packageName || "N/A"}</p>
                </div>
                <p className="text-[10px] text-slate-500 font-bold break-all opacity-40">SHA256: {releaseStatus.artifact.sha256.slice(0,32)}...</p>
              </>
            ) : (
              <p className="text-xs text-rose-400 font-black uppercase tracking-widest">APK não encontrado no deploy atual.</p>
            )}
          </div>
        </div>

        <div className="rounded-[32px] border border-white/5 bg-slate-950/40 p-8 space-y-6">
          <div className="space-y-3">
            <Label htmlFor="mobile-release-commit" className="text-[10px] font-black text-slate-300 uppercase tracking-[0.25em] ml-2">Commit Hash de Referência</Label>
            <div className="flex flex-col gap-4 lg:flex-row">
              <Input
                id="mobile-release-commit"
                data-testid="input-mobile-release-commit"
                placeholder="ex.: fd247ea"
                value={commitHash}
                onChange={(event) => setCommitHash(event.target.value.trim())}
                className="bg-slate-900/50 border-white/10 text-white font-mono h-14 rounded-2xl px-6 lg:w-48"
              />
              <div className="flex gap-4 flex-1">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => verifyMutation.mutate(commitHash)}
                  disabled={commitHash.length < 7 || verifyMutation.isPending}
                  className="h-14 flex-1 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-white/5 hover:bg-white/5 hover:border-white/20 gap-3"
                >
                  {verifyMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                  Verificar GitHub
                </Button>
                <Button
                  type="button"
                  onClick={() => publishMutation.mutate(commitHash)}
                  disabled={commitHash.length < 7 || publishMutation.isPending || !releaseStatus?.artifact}
                  className="h-14 flex-1 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-xl shadow-indigo-500/20 gap-3 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {publishMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
                  Publicar Release
                </Button>
              </div>
            </div>
          </div>

          {verifiedRelease ? (
            <div className="rounded-[24px] border border-emerald-500/20 bg-emerald-500/5 p-6 space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <p className="text-sm font-black text-white uppercase tracking-tight">{verifiedRelease.commit.shortHash} · {verifiedRelease.commit.message}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">APK Integrado: <span className="text-emerald-400">{verifiedRelease.artifact?.version || "detectado"}</span></p>
                <a href={verifiedRelease.commit.url} target="_blank" rel="noreferrer" className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                  View Source <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          ) : (
            <p className="text-[10px] text-slate-500 font-bold text-center uppercase tracking-[0.2em] px-10">
              A publicação sincroniza o manifesto público. O app instalado recebe o aviso de atualização automaticamente baseando-se no commit hash informado.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function FeaturedDealsManager() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingDeal, setEditingDeal] = useState<FeaturedDeal | null>(null);
  const [form, setForm] = useState({
    origin: '', originCity: '', destination: '', destinationCity: '',
    departureDate: '', returnDate: '', price: '', currency: 'USD',
    airline: '', cabinClass: 'economy', headline: '', description: '', 
    imageUrl: '', isActive: true,
  });

  const { data: deals, isLoading } = useQuery<FeaturedDeal[]>({
    queryKey: ['/api/admin/featured-deals'],
  });

  const zapierUrl = `${window.location.origin}/api/public/flight-deals`;

  const onMutationError = (error: Error) => {
    toast({ title: 'Erro', description: error.message, variant: 'destructive' });
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/admin/featured-deals', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/admin/featured-deals'] });
      toast({ title: 'Oferta criada com sucesso' });
      resetForm();
    },
    onError: onMutationError,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest('PATCH', `/api/admin/featured-deals/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/admin/featured-deals'] });
      toast({ title: 'Oferta atualizada' });
      resetForm();
    },
    onError: onMutationError,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/admin/featured-deals/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/admin/featured-deals'] });
      toast({ title: 'Oferta removida' });
    },
    onError: onMutationError,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiRequest('PATCH', `/api/admin/featured-deals/${id}`, { isActive }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/admin/featured-deals'] });
    },
    onError: onMutationError,
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingDeal(null);
    setForm({
      origin: '', originCity: '', destination: '', destinationCity: '',
      departureDate: '', returnDate: '', price: '', currency: 'USD',
      airline: '', cabinClass: 'economy', headline: '', description: '', imageUrl: '', isActive: true,
    });
  };

  const startEdit = (deal: FeaturedDeal) => {
    setEditingDeal(deal);
    setForm({
      origin: deal.origin, originCity: deal.originCity || '', destination: deal.destination,
      destinationCity: deal.destinationCity || '', departureDate: deal.departureDate || '',
      returnDate: deal.returnDate || '', price: deal.price || '', currency: deal.currency || 'USD',
      airline: deal.airline || '', cabinClass: deal.cabinClass || 'economy',
      headline: deal.headline || '', description: deal.description || '', imageUrl: deal.imageUrl || '', isActive: deal.isActive ?? true,
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.origin || !form.destination) {
      toast({ title: 'Preencha origem e destino', variant: 'destructive' });
      return;
    }
    if (editingDeal) {
      updateMutation.mutate({ id: editingDeal.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(zapierUrl);
    toast({ title: 'URL copiada!' });
  };

  return (
    <Card className="glass-card border-white/5 relative group overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-[50px] -mr-16 -mt-16" />
      
      <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap pb-6 border-b border-white/5 relative z-10">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shadow-lg shadow-purple-500/5 transition-transform group-hover:scale-105 duration-500">
            <Megaphone className="h-7 w-7 text-purple-400" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-white font-display tracking-tight">Ofertas em Destaque (Publicidade)</CardTitle>
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 mt-1">Sincronização com Canais Externos & Facebook Ads</p>
          </div>
        </div>
        <Button
          data-testid="button-add-deal"
          onClick={() => { resetForm(); setShowForm(true); }}
          className="gap-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-xl shadow-purple-500/20 rounded-2xl px-6 py-6 font-bold transition-all transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="h-4.5 w-4.5" />
          Nova Campanha
        </Button>
      </CardHeader>

      <CardContent className="p-8 space-y-8 relative z-10">
        <div className="flex items-center gap-4 p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 group-hover:border-indigo-500/40 transition-all duration-500">
          <ExternalLink className="h-5 w-5 text-indigo-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-[0.25em] font-black text-slate-500 mb-1">Ponto de Endereço Webhook (Zapier)</p>
            <code className="text-xs text-indigo-300 font-mono break-all font-bold" data-testid="text-zapier-url">{zapierUrl}</code>
          </div>
          <Button size="icon" variant="ghost" onClick={copyUrl} className="h-10 w-10 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all" data-testid="button-copy-zapier-url">
            <Copy className="h-4 w-4" />
          </Button>
        </div>

        {showForm && (
          <div className="p-8 rounded-[32px] border border-white/10 bg-slate-950/40 space-y-8 animate-in fade-in slide-in-from-top-6 duration-700">
            <div className="flex items-center justify-between border-b border-white/5 pb-6">
              <h4 className="text-lg font-bold text-white font-display tracking-tight uppercase tracking-widest text-xs">
                {editingDeal ? 'Configurar Edição' : 'Novos Parâmetros de Oferta'}
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Origem (IATA)', id: 'input-deal-origin', val: form.origin, key: 'origin', placeholder: 'GRU' },
                { label: 'Cidade Origem', id: 'input-deal-origin-city', val: form.originCity, key: 'originCity', placeholder: 'São Paulo' },
                { label: 'Destino (IATA)', id: 'input-deal-destination', val: form.destination, key: 'destination', placeholder: 'LIS' },
                { label: 'Cidade Destino', id: 'input-deal-dest-city', val: form.destinationCity, key: 'destinationCity', placeholder: 'Lisboa' }
              ].map(field => (
                <div key={field.key} className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{field.label}</Label>
                  <Input 
                    data-testid={field.id} 
                    placeholder={field.placeholder} 
                    value={field.val}
                    onChange={e => setForm(f => ({ ...f, [field.key]: field.key.includes('origin') || field.key.includes('destination') ? e.target.value.toUpperCase() : e.target.value }))}
                    className="bg-slate-900/50 border-white/10 text-white font-bold h-12 rounded-xl focus:ring-indigo-500/50"
                  />
                </div>
              ))}

              {[
                { label: 'Data Ida', id: 'input-deal-departure', val: form.departureDate, key: 'departureDate', type: 'date' },
                { label: 'Data Volta', id: 'input-deal-return', val: form.returnDate, key: 'returnDate', type: 'date' },
                { label: 'Preço', id: 'input-deal-price', val: form.price, key: 'price', type: 'number', placeholder: '599.99' },
                { label: 'Moeda', id: 'input-deal-currency', val: form.currency, key: 'currency', placeholder: 'USD' }
              ].map(field => (
                <div key={field.key} className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{field.label}</Label>
                  <Input 
                    data-testid={field.id} 
                    type={field.type || 'text'}
                    placeholder={field.placeholder}
                    value={field.val}
                    onChange={e => setForm(f => ({ ...f, [field.key]: field.key === 'currency' ? e.target.value.toUpperCase() : e.target.value }))}
                    className="bg-slate-900/50 border-white/10 text-white font-bold h-12 rounded-xl focus:ring-indigo-500/50"
                  />
                </div>
              ))}

               <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Companhia Aérea</Label>
                <Input data-testid="input-deal-airline" placeholder="LATAM" value={form.airline}
                  className="bg-slate-900/50 border-white/10 text-white font-bold h-12 rounded-xl focus:ring-indigo-500/50"
                  onChange={e => setForm(f => ({ ...f, airline: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Classe</Label>
                <Input data-testid="input-deal-cabin" placeholder="Economy" value={form.cabinClass}
                  className="bg-slate-900/50 border-white/10 text-white font-bold h-12 rounded-xl focus:ring-indigo-500/50"
                  onChange={e => setForm(f => ({ ...f, cabinClass: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Título (Headline de Alta Conversão)</Label>
                <Input data-testid="input-deal-headline" placeholder="Ex: Voos para Lisboa a partir de $599!"
                  className="bg-slate-900/50 border-white/10 text-white font-bold h-14 rounded-2xl focus:ring-indigo-500/50 lg:text-lg"
                  value={form.headline} onChange={e => setForm(f => ({ ...f, headline: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">URL da Imagem (Opcional)</Label>
                <Input data-testid="input-deal-image" placeholder="https://exemplo.com/foto.jpg"
                  className="bg-slate-900/50 border-white/10 text-white font-bold h-14 rounded-2xl focus:ring-indigo-500/50"
                  value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Descrição Comercial</Label>
              <Textarea data-testid="input-deal-description" placeholder="Ex: Reserve agora os melhores voos para sua próxima aventura..."
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="bg-slate-900/50 border-white/10 text-white font-medium min-h-[56px] rounded-2xl focus:ring-indigo-500/50 resize-none" rows={1} />
            </div>

            <div className="flex gap-4 pt-4 border-t border-white/5">
              <Button data-testid="button-save-deal" onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending} 
                className="gap-3 bg-indigo-600 hover:bg-indigo-500 text-white px-8 h-12 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20">
                {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                {editingDeal ? 'Atualizar Oferta' : 'Lançar Oferta'}
              </Button>
              <Button data-testid="button-cancel-deal" variant="ghost" onClick={resetForm} className="h-12 px-8 rounded-xl font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-indigo-400" /></div>
        ) : !deals?.length ? (
          <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[40px] group-hover:border-white/10 transition-colors">
            <Megaphone className="h-12 w-12 text-slate-700 mb-4 opacity-50" />
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Nenhuma oferta estratégica registrada</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {deals.map(deal => (
              <div key={deal.id} className="flex items-center justify-between gap-4 p-5 rounded-[24px] bg-white/5 border border-white/5 hover:border-white/15 transition-all group/deal relative overflow-hidden">
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${deal.isActive ? 'bg-indigo-500' : 'bg-slate-700'}`} />
                <div className="flex-1 min-w-0 flex items-center gap-6">
                  <div className={`h-12 w-12 rounded-xl border flex items-center justify-center shrink-0 ${deal.isActive ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400' : 'border-slate-700 bg-slate-800/40 text-slate-500'}`}>
                    <Plane className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-black text-white font-display tracking-tight text-lg">
                        {deal.originCity || deal.origin} <ArrowRightLeft className="h-3 w-3 inline mx-1 text-slate-500" /> {deal.destinationCity || deal.destination}
                      </span>
                      <Badge className={`text-[10px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full ${deal.isActive ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/20' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
                        {deal.isActive ? 'Em Campo' : 'Standby'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-indigo-400">{deal.currency} {parseFloat(deal.price || "0").toLocaleString()}</span>
                      <span className="text-slate-600">|</span>
                      <span className="text-slate-500">{deal.airline || 'Cia Independente'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="icon" variant="ghost" onClick={() => toggleMutation.mutate({ id: deal.id, isActive: !deal.isActive })}
                    className={`h-11 w-11 rounded-xl transition-all ${deal.isActive ? 'text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10' : 'text-slate-600 hover:text-slate-400'}`}>
                    {deal.isActive ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => startEdit(deal)} 
                    className="h-11 w-11 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                    <Settings className="h-5 w-5" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(deal.id)} 
                    className="h-11 w-11 rounded-xl text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-950">
      {/* Background decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute -bottom-60 -right-20 w-[600px] h-[600px] rounded-full bg-indigo-600/15 blur-[140px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-violet-600/10 blur-[100px]" />
      </div>

      {/* Glass card */}
      <div className="relative w-full max-w-sm">
        <div className="rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl shadow-black/40 p-8">
          {/* Icon */}
          <div className="flex flex-col items-center mb-8">
            <div className="h-16 w-16 rounded-2xl bg-blue-500/10 border border-blue-400/20 backdrop-blur-sm flex items-center justify-center mb-5 shadow-inner">
              <ShieldCheck className="h-8 w-8 text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Acesso Administrativo</h1>
            <p className="text-sm text-white/50 mt-1.5 text-center">
              Painel exclusivo — Michels Travel
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="admin-password"
                className="block text-xs font-semibold uppercase tracking-widest text-white/50"
              >
                Senha de Acesso
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                <input
                  id="admin-password"
                  data-testid="input-admin-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/8 border border-white/10 text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all text-sm backdrop-blur-sm"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                />
              </div>
            </div>

            {error && (
              <div
                className="p-3 rounded-xl bg-red-500/10 border border-red-400/20 text-red-300 text-sm flex items-center gap-2"
                data-testid="text-login-error"
              >
                <ShieldAlert className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              data-testid="button-admin-login"
              type="submit"
              disabled={isLoading || !password}
              className="w-full flex items-center justify-center gap-2.5 py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30 hover:-translate-y-0.5 active:translate-y-0"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              Entrar no Painel
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-white/25">
            Michels Travel · Área Restrita
          </p>
        </div>
      </div>
    </div>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'confirmed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
    case 'failed': return 'bg-red-100 text-red-700 border-red-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

function getTicketStatusColor(status: string) {
  switch (status) {
    case 'issued': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'schedule_changed': return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
    case 'failed': return 'bg-red-100 text-red-700 border-red-200';
    case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

function getStatusDotColor(status: string) {
  switch (status) {
    case 'confirmed': return 'bg-emerald-400';
    case 'pending': return 'bg-yellow-400';
    case 'cancelled': return 'bg-red-400';
    case 'failed': return 'bg-red-400';
    default: return 'bg-gray-400';
  }
}

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: bookings } = useAllBookings();
  const { t } = useI18n();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const qc = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"command" | "overview" | "bookings" | "settings" | "senior" | "crm" | "kb">("command");

  const { data: adminCheck, isLoading: adminCheckLoading } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/admin/check"],
  });

  const syncMutation = useMutation({
    mutationFn: async (bookingId: number) => {
      const res = await apiRequest('POST', `/api/bookings/${bookingId}/sync`);
      return res.json();
    },
    onSuccess: (data, bookingId) => {
      qc.invalidateQueries({ queryKey: ['/api/admin/bookings'] });
      toast({
        title: "Sincronizado",
        description: data.synced ? `Reserva #${bookingId} sincronizada com sucesso` : `Reserva #${bookingId} - sem alteracoes`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao sincronizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogout = async () => {
    await fetch("/api/admin/logout", {
      method: "POST",
      credentials: "include",
    });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/check"] });
  };

  const openBookingsView = (options?: { status?: string; search?: string; bookingId?: string }) => {
    setActiveTab("bookings");
    setStatusFilter(options?.status ?? "all");
    setSearchQuery(options?.search ?? "");
    setExpandedBookingId(options?.bookingId ?? null);
  };

  const openSettingsView = () => {
    setActiveTab("settings");
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

  const filteredBookings = (bookings || []).filter((booking: any) => {
    const matchesSearch = searchQuery === "" || 
      booking.contactEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.referenceCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(booking.id).includes(searchQuery);
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const chartData = (stats as any)?.dailyRevenue?.map((d: any) => ({
    date: d.date,
    revenue: d.revenue,
    commission: d.commission,
    bookings: d.bookings,
  })) || [];

  const statusBreakdown = (stats as any)?.statusBreakdown || {};
  const topRoutes = (stats as any)?.topRoutes || [];
  const activeTitle =
    activeTab === "command"
      ? "Painel Concierge Automático"
      : activeTab === "senior"
        ? "Suporte de Elite para a Melhor Idade"
        : activeTab === "overview"
          ? "Visão Global Executiva"
          : activeTab === "crm"
            ? "Inteligência de Clientes & Financeiro"
            : activeTab === "kb"
              ? "Central de Conhecimento (Treinar Mia)"
              : activeTab === "bookings"
                ? "Controle de Viagens Premium"
                : "Configurações Operacionais da Agência";

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 font-sans selection:bg-indigo-500/30">
      {/* Sidebar Area - Floating Glass Panel */}
      <aside className="hidden md:flex w-64 lg:w-72 flex-col bg-slate-900/40 backdrop-blur-xl border-r border-white/5 z-20">
        <div className="p-8 border-b border-white/5 flex flex-col items-start relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="h-12 w-12 bg-indigo-500/20 rounded-2xl border border-indigo-500/30 flex items-center justify-center mb-5 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
            <LayoutDashboard className="h-6 w-6 text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight font-display">Michels Concierge</h2>
          <p className="text-[10px] text-indigo-300/60 tracking-[0.3em] uppercase font-bold mt-1.5 flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-indigo-500 animate-pulse" />
            Painel Executivo
          </p>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-8 px-4 space-y-2 custom-scrollbar">
          <Button 
            variant="ghost" 
            className={`w-full justify-start gap-3.5 rounded-2xl transition-all duration-300 group px-4 py-6 ${activeTab === "command" ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 shadow-[0_0_25px_rgba(99,102,241,0.1)]" : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"}`} 
            onClick={() => setActiveTab("command")}
          >
            <ShieldCheck className={`h-4.5 w-4.5 transition-transform duration-300 ${activeTab === "command" ? "scale-110 text-indigo-400" : "group-hover:translate-x-1"}`} />
            <span className="font-semibold text-sm tracking-wide">Painel Concierge</span>
          </Button>

          <Button 
            variant="ghost" 
            className={`w-full justify-start gap-3.5 rounded-2xl transition-all duration-300 group px-4 py-6 ${activeTab === "senior" ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 shadow-[0_0_25px_rgba(99,102,241,0.1)]" : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"}`} 
            onClick={() => setActiveTab("senior")}
          >
            <Phone className={`h-4.5 w-4.5 transition-transform duration-300 ${activeTab === "senior" ? "scale-110 text-indigo-400" : "group-hover:translate-x-1"}`} />
            <span className="font-semibold text-sm tracking-wide">Monitoramento Sênior</span>
          </Button>

          <Button 
            variant="ghost" 
            className={`w-full justify-start gap-3.5 rounded-2xl transition-all duration-300 group px-4 py-6 ${activeTab === "overview" ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 shadow-[0_0_25px_rgba(99,102,241,0.1)]" : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"}`} 
            onClick={() => setActiveTab("overview")}
          >
            <TrendingUp className={`h-4.5 w-4.5 transition-transform duration-300 ${activeTab === "overview" ? "scale-110 text-indigo-400" : "group-hover:translate-x-1"}`} />
            <span className="font-semibold text-sm tracking-wide">Inteligência Estratégica</span>
          </Button>

          <Button 
            variant="ghost" 
            className={`w-full justify-start gap-3.5 rounded-2xl transition-all duration-300 group px-4 py-6 ${activeTab === "bookings" ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 shadow-[0_0_25px_rgba(99,102,241,0.1)]" : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"}`} 
            onClick={() => setActiveTab("bookings")}
          >
            <Plane className={`h-4.5 w-4.5 transition-transform duration-300 ${activeTab === "bookings" ? "scale-110 text-indigo-400" : "group-hover:translate-x-1"}`} />
            <span className="font-semibold text-sm tracking-wide">Jornadas sob Curadoria</span>
          </Button>

          <Button 
            variant="ghost" 
            className={`w-full justify-start gap-3.5 rounded-2xl transition-all duration-300 group px-4 py-6 ${activeTab === "crm" ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 shadow-[0_0_25px_rgba(99,102,241,0.1)]" : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"}`} 
            onClick={() => setActiveTab("crm")}
          >
            <Users className={`h-4.5 w-4.5 transition-transform duration-300 ${activeTab === "crm" ? "scale-110 text-indigo-400" : "group-hover:translate-x-1"}`} />
            <span className="font-semibold text-sm tracking-wide">Clientes & CRM</span>
          </Button>

          <Button 
            variant="ghost" 
            className={`w-full justify-start gap-3.5 rounded-2xl transition-all duration-300 group px-4 py-6 ${activeTab === "kb" ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 shadow-[0_0_25px_rgba(99,102,241,0.1)]" : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"}`} 
            onClick={() => setActiveTab("kb")}
          >
            <BookOpen className={`h-4.5 w-4.5 transition-transform duration-300 ${activeTab === "kb" ? "scale-110 text-indigo-400" : "group-hover:translate-x-1"}`} />
            <span className="font-semibold text-sm tracking-wide">Treinamento (IA)</span>
          </Button>

          <Button 
            variant="ghost" 
            className={`w-full justify-start gap-3.5 rounded-2xl transition-all duration-300 group px-4 py-6 ${activeTab === "settings" ? "bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 shadow-[0_0_25px_rgba(99,102,241,0.1)]" : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"}`} 
            onClick={() => setActiveTab("settings")}
          >
            <Settings className={`h-4.5 w-4.5 transition-transform duration-300 ${activeTab === "settings" ? "scale-110 text-indigo-400" : "group-hover:translate-x-1"}`} />
            <span className="font-semibold text-sm tracking-wide">Ajustes da Agência</span>
          </Button>
        </nav>
        
        <div className="p-6 border-t border-white/5">
          <Button 
            variant="ghost" 
            onClick={handleLogout} 
            className="w-full justify-start gap-3.5 rounded-2xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all px-4 py-6 font-semibold"
          >
            <LogOut className="h-4.5 w-4.5" />
            <span>Encerrar Sessão</span>
          </Button>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Background Ambient Glows */}
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />

        {/* Header - Glassmorphic Blur */}
        <header className="sticky top-0 z-10 flex h-[80px] items-center justify-between border-b border-white/5 bg-slate-900/20 px-6 backdrop-blur-xl md:px-12">
          <div className="flex min-w-0 items-center gap-4 md:hidden">
            <LayoutDashboard className="h-6 w-6 text-indigo-500" />
            <h1 className="text-xl font-bold font-display text-white tracking-tight">Concierge</h1>
          </div>
          
          <div className="hidden min-w-0 flex-1 md:flex md:max-w-[min(52vw,44rem)] md:flex-col">
            <AutoFitText
              as="h1"
              minFontSize={18}
              maxFontSize={34}
              maxLines={1}
              className="font-display font-bold tracking-tight text-white leading-tight"
            >
              {activeTitle}
            </AutoFitText>
            <p className="text-[10px] font-bold text-indigo-400/60 uppercase tracking-[0.3em] mt-1.5">
              {t("admin.welcome")}. Visão atualizada
            </p>
          </div>
          
          <div className="flex min-w-0 items-center gap-3 md:gap-5">
            <div className="group hidden items-center rounded-2xl border border-white/5 bg-white/5 px-4 py-2 transition-all focus-within:border-indigo-500/50 lg:flex lg:min-w-[13rem] lg:max-w-[16rem] xl:min-w-[16rem]">
              <Search className="h-4 w-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
              <input 
                type="text" 
                placeholder="Pesquisa rápida..." 
                className="w-full border-none bg-transparent px-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-0"
              />
            </div>

            <Button 
              data-testid="button-admin-live-chat" 
              onClick={() => setLocation("/admin/live-chat")} 
              className="gap-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-6 font-bold text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all whitespace-nowrap hover:scale-[1.02] hover:from-indigo-500 hover:to-violet-500 active:scale-[0.98] sm:px-6"
            >
              <MessageSquare className="h-4.5 w-4.5" />
              <span className="hidden sm:inline">Assistência ao Vivo</span>
            </Button>
            
            <div className="md:hidden">
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-slate-400 hover:text-white hover:bg-white/5 rounded-2xl h-11 w-11">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Scrollable Document Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 scrollbar-none">
          <div className="mx-auto w-full max-w-[1920px] animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">

            {activeTab === "command" && (
              <div className="animate-in fade-in duration-300">
                <AdminCommandCenter
                onOpenLiveDesk={(options) =>
                  setLocation(options?.sessionId ? `/admin/live-chat?session=${options.sessionId}` : "/admin/live-chat")
                }
                onOpenBookings={openBookingsView}
                onOpenSettings={openSettingsView}
              />
              </div>
            )}

            {activeTab === "senior" && (
              <div className="animate-in fade-in duration-300">
                <SeniorCareDesk />
              </div>
            )}

            {activeTab === "crm" && (
              <div className="animate-in fade-in duration-300">
                <AdminCustomerInsights />
              </div>
            )}

            {activeTab === "kb" && (
              <div className="animate-in fade-in duration-300">
                <AdminKnowledgeHub />
              </div>
            )}

            {/* Vision Tab - Strategic Intelligence */}
            {activeTab === "overview" && (
              <div className="animate-in fade-in duration-300 space-y-8">
                {/* Stats Grid - Vision Pulse */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: t("admin.total_revenue"), value: `$${((stats as any)?.totalRevenue ?? 0).toLocaleString()}`, today: `$${((stats as any)?.revenueToday ?? 0).toLocaleString()}`, icon: DollarSign, color: "emerald", accent: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", glow: "bg-emerald-500/5", tid: "text-stat-revenue" },
                    { label: t("admin.commissions"), value: `$${((stats as any)?.totalCommission ?? 0).toLocaleString()}`, today: `7d: $${((stats as any)?.revenue7Days ?? 0).toLocaleString()}`, icon: TrendingUp, color: "indigo", accent: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20", glow: "bg-indigo-500/5", tid: "text-stat-commission" },
                    { label: t("admin.total_bookings"), value: (stats as any)?.totalBookings ?? 0, today: `7d: ${(stats as any)?.bookings7Days ?? 0}`, icon: Plane, color: "cyan", accent: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", glow: "bg-cyan-500/5", tid: "text-stat-bookings" },
                    { label: "Vazão de Buscas", value: (stats as any)?.searchesToday ?? 0, today: `Live: ${(stats as any)?.recentSearches ?? 0}`, icon: Search, color: "amber", accent: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", glow: "bg-amber-500/5", tid: "text-stat-searches" }
                  ].map((stat) => (
                    <Card key={stat.label} className="glass-card border-white/5 shadow-2xl overflow-hidden group transition-all duration-500 hover:border-white/10">
                      <CardContent className="p-8 flex items-center justify-between gap-5 relative z-10">
                        <div className={`absolute top-0 right-0 w-24 h-24 ${stat.glow} blur-[40px] -mr-12 -mt-12 transition-opacity group-hover:opacity-100 opacity-50`} />
                        <div className="flex-1">
                          <p className="text-[10px] uppercase tracking-[0.25em] font-black text-slate-500 mb-4 group-hover:text-white transition-colors">{stat.label}</p>
                          <h3 className="text-4xl font-black text-white font-display tracking-tight leading-none" data-testid={stat.tid}>{stat.value}</h3>
                          <div className="mt-4 flex items-center gap-2">
                            <Badge className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${stat.bg} ${stat.accent} ${stat.border}`}>
                              {stat.today.includes('$') ? 'LIVE' : 'METRIC'}
                            </Badge>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.today}</span>
                          </div>
                        </div>
                        <div className={`h-14 w-14 rounded-2xl border ${stat.border} ${stat.bg} flex items-center justify-center ${stat.accent} shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                          <stat.icon className="h-7 w-7" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Revenue Chart - Midnight Performance */}
                  <Card className="lg:col-span-2 glass-card border-white/5 shadow-2xl overflow-hidden">
                    <CardHeader className="border-b border-white/5 pb-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <TrendingUp className="h-5 w-5 text-indigo-400" />
                          <CardTitle className="text-white font-display uppercase tracking-widest text-sm font-black">Performance de Receita & Comissões</CardTitle>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-950/40 p-1 rounded-xl border border-white/5">
                           <Button variant="ghost" size="sm" className="h-7 rounded-lg text-[10px] font-black text-indigo-400 bg-indigo-500/15 uppercase tracking-widest">30D</Button>
                           <Button variant="ghost" size="sm" className="h-7 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest">Macro</Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-10">
                      <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700}} tickFormatter={(str) => str.slice(5)} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 10}} tickFormatter={(value) => `$${value}`} />
                            <Tooltip 
                              cursor={{fill: 'rgba(255,255,255,0.03)'}}
                              contentStyle={{borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(16px)', color: '#ffffff', boxShadow: '0 20px 50px rgba(0,0,0,0.5)'}} 
                              itemStyle={{fontSize: '11px', fontWeight: 'bold'}}
                              labelStyle={{fontSize: '10px', color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.1em'}}
                            />
                            <Bar dataKey="revenue" fill="url(#revenueGradient)" radius={[6, 6, 0, 0]} name="Receita" />
                            <Line type="monotone" dataKey="commission" stroke="#818cf8" strokeWidth={3} dot={{r: 4, fill: '#818cf8', strokeWidth: 2, stroke: '#1e293b'}} activeDot={{r: 6, stroke: '#818cf8', strokeWidth: 2, fill: '#ffffff'}} name="Comissão" />
                            <defs>
                              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.1}/>
                              </linearGradient>
                            </defs>
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-8">
                    {/* Status Insights Card */}
                    <Card className="glass-card border-white/5 shadow-2xl overflow-hidden group">
                      <CardHeader className="pb-3 border-b border-white/5">
                        <CardTitle className="text-[10px] uppercase tracking-[0.25em] font-black text-slate-500 group-hover:text-cyan-400 transition-colors">Estado das Operações</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-6">
                        {Object.entries(statusBreakdown).length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-6 opacity-30">
                            <Activity className="h-8 w-8 mb-2" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-center">Monitorando Pulse...</p>
                          </div>
                        ) : (
                          Object.entries(statusBreakdown).map(([status, count]) => (
                            <div key={status} className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:border-indigo-500/20 transition-all group/stat">
                              <div className="flex items-center gap-3">
                                <div className={`h-2.5 w-2.5 rounded-full shadow-[0_0_8px_currentColor] transition-transform group-hover/stat:scale-125 ${getStatusDotColor(status)}`} />
                                <span className="text-[11px] text-slate-400 font-black uppercase tracking-widest">{status}</span>
                              </div>
                              <span className="text-sm font-black text-white" data-testid={`text-status-count-${status}`}>{count as number}</span>
                            </div>
                          ))
                        )}
                      </CardContent>
                    </Card>

                    {/* Hot Routes Card */}
                    <Card className="glass-card border-white/5 shadow-2xl overflow-hidden group">
                      <CardHeader className="pb-3 border-b border-white/5">
                        <CardTitle className="text-[10px] uppercase tracking-[0.25em] font-black text-slate-500 group-hover:text-indigo-400 transition-colors">Rotas de Elite</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-6">
                        {topRoutes.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-6 opacity-30">
                            <Plane className="h-8 w-8 mb-2" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-center">Aguardando Decolagem...</p>
                          </div>
                        ) : (
                          topRoutes.slice(0, 5).map((route: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:border-indigo-500/20 transition-all">
                              <div className="flex items-center gap-3 min-w-0">
                                <MapPin className="h-4 w-4 text-slate-500 shrink-0" />
                                <span className="text-xs font-bold text-slate-300 truncate tracking-tight">{route.route}</span>
                              </div>
                              <div className="text-right shrink-0 flex flex-col">
                                <span className="text-xs font-black text-white">{route.count}x</span>
                                <span className="text-[9px] font-bold text-indigo-400/60 uppercase tracking-tighter">${parseFloat(route.revenue).toLocaleString()}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Recent Activity Feed - Elegant Glass Table */}
                <Card className="glass-card border-white/5 shadow-2xl overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[50px] -mr-16 -mt-16 pointer-events-none" />
                  <CardHeader className="border-b border-white/5 p-8 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-white font-display uppercase tracking-widest text-sm font-black">{t("admin.recent_bookings")}</CardTitle>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Transações de Alta Prioridade</p>
                    </div>
                    <Button variant="ghost" className="rounded-xl font-bold text-[10px] uppercase tracking-widest text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/10 px-5" onClick={() => setActiveTab("bookings")}>
                      Acessar Arquivo Glogal
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="space-y-0">
                      {bookings?.slice(0, 8).map((booking: any) => {
                        const flightOrigin = (booking.flightData as any)?.origin || '';
                        const flightDest = (booking.flightData as any)?.destination || '';
                        const routeLabel = flightOrigin && flightDest ? `${flightOrigin} → ${flightDest}` : 'Curadoria Manual';
                        return (
                          <div 
                            key={booking.id} 
                            className="flex items-center justify-between gap-4 p-6 border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer" 
                            data-testid={`card-recent-booking-${booking.id}`}
                            onClick={() => openBookingsView({ bookingId: booking.id })}
                          >
                            <div className="flex items-center gap-5">
                              <div className="h-12 w-12 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-center text-slate-400 group-hover:text-indigo-400 transition-colors">
                                <Plane className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="font-black text-sm text-white opacity-90">{booking.contactEmail}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{routeLabel}</span>
                                  {booking.referenceCode && (
                                    <>
                                      <span className="text-slate-700">•</span>
                                      <span className="text-[10px] font-black text-indigo-400/60 font-mono tracking-tight uppercase">#{booking.referenceCode}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right flex flex-col items-end gap-2">
                              <p className="font-black text-base text-white font-display tracking-tight">${parseFloat(booking.totalPrice).toLocaleString()}</p>
                              <div className="flex gap-2">
                                <Badge className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-lg border ${
                                  booking.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                  booking.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                  'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                }`}>
                                  {booking.status}
                                </Badge>
                                {booking.ticketStatus && booking.ticketStatus !== 'pending' && (
                                  <Badge className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-lg border ${
                                    booking.ticketStatus === 'issued' ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' :
                                    booking.ticketStatus === 'schedule_changed' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                    'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                  }`}>
                                    {booking.ticketStatus}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {!bookings?.length && <div className="py-20 text-center opacity-30 uppercase font-black tracking-widest text-[10px]">{t("admin.no_bookings")}</div>}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Bookings Tab - Advanced Journey Control */}
            {activeTab === "bookings" && (
              <div className="animate-in fade-in duration-300 space-y-8">
                <Card className="glass-card border-white/5 overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[50px] -mr-16 -mt-16 pointer-events-none" />
                  <CardHeader className="p-8 border-b border-white/5">
                    <CardTitle className="text-xl font-bold text-white font-display tracking-tight">Gerenciamento de Reservas</CardTitle>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Arquivo Central de Operações</p>
                  </CardHeader>
                  <CardContent className="p-8 space-y-8">
                    <div className="flex flex-col lg:flex-row gap-6">
                      <div className="relative flex-1 group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                        <Input
                          data-testid="input-booking-search"
                          placeholder="Localizar por ID, Email ou Localizador..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="h-14 pl-14 bg-slate-950/40 border-white/5 text-white font-medium rounded-2xl focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-600"
                        />
                      </div>
                      <div className="flex items-center gap-3 bg-slate-950/40 p-1.5 rounded-[20px] border border-white/5">
                        {[
                          { id: "all", label: "Global" },
                          { id: "pending", label: "Pendente" },
                          { id: "confirmed", label: "Sucesso" },
                          { id: "cancelled", label: "Retido" }
                        ].map((s) => (
                          <Button
                            key={s.id}
                            variant="ghost"
                            size="sm"
                            onClick={() => setStatusFilter(s.id)}
                            className={`h-11 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                              statusFilter === s.id 
                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" 
                                : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                            }`}
                          >
                            {s.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[28px] border border-white/5 overflow-hidden bg-slate-950/20 shadow-inner">
                      <Table>
                        <TableHeader className="bg-slate-950/40 border-b border-white/5">
                          <TableRow className="border-0 hover:bg-transparent">
                            <TableHead className="w-[80px] text-[10px] h-14 uppercase tracking-widest font-black text-slate-500 px-8">REF ID</TableHead>
                            <TableHead className="text-[10px] h-14 uppercase tracking-widest font-black text-slate-500">Curadoria / Cliente</TableHead>
                            <TableHead className="text-[10px] h-14 uppercase tracking-widest font-black text-slate-500">Rota Estratégica</TableHead>
                            <TableHead className="text-right text-[10px] h-14 uppercase tracking-widest font-black text-slate-500">Investment</TableHead>
                            <TableHead className="text-[10px] h-14 uppercase tracking-widest font-black text-slate-500 text-center">Status</TableHead>
                            <TableHead className="w-[120px] text-[10px] h-14 uppercase tracking-widest font-black text-slate-500 text-right px-8">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredBookings.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-24">
                                <Activity className="h-10 w-10 text-slate-800 mx-auto mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">Nenhuma jornada detectada</p>
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredBookings.map((booking: any) => {
                              const flightOrigin = (booking.flightData as any)?.origin || '';
                              const flightDest = (booking.flightData as any)?.destination || '';
                              const routeLabel = flightOrigin && flightDest ? `${flightOrigin} → ${flightDest}` : '-';
                              const isExpanded = expandedBookingId === booking.id;

                              return (
                                <Fragment key={booking.id}>
                                  <TableRow 
                                    className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer group/row ${isExpanded ? "bg-indigo-500/[0.03]" : ""}`} 
                                    onClick={() => setExpandedBookingId(isExpanded ? null : booking.id)}
                                  >
                                    <TableCell className="px-8 font-mono text-[10px] font-black text-slate-500 uppercase tracking-tighter">#{booking.id}</TableCell>
                                    <TableCell>
                                      <div>
                                        <p className="text-sm font-bold text-white opacity-90">{booking.contactEmail}</p>
                                        <p className="text-[10px] font-medium text-slate-500 mt-0.5">{booking.contactPhone || "No terminal phone"}</p>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <Plane className="h-3.5 w-3.5 text-indigo-400/60" />
                                        <span className="text-xs font-bold text-slate-300">{routeLabel}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <p className="text-sm font-black text-white font-display tracking-tight">${parseFloat(booking.totalPrice).toLocaleString()}</p>
                                      <p className="text-[9px] font-bold text-indigo-400/40 uppercase tracking-widest mt-0.5">Fee: ${booking.commissionAmount || '0.00'}</p>
                                    </TableCell>
                                    <TableCell className="text-center">
                                       <div className="flex flex-col items-center gap-1.5">
                                          <Badge className={`text-[9px] font-black uppercase tracking-[0.15em] px-2.5 py-0.5 rounded-lg border ${
                                            booking.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.05)]' :
                                            booking.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                            'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                          }`}>
                                            {booking.status}
                                          </Badge>
                                          <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">
                                            TK: {booking.ticketStatus || 'pending'}
                                          </span>
                                       </div>
                                    </TableCell>
                                    <TableCell className="text-right px-8">
                                      <div className="flex items-center justify-end gap-2">
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            syncMutation.mutate(booking.id);
                                          }}
                                          className="h-9 w-9 rounded-xl border border-white/5 hover:bg-indigo-500/10 hover:text-indigo-400 transition-all"
                                        >
                                          <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                                        </Button>
                                        <div className={`h-9 w-9 rounded-xl border border-white/5 flex items-center justify-center transition-all ${isExpanded ? "bg-indigo-500/20 text-indigo-400" : "text-slate-500 group-hover/row:text-slate-300 grow-hover/row:border-white/20"}`}>
                                           {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                        </div>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                  {isExpanded && (
                                    <TableRow key={`${booking.id}-details`} className="bg-indigo-950/10 hover:bg-indigo-950/10 border-b border-white/5">
                                      <TableCell colSpan={6} className="p-8">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 animate-in slide-in-from-top-2 duration-500">
                                          <div className="space-y-4">
                                            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.25em] flex items-center gap-2">
                                              <MapPin className="h-3.5 w-3.5" /> Curadoria de Itinerário
                                            </h4>
                                            <div className="space-y-2 p-5 rounded-2xl bg-white/5 border border-white/5">
                                              <p className="text-xs text-slate-400 font-medium">Companhia: <span className="text-white font-bold">{(booking.flightData as any).airline || 'N/A'}</span></p>
                                              <p className="text-xs text-slate-400 font-medium">Equipamento/Voo: <span className="text-white font-bold">{(booking.flightData as any).flightNumber || 'N/A'}</span></p>
                                              <p className="text-xs text-slate-400 font-medium">Rota: <span className="text-white font-bold">{routeLabel}</span></p>
                                            </div>
                                          </div>
                                          <div className="space-y-4">
                                            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.25em] flex items-center gap-2">
                                              <Calendar className="h-3.5 w-3.5" /> Referenciamento Global
                                            </h4>
                                            <div className="space-y-2 p-5 rounded-2xl bg-white/5 border border-white/5">
                                              <p className="text-xs text-slate-400 font-medium">Locator: <span className="text-indigo-400 font-mono font-bold tracking-tight uppercase">#{booking.referenceCode || '---'}</span></p>
                                              <p className="text-[10px] text-slate-500 font-mono break-all leading-tight opacity-40">Duffel-X: {booking.duffelOrderId || 'Untracked'}</p>
                                              {booking.ticketNumber && <p className="text-xs text-slate-400 font-medium">ETKT/DOC: <span className="text-white font-mono">{booking.ticketNumber}</span></p>}
                                              <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-2">{booking.createdAt && format(parseISO(booking.createdAt), 'PPPP')}</p>
                                            </div>
                                          </div>
                                          <div className="space-y-4">
                                            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.25em] flex items-center gap-2">
                                              <Users className="h-3.5 w-3.5" /> Manifesto de Passageiros
                                            </h4>
                                            <div className="space-y-3">
                                              {Array.isArray(booking.passengerDetails) ? (
                                                (booking.passengerDetails as any[]).map((p: any, idx: number) => (
                                                  <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                                                     <div className="h-7 w-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-[10px] font-black text-indigo-400 uppercase">
                                                       {p.type?.[0]}
                                                     </div>
                                                     <p className="text-xs font-black text-white opacity-80 uppercase tracking-tight">
                                                       {p.firstName || p.given_name || ''} {p.lastName || p.family_name || ''}
                                                     </p>
                                                  </div>
                                                ))
                                              ) : (
                                                <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest text-center py-4 italic">Sem manifesto digital</p>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  )}
                                  </Fragment>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="animate-in fade-in duration-300">
                <TestModeControl />
            <MobileAppChannelControl />
            <MobileAppReleaseControl />
            <CommissionControl />
            <FeaturedDealsManager />
            <VoiceEscalations />
            <Card className="glass-card border-white/5 overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-[40px] -mr-12 -mt-12 pointer-events-none" />
              <CardHeader className="border-b border-white/5">
                <CardTitle className="flex items-center gap-3 text-white font-display tracking-tight text-lg">
                  <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  Painel de Verificação de Identidade (TSA)
                </CardTitle>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Validação de Documentos e Biometria Digital</p>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="bg-white/5 border border-white/5 p-5 rounded-2xl">
                   <p className="text-xs text-slate-400 leading-relaxed font-medium">
                    Utilize o motor de visão Mia para realizar OCR e validação de autenticidade em documentos de viagem. Esta ferramenta simula o processamento realizado no Terminal Sênior.
                  </p>
                </div>
                <DocumentScannerForm />
              </CardContent>
            </Card>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation — acessa todas as abas */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/60 backdrop-blur-2xl border-t border-white/10 flex items-center justify-around px-4 py-3 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        {[
          { id: "command", icon: ShieldCheck, label: "Painel" },
          { id: "senior", icon: Phone, label: "Sênior" },
          { id: "overview", icon: TrendingUp, label: "Visão" },
          { id: "bookings", icon: Plane, label: "Viagens" },
          { id: "settings", icon: Settings, label: "Agência" }
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all duration-300 ${
              activeTab === item.id 
                ? "text-indigo-400 bg-indigo-500/10 scale-105" 
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <item.icon className={`h-5 w-5 ${activeTab === item.id ? "drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]" : ""}`} />
            <span className={`text-[9px] font-black uppercase tracking-widest ${activeTab === item.id ? "opacity-100" : "opacity-40"}`}>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
