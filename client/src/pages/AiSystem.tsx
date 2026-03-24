import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WorkflowProgress } from "@/components/WorkflowProgress";
import { Brain, FileText, Camera, Star } from "lucide-react";

const aiSystems = [
  {
    id: "classification",
    title: "Classification Models",
    description: "Binary and multi-class classification systems for decision making",
    icon: Brain,
  },
  {
    id: "llm",
    title: "LLM Applications",
    description: "Large language models for text generation and understanding",
    icon: FileText,
  },
  {
    id: "computer-vision",
    title: "Computer Vision Systems",
    description: "Image and video analysis AI applications",
    icon: Camera,
  },
  {
    id: "recommendation",
    title: "Recommendation Systems",
    description: "Personalized content and product recommendation engines",
    icon: Star,
  },
];

export default function AiSystem() {
  return (
    <>
      <WorkflowProgress currentStep="ai-system" />
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-foreground mb-4">
              Select AI System Type
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Choose the type of AI system you want to evaluate
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {aiSystems.map((system) => {
              const Icon = system.icon;
              return (
                <Link key={system.id} href="/marketplace">
                  <Card className="cursor-pointer hover:shadow-md transition-shadow duration-200 h-full">
                    <CardHeader className="text-center">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                        <Icon className="w-6 h-6" />
                      </div>
                      <CardTitle className="text-xl">{system.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-center">
                        {system.description}
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
