import { useGetDashboard } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Monitor, CheckCircle, Package, Wrench, AlertTriangle } from "lucide-react";

const PIE_COLORS = ["#2563eb", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6", "#06b6d4"];

export default function Dashboard() {
  const { data: stats, isLoading } = useGetDashboard();

  if (isLoading) return <div className="p-8 text-muted-foreground animate-pulse">Loading dashboard...</div>;
  if (!stats) return null;

  return (
    <div className="space-y-8 pb-10">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Assets" value={stats.totalAssets} icon={<Monitor className="w-5 h-5 text-blue-600" />} color="bg-blue-600/10" />
        <StatCard title="Assigned Assets" value={stats.assignedAssets} icon={<CheckCircle className="w-5 h-5 text-emerald-600" />} color="bg-emerald-600/10" />
        <StatCard title="Available Assets" value={stats.availableAssets} icon={<Package className="w-5 h-5 text-indigo-600" />} color="bg-indigo-600/10" />
        <StatCard title="In Service" value={stats.inServiceAssets} icon={<Wrench className="w-5 h-5 text-amber-600" />} color="bg-amber-600/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category Chart */}
        <Card className="rounded-2xl border-border/50 shadow-lg shadow-black/5 overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-border/50">
            <CardTitle className="text-lg font-display">Assets by Category</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.categoryStats} dataKey="count" nameKey="category" cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5}>
                  {stats.categoryStats?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Department Chart */}
        <Card className="rounded-2xl border-border/50 shadow-lg shadow-black/5 overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-border/50">
            <CardTitle className="text-lg font-display">Assets by Department</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.departmentStats}>
                <XAxis dataKey="department" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Additional Stats */}
        <Card className="rounded-2xl border-border/50 shadow-lg shadow-black/5 p-6 flex flex-col justify-center">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Service Cost</p>
          <p className="text-4xl font-display font-bold text-foreground">${stats.totalServiceCost?.toLocaleString() || 0}</p>
        </Card>
        <Card className="rounded-2xl border-border/50 shadow-lg shadow-black/5 p-6 flex flex-col justify-center">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Pending Acknowledgments</p>
          <p className="text-4xl font-display font-bold text-amber-500">{stats.pendingAcknowledgments || 0}</p>
        </Card>
        <Card className="rounded-2xl border-border/50 shadow-lg shadow-black/5 p-6 flex flex-col justify-center">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Expired Licenses</p>
          <p className="text-4xl font-display font-bold text-destructive">{stats.expiredLicenses || 0}</p>
        </Card>
      </div>

      {/* Warranty Alerts */}
      <Card className="rounded-2xl border-border/50 shadow-lg shadow-black/5 overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-border/50 flex flex-row items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <CardTitle className="text-lg font-display">Warranty Expiring Soon</CardTitle>
        </CardHeader>
        <div className="p-0">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b">
              <tr>
                <th className="px-6 py-4">Asset Number</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Warranty End</th>
                <th className="px-6 py-4">Owner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stats.warrantyExpiringAssets?.length ? (
                stats.warrantyExpiringAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">{asset.assetNumber}</td>
                    <td className="px-6 py-4 text-muted-foreground">{asset.category}</td>
                    <td className="px-6 py-4 text-destructive font-medium">{asset.warranty}</td>
                    <td className="px-6 py-4 text-muted-foreground">{asset.owner || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">No warranties expiring soon.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <Card className="rounded-2xl border-border/50 shadow-lg shadow-black/5 hover:shadow-xl transition-shadow duration-300">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
            <p className="text-3xl font-display font-bold text-foreground">{value}</p>
          </div>
          <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
