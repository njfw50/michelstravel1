import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, Users, DollarSign, Search, ExternalLink, Calendar, 
  MapPin, Tag, MessageCircle, MoreHorizontal, PhoneCall, 
  Save, Star, Crown, Info, ShieldCheck, Mail, Plane
} from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogDescription, DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog"; 
import { Textarea } from "@/components/ui/textarea";

import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export function AdminCustomerInsights() {
  const [customerSearch, setCustomerSearch] = useState("");
  const [transactionSearch, setTransactionSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [notes, setNotes] = useState("");
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: customers, isLoading: loadingCustomers } = useQuery<any[]>({
    queryKey: ["/api/admin/customers"],
  });

  const { data: transactions, isLoading: loadingTransactions } = useQuery<any[]>({
    queryKey: ["/api/admin/transactions"],
  });

  const updateCustomerMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string, notes: string }) => {
      const res = await apiRequest('PATCH', `/api/admin/customers/${id}`, { notes });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/customers"] });
      toast({
        title: "Perfil Atualizado",
        description: "Notas do cliente foram salvas com sucesso.",
      });
      setSelectedCustomer(null);
    }
  });

  const filteredCustomers = customers?.filter(c => 
    c.fullName?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.email?.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const filteredTransactions = transactions?.filter(t => 
    t.bookingId?.toString().includes(transactionSearch) ||
    t.status?.toLowerCase().includes(transactionSearch.toLowerCase())
  );

  const openCustomerProfile = (customer: any) => {
    setSelectedCustomer(customer);
    setNotes(customer.notes || "");
  };

  const getCustomerTier = (bookings: number) => {
    if (bookings >= 5) return { label: "PLATINUM", color: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30", icon: Crown };
    if (bookings >= 3) return { label: "VIP GOLD", color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: Star };
    return { label: "NEW LEAD", color: "bg-slate-500/20 text-slate-400 border-slate-500/30", icon: Users };
  };

  return (
    <div className="space-y-8">
      {/* Page Header Area */}
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.1)]">
              <Users className="h-5 w-5 text-indigo-400" />
            </div>
            <h2 className="text-3xl font-black tracking-tight text-white font-display uppercase">Intelligence CRM</h2>
          </div>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Arquitetura de dados orientada ao cliente 360°</p>
        </div>
      </div>

      <Tabs defaultValue="crm" className="w-full">
        <TabsList className="bg-slate-900/40 backdrop-blur-md p-1.5 border border-white/5 rounded-2xl max-w-[420px] mb-8">
          <TabsTrigger value="crm" className="flex items-center gap-2 px-8 py-3 rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all font-black text-[10px] uppercase tracking-widest">
            <Users className="h-4 w-4" />
            Central de Clientes
          </TabsTrigger>
          <TabsTrigger value="finance" className="flex items-center gap-2 px-8 py-3 rounded-xl data-[state=active]:bg-cyan-600 data-[state=active]:text-white transition-all font-black text-[10px] uppercase tracking-widest">
            <DollarSign className="h-4 w-4" />
            Ledger Financeiro
          </TabsTrigger>
        </TabsList>

        <TabsContent value="crm" className="mt-0 space-y-6">
          <Card className="bg-slate-900/40 backdrop-blur-xl border-white/5 shadow-2xl overflow-hidden rounded-[32px]">
            <CardHeader className="flex flex-row items-center justify-between p-8 border-b border-white/5">
              <div className="space-y-1">
                <CardTitle className="text-xl font-black text-white tracking-tight uppercase">Perfis Unificados</CardTitle>
                <CardDescription className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Rastreamento inteligente de visitantes e LTV</CardDescription>
              </div>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <Input
                  placeholder="Pesquisar por nome ou e-mail..."
                  className="pl-12 h-12 w-80 bg-slate-950/40 border-white/10 rounded-2xl focus:border-indigo-500/50 focus:ring-indigo-500/20 text-white placeholder:text-slate-600 font-medium"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loadingCustomers ? (
                <div className="flex justify-center p-32">
                  <Loader2 className="h-12 w-12 animate-spin text-indigo-500" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-950/20">
                      <TableRow className="hover:bg-transparent border-white/5">
                        <TableHead className="text-slate-500 font-black py-6 px-8 text-[10px] uppercase tracking-widest">CLIENTE</TableHead>
                        <TableHead className="text-slate-500 font-black py-6 px-8 text-[10px] uppercase tracking-widest text-center">STATUS / TIER</TableHead>
                        <TableHead className="text-slate-500 font-black py-6 px-8 text-[10px] uppercase tracking-widest">LOCALIZAÇÃO</TableHead>
                        <TableHead className="text-slate-500 font-black py-6 px-8 text-[10px] uppercase tracking-widest">LTV (ESTIMADO)</TableHead>
                        <TableHead className="text-right text-slate-500 font-black py-6 px-8 text-[10px] uppercase tracking-widest">AÇÕES</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCustomers?.map((c) => {
                        const tier = getCustomerTier(c.totalBookings || 0);
                        return (
                          <TableRow key={c.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group cursor-pointer" onClick={() => openCustomerProfile(c)}>
                            <TableCell className="py-6 px-8">
                              <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5 flex items-center justify-center text-white font-black text-sm shadow-xl group-hover:scale-105 transition-transform">
                                  {c.fullName ? c.fullName.charAt(0) : "G"}
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-black text-white text-sm tracking-tight opacity-90 group-hover:opacity-100">{c.fullName || "Visitante Anônimo"}</span>
                                  <span className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-tighter">{c.email || "Sem e-mail vinculado"}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-6 px-8 text-center">
                               <Badge className={`text-[9px] font-black uppercase tracking-[0.2em] px-4 py-1 rounded-xl border ${tier.color} flex items-center gap-2 justify-center w-fit mx-auto`}>
                                 <tier.icon className="h-3 w-3" />
                                 {tier.label}
                               </Badge>
                            </TableCell>
                            <TableCell className="py-6 px-8">
                              <div className="flex items-center gap-2 text-slate-400 font-bold text-xs">
                                <MapPin className="h-3.5 w-3.5 text-slate-600" />
                                {c.region || "Global Access"}
                              </div>
                            </TableCell>
                            <TableCell className="py-6 px-8">
                              <div className="flex flex-col">
                                <span className="text-sm font-black text-white">${((c.totalBookings || 0) * 850).toLocaleString()}</span>
                                <span className="text-[9px] font-bold text-indigo-400/60 uppercase mt-0.5 tracking-widest">{c.totalBookings || 0} CONVERSÕES</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-6 px-8 text-right">
                               <div className="flex items-center justify-end gap-2">
                                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl border border-white/5 hover:bg-indigo-500/10 text-slate-500 hover:text-indigo-400">
                                    <MessageCircle className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl border border-white/5 hover:bg-white/5 text-slate-500 hover:text-white">
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                               </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finance" className="mt-0 space-y-8">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { label: "Receita Total Bruta", value: `$${transactions?.filter(t => t.status === 'succeeded').reduce((acc, t) => acc + parseFloat(t.amount || "0"), 0).toLocaleString()}`, icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
              { label: "Taxa de Conversão", value: `${transactions?.length ? Math.round((transactions.filter(t => t.status === 'succeeded').length / transactions.length) * 100) : 0}%`, icon: Tag, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
              { label: "Transações Pendentes", value: transactions?.filter(t => t.status === 'pending').length, icon: Calendar, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
            ].map((stat, i) => (
              <Card key={i} className="bg-slate-900/40 backdrop-blur-xl border-white/5 shadow-xl hover:translate-y-[-4px] transition-all duration-300 rounded-[24px] p-8 border">
                <div className="flex justify-between items-start mb-6">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</p>
                  <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.border} shadow-lg`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
                <div className="text-4xl font-black text-white font-display tracking-tight leading-none">{stat.value}</div>
              </Card>
            ))}
          </div>

          <Card className="bg-slate-900/40 backdrop-blur-xl border-white/5 shadow-2xl rounded-[32px] overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between p-8 border-b border-white/5">
              <CardTitle className="text-white font-display text-xl font-black uppercase tracking-tight">Ledger Global de Vendas</CardTitle>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                <Input
                  placeholder="Filtrar ID ou status..."
                  className="pl-12 h-12 w-80 bg-slate-950/40 border-white/10 rounded-2xl focus:border-cyan-500/50 focus:ring-cyan-500/20 text-white font-medium"
                  value={transactionSearch}
                  onChange={(e) => setTransactionSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loadingTransactions ? (
                <div className="flex justify-center p-32">
                  <Loader2 className="h-12 w-12 animate-spin text-cyan-500" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-950/20">
                      <TableRow className="hover:bg-transparent border-white/5">
                        <TableHead className="text-slate-500 font-black py-6 px-8 text-[10px] uppercase tracking-widest">IDENTIFICADOR</TableHead>
                        <TableHead className="text-slate-500 font-black py-6 px-8 text-[10px] uppercase tracking-widest">RESERVA</TableHead>
                        <TableHead className="text-slate-500 font-black py-6 px-8 text-[10px] uppercase tracking-widest">VALOR LÍQUIDO</TableHead>
                        <TableHead className="text-slate-500 font-black py-6 px-8 text-[10px] uppercase tracking-widest">ESTADO</TableHead>
                        <TableHead className="text-right text-slate-500 font-black py-6 px-8 text-[10px] uppercase tracking-widest">DATA · HORA</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions?.map((tx) => (
                        <TableRow key={tx.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                          <TableCell className="font-mono text-[11px] py-6 px-8 text-slate-500 font-black uppercase tracking-tighter">#{tx.id}</TableCell>
                          <TableCell className="py-6 px-8">
                            <div className="flex items-center gap-3 group/link cursor-pointer">
                              <span className="font-black text-sm text-slate-300 group-hover/link:text-cyan-400 transition-colors">#{tx.bookingId}</span>
                              <ExternalLink className="h-3.5 w-3.5 text-slate-600 group-hover/link:text-cyan-400 transition-transform group-hover/link:translate-x-0.5" />
                            </div>
                          </TableCell>
                          <TableCell className="py-6 px-8">
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-[10px] font-black text-slate-600 tracking-tighter uppercase">{tx.currency}</span>
                              <span className="text-sm font-black text-white">${parseFloat(tx.amount).toLocaleString()}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-6 px-8">
                            <Badge 
                              className={`rounded-xl py-1.5 px-4 text-[10px] font-black uppercase tracking-widest border-0 shadow-lg ${
                                tx.status === 'succeeded' 
                                  ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30' 
                                  : tx.status === 'failed' 
                                    ? 'bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/30' 
                                    : 'bg-slate-800 text-slate-400 ring-1 ring-white/10'
                              }`}
                            >
                              {tx.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right py-6 px-8 text-[11px] text-slate-500 font-black uppercase tracking-widest">
                            {format(new Date(tx.createdAt), "dd MMM · HH:mm")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Customer Profile Modal - Unified Intelligence View */}
      {selectedCustomer && (
        <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
          <DialogContent className="max-w-2xl bg-slate-950 border-white/10 text-white rounded-[32px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] p-0">
             <div className="h-32 bg-gradient-to-r from-indigo-600 to-indigo-900 relative">
               <div className="absolute -bottom-12 left-8 h-24 w-24 rounded-[28px] bg-slate-950 p-1.5 shadow-2xl">
                  <div className="h-full w-full rounded-[22px] bg-gradient-to-br from-indigo-500 to-indigo-800 flex items-center justify-center text-3xl font-black text-white">
                    {selectedCustomer.fullName?.charAt(0) || "G"}
                  </div>
               </div>
             </div>
             
             <div className="pt-16 px-8 pb-8 space-y-8">
               <div className="flex justify-between items-start">
                 <div>
                   <h3 className="text-2xl font-black tracking-tight">{selectedCustomer.fullName || "Visitante Anônimo"}</h3>
                   <div className="flex items-center gap-3 mt-1.5">
                     <span className="text-xs font-bold text-slate-500">{selectedCustomer.email || "Sem e-mail"}</span>
                     <span className="h-1 w-1 rounded-full bg-slate-700" />
                     <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{selectedCustomer.region || "Global Access"}</span>
                   </div>
                 </div>
                 <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest">
                    LTV: ${((selectedCustomer.totalBookings || 0) * 850).toLocaleString()}
                 </Badge>
               </div>

               <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center justify-center gap-2">
                    <Plane className="h-5 w-5 text-indigo-400" />
                    <span className="text-xs font-bold text-white">{selectedCustomer.totalBookings || 0}</span>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Viagens</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center justify-center gap-2">
                    <Calendar className="h-5 w-5 text-indigo-400" />
                    <span className="text-xs font-bold text-white">{format(new Date(selectedCustomer.createdAt), "dd/MM/yy")}</span>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Desde</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center justify-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-indigo-400" />
                    <span className="text-xs font-bold text-white">Ativo</span>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Status</span>
                  </div>
               </div>

               <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-indigo-400" />
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">Notas do Concierge</span>
                    </div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Apenas uso interno</span>
                 </div>
                 <Textarea 
                   value={notes} 
                   onChange={(e) => setNotes(e.target.value)}
                   className="min-h-[120px] bg-slate-900/50 border-white/10 rounded-2xl text-sm focus:border-indigo-500/50 focus:ring-indigo-500/20 text-slate-200 placeholder:text-slate-700"
                   placeholder="Registre preferências, histórico ou observações sobre este cliente..."
                 />
               </div>

               <div className="flex items-center gap-4 pt-2">
                 <Button 
                   onClick={() => updateCustomerMutation.mutate({ id: selectedCustomer.id, notes })}
                   disabled={updateCustomerMutation.isPending}
                   className="flex-1 h-14 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-600/20"
                 >
                   {updateCustomerMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                   Salvar Alterações
                 </Button>
                 <a 
                   href={`https://wa.me/${selectedCustomer.phone?.replace(/\D/g, '')}`} 
                   target="_blank" 
                   rel="noreferrer"
                   className="h-14 w-14 flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl shadow-xl shadow-emerald-600/20 transition-all"
                 >
                   <MessageCircle className="h-6 w-6" />
                 </a>
                 <a 
                   href={`mailto:${selectedCustomer.email}`}
                   className="h-14 w-14 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-white rounded-2xl shadow-xl transition-all"
                 >
                   <Mail className="h-6 w-6" />
                 </a>
               </div>
             </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
