import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Sparkles, ShieldCheck, Loader2, AlertCircle } from "lucide-react";

type Mode = "normal" | "expert";

interface AnalysisSection {
  title: string | null;
  items: string[];
}

const SAMPLE_JSON = {
  useCaseName: "Customer Support Chatbot",
  systemType: "Text-based conversational AI",
  primaryFunction: "Answering FAQs and providing product tracking information.",
  contextOfUse: { industry: "Retail", environment: "Customer-facing" },
  stakeholders: {
    primaryUsers: ["Customers", "Support Agents"],
    indirectlyAffectedParties: ["Retail Managers"],
    oversightOwners: ["Compliance Team"],
  },
  decisionsAndActions: {
    decisionsMadeBySystem: ["Identifying user intent", "Selecting best FAQ response"],
    actionsExecutedAutomatically: ["Displaying tracking status"],
    actionsRequiringHumanApproval: ["Processing refunds"],
  },
  dataInputs: {
    dataTypesUsed: ["Order IDs", "Customer Names"],
    dataSources: ["Order Management System"],
    personalOrSensitiveData: true,
  },
  modelAutonomyLevel: "Recommendation with human decision",
  scaleAndReach: {
    expectedNumberOfUsers: "1 million monthly",
    frequencyOfUse: "Daily",
    geographicScope: "National",
  },
};

function parseAnalysis(text: string): AnalysisSection[] {
  const lines = text.replace(/\*\*/g, "").split("\n");
  const sections: AnalysisSection[] = [];
  let currentSection: AnalysisSection | null = null;

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    const headingMatch = trimmed.match(/^(?:\d+\.\s+|###\s+)(.*)/);
    if (headingMatch) {
      currentSection = { title: headingMatch[1], items: [] };
      sections.push(currentSection);
      return;
    }

    if (
      trimmed.startsWith("- ") ||
      trimmed.startsWith("* ") ||
      trimmed.match(/^\d+\.\s/)
    ) {
      const itemText = trimmed.replace(/^[-*]\s+|\d+\.\s+/, "");
      if (currentSection) {
        currentSection.items.push(itemText);
      } else {
        const fallback: AnalysisSection = { title: null, items: [itemText] };
        sections.push(fallback);
        currentSection = fallback;
      }
      return;
    }

    if (currentSection && !trimmed.match(/^[#\d]/)) {
      if (currentSection.items.length > 0) {
        currentSection.items[currentSection.items.length - 1] += " " + trimmed;
      } else {
        currentSection.items.push(trimmed);
      }
    }
  });

  return sections;
}

export default function AiAnalyzer() {
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>("normal");
  const [description, setDescription] = useState("");
  const [jsonText, setJsonText] = useState(JSON.stringify(SAMPLE_JSON, null, 2));
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [resultsState, setResultsState] = useState<"empty" | "loading" | "results">("empty");
  const [loadingMsg, setLoadingMsg] = useState({ title: "", subtitle: "" });
  const [modalOpen, setModalOpen] = useState(false);

  const generateJsonMutation = useMutation({
    mutationFn: async (desc: string) => {
      const res = await fetch("/api/ai-analyzer/generate-json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: desc }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Generation failed.");
      return data.json as object;
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: async (json: object) => {
      const res = await fetch("/api/ai-analyzer/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Analysis failed.");
      return data.analysis as string;
    },
  });

  const isNormalLoading = generateJsonMutation.isPending || analyzeMutation.isPending;

  async function generateAndAnalyze() {
    if (!description.trim()) {
      toast({ title: "Please enter a description first.", variant: "destructive" });
      return;
    }
    setResultsState("loading");
    setLoadingMsg({
      title: "Generating structured AI definition...",
      subtitle: "Converting your description into a formal JSON schema...",
    });

    let generatedJson: object;
    try {
      generatedJson = await generateJsonMutation.mutateAsync(description);
      setJsonText(JSON.stringify(generatedJson, null, 2));
    } catch (err: any) {
      toast({ title: err.message || "Generation failed. Please try again.", variant: "destructive" });
      setResultsState("empty");
      return;
    }

    setLoadingMsg({
      title: "Analyzing potential outcomes...",
      subtitle: "The AI is projecting potential ethical, legal, and social impacts.",
    });

    try {
      const result = await analyzeMutation.mutateAsync(generatedJson);
      setAnalysis(result);
      setSelectedItems(new Set());
      setResultsState("results");
      toast({ title: "Analysis complete." });
    } catch (err: any) {
      toast({ title: err.message || "Analysis failed. Please try again.", variant: "destructive" });
      setResultsState("empty");
    }
  }

  async function generateJson() {
    if (!description.trim()) {
      toast({ title: "Please enter a description first.", variant: "destructive" });
      return;
    }
    try {
      const json = await generateJsonMutation.mutateAsync(description);
      setJsonText(JSON.stringify(json, null, 2));
      toast({ title: "Structured JSON generated and inserted." });
    } catch (err: any) {
      toast({ title: err.message || "Generation failed. Please try again.", variant: "destructive" });
    }
  }

  async function analyze() {
    let parsed: object;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      toast({ title: "Invalid JSON format. Please check your input.", variant: "destructive" });
      return;
    }
    setResultsState("loading");
    setLoadingMsg({
      title: "Analyzing potential outcomes...",
      subtitle: "The AI is projecting potential ethical, legal, and social impacts based on your formal definition.",
    });
    try {
      const result = await analyzeMutation.mutateAsync(parsed);
      setAnalysis(result);
      setSelectedItems(new Set());
      setResultsState("results");
      toast({ title: "Analysis complete." });
    } catch (err: any) {
      toast({ title: err.message || "Analysis failed. Please try again.", variant: "destructive" });
      setResultsState("empty");
    }
  }

  function toggleItem(item: string) {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });
  }

  function copyMarkdown() {
    if (!analysis) return;
    navigator.clipboard.writeText(analysis).then(() => toast({ title: "Copied to clipboard." }));
  }

  function exportSelected() {
    if (selectedItems.size === 0) {
      toast({ title: "Please select at least one outcome.", variant: "destructive" });
      return;
    }
    setModalOpen(true);
  }

  const sections = analysis ? parseAnalysis(analysis) : [];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1100px] mx-auto px-4 py-8">
        <header className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-3 text-foreground">
            <ShieldCheck className="w-10 h-10" />
            <h1 className="text-4xl font-bold tracking-tight">AI Outcome Analyzer</h1>
          </div>
          <h2 className="text-xl italic text-muted-foreground mb-2">
            "What are the other potential outcomes of this AI solution?"
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Analyze structured AI use cases for ethical, legal, and social impacts using our formal schema.
          </p>
        </header>

        <div className="flex items-center justify-center gap-3 mb-8">
          <span className="text-sm font-semibold text-muted-foreground">Mode:</span>
          <div className="inline-flex border rounded-full overflow-hidden bg-muted border-border">
            <button
              onClick={() => setMode("normal")}
              className={`px-5 py-1.5 text-sm font-semibold rounded-full transition-colors ${
                mode === "normal"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid="button-mode-normal"
            >
              Normal
            </button>
            <button
              onClick={() => setMode("expert")}
              className={`px-5 py-1.5 text-sm font-semibold rounded-full transition-colors ${
                mode === "expert"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid="button-mode-expert"
            >
              Expert
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b bg-muted/30">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Sparkles className="w-[18px] h-[18px]" />
                AI System Definition
                <Badge variant="secondary" className="text-xs font-semibold uppercase ml-1">
                  {mode}
                </Badge>
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {mode === "normal"
                  ? "Describe your AI system — one click generates and analyzes it."
                  : "Describe your AI system or provide structured JSON."}
              </p>
            </div>
            <div className="p-6">
              <div className="bg-muted/40 border rounded-lg p-4">
                <label className="block text-sm font-medium mb-2">
                  Describe the AI system you want to define:
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., 'A customer support chatbot that answers FAQs and provides order tracking information to customers online. It runs 24/7 and is trained on internal product documentation.'"
                  disabled={isNormalLoading}
                  className="min-h-[100px] resize-y"
                  data-testid="input-description"
                />
                <div className="mt-4">
                  {mode === "normal" ? (
                    <Button
                      className="w-full gap-2"
                      onClick={generateAndAnalyze}
                      disabled={isNormalLoading}
                      data-testid="button-generate-analyze"
                    >
                      {isNormalLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {generateJsonMutation.isPending
                            ? "Generating structured AI definition..."
                            : "Analyzing potential outcomes..."}
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Generate &amp; Analyze
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={generateJson}
                      disabled={generateJsonMutation.isPending}
                      data-testid="button-generate-json"
                    >
                      {generateJsonMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating structured AI definition...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Generate Structured JSON
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {mode === "expert" && (
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-2">AI Use Case JSON:</label>
                  <Textarea
                    value={jsonText}
                    onChange={(e) => setJsonText(e.target.value)}
                    className="min-h-[340px] font-mono text-xs border-2 resize-y"
                    spellCheck={false}
                    data-testid="input-json"
                  />
                  <div className="flex gap-3 mt-3">
                    <Button
                      className="flex-1 gap-2"
                      onClick={analyze}
                      disabled={analyzeMutation.isPending}
                      data-testid="button-analyze"
                    >
                      {analyzeMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Analyzing potential outcomes...
                        </>
                      ) : (
                        "Analyze Potential Outcomes"
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setJsonText(JSON.stringify(SAMPLE_JSON, null, 2))}
                      data-testid="button-sample-json"
                    >
                      Sample JSON
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            {resultsState === "empty" && (
              <div className="min-h-[460px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-12 text-center">
                <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="w-7 h-7 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-bold mb-1">Ready for Analysis</h3>
                <p className="text-sm text-muted-foreground max-w-[280px]">
                  Describe your AI system or provide JSON, then click analyze to generate an assessment.
                </p>
              </div>
            )}

            {resultsState === "loading" && (
              <div className="rounded-xl border bg-card p-12 text-center shadow-sm">
                <Loader2 className="w-10 h-10 animate-spin text-foreground mx-auto mb-4" />
                <p className="text-base font-semibold">{loadingMsg.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{loadingMsg.subtitle}</p>
              </div>
            )}

            {resultsState === "results" && analysis && (
              <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b bg-muted/30">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold flex items-center gap-2">
                      <Sparkles className="w-[18px] h-[18px]" />
                      Analysis Results
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyMarkdown}
                      className="text-xs h-8"
                      data-testid="button-copy-markdown"
                    >
                      Copy Markdown
                    </Button>
                  </div>
                </div>
                <div className="p-6">
                  {sections.map((section, si) => (
                    <div key={si} className="mb-6">
                      {section.title && (
                        <h4 className="text-sm font-bold border-b pb-1.5 mb-3">{section.title}</h4>
                      )}
                      {section.items.map((item, ii) => (
                        <div
                          key={ii}
                          className="flex items-start gap-2.5 px-2 py-1.5 rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => toggleItem(item)}
                          data-testid={`item-outcome-${si}-${ii}`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedItems.has(item)}
                            onChange={() => toggleItem(item)}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer"
                          />
                          <span className="text-sm text-muted-foreground leading-snug">{item}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                  <div className="pt-4 border-t mt-2">
                    <Button
                      className="w-full"
                      onClick={exportSelected}
                      data-testid="button-export-selected"
                    >
                      Export Selected Outcomes
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <footer className="mt-12 pt-8 border-t text-center">
          <p className="text-sm italic text-muted-foreground bg-muted/40 rounded-lg px-5 py-3 max-w-2xl mx-auto mb-3">
            "This tool generates analytical projections of potential AI outcomes. It does not replace legal, ethical, or compliance review."
          </p>
          <p className="text-xs text-muted-foreground font-mono">
            v2.0.0 | React + Express | Powered by GPT-4o-mini
          </p>
        </footer>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Selected Outcomes</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto bg-muted/40 rounded-lg p-4">
            <pre className="text-xs font-mono whitespace-pre-wrap break-words">
              {JSON.stringify(Array.from(selectedItems), null, 2)}
            </pre>
          </div>
          <DialogFooter>
            <Button onClick={() => setModalOpen(false)} data-testid="button-close-modal">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
