import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { BarChart3, Store, Shield } from "lucide-react";

export default function Navigation() {
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-display font-bold tracking-tight text-foreground">
              AI<span className="font-light text-muted-foreground">Governance</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/home" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Home
              </Link>
            </Button>
            
            <Button variant="ghost" asChild>
              <Link href="/marketplace" className="flex items-center gap-2">
                <Store className="w-4 h-4" />
                Marketplace
              </Link>
            </Button>
            
            <Button variant="ghost" asChild>
              <Link href="/results" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Trust Passport
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
