import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Instagram, Facebook, Sparkles, Image as ImageIcon, Type, 
  Send, Copy, Share2, Palette, Smartphone, Layout, 
  Eye, Download, Wand2, Zap, Rocket, Target, Globe, Users,
  CheckCircle2, Loader2, Plane
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAdminFeaturedDeals } from "@/hooks/use-admin";
import { cn } from "@/lib/utils";

export function AdStudio() {
  const { toast } = useToast();
  const { data: deals, isLoading: dealsLoading } = useAdminFeaturedDeals();
  const [selectedDealId, setSelectedDealId] = useState<string>("");
  const [adText, setAdText] = useState("Temos as melhores tarifas para o Brasil!");
  const [activeFormat, setActiveFormat] = useState<"story" | "post" | "reels">("story");
  const [activeCampaign, setActiveCampaign] = useState<"conversion" | "reach">("conversion");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const selectedDeal = deals?.find(d => d.id === selectedDealId);

  // Sync initial text when deal is selected
  useEffect(() => {
    if (selectedDeal) {
      setAdText(`🇧🇷 Voos para ${selectedDeal.destinationCity} saindo de ${selectedDeal.originCity}. A partir de R$ ${selectedDeal.price}! Reserve com a Michels Travel.`);
    }
  }, [selectedDealId]);

  const handleCopyLink = () => {
    const link = selectedDeal 
      ? `https://michelstravel.agency/search?origin=${selectedDeal.originCity}&dest=${selectedDeal.destinationCity}&ref=ad_studio`
      : "https://michelstravel.agency/search?ref=ad_studio";
    navigator.clipboard.writeText(link);
    toast({
      title: "Link Copiado",
      description: "O link de conversão estratégica foi copiado.",
    });
  };

  const handleMagicFill = async () => {
    if (!selectedDealId) {
      toast({
        title: "Atenção",
        description: "Selecione uma oferta primeiro para a Mia gerar a copy.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/admin/social/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealId: selectedDealId,
          platform: "instagram",
          tone: "elite",
          mode: "copy"
        }),
      });

      if (!response.ok) throw new Error("Failed to generate AI content");
      const data = await response.json();
      setAdText(data.copy);
      
      toast({
        title: "Copywriter IA (Mia)",
        description: "Texto de alta conversão gerado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro na Geração",
        description: "Não foi possível conectar com a Mia.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedDeal || !adText) {
      toast({
        title: "Erro",
        description: "Gere o conteúdo e selecione uma oferta antes de publicar.",
        variant: "destructive"
      });
      return;
    }

    setIsPublishing(true);
    try {
      const response = await fetch("/api/admin/social/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealId: selectedDealId,
          platform: "instagram",
          copy: adText,
          imageUrl: selectedDeal.imageUrl,
          format: activeFormat
        }),
      });

      if (!response.ok) throw new Error("Publishing failed");
      const data = await response.json();
      
      toast({
        title: "Merchandise Publicado!",
        description: `Status: ${data.status}. Post sincronizado com o estúdio.`,
      });
    } catch (error) {
      toast({
        title: "Erro na Publicação",
        description: "Falha ao enviar para o Instagram/Facebook.",
        variant: "destructive"
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDownload = () => {
    toast({
      title: "Exportando Arte",
      description: "Aguarde enquanto renderizamos o banner em 4K.",
    });
    // Simulate download
    setTimeout(() => {
      toast({
        title: "Pronto!",
        description: "Arte exportada com sucesso (formato .png)",
      });
    }, 1500);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Editor Panel */}
        <Card className="lg:col-span-1 glass-card border-white/5 bg-slate-900/40 backdrop-blur-xl shadow-2xl">
          <CardHeader className="border-b border-white/5 pb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-indigo-500/20 rounded-xl flex items-center justify-center border border-indigo-500/30">
                <Palette className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-white font-display">Estúdio Criativo</CardTitle>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Configuração de Campanha</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-8 space-y-6">
            
            {/* Offer Selection */}
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex justify-between">
                <span>1. Seleção de Oferta</span>
                {selectedDeal && <span className="text-indigo-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Ativa</span>}
              </Label>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {dealsLoading ? (
                  <div className="py-4 text-center"><Loader2 className="w-5 h-5 animate-spin text-indigo-500 mx-auto" /></div>
                ) : (
                  deals?.map((deal) => (
                    <button
                      key={deal.id}
                      onClick={() => setSelectedDealId(deal.id)}
                      className={cn(
                        "w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left",
                        selectedDealId === deal.id
                          ? "bg-indigo-600/20 border-indigo-500/50 shadow-lg shadow-indigo-500/10"
                          : "bg-white/5 border-white/5 hover:bg-white/10"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn("p-1.5 rounded-full", selectedDealId === deal.id ? "bg-indigo-500" : "bg-slate-800")}>
                          <Plane className="w-3 h-3 text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{deal.destinationCity}</p>
                          <p className="text-[9px] text-slate-400 uppercase tracking-tighter">R$ {deal.price} • {deal.airline}</p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Objetivo da Campanha</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setActiveCampaign("conversion")}
                  className={cn(
                    "h-12 rounded-xl text-xs font-bold transition-all",
                    activeCampaign === "conversion" ? "bg-indigo-600 text-white border-indigo-500" : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                  )}
                >
                  <Target className={cn("mr-2 h-4 w-4", activeCampaign === "conversion" ? "text-white" : "text-emerald-400")} /> Conversão
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setActiveCampaign("reach")}
                  className={cn(
                    "h-12 rounded-xl text-xs font-bold transition-all",
                    activeCampaign === "reach" ? "bg-indigo-600 text-white border-indigo-500" : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                  )}
                >
                  <Globe className={cn("mr-2 h-4 w-4", activeCampaign === "reach" ? "text-white" : "text-indigo-400")} /> Alcance
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Texto Principal (Copy)</Label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleMagicFill}
                  disabled={isGenerating || !selectedDealId}
                  className="h-6 text-[9px] font-black uppercase tracking-tighter text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10"
                >
                  {isGenerating ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Wand2 className="mr-1 h-3 w-3" />}
                  Sugestão IA
                </Button>
              </div>
              <textarea 
                value={adText}
                onChange={(e) => setAdText(e.target.value)}
                className="w-full h-32 bg-slate-950/40 border border-white/5 rounded-xl p-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all resize-none"
                placeholder="Escreva sua oferta aqui..."
              />
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Formato de Destino</Label>
              <Tabs value={activeFormat} onValueChange={(v) => setActiveFormat(v as any)} className="w-full">
                <TabsList className="grid grid-cols-3 bg-slate-950/60 p-1 rounded-xl h-12">
                  <TabsTrigger value="story" className="rounded-lg text-[10px] font-black uppercase data-[state=active]:bg-indigo-600">Story</TabsTrigger>
                  <TabsTrigger value="post" className="rounded-lg text-[10px] font-black uppercase data-[state=active]:bg-indigo-600">Post</TabsTrigger>
                  <TabsTrigger value="reels" className="rounded-lg text-[10px] font-black uppercase data-[state=active]:bg-indigo-600">Reels</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Aceleração Estratégica</Label>
              <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-bold">Integração Facebook</span>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-black text-[8px]">LINK ATIVO</Badge>
                </div>
                <Button onClick={handleCopyLink} className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl gap-2">
                  <Copy className="h-4 w-4" /> Copiar Link de Conversão
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview Panel */}
        <Card className="lg:col-span-2 glass-card border-white/5 bg-slate-950/40 overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-50 pointer-events-none" />
          <CardHeader className="border-b border-white/5 flex flex-row items-center justify-between pb-6 relative z-10">
            <div>
              <CardTitle className="text-lg font-bold text-white font-display">Simulador de Resultado</CardTitle>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Visualização em Tempo Real</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-400 hover:text-white hover:bg-white/5">
                <Smartphone className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-400 hover:text-white hover:bg-white/5">
                <Layout className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex items-center justify-center p-8 md:p-12 relative z-10">
            
            {/* Mockup Container */}
            <div className={cn(
              "relative transition-all duration-500 rounded-[40px] border-[8px] border-slate-900 shadow-2xl overflow-hidden bg-slate-800",
              activeFormat === 'story' || activeFormat === 'reels' ? 'aspect-[9/16] w-64' : 'aspect-square w-72'
            )}>
              
              {/* Fake UI Overlay */}
              <div className="absolute inset-0 z-20 flex flex-col justify-between p-6 pointer-events-none">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 p-[2px]">
                      <div className="h-full w-full rounded-full bg-slate-900 border-2 border-slate-900 overflow-hidden">
                        <img src="/favicon.png" className="w-full h-full object-cover opacity-80" alt="Logo" />
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-white tracking-tight">michelstravel.agency</p>
                      <p className="text-[8px] text-slate-400 font-bold">Sponsored</p>
                    </div>
                  </div>
                  <Share2 className="h-4 w-4 text-white" />
                </div>

                <div className="space-y-4">
                  <div className="bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-2xl transform transition-all group-hover:translate-y-[-5px]">
                    <p className="text-white text-[11px] font-bold leading-relaxed">{adText}</p>
                  </div>
                  <div className="h-10 w-full bg-indigo-600 rounded-xl flex items-center justify-center">
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Reserve Agora</span>
                  </div>
                </div>
              </div>

              {/* Background Mock (Simulating an image) */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-slate-800 flex items-center justify-center">
                 {selectedDeal?.imageUrl ? (
                   <img src={selectedDeal.imageUrl} className="w-full h-full object-cover opacity-60" alt="Mockup" />
                 ) : (
                   <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1570710891163-6d3b5c47248b?q=80&w=2070')] bg-cover bg-center opacity-40 mix-blend-overlay" />
                 )}
                 <div className="text-slate-700/20 font-black text-4xl rotate-45 select-none tracking-[0.5em] font-display">INSTAGRAM</div>
              </div>

              {/* Safe Zone Indicators */}
              <div className="absolute inset-0 border-x-2 border-white/5 border-dashed pointer-events-none opacity-20" />
            </div>

            {/* Float Floating Action Panel */}
            <div className="absolute bottom-8 right-8 flex flex-col gap-3">
               <Button 
                onClick={handleDownload}
                className="h-14 w-14 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-2xl flex flex-col gap-0 items-center justify-center border-4 border-slate-950 transition-transform active:scale-90"
               >
                  <Download className="h-5 w-5" />
                  <span className="text-[8px] font-black mt-1">PNG</span>
               </Button>
               <Button 
                onClick={handlePublish}
                disabled={isPublishing || !selectedDealId}
                className="h-14 w-14 rounded-full bg-violet-600 hover:bg-violet-500 text-white shadow-2xl flex flex-col gap-0 items-center justify-center border-4 border-slate-950 transition-transform active:scale-90"
               >
                  {isPublishing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  <span className="text-[8px] font-black mt-1">ADS</span>
               </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integration Analytics */}
      <Card className="glass-card border-white/5 shadow-2xl overflow-hidden group">
        <CardHeader className="border-b border-white/5 p-8 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-white font-display uppercase tracking-widest text-sm font-black">Performance Instagram Insights</CardTitle>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Métricas de Engajamento por Campanha</p>
          </div>
          <div className="flex gap-3">
             <Button variant="outline" className="rounded-xl border-white/5 bg-white/5 text-[10px] font-black uppercase text-slate-400 gap-2">
                <Facebook className="h-3.5 w-3.5" /> Business Suite
             </Button>
             <Button variant="outline" className="rounded-xl border-white/5 bg-white/5 text-[10px] font-black uppercase text-slate-400 gap-2">
                <Instagram className="h-3.5 w-3.5" /> Creator Studio
             </Button>
          </div>
        </CardHeader>
        <CardContent className="p-8">
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: "Cliques no Link", val: "1,240", change: "+12%", icon: Zap, color: "text-amber-400" },
                { label: "Alcance Estimado", val: "45.2k", change: "+8%", icon: Users, color: "text-indigo-400" },
                { label: "Conversão Direta", val: "3.4%", change: "+0.5%", icon: Rocket, color: "text-emerald-400" },
                { label: "Custo por Clique", val: "$0.42", change: "-5%", icon: Zap, color: "text-cyan-400" },
              ].map((m, i) => (
                <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                   <div className="flex items-center justify-between">
                     <m.icon className={cn("h-5 w-5", m.color)} />
                     <span className="text-[10px] font-black text-emerald-400">{m.change}</span>
                   </div>
                   <div>
                     <p className="text-2xl font-black text-white">{m.val}</p>
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{m.label}</p>
                   </div>
                </div>
              ))}
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
