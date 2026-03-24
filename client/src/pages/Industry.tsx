import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WorkflowProgress } from "@/components/WorkflowProgress";
import { CreditCard, Heart, Users, Shield, Building } from "lucide-react";

const industries = [
  {
    id: "fintech",
    title: "Fintech",
    description: "Financial technology and digital banking AI systems",
    icon: CreditCard,
  },
  {
    id: "healthcare",
    title: "Healthcare",
    description: "Medical diagnosis and treatment AI applications",
    icon: Heart,
  },
  {
    id: "hiring",
    title: "Hiring / HR",
    description: "Recruitment and employee management AI tools",
    icon: Users,
  },
  {
    id: "insurance",
    title: "Insurance",
    description: "Risk assessment and claims processing AI systems",
    icon: Shield,
  },
  {
    id: "public-sector",
    title: "Public Sector",
    description: "Government and public service AI applications",
    icon: Building,
  },
];

export default function Industry() {
  return (
    <>
      <WorkflowProgress currentStep="industry" />
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-foreground mb-4">Select Industry</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Choose the industry sector where your AI system operates
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {industries.map((industry) => {
              const Icon = industry.icon;
              return (
                <Link key={industry.id} href="/ai-system">
                  <Card className="cursor-pointer hover:shadow-md transition-shadow duration-200 h-full">
                    <CardHeader className="text-center">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                        <Icon className="w-6 h-6" />
                      </div>
                      <CardTitle className="text-xl">{industry.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-center">
                        {industry.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
