import { useGetServices, useCreateService, useUpdateService, getGetServicesQueryKey, useGetAssets } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormDialog, FormField } from "@/components/form-dialog";
import { Edit2, Plus, Wrench } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Services() {
  const { data: services, isLoading } = useGetServices();
  const { data: assets } = useGetAssets(); // for dropdown
  
  const { mutateAsync: create } = useCreateService();
  const { mutateAsync: update } = useUpdateService();
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const STATUS_OPTIONS = [
    { label: "Pending", value: "Pending" },
    { label: "In Progress", value: "In Progress" },
    { label: "Completed", value: "Completed" },
    { label: "Cancelled", value: "Cancelled" }
  ];

  const SERVICE_FIELDS: FormField[] = [
    { name: "assetId", label: "Asset", type: "select", options: assets?.map(a => ({label: a.assetNumber, value: a.id.toString()})) || [], required: true },
    { name: "serviceDate", label: "Service Date", type: "date", required: true },
    { name: "vendor", label: "Vendor" },
    { name: "cost", label: "Cost ($)", type: "number" },
    { name: "status", label: "Status", type: "select", options: STATUS_OPTIONS, required: true },
    { name: "remarks", label: "Remarks" }
  ];

  const handleCreate = async (data: any) => {
    await create({ data: { ...data, assetId: Number(data.assetId) } });
    queryClient.invalidateQueries({ queryKey: getGetServicesQueryKey() });
    toast({ title: "Service record created" });
  };

  const handleUpdate = async (id: number, data: any) => {
    await update({ id, data });
    queryClient.invalidateQueries({ queryKey: getGetServicesQueryKey() });
    toast({ title: "Service record updated" });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card p-4 rounded-2xl shadow-sm border border-border/50">
        <h2 className="text-xl font-display font-semibold flex items-center gap-2"><Wrench className="w-5 h-5 text-amber-600"/> Service & Maintenance</h2>
        <FormDialog 
          title="Add Service Record" 
          trigger={<Button className="rounded-xl shadow-md"><Plus className="w-4 h-4 mr-2" /> Record Service</Button>} 
          fields={SERVICE_FIELDS} 
          onSubmit={handleCreate} 
        />
      </div>

      <div className="rounded-2xl border border-border/50 bg-card shadow-lg shadow-black/5 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-50/80 text-muted-foreground font-semibold border-b">
              <tr>
                <th className="px-6 py-4">Asset No.</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Vendor</th>
                <th className="px-6 py-4">Cost</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (<tr><td colSpan={6} className="px-6 py-8 text-center">Loading...</td></tr>) : 
                services?.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-semibold">{s.asset?.assetNumber || s.assetId}</td>
                    <td className="px-6 py-4">{s.serviceDate ? new Date(s.serviceDate).toLocaleDateString() : '-'}</td>
                    <td className="px-6 py-4">{s.vendor || '-'}</td>
                    <td className="px-6 py-4 font-medium">${s.cost?.toLocaleString() || '0'}</td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={
                        s.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' :
                        s.status === 'In Progress' ? 'bg-blue-50 text-blue-700' :
                        s.status === 'Cancelled' ? 'bg-destructive/10 text-destructive' : 'bg-slate-100 text-slate-700'
                      }>{s.status}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <FormDialog 
                        title="Edit Service Record"
                        trigger={<Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary"><Edit2 className="w-4 h-4" /></Button>}
                        initialData={s}
                        fields={SERVICE_FIELDS.filter(f => f.name !== 'assetId')}
                        onSubmit={(data) => handleUpdate(s.id, data)}
                      />
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
