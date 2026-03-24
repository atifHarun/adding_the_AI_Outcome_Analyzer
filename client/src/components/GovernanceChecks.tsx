import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, AlertTriangle, Eye } from "lucide-react";

interface GovernanceCheck {
  id: string;
  name: string;
  status: 'completed' | 'pending' | 'in-progress';
  lastRun?: string;
}

export function GovernanceChecks() {
  const checks: GovernanceCheck[] = [
    {
      id: 'bias-scan',
      name: 'Bias Scan',
      status: 'completed',
      lastRun: '2 hours ago'
    },
    {
      id: 'compliance-scan',
      name: 'Compliance Scan',
      status: 'pending',
      lastRun: 'Scheduled'
    },
    {
      id: 'transparency-scan',
      name: 'Transparency Scan',
      status: 'pending',
      lastRun: 'Scheduled'
    },
    {
      id: 'safety-scan',
      name: 'Safety Scan',
      status: 'in-progress',
      lastRun: 'Running...'
    }
  ];

  const getStatusIcon = (status: GovernanceCheck['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'in-progress':
        return <Clock className="w-4 h-4 text-blue-600 animate-pulse" />;
      case 'pending':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: GovernanceCheck['status']) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'in-progress':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Eye className="w-5 h-5" />
          Governance Checks
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {checks.map((check) => (
            <div key={check.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                {getStatusIcon(check.status)}
                <div>
                  <h3 className="font-semibold">{check.name}</h3>
                  {check.lastRun && (
                    <p className="text-sm text-muted-foreground">{check.lastRun}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(check.status)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
