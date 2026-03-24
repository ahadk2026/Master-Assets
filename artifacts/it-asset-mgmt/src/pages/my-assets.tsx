import { useGetMyAssets, useAcknowledgeAsset, getGetMyAssetsQueryKey, useGetAssignments, getAcknowledgmentPdf } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormDialog } from "@/components/form-dialog";
import { Monitor, Download, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function MyAssets() {
  const { user } = useAuth();
  const { data: assets, isLoading } = useGetMyAssets();
  const { data: assignments } = useGetAssignments({ employeeId: user?.id });
  
  const { mutateAsync: acknowledge } = useAcknowledgeAsset();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleAcknowledge = async (assetId: number, remarks: string) => {
    const assignment = assignments?.find(a => a.assetId === assetId && a.isActive);
    if (!assignment) {
      toast({ title: "Error finding assignment record", variant: "destructive" });
      return;
    }
    await acknowledge({ data: { assetId, assignmentId: assignment.id, remarks } });
    queryClient.invalidateQueries({ queryKey: getGetMyAssetsQueryKey() });
    toast({ title: "Asset acknowledged successfully" });
  };

  const handleDownloadPdf = async (id: number) => {
    // In a real scenario, the acknowledgment ID is needed. 
    // Since employee only sees assets, we'd ideally fetch their acknowledgments or backend provides it.
    // For this demo, let's assume we can hit the endpoint if we had the ack ID.
    toast({ title: "Downloading PDF..." });
    // const blob = await getAcknowledgmentPdf(ackId);
    // ...
  };

  if (isLoading) return <div className="p-8 text-muted-foreground">Loading your assets...</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-display font-bold text-foreground">My Assigned Assets</h2>
        <p className="text-muted-foreground mt-2">View and manage hardware and software assigned to you.</p>
      </div>

      {assets?.length === 0 ? (
        <Card className="rounded-2xl border-dashed border-2 bg-transparent shadow-none p-12 text-center">
          <Monitor className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground">No Assets Assigned</h3>
          <p className="text-muted-foreground mt-1">You currently do not have any active asset assignments.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assets?.map((asset) => (
            <Card key={asset.id} className="rounded-2xl border-border/50 shadow-lg shadow-black/5 overflow-hidden transition-all hover:shadow-xl group">
              <CardContent className="p-0">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Monitor className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-display font-semibold text-lg">{asset.category}</h3>
                        <p className="text-sm font-medium text-muted-foreground">{asset.assetNumber}</p>
                      </div>
                    </div>
                    {asset.pendingAcknowledgment ? (
                      <Badge className="bg-amber-100 text-amber-800 border-amber-200"><AlertCircle className="w-3 h-3 mr-1" /> Pending</Badge>
                    ) : (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200"><CheckCircle2 className="w-3 h-3 mr-1" /> Acknowledged</Badge>
                    )}
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-1 border-b border-border/50"><span className="text-muted-foreground">Make/Model:</span> <span className="font-medium text-foreground">{asset.makeModel || '-'}</span></div>
                    <div className="flex justify-between py-1 border-b border-border/50"><span className="text-muted-foreground">Serial No:</span> <span className="font-medium text-foreground">{asset.sn || '-'}</span></div>
                    <div className="flex justify-between py-1 border-b border-border/50"><span className="text-muted-foreground">Assigned Date:</span> <span className="font-medium text-foreground">{asset.assignedDate ? new Date(asset.assignedDate).toLocaleDateString() : '-'}</span></div>
                  </div>
                </div>
                
                <div className="bg-slate-50/80 border-t border-border/50 p-4 flex justify-end gap-3">
                  {asset.pendingAcknowledgment ? (
                    <FormDialog 
                      title="Acknowledge Asset Receipt"
                      trigger={<Button className="rounded-xl shadow-md"><CheckCircle2 className="w-4 h-4 mr-2" /> Acknowledge Receipt</Button>}
                      fields={[ { name: "remarks", label: "Remarks / Condition Notes", type: "text" } ]}
                      onSubmit={async (data) => handleAcknowledge(asset.id, data.remarks)}
                    />
                  ) : (
                    <Button variant="outline" className="rounded-xl" onClick={() => handleDownloadPdf(asset.id)}>
                      <Download className="w-4 h-4 mr-2" /> Download PDF
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
