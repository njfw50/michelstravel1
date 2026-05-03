import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Smartphone, Laptop, Tablet, Save, RefreshCw, Eye, Image as ImageIcon, Megaphone, Layout } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";

export function MobileConfigurator() {
  const { t } = useI18n();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [previewScale, setPreviewScale] = useState(1);

  // Simulated mobile data (in real app, this would be in site_settings)
  const [config, setConfig] = useState({
    heroTitle: "Para onde deseja viajar?",
    heroSub: "Bem-vindo novamente. Visão atualizada",
    promoBanner: "Ofertas Exclusivas Mobile - 15% OFF",
    cardTitle1: "Destinos Premium",
    cardDesc1: "Explore o melhor do Brasil e do Mundo.",
    imageUrl1: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&q=80&w=800",
  });

  const handleSave = () => {
    toast({
      title: "Configuração Salva",
      description: "A interface mobile foi atualizada com sucesso.",
    });
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-in fade-in duration-500">
      {/* Configuration Panel */}
      <div className="xl:col-span-5 space-y-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Editor Visual Mobile</h2>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Configure a experiência Samsung S24</p>
          </div>
          <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 rounded-2xl px-6">
            <Save className="h-4 w-4" /> Salvar Alterações
          </Button>
        </div>

        <Card className="glass-card border-white/5 overflow-hidden">
          <CardHeader className="border-b border-white/5 bg-white/5">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
              <Layout className="h-4 w-4" /> Elementos da Home
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
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Subtítulo</Label>
              <Input 
                value={config.heroSub} 
                onChange={(e) => setConfig({...config, heroSub: e.target.value})}
                className="bg-slate-900/50 border-white/10 rounded-xl text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Banner de Propaganda</Label>
              <Textarea 
                value={config.promoBanner} 
                onChange={(e) => setConfig({...config, promoBanner: e.target.value})}
                className="bg-slate-900/50 border-white/10 rounded-xl text-white min-h-[80px]"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/5 overflow-hidden">
          <CardHeader className="border-b border-white/5 bg-white/5">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
              <Megaphone className="h-4 w-4" /> Card de Destaque 1
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Título do Card</Label>
              <Input 
                value={config.cardTitle1} 
                onChange={(e) => setConfig({...config, cardTitle1: e.target.value})}
                className="bg-slate-900/50 border-white/10 rounded-xl text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">URL da Imagem</Label>
              <div className="flex gap-2">
                <Input 
                  value={config.imageUrl1} 
                  onChange={(e) => setConfig({...config, imageUrl1: e.target.value})}
                  className="bg-slate-900/50 border-white/10 rounded-xl text-white font-mono text-[10px]"
                />
                <Button variant="outline" size="icon" className="shrink-0 rounded-xl border-white/10 text-slate-400 hover:text-white">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Samsung S24 Ultra Simulator */}
      <div className="xl:col-span-7 flex flex-col items-center justify-start py-4">
        <div className="mb-6 flex items-center gap-4 bg-slate-900/80 p-2 rounded-2xl border border-white/10">
          <Button variant="ghost" size="sm" className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10">Samsung S24 Ultra</Button>
          <Button variant="ghost" size="sm" className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white">iPhone 15 Pro</Button>
          <div className="h-4 w-[1px] bg-white/10 mx-2" />
          <div className="flex items-center gap-2 px-2">
            <span className="text-[9px] font-black text-slate-600 uppercase">Zoom</span>
            <input 
              type="range" min="0.5" max="1.2" step="0.1" value={previewScale} 
              onChange={(e) => setPreviewScale(parseFloat(e.target.value))}
              className="w-24 accent-indigo-500"
            />
          </div>
        </div>

        {/* The Device Frame */}
        <div className="relative" style={{ transform: `scale(${previewScale})`, transformOrigin: 'top center' }}>
          {/* Samsung Shell */}
          <div className="relative w-[380px] h-[780px] bg-slate-950 rounded-[50px] border-[12px] border-slate-800 shadow-[0_0_80px_rgba(0,0,0,0.8),inset_0_0_10px_rgba(255,255,255,0.1)] overflow-hidden">
            {/* Camera Hole */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-900 rounded-full border-2 border-slate-800/50 z-50 shadow-inner" />
            
            {/* Screen Content */}
            <div className="w-full h-full bg-slate-950 overflow-y-auto scrollbar-none flex flex-col">
              {/* Simulated App Header */}
              <div className="pt-12 pb-6 px-6 bg-slate-950 sticky top-0 z-40 flex items-center justify-between">
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-[8px] font-black text-white">MT</div>
                <div className="flex gap-3">
                  <div className="h-8 w-8 bg-white/5 border border-white/10 rounded-lg" />
                  <div className="h-8 w-8 bg-blue-600 rounded-lg" />
                </div>
              </div>

              {/* Simulated Hero */}
              <div className="px-6 py-8 space-y-2">
                <h1 className="text-3xl font-black text-white leading-tight">{config.heroTitle}</h1>
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{config.heroSub}</p>
              </div>

              {/* Simulated Search Box */}
              <div className="px-6 mb-8">
                <div className="p-4 bg-slate-900/60 border border-white/10 rounded-2xl shadow-xl flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-bold">Pesquise destinos...</span>
                  <RefreshCw className="h-4 w-4 text-slate-600" />
                </div>
              </div>

              {/* Simulated Promo Banner */}
              <div className="px-6 mb-8">
                <div className="p-5 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-3xl shadow-lg relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 blur-2xl rounded-full -mr-10 -mt-10" />
                  <p className="text-xs font-black text-white uppercase tracking-wider relative z-10 leading-relaxed">
                    {config.promoBanner}
                  </p>
                  <Button size="sm" className="mt-4 bg-white text-indigo-600 rounded-xl font-black text-[9px] uppercase px-4 h-8 relative z-10">
                    Aproveitar Agora
                  </Button>
                </div>
              </div>

              {/* Simulated Cards */}
              <div className="px-6 space-y-6 pb-20">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{config.cardTitle1}</h3>
                <div className="group relative rounded-3xl overflow-hidden aspect-[4/5] border border-white/5 shadow-2xl">
                  <img src={config.imageUrl1} alt="Destiny" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-6 space-y-2 w-full">
                    <h4 className="text-xl font-black text-white">Newark to GRU</h4>
                    <p className="text-xs text-slate-400 line-clamp-2">{config.cardDesc1}</p>
                    <div className="pt-2 flex items-center justify-between">
                       <span className="text-emerald-400 font-black text-lg">$642</span>
                       <Button size="sm" className="rounded-xl bg-white/10 backdrop-blur-md text-white border border-white/10 text-[9px] font-black uppercase">Reservar</Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Bottom Bar */}
              <div className="fixed bottom-0 inset-x-0 h-16 bg-slate-950/90 backdrop-blur-xl border-t border-white/5 flex items-center justify-around px-4">
                <div className="h-10 w-10 flex items-center justify-center text-blue-500"><Smartphone className="h-5 w-5" /></div>
                <div className="h-10 w-10 flex items-center justify-center text-slate-600"><Smartphone className="h-5 w-5" /></div>
                <div className="h-10 w-10 flex items-center justify-center text-slate-600"><Smartphone className="h-5 w-5" /></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
