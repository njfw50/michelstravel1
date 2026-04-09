import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Users, DollarSign, Search, ExternalLink, Calendar, MapPin, Tag } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export function AdminCustomerInsights() {
  const [customerSearch, setCustomerSearch] = useState("");
  const [transactionSearch, setTransactionSearch] = useState("");

  const { data: customers, isLoading: loadingCustomers } = useQuery<any[]>({
    queryKey: ["/api/admin/customers"],
  });

  const { data: transactions, isLoading: loadingTransactions } = useQuery<any[]>({
    queryKey: ["/api/admin/transactions"],
  });

  const filteredCustomers = customers?.filter(c => 
    c.fullName?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.email?.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const filteredTransactions = transactions?.filter(t => 
    t.bookingId?.toString().includes(transactionSearch) ||
    t.status?.toLowerCase().includes(transactionSearch.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Page Header Area */}
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
              <Users className="h-5 w-5 text-indigo-400" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white font-display">Intelligence CRM</h2>
          </div>
          <p className="text-slate-400 font-medium">Arquitetura de dados orientada ao cliente 360°.</p>
        </div>
      </div>

      <Tabs defaultValue="crm" className="w-full">
        <TabsList className="bg-slate-900/40 backdrop-blur-md p-1 border border-white/5 rounded-2xl max-w-[400px]">
          <TabsTrigger value="crm" className="flex items-center gap-2 px-6 py-2.5 rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all">
            <Users className="h-4 w-4" />
            CRM de Clientes
          </TabsTrigger>
          <TabsTrigger value="finance" className="flex items-center gap-2 px-6 py-2.5 rounded-xl data-[state=active]:bg-cyan-600 data-[state=active]:text-white transition-all">
            <DollarSign className="h-4 w-4" />
            Ledger Financeiro
          </TabsTrigger>
        </TabsList>

        <TabsContent value="crm" className="mt-8 space-y-6">
          <Card className="bg-slate-900/40 backdrop-blur-xl border-white/5 shadow-2xl overflow-hidden rounded-3xl">
            <CardHeader className="flex flex-row items-center justify-between pb-8 border-b border-white/5">
              <div className="space-y-1">
                <CardTitle className="text-xl font-bold text-white tracking-tight">Perfis Unificados</CardTitle>
                <CardDescription className="text-slate-500">Rastreamento inteligente de visitantes e conversões.</CardDescription>
              </div>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <Input
                  placeholder="Pesquisar por nome ou e-mail..."
                  className="pl-10 w-80 bg-slate-950/40 border-white/10 rounded-2xl focus:border-indigo-500/50 focus:ring-indigo-500/20 text-white placeholder:text-slate-600"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loadingCustomers ? (
                <div className="flex justify-center p-20">
                  <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-950/20">
                      <TableRow className="hover:bg-transparent border-white/5">
                        <TableHead className="text-slate-400 font-bold py-5 px-6">CLIENTE</TableHead>
                        <TableHead className="text-slate-400 font-bold py-5 px-6">ENGAJAMENTO</TableHead>
                        <TableHead className="text-slate-400 font-bold py-5 px-6">REGIÃO</TableHead>
                        <TableHead className="text-slate-400 font-bold py-5 px-6">CADASTRO</TableHead>
                        <TableHead className="text-right text-slate-400 font-bold py-5 px-6">RATING</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCustomers?.map((c) => (
                        <TableRow key={c.id} className="border-white/5 hover:bg-slate-800/20 transition-colors group">
                          <TableCell className="py-5 px-6">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-bold text-xs ring-2 ring-indigo-500/20">
                                {c.fullName ? c.fullName.charAt(0) : "G"}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-200 group-hover:text-white transition-colors">{c.fullName || "Visitante Anônimo"}</span>
                                <span className="text-xs text-slate-500 font-medium">{c.email || "Sem e-mail vinculado"}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-5 px-6">
                            <div className="flex flex-col gap-1.5 min-w-[120px]">
                               <div className="flex justify-between items-center text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                                 <span>Score</span>
                                 <span>{c.totalBookings || 0} Viagens</span>
                               </div>
                               <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                 <div 
                                   className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)] transition-all duration-700" 
                                   style={{ width: `${Math.min(100, (c.totalBookings || 0) * 20)}%` }} 
                                 />
                               </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-5 px-6">
                            <div className="flex items-center gap-2 text-slate-300 font-medium text-sm">
                              <MapPin className="h-3.5 w-3.5 text-slate-500" />
                              {c.region || "Não identificada"}
                            </div>
                          </TableCell>
                          <TableCell className="py-5 px-6 text-sm text-slate-400 font-medium">
                            {format(new Date(c.createdAt), "dd MMM, yyyy")}
                          </TableCell>
                          <TableCell className="py-5 px-6 text-right">
                             <Badge className="bg-slate-950 border-indigo-500/30 text-indigo-300 font-mono text-[10px] py-1 px-3 rounded-lg ring-1 ring-indigo-500/10">
                               {c.visitorId ? `LTV-${c.visitorId.substring(0,4).toUpperCase()}` : "GUEST"}
                             </Badge>
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

        <TabsContent value="finance" className="mt-8 space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { label: "Receita Total Bruta", value: `$${transactions?.filter(t => t.status === 'succeeded').reduce((acc, t) => acc + parseFloat(t.amount || "0"), 0).toLocaleString()}`, icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
              { label: "Taxa de Conversão", value: `${transactions?.length ? Math.round((transactions.filter(t => t.status === 'succeeded').length / transactions.length) * 100) : 0}%`, icon: Tag, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
              { label: "Transações Pendentes", value: transactions?.filter(t => t.status === 'pending').length, icon: Calendar, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
            ].map((stat, i) => (
              <Card key={i} className="bg-slate-900/40 backdrop-blur-xl border-white/5 shadow-xl hover:translate-y-[-4px] transition-all duration-300 rounded-3xl p-6">
                <div className="flex justify-between items-start mb-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                  <div className={`p-2 rounded-xl ${stat.bg} ${stat.border}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
                <div className="text-3xl font-bold text-white font-display tracking-tight">{stat.value}</div>
              </Card>
            ))}
          </div>

          <Card className="bg-slate-900/40 backdrop-blur-xl border-white/5 shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-8 border-b border-white/5">
              <CardTitle className="text-white font-display text-xl font-bold tracking-tight">Ledger Global de Vendas</CardTitle>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                <Input
                  placeholder="Filtrar ID ou status..."
                  className="pl-10 w-80 bg-slate-950/40 border-white/10 rounded-2xl focus:border-cyan-500/50 focus:ring-cyan-500/20 text-white"
                  value={transactionSearch}
                  onChange={(e) => setTransactionSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loadingTransactions ? (
                <div className="flex justify-center p-20">
                  <Loader2 className="h-10 w-10 animate-spin text-cyan-500" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-950/20">
                      <TableRow className="hover:bg-transparent border-white/5">
                        <TableHead className="text-slate-400 font-bold py-5 px-6">ID</TableHead>
                        <TableHead className="text-slate-400 font-bold py-5 px-6">RESERVA</TableHead>
                        <TableHead className="text-slate-400 font-bold py-5 px-6">VALOR</TableHead>
                        <TableHead className="text-slate-400 font-bold py-5 px-6">STATUS</TableHead>
                        <TableHead className="text-right text-slate-400 font-bold py-5 px-6">HORÁRIO</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions?.map((tx) => (
                        <TableRow key={tx.id} className="border-white/5 hover:bg-slate-800/20 transition-colors group">
                          <TableCell className="font-mono text-xs py-5 px-6 text-slate-500 font-bold">#{tx.id}</TableCell>
                          <TableCell className="py-5 px-6">
                            <div className="flex items-center gap-2 group/link cursor-pointer">
                              <span className="font-bold text-slate-300 group-hover/link:text-cyan-400 transition-colors">#{tx.bookingId}</span>
                              <ExternalLink className="h-3 w-3 text-slate-600 group-hover/link:text-cyan-400" />
                            </div>
                          </TableCell>
                          <TableCell className="py-5 px-6">
                            <div className="flex items-baseline gap-1">
                              <span className="text-[10px] font-black text-slate-600 tracking-tighter uppercase">{tx.currency}</span>
                              <span className="text-sm font-bold text-white">{parseFloat(tx.amount).toLocaleString()}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-5 px-6">
                            <Badge 
                              className={`rounded-lg py-1 px-3 text-[10px] font-black uppercase tracking-widest border-0 ${
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
                          <TableCell className="text-right py-5 px-6 text-xs text-slate-500 font-bold">
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
    </div>
  );
}
