import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Instagram, 
  Facebook, 
  Send, 
  Sparkles, 
  Smartphone, 
  Plane, 
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Image as ImageIcon
} from "lucide-react";
import { useAdminFeaturedDeals } from "@/hooks/use-admin";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type Platform = "instagram" | "facebook" | "whatsapp";
type Tone = "elite" | "urgent" | "relaxed" | "inspirational";

export function SocialStudio() {
  const { data: deals, isLoading: dealsLoading } = useAdminFeaturedDeals();
  const [selectedDealId, setSelectedDealId] = useState<string>("");
  const [activePlatform, setActivePlatform] = useState<Platform>("instagram");
  const [tone, setTone] = useState<Tone>("elite");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [generatedCopy, setGeneratedCopy] = useState<string>("");
  const { toast } = useToast();

  const [activeMode, setActiveMode] = useState<"copy" | "banner">("copy");
  const [bannerTemplate, setBannerTemplate] = useState<"modern" | "classic" | "luxury">("modern");
  const [generatedRules, setGeneratedRules] = useState<string>("");

  const selectedDeal = deals?.find(d => d.id === selectedDealId);

  const generateAiCopy = async () => {
    if (!selectedDealId) {
      toast({
        title: "Atenção",
        description: "Selecione uma oferta para gerar o conteúdo.",
        variant: "destructive",
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
          platform: activePlatform,
          tone: tone,
          mode: activeMode // Pass mode to AI for context
        }),
      });

      if (!response.ok) throw new Error("Failed to generate AI content");
      
      const data = await response.json();
      
      if (activeMode === "copy") {
        setGeneratedCopy(data.copy);
      } else {
        // AI summarizes rules for the banner
        setGeneratedRules(data.copy.split("\n")[0] || "Sujeito a disponibilidade. Taxas inclusas.");
        setGeneratedCopy(data.copy);
      }
      
      toast({
        title: `Conteúdo ${activeMode === "copy" ? "de Legenda" : "do Banner"} Pronto`,
        description: "A Mia refinou os detalhes e regras com precisão.",
      });
    } catch (error) {
      toast({
        title: "Erro na Geração",
        description: "Não foi possível conectar com o motor de IA da Mia.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const publishPost = async () => {
    if (!selectedDeal || !generatedCopy) {
      toast({
        title: "Erro",
        description: "Gere o conteúdo antes de publicar.",
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
          platform: activePlatform,
          copy: generatedCopy,
          imageUrl: selectedDeal.imageUrl,
          rules: generatedRules
        }),
      });

      if (!response.ok) throw new Error("Publishing failed");
      
      const data = await response.json();
      
      toast({
        title: "Merchandise Publicado!",
        description: `Post ID: ${data.postId}. Status: ${data.status}.`,
      });
    } catch (error) {
      toast({
        title: "Erro na Publicação",
        description: "Falha ao enviar para a rede social.",
        variant: "destructive"
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Left Column: Controls */}
      <div className="lg:col-span-7 space-y-6">
        <Card className="bg-black/40 border-white/10 backdrop-blur-xl overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                    Estúdio de Merchandise AI
                  </CardTitle>
                  <CardDescription className="text-zinc-400">
                    Gere banners e legendas com precisão de APIs.
                  </CardDescription>
                </div>
              </div>
              <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
                <Button 
                  size="sm" 
                  variant={activeMode === "copy" ? "secondary" : "ghost"}
                  onClick={() => setActiveMode("copy")}
                  className="h-8 text-xs font-bold"
                >
                  Legendas
                </Button>
                <Button 
                  size="sm" 
                  variant={activeMode === "banner" ? "secondary" : "ghost"}
                  onClick={() => setActiveMode("banner")}
                  className="h-8 text-xs font-bold"
                >
                  Banners
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 relative">
            {/* Deal Selection */}
            <div className="space-y-3">
              <Label className="text-xs uppercase tracking-widest text-zinc-500 font-bold flex justify-between">
                <span>1. Selecione a Oferta Ativa</span>
                {selectedDeal && <span className="text-purple-400">Sincronizado com Duffel/Stripe</span>}
              </Label>
              <div className="grid grid-cols-1 gap-3">
                {dealsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                  </div>
                ) : (
                  deals?.slice(0, 3).map((deal) => (
                    <button
                      key={deal.id}
                      onClick={() => setSelectedDealId(deal.id)}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-xl border transition-all duration-300",
                        selectedDealId === deal.id
                          ? "bg-purple-600/20 border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.15)]"
                          : "bg-white/5 border-white/5 hover:bg-white/10"
                      )}
                    >
                      <div className="flex items-center gap-4 text-left">
                        <div className={cn(
                          "p-2 rounded-full",
                          selectedDealId === deal.id ? "bg-purple-500" : "bg-zinc-800"
                        )}>
                          <Plane className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-white">{deal.originCity} → {deal.destinationCity}</p>
                          <p className="text-xs text-zinc-400">R$ {deal.price} • {deal.airline} • {deal.cabinClass}</p>
                        </div>
                      </div>
                      {selectedDealId === deal.id && <CheckCircle2 className="w-5 h-5 text-purple-400" />}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Banner specific settings */}
            {activeMode === "banner" && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="space-y-3">
                  <Label className="text-xs uppercase tracking-widest text-zinc-500 font-bold">
                    Estilo e Paleta de Cores
                  </Label>
                  <div className="flex gap-2">
                    {[
                      { name: "modern", color: "bg-zinc-800" },
                      { name: "luxury", color: "bg-amber-600" },
                      { name: "sunset", color: "bg-orange-600" },
                      { name: "midnight", color: "bg-indigo-900" }
                    ].map((style) => (
                      <button
                        key={style.name}
                        onClick={() => setBannerTemplate(style.name as any)}
                        className={cn(
                          "w-10 h-10 rounded-full border-2 transition-all",
                          style.color,
                          bannerTemplate === style.name ? "border-white scale-110 shadow-lg shadow-white/20" : "border-white/10"
                        )}
                        title={style.name}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs uppercase tracking-widest text-zinc-500 font-bold">
                    Editor de Regras (Manual)
                  </Label>
                  <Input 
                    value={generatedRules} 
                    onChange={(e) => setGeneratedRules(e.target.value)}
                    placeholder="Ex: Válido para voos em Setembro..."
                    className="bg-white/5 border-white/10 text-white text-xs h-10"
                  />
                </div>
              </div>
            )}

            {/* AI Settings */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-xs uppercase tracking-widest text-zinc-500 font-bold">
                  2. Tom de Voz da Mia
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["elite", "urgent", "relaxed", "inspirational"] as Tone[]).map((t) => (
                    <Button
                      key={t}
                      variant="outline"
                      onClick={() => setTone(t)}
                      className={cn(
                        "h-10 text-xs capitalize transition-all",
                        tone === t ? "bg-white text-black border-white" : "bg-transparent border-white/10 text-zinc-400 hover:text-white"
                      )}
                    >
                      {t}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-xs uppercase tracking-widest text-zinc-500 font-bold">
                  3. Destino do Post
                </Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setActivePlatform("instagram")}
                    className={cn(
                      "flex-1 gap-2",
                      activePlatform === "instagram" ? "bg-pink-600/20 border-pink-500 text-pink-400" : "bg-transparent border-white/10 text-zinc-400"
                    )}
                  >
                    <Instagram className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setActivePlatform("whatsapp")}
                    className={cn(
                      "flex-1 gap-2",
                      activePlatform === "whatsapp" ? "bg-green-600/20 border-green-500 text-green-400" : "bg-transparent border-white/10 text-zinc-400"
                    )}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <Button 
              onClick={generateAiCopy} 
              disabled={isGenerating || !selectedDealId}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold h-12 shadow-lg shadow-purple-500/20"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 mr-2" />}
              {activeMode === "copy" ? "Gerar Legenda de Elite" : "Sincronizar Regras e Banner"}
            </Button>
          </CardContent>
        </Card>

        {/* Output Card */}
        <AnimatePresence>
          {generatedCopy && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <Card className="bg-zinc-900 border-white/5">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-zinc-500">
                      {activeMode === "copy" ? "Sugestividade Mia" : "Copy de Suporte (Legenda)"}
                    </Label>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="h-8 text-zinc-400" onClick={() => {
                        navigator.clipboard.writeText(activeMode === "copy" ? generatedCopy : generatedRules);
                        toast({ description: "Copiado para a área de transferência." });
                      }}>
                        <Copy className="w-3 h-3 mr-2" /> Copiar
                      </Button>
                    </div>
                  </div>
                  <div className="p-4 bg-black/50 rounded-xl border border-white/5 font-mono text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                    {generatedCopy}
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-4">
                <Button 
                  onClick={publishPost}
                  disabled={isPublishing}
                  className="flex-1 bg-white text-black hover:bg-zinc-200 font-bold h-12"
                >
                  {isPublishing ? <Loader2 className="w-5 h-5 animate-spin" /> : <TrendingUp className="w-5 h-5 mr-2" />}
                  Publicar Merchandise
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 border-white/10 text-white font-bold h-12"
                  onClick={() => {
                    toast({ title: "Exportando Arte...", description: "Renderizando banner em alta resolução." });
                  }}
                >
                  <ImageIcon className="w-5 h-5 mr-2" /> Baixar Arte
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right Column: Premium Preview */}
      <div className="lg:col-span-5 relative">
        <div className="sticky top-8">
          <div className="relative mx-auto w-[300px] h-[600px] bg-zinc-900 rounded-[3rem] border-[8px] border-zinc-800 shadow-2xl overflow-hidden ring-4 ring-zinc-800/50">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-zinc-800 rounded-b-2xl z-20 flex items-center justify-center">
              <div className="w-12 h-1 bg-zinc-700 rounded-full" />
            </div>

            {/* Content Area */}
            <div className="h-full w-full bg-white text-black pt-10 flex flex-col">
              {/* IG Header */}
              <div className="px-4 py-2 flex items-center justify-between border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 p-[2px]">
                    <div className="w-full h-full rounded-full bg-white border-2 border-white overflow-hidden">
                      <div className="w-full h-full bg-zinc-200 flex items-center justify-center">
                        <Plane className="w-3 h-3 text-zinc-500" />
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-bold">michelstravel</span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400 rotate-90" />
              </div>

              {/* Main Image View / Banner Generator */}
              <div className={cn(
                "aspect-square w-full relative group overflow-hidden",
                activeMode === "banner" && "bg-black"
              )}>
                {activeMode === "banner" && selectedDeal ? (
                  <div className="w-full h-full p-4 flex flex-col justify-between text-white relative">
                    <div className="absolute inset-0 z-0">
                      {selectedDeal.imageUrl ? (
                        <img src={selectedDeal.imageUrl} className="w-full h-full object-cover opacity-60" />
                      ) : (
                        <div className={cn(
                          "w-full h-full transition-colors duration-500",
                          bannerTemplate === "modern" ? "bg-zinc-800" :
                          bannerTemplate === "luxury" ? "bg-amber-900" :
                          bannerTemplate === "sunset" ? "bg-orange-900" :
                          "bg-indigo-950"
                        )} />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                    </div>
                    
                    <div className="relative z-10">
                      <div className="flex justify-between items-start">
                        <span className={cn(
                          "text-black px-2 py-0.5 text-[8px] font-black uppercase tracking-tighter",
                          bannerTemplate === "luxury" ? "bg-amber-400" : "bg-white"
                        )}>
                          Michels Travel Elite
                        </span>
                        <div className="text-right">
                          <p className="text-[10px] font-bold leading-none">{selectedDeal.airline}</p>
                          <p className="text-[8px] opacity-60 uppercase">{selectedDeal.cabinClass}</p>
                        </div>
                      </div>
                    </div>

                    <div className="relative z-10">
                      <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/60 mb-1">Próxima Parada</p>
                      <p className="text-3xl font-black italic tracking-tighter uppercase leading-none break-words">
                        {selectedDeal.destinationCity}
                      </p>
                      <div className="mt-4 flex items-end gap-2">
                        <div className="flex flex-col">
                          <span className="text-[8px] font-bold uppercase opacity-60">A partir de</span>
                          <span className={cn(
                            "text-2xl font-black tabular-nums leading-none",
                            bannerTemplate === "luxury" && "text-amber-400",
                            bannerTemplate === "sunset" && "text-orange-400"
                          )}>R$ {selectedDeal.price}</span>
                        </div>
                        <div className={cn(
                          "px-2 py-1 rounded-sm text-[8px] font-bold animate-pulse",
                          bannerTemplate === "luxury" ? "bg-amber-500" : "bg-purple-600"
                        )}>
                          OFERTA IA
                        </div>
                      </div>
                      
                      {/* Complex Rules Box generated by IA */}
                      <div className="mt-4 p-2 bg-white/10 backdrop-blur-md rounded border border-white/10">
                        <p className="text-[7px] leading-tight font-medium uppercase tracking-tight">
                          {generatedRules || "Condições: Tarifa sujeita a disponibilidade no momento da reserva."}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full">
                    {selectedDeal?.imageUrl ? (
                      <img src={selectedDeal.imageUrl} alt="Deal" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-zinc-100 to-zinc-200">
                        <ImageIcon className="w-12 h-12 text-zinc-300 mb-4" />
                        <p className="text-zinc-400 font-medium">Selecione uma oferta para visualizar</p>
                      </div>
                    )}
                    
                    {selectedDeal && (
                      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white">
                        <p className="text-2xl font-black italic tracking-tighter uppercase leading-none">
                          {selectedDeal.destinationCity}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="bg-purple-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Oferta Elite</span>
                          <span className="text-sm font-bold">A partir de R$ {selectedDeal.price}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* IG Actions */}
              <div className="p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex gap-4">
                    <TrendingUp className="w-5 h-5" />
                    <Send className="w-5 h-5" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold">9.214 visualizações</p>
                  <p className="text-[10px] leading-tight">
                    <span className="font-bold">michelstravel</span>{" "}
                    {generatedCopy || "Sua copy gerada pela Mia aparecerá aqui..."}
                  </p>
                  <p className="text-[8px] text-zinc-400 uppercase font-medium">Original de Michels Travel Studio</p>
                </div>
              </div>

              {/* IG Bottom Nav (Static) */}
              <div className="mt-auto border-t border-zinc-100 px-8 py-3 flex justify-between items-center bg-white/80 backdrop-blur-md">
                <div className="w-6 h-6 rounded-md border-2 border-black" />
                <div className="w-6 h-6 rounded-md bg-zinc-200" />
              </div>
            </div>
          </div>
          
          {/* AI Activity Pulse */}
          {isGenerating && (
            <div className="absolute -left-12 top-1/2 p-4 bg-purple-600 rounded-full shadow-2xl animate-ping opacity-20">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
