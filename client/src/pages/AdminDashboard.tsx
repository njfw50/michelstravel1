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
import { Loader2, DollarSign, Users, Plane, TrendingUp, ShieldCheck, ShieldAlert, ToggleLeft, ToggleRight, Percent, Save, LogOut, MessageSquare, AlertTriangle, CheckCircle2, XCircle, Lock, Phone, Megaphone, Plus, Trash2, ExternalLink, Copy, Search, RefreshCw, ChevronDown, ChevronUp, Calendar, MapPin, ArrowRightLeft } from "lucide-react";
import { VoiceEscalations } from "@/components/VoiceEscalations";
import { AdminCommandCenter } from "@/components/AdminCommandCenter";
import { useI18n } from "@/lib/i18n";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { format, parseISO } from "date-fns";
import type { FeaturedDeal } from "@shared/schema";

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

function FeaturedDealsManager() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingDeal, setEditingDeal] = useState<FeaturedDeal | null>(null);
  const [form, setForm] = useState({
    origin: '', originCity: '', destination: '', destinationCity: '',
    departureDate: '', returnDate: '', price: '', currency: 'USD',
    airline: '', cabinClass: 'economy', headline: '', description: '', isActive: true,
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
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiRequest('PATCH', `/api/admin/featured-deals/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/admin/featured-deals'] });
      toast({ title: 'Oferta atualizada' });
      resetForm();
    },
    onError: onMutationError,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/admin/featured-deals/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/admin/featured-deals'] });
      toast({ title: 'Oferta removida' });
    },
    onError: onMutationError,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
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
      airline: '', cabinClass: 'economy', headline: '', description: '', isActive: true,
    });
  };

  const startEdit = (deal: FeaturedDeal) => {
    setEditingDeal(deal);
    setForm({
      origin: deal.origin, originCity: deal.originCity || '', destination: deal.destination,
      destinationCity: deal.destinationCity || '', departureDate: deal.departureDate || '',
      returnDate: deal.returnDate || '', price: deal.price || '', currency: deal.currency || 'USD',
      airline: deal.airline || '', cabinClass: deal.cabinClass || 'economy',
      headline: deal.headline || '', description: deal.description || '', isActive: deal.isActive ?? true,
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
    <Card className="bg-white border border-gray-200 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center">
            <Megaphone className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <CardTitle className="text-gray-900">Ofertas em Destaque (Zapier)</CardTitle>
            <p className="text-xs text-gray-500 mt-0.5">Crie ofertas que o Zapier publica no Facebook</p>
          </div>
        </div>
        <Button
          data-testid="button-add-deal"
          size="sm"
          onClick={() => { resetForm(); setShowForm(true); }}
          className="gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          Nova Oferta
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
          <ExternalLink className="h-4 w-4 text-blue-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-blue-800">URL para o Zapier:</p>
            <code className="text-xs text-blue-600 break-all" data-testid="text-zapier-url">{zapierUrl}</code>
          </div>
          <Button size="icon" variant="ghost" onClick={copyUrl} data-testid="button-copy-zapier-url">
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>

        {showForm && (
          <div className="p-4 rounded-lg border border-gray-200 bg-gray-50 space-y-3">
            <h4 className="font-medium text-sm text-gray-900">
              {editingDeal ? 'Editar Oferta' : 'Nova Oferta'}
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Origem (IATA)</Label>
                <Input data-testid="input-deal-origin" placeholder="GRU" value={form.origin}
                  onChange={e => setForm(f => ({ ...f, origin: e.target.value.toUpperCase() }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Cidade Origem</Label>
                <Input data-testid="input-deal-origin-city" placeholder="Sao Paulo" value={form.originCity}
                  onChange={e => setForm(f => ({ ...f, originCity: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Destino (IATA)</Label>
                <Input data-testid="input-deal-destination" placeholder="LIS" value={form.destination}
                  onChange={e => setForm(f => ({ ...f, destination: e.target.value.toUpperCase() }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Cidade Destino</Label>
                <Input data-testid="input-deal-dest-city" placeholder="Lisboa" value={form.destinationCity}
                  onChange={e => setForm(f => ({ ...f, destinationCity: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Data Ida</Label>
                <Input data-testid="input-deal-departure" type="date" value={form.departureDate}
                  onChange={e => setForm(f => ({ ...f, departureDate: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Data Volta</Label>
                <Input data-testid="input-deal-return" type="date" value={form.returnDate}
                  onChange={e => setForm(f => ({ ...f, returnDate: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Preco</Label>
                <Input data-testid="input-deal-price" type="number" placeholder="599.99" value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Moeda</Label>
                <Input data-testid="input-deal-currency" placeholder="USD" value={form.currency}
                  onChange={e => setForm(f => ({ ...f, currency: e.target.value.toUpperCase() }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Companhia Aerea</Label>
                <Input data-testid="input-deal-airline" placeholder="LATAM" value={form.airline}
                  onChange={e => setForm(f => ({ ...f, airline: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Classe</Label>
                <Input data-testid="input-deal-cabin" placeholder="economy" value={form.cabinClass}
                  onChange={e => setForm(f => ({ ...f, cabinClass: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Titulo (para o banner)</Label>
              <Input data-testid="input-deal-headline" placeholder="Voos para Lisboa a partir de $599!"
                value={form.headline} onChange={e => setForm(f => ({ ...f, headline: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Descricao</Label>
              <Textarea data-testid="input-deal-description" placeholder="Reserve agora os melhores voos..."
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="resize-none" rows={2} />
            </div>
            <div className="flex gap-2 pt-1">
              <Button data-testid="button-save-deal" size="sm" onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending} className="gap-1.5">
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <Save className="h-3.5 w-3.5" />
                {editingDeal ? 'Atualizar' : 'Salvar'}
              </Button>
              <Button data-testid="button-cancel-deal" size="sm" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
        ) : !deals?.length ? (
          <p className="text-sm text-gray-400 text-center py-4">Nenhuma oferta criada ainda</p>
        ) : (
          <div className="space-y-2">
            {deals.map(deal => (
              <div key={deal.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100" data-testid={`card-deal-${deal.id}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-gray-900">
                      {deal.originCity || deal.origin} → {deal.destinationCity || deal.destination}
                    </span>
                    {deal.price && (
                      <Badge variant="secondary" className="text-xs">
                        {deal.currency} {parseFloat(deal.price).toFixed(2)}
                      </Badge>
                    )}
                    <Badge variant={deal.isActive ? "default" : "outline"} className="text-xs">
                      {deal.isActive ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>
                  {deal.headline && <p className="text-xs text-gray-500 mt-0.5 truncate">{deal.headline}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="icon" variant="ghost" onClick={() => toggleMutation.mutate({ id: deal.id, isActive: !deal.isActive })}
                    data-testid={`button-toggle-deal-${deal.id}`}>
                    {deal.isActive ? <ToggleRight className="h-4 w-4 text-green-500" /> : <ToggleLeft className="h-4 w-4 text-gray-400" />}
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => startEdit(deal)} data-testid={`button-edit-deal-${deal.id}`}>
                    <Percent className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(deal.id)} data-testid={`button-delete-deal-${deal.id}`}>
                    <Trash2 className="h-3.5 w-3.5 text-red-400" />
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
  const [expandedBookingId, setExpandedBookingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"command" | "overview" | "bookings" | "settings">("command");

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

  const openBookingsView = (options?: { status?: string; search?: string; bookingId?: number }) => {
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

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
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

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "command" | "overview" | "bookings" | "settings")} className="w-full">
          <TabsList className="grid w-full grid-cols-4 max-w-xl" data-testid="tabs-admin-nav">
            <TabsTrigger value="command" data-testid="tab-command">Command Center</TabsTrigger>
            <TabsTrigger value="overview" data-testid="tab-overview">Visao Geral</TabsTrigger>
            <TabsTrigger value="bookings" data-testid="tab-bookings">Reservas</TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">Configuracoes</TabsTrigger>
          </TabsList>

          <TabsContent value="command" className="space-y-6 mt-6">
            <AdminCommandCenter
              onOpenLiveDesk={() => setLocation("/admin/live-chat")}
              onOpenBookings={openBookingsView}
              onOpenSettings={openSettingsView}
            />
          </TabsContent>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardContent className="p-6 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">{t("admin.total_revenue")}</p>
                    <h3 className="text-2xl font-bold text-gray-900" data-testid="text-stat-revenue">${((stats as any)?.totalRevenue ?? 0).toLocaleString()}</h3>
                    <p className="text-xs text-gray-400 mt-1">Hoje: ${((stats as any)?.revenueToday ?? 0).toLocaleString()}</p>
                  </div>
                  <div className="h-12 w-12 rounded-xl border flex items-center justify-center shadow-inner text-emerald-500 bg-emerald-50 border-emerald-200">
                    <DollarSign className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardContent className="p-6 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">{t("admin.commissions")}</p>
                    <h3 className="text-2xl font-bold text-gray-900" data-testid="text-stat-commission">${((stats as any)?.totalCommission ?? 0).toLocaleString()}</h3>
                    <p className="text-xs text-gray-400 mt-1">7 dias: ${((stats as any)?.revenue7Days ?? 0).toLocaleString()}</p>
                  </div>
                  <div className="h-12 w-12 rounded-xl border flex items-center justify-center shadow-inner text-blue-500 bg-blue-50 border-blue-200">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardContent className="p-6 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">{t("admin.total_bookings")}</p>
                    <h3 className="text-2xl font-bold text-gray-900" data-testid="text-stat-bookings">{(stats as any)?.totalBookings ?? 0}</h3>
                    <p className="text-xs text-gray-400 mt-1">7 dias: {(stats as any)?.bookings7Days ?? 0}</p>
                  </div>
                  <div className="h-12 w-12 rounded-xl border flex items-center justify-center shadow-inner text-teal-500 bg-teal-50 border-teal-200">
                    <Plane className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardContent className="p-6 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Buscas Hoje</p>
                    <h3 className="text-2xl font-bold text-gray-900" data-testid="text-stat-searches">{(stats as any)?.searchesToday ?? 0}</h3>
                    <p className="text-xs text-gray-400 mt-1">Total: {(stats as any)?.recentSearches ?? 0}</p>
                  </div>
                  <div className="h-12 w-12 rounded-xl border flex items-center justify-center shadow-inner text-orange-500 bg-orange-50 border-orange-200">
                    <Search className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 bg-white border border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-gray-900">Receita - Ultimos 7 dias</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.08)" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: 'rgba(0,0,0,0.45)', fontSize: 12}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: 'rgba(0,0,0,0.45)'}} tickFormatter={(value) => `$${value}`} />
                        <Tooltip 
                          cursor={{fill: 'rgba(0,0,0,0.03)'}}
                          contentStyle={{borderRadius: '12px', border: '1px solid #e5e7eb', background: '#ffffff', color: '#111827', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                        />
                        <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Receita" />
                        <Line type="monotone" dataKey="commission" stroke="#10b981" strokeWidth={2} dot={{r: 3}} name="Comissao" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="bg-white border border-gray-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-900">Status das Reservas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Object.entries(statusBreakdown).length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-2">Sem dados</p>
                    ) : (
                      Object.entries(statusBreakdown).map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className={`h-2.5 w-2.5 rounded-full ${getStatusDotColor(status)}`} />
                            <span className="text-sm text-gray-700 capitalize">{status}</span>
                          </div>
                          <span className="text-sm font-bold text-gray-900" data-testid={`text-status-count-${status}`}>{count as number}</span>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-white border border-gray-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-gray-900">Rotas Populares</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {topRoutes.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-2">Sem dados</p>
                    ) : (
                      topRoutes.slice(0, 5).map((route: any, i: number) => (
                        <div key={i} className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <ArrowRightLeft className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                            <span className="text-sm text-gray-700 truncate">{route.route}</span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-bold text-gray-900">{route.count}x</span>
                            <span className="text-xs text-gray-400 ml-1">${route.revenue}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">{t("admin.recent_bookings")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {bookings?.slice(0, 5).map((booking: any) => {
                    const flightOrigin = (booking.flightData as any)?.origin || '';
                    const flightDest = (booking.flightData as any)?.destination || '';
                    const routeLabel = flightOrigin && flightDest ? `${flightOrigin} → ${flightDest}` : '';
                    return (
                      <div key={booking.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100" data-testid={`card-recent-booking-${booking.id}`}>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 border border-blue-100 shadow-inner">
                            <Plane className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-gray-900">{booking.contactEmail}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              {routeLabel && <span className="text-xs text-gray-500">{routeLabel}</span>}
                              {booking.referenceCode && (
                                <span className="text-xs text-blue-500 font-mono">#{booking.referenceCode}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="font-bold text-sm text-gray-900">${booking.totalPrice}</p>
                          <div className="flex flex-col items-end gap-0.5">
                            <Badge variant="outline" className={`text-[10px] uppercase font-bold ${getStatusColor(booking.status)}`}>
                              {booking.status}
                            </Badge>
                            {booking.ticketStatus && booking.ticketStatus !== 'pending' && (
                              <Badge variant="outline" className={`text-[10px] uppercase font-bold ${getTicketStatusColor(booking.ticketStatus)}`} data-testid={`badge-ticket-status-${booking.id}`}>
                                {booking.ticketStatus === 'issued' ? 'Ticket Issued' :
                                 booking.ticketStatus === 'schedule_changed' ? 'Schedule Changed' :
                                 booking.ticketStatus === 'cancelled' ? 'Ticket Cancelled' :
                                 booking.ticketStatus === 'failed' ? 'Ticket Failed' :
                                 booking.ticketStatus}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {!bookings?.length && <p className="text-gray-400 text-sm text-center py-4">{t("admin.no_bookings")}</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-6 mt-6">
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900">Gerenciamento de Reservas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      data-testid="input-booking-search"
                      placeholder="Buscar por email, codigo ou ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-white"
                    />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {["all", "pending", "confirmed", "cancelled"].map((status) => (
                      <Button
                        key={status}
                        data-testid={`button-filter-${status}`}
                        variant={statusFilter === status ? "default" : "outline"}
                        size="sm"
                        onClick={() => setStatusFilter(status)}
                      >
                        {status === "all" ? "Todos" :
                         status === "pending" ? "Pendente" :
                         status === "confirmed" ? "Confirmado" :
                         "Cancelado"}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[60px]">ID</TableHead>
                        <TableHead>Contato</TableHead>
                        <TableHead>Rota</TableHead>
                        <TableHead className="text-right">Preco</TableHead>
                        <TableHead className="text-right">Comissao</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ticket</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="w-[100px]">Acoes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBookings.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center text-gray-400 py-8">
                            Nenhuma reserva encontrada
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredBookings.map((booking: any) => {
                          const flightOrigin = (booking.flightData as any)?.origin || '';
                          const flightDest = (booking.flightData as any)?.destination || '';
                          const routeLabel = flightOrigin && flightDest ? `${flightOrigin} → ${flightDest}` : '-';
                          const isExpanded = expandedBookingId === booking.id;

                          return (
                            <>
                              <TableRow key={booking.id} className="cursor-pointer" data-testid={`row-booking-${booking.id}`}>
                                <TableCell className="font-mono text-xs text-gray-500">#{booking.id}</TableCell>
                                <TableCell>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{booking.contactEmail}</p>
                                    {booking.contactPhone && (
                                      <p className="text-xs text-gray-400">{booking.contactPhone}</p>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm text-gray-700">{routeLabel}</span>
                                </TableCell>
                                <TableCell className="text-right font-bold text-sm text-gray-900">${booking.totalPrice}</TableCell>
                                <TableCell className="text-right text-sm text-gray-600">${booking.commissionAmount || '0.00'}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={`text-[10px] uppercase font-bold ${getStatusColor(booking.status)}`}>
                                    {booking.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={`text-[10px] uppercase font-bold ${getTicketStatusColor(booking.ticketStatus || 'pending')}`}>
                                    {booking.ticketStatus || 'pending'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-xs text-gray-500">
                                  {booking.createdAt ? format(parseISO(booking.createdAt), 'dd/MM/yyyy') : '-'}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      data-testid={`button-sync-${booking.id}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        syncMutation.mutate(booking.id);
                                      }}
                                      disabled={syncMutation.isPending}
                                    >
                                      <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      data-testid={`button-expand-${booking.id}`}
                                      onClick={() => setExpandedBookingId(isExpanded ? null : booking.id)}
                                    >
                                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                              {isExpanded && (
                                <TableRow key={`${booking.id}-details`}>
                                  <TableCell colSpan={9} className="bg-gray-50 p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                      <div className="space-y-2">
                                        <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
                                          <MapPin className="h-3.5 w-3.5" />
                                          Detalhes do Voo
                                        </h4>
                                        <div className="space-y-1">
                                          {(booking.flightData as any)?.airline && (
                                            <p className="text-gray-600">Companhia: <span className="font-medium text-gray-900">{(booking.flightData as any).airline}</span></p>
                                          )}
                                          {(booking.flightData as any)?.flightNumber && (
                                            <p className="text-gray-600">Voo: <span className="font-medium text-gray-900">{(booking.flightData as any).flightNumber}</span></p>
                                          )}
                                          <p className="text-gray-600">Rota: <span className="font-medium text-gray-900">{routeLabel}</span></p>
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
                                          <Calendar className="h-3.5 w-3.5" />
                                          Referencias
                                        </h4>
                                        <div className="space-y-1">
                                          {booking.referenceCode && (
                                            <p className="text-gray-600">Codigo: <span className="font-mono font-medium text-gray-900">{booking.referenceCode}</span></p>
                                          )}
                                          {booking.duffelOrderId && (
                                            <p className="text-gray-600">Duffel ID: <span className="font-mono font-medium text-gray-900 text-xs">{booking.duffelOrderId}</span></p>
                                          )}
                                          {booking.duffelBookingReference && (
                                            <p className="text-gray-600">Ref Duffel: <span className="font-mono font-medium text-gray-900">{booking.duffelBookingReference}</span></p>
                                          )}
                                          {booking.ticketNumber && (
                                            <p className="text-gray-600">Ticket: <span className="font-mono font-medium text-gray-900">{booking.ticketNumber}</span></p>
                                          )}
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <h4 className="font-bold text-gray-900 flex items-center gap-1.5">
                                          <Users className="h-3.5 w-3.5" />
                                          Passageiros
                                        </h4>
                                        <div className="space-y-1">
                                          {Array.isArray(booking.passengerDetails) ? (
                                            (booking.passengerDetails as any[]).map((p: any, idx: number) => (
                                              <p key={idx} className="text-gray-600">
                                                {p.firstName || p.given_name || ''} {p.lastName || p.family_name || ''}
                                                {p.type && <span className="text-xs text-gray-400 ml-1">({p.type})</span>}
                                              </p>
                                            ))
                                          ) : (
                                            <p className="text-gray-400 text-xs">Sem dados de passageiros</p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6 mt-6">
            <TestModeControl />
            <CommissionControl />
            <FeaturedDealsManager />
            <VoiceEscalations />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
