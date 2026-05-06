import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  useAdminFeaturedDeals, 
  useCreateFeaturedDeal, 
  useUpdateFeaturedDeal, 
  useDeleteFeaturedDeal 
} from "@/hooks/use-admin";
import { 
  Plus, Trash2, Edit2, Plane, MapPin, 
  DollarSign, Image as ImageIcon, Save, 
  X, RefreshCw, Sparkles 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function FeaturedDealsManager() {
  const { data: deals = [], isLoading } = useAdminFeaturedDeals();
  const createDeal = useCreateFeaturedDeal();
  const updateDeal = useUpdateFeaturedDeal();
  const deleteDeal = useDeleteFeaturedDeal();
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>({
    origin: "",
    originCity: "",
    destination: "",
    destinationCity: "",
    price: "",
    currency: "USD",
    headline: "",
    description: "",
    imageUrl: "",
    isActive: true
  });

  const resetForm = () => {
    setForm({
      origin: "",
      originCity: "",
      destination: "",
      destinationCity: "",
      price: "",
      currency: "USD",
      headline: "",
      description: "",
      imageUrl: "",
      isActive: true
    });
    setEditingId(null);
    setIsEditing(false);
  };

  const handleEdit = (deal: any) => {
    setForm({
      ...deal,
      price: String(deal.price)
    });
    setEditingId(deal.id);
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await updateDeal.mutateAsync({ id: editingId, data: form });
        toast({ title: "Oferta Atualizada", description: "As alterações foram salvas com sucesso." });
      } else {
        await createDeal.mutateAsync(form);
        toast({ title: "Oferta Criada", description: "A nova promoção já está disponível na home." });
      }
      resetForm();
    } catch (err) {
      toast({ title: "Erro na Operação", description: "Ocorreu um erro ao salvar a oferta.", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover esta oferta?")) return;
    try {
      await deleteDeal.mutateAsync(id);
      toast({ title: "Oferta Removida", description: "O card foi retirado da exposição pública." });
    } catch (err) {
      toast({ title: "Erro", description: "Não foi possível remover a oferta.", variant: "destructive" });
    }
  };

  if (isLoading) return <div className="h-96 animate-pulse bg-white/5 rounded-[32px]" />;

  return (
    <Card className="glass-card border-white/5 overflow-hidden shadow-2xl">
      <CardHeader className="p-8 border-b border-white/5 bg-gradient-to-br from-cyan-500/10 to-transparent flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl font-bold text-white font-display uppercase tracking-tight">Gerente de Ofertas</CardTitle>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Curadoria de Cards na Página Principal</p>
        </div>
        <Button 
          onClick={() => setIsEditing(true)} 
          className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl px-6 gap-2"
          disabled={isEditing}
        >
          <Plus className="h-4 w-4" />
          Nova Oferta
        </Button>
      </CardHeader>
      
      <CardContent className="p-8">
        {isEditing && (
          <div className="mb-12 p-8 rounded-[32px] border border-indigo-500/20 bg-indigo-500/5 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-400" />
                {editingId ? "Editar Promoção" : "Configurar Novo Card"}
              </h3>
              <Button variant="ghost" size="icon" onClick={resetForm} className="text-slate-500 hover:text-white rounded-full">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Origem (IATA)</Label>
                <Input value={form.origin} onChange={(e) => setForm({...form, origin: e.target.value.toUpperCase()})} className="bg-slate-950/60 border-white/5 rounded-xl h-12" placeholder="GRU" maxLength={3} />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Cidade Origem</Label>
                <Input value={form.originCity} onChange={(e) => setForm({...form, originCity: e.target.value})} className="bg-slate-950/60 border-white/5 rounded-xl h-12" placeholder="São Paulo" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Destino (IATA)</Label>
                <Input value={form.destination} onChange={(e) => setForm({...form, destination: e.target.value.toUpperCase()})} className="bg-slate-950/60 border-white/5 rounded-xl h-12" placeholder="LIS" maxLength={3} />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Cidade Destino</Label>
                <Input value={form.destinationCity} onChange={(e) => setForm({...form, destinationCity: e.target.value})} className="bg-slate-950/60 border-white/5 rounded-xl h-12" placeholder="Lisboa" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Preço (Base)</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm({...form, price: e.target.value})} className="bg-slate-950/60 border-white/5 rounded-xl h-12" placeholder="450.00" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Imagem (URL Unsplash)</Label>
                <Input value={form.imageUrl} onChange={(e) => setForm({...form, imageUrl: e.target.value})} className="bg-slate-950/60 border-white/5 rounded-xl h-12" placeholder="https://images.unsplash.com/..." />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Headline Chamativo</Label>
              <Input value={form.headline} onChange={(e) => setForm({...form, headline: e.target.value})} className="bg-slate-950/60 border-white/5 rounded-xl h-12" placeholder="Verão em Lisboa: Passagens de Elite" />
            </div>

            <div className="pt-4 flex gap-3">
              <Button onClick={handleSave} className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold">
                {createDeal.isPending || updateDeal.isPending ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                {editingId ? "Salvar Alterações" : "Publicar Oferta"}
              </Button>
              <Button variant="ghost" onClick={resetForm} className="h-12 px-8 rounded-xl border border-white/5 text-slate-400">Cancelar</Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {deals.length === 0 ? (
            <div className="col-span-full py-20 text-center border border-dashed border-white/10 rounded-[32px]">
              <Plane className="h-12 w-12 text-slate-800 mx-auto mb-4" />
              <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Nenhuma oferta ativa no momento</p>
            </div>
          ) : (
            deals.map((deal: any) => (
              <div key={deal.id} className="group relative rounded-[28px] border border-white/5 bg-white/5 overflow-hidden hover:border-indigo-500/30 transition-all duration-500">
                <div className="h-32 w-full relative overflow-hidden">
                  <img src={deal.imageUrl || "https://images.unsplash.com/photo-1436491865332-7a61a109c0f2?auto=format&fit=crop&q=80&w=800"} className="w-full h-full object-cover opacity-40 group-hover:scale-110 transition-transform duration-700" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent" />
                  <Badge className="absolute top-4 right-4 bg-indigo-600/80 backdrop-blur-md border-white/10 font-black text-[10px]">
                    {deal.origin} → {deal.destination}
                  </Badge>
                </div>
                <div className="p-6">
                  <h4 className="text-white font-bold text-lg mb-1 truncate">{deal.headline || "Oferta sem Título"}</h4>
                  <div className="flex items-center gap-4 text-[11px] font-bold text-slate-500 uppercase tracking-tight mb-4">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-indigo-400" /> {deal.destinationCity}</span>
                    <span className="flex items-center gap-1"><DollarSign className="h-3 w-3 text-emerald-400" /> ${deal.price}</span>
                  </div>
                  <div className="flex gap-2 border-t border-white/5 pt-4">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(deal)} className="flex-1 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-indigo-300 font-bold text-[10px] uppercase gap-2">
                      <Edit2 className="h-3.5 w-3.5" /> Editar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(deal.id)} className="h-10 w-10 rounded-xl bg-rose-500/5 hover:bg-rose-500/20 text-rose-500">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
