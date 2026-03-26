import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Upload, Trash2, Download, DatabaseBackup, Palette, Building2, ImageIcon, RefreshCw, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const API = "/api";

type Settings = {
  app_name?: string;
  app_subtitle?: string;
  app_logo_url?: string | null;
  company_name?: string;
  admin_email?: string;
};

export default function AdminPanel() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  const [appName, setAppName] = useState("");
  const [appSubtitle, setAppSubtitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [exporting, setExporting] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  const fetchSettings = () => {
    setLoading(true);
    fetch(`${API}/settings`)
      .then(r => (r.ok ? r.json() : null))
      .then((data: Settings | null) => {
        if (!data) return;
        setSettings(data);
        setAppName(data.app_name || "IT Asset Management");
        setAppSubtitle(data.app_subtitle || "Management Hub");
        setCompanyName(data.company_name || "");
        setAdminEmail(data.admin_email || "");
        setLogoPreview(data.app_logo_url ? `/api${data.app_logo_url}?t=${Date.now()}` : null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSettings(); }, []);

  const saveGeneral = async () => {
    setSaving(true);
    try {
      await fetch(`${API}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ app_name: appName, app_subtitle: appSubtitle, company_name: companyName, admin_email: adminEmail }),
      });
      toast({ title: "Settings saved", description: "App settings updated successfully." });
      fetchSettings();
      window.dispatchEvent(new Event("settings-updated"));
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const uploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    setLogoPreview(URL.createObjectURL(file));
    const fd = new FormData();
    fd.append("logo", file);
    try {
      const res = await fetch(`${API}/settings/logo`, { method: "POST", body: fd });
      const data = await res.json();
      setLogoPreview(`${API}${data.url}?t=${Date.now()}`);
      toast({ title: "Logo uploaded successfully" });
      fetchSettings();
      window.dispatchEvent(new Event("settings-updated"));
    } catch {
      toast({ title: "Logo upload failed", variant: "destructive" });
    } finally {
      setLogoUploading(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  const removeLogo = async () => {
    try {
      await fetch(`${API}/settings/logo`, { method: "DELETE" });
      setLogoPreview(null);
      toast({ title: "Logo removed" });
      fetchSettings();
      window.dispatchEvent(new Event("settings-updated"));
    } catch {
      toast({ title: "Failed to remove logo", variant: "destructive" });
    }
  };

  const exportBackup = async () => {
    setExporting(true);
    try {
      const res = await fetch(`${API}/backup/export`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `it-asset-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Backup exported", description: "All data downloaded as JSON." });
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const restoreBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm("This will OVERWRITE all existing data with the backup. Are you sure?")) return;
    setRestoring(true);
    const fd = new FormData();
    fd.append("backup", file);
    try {
      const res = await fetch(`${API}/backup/restore`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({
        title: "Restore complete",
        description: `Restored from backup dated ${data.exportedAt ? new Date(data.exportedAt).toLocaleDateString() : "unknown"}.`,
      });
    } catch (err: any) {
      toast({ title: "Restore failed", description: err.message, variant: "destructive" });
    } finally {
      setRestoring(false);
      if (restoreInputRef.current) restoreInputRef.current.value = "";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-2">
        <h2 className="text-3xl font-display font-bold text-foreground">Settings</h2>
        <p className="text-muted-foreground mt-1">Customize your application and manage data backups.</p>
      </div>

      <Tabs defaultValue="branding" className="space-y-6">
        <TabsList className="bg-card border border-border/60 p-1 rounded-xl shadow-sm h-auto gap-1">
          <TabsTrigger value="branding" className="rounded-lg px-5 py-2.5 font-medium data-[state=active]:shadow-sm">
            <Palette className="w-4 h-4 mr-2" /> App Branding
          </TabsTrigger>
          <TabsTrigger value="company" className="rounded-lg px-5 py-2.5 font-medium data-[state=active]:shadow-sm">
            <Building2 className="w-4 h-4 mr-2" /> Company Info
          </TabsTrigger>
          <TabsTrigger value="database" className="rounded-lg px-5 py-2.5 font-medium data-[state=active]:shadow-sm">
            <DatabaseBackup className="w-4 h-4 mr-2" /> Database
          </TabsTrigger>
        </TabsList>

        {/* ── App Branding ── */}
        <TabsContent value="branding" className="mt-0">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <Card className="rounded-2xl border-border/50 shadow-lg shadow-black/5">
              <CardHeader className="pb-4">
                <CardTitle className="font-display text-xl">Application Identity</CardTitle>
                <CardDescription>Customize the name, subtitle, and logo shown throughout the app and in the sidebar.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="font-semibold">App Name</Label>
                    <Input value={appName} onChange={e => setAppName(e.target.value)} placeholder="IT Asset Management" className="h-11 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold">App Subtitle</Label>
                    <Input value={appSubtitle} onChange={e => setAppSubtitle(e.target.value)} placeholder="Management Hub" className="h-11 rounded-xl" />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="font-semibold">App Logo</Label>
                  <div className="flex items-center gap-5">
                    <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-border flex items-center justify-center bg-slate-50 overflow-hidden flex-shrink-0">
                      {logoPreview ? (
                        <img src={logoPreview} alt="App Logo" className="w-full h-full object-contain p-2" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Upload a PNG, JPG, or SVG. Max 2 MB. Recommended: 128×128 px.</p>
                      <div className="flex gap-2">
                        <label>
                          <Button variant="outline" className="rounded-xl cursor-pointer" asChild disabled={logoUploading}>
                            <span>
                              {logoUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                              Upload Logo
                            </span>
                          </Button>
                          <input ref={logoInputRef} type="file" className="hidden" accept="image/*" onChange={uploadLogo} />
                        </label>
                        {logoPreview && (
                          <Button variant="ghost" size="icon" className="rounded-xl text-destructive hover:bg-destructive/10" onClick={removeLogo}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-border/50">
                  <Button onClick={saveGeneral} disabled={saving} className="rounded-xl px-8 shadow-md shadow-primary/20">
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                    {saving ? "Saving..." : "Save Branding"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ── Company Info ── */}
        <TabsContent value="company" className="mt-0">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <Card className="rounded-2xl border-border/50 shadow-lg shadow-black/5">
              <CardHeader className="pb-4">
                <CardTitle className="font-display text-xl">Company Information</CardTitle>
                <CardDescription>Details about your organisation used across the application.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="font-semibold">Company Name</Label>
                    <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="My Company Ltd." className="h-11 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold">Admin Email</Label>
                    <Input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} placeholder="admin@company.com" className="h-11 rounded-xl" />
                  </div>
                </div>
                <div className="flex justify-end pt-2 border-t border-border/50">
                  <Button onClick={saveGeneral} disabled={saving} className="rounded-xl px-8 shadow-md shadow-primary/20">
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                    {saving ? "Saving..." : "Save Company Info"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ── Database ── */}
        <TabsContent value="database" className="mt-0 space-y-4">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="grid md:grid-cols-2 gap-4">
            <Card className="rounded-2xl border-border/50 shadow-lg shadow-black/5">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <Download className="w-5 h-5 text-primary" /> Export Backup
                </CardTitle>
                <CardDescription>Download all your data as a JSON file you can restore later.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={exportBackup} disabled={exporting} className="w-full h-11 rounded-xl shadow-md shadow-primary/20">
                  {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                  {exporting ? "Exporting..." : "Download Backup (.json)"}
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-red-200 shadow-lg shadow-black/5">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-destructive" /> Restore Backup
                </CardTitle>
                <CardDescription className="text-destructive/80">
                  <strong>Warning:</strong> Overwrites all existing data with the selected backup file.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <label className="w-full block">
                  <Button variant="destructive" className="w-full h-11 rounded-xl pointer-events-none" disabled={restoring}>
                    {restoring ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                    {restoring ? "Restoring..." : "Select Backup File to Restore"}
                  </Button>
                  <input ref={restoreInputRef} type="file" className="hidden" accept=".json" onChange={restoreBackup} />
                </label>
              </CardContent>
            </Card>
          </motion.div>

          <Card className="rounded-2xl border-amber-200 bg-amber-50/60 shadow-sm">
            <CardContent className="p-4 flex gap-3 items-start">
              <DatabaseBackup className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-amber-900 mb-0.5">What's included in the backup</p>
                <p className="text-amber-800/80">Employees, Assets, Assignments, Acknowledgments, Notifications, Services, Licenses and License Assignments.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
