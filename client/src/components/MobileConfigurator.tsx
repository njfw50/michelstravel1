import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Smartphone, Laptop, Tablet, Save, RefreshCw, Eye, Image as ImageIcon, 
  Megaphone, Layout, ArrowRight, Plus, Trash2, Copy, ChevronDown, ChevronUp,
  Palette, Link2, Settings2, Grid3x3, Type, FileImage, Zap, Layers
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { useSiteSettings, useUpdateSettings } from "@/hooks/use-admin";
import { useFeaturedDeals } from "@/hooks/use-flights";
import { DealCard } from "@/components/DealCard";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SectionConfig {
  id: string;
  enabled: boolean;
  label: string;
  title?: string;
  subtitle?: string;
  description?: string;
  backgroundColor?: string;
  textColor?: string;
  imageUrl?: string;
  buttonText?: string;
  buttonLink?: string;
  buttonColor?: string;
  stats?: Array<{ label: string; value: string }>;
  customData?: Record<string, any>;
}

export function MobileConfigurator() {
  const { t, language } = useI18n();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [previewScale, setPreviewScale] = useState(0.75);
  const [activeTab, setActiveTab] = useState("sections");
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  const { data: settings, isLoading: settingsLoading } = useSiteSettings();
  const { data: deals = [] } = useFeaturedDeals(language);
  const updateSettings = useUpdateSettings();

  const [config, setConfig] = useState({
    heroTitle: "",
    heroSubtitle: "",
    promotionalBanner: "",
    mobileLayout: [] as SectionConfig[],
    primaryColor: "#4f46e5",
    secondaryColor: "#06b6d4",
    accentColor: "#f59e0b",
  });

  const defaultLayout: SectionConfig[] = [
    { 
      id: "hero", 
      enabled: true, 
      label: "Hero & Pesquisa",
      title: "Para onde deseja viajar?",
      subtitle: "Bem-vindo novamente. Visão atualizada",
      backgroundColor: "#0f172a",
      textColor: "#ffffff",
      imageUrl: "https://images.unsplash.com/photo-1559268950-2d7ceb2eee35?auto=format&fit=crop&q=80&w=1200",
      buttonText: "Buscar Voos",
      buttonColor: "#3b82f6"
    },
    { 
      id: "stats", 
      enabled: true, 
      label: "Estatísticas",
      stats: [
        { label: "Rotas", value: "2,400+" },
        { label: "Clientes", value: "10k+" },
        { label: "Parceiros", value: "45+" },
        { label: "Velocidade", value: "< 2s" }
      ],
      backgroundColor: "#1e293b"
    },
    { 
      id: "insights", 
      enabled: true, 
      label: "Market Insights",
      title: "Inteligência de Mercado",
      description: "Análises em tempo real de preços e tendências",
      backgroundColor: "#0f172a"
    },
    { 
      id: "deals", 
      enabled: true, 
      label: "Ofertas em Destaque",
      title: "Melhores Ofertas",
      backgroundColor: "#0f172a"
    },
    { 
      id: "partners", 
      enabled: true, 
      label: "Rede de Parceiros",
      backgroundColor: "#1e293b"
    },
    { 
      id: "cta", 
      enabled: true, 
      label: "CTA de Encerramento",
      title: "Pronto para viajar?",
      buttonText: "Contactar Concierge",
      backgroundColor: "#ffffff",
      textColor: "#0f172a",
      buttonColor: "#3b82f6"
    }
  ];

  useEffect(() => {
    if (settings) {
      setConfig({
        heroTitle: settings.heroTitle || "Para onde deseja viajar?",
        heroSubtitle: settings.heroSubtitle || "Bem-vindo novamente. Visão atualizada",
        promotionalBanner: settings.promotionalBanner || "Ofertas Exclusivas Mobile - 15% OFF",
        mobileLayout: settings.mobileLayout || defaultLayout,
        primaryColor: "#4f46e5",
        secondaryColor: "#06b6d4",
        accentColor: "#f59e0b",
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
        title: "✨ Layout Publicado",
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

  const updateSectionConfig = (id: string, updates: Partial<SectionConfig>) => {
    const newLayout = config.mobileLayout.map(s => 
      s.id === id ? { ...s, ...updates } : s
    );
    setConfig({ ...config, mobileLayout: newLayout });
  };

  const duplicateSection = (index: number) => {
    const section = config.mobileLayout[index];
    const newSection = { ...section, id: `${section.id}-${Date.now()}` };
    const newLayout = [...config.mobileLayout];
    newLayout.splice(index + 1, 0, newSection);
    setConfig({ ...config, mobileLayout: newLayout });
  };

  const deleteSection = (index: number) => {
    const newLayout = config.mobileLayout.filter((_, i) => i !== index);
    setConfig({ ...config, mobileLayout: newLayout });
    setSelectedSection(null);
  };

  const addNewSection = (type: string) => {
    const newSection: SectionConfig = {
      id: `custom-${Date.now()}`,
      enabled: true,
      label: `Seção Customizada ${config.mobileLayout.length + 1}`,
      backgroundColor: "#0f172a",
      textColor: "#ffffff",
      customData: { type }
    };
    setConfig({ ...config, mobileLayout: [...config.mobileLayout, newSection] });
  };

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const currentSection = config.mobileLayout.find(s => s.id === selectedSection);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-in fade-in duration-500 pb-20">
      {/* Left Sidebar - Configuration Panel */}
      <div className="xl:col-span-4 space-y-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Arquitetura Mobile</h2>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Editor Completo do App</p>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={updateSettings.isPending}
            className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white gap-2 rounded-2xl px-6 shadow-xl shadow-indigo-600/20"
          >
            {updateSettings.isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} 
            Publicar
          </Button>
        </div>

        {/* Tabs for Configuration */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-900/50 border border-white/10 rounded-xl p-1">
            <TabsTrigger value="sections" className="rounded-lg text-xs font-bold">Seções</TabsTrigger>
            <TabsTrigger value="content" className="rounded-lg text-xs font-bold">Conteúdo</TabsTrigger>
            <TabsTrigger value="design" className="rounded-lg text-xs font-bold">Design</TabsTrigger>
          </TabsList>

          {/* Sections Tab */}
          <TabsContent value="sections" className="space-y-4 mt-6">
            <Card className="glass-card border-white/5 overflow-hidden">
              <CardHeader className="border-b border-white/5 bg-white/5">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                  <Layers className="h-4 w-4" /> Estrutura de Seções
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
                {config.mobileLayout.map((section, idx) => (
                  <div 
                    key={section.id}
                    onClick={() => setSelectedSection(section.id)}
                    className={cn(
                      "p-4 rounded-2xl border transition-all cursor-pointer group",
                      selectedSection === section.id 
                        ? "bg-indigo-500/15 border-indigo-500/30 shadow-lg shadow-indigo-500/10"
                        : section.enabled 
                          ? "bg-white/5 border-white/10 hover:border-white/20" 
                          : "bg-slate-950/40 border-white/5 opacity-50 grayscale"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex flex-col gap-1">
                          <Button 
                            variant="ghost" size="icon" className="h-5 w-5 text-slate-600 hover:text-white p-0"
                            onClick={(e) => { e.stopPropagation(); moveSection(idx, 'up'); }}
                          >
                            <ChevronUp className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" size="icon" className="h-5 w-5 text-slate-600 hover:text-white p-0"
                            onClick={(e) => { e.stopPropagation(); moveSection(idx, 'down'); }}
                          >
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-black text-white uppercase tracking-tight block truncate">{section.label}</span>
                          <span className="text-[10px] text-slate-500">{section.id}</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" size="icon" className="h-7 w-7 text-slate-600 hover:text-white"
                          onClick={(e) => { e.stopPropagation(); duplicateSection(idx); }}
                          title="Duplicar"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant={section.enabled ? "default" : "outline"} 
                          size="sm" 
                          className={cn("rounded-lg h-7 px-3 text-[8px] font-black uppercase", section.enabled ? "bg-indigo-600" : "border-white/10 text-slate-500")}
                          onClick={(e) => { e.stopPropagation(); toggleSection(section.id); }}
                        >
                          {section.enabled ? "✓" : "✕"}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Add New Section */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Adicionar Seção</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="rounded-xl border-white/10 text-slate-400 hover:text-white h-9"
                  onClick={() => addNewSection("custom")}
                >
                  <Plus className="h-3 w-3 mr-1" /> Customizada
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="rounded-xl border-white/10 text-slate-400 hover:text-white h-9"
                  onClick={() => addNewSection("banner")}
                >
                  <Plus className="h-3 w-3 mr-1" /> Banner
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-4 mt-6">
            <Card className="glass-card border-white/5 overflow-hidden">
              <CardHeader className="border-b border-white/5 bg-white/5">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                  <Type className="h-4 w-4" /> Conteúdo Principal
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Título Hero</Label>
                  <Input 
                    value={config.heroTitle} 
                    onChange={(e) => setConfig({...config, heroTitle: e.target.value})}
                    className="bg-slate-900/50 border-white/10 rounded-xl text-white"
                    placeholder="Título principal da página"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Subtítulo Hero</Label>
                  <Input 
                    value={config.heroSubtitle} 
                    onChange={(e) => setConfig({...config, heroSubtitle: e.target.value})}
                    className="bg-slate-900/50 border-white/10 rounded-xl text-white"
                    placeholder="Subtítulo descritivo"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Banner Promocional</Label>
                  <Textarea 
                    value={config.promotionalBanner} 
                    onChange={(e) => setConfig({...config, promotionalBanner: e.target.value})}
                    className="bg-slate-900/50 border-white/10 rounded-xl text-white min-h-[80px] resize-none"
                    placeholder="Mensagem promocional destacada"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Section-Specific Content */}
            {currentSection && (
              <Card className="glass-card border-white/5 overflow-hidden">
                <CardHeader className="border-b border-white/5 bg-white/5">
                  <CardTitle className="text-sm font-black uppercase tracking-widest text-blue-400 flex items-center gap-2">
                    <Settings2 className="h-4 w-4" /> Editar: {currentSection.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {currentSection.title && (
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Título da Seção</Label>
                      <Input 
                        value={currentSection.title} 
                        onChange={(e) => updateSectionConfig(currentSection.id, { title: e.target.value })}
                        className="bg-slate-900/50 border-white/10 rounded-xl text-white"
                      />
                    </div>
                  )}
                  {currentSection.subtitle && (
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Subtítulo</Label>
                      <Input 
                        value={currentSection.subtitle} 
                        onChange={(e) => updateSectionConfig(currentSection.id, { subtitle: e.target.value })}
                        className="bg-slate-900/50 border-white/10 rounded-xl text-white"
                      />
                    </div>
                  )}
                  {currentSection.description && (
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Descrição</Label>
                      <Textarea 
                        value={currentSection.description} 
                        onChange={(e) => updateSectionConfig(currentSection.id, { description: e.target.value })}
                        className="bg-slate-900/50 border-white/10 rounded-xl text-white min-h-[60px] resize-none"
                      />
                    </div>
                  )}
                  {currentSection.buttonText && (
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Texto do Botão</Label>
                      <Input 
                        value={currentSection.buttonText} 
                        onChange={(e) => updateSectionConfig(currentSection.id, { buttonText: e.target.value })}
                        className="bg-slate-900/50 border-white/10 rounded-xl text-white"
                      />
                    </div>
                  )}
                  {currentSection.buttonLink && (
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Link do Botão</Label>
                      <Input 
                        value={currentSection.buttonLink} 
                        onChange={(e) => updateSectionConfig(currentSection.id, { buttonLink: e.target.value })}
                        className="bg-slate-900/50 border-white/10 rounded-xl text-white"
                        placeholder="/deals ou https://..."
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Design Tab */}
          <TabsContent value="design" className="space-y-4 mt-6">
            <Card className="glass-card border-white/5 overflow-hidden">
              <CardHeader className="border-b border-white/5 bg-white/5">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                  <Palette className="h-4 w-4" /> Cores Globais
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cor Primária</Label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={config.primaryColor}
                      onChange={(e) => setConfig({...config, primaryColor: e.target.value})}
                      className="h-10 w-16 rounded-lg cursor-pointer border border-white/10"
                    />
                    <Input 
                      value={config.primaryColor}
                      onChange={(e) => setConfig({...config, primaryColor: e.target.value})}
                      className="bg-slate-900/50 border-white/10 rounded-xl text-white flex-1 text-xs"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cor Secundária</Label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={config.secondaryColor}
                      onChange={(e) => setConfig({...config, secondaryColor: e.target.value})}
                      className="h-10 w-16 rounded-lg cursor-pointer border border-white/10"
                    />
                    <Input 
                      value={config.secondaryColor}
                      onChange={(e) => setConfig({...config, secondaryColor: e.target.value})}
                      className="bg-slate-900/50 border-white/10 rounded-xl text-white flex-1 text-xs"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cor de Destaque</Label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={config.accentColor}
                      onChange={(e) => setConfig({...config, accentColor: e.target.value})}
                      className="h-10 w-16 rounded-lg cursor-pointer border border-white/10"
                    />
                    <Input 
                      value={config.accentColor}
                      onChange={(e) => setConfig({...config, accentColor: e.target.value})}
                      className="bg-slate-900/50 border-white/10 rounded-xl text-white flex-1 text-xs"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section-Specific Design */}
            {currentSection && (
              <Card className="glass-card border-white/5 overflow-hidden">
                <CardHeader className="border-b border-white/5 bg-white/5">
                  <CardTitle className="text-sm font-black uppercase tracking-widest text-blue-400 flex items-center gap-2">
                    <Palette className="h-4 w-4" /> Design: {currentSection.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cor de Fundo</Label>
                    <div className="flex gap-2">
                      <input 
                        type="color" 
                        value={currentSection.backgroundColor || "#0f172a"}
                        onChange={(e) => updateSectionConfig(currentSection.id, { backgroundColor: e.target.value })}
                        className="h-10 w-16 rounded-lg cursor-pointer border border-white/10"
                      />
                      <Input 
                        value={currentSection.backgroundColor || "#0f172a"}
                        onChange={(e) => updateSectionConfig(currentSection.id, { backgroundColor: e.target.value })}
                        className="bg-slate-900/50 border-white/10 rounded-xl text-white flex-1 text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cor do Texto</Label>
                    <div className="flex gap-2">
                      <input 
                        type="color" 
                        value={currentSection.textColor || "#ffffff"}
                        onChange={(e) => updateSectionConfig(currentSection.id, { textColor: e.target.value })}
                        className="h-10 w-16 rounded-lg cursor-pointer border border-white/10"
                      />
                      <Input 
                        value={currentSection.textColor || "#ffffff"}
                        onChange={(e) => updateSectionConfig(currentSection.id, { textColor: e.target.value })}
                        className="bg-slate-900/50 border-white/10 rounded-xl text-white flex-1 text-xs"
                      />
                    </div>
                  </div>
                  {currentSection.imageUrl && (
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">URL da Imagem</Label>
                      <Input 
                        value={currentSection.imageUrl} 
                        onChange={(e) => updateSectionConfig(currentSection.id, { imageUrl: e.target.value })}
                        className="bg-slate-900/50 border-white/10 rounded-xl text-white text-xs"
                        placeholder="https://..."
                      />
                    </div>
                  )}
                  {currentSection.buttonColor && (
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cor do Botão</Label>
                      <div className="flex gap-2">
                        <input 
                          type="color" 
                          value={currentSection.buttonColor}
                          onChange={(e) => updateSectionConfig(currentSection.id, { buttonColor: e.target.value })}
                          className="h-10 w-16 rounded-lg cursor-pointer border border-white/10"
                        />
                        <Input 
                          value={currentSection.buttonColor}
                          onChange={(e) => updateSectionConfig(currentSection.id, { buttonColor: e.target.value })}
                          className="bg-slate-900/50 border-white/10 rounded-xl text-white flex-1 text-xs"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Delete Section Button */}
        {currentSection && (
          <Button 
            variant="destructive"
            className="w-full rounded-xl gap-2"
            onClick={() => deleteSection(config.mobileLayout.findIndex(s => s.id === currentSection.id))}
          >
            <Trash2 className="h-4 w-4" /> Deletar Seção
          </Button>
        )}
      </div>

      {/* Right Side - Preview */}
      <div className="xl:col-span-8 flex flex-col items-center justify-start py-4">
        {/* Device Selector */}
        <div className="mb-6 flex items-center gap-4 bg-slate-900/80 p-2 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl">
          <Button variant="ghost" size="sm" className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10">Samsung S24</Button>
          <Button variant="ghost" size="sm" className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white">iPhone 15</Button>
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

        {/* Device Frame */}
        <div className="relative transition-all duration-500 ease-out" style={{ transform: `scale(${previewScale})`, transformOrigin: 'top center' }}>
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
            
            {/* Screen Content */}
            <div className="w-full h-full bg-slate-950 overflow-y-auto scrollbar-none flex flex-col pb-20">
              
              {/* Header */}
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

              {/* Dynamic Sections */}
              {config.mobileLayout.map((section: any) => {
                if (!section.enabled) return null;

                switch (section.id) {
                  case "hero":
                    return (
                      <div key="hero" className="relative min-h-[400px] flex flex-col justify-end px-8 pb-12 overflow-hidden" style={{ backgroundColor: section.backgroundColor }}>
                        {section.imageUrl && (
                          <>
                            <img src={section.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-60" alt="" />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
                          </>
                        )}
                        <div className="relative z-10 space-y-4">
                          <h1 className="text-4xl font-black text-white leading-[0.9] uppercase tracking-tighter drop-shadow-2xl" style={{ color: section.textColor }}>
                            {config.heroTitle}
                          </h1>
                          <p className="text-sm font-bold text-slate-300 leading-relaxed drop-shadow-lg">
                            {config.heroSubtitle}
                          </p>
                          <div className="pt-6">
                            <div className="h-14 w-full bg-white/10 backdrop-blur-2xl border border-white/10 rounded-2xl flex items-center px-5 gap-3">
                              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Origem</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );

                  case "stats":
                    return (
                      <div key="stats" className="px-10 py-10 grid grid-cols-2 gap-8 border-b border-white/5" style={{ backgroundColor: section.backgroundColor }}>
                        {section.stats?.map((stat: any, i: number) => (
                          <div key={i} className="space-y-1">
                            <p className="text-2xl font-black text-white tracking-tighter">{stat.value}</p>
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</p>
                          </div>
                        ))}
                      </div>
                    );

                  case "insights":
                    return (
                      <div key="insights" className="p-8 space-y-6" style={{ backgroundColor: section.backgroundColor }}>
                        <div className="p-8 rounded-[40px] bg-white text-slate-950">
                           <h3 className="text-xl font-black uppercase tracking-tight mb-4">{section.title || "Inteligência"}</h3>
                           <div className="space-y-4">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dólar Hoje</span>
                                 <span className="font-black">R$ 5.04</span>
                              </div>
                              <Button className="w-full h-12 rounded-xl bg-slate-950 text-white font-black text-[10px] uppercase">Acessar</Button>
                           </div>
                        </div>
                      </div>
                    );

                  case "deals":
                    return (
                      <div key="deals" className="px-6 py-8 space-y-8" style={{ backgroundColor: section.backgroundColor }}>
                        <div className="flex items-center justify-between">
                          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">{section.title || "Ofertas"}</h3>
                          <div className="h-[1px] flex-1 bg-white/5 ml-4" />
                        </div>
                        <div className="space-y-6">
                          {deals.slice(0, 1).map((deal) => (
                            <div key={deal.id} className="scale-[0.95] origin-left">
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
                    );

                  case "partners":
                    return (
                      <div key="partners" className="px-6 py-10 border-y border-white/5" style={{ backgroundColor: section.backgroundColor }}>
                        <div className="flex gap-4 overflow-x-auto scrollbar-none opacity-40">
                           {[1,2,3,4].map(i => <div key={i} className="h-12 w-24 bg-white/5 rounded-xl border border-white/5 shrink-0" />)}
                        </div>
                      </div>
                    );

                  case "cta":
                    return (
                      <div key="cta" className="px-8 py-16 text-center space-y-6" style={{ backgroundColor: section.backgroundColor, color: section.textColor }}>
                        <h2 className="text-4xl font-black uppercase leading-none tracking-tighter">{section.title || "Pronto?"}</h2>
                        <Button 
                          className="w-full h-16 rounded-2xl text-white font-black uppercase tracking-widest shadow-xl"
                          style={{ backgroundColor: section.buttonColor || "#3b82f6" }}
                        >
                          {section.buttonText || "Contactar"}
                        </Button>
                      </div>
                    );

                  default:
                    return (
                      <div key={section.id} className="px-8 py-12 text-center space-y-4" style={{ backgroundColor: section.backgroundColor, color: section.textColor }}>
                        <h3 className="text-2xl font-black uppercase">{section.title || section.label}</h3>
                        <p className="text-sm">{section.description || "Seção customizada"}</p>
                      </div>
                    );
                }
              })}

            </div>

            {/* Navigation Bar */}
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
