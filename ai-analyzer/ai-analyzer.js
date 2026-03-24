// ─────────────────────────────────────────────────────────────────────────────
// ai-analyzer.js — AI Outcome Analyzer backend
// Stack: Node.js + Express + OpenAI
//
// Endpoints:
//   POST /generate-json  →  turns a plain-text description into structured JSON
//   POST /analyze        →  analyzes the JSON for ethical/legal/social outcomes
//
// Run:  node ai-analyzer.js
// ─────────────────────────────────────────────────────────────────────────────

import "dotenv/config";                        // load OPENAI_API_KEY from .env
import express from "express";
import { OpenAI } from "openai";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app  = express();
const PORT = process.env.PORT || 5000;

// Initialize the OpenAI client — API key is only ever read here, never in the frontend
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname, "static")));  // serve static assets

// Serve ai-analyzer.html at the root URL
app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "static", "ai-analyzer.html"));
});

// ── Schema constants ──────────────────────────────────────────────────────────
const REQUIRED_FIELDS  = ["useCaseName", "systemType", "contextOfUse", "modelAutonomyLevel"];
const SYSTEM_TYPES     = [
  "Text-based conversational AI",
  "Voice-based conversational AI",
  "Decision support AI",
  "Agent assist AI",
];
const AUTONOMY_LEVELS  = [
  "Informational only",
  "Recommendation with human decision",
  "Action execution with human override",
  "Fully autonomous action",
];

// ── Validation helper ─────────────────────────────────────────────────────────
// Checks that the AI-generated JSON has the right required fields and enum values.
function validateGeneratedJson(data) {
  if (!data || typeof data !== "object") return false;
  for (const field of REQUIRED_FIELDS) {
    if (!(field in data)) return false;
  }
  if (!SYSTEM_TYPES.includes(data.systemType))            return false;
  if (!AUTONOMY_LEVELS.includes(data.modelAutonomyLevel)) return false;
  return true;
}

// ── POST /generate-json ───────────────────────────────────────────────────────
// Input:  { description: "A chatbot that..." }
// Output: { json: { useCaseName: "...", systemType: "...", ... } }
app.post("/generate-json", async (req, res) => {
  try {
    const { description } = req.body;

    if (!description || typeof description !== "string" || !description.trim()) {
      return res.status(400).json({ message: "Description is required and cannot be empty." });
    }

    console.log(`[generate-json] "${description.substring(0, 60)}..."`);

    const prompt = `You are an expert in AI system design and schema validation. Convert the following free-text description of an AI system into a structured JSON object that strictly follows this schema:

{
  "useCaseName": "string - The name of the specific AI implementation",
  "systemType": "one of: Text-based conversational AI, Voice-based conversational AI, Decision support AI, Agent assist AI",
  "primaryFunction": "string (optional) - What the AI does",
  "contextOfUse": {
    "industry": "string - The industry",
    "environment": "one of: Internal, Customer-facing, Public"
  },
  "stakeholders": {
    "primaryUsers": ["array of strings"],
    "indirectlyAffectedParties": ["array of strings"],
    "oversightOwners": ["array of strings"]
  },
  "decisionsAndActions": {
    "decisionsMadeBySystem": ["array of strings"],
    "actionsExecutedAutomatically": ["array of strings"],
    "actionsRequiringHumanApproval": ["array of strings"]
  },
  "dataInputs": {
    "dataTypesUsed": ["array of strings"],
    "dataSources": ["array of strings"],
    "personalOrSensitiveData": boolean
  },
  "modelAutonomyLevel": "one of: Informational only, Recommendation with human decision, Action execution with human override, Fully autonomous action",
  "scaleAndReach": {
    "expectedNumberOfUsers": "string",
    "frequencyOfUse": "string",
    "geographicScope": "string"
  }
}

IMPORTANT RULES:
1. You MUST include all required fields: useCaseName, systemType, contextOfUse, modelAutonomyLevel
2. For enum fields, use EXACTLY the values specified above - no variations
3. For array fields, populate them with realistic values based on the description
4. Return ONLY valid JSON - no explanations, no markdown, no code blocks
5. If the description is unclear about a field, make reasonable inferences

Description to convert:
${description}

Return ONLY the JSON object, nothing else.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a JSON generation assistant. Return only valid JSON with no explanations or markdown." },
        { role: "user",   content: prompt },
      ],
    });

    const content = response.choices[0].message.content || "";

    // Extract the JSON object in case the model adds markdown fences
    const jsonMatch  = content.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : content;

    let generatedJson;
    try {
      generatedJson = JSON.parse(jsonString);
    } catch {
      return res.status(500).json({ message: "Unable to generate valid JSON. Please try again." });
    }

    if (!validateGeneratedJson(generatedJson)) {
      return res.status(500).json({ message: "Unable to generate valid JSON. Please try again." });
    }

    return res.status(200).json({ json: generatedJson });

  } catch (err) {
    console.error("[generate-json] Error:", err.message);
    return res.status(500).json({ message: "Failed to generate JSON from description." });
  }
});

// ── POST /analyze ─────────────────────────────────────────────────────────────
// Input:  { useCaseName, systemType, contextOfUse, modelAutonomyLevel, ... }
// Output: { analysis: "markdown text with 8 labelled sections" }
app.post("/analyze", async (req, res) => {
  try {
    const input = req.body;

    // Validate required fields
    for (const field of REQUIRED_FIELDS) {
      if (!input[field]) {
        return res.status(400).json({ message: `Missing required field: ${field}` });
      }
    }

    const { modelAutonomyLevel, scaleAndReach, dataInputs } = input;
    const personalData = dataInputs?.personalOrSensitiveData ? "Yes" : "No";

    console.log(`[analyze] useCaseName="${input.useCaseName}", autonomy="${modelAutonomyLevel}"`);

    const prompt = `
      Perform a structured ethical and impact analysis for the following AI use case provided in JSON format:
      ${JSON.stringify(input, null, 2)}

      What are the other potential outcomes of this AI solution?

      Analyze the following specifically:
      - modelAutonomyLevel: ${modelAutonomyLevel}
      - scaleAndReach: ${scaleAndReach || "Not specified"}
      - personalOrSensitiveData: ${personalData}

      Categorize the output into exactly these 8 sections using bullet points:
      1. Positive outcomes
      2. Negative outcomes
      3. Ethical risks
      4. Legal risks
      5. Social impacts
      6. Economic impacts
      7. Long-term systemic risks
      8. Recommended Human Oversight Actions

      Guidelines:
      - Avoid promotional language.
      - Explicitly analyze modelAutonomyLevel.
      - Analyze scaleAndReach for amplified risks.
      - Analyze dataInputs.personalOrSensitiveData carefully.
      - Identify unintended consequences.
      - Consider bias, privacy, fairness, transparency, accountability.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an AI ethics and policy expert. Provide structured, critical analysis of AI use cases." },
        { role: "user",   content: prompt },
      ],
    });

    const analysis = response.choices[0].message.content || "No analysis generated.";
    return res.status(200).json({ analysis });

  } catch (err) {
    console.error("[analyze] Error:", err.message);
    return res.status(500).json({ message: "Failed to perform analysis." });
  }
});

// ── Start server ──────────────────────────────────────────────────────────────
app.listen(PORT, "0.0.0.0", () => {
  console.log(`AI Outcome Analyzer running on port ${PORT}`);
});
