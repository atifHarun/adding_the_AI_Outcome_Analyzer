import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WorkflowProgress } from "@/components/WorkflowProgress";
import { isFeatureEnabled } from "@/config/featureFlags";
import { 
  Scale, 
  Eye, 
  Shield, 
  FileCheck, 
  ChevronRight,
  Brain,
  BarChart3,
  Zap,
  Users,
  Lock,
  Settings,
  FileText,
  Globe,
  AlertTriangle
} from "lucide-react";

const tools = [
  {
    id: "system-usecase",
    title: "System usecase",
    description: "Configure your AI system profile usecase",
    icon: Settings,
    category: "AI System Profile",
    route: "/ai-system",
    featureFlag: "system_usecase" as const,
  },
  {
    id: "operational-geography",
    title: "Operational Geography",
    description: "Configure your AI system profile operational geography",
    icon: Globe,
    category: "AI System Profile",
    route: "/ai-system",
    featureFlag: "operational_geography" as const,
  },
  {
    id: "decision-outcomes",
    title: "Decision Outcomes",
    description: "Configure your AI system profile decision outcomes",
    icon: FileText,
    category: "AI System Profile",
    route: "/ai-system",
    featureFlag: "decision_outcomes" as const,
  },
  {
    id: "risk-sensitivity",
    title: "Risk Sensitivity",
    description: "Configure your AI system profile risk sensitivity",
    icon: AlertTriangle,
    category: "AI System Profile",
    route: "/ai-system",
    featureFlag: "risk_sensitivity" as const,
  },
  {
    id: "model-fairness-analyzer",
    title: "Model Fairness Analyser",
    description: "Monitor and analyze fairness in scoring models",
    icon: BarChart3,
    category: "Bias & Fairness",
    route: "/tool",
    featureFlag: "model_fairness_analyzer" as const,
  },
  {
    id: "lending-fairness-analyzer",
    title: "Lending Fairness Analyzer",
    description: "Analyze fairness in lending decisions across demographics",
    icon: Scale,
    category: "Bias & Fairness",
    route: "/tool",
    featureFlag: "fairness_analyzer_monitor" as const, 
  },
  {
    id: "hiring-bias-monitor",
    title: "Hiring Bias Monitor",
    description: "Detect bias in hiring and recruitment algorithms",
    icon: Users,
    category: "Bias & Fairness",
    route: "/tool",
    featureFlag: "hiring_bias_monitor" as const,
  },
  {
    id: "model-explainability-tool",
    title: "Model Explainability Tool",
    description: "Explain AI model decisions and feature importance",
    icon: Eye,
    category: "Transparency",
    route: "/tool",
    featureFlag: "model_explainability_monitor" as const,
  },
  {
    id: "data-minimization-analyzer",
    title: "Data Minimization Analyzer",
    description: "Analyze data collection practices for minimization compliance",
    icon: FileCheck,
    category: "Data Governance",
    route: "/tool",
    featureFlag: "data_minimization_analyzer" as const,
  },
  {
    id: "dataset-risk-analyzer",
    title: "Dataset Risk Analyzer",
    description: "Scan datasets for governance risks and compliance issues",
    icon: FileCheck,
    category: "Data Governance",
    route: "/dataset-tool",
    featureFlag: "data_risk_analyzer" as const, 
  },
  {
    id: "adversarial-risk-scanner",
    title: "Adversarial Risk Scanner",
    description: "Scan for vulnerabilities to adversarial attacks",
    icon: Shield,
    category: "Safety",
    route: "/tool",
    featureFlag: "adversarial_risk_scanner" as const, 
  },
  {
    id: "prompt-risk-analyzer",
    title: "Prompt Risk Analyzer",
    description: "Analyze and mitigate risks in AI prompts",
    icon: Brain,
    category: "Safety",
    route: "/tool",
    featureFlag: "prompt_risk_analyzer" as const,
  },
  {
    id: "hallucination-monitor",
    title: "Hallucination Monitor",
    description: "Monitor and detect AI model hallucinations",
    icon: Zap,
    category: "Safety",
    route: "/tool",
    featureFlag: "hallucination_monitor" as const,
  },
  {
    id: "ai-regulation-checker",
    title: "AI Regulation Checker",
    description: "Check compliance with AI regulations and standards",
    icon: FileCheck,
    category: "Compliance",
    route: "/tool",
    featureFlag: "regulation_checker" as const, 
  },
];

const categories = ["AI System Profile", "Bias & Fairness", "Transparency", "Data Governance", "Safety", "Compliance"];

const categoryIcons = {
  "AI System Profile": Settings,
  "Bias & Fairness": Scale,
  "Transparency": Eye,
  "Data Governance": FileCheck,
  "Safety": Shield,
  "Compliance": FileCheck,
};

export default function Marketplace() {
  const toolsByCategory = categories.map(category => ({
    name: category,
    tools: tools.filter(tool => tool.category === category),
  }));

  return (
    <>
      <WorkflowProgress currentStep="marketplace" />
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-foreground mb-4">Governance Tools Marketplace</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Choose the appropriate governance tool for your AI system evaluation
            </p>
          </div>

          {toolsByCategory.map((category) => {
            const CategoryIcon = categoryIcons[category.name as keyof typeof categoryIcons];
            return (
              <div key={category.name} className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <CategoryIcon className="w-4 h-4" />
                  </div>
                  <h2 className="text-2xl font-semibold text-foreground">{category.name}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {category.tools.map((tool) => {
                    const ToolIcon = tool.icon;
                    const isEnabled = isFeatureEnabled(tool.featureFlag);
                    return (
                      <Card key={tool.id} className="h-full">
                        <CardHeader>
                          <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                            <ToolIcon className="w-6 h-6" />
                          </div>
                          <CardTitle className="text-lg">{tool.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <CardDescription className="mb-4">
                            {tool.description}
                          </CardDescription>
                          {isEnabled ? (
                            <Link href={tool.route}>
                              <Button className="w-full gap-2">
                                Run Tool
                                <ChevronRight className="w-4 h-4" />
                              </Button>
                            </Link>
                          ) : (
                            <Button className="w-full gap-2" variant="outline" disabled>
                              <Lock className="w-4 h-4" />
                              Available in full platform
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
