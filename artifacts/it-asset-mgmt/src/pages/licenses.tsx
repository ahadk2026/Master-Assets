import { useGetLicenses, useCreateLicense, useUpdateLicense, useDeleteLicense, useAssignLicense, useGetLicenseAssignments, useGetEmployees, getGetLicensesQueryKey, getGetLicenseAssignmentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormDialog, FormField } from "@/components/form-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit2, Trash2, Link as LinkIcon, KeySquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Licenses() {
  const { data: licenses, isLoading } = useGetLicenses();
  const { data: assignments, isLoading: assgnLoading } = useGetLicenseAssignments();
  const { data: employees } = useGetEmployees();
  
  const { mutateAsync: create } = useCreateLicense();
  const { mutateAsync: update } = useUpdateLicense();
  const { mutateAsync: remove } = useDeleteLicense();
  const { mutateAsync: assign } = useAssignLicense();
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const LICENSE_FIELDS: FormField[] = [
    { name: "licenseName", label: "Software Name", required: true },
    { name: "licenseKey", label: "License Key (Optional)" },
    { name: "vendor", label: "Vendor" },
    { name: "purchaseDate", label: "Purchase Date", type: "date" },
    { name: "expiryDate", label: "Expiry Date", type: "date" },
    { name: "totalSeats", label: "Total Seats", type: "number", required: true },
    { name: "status", label: "Status", type: "select", options: [{label:"Available",value:"Available"},{label:"Assigned",value:"Assigned"},{label:"Expired",value:"Expired"}] },
  ];

  const handleCreate = async (data: any) => {
    await create({ data: { ...data, status: data.status || 'Available' } });
    queryClient.invalidateQueries({ queryKey: getGetLicensesQueryKey() });
    toast({ title: "License added" });
  };

  const handleUpdate = async (id: number, data: any) => {
    await update({ id, data });
    queryClient.invalidateQueries({ queryKey: getGetLicensesQueryKey() });
    toast({ title: "License updated" });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this license record?")) return;
    await remove({ id });
    queryClient.invalidateQueries({ queryKey: getGetLicensesQueryKey() });
    toast({ title: "License deleted" });
  };

  const handleAssign = async (licenseId: number, data: any) => {
    await assign({ data: { licenseId, employeeId: Number(data.employeeId), assignedDate: data.assignedDate } });
    queryClient.invalidateQueries({ queryKey: getGetLicenseAssignmentsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetLicensesQueryKey() });
    toast({ title: "License assigned successfully" });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card p-4 rounded-2xl shadow-sm border border-border/50">
        <h2 className="text-xl font-display font-semibold flex items-center gap-2"><KeySquare className="w-5 h-5 text-indigo-600"/> Software Licenses</h2>
        <FormDialog 
          title="Add New License" 
          trigger={<Button className="rounded-xl shadow-md"><Plus className="w-4 h-4 mr-2" /> Add License</Button>} 
          fields={LICENSE_FIELDS} 
          onSubmit={handleCreate} 
        />
      </div>

      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="bg-slate-200/50 p-1 mb-6 rounded-xl">
          <TabsTrigger value="inventory" className="rounded-lg px-6">License Inventory</TabsTrigger>
          <TabsTrigger value="assignments" className="rounded-lg px-6">Assignments</TabsTrigger>
        </TabsList>
        
        <TabsContent value="inventory" className="m-0">
          <div className="rounded-2xl border border-border/50 bg-card shadow-lg shadow-black/5 overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="bg-slate-50/80 text-muted-foreground font-semibold border-b">
                  <tr>
                    <th className="px-6 py-4">Software</th>
                    <th className="px-6 py-4">Vendor</th>
                    <th className="px-6 py-4">Seats (Used/Total)</th>
                    <th className="px-6 py-4">Expiry Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (<tr><td colSpan={6} className="px-6 py-8 text-center">Loading...</td></tr>) : 
                    licenses?.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-semibold">{l.licenseName}</td>
                        <td className="px-6 py-4">{l.vendor || '-'}</td>
                        <td className="px-6 py-4 font-medium">{l.usedSeats} / {l.totalSeats}</td>
                        <td className="px-6 py-4">{l.expiryDate ? new Date(l.expiryDate).toLocaleDateString() : '-'}</td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className={l.status === 'Expired' ? 'bg-destructive/10 text-destructive' : 'bg-emerald-50 text-emerald-700'}>{l.status}</Badge>
                        </td>
                        <td className="px-6 py-4 flex items-center gap-2">
                          {l.usedSeats < l.totalSeats && l.status !== 'Expired' && (
                            <FormDialog 
                              title={`Assign ${l.licenseName}`}
                              trigger={<Button size="sm" variant="outline" className="h-8 rounded-lg text-primary"><LinkIcon className="w-3 h-3 mr-1" /> Assign</Button>}
                              fields={[
                                { name: "employeeId", label: "Employee", type: "select", options: employees?.map(e => ({label: e.name, value: e.id.toString()})) || [], required: true },
                                { name: "assignedDate", label: "Assignment Date", type: "date", required: true },
                              ]}
                              onSubmit={(data) => handleAssign(l.id, data)}
                            />
                          )}
                          <FormDialog 
                            title={`Edit License: ${l.licenseName}`}
                            trigger={<Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground"><Edit2 className="w-4 h-4" /></Button>}
                            initialData={l}
                            fields={LICENSE_FIELDS}
                            onSubmit={(data) => handleUpdate(l.id, data)}
                          />
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(l.id)}><Trash2 className="w-4 h-4" /></Button>
                        </td>
                      </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="assignments" className="m-0">
          <div className="rounded-2xl border border-border/50 bg-card shadow-lg shadow-black/5 overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="bg-slate-50/80 text-muted-foreground font-semibold border-b">
                  <tr>
                    <th className="px-6 py-4">Software</th>
                    <th className="px-6 py-4">Employee</th>
                    <th className="px-6 py-4">Assigned Date</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {assgnLoading ? (<tr><td colSpan={4} className="px-6 py-8 text-center">Loading...</td></tr>) : 
                    assignments?.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-semibold">{a.license?.licenseName}</td>
                        <td className="px-6 py-4">{a.employee?.name}</td>
                        <td className="px-6 py-4">{a.assignedDate ? new Date(a.assignedDate).toLocaleDateString() : '-'}</td>
                        <td className="px-6 py-4">
                          {a.isActive ? <Badge className="bg-blue-100 text-blue-800">Active</Badge> : <Badge variant="secondary">Revoked</Badge>}
                        </td>
                      </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
