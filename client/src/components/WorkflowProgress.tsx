import { Link } from "wouter";
import { CheckCircle2, Circle } from "lucide-react";

interface WorkflowProgressProps {
  currentStep: 'industry' | 'ai-system' | 'marketplace' | 'tool' | 'dataset-tool' | 'results';
}

const steps = [
  { key: 'industry', label: 'Industry', href: '/industry' },
  { key: 'ai-system', label: 'AI System', href: '/ai-system' },
  { key: 'marketplace', label: 'Governance Tool', href: '/marketplace' },
  { key: 'tool', label: 'Analysis', href: '/tool' },
  { key: 'dataset-tool', label: 'Dataset Analysis', href: '/dataset-tool' },
  { key: 'results', label: 'Trust Passport', href: '/results' },
];

export function WorkflowProgress({ currentStep }: WorkflowProgressProps) {
  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.key === currentStep);
  };

  const currentStepIndex = getCurrentStepIndex();

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-center space-x-2 md:space-x-4">
          {steps.map((step, index) => {
            const isActive = step.key === currentStep;
            const isCompleted = index < currentStepIndex;
            
            return (
              <div key={step.key} className="flex items-center">
                <Link href={step.href}>
                  <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : isCompleted 
                        ? 'text-primary hover:bg-primary/10' 
                        : 'text-muted-foreground hover:text-foreground'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Circle className="w-4 h-4" />
                    )}
                    <span className="text-sm font-medium hidden sm:inline">{step.label}</span>
                  </div>
                </Link>
                {index < steps.length - 1 && (
                  <div className={`w-4 md:w-8 h-0.5 mx-1 md:mx-2 ${
                    index < currentStepIndex ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
