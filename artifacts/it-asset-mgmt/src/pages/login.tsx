import { useState } from "react";
import { useLocation } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Monitor, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();

  const { mutate: doLogin, isPending } = useLogin({
    mutation: {
      onSuccess: (data) => {
        login(data.token, data.employee);
        setLocation(data.employee.role === "admin" ? "/dashboard" : "/my-assets");
      },
      onError: (err: any) => {
        toast({
          title: "Login Failed",
          description: err.message || "Invalid credentials or account locked.",
          variant: "destructive",
        });
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doLogin({ data: { employeeId, password } });
  };

  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Left side abstract branding */}
      <div className="hidden lg:flex w-1/2 bg-sidebar relative overflow-hidden flex-col justify-center px-16 z-0">
        <div className="absolute inset-0 opacity-40 mix-blend-screen pointer-events-none">
          <img src={`${import.meta.env.BASE_URL}images/login-hero.png`} alt="Enterprise Network" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-sidebar/90 z-10" />
        
        <motion.div 
          initial={{ opacity: 0, x: -30 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative z-20"
        >
          <div className="w-16 h-16 bg-gradient-to-tr from-primary to-accent rounded-2xl flex items-center justify-center mb-8 shadow-2xl shadow-primary/30">
            <Monitor className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-5xl font-display font-bold text-white mb-6 leading-tight">
            Enterprise Grade <br/>
            <span className="text-primary">Asset Control.</span>
          </h1>
          <p className="text-sidebar-foreground/70 text-lg max-w-md leading-relaxed">
            Manage your entire fleet of hardware and software assets from one secure, centralized dashboard.
          </p>
          
          <div className="mt-12 flex items-center gap-4 text-sm font-medium text-sidebar-foreground/50">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            Secure Encrypted Authentication
          </div>
        </motion.div>
      </div>

      {/* Right side login form */}
      <div className="flex-1 flex items-center justify-center p-8 z-10 relative">
        <div className="w-full max-w-md">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5 }}
            className="bg-card border border-border/50 shadow-2xl shadow-black/5 rounded-3xl p-10"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-display font-bold tracking-tight text-foreground mb-2">Welcome Back</h2>
              <p className="text-muted-foreground text-sm">Enter your credentials to access your account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="employeeId" className="text-sm font-semibold">Employee ID</Label>
                <Input
                  id="employeeId"
                  autoFocus
                  placeholder="e.g. EMP-1002"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="h-12 px-4 rounded-xl bg-slate-50/50 border-slate-200 focus-visible:ring-primary/20"
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 px-4 rounded-xl bg-slate-50/50 border-slate-200 focus-visible:ring-primary/20"
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl text-base font-semibold shadow-xl shadow-primary/25 hover:-translate-y-0.5 transition-all duration-200"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  "Sign In to Dashboard"
                )}
              </Button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
