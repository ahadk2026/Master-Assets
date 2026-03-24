import { useGetAcknowledgments, getAcknowledgmentPdf } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Acknowledgments() {
  const { data: acks, isLoading } = useGetAcknowledgments();
  const { toast } = useToast();

  const downloadPdf = async (id: number) => {
    toast({ title: "Generating PDF..." });
    try {
      const blob = await getAcknowledgmentPdf(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `acknowledgment-${id}.pdf`;
      a.click();
    } catch (err) {
      toast({ title: "Failed to download PDF", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-card p-4 rounded-2xl shadow-sm border border-border/50">
        <h2 className="text-xl font-display font-semibold">Acknowledgment Records</h2>
      </div>

      <div className="rounded-2xl border border-border/50 bg-card shadow-lg shadow-black/5 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-50/80 text-muted-foreground font-semibold border-b">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Asset No.</th>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Document</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (<tr><td colSpan={6} className="px-6 py-8 text-center">Loading...</td></tr>) : 
                acks?.map((ack) => (
                  <tr key={ack.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 text-muted-foreground">#{ack.id}</td>
                    <td className="px-6 py-4 font-semibold">{ack.asset?.assetNumber}</td>
                    <td className="px-6 py-4">{ack.employee?.name}</td>
                    <td className="px-6 py-4">{ack.acknowledgmentDate ? new Date(ack.acknowledgmentDate).toLocaleDateString() : '-'}</td>
                    <td className="px-6 py-4">
                      <Badge className="bg-emerald-100 text-emerald-800">Completed</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Button size="sm" variant="outline" className="rounded-lg h-8 text-primary" onClick={() => downloadPdf(ack.id)}>
                        <Download className="w-4 h-4 mr-1" /> PDF
                      </Button>
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
