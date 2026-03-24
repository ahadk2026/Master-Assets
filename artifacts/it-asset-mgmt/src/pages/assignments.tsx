import { useGetAssignments, useReturnAsset, getGetAssignmentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormDialog } from "@/components/form-dialog";
import { Undo2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Assignments() {
  const { data: assignments, isLoading } = useGetAssignments();
  const { mutateAsync: returnAst } = useReturnAsset();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleReturn = async (id: number, data: any) => {
    await returnAst({ id, data: { remarks: data.remarks } });
    queryClient.invalidateQueries({ queryKey: getGetAssignmentsQueryKey() });
    toast({ title: "Asset returned successfully" });
  };

  return (
    <div className="space-y-6">
      <div className="bg-card p-4 rounded-2xl shadow-sm border border-border/50">
        <h2 className="text-xl font-display font-semibold">Asset Assignments History</h2>
      </div>

      <div className="rounded-2xl border border-border/50 bg-card shadow-lg shadow-black/5 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-50/80 text-muted-foreground font-semibold border-b">
              <tr>
                <th className="px-6 py-4">Asset No.</th>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Assigned Date</th>
                <th className="px-6 py-4">Returned Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (<tr><td colSpan={6} className="px-6 py-8 text-center">Loading...</td></tr>) : 
                assignments?.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-semibold">{a.asset?.assetNumber || `ID: ${a.assetId}`}</td>
                    <td className="px-6 py-4">{a.employee?.name || `ID: ${a.employeeId}`}</td>
                    <td className="px-6 py-4">{a.assignedDate ? new Date(a.assignedDate).toLocaleDateString() : '-'}</td>
                    <td className="px-6 py-4">{a.returnedDate ? new Date(a.returnedDate).toLocaleDateString() : '-'}</td>
                    <td className="px-6 py-4">
                      {a.isActive ? <Badge className="bg-blue-100 text-blue-800">Active</Badge> : <Badge variant="secondary">Returned</Badge>}
                    </td>
                    <td className="px-6 py-4">
                      {a.isActive && (
                        <FormDialog 
                          title="Return Asset"
                          trigger={<Button size="sm" variant="outline" className="h-8 text-amber-600 border-amber-200 bg-amber-50"><Undo2 className="w-3 h-3 mr-1" /> Return</Button>}
                          fields={[{ name: "remarks", label: "Return Remarks", type: "text" }]}
                          onSubmit={(data) => handleReturn(a.id, data)}
                        />
                      )}
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
