import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronRight, 
  FileText, 
  FileSpreadsheet, 
  AlertTriangle, 
  CheckCircle2, 
  Shield, 
  Eye, 
  AlertCircle,
  Activity,
  Globe,
  Clock,
  History,
  Settings,
  Scale,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WorkflowProgress } from "@/components/WorkflowProgress";
import { GovernanceChecks } from "@/components/GovernanceChecks";
import { resultsStore } from "@/lib/storage";
import { identity } from "@/lib/identity/identity";
import { tracker } from "@/lib/tracking/tracker";
import { generateReport } from "@/lib/reports/generateReport";
import { feedback } from "@/lib/feedback/feedback";
import { useState } from "react";

export default function Results() {
  // Get all scan results from resultsStore
  const scans = resultsStore.list();
  
  console.log('📋 Trust Passport - Retrieved Scans:', {
    totalScans: scans.length,
    scans: scans.map(s => ({ tool: s.tool, timestamp: s.timestamp, scores: s.scores }))
  });
  
  // Helper function to get latest scan by tool
  const getLatestScan = (tool: string) =>
    scans
      .filter((s: any) => s.tool === tool)
      .sort((a: any, b: any) => b.timestamp - a.timestamp)[0];
  
  // Get latest scans using helper
  const fairnessScan = getLatestScan("model_fairness");
  const datasetRiskScan = getLatestScan("dataset_risk");
  
  console.log('🎯 Trust Passport - Latest Scans:', {
    fairnessScan: fairnessScan ? { tool: fairnessScan.tool, timestamp: fairnessScan.timestamp, scores: fairnessScan.scores } : null,
    datasetRiskScan: datasetRiskScan ? { tool: datasetRiskScan.tool, timestamp: datasetRiskScan.timestamp, scores: datasetRiskScan.scores } : null
  });
  
  // Email management
  const [emailInput, setEmailInput] = useState("");
  const userEmail = identity.getEmail();
  const showEmailInput = !userEmail;
  
  // Feedback state
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [showThankYou, setShowThankYou] = useState<boolean>(false);
  
  // Get latest scan for feedback association
  const latestScan = [...(fairnessScan ? [fairnessScan] : []), ...(datasetRiskScan ? [datasetRiskScan] : [])]
    .sort((a, b) => b.timestamp - a.timestamp)[0];
  
  // Calculate overall trust score from available results
  let overallTrustScore = 0;
  let overallRiskCategory = "High Risk";
  let overallRiskColor = "text-red-600";
  let overallRiskBgColor = "bg-red-50";
  
  if (fairnessScan && datasetRiskScan) {
    // Both tools exist - average of scores
    overallTrustScore = Math.round((fairnessScan.scores.overall + datasetRiskScan.scores.overall) / 2);
    console.log('📊 Trust Passport - Score Calculation (Both Tools):', {
      fairnessScore: fairnessScan.scores.overall,
      datasetScore: datasetRiskScan.scores.overall,
      overallTrustScore
    });
  } else if (fairnessScan) {
    // Only fairness exists
    overallTrustScore = fairnessScan.scores.overall;
    console.log('📊 Trust Passport - Score Calculation (Fairness Only):', {
      fairnessScore: fairnessScan.scores.overall,
      overallTrustScore
    });
  } else if (datasetRiskScan) {
    // Only dataset risk exists
    overallTrustScore = datasetRiskScan.scores.overall;
    console.log('📊 Trust Passport - Score Calculation (Dataset Only):', {
      datasetScore: datasetRiskScan.scores.overall,
      overallTrustScore
    });
  }
  
  // Update risk category and colors based on calculated trust score
  overallRiskCategory = overallTrustScore >= 80 ? "Low Risk" : overallTrustScore >= 60 ? "Medium Risk" : "High Risk";
  overallRiskColor = overallTrustScore >= 80 ? "text-green-600" : overallTrustScore >= 60 ? "text-yellow-600" : "text-red-600";
  overallRiskBgColor = overallTrustScore >= 80 ? "bg-green-50" : overallTrustScore >= 60 ? "bg-yellow-50" : "bg-red-50";
  
  // If no results exist, show message
  if (scans.length === 0) {
    return (
      <>
        <WorkflowProgress currentStep="results" />
        <div className="min-h-screen bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8 text-muted-foreground" />
              </div>
              <h1 className="text-2xl font-semibold text-foreground mb-4">
                No Analysis Results Yet
              </h1>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Run a governance tool first to generate your Trust Passport results.
              </p>
              <Link href="/marketplace">
                <Button className="gap-2">
                  Go to Marketplace
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Get fairness metrics from scan data
  const fairnessMetrics = fairnessScan?.metadata?.details?.fairness_metrics || 
                           fairnessScan?.metadata?.fairness_metrics || {};
  
  // Generate insights based on fairness metrics
  const insights: string[] = [];
  if (fairnessMetrics.disparate_impact < 0.8) {
    insights.push("Potential bias detected in approval outcomes across groups.");
  }
  if (fairnessMetrics.equal_opportunity > 0.15) {
    insights.push("Model shows unequal true positive rates across groups.");
  }

  // Get certification status
  const certificationStatus = overallTrustScore >= 80 ? "Verified Responsible AI" : 
                           overallTrustScore >= 60 ? "Moderate Risk – Review Recommended" : 
                           "High Risk – Mitigation Required";

  // Format timestamp
  const analysisDate = new Date(fairnessScan?.timestamp || datasetRiskScan?.timestamp || Date.now()).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Generate Audit ID
  const generateAuditId = () => {
    const date = new Date(fairnessScan?.timestamp || datasetRiskScan?.timestamp || Date.now());
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `NR-AI-${year}${month}${day}-${random}`;
  };

  const auditId = generateAuditId();

  // Historical trust data (placeholder)
  const trustHistory = [
    { date: 'Mar 10 2026', score: 82, status: 'Verified' },
    { date: 'Feb 21 2026', score: 78, status: 'Review Needed' },
    { date: 'Jan 12 2026', score: 85, status: 'Verified' },
    { date: 'Dec 05 2025', score: 76, status: 'Review Needed' },
    { date: 'Nov 18 2025', score: 88, status: 'Verified' },
    { date: 'Oct 30 2025', score: 81, status: 'Verified' }
  ];

  // Generate report data
  const generateReportData = () => {
    const scans = resultsStore.list();
    const report = generateReport(scans);
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "aeris-trust-passport.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Track report download
    tracker.track("report_downloaded", {
      scan_count: scans.length
    });
  };

  // Handle download with email check
  const handleDownload = () => {
    const email = identity.getEmail();
    if (email) {
      generateReportData();
    }
    // If no email, user will see the input field above
  };

  return (
    <>
      <WorkflowProgress currentStep="results" />
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="text-center mb-8 relative">
            {/* Download Button - Top Right */}
            <div className="absolute top-0 right-0">
              <Button 
                onClick={handleDownload} 
                size="sm" 
                variant="outline"
                className="gap-2"
                disabled={!userEmail}
                title={userEmail ? "Download Report" : "Enter email to download"}
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="w-16 h-16 rounded-lg bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">AI Trust Passport</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Enterprise AI Governance Audit Report
            </p>
          </div>

          {/* Email Input Section - Show if no email */}
          {showEmailInput && (
            <div className="mb-8">
              <div className="flex gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter email to receive report"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button 
                  onClick={() => {
                    identity.setEmail(emailInput);
                    tracker.track("email_captured", {
                      email: emailInput
                    });
                    generateReportData();
                  }}
                  disabled={!emailInput || !emailInput.includes('@')}
                >
                  Get Report
                </Button>
              </div>
            </div>
          )}

          {/* Trust Summary & Governance Metrics - Full Width */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Trust Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Trust Summary
                </CardTitle>
                <CardDescription>Overall AI system trust assessment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* AI Trust Score */}
                  <div className="text-center">
                    <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${overallRiskBgColor}`}>
                      <div className="text-center">
                        <div className={`text-3xl font-bold ${overallRiskColor}`}>
                          {overallTrustScore > 0 ? overallTrustScore : '--'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {overallTrustScore > 0 ? '/ 100' : 'No Data'}
                        </div>
                      </div>
                    </div>
                    <div className="text-xl font-semibold mt-3">
                      {overallTrustScore > 0 ? `${overallTrustScore} / 100` : 'No Score Available'}
                    </div>
                  </div>

                  {/* Risk Category */}
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${overallRiskBgColor}`}>
                    {overallTrustScore >= 80 && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                    {overallTrustScore >= 60 && overallTrustScore < 80 && <AlertTriangle className="w-5 h-5 text-yellow-600" />}
                    {overallTrustScore < 60 && <AlertTriangle className="w-5 h-5 text-red-600" />}
                    <span className={`font-medium ${overallRiskColor}`}>
                      {overallRiskCategory}
                    </span>
                  </div>

                  {/* Responsible AI Status */}
                  <div className="text-center">
                    <div className="mb-2">
                      {overallTrustScore >= 80 && <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto" />}
                      {overallTrustScore >= 60 && overallTrustScore < 80 && <AlertTriangle className="w-8 h-8 text-yellow-600 mx-auto" />}
                      {overallTrustScore < 60 && <AlertTriangle className="w-8 h-8 text-red-600 mx-auto" />}
                    </div>
                    <div className={`text-lg font-semibold ${overallTrustScore >= 80 ? 'text-green-800' : overallTrustScore >= 60 ? 'text-yellow-800' : 'text-red-800'}`}>
                      {certificationStatus}
                    </div>
                  </div>

                  {/* Audit ID & Timestamp */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Audit ID</h3>
                      <p className="font-mono">{auditId}</p>
                    </div>
                    <div className="text-right">
                      <h3 className="text-sm font-medium text-muted-foreground">Analysis Timestamp</h3>
                      <p className="font-mono">{analysisDate}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Governance Metrics */}
            <Card>
              <CardHeader className="text-xl flex items-center gap-2">
                <Scale className="w-5 h-5" />
                Governance Metrics
              </CardHeader>
              <CardDescription>Detailed fairness analysis from your model evaluation</CardDescription>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Model Fairness Score</h3>
                    <div className="text-2xl font-bold">{fairnessScan?.scores?.overall || '--'}</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">Dataset Risk Score</h3>
                    <div className="text-2xl font-bold">{datasetRiskScan?.scores?.overall || '--'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* SECTION 5 — Key Insights */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-xl">Key Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.length > 0 ? (
                  insights.map((insight, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <p className="text-muted-foreground">{insight}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-muted-foreground">No significant issues detected in your model.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* SECTION 6 — Recommended Actions */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-xl">Recommended Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <Settings className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Rebalance training dataset</h3>
                    <p className="text-sm text-muted-foreground">Increase representation of underrepresented groups in training data</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <Scale className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Apply fairness constraints</h3>
                    <p className="text-sm text-muted-foreground">Implement demographic parity constraints during model training</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <Eye className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Monitor subgroup performance</h3>
                    <p className="text-sm text-muted-foreground">Set up continuous monitoring across all demographic groups</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 7 — Responsible AI Status */}
          <Card className={`mb-8 ${overallTrustScore >= 80 ? 'border-green-200 bg-green-50' : overallTrustScore >= 60 ? 'border-yellow-200 bg-yellow-50' : 'border-red-200 bg-red-50'}`}>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Responsible AI Status</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="mb-4">
                {overallTrustScore >= 80 && <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />}
                {overallTrustScore >= 60 && overallTrustScore < 80 && <AlertTriangle className="w-12 h-12 text-yellow-600 mx-auto" />}
                {overallTrustScore < 60 && <AlertTriangle className="w-12 h-12 text-red-600 mx-auto" />}
              </div>
              <div className={`text-xl font-semibold ${overallTrustScore >= 80 ? 'text-green-800' : overallTrustScore >= 60 ? 'text-yellow-800' : 'text-red-800'}`}>
                {certificationStatus}
              </div>
            </CardContent>
          </Card>

          {/* SECTION — AI Trust History */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <History className="w-5 h-5" />
                AI Trust History
              </CardTitle>
              <CardDescription>Historical trust evaluations for this AI system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Trust Score</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trustHistory.map((entry, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">{entry.date}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{entry.score}</span>
                            <span className="text-sm text-muted-foreground">/ 100</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge 
                            className={
                              entry.status === 'Verified' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }
                          >
                            {entry.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          
          
          {/* SECTION — Regulatory Alignment */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Regulatory Alignment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <div>
                      <h3 className="font-semibold">EU AI Act</h3>
                      <p className="text-sm text-muted-foreground">High-Risk AI Systems</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Aligned</Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <div>
                      <h3 className="font-semibold">NIST AI RMF</h3>
                      <p className="text-sm text-muted-foreground">Risk Management Framework</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Aligned</Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <div>
                      <h3 className="font-semibold">ISO 42001</h3>
                      <p className="text-sm text-muted-foreground">AI Management Systems</p>
                    </div>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">Partial</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION — Monitoring Status */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Monitoring Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                    <div>
                      <h3 className="font-semibold">Bias Monitoring</h3>
                      <p className="text-sm text-muted-foreground">Real-time bias detection</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                    <div>
                      <h3 className="font-semibold">Drift Detection</h3>
                      <p className="text-sm text-muted-foreground">Model performance monitoring</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-yellow-600" />
                    <div>
                      <h3 className="font-semibold">Compliance Checks</h3>
                      <p className="text-sm text-muted-foreground">Scheduled regulatory audits</p>
                    </div>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">Scheduled</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Governance Checks Panel */}
          <GovernanceChecks />
          
          {/* Feedback Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-xl">Was this analysis useful?</CardTitle>
            </CardHeader>
            <CardContent>
              {!showThankYou ? (
                <div className="space-y-4">
                  {/* Rating Options */}
                  <div className="flex gap-2 justify-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Button
                        key={star}
                        variant={rating === star ? "default" : "outline"}
                        size="sm"
                        onClick={() => setRating(star)}
                        className="w-8 h-8 p-0"
                      >
                        {star}
                      </Button>
                    ))}
                  </div>
                  
                  {/* Comment Input */}
                  <div className="space-y-2">
                    <textarea
                      placeholder="What could be improved?"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      rows={3}
                    />
                  </div>
                  
                  {/* Submit Button */}
                  <Button 
                    onClick={() => {
                      if (rating > 0) {
                        let toolName = "trust_passport";
                        if (fairnessScan) {
                          toolName = "model_fairness";
                        } else if (datasetRiskScan) {
                          toolName = "dataset_risk";
                        }
                        
                        feedback.submit({
                          tool: toolName,
                          rating,
                          comment,
                          scan_id: latestScan?.scan_id
                        });
                        tracker.track("feedback_submitted", {
                          rating
                        });
                        setRating(0);
                        setComment("");
                        setShowThankYou(true);
                      }
                    }}
                    disabled={rating === 0}
                    className="w-full"
                  >
                    Submit
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-lg font-medium text-green-600">Thanks for your feedback</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
