import React, { useState, useEffect } from "react";
import { 
  Smartphone, Monitor, Save, RotateCcw, 
  Plus, Trash2, ChevronRight, Settings2, 
  Layout, Eye, Image as ImageIcon, Type, 
  Palette, Smartphone as PhoneIcon, ChevronDown,
  Layers, Zap, Shield, ArrowLeft, MoreHorizontal,
  Wifi, Battery, Signal, User, Search, Laptop, Tablet,
  RefreshCw, Megaphone, ArrowRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";
import { useSiteSettings, useUpdateSettings } from "@/hooks/use-admin";
import { useFeaturedDeals } from "@/hooks/use-flights";
import { DealCard } from "@/components/DealCard";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";


export function MobileConfigurator() {
  const { data: settings, isLoading: settingsLoading } = useSiteSettings();
  const updateSettings = useUpdateSettings();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { t } = useI18n();

  const defaultLayout = [
    { id: "hero", enabled: true, type: "hero", label: "Hero Banner" },
    { id: "deals", enabled: true, type: "deals", label: "Featured Deals" },
    { id: "stats", enabled: true, type: "stats", label: "Market Stats" }
  ];

  const [config, setConfig] = useState<any>({
    heroTitle: "",
    heroSubtitle: "",
    promotionalBanner: "",
    mobileLayout: defaultLayout,
  });

  const [activeTab, setActiveTab] = useState<"sections" | "content" | "design">("sections");
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [previewScale, setPreviewScale] = useState(0.85);

  const { data: deals } = useFeaturedDeals();


  // Initialize extended layout if missing
  useEffect(() => {
    if (settings) {
      const baseLayout = settings.mobileLayout || defaultLayout;
      const extendedLayout = baseLayout.map((s: any) => ({
        ...s,
        props: s.props || {}, // Ensure props object exists for all
        style: s.style || { 
          paddingY: "py-12",
          bgVariant: "transparent",
          accentColor: "blue"
        }
      }));

      setConfig({
        heroTitle: settings.heroTitle || "Para onde deseja viajar?",
        heroSubtitle: settings.heroSubtitle || "Bem-vindo novamente. Visão atualizada",
        promotionalBanner: settings.promotionalBanner || "Ofertas Exclusivas Mobile - 15% OFF",
        mobileLayout: extendedLayout,
      });
    }
  }, [settings]);

  const sanitizeUrl = (url: string) => {
    if (!url) return "";
    // Basic protocol check to prevent javascript: or data: injection (Law 14)
    if (url.trim().toLowerCase().startsWith("javascript:") || url.trim().toLowerCase().startsWith("data:")) {
      return "";
    }
    return url;
  };

  const handleSave = async () => {
    try {
      // Create a clean, validated payload (Law 14 Compliance)
      const payload = {
        siteName: settings?.siteName,
        commissionPercentage: settings?.commissionPercentage,
        testMode: settings?.testMode,
        mobileAppTestEnabled: settings?.mobileAppTestEnabled,
        mobileAppProductionEnabled: settings?.mobileAppProductionEnabled,
        heroTitle: config.heroTitle.slice(0, 200),
        heroSubtitle: config.heroSubtitle.slice(0, 500),
        promotionalBanner: config.promotionalBanner.slice(0, 200),
        mobileLayout: config.mobileLayout.map((s: any) => ({
          ...s,
          props: Object.fromEntries(
            Object.entries(s.props || {}).map(([k, v]) => [k, typeof v === 'string' ? sanitizeUrl(v) : v])
          )
        })),
      };

      await updateSettings.mutateAsync(payload as any);
      toast({
        title: "Soberania Sincronizada",
        description: "O layout mobile foi atualizado com sucesso.",
      });
      qc.invalidateQueries({ queryKey: ["/api/public/settings"] });
      qc.invalidateQueries({ queryKey: ["/api/site-settings"] });
    } catch (err) {
      console.error("Save error:", err);
      toast({
        variant: "destructive",
        title: "Falha na Transmissão",
        description: "O servidor rejeitou as alterações de arquitetura.",
      });
    }
  };

  const addSection = (type: "custom" | "image-hero" | "stats-grid" | "cta-card") => {
    const id = `${type}-${Date.now()}`;
    const newSection = {
      id,
      enabled: true,
      type,
      label: `Nova Seção ${type.replace('-', ' ')}`,
      props: {
        title: "Título da Seção",
        subtitle: "Descrição detalhada para o usuário.",
        buttonText: "Ação Principal",
        imageUrl: "https://images.unsplash.com/photo-1544016768-982d1554f0b9?auto=format&fit=crop&q=80&w=1200",
        stats: [
          { label: "Métrica 1", value: "100+" },
          { label: "Métrica 2", value: "50k" }
        ]
      },
      style: {
        paddingY: "py-16",
        bgVariant: "glass",
        accentColor: "blue",
        textAlign: "center"
      }
    };
    setConfig({ ...config, mobileLayout: [...config.mobileLayout, newSection] });
    setEditingSectionId(id);
    setActiveTab("content");
  };

  const deleteSection = (id: string) => {
    setConfig({
      ...config,
      mobileLayout: config.mobileLayout.filter((s: any) => s.id !== id)
    });
    if (editingSectionId === id) setEditingSectionId(null);
  };

  const updateSectionProp = (id: string, key: string, value: any) => {
    const newLayout = config.mobileLayout.map((s: any) => 
      s.id === id ? { ...s, props: { ...s.props, [key]: value } } : s
    );
    setConfig({ ...config, mobileLayout: newLayout });
  };

  const updateSectionStyle = (id: string, key: string, value: any) => {
    const newLayout = config.mobileLayout.map((s: any) => 
      s.id === id ? { ...s, style: { ...s.style, [key]: value } } : s
    );
    setConfig({ ...config, mobileLayout: newLayout });
  };

  const updateSectionLabel = (id: string, label: string) => {
    const newLayout = config.mobileLayout.map((s: any) => 
      s.id === id ? { ...s, label } : s
    );
    setConfig({ ...config, mobileLayout: newLayout });
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newLayout = [...config.mobileLayout];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newLayout.length) return;
    [newLayout[index], newLayout[targetIndex]] = [newLayout[targetIndex], newLayout[index]];
    setConfig({ ...config, mobileLayout: newLayout });
  };

  const toggleSection = (id: string) => {
    const newLayout = config.mobileLayout.map((s: any) => 
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

  const editingSection = config.mobileLayout.find((s: any) => s.id === editingSectionId);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-in fade-in duration-500 pb-20">
      {/* Configuration Sidebar - Studio Mode */}
      <div className="xl:col-span-4 space-y-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Michels Studio</h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-1">Full Service Editor</p>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={updateSettings.isPending}
            className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 rounded-2xl px-6 shadow-xl shadow-indigo-600/40 border border-white/10"
          >
            {updateSettings.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} 
            Deploy
          </Button>
        </div>

        {/* Studio Navigation */}
        <div className="flex p-1.5 bg-slate-900/80 rounded-[24px] border border-white/5 shadow-2xl backdrop-blur-xl">
          {(["sections", "content", "design"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-[18px] transition-all",
                activeTab === tab ? "bg-white text-slate-950 shadow-xl scale-100" : "text-slate-500 hover:text-white scale-95"
              )}
            >
              {tab === "sections" ? "Ecrã" : tab === "content" ? "Propriedades" : "Estilos"}
            </button>
          ))}
        </div>

        {activeTab === "sections" && (
          <div className="space-y-4 animate-in slide-in-from-left-4 duration-500">
            <Card className="glass-card border-white/5 overflow-hidden rounded-[32px] shadow-2xl">
              <CardHeader className="p-6 border-b border-white/5 bg-white/5 flex flex-row items-center justify-between">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                  <Layout className="h-4 w-4" /> Arquitetura do Site
                </CardTitle>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => addSection("custom")}
                    variant="outline" size="sm" 
                    className="h-8 px-4 text-[9px] font-black uppercase border-white/10 text-white hover:bg-white/10 rounded-xl"
                  >
                    + Novo Bloco
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {config.mobileLayout.map((section: any, idx: number) => (
                  <div 
                    key={section.id} 
                    className={cn(
                      "p-4 rounded-[24px] border transition-all flex items-center justify-between group cursor-pointer",
                      section.enabled ? "bg-white/5 border-white/10" : "bg-slate-950/40 border-white/5 opacity-50 grayscale",
                      editingSectionId === section.id && "ring-2 ring-indigo-500 bg-white/10 border-indigo-400"
                    )}
                    onClick={() => {
                      setEditingSectionId(section.id);
                      setActiveTab("content");
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" size="icon" className="h-6 w-6 text-slate-600 hover:text-white"
                          onClick={(e) => { e.stopPropagation(); moveSection(idx, 'up'); }}
                        >
                          <ArrowRight className="h-3 w-3 -rotate-90" />
                        </Button>
                        <Button 
                          variant="ghost" size="icon" className="h-6 w-6 text-slate-600 hover:text-white"
                          onClick={(e) => { e.stopPropagation(); moveSection(idx, 'down'); }}
                        >
                          <ArrowRight className="h-3 w-3 rotate-90" />
                        </Button>
                      </div>
                      <div>
                        <span className="text-xs font-black text-white uppercase tracking-tight block">{section.label || section.id}</span>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{section.type || "Nativa"}</span>
                      </div>
                    </div>
                    <Button 
                      variant={section.enabled ? "default" : "outline"} 
                      size="sm" 
                      className={cn("rounded-xl h-8 px-4 text-[9px] font-black uppercase", section.enabled ? "bg-indigo-600" : "border-white/10 text-slate-500")}
                      onClick={(e) => { e.stopPropagation(); toggleSection(section.id); }}
                    >
                      {section.enabled ? "Live" : "Oculto"}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "content" && (
          <div className="space-y-4 animate-in slide-in-from-right-4 duration-500">
            {!editingSectionId ? (
              <div className="p-20 text-center space-y-4 bg-slate-900/40 rounded-[32px] border border-dashed border-white/10">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                   <Eye className="h-6 w-6 text-slate-600" />
                </div>
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Selecione uma seção no ecrã para editar propriedades</p>
              </div>
            ) : (
              <Card className="glass-card border-white/5 overflow-hidden rounded-[32px] shadow-2xl">
                <CardHeader className="p-6 border-b border-white/5 bg-white/5 flex flex-row items-center justify-between">
                  <CardTitle className="text-[10px] font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                    <Megaphone className="h-4 w-4" /> Editor de Bloco: {editingSection?.label}
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setEditingSectionId(null)} className="text-[9px] font-black uppercase text-slate-500 hover:text-white">Fechar</Button>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Common Name */}
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Nome da Seção (Painel)</Label>
                    <Input 
                      value={editingSection?.label} 
                      onChange={(e) => updateSectionLabel(editingSectionId!, e.target.value)}
                      className="bg-slate-950/60 border-white/5 rounded-[18px] text-white h-14 font-bold"
                    />
                  </div>

                  {/* Dynamic Properties based on type */}
                  <div className="space-y-6 pt-4 border-t border-white/5">
                     <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Título Principal</Label>
                        <Input 
                          value={editingSection?.props?.title || (editingSection?.id === 'hero' ? config.heroTitle : "")} 
                          onChange={(e) => {
                            if (editingSection?.id === 'hero') setConfig({...config, heroTitle: e.target.value});
                            updateSectionProp(editingSectionId!, "title", e.target.value);
                          }}
                          className="bg-slate-950/60 border-white/5 rounded-[18px] text-white h-14 font-bold"
                        />
                     </div>
                     
                     <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Subtítulo / Descrição</Label>
                        <Textarea 
                          value={editingSection?.props?.subtitle || (editingSection?.id === 'hero' ? config.heroSubtitle : "")} 
                          onChange={(e) => {
                            if (editingSection?.id === 'hero') setConfig({...config, heroSubtitle: e.target.value});
                            updateSectionProp(editingSectionId!, "subtitle", e.target.value);
                          }}
                          className="bg-slate-950/60 border-white/5 rounded-[24px] text-white min-h-[120px] font-medium resize-none"
                        />
                     </div>

                     {(editingSection?.type === "custom" || editingSection?.id === "hero") && (
                       <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Imagem de Fundo (URL)</Label>
                          <div className="flex gap-2">
                            <Input 
                              value={editingSection?.props?.imageUrl || ""} 
                              onChange={(e) => updateSectionProp(editingSectionId!, "imageUrl", e.target.value)}
                              className="bg-slate-950/60 border-white/5 rounded-[18px] text-white h-14 text-xs"
                            />
                            <Button variant="outline" className="h-14 w-14 rounded-[18px] border-white/5 bg-white/5"><ImageIcon className="h-4 w-4" /></Button>
                          </div>
                       </div>
                     )}

                     {editingSection?.props?.buttonText !== undefined && (
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Texto do Botão</Label>
                          <Input 
                            value={editingSection.props.buttonText} 
                            onChange={(e) => updateSectionProp(editingSectionId!, "buttonText", e.target.value)}
                            className="bg-slate-950/60 border-white/5 rounded-[18px] text-white h-14 font-bold"
                          />
                        </div>
                     )}
                  </div>

                  <div className="pt-8 flex flex-col gap-3">
                    <Button 
                      variant="destructive" 
                      className="w-full rounded-[20px] font-black text-[10px] uppercase h-14 gap-3 bg-red-600/10 border border-red-500/20 text-red-500 hover:bg-red-600 hover:text-white"
                      onClick={() => deleteSection(editingSectionId!)}
                    >
                      <RefreshCw className="h-4 w-4 rotate-45" /> Remover este Bloco
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === "design" && (
          <div className="space-y-4 animate-in fade-in duration-500">
             {!editingSectionId ? (
                <Card className="glass-card border-white/5 p-12 text-center rounded-[32px]">
                   <p className="text-xs font-black text-slate-500 uppercase">Selecione um bloco para configurar estilos visuais</p>
                </Card>
             ) : (
                <Card className="glass-card border-white/5 overflow-hidden rounded-[32px] shadow-2xl">
                   <CardHeader className="p-6 border-b border-white/5 bg-white/5">
                      <CardTitle className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Design do Bloco</CardTitle>
                   </CardHeader>
                   <CardContent className="p-6 space-y-8">
                      <div className="space-y-4">
                        <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Cor de Destaque</Label>
                        <div className="flex gap-3">
                          {["blue", "indigo", "rose", "emerald", "amber"].map(color => (
                            <button 
                              key={color}
                              onClick={() => updateSectionStyle(editingSectionId!, "accentColor", color)}
                              className={cn(
                                "w-10 h-10 rounded-full border-2 transition-all",
                                editingSection?.style?.accentColor === color ? "border-white scale-110" : "border-transparent",
                                `bg-${color}-500`
                              )}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Variante de Fundo</Label>
                        <div className="grid grid-cols-2 gap-3">
                           {["transparent", "glass", "solid", "gradient"].map(v => (
                             <Button 
                                key={v}
                                variant="outline"
                                onClick={() => updateSectionStyle(editingSectionId!, "bgVariant", v)}
                                className={cn(
                                  "h-14 rounded-2xl text-[9px] font-black uppercase border-white/5",
                                  editingSection?.style?.bgVariant === v ? "bg-white text-slate-950 border-white" : "bg-white/5 text-slate-500"
                                )}
                             >
                               {v}
                             </Button>
                           ))}
                        </div>
                      </div>
                   </CardContent>
                </Card>
             )}
          </div>
        )}
      </div>

      {/* Samsung S24 Ultra Simulator - Deep Linked */}
      <div className="xl:col-span-8 flex flex-col items-center justify-start py-4">
        <div className="mb-8 flex items-center gap-6 bg-slate-950/80 p-3 rounded-[28px] border border-white/10 shadow-2xl backdrop-blur-2xl">
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="h-10 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white bg-indigo-600 shadow-lg shadow-indigo-600/20">Samsung S24 Ultra</Button>
            <Button variant="ghost" size="sm" className="h-10 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white">iPhone 15 Pro Max</Button>
          </div>
          <div className="h-5 w-[1px] bg-white/10" />
          <div className="flex items-center gap-5 px-3">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Escala Preview</span>
            <input 
              type="range" min="0.4" max="1.0" step="0.05" value={previewScale} 
              onChange={(e) => setPreviewScale(parseFloat(e.target.value))}
              className="w-40 accent-indigo-500"
            />
            <span className="text-[11px] font-black text-indigo-400 w-10 text-right">{Math.round(previewScale * 100)}%</span>
          </div>
        </div>

        {/* The Device Frame */}
        <div className="relative transition-all duration-700 ease-in-out" style={{ transform: `scale(${previewScale})`, transformOrigin: 'top center' }}>
          {/* Samsung Frame Refined */}
          <div className="relative w-[440px] h-[920px] bg-slate-950 rounded-[72px] border-[14px] border-slate-900 shadow-[0_0_150px_rgba(0,0,0,0.9),inset_0_0_40px_rgba(255,255,255,0.05)] overflow-hidden ring-1 ring-white/10">
            {/* Status Bar */}
            <div className="absolute top-0 inset-x-0 h-12 z-50 flex items-center justify-between px-12 text-[11px] font-black text-white">
              <span>11:11</span>
              <div className="flex gap-2.5 items-center">
                <div className="w-4 h-4 bg-white/10 rounded-full border border-white/20" />
                <div className="w-4 h-4 bg-white/10 rounded-full border border-white/20" />
                <div className="w-8 h-4 bg-white/30 rounded-md" />
              </div>
            </div>

            <div className="absolute top-6 left-1/2 -translate-x-1/2 w-6 h-6 bg-slate-900 rounded-full border-2 border-slate-800 z-50 shadow-inner" />
            
            {/* Dynamic Screen Content */}
            <div className="w-full h-full bg-slate-950 overflow-y-auto scrollbar-none flex flex-col pb-24">
              
              {/* Header (App UI Style) */}
              <div className="pt-16 pb-6 px-8 flex items-center justify-between bg-slate-950/90 backdrop-blur-3xl sticky top-0 z-40 border-b border-white/5">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center font-black text-[12px] text-white shadow-lg">MT</div>
                   <div>
                     <span className="text-sm font-black text-white uppercase tracking-tighter block">Michels</span>
                     <span className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest">Concierge</span>
                   </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-1.5 shadow-xl">
                  <div className="w-6 h-0.5 bg-white rounded-full" />
                  <div className="w-4 h-0.5 bg-white rounded-full self-start ml-3" />
                </div>
              </div>

              {config.mobileLayout.map((section: any) => {
                if (!section.enabled) return null;
                const isEditing = editingSectionId === section.id;

                const SectionWrapper = ({ children }: { children: React.ReactNode }) => (
                  <div 
                    onClick={() => { setEditingSectionId(section.id); setActiveTab("content"); }}
                    className={cn(
                      "relative cursor-pointer transition-all duration-300",
                      isEditing ? "ring-4 ring-indigo-500/50 scale-[0.98] z-30" : "hover:ring-2 hover:ring-white/10"
                    )}
                  >
                    {isEditing && (
                      <div className="absolute -top-3 -right-3 bg-indigo-500 text-white text-[8px] font-black px-3 py-1 rounded-full z-50 uppercase tracking-widest shadow-xl">Editando</div>
                    )}
                    {children}
                  </div>
                );

                switch (section.id) {
                  case "hero":
                    return (
                      <SectionWrapper key="hero">
                        <div className="relative min-h-[500px] flex flex-col justify-end px-10 pb-16 overflow-hidden">
                          <img src={section.props?.imageUrl || "https://images.unsplash.com/photo-1559268950-2d7ceb2eee35?auto=format&fit=crop&q=80&w=1200"} className="absolute inset-0 w-full h-full object-cover opacity-70" alt="" />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                          <div className="relative z-10 space-y-6">
                            <h1 className="text-5xl font-black text-white leading-[0.85] uppercase tracking-tighter drop-shadow-2xl">
                              {section.props?.title || config.heroTitle}
                            </h1>
                            <p className="text-base font-bold text-slate-300 leading-tight drop-shadow-lg opacity-90">
                              {section.props?.subtitle || config.heroSubtitle}
                            </p>
                            <div className="pt-8">
                              <div className="h-16 w-full bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[28px] flex items-center px-6 gap-4 shadow-2xl">
                                <div className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                                <span className="text-xs font-black text-white/50 uppercase tracking-[0.2em]">{t("home.board.col_origin")}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </SectionWrapper>
                    );

                  case "stats":
                    return (
                      <SectionWrapper key="stats">
                        <div className="px-12 py-16 grid grid-cols-2 gap-12 border-b border-white/5 bg-slate-900/10">
                          <div className="space-y-2">
                            <p className="text-4xl font-black text-white tracking-tighter">2.4k</p>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">Rotas Ativas</p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-4xl font-black text-white tracking-tighter">12h</p>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">Support Time</p>
                          </div>
                        </div>
                      </SectionWrapper>
                    );

                  case "deals":
                    return (
                      <SectionWrapper key="deals">
                        <div className="px-8 py-12 space-y-10">
                          <div className="flex items-center justify-between">
                            <h3 className="text-[11px] font-black text-white uppercase tracking-[0.5em]">{t("home.deals.title")}</h3>
                            <div className="h-[1px] flex-1 bg-white/10 ml-6" />
                          </div>
                          <div className="space-y-8">
                            {deals?.slice(0, 1).map((deal: any) => (
                              <div key={deal.id} className="scale-100">
                                <DealCard deal={{
                                  ...deal, 
                                  title: deal.headline || "", 
                                  price: `${deal.currency} ${deal.price}`,
                                  imageUrl: deal.imageUrl || undefined
                                } as any} />
                              </div>
                            ))}
                          </div>
                        </div>
                      </SectionWrapper>
                    );

                  case "cta":
                    return (
                      <SectionWrapper key="cta">
                        <div className="px-10 py-24 text-center space-y-10 bg-white text-slate-950">
                          <h2 className="text-5xl font-black uppercase leading-none tracking-tighter">{t("home.cta.title")}</h2>
                          <Button className="w-full h-20 rounded-[32px] bg-indigo-600 text-white font-black uppercase tracking-widest shadow-2xl shadow-indigo-600/30 text-xs">Contactar Concierge</Button>
                        </div>
                      </SectionWrapper>
                    );

                  default:
                    // Render Custom or Image-based sections
                    return (
                      <SectionWrapper key={section.id}>
                        <div className={cn("px-8 py-16", section.style?.paddingY || "py-16")}>
                           <div className={cn(
                             "p-12 rounded-[48px] border backdrop-blur-3xl space-y-6 shadow-2xl relative overflow-hidden",
                             section.style?.bgVariant === "glass" ? "bg-white/5 border-white/10" : "bg-slate-900 border-white/5",
                             section.style?.textAlign === "center" ? "text-center items-center" : "text-left items-start"
                           )}>
                              {section.props?.imageUrl && (
                                <img src={section.props.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-20 -z-10" alt="" />
                              )}
                              <h3 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">{section.props?.title || "Novo Bloco"}</h3>
                              <p className="text-[13px] font-bold text-slate-400 leading-tight">{section.props?.subtitle || "Personalize este bloco agora."}</p>
                              {section.props?.buttonText && (
                                <div className="pt-6">
                                  <Button className="w-full h-14 rounded-[24px] bg-white text-slate-950 font-black text-[11px] uppercase tracking-[0.2em] shadow-xl">
                                    {section.props.buttonText}
                                  </Button>
                                </div>
                              )}
                           </div>
                        </div>
                      </SectionWrapper>
                    );
                }
              })}

            </div>

            {/* Android Refined Bottom Bar */}
            <div className="absolute bottom-0 inset-x-0 h-20 bg-slate-950/95 backdrop-blur-3xl border-t border-white/5 flex items-center justify-around px-12 z-50 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
              <div className="w-12 h-12 flex items-center justify-center opacity-40">
                <div className="w-5 h-5 rounded-md border-2 border-white" />
              </div>
              <div className="w-12 h-12 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full border-2 border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
              </div>
              <div className="w-12 h-12 flex items-center justify-center opacity-40">
                <div className="w-5 h-5 border-l-2 border-b-2 border-white rotate-45 ml-1" />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
