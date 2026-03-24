import { useState } from "react";
import { useGetAssets, useCreateAsset, useUpdateAsset, useDeleteAsset, getGetAssetsQueryKey, useGetEmployees, useAssignAsset, importAssets, exportAssets } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FormDialog, FormField } from "@/components/form-dialog";
import { Search, Plus, Upload, Download, Edit2, Trash2, Link as LinkIcon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const ASSET_FIELDS: FormField[] = [
  { name: "assetNumber", label: "Asset Number", required: true },
  { name: "sn", label: "Serial Number" },
  { name: "category", label: "Category", required: true },
  { name: "subCategory", label: "Sub-category" },
  { name: "description", label: "Description" },
  { name: "status", label: "Status", type: "select", options: [{label: "Available", value: "Available"}, {label: "Assigned", value: "Assigned"}, {label: "In Service", value: "In Service"}] },
  { name: "owner", label: "Owner" },
  { name: "department", label: "Department" },
  { name: "location", label: "Location" },
  { name: "makeModel", label: "Make & Model" },
  { name: "os", label: "OS" },
  { name: "ram", label: "RAM" },
  { name: "rom", label: "ROM" },
  { name: "supplier", label: "Supplier" },
  { name: "warranty", label: "Warranty End", type: "date" },
];

export default function Assets() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<any>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: assets, isLoading } = useGetAssets({ search, status: statusFilter || undefined });
  const { data: employees } = useGetEmployees();
  
  const { mutateAsync: create } = useCreateAsset();
  const { mutateAsync: update } = useUpdateAsset();
  const { mutateAsync: remove } = useDeleteAsset();
  const { mutateAsync: assign } = useAssignAsset();

  const handleCreate = async (data: any) => {
    await create({ data });
    queryClient.invalidateQueries({ queryKey: getGetAssetsQueryKey() });
    toast({ title: "Asset created successfully" });
  };

  const handleUpdate = async (id: number, data: any) => {
    await update({ id, data });
    queryClient.invalidateQueries({ queryKey: getGetAssetsQueryKey() });
    toast({ title: "Asset updated successfully" });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this asset?")) return;
    await remove({ id });
    queryClient.invalidateQueries({ queryKey: getGetAssetsQueryKey() });
    toast({ title: "Asset deleted" });
  };

  const handleAssign = async (assetId: number, data: any) => {
    await assign({ data: { assetId, employeeId: Number(data.employeeId), assignedDate: data.assignedDate, remarks: data.remarks } });
    queryClient.invalidateQueries({ queryKey: getGetAssetsQueryKey() });
    toast({ title: "Asset assigned successfully" });
  };

  const doImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      toast({ title: "Importing...", description: "Please wait." });
      try {
        const res = await importAssets({ file });
        toast({ title: "Import complete", description: `Imported ${res.imported} assets.` });
        queryClient.invalidateQueries({ queryKey: getGetAssetsQueryKey() });
      } catch (err) {
        toast({ title: "Import failed", variant: "destructive" });
      }
    }
  };

  const doExport = async () => {
    toast({ title: "Exporting...", description: "Preparing download." });
    const blob = await exportAssets({ format: "xlsx" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assets-export.xlsx`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 rounded-2xl shadow-sm border border-border/50">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search assets..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10 rounded-xl" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 h-10 rounded-xl">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Status</SelectItem>
              <SelectItem value="Available">Available</SelectItem>
              <SelectItem value="Assigned">Assigned</SelectItem>
              <SelectItem value="In Service">In Service</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <label className="cursor-pointer">
            <Button variant="outline" className="rounded-xl font-medium" asChild>
              <span><Upload className="w-4 h-4 mr-2" /> Import</span>
            </Button>
            <input type="file" className="hidden" accept=".csv,.xlsx" onChange={doImport} />
          </label>
          <Button variant="outline" className="rounded-xl font-medium" onClick={doExport}>
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
          <FormDialog 
            title="Create New Asset" 
            trigger={<Button className="rounded-xl font-medium shadow-md shadow-primary/20"><Plus className="w-4 h-4 mr-2" /> New Asset</Button>} 
            fields={ASSET_FIELDS} 
            onSubmit={handleCreate} 
          />
        </div>
      </div>

      <div className="rounded-2xl border border-border/50 bg-card shadow-lg shadow-black/5 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-50/80 text-muted-foreground font-semibold border-b">
              <tr>
                <th className="px-6 py-4">Asset No.</th>
                <th className="px-6 py-4">Serial No.</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Make & Model</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Assigned To</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></td></tr>
              ) : assets?.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">No assets found matching your criteria.</td></tr>
              ) : (
                assets?.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-foreground">{asset.assetNumber}</td>
                    <td className="px-6 py-4">{asset.sn || '-'}</td>
                    <td className="px-6 py-4">{asset.category}</td>
                    <td className="px-6 py-4">{asset.makeModel || '-'}</td>
                    <td className="px-6 py-4">
                      <Badge variant={asset.status === 'Available' ? 'outline' : asset.status === 'Assigned' ? 'default' : 'secondary'}
                             className={asset.status === 'Available' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                        asset.status === 'Assigned' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'}>
                        {asset.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">{asset.assignedEmployee?.name || '-'}</td>
                    <td className="px-6 py-4 flex items-center gap-2">
                      {asset.status === 'Available' && (
                        <FormDialog 
                          title={`Assign Asset: ${asset.assetNumber}`}
                          trigger={<Button size="sm" variant="outline" className="h-8 rounded-lg text-primary"><LinkIcon className="w-3 h-3 mr-1" /> Assign</Button>}
                          fields={[
                            { name: "employeeId", label: "Employee", type: "select", options: employees?.map(e => ({label: `${e.name} (${e.employeeId})`, value: e.id.toString()})) || [], required: true },
                            { name: "assignedDate", label: "Assignment Date", type: "date", required: true },
                            { name: "remarks", label: "Remarks" }
                          ]}
                          onSubmit={(data) => handleAssign(asset.id, data)}
                        />
                      )}
                      <FormDialog 
                        title={`Edit Asset: ${asset.assetNumber}`}
                        trigger={<Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary"><Edit2 className="w-4 h-4" /></Button>}
                        initialData={asset}
                        fields={ASSET_FIELDS}
                        onSubmit={(data) => handleUpdate(asset.id, data)}
                      />
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(asset.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
