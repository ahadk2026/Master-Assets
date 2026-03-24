import { Link } from "wouter";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="text-center p-12 bg-card border rounded-3xl shadow-xl max-w-md">
        <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-6" />
        <h1 className="text-4xl font-display font-bold text-foreground mb-4">404</h1>
        <p className="text-muted-foreground text-lg mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <Link href="/" className="inline-block">
          <Button className="rounded-xl px-8 shadow-md">Return Home</Button>
        </Link>
      </div>
    </div>
  );
}
