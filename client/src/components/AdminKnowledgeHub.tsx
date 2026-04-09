import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Trash2, Search, BookOpen, Save, RefreshCw } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export function AdminKnowledgeHub() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newEntry, setNewEntry] = useState({ category: "flights", question: "", answer: "", tags: "" });

  const { data: entries, isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/knowledge-base"],
  });

  const createMutation = useMutation({
    mutationFn: async (entry: any) => {
      const res = await apiRequest("POST", "/api/admin/knowledge-base", entry);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/knowledge-base"] });
      toast({ title: "Treinado com Sucesso", description: "Mia agora conhece essa regra de negócio." });
      setIsAdding(false);
      setNewEntry({ category: "flights", question: "", answer: "", tags: "" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/knowledge-base/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/knowledge-base"] });
      toast({ title: "Removido", description: "Conhecimento deletado do banco da IA." });
    },
  });

  const filtered = entries?.filter(e => 
    e.question.toLowerCase().includes(search.toLowerCase()) || 
    e.answer.toLowerCase().includes(search.toLowerCase()) ||
    e.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
              <BookOpen className="h-5 w-5 text-cyan-400" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white font-display">Agente IA Knowledge Hub</h2>
          </div>
          <p className="text-slate-400 font-medium">Treine a Mia com regras de negócio, FAQs e lógicas personalizadas.</p>
        </div>
        <Button 
          onClick={() => setIsAdding(!isAdding)} 
          variant="outline" 
          className={`rounded-2xl px-6 py-6 font-bold transition-all border-white/10 ${isAdding ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 'bg-white/5 text-white hover:bg-white/10'}`}
        >
          {isAdding ? "Cancelar Treino" : <><Plus className="mr-2 h-4 w-4" /> Novo Conhecimento</>}
        </Button>
      </div>

      {isAdding && (
        <Card className="bg-slate-900/60 backdrop-blur-2xl border-indigo-500/30 shadow-[0_0_40px_rgba(99,102,241,0.15)] rounded-3xl overflow-hidden animate-in zoom-in-95 duration-300">
          <CardHeader className="border-b border-indigo-500/20 bg-indigo-500/5 pb-8">
            <CardTitle className="text-xl font-bold text-white tracking-tight">Manual de Instruções da Mia</CardTitle>
            <CardDescription className="text-indigo-300/60">Quanto mais específico for o treino, melhor será o atendimento automático.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2.5">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Categoria do Módulo</label>
                <Input 
                  value={newEntry.category} 
                  onChange={e => setNewEntry({...newEntry, category: e.target.value})}
                  placeholder="ex.: voos, cancelamento, vistos"
                  className="bg-slate-950/50 border-white/10 rounded-2xl h-12 text-white placeholder:text-slate-700 focus:border-indigo-500/50"
                />
              </div>
              <div className="space-y-2.5">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Tags (palavras-chave)</label>
                <Input 
                  value={newEntry.tags} 
                  onChange={e => setNewEntry({...newEntry, tags: e.target.value})}
                  placeholder="ex.: europa, low-cost, reembolso"
                  className="bg-slate-950/50 border-white/10 rounded-2xl h-12 text-white placeholder:text-slate-700 focus:border-indigo-500/50"
                />
              </div>
            </div>
            <div className="space-y-2.5">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Gatilho / Pergunta / Padrão</label>
              <Input 
                value={newEntry.question} 
                onChange={e => setNewEntry({...newEntry, question: e.target.value})}
                placeholder="Como faço para alterar minha reserva?"
                className="bg-slate-950/50 border-white/10 rounded-2xl h-12 text-white placeholder:text-slate-700 focus:border-indigo-500/50 font-semibold"
              />
            </div>
            <div className="space-y-2.5">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Instrução Oficial / Resposta da IA</label>
              <Textarea 
                value={newEntry.answer} 
                onChange={e => setNewEntry({...newEntry, answer: e.target.value})}
                placeholder="Para alterar uma reserva, o cliente deve seguir o procedimento..."
                rows={4}
                className="bg-slate-950/50 border-white/10 rounded-3xl text-white placeholder:text-slate-700 focus:border-indigo-500/50 leading-relaxed"
              />
            </div>
            <Button 
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 py-7 rounded-2xl font-black text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all transform hover:scale-[1.01]" 
              onClick={() => createMutation.mutate(newEntry)}
              disabled={createMutation.isPending || !newEntry.question || !newEntry.answer}
            >
              {createMutation.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
              Salvar Treinamento Agora
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="bg-slate-900/40 backdrop-blur-xl border-white/5 shadow-2xl rounded-3xl overflow-hidden">
        <CardHeader className="pb-8 border-b border-white/5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <CardTitle className="text-xl font-bold text-white flex items-center gap-3 tracking-tight">
              <RefreshCw className="h-5 w-5 text-indigo-400 animate-spin-slow" />
              Base de Conhecimento Ativa
            </CardTitle>
            <div className="relative group w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
              <Input
                placeholder="Pesquisar inteligência..."
                className="pl-10 bg-slate-950/40 border-white/10 rounded-2xl text-white focus:border-cyan-500/50 placeholder:text-slate-600"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center p-20">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-950/20">
                  <TableRow className="hover:bg-transparent border-white/5">
                    <TableHead className="text-slate-400 font-bold py-5 px-6">CATEGORIA</TableHead>
                    <TableHead className="w-1/3 text-slate-400 font-bold py-5 px-6">GATILHO / TÓPICO</TableHead>
                    <TableHead className="w-1/3 text-slate-400 font-bold py-5 px-6">CONTEÚDO IA</TableHead>
                    <TableHead className="text-slate-400 font-bold py-5 px-6">ATUALIZAÇÃO</TableHead>
                    <TableHead className="text-right text-slate-400 font-bold py-5 px-6">AÇÕES</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered?.map((entry) => (
                    <TableRow key={entry.id} className="border-white/5 hover:bg-slate-800/20 transition-colors group">
                      <TableCell className="py-5 px-6">
                        <Badge className="bg-indigo-500/10 text-indigo-300 border-indigo-500/20 px-3 py-1 rounded-lg capitalize font-bold text-[10px] tracking-wider uppercase">
                          {entry.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-5 px-6 font-bold text-slate-200 group-hover:text-white transition-colors">{entry.question}</TableCell>
                      <TableCell className="py-5 px-6 text-sm text-slate-500 font-medium truncate max-w-xs">{entry.answer}</TableCell>
                      <TableCell className="py-5 px-6 text-xs text-slate-500 font-bold">
                        {new Date(entry.updatedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="py-5 px-6 text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all h-10 w-10"
                          onClick={() => deleteMutation.mutate(entry.id)}
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
