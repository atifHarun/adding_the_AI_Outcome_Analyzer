import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, FileSpreadsheet, AlertTriangle, CheckCircle2, Shield, Eye, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WorkflowProgress } from "@/components/WorkflowProgress";
import { scanDataset, DatasetScanResponse } from "@/services/datasetRiskService";
import { resultsStore } from "@/lib/storage";
import { buildScanResult } from "@/lib/results/buildScanResult";
import { tracker } from "@/lib/tracking/tracker";
import { isFeatureEnabled } from "@/config/featureFlags";

export default function DatasetTool() {
  console.log('DatasetTool component rendering'); // Debug log
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<DatasetScanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile && uploadedFile.type === 'text/csv') {
      setFile(uploadedFile);
      setError(null);
      setStep(2);
    } else {
      setError('Please upload a valid CSV file');
    }
  }, []);

  const handleScan = useCallback(async () => {
    if (!file) {
      setError('Please upload a file first');
      return;
    }

    setIsScanning(true);
    setError(null);

    try {
      const result = await scanDataset(file);
      console.log('API Response:', result); // Debug log
      console.log('Setting scanResult to:', result); // Debug log
      setScanResult(result);
      console.log('scanResult state set'); // Debug log
      
      // Log dataset score creation
      console.log('🔍 Dataset Tool - Score Creation:', {
        score: result.score,
        risk_level: result.risk_level,
        governance_score: result.score // Using score as governance score
      });
      
      // Create and save ScanResult object using buildScanResult
      const scanResult = buildScanResult({
        tool: "dataset_risk",
        tool_label: "Dataset Risk Analyzer",
        scores: {
          overall: result.score
        },
        risks: result.signals || [],
        metadata: {
          columns: result.dataset_summary.columns,
          row_count: result.dataset_summary.rows
        }
      });
      
      // Basic validation before saving
      if (!scanResult || !scanResult.tool) return;
      
      // Prevent duplicate saves within same second (basic guard)
      const lastSaveTime = localStorage.getItem('lastDatasetSaveTime');
      const currentTime = Date.now();
      if (lastSaveTime && currentTime - parseInt(lastSaveTime) < 1000) return;
      
      resultsStore.save(scanResult);
      
      console.log('💾 Dataset Tool - ScanResult Saved:', scanResult);
      
      // Update last save time
      localStorage.setItem('lastDatasetSaveTime', currentTime.toString());
      
      // Track scan completion
      tracker.track("scan_run", {
        tool: "dataset_risk"
      });
      
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scan dataset');
    } finally {
      setIsScanning(false);
    }
  }, [file]);

  if (!isFeatureEnabled("data_risk_analyzer")) {
    return (
      <>
        <WorkflowProgress currentStep="marketplace" />
        <div className="min-h-screen bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
              <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-8 h-8 text-muted-foreground" />
              </div>
              <h1 className="text-2xl font-semibold text-foreground mb-4">
                Dataset Risk Analyzer
              </h1>
              <p className="text-muted-foreground max-w-md mx-auto">
                This tool is currently locked. Please contact your administrator to enable access.
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <WorkflowProgress currentStep="dataset-tool" />
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">Dataset Risk Analyzer</h1>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Upload and Scan datasets for governance risks and compliance issues
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle>Upload Dataset</CardTitle>
                <CardDescription>
                  Select a CSV file to scan for governance risks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <UploadCloud className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-4">
                      {file ? file.name : 'Choose a CSV file to upload'}
                    </p>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="inline-flex items-center justify-center w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer"
                    >
                      {file ? 'Change File' : 'Select CSV File'}
                    </label>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 text-red-800 rounded-lg">
                      <AlertCircle className="w-5 h-5" />
                      <span className="text-sm">{error}</span>
                    </div>
                  )}

                  <Button 
                    onClick={handleScan}
                    disabled={!file || isScanning}
                    className="w-full"
                  >
                    {isScanning ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 mr-2"
                        />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        Scan Dataset
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Results Section */}
            {scanResult && (
              <>
                {console.log('Rendering scanResult:', scanResult)} {/* Debug log */}
                <Card>
                <CardHeader>
                  <CardTitle>Scan Results</CardTitle>
                  <CardDescription>
                    Dataset governance analysis completed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Risk Score */}
                    <div className="text-center p-6 border rounded-lg bg-muted/50">
                      <h3 className="text-lg font-semibold mb-2">Dataset Risk Score</h3>
                      <div className="text-3xl font-bold text-primary">
                        {scanResult.score}/100
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {scanResult.risk_level || (scanResult.score >= 80 ? 'Low Risk' : 
                         scanResult.score >= 60 ? 'Medium Risk' : 'High Risk')}
                      </div>
                    </div>

                    {/* Signals Summary */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Signals Detected</h3>
                      <div className="flex items-center gap-2 mb-4">
                        <Badge variant={scanResult.signals_detected > 0 ? "destructive" : "secondary"}>
                          {scanResult.signals_detected} signals found
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {scanResult.signals_detected === 0 ? 'No issues detected' : 'Requires attention'}
                        </span>
                      </div>
                    </div>

                    {/* Signals List */}
                    {scanResult.signals && scanResult.signals.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Detailed Signals</h3>
                        <div className="space-y-3">
                          {scanResult.signals.map((signal, index) => (
                            <div key={index} className="p-4 border rounded-lg">
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0">
                                  {signal.severity === 'high' && <AlertTriangle className="w-5 h-5 text-red-600" />}
                                  {signal.severity === 'medium' && <AlertTriangle className="w-5 h-5 text-yellow-600" />}
                                  {signal.severity === 'low' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold mb-1">{signal.type}</h4>
                                  <p className="text-sm text-muted-foreground mb-2">{signal.description}</p>
                                  {signal.location && (
                                    <div className="text-xs text-muted-foreground">
                                      {signal.location.row && <span>Row {signal.location.row}</span>}
                                      {signal.location.row && signal.location.column && <span>, Column {signal.location.column}</span>}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    <div className="text-center mt-6">
                      <Button onClick={() => window.location.href = '/results'} className="gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        View Trust Passport
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              </>
            )}
          </div>
        </div>
      </div>
      </>
    );
}
