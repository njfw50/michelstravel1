import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Smartphone, Laptop, Tablet, Save, RefreshCw, Eye, Image as ImageIcon, Megaphone, Layout, ArrowRight } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { useSiteSettings, useUpdateSettings } from "@/hooks/use-admin";
import { useFeaturedDeals } from "@/hooks/use-flights";
import { DealCard } from "@/components/DealCard";
import { Skeleton } from "@/components/ui/skeleton";

export function MobileConfigurator() {
  const { t, language } = useI18n();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [previewScale, setPreviewScale] = useState(0.85);

  const { data: settings, isLoading: settingsLoading } = useSiteSettings();
  const { data: deals = [] } = useFeaturedDeals(language);
  const updateSettings = useUpdateSettings();

  const [config, setConfig] = useState({
    heroTitle: "",
    heroSubtitle: "",
    promotionalBanner: "",
    mobileLayout: [] as any[],
  });

  const defaultLayout = [
    { id: "hero", enabled: true, label: "Hero & Pesquisa" },
    { id: "stats", enabled: true, label: "Estatísticas" },
    { id: "insights", enabled: true, label: "Market Insights" },
    { id: "deals", enabled: true, label: "Ofertas em Destaque" },
    { id: "partners", enabled: true, label: "Rede de Parceiros" },
    { id: "cta", enabled: true, label: "CTA de Encerramento" }
  ];

  useEffect(() => {
    if (settings) {
      setConfig({
        heroTitle: settings.heroTitle || "Para onde deseja viajar?",
        heroSubtitle: settings.heroSubtitle || "Bem-vindo novamente. Visão atualizada",
        promotionalBanner: settings.promotionalBanner || "Ofertas Exclusivas Mobile - 15% OFF",
        mobileLayout: settings.mobileLayout || defaultLayout,
      });
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        ...settings,
        heroTitle: config.heroTitle,
        heroSubtitle: config.heroSubtitle,
        promotionalBanner: config.promotionalBanner,
        mobileLayout: config.mobileLayout,
      });
      toast({
        title: "Layout Atualizado",
        description: "A estrutura do site mobile foi sincronizada com sucesso.",
      });
      qc.invalidateQueries({ queryKey: ["/api/public/settings"] });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Não foi possível atualizar o layout.",
      });
    }
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newLayout = [...config.mobileLayout];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newLayout.length) return;
    [newLayout[index], newLayout[targetIndex]] = [newLayout[targetIndex], newLayout[index]];
    setConfig({ ...config, mobileLayout: newLayout });
  };

  const toggleSection = (id: string) => {
    const newLayout = config.mobileLayout.map(s => 
      s.id === id ? { ...s, enabled: !s.enabled } : s
    );
    setConfig({ ...config, mobileLayout: newLayout });
  };

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-in fade-in duration-500 pb-20">
      {/* Configuration Panel */}
      <div className="xl:col-span-4 space-y-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Arquitetura Mobile</h2>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Controle Total do Ecrã</p>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={updateSettings.isPending}
            className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 rounded-2xl px-6 shadow-xl shadow-indigo-600/20"
          >
            {updateSettings.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} 
            Publicar
          </Button>
        </div>

        {/* Section Management */}
        <Card className="glass-card border-white/5 overflow-hidden">
          <CardHeader className="border-b border-white/5 bg-white/5">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
              <Smartphone className="h-4 w-4" /> Estrutura de Seções
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {config.mobileLayout.map((section, idx) => (
              <div 
                key={section.id} 
                className={cn(
                  "p-4 rounded-2xl border transition-all flex items-center justify-between",
                  section.enabled ? "bg-white/5 border-white/10" : "bg-slate-950/40 border-white/5 opacity-50 grayscale"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-1">
                    <Button 
                      variant="ghost" size="icon" className="h-6 w-6 text-slate-600 hover:text-white"
                      onClick={() => moveSection(idx, 'up')}
                    >
                      <ArrowRight className="h-3 w-3 -rotate-90" />
                    </Button>
                    <Button 
                      variant="ghost" size="icon" className="h-6 w-6 text-slate-600 hover:text-white"
                      onClick={() => moveSection(idx, 'down')}
                    >
                      <ArrowRight className="h-3 w-3 rotate-90" />
                    </Button>
                  </div>
                  <span className="text-xs font-black text-white uppercase tracking-tight">{section.label || section.id}</span>
                </div>
                <Button 
                  variant={section.enabled ? "default" : "outline"} 
                  size="sm" 
                  className={cn("rounded-xl h-8 px-4 text-[9px] font-black uppercase", section.enabled ? "bg-indigo-600" : "border-white/10 text-slate-500")}
                  onClick={() => toggleSection(section.id)}
                >
                  {section.enabled ? "Ativo" : "Oculto"}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Content Configuration */}
        <Card className="glass-card border-white/5 overflow-hidden">
          <CardHeader className="border-b border-white/5 bg-white/5">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
              <Layout className="h-4 w-4" /> Conteúdo Dinâmico
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Título Hero</Label>
              <Input 
                value={config.heroTitle} 
                onChange={(e) => setConfig({...config, heroTitle: e.target.value})}
                className="bg-slate-900/50 border-white/10 rounded-xl text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Subtítulo Hero</Label>
              <Input 
                value={config.heroSubtitle} 
                onChange={(e) => setConfig({...config, heroSubtitle: e.target.value})}
                className="bg-slate-900/50 border-white/10 rounded-xl text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mensagem do Banner</Label>
              <Textarea 
                value={config.promotionalBanner} 
                onChange={(e) => setConfig({...config, promotionalBanner: e.target.value})}
                className="bg-slate-900/50 border-white/10 rounded-xl text-white min-h-[80px] resize-none"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Samsung S24 Ultra Simulator */}
      <div className="xl:col-span-8 flex flex-col items-center justify-start py-4">
        <div className="mb-6 flex items-center gap-4 bg-slate-900/80 p-2 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl">
          <Button variant="ghost" size="sm" className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10">Samsung S24 Ultra</Button>
          <Button variant="ghost" size="sm" className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white">iPhone 15 Pro</Button>
          <div className="h-4 w-[1px] bg-white/10 mx-2" />
          <div className="flex items-center gap-4 px-2">
            <span className="text-[9px] font-black text-slate-500 uppercase">Escala</span>
            <input 
              type="range" min="0.5" max="1.0" step="0.05" value={previewScale} 
              onChange={(e) => setPreviewScale(parseFloat(e.target.value))}
              className="w-32 accent-indigo-500"
            />
            <span className="text-[10px] font-black text-indigo-400 w-8">{Math.round(previewScale * 100)}%</span>
          </div>
        </div>

        {/* The Device Frame */}
        <div className="relative transition-all duration-500 ease-out" style={{ transform: `scale(${previewScale})`, transformOrigin: 'top center' }}>
          {/* Samsung Shell */}
          <div className="relative w-[420px] h-[860px] bg-slate-950 rounded-[60px] border-[12px] border-slate-800 shadow-[0_0_120px_rgba(0,0,0,0.9),inset_0_0_20px_rgba(255,255,255,0.05)] overflow-hidden">
            {/* Status Bar */}
            <div className="absolute top-0 inset-x-0 h-10 z-50 flex items-center justify-between px-10 text-[10px] font-bold text-white">
              <span>9:41</span>
              <div className="flex gap-2">
                <div className="w-3 h-3 bg-white/20 rounded-sm" />
                <div className="w-3 h-3 bg-white/20 rounded-sm" />
                <div className="w-6 h-3 bg-white/20 rounded-sm" />
              </div>
            </div>

            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-900 rounded-full border-2 border-slate-800/50 z-50 shadow-inner" />
            
            {/* Dynamic Screen Content */}
            <div className="w-full h-full bg-slate-950 overflow-y-auto scrollbar-none flex flex-col pb-20">
              
              {/* Header (Always Visible) */}
              <div className="pt-12 pb-6 px-6 flex items-center justify-between bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 border-b border-white/5">
                <div className="flex items-center gap-2">
                   <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-black text-[10px] text-white">MT</div>
                   <span className="text-xs font-black text-white uppercase tracking-tighter">Michels</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <div className="w-5 h-0.5 bg-white mb-1 rounded-full" />
                  <div className="w-3 h-0.5 bg-white rounded-full self-end mr-2.5" />
                </div>
              </div>

              {config.mobileLayout.map((section: any) => {
                if (!section.enabled) return null;

                switch (section.id) {
                  case "hero":
                    return (
                      <div key="hero" className="relative min-h-[400px] flex flex-col justify-end px-8 pb-12 overflow-hidden">
                        <img src="https://images.unsplash.com/photo-1559268950-2d7ceb2eee35?auto=format&fit=crop&q=80&w=1200" className="absolute inset-0 w-full h-full object-cover opacity-60" alt="" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
                        <div className="relative z-10 space-y-4">
                          <h1 className="text-4xl font-black text-white leading-[0.9] uppercase tracking-tighter drop-shadow-2xl">{config.heroTitle}</h1>
                          <p className="text-sm font-bold text-slate-300 leading-relaxed drop-shadow-lg">{config.heroSubtitle}</p>
                          <div className="pt-6">
                            <div className="h-14 w-full bg-white/10 backdrop-blur-2xl border border-white/10 rounded-2xl flex items-center px-5 gap-3">
                              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{t("home.board.col_origin")}</span>
                            </div>
                          </div>
                        </div>
                        {config.promotionalBanner && (
                          <div className="absolute bottom-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
                        )}
                      </div>
                    );

                  case "stats":
                    return (
                      <div key="stats" className="px-10 py-10 grid grid-cols-2 gap-8 border-b border-white/5 bg-slate-900/20">
                        <div className="space-y-1">
                          <p className="text-2xl font-black text-white tracking-tighter">2,400+</p>
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{t("home.stats.routes")}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-2xl font-black text-white tracking-tighter">10k+</p>
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{t("home.stats.clients")}</p>
                        </div>
                      </div>
                    );

                  case "insights":
                    return (
                      <div key="insights" className="p-8 space-y-6">
                        <div className="p-8 rounded-[40px] bg-white text-slate-950">
                           <h3 className="text-xl font-black uppercase tracking-tight mb-4">{t("home.toolbox.title")}</h3>
                           <div className="space-y-4">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dólar Hoje</span>
                                 <span className="font-black">R$ 5.04</span>
                              </div>
                              <Button className="w-full h-12 rounded-xl bg-slate-950 text-white font-black text-[10px] uppercase">Acessar Ferramentas</Button>
                           </div>
                        </div>
                      </div>
                    );

                  case "deals":
                    return (
                      <div key="deals" className="px-6 py-8 space-y-8">
                        <div className="flex items-center justify-between">
                          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">{t("home.deals.title")}</h3>
                          <div className="h-[1px] flex-1 bg-white/5 ml-4" />
                        </div>
                        <div className="space-y-6">
                          {deals.slice(0, 1).map((deal) => (
                            <div key={deal.id} className="scale-[0.95] origin-left">
                              <DealCard deal={{...deal, title: deal.headline, price: `${deal.currency} ${deal.price}`}} />
                            </div>
                          ))}
                        </div>
                      </div>
                    );

                  case "partners":
                    return (
                      <div key="partners" className="px-6 py-10 bg-slate-900/10 border-y border-white/5">
                        <div className="flex gap-4 overflow-x-auto scrollbar-none opacity-40">
                           {[1,2,3,4].map(i => <div key={i} className="h-12 w-24 bg-white/5 rounded-xl border border-white/5 shrink-0" />)}
                        </div>
                      </div>
                    );

                  case "cta":
                    return (
                      <div key="cta" className="px-8 py-16 text-center space-y-6 bg-white text-slate-950">
                        <h2 className="text-4xl font-black uppercase leading-none tracking-tighter">{t("home.cta.title")}</h2>
                        <Button className="w-full h-16 rounded-2xl bg-blue-600 text-white font-black uppercase tracking-widest shadow-xl">Contactar Concierge</Button>
                      </div>
                    );

                  default:
                    return null;
                }
              })}

            </div>

            {/* Android Navigation Bar */}
            <div className="absolute bottom-0 inset-x-0 h-16 bg-slate-950/95 backdrop-blur-2xl border-t border-white/5 flex items-center justify-around px-8 z-50">
              <div className="w-10 h-10 flex items-center justify-center">
                <div className="w-4 h-4 rounded-sm border-2 border-slate-500" />
              </div>
              <div className="w-10 h-10 flex items-center justify-center">
                <div className="w-5 h-5 rounded-full border-2 border-slate-500" />
              </div>
              <div className="w-10 h-10 flex items-center justify-center">
                <div className="w-4 h-4 border-l-2 border-b-2 border-slate-500 rotate-45 ml-1" />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
