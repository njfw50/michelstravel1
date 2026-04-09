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
      toast({ title: "Success", description: "Knowledge base entry added." });
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
      toast({ title: "Deleted", description: "Entry removed." });
    },
  });

  const filtered = entries?.filter(e => 
    e.question.toLowerCase().includes(search.toLowerCase()) || 
    e.answer.toLowerCase().includes(search.toLowerCase()) ||
    e.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Knowledge Hub</h2>
          <p className="text-muted-foreground">Train Mia with custom rules, FAQs, and business logic.</p>
        </div>
        <Button onClick={() => setIsAdding(!isAdding)} variant={isAdding ? "outline" : "default"}>
          {isAdding ? "Cancel" : <><Plus className="mr-2 h-4 w-4" /> Add Entry</>}
        </Button>
      </div>

      {isAdding && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>New Knowledge Entry</CardTitle>
            <CardDescription>Mia will use this information to better assist customers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Input 
                  value={newEntry.category} 
                  onChange={e => setNewEntry({...newEntry, category: e.target.value})}
                  placeholder="e.g. flights, cancellation, visa"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tags (comma separated)</label>
                <Input 
                  value={newEntry.tags} 
                  onChange={e => setNewEntry({...newEntry, tags: e.target.value})}
                  placeholder="e.g. europe, low-cost, refund"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Question/Pattern</label>
              <Input 
                value={newEntry.question} 
                onChange={e => setNewEntry({...newEntry, question: e.target.value})}
                placeholder="How do I change my booking?"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Official Answer / AI Guidance</label>
              <Textarea 
                value={newEntry.answer} 
                onChange={e => setNewEntry({...newEntry, answer: e.target.value})}
                placeholder="To change a booking, please contact our support at..."
                rows={4}
              />
            </div>
            <Button 
              className="w-full" 
              onClick={() => createMutation.mutate(newEntry)}
              disabled={createMutation.isPending || !newEntry.question || !newEntry.answer}
            >
              {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Entry
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Existing Knowledge
            </CardTitle>
            <div className="relative w-72">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search knowledge..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="w-1/3">Question / Topic</TableHead>
                  <TableHead className="w-1/3">Answer / Content</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered?.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">{entry.category}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{entry.question}</TableCell>
                    <TableCell className="text-sm text-muted-foreground truncate max-w-xs">{entry.answer}</TableCell>
                    <TableCell className="text-xs">
                      {new Date(entry.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive"
                        onClick={() => deleteMutation.mutate(entry.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No matching entries found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
