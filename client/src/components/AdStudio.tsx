import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Instagram, Facebook, Sparkles, Image as ImageIcon, Type, 
  Send, Copy, Share2, Palette, Smartphone, Layout, 
  Eye, Download, Wand2, Zap, Rocket, Target, Globe, Users
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function AdStudio() {
  const { toast } = useToast();
  const [adText, setAdText] = useState("Saindo de Newark para o Brasil? Temos as melhores tarifas!");
  const [activeFormat, setActiveFormat] = useState<"story" | "post" | "reels">("story");
  const [accentColor, setAccentColor] = useState("#4f46e5");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText("https://michelstravel.agency/search?ref=ad_insta");
    toast({
      title: "Link Copiado",
      description: "O link de conversão foi copiado para sua área de transferência.",
    });
  };

  const handleMagicFill = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setAdText("✨ Viagem para o Brasil com atendimento em português. Reserve agora e pague em 12x!");
      setIsGenerating(false);
      toast({
        title: "Inteligência Ativada",
        description: "Copywriter IA gerou um texto de alta conversão.",
      });
    }, 800);
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
            
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Objetivo da Campanha</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="h-12 rounded-xl bg-white/5 border-white/10 text-xs font-bold text-white hover:bg-white/10">
                  <Target className="mr-2 h-4 w-4 text-emerald-400" /> Conversão
                </Button>
                <Button variant="outline" className="h-12 rounded-xl bg-white/5 border-white/10 text-xs font-bold text-white hover:bg-white/10">
                  <Globe className="mr-2 h-4 w-4 text-indigo-400" /> Alcance
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
                  disabled={isGenerating}
                  className="h-6 text-[9px] font-black uppercase tracking-tighter text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10"
                >
                  <Wand2 className="mr-1 h-3 w-3" /> Sugestão IA
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
              <Tabs defaultValue="story" onValueChange={(v) => setActiveFormat(v as any)} className="w-full">
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
            <div className={`relative transition-all duration-500 ${activeFormat === 'story' ? 'aspect-[9/16] w-64' : 'aspect-square w-72'} rounded-[40px] border-[8px] border-slate-900 shadow-2xl overflow-hidden bg-slate-800`}>
              
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
                 <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1570710891163-6d3b5c47248b?q=80\u0026w=2070')] bg-cover bg-center opacity-40 mix-blend-overlay" />
                 <div className="text-slate-700/20 font-black text-4xl rotate-45 select-none tracking-[0.5em] font-display">INSTAGRAM</div>
              </div>

              {/* Safe Zone Indicators (Hidden usually, shown on hover/active) */}
              <div className="absolute inset-0 border-x-2 border-white/5 border-dashed pointer-events-none opacity-20" />
            </div>

            {/* Float Floating Action Panel */}
            <div className="absolute bottom-8 right-8 flex flex-col gap-3">
               <Button className="h-14 w-14 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-2xl flex flex-col gap-0 items-center justify-center border-4 border-slate-950">
                  <Download className="h-5 w-5" />
                  <span className="text-[8px] font-black mt-1">PNG</span>
               </Button>
               <Button className="h-14 w-14 rounded-full bg-violet-600 hover:bg-violet-500 text-white shadow-2xl flex flex-col gap-0 items-center justify-center border-4 border-slate-950">
                  <Send className="h-5 w-5" />
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
                { label: "Custo por Clique", val: "$0.42", change: "-5%", icon: DollarSign, color: "text-cyan-400" },
              ].map((m, i) => (
                <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-3">
                   <div className="flex items-center justify-between">
                     <m.icon className={`h-5 w-5 ${m.color}`} />
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

function DollarSign(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" x2="12" y1="2" y2="22" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
