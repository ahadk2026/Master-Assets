import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useGetNotifications, useMarkNotificationsRead, getGetNotificationsQueryKey } from "@workspace/api-client-react";
import { 
  LayoutDashboard, Monitor, Users, ClipboardList, 
  FileCheck, Wrench, Key, ShieldAlert, LogOut, Bell, 
  MonitorSmartphone
} from "lucide-react";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "./ui/dropdown-menu";
import { Badge } from "./ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const queryClient = useQueryClient();

  const { data: notifications } = useGetNotifications({
    query: { refetchInterval: 30000, enabled: !!user },
  });
  const { mutate: markRead } = useMarkNotificationsRead({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetNotificationsQueryKey() })
    }
  });

  const unreadNotes = notifications?.filter((n) => !n.isRead) || [];

  const adminNav = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/assets", label: "Asset Inventory", icon: Monitor },
    { href: "/employees", label: "Employees", icon: Users },
    { href: "/assignments", label: "Assignments", icon: ClipboardList },
    { href: "/acknowledgments", label: "Acknowledgments", icon: FileCheck },
    { href: "/services", label: "Services", icon: Wrench },
    { href: "/licenses", label: "Licenses", icon: Key },
    { href: "/admin-panel", label: "Admin Panel", icon: ShieldAlert },
  ];

  const employeeNav = [
    { href: "/my-assets", label: "My Assets", icon: MonitorSmartphone },
  ];

  const navItems = user?.role === "admin" ? adminNav : employeeNav;

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Dark Premium Sidebar */}
      <aside className="w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col flex-shrink-0 z-20 shadow-2xl shadow-black/20">
        <div className="h-20 flex items-center px-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
              <Monitor className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-white text-lg leading-tight tracking-wide">IT Asset</h1>
              <p className="text-xs text-sidebar-foreground/60 font-medium">Management Hub</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1.5 custom-scrollbar">
          {navItems.map((item) => {
            const isActive = location.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className="block">
                <div
                  className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden
                    ${isActive 
                      ? "bg-primary/10 text-primary font-semibold" 
                      : "text-sidebar-foreground/70 hover:bg-white/5 hover:text-white font-medium"}`}
                >
                  {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />}
                  <item.icon className={`w-5 h-5 mr-3 transition-colors ${isActive ? "text-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground"}`} />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5 bg-black/10">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
              <span className="font-display font-bold text-primary">{user?.name?.charAt(0) || "U"}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <p className="text-xs text-sidebar-foreground/50 truncate capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-slate-50/50">
        <header className="h-20 bg-card border-b border-border/60 flex items-center justify-between px-8 flex-shrink-0 z-10 shadow-sm shadow-black/5">
          <h2 className="font-display text-2xl font-semibold text-foreground tracking-tight capitalize">
            {location.replace("/", "").replace("-", " ") || "Dashboard"}
          </h2>
          
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="relative rounded-xl border-border/60 shadow-sm bg-background hover:bg-accent/50">
                  <Bell className="w-5 h-5 text-muted-foreground" />
                  {unreadNotes.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white shadow-sm ring-2 ring-background">
                      {unreadNotes.length}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 rounded-xl p-2 shadow-2xl">
                <DropdownMenuLabel className="font-display font-semibold flex items-center justify-between px-2 pt-2 pb-3">
                  Notifications
                  {unreadNotes.length > 0 && (
                    <Button variant="ghost" size="sm" className="h-auto text-xs px-2 py-1"
                      onClick={() => markRead({ ids: unreadNotes.map((n) => n.id) })}>
                      Mark all read
                    </Button>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications?.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-muted-foreground">No notifications</div>
                  ) : (
                    notifications?.map((n) => (
                      <div key={n.id} className={`px-4 py-3 rounded-lg mb-1 ${n.isRead ? 'opacity-60' : 'bg-primary/5'}`}>
                        <p className="font-semibold text-sm">{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="h-8 w-px bg-border/60" />

            <Button variant="ghost" onClick={logout} className="rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 font-medium px-4">
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={location}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
