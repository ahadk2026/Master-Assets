import { useGetAdminUsers, useCreateAdminUser, useUpdateAdminUser, useDeleteAdminUser, useUnlockAdminUser, getGetAdminUsersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormDialog, FormField } from "@/components/form-dialog";
import { Plus, Edit2, Trash2, Unlock, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const EMPLOYEE_FIELDS: FormField[] = [
  { name: "employeeId", label: "Employee ID", required: true },
  { name: "name", label: "Full Name", required: true },
  { name: "email", label: "Email Address" },
  { name: "department", label: "Department" },
  { name: "role", label: "Role", type: "select", options: [{label:"Admin", value:"admin"}, {label:"Employee", value:"employee"}], required: true },
  { name: "doj", label: "Date of Joining", type: "date" },
  { name: "password", label: "Temporary Password", type: "password", required: true },
];

const UPDATE_FIELDS: FormField[] = [
  { name: "name", label: "Full Name", required: true },
  { name: "email", label: "Email Address" },
  { name: "department", label: "Department" },
  { name: "role", label: "Role", type: "select", options: [{label:"Admin", value:"admin"}, {label:"Employee", value:"employee"}], required: true },
];

export default function Employees() {
  const { data: users, isLoading } = useGetAdminUsers();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { mutateAsync: create } = useCreateAdminUser();
  const { mutateAsync: update } = useUpdateAdminUser();
  const { mutateAsync: remove } = useDeleteAdminUser();
  const { mutateAsync: unlock } = useUnlockAdminUser();

  const handleCreate = async (data: any) => {
    await create({ id: 0, data }); // ID 0 is ignored for create but required by generated types
    queryClient.invalidateQueries({ queryKey: getGetAdminUsersQueryKey() });
    toast({ title: "Employee created" });
  };

  const handleUpdate = async (id: number, data: any) => {
    await update({ id, data });
    queryClient.invalidateQueries({ queryKey: getGetAdminUsersQueryKey() });
    toast({ title: "Employee updated" });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Remove this employee?")) return;
    await remove({ id });
    queryClient.invalidateQueries({ queryKey: getGetAdminUsersQueryKey() });
    toast({ title: "Employee deleted" });
  };

  const handleUnlock = async (id: number) => {
    await unlock({ id });
    queryClient.invalidateQueries({ queryKey: getGetAdminUsersQueryKey() });
    toast({ title: "Account unlocked" });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card p-4 rounded-2xl shadow-sm border border-border/50">
        <h2 className="text-xl font-display font-semibold">Employee Directory</h2>
        <FormDialog 
          title="Add New Employee" 
          trigger={<Button className="rounded-xl shadow-md"><Plus className="w-4 h-4 mr-2" /> Add Employee</Button>} 
          fields={EMPLOYEE_FIELDS} 
          onSubmit={handleCreate} 
        />
      </div>

      <div className="rounded-2xl border border-border/50 bg-card shadow-lg shadow-black/5 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-50/80 text-muted-foreground font-semibold border-b">
              <tr>
                <th className="px-6 py-4">EMP ID</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (<tr><td colSpan={6} className="px-6 py-8 text-center">Loading...</td></tr>) : 
                users?.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-semibold">{user.employeeId}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.email || '-'}</div>
                    </td>
                    <td className="px-6 py-4">{user.department || '-'}</td>
                    <td className="px-6 py-4 capitalize">
                      <Badge variant="outline" className="bg-slate-100 text-slate-800">{user.role}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      {user.isLocked ? (
                        <Badge className="bg-destructive/10 text-destructive border-destructive/20"><ShieldAlert className="w-3 h-3 mr-1" /> Locked</Badge>
                      ) : user.isActive ? (
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 flex items-center gap-2">
                      {user.isLocked && (
                        <Button size="sm" variant="outline" className="h-8 text-emerald-600" onClick={() => handleUnlock(user.id)}>
                          <Unlock className="w-4 h-4 mr-1" /> Unlock
                        </Button>
                      )}
                      <FormDialog 
                        title={`Edit Employee: ${user.name}`}
                        trigger={<Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground"><Edit2 className="w-4 h-4" /></Button>}
                        initialData={user}
                        fields={UPDATE_FIELDS}
                        onSubmit={(data) => handleUpdate(user.id, data)}
                      />
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(user.id)}>
                        <Trash2 className="w-4 h-4" />
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
