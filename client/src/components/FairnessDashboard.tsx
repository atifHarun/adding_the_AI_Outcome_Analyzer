import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { z } from "zod";
import { analyzeResponseSchema } from "@shared/schema";

type AnalyzeResponse = z.infer<typeof analyzeResponseSchema>;

export function FairnessDashboard({ data }: { data: AnalyzeResponse }) {
  if (!data || !data.fairness_results) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="shadow-sm border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardDescription className="font-medium">Total Rows Analyzed</CardDescription>
            <CardTitle className="text-3xl font-display">
              {data.dataset_summary.rows.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-sm border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardDescription className="font-medium">Sensitive Attributes</CardDescription>
            <CardTitle className="text-3xl font-display flex gap-2 flex-wrap">
              {data.dataset_summary.sensitive_columns_analyzed.map((col) => (
                <Badge key={col} variant="secondary" className="text-sm rounded-md px-3 py-1">
                  {col}
                </Badge>
              ))}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="space-y-6">
        <h3 className="text-2xl font-display font-semibold tracking-tight">Fairness Results</h3>
        {Object.entries(data.fairness_results).map(([attribute, result]) => {
          const chartData = Object.entries(result.subgroups).map(([name, metrics]) => ({
            name,
            SelectionRate: Number((metrics.selection_rate * 100).toFixed(1)),
            TPR: Number((metrics.tpr * 100).toFixed(1)),
            FPR: Number((metrics.fpr * 100).toFixed(1)),
          }));

          const riskColors = {
            LOW: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-300",
            MEDIUM: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900 dark:text-amber-300",
            HIGH: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-300",
          };

          return (
            <Card key={attribute} className="overflow-hidden shadow-md shadow-black/5">
              <CardHeader className="border-b bg-muted/20 pb-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl capitalize font-display flex items-center gap-3">
                      {attribute}
                      <Badge
                        variant="outline"
                        className={`px-3 py-1 uppercase tracking-wider text-xs font-bold ${
                          riskColors[result.risk_flag]
                        }`}
                      >
                        {result.risk_flag} RISK
                      </Badge>
                    </CardTitle>
                    <CardDescription>Metrics computed across {chartData.length} subgroups</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Disparities Summary */}
                  <div className="space-y-6 lg:col-span-1">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                      Key Disparities
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Adverse Impact Ratio</p>
                        <p className={`text-2xl font-semibold ${result.disparities.air < 0.8 ? 'text-red-500' : 'text-foreground'}`}>
                          {result.disparities.air.toFixed(3)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Predictive Parity</p>
                        <p className="text-2xl font-semibold">
                          {result.disparities.predictive_parity_diff.toFixed(3)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">TPR Disparity</p>
                        <p className="text-2xl font-semibold">
                          {result.disparities.tpr_disparity.toFixed(3)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">FPR Disparity</p>
                        <p className="text-2xl font-semibold">
                          {result.disparities.fpr_disparity.toFixed(3)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator className="lg:hidden" />

                  {/* Visualization */}
                  <div className="lg:col-span-2 space-y-4">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Subgroup Comparison (%)
                    </h4>
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#6b7280', fontSize: 12 }} 
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#6b7280', fontSize: 12 }} 
                          />
                          <Tooltip
                            cursor={{ fill: '#f3f4f6' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                          <Bar dataKey="SelectionRate" name="Selection Rate" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="TPR" name="True Positive Rate" fill="#64748b" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="FPR" name="False Positive Rate" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
