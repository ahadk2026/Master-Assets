import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";

// Context & Layouts
import { AuthProvider, useAuth } from "@/hooks/use-auth.tsx";
import { Layout } from "@/components/layout";

// Pages
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Assets from "@/pages/assets";
import MyAssets from "@/pages/my-assets";
import Employees from "@/pages/employees";
import Assignments from "@/pages/assignments";
import Acknowledgments from "@/pages/acknowledgments";
import Services from "@/pages/services";
import Licenses from "@/pages/licenses";
import AdminPanel from "@/pages/admin-panel";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

// Utility for declarative redirection
function Redirect({ to }: { to: string }) {
  const [, setLocation] = useLocation();
  useEffect(() => setLocation(to), [to, setLocation]);
  return null;
}

// Protected Route Guard
function ProtectedRoute({ component: Component, adminOnly, ...rest }: any) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <div className="h-screen w-full flex items-center justify-center"><div className="animate-pulse font-display text-xl">Loading workspace...</div></div>;
  if (!user) return <Redirect to="/login" />;
  if (adminOnly && user.role !== "admin") return <Redirect to="/my-assets" />;
  
  return <Component {...rest} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        {() => {
          const token = localStorage.getItem("token");
          return <Redirect to={token ? "/dashboard" : "/login"} />;
        }}
      </Route>
      <Route path="/:rest*">
        <Layout>
          <Switch>
            <Route path="/dashboard"><ProtectedRoute adminOnly component={Dashboard} /></Route>
            <Route path="/assets"><ProtectedRoute adminOnly component={Assets} /></Route>
            <Route path="/my-assets"><ProtectedRoute component={MyAssets} /></Route>
            <Route path="/employees"><ProtectedRoute adminOnly component={Employees} /></Route>
            <Route path="/assignments"><ProtectedRoute adminOnly component={Assignments} /></Route>
            <Route path="/acknowledgments"><ProtectedRoute component={Acknowledgments} /></Route>
            <Route path="/services"><ProtectedRoute adminOnly component={Services} /></Route>
            <Route path="/licenses"><ProtectedRoute adminOnly component={Licenses} /></Route>
            <Route path="/admin-panel"><ProtectedRoute adminOnly component={AdminPanel} /></Route>
            <Route><NotFound /></Route>
          </Switch>
        </Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
