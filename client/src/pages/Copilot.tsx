import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Bot, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  Lightbulb,
  Target,
  BarChart3,
  RefreshCw
} from "lucide-react";

export default function Copilot() {
  const insights = [
    {
      type: "bias",
      title: "Age-Related Bias Detected",
      message: "The model shows moderate bias against applicants under 25, with approval rates 15% lower compared to other age groups.",
      severity: "moderate",
      icon: AlertTriangle,
    },
    {
      type: "performance",
      title: "Model Performance Analysis",
      message: "Overall model accuracy is strong at 87%, but precision varies significantly across demographic subgroups.",
      severity: "low",
      icon: BarChart3,
    },
    {
      type: "fairness",
      title: "Fairness Metrics Summary",
      message: "Statistical parity difference is within acceptable bounds (0.08), but equal opportunity gap needs attention.",
      severity: "moderate",
      icon: Target,
    },
  ];

  const recommendations = [
    {
      title: "Rebalance Training Dataset",
      description: "Increase representation of under-25 applicants in training data to reduce age bias",
      priority: "high",
      icon: RefreshCw,
    },
    {
      title: "Apply Fairness Constraints",
      description: "Implement demographic parity constraints during model training to ensure equal outcomes",
      priority: "high",
      icon: Target,
    },
    {
      title: "Monitor Subgroup Performance",
      description: "Set up continuous monitoring of model performance across all demographic groups",
      priority: "medium",
      icon: BarChart3,
    },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "bg-red-100 text-red-800 border-red-200";
      case "moderate": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-red-600 bg-red-50";
      case "medium": return "text-yellow-600 bg-yellow-50";
      case "low": return "text-green-600 bg-green-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Bot className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">AI Governance Copilot</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            AI-powered insights and recommendations for improving your model's fairness and governance
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* AI Insights Section */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Lightbulb className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-semibold text-foreground">Model Insights</h2>
            </div>

            <div className="space-y-4">
              {insights.map((insight, index) => {
                const Icon = insight.icon;
                return (
                  <Card key={index} className="border-l-4 border-l-primary/50">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{insight.title}</CardTitle>
                            <Badge className={`mt-1 ${getSeverityColor(insight.severity)}`}>
                              {insight.severity} priority
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed">
                        {insight.message}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Recommendations Section */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Target className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-semibold text-foreground">Recommendations</h2>
            </div>

            <div className="space-y-4">
              {recommendations.map((rec, index) => {
                const Icon = rec.icon;
                return (
                  <Card key={index} className="hover:shadow-md transition-shadow duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-foreground">{rec.title}</h3>
                            <Badge variant="outline" className={getPriorityColor(rec.priority)}>
                              {rec.priority} priority
                            </Badge>
                          </div>
                          <p className="text-muted-foreground leading-relaxed">
                            {rec.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Action Section */}
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">Analysis Complete</span>
              </div>
              <p className="text-muted-foreground mb-4">
                Apply these recommendations to improve your model's fairness score and governance compliance
              </p>
              <div className="flex gap-3 justify-center">
                <Button className="gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Apply Recommendations
                </Button>
                <Button variant="outline" className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Re-run Analysis
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
