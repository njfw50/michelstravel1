import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tantml:react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Clock, CheckCircle2, AlertTriangle, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface VoiceEscalation {
  id: number;
  type: string;
  reason: string;
  customerPhone?: string;
  summary?: string;
  callSid?: string;
  status: 'pending' | 'in_progress' | 'resolved';
  notes?: string;
  createdAt: string;
  resolvedAt?: string;
}

export function VoiceEscalations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedEscalation, setSelectedEscalation] = useState<number | null>(null);
  const [notes, setNotes] = useState("");

  const { data: escalations = [], isLoading } = useQuery<VoiceEscalation[]>({
    queryKey: ['/api/voice/escalations'],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: number; status: string; notes?: string }) => {
      const res = await fetch(`/api/voice/escalations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes }),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to update escalation');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/voice/escalations'] });
      toast({
        title: "Escalation Updated",
        description: "Status updated successfully",
      });
      setSelectedEscalation(null);
      setNotes("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'in_progress':
        return <Badge variant="default"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
      case 'resolved':
        return <Badge variant="secondary"><CheckCircle2 className="w-3 h-3 mr-1" />Resolved</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading escalations...</div>;
  }

  const pendingCount = escalations.filter(e => e.status === 'pending').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Phone className="w-6 h-6" />
          Voice Escalations
          {pendingCount > 0 && (
            <Badge variant="destructive" className="ml-2">{pendingCount} Pending</Badge>
          )}
        </h2>
      </div>

      {escalations.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Phone className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No escalations yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {escalations.map((escalation) => (
            <Card key={escalation.id} className={escalation.status === 'pending' ? 'border-red-500' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      Escalation #{escalation.id}
                      {getStatusBadge(escalation.status)}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(escalation.createdAt), 'PPpp')}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <div>
                    <span className="font-semibold">Reason:</span> {escalation.reason}
                  </div>
                  {escalation.customerPhone && (
                    <div>
                      <span className="font-semibold">Customer Phone:</span>{' '}
                      <a href={`tel:${escalation.customerPhone}`} className="text-blue-600 hover:underline">
                        {escalation.customerPhone}
                      </a>
                    </div>
                  )}
                  {escalation.summary && (
                    <div>
                      <span className="font-semibold">Summary:</span>
                      <p className="mt-1 text-sm bg-muted p-3 rounded">{escalation.summary}</p>
                    </div>
                  )}
                  {escalation.notes && (
                    <div>
                      <span className="font-semibold">Notes:</span>
                      <p className="mt-1 text-sm bg-muted p-3 rounded">{escalation.notes}</p>
                    </div>
                  )}
                  {escalation.resolvedAt && (
                    <div className="text-sm text-muted-foreground">
                      Resolved: {format(new Date(escalation.resolvedAt), 'PPpp')}
                    </div>
                  )}
                </div>

                {selectedEscalation === escalation.id ? (
                  <div className="space-y-3 border-t pt-4">
                    <Textarea
                      placeholder="Add notes about this escalation..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                    <div className="flex gap-2">
                      {escalation.status === 'pending' && (
                        <Button
                          onClick={() => updateMutation.mutate({
                            id: escalation.id,
                            status: 'in_progress',
                            notes
                          })}
                          disabled={updateMutation.isPending}
                        >
                          Mark In Progress
                        </Button>
                      )}
                      <Button
                        onClick={() => updateMutation.mutate({
                          id: escalation.id,
                          status: 'resolved',
                          notes
                        })}
                        disabled={updateMutation.isPending}
                        variant="default"
                      >
                        Mark Resolved
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedEscalation(null);
                          setNotes("");
                        }}
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  escalation.status !== 'resolved' && (
                    <Button
                      onClick={() => {
                        setSelectedEscalation(escalation.id);
                        setNotes(escalation.notes || "");
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Update Status
                    </Button>
                  )
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
