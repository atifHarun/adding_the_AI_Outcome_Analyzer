import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ArrowRight, BarChart3, Eye, FileCheck } from "lucide-react";

export default function Home() {
  const features = [
    {
      icon: BarChart3,
      title: "Fairness Evaluation",
      description: "Comprehensive bias detection and fairness metrics analysis",
    },
    {
      icon: Eye,
      title: "Transparency Tools",
      description: "Model explainability and decision transparency features",
    },
    {
      icon: FileCheck,
      title: "Compliance Checking",
      description: "Automated regulatory compliance verification",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="w-16 h-16 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Shield className="w-8 h-8" />
              </div>
            </div>
            
            <h1 className="text-5xl font-bold text-foreground mb-6 max-w-4xl mx-auto">
              AI Trust Infrastructure Platform
            </h1>
            
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
              Evaluate fairness, safety, and compliance of AI systems.
            </p>
            
            <Link href="/industry">
              <Button size="lg" className="px-8 py-4 text-lg gap-3 shadow-lg hover:shadow-xl transition-all duration-200">
                Start AI Governance Analysis
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 opacity-5">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary rounded-full blur-3xl"></div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Comprehensive AI Governance
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            End-to-end tools for ensuring your AI systems meet the highest standards of trust and compliance
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Trust Badge Section */}
      <div className="bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Shield className="w-6 h-6 text-primary" />
              <h3 className="text-2xl font-semibold text-foreground">
                Trusted by Leading Organizations
              </h3>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              Join companies using our platform to ensure responsible AI deployment and regulatory compliance
            </p>
            
            <div className="flex flex-wrap justify-center gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">500+</div>
                <div className="text-sm text-muted-foreground">AI Systems Evaluated</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">98%</div>
                <div className="text-sm text-muted-foreground">Compliance Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">24/7</div>
                <div className="text-sm text-muted-foreground">Monitoring</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
