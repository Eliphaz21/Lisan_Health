import axios from "axios";
import { config } from "../config";
import { AnalyteValue, ExtractedReport } from "../types";

interface AnalyteDef {
  name: string;
  aliases: string[];
  unit: string;
  low: number;
  high: number;
  category: string;
}

const KNOWN_ANALYTES: AnalyteDef[] = [
  // --- Complete Blood Count (CBC) ---
  { name: "Hemoglobin", aliases: ["hemoglobin", "hgb", "hb"], unit: "g/dL", low: 13.5, high: 17.5, category: "Complete Blood Count" },
  { name: "Hematocrit", aliases: ["hematocrit", "hct", "pcv"], unit: "%", low: 38.0, high: 50.0, category: "Complete Blood Count" },
  { name: "White Blood Cells", aliases: ["white blood cells", "white blood count", "wbc", "total leukocytes", "leukocytes", "wbc count"], unit: "10^3/uL", low: 4.5, high: 11.0, category: "Complete Blood Count" },
  { name: "Red Blood Cells", aliases: ["red blood cells", "red blood count", "rbc", "erythrocytes", "rbc count"], unit: "10^6/uL", low: 4.3, high: 5.9, category: "Complete Blood Count" },
  { name: "Platelets", aliases: ["platelets", "platelet count", "plt", "thrombocytes"], unit: "10^3/uL", low: 150.0, high: 450.0, category: "Complete Blood Count" },
  { name: "MCV", aliases: ["mcv", "mean corpuscular volume"], unit: "fL", low: 80.0, high: 100.0, category: "Complete Blood Count" },
  { name: "MCH", aliases: ["mch", "mean corpuscular hemoglobin"], unit: "pg", low: 27.0, high: 33.0, category: "Complete Blood Count" },
  { name: "MCHC", aliases: ["mchc", "mean corpuscular hgb conc"], unit: "g/dL", low: 32.0, high: 36.0, category: "Complete Blood Count" },
  { name: "RDW", aliases: ["rdw", "red cell distribution width", "rdw-cv"], unit: "%", low: 11.5, high: 14.5, category: "Complete Blood Count" },
  { name: "Neutrophils", aliases: ["neutrophils", "neut", "neuts", "segs", "polys"], unit: "%", low: 40.0, high: 75.0, category: "Complete Blood Count" },
  { name: "Lymphocytes", aliases: ["lymphocytes", "lymph", "lymphs", "lym"], unit: "%", low: 20.0, high: 45.0, category: "Complete Blood Count" },
  { name: "Monocytes", aliases: ["monocytes", "mono"], unit: "%", low: 2.0, high: 10.0, category: "Complete Blood Count" },
  { name: "Eosinophils", aliases: ["eosinophils", "eos"], unit: "%", low: 1.0, high: 6.0, category: "Complete Blood Count" },
  { name: "Basophils", aliases: ["basophils", "baso"], unit: "%", low: 0.0, high: 2.0, category: "Complete Blood Count" },

  // --- Lipid Profile ---
  { name: "Total Cholesterol", aliases: ["total cholesterol", "cholesterol", "chol"], unit: "mg/dL", low: 125.0, high: 200.0, category: "Lipid Panel" },
  { name: "Triglycerides", aliases: ["triglycerides", "trig", "trigs"], unit: "mg/dL", low: 50.0, high: 150.0, category: "Lipid Panel" },
  { name: "HDL Cholesterol", aliases: ["hdl cholesterol", "hdl", "high density lipoprotein"], unit: "mg/dL", low: 40.0, high: 60.0, category: "Lipid Panel" },
  { name: "LDL Cholesterol", aliases: ["ldl cholesterol", "ldl", "low density lipoprotein"], unit: "mg/dL", low: 0.0, high: 100.0, category: "Lipid Panel" },
  { name: "VLDL Cholesterol", aliases: ["vldl cholesterol", "vldl"], unit: "mg/dL", low: 5.0, high: 40.0, category: "Lipid Panel" },

  // --- Metabolic, Renal & Diabetes ---
  { name: "Fasting Blood Glucose", aliases: ["fasting blood glucose", "glucose", "fbs", "blood sugar", "glu", "fasting glucose"], unit: "mg/dL", low: 70.0, high: 99.0, category: "Metabolic Panel" },
  { name: "Hemoglobin A1c", aliases: ["hba1c", "a1c", "glycated hemoglobin"], unit: "%", low: 4.0, high: 5.6, category: "Metabolic Panel" },
  { name: "Serum Creatinine", aliases: ["serum creatinine", "creatinine", "creat", "cr"], unit: "mg/dL", low: 0.7, high: 1.3, category: "Renal Function" },
  { name: "Blood Urea Nitrogen", aliases: ["blood urea nitrogen", "bun", "urea"], unit: "mg/dL", low: 7.0, high: 20.0, category: "Renal Function" },
  { name: "eGFR", aliases: ["egfr", "estimated gfr", "glomerular filtration rate"], unit: "mL/min/1.73m2", low: 90.0, high: 140.0, category: "Renal Function" },
  { name: "Uric Acid", aliases: ["uric acid", "urate"], unit: "mg/dL", low: 3.5, high: 7.2, category: "Renal Function" },

  // --- Electrolytes ---
  { name: "Sodium", aliases: ["sodium", "na"], unit: "mmol/L", low: 135.0, high: 145.0, category: "Electrolytes" },
  { name: "Potassium", aliases: ["potassium", "k"], unit: "mmol/L", low: 3.5, high: 5.1, category: "Electrolytes" },
  { name: "Chloride", aliases: ["chloride", "cl"], unit: "mmol/L", low: 96.0, high: 106.0, category: "Electrolytes" },
  { name: "Calcium", aliases: ["calcium", "ca", "total calcium"], unit: "mg/dL", low: 8.5, high: 10.5, category: "Electrolytes" },

  // --- Liver Function Tests (LFT) ---
  { name: "ALT (SGPT)", aliases: ["alt", "sgpt", "alanine aminotransferase"], unit: "U/L", low: 7.0, high: 56.0, category: "Liver Function" },
  { name: "AST (SGOT)", aliases: ["ast", "sgot", "aspartate aminotransferase"], unit: "U/L", low: 10.0, high: 40.0, category: "Liver Function" },
  { name: "Alkaline Phosphatase", aliases: ["alkaline phosphatase", "alp", "alk phos"], unit: "U/L", low: 44.0, high: 147.0, category: "Liver Function" },
  { name: "Total Bilirubin", aliases: ["total bilirubin", "t-bili", "bilirubin total", "bili"], unit: "mg/dL", low: 0.2, high: 1.2, category: "Liver Function" },
  { name: "Direct Bilirubin", aliases: ["direct bilirubin", "d-bili", "conjugated bilirubin"], unit: "mg/dL", low: 0.0, high: 0.3, category: "Liver Function" },
  { name: "Albumin", aliases: ["albumin", "alb"], unit: "g/dL", low: 3.5, high: 5.0, category: "Liver Function" },
  { name: "Total Protein", aliases: ["total protein", "tp"], unit: "g/dL", low: 6.0, high: 8.3, category: "Liver Function" },

  // --- Thyroid & Inflammation ---
  { name: "TSH", aliases: ["tsh", "thyroid stimulating hormone"], unit: "uIU/mL", low: 0.4, high: 4.0, category: "Thyroid Panel" },
  { name: "Free T4", aliases: ["free t4", "ft4", "free thyroxine"], unit: "ng/dL", low: 0.8, high: 1.8, category: "Thyroid Panel" },
  { name: "ESR", aliases: ["esr", "erythrocyte sedimentation rate"], unit: "mm/hr", low: 0.0, high: 20.0, category: "Inflammatory Markers" },
  { name: "CRP", aliases: ["crp", "c-reactive protein"], unit: "mg/L", low: 0.0, high: 3.0, category: "Inflammatory Markers" },
];

/**
 * Parses raw textual lab report content into structured ExtractedReport using regex pattern matching.
 */
export function extractReportFromText(text: string): ExtractedReport {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const analytes: AnalyteValue[] = [];
  const categoryCounts: Record<string, number> = {};

  for (const line of lines) {
    // Normalize line by replacing multiple whitespace/tabs with single space
    const cleanLine = line.replace(/\s+/g, " ");

    for (const def of KNOWN_ANALYTES) {
      if (analytes.some((a) => a.name === def.name)) continue;

      for (const alias of def.aliases) {
        // Regex supports formats:
        // "Hemoglobin: 11.2 g/dL"
        // "HGB 11.2"
        // "Platelets | 210 | 10^3/uL | 150-450"
        // "WBC   14.2   10^3/uL   HIGH"
        const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const pattern = new RegExp(
          `(?:^|[|\\t\\s,])${escaped}(?:[:=\\s|\\t]+)([0-9]+(?:\\.[0-9]+)?)`,
          "i"
        );

        const match = cleanLine.match(pattern);
        if (match && match[1]) {
          const val = parseFloat(match[1]);
          if (!isNaN(val)) {
            let flag: AnalyteValue["flag"] = "NORMAL";
            if (val < def.low) flag = "LOW";
            else if (val > def.high) flag = "HIGH";

            analytes.push({
              name: def.name,
              value: val,
              unit: def.unit,
              reference_range_low: def.low,
              reference_range_high: def.high,
              flag,
              interpretation_hint:
                flag !== "NORMAL"
                  ? `Out of reference range (${def.low} - ${def.high} ${def.unit})`
                  : "Within normal limits",
            });

            categoryCounts[def.category] = (categoryCounts[def.category] || 0) + 1;
            break;
          }
        }
      }
    }
  }

  // Determine panel category with highest analyte matches
  let detectedCategory = "General Lab Report";
  let maxCount = 0;
  for (const [cat, count] of Object.entries(categoryCounts)) {
    if (count > maxCount) {
      maxCount = count;
      detectedCategory = cat;
    }
  }

  // Generic fallback if standard known tests not found: extract ANY numeric test lines
  if (analytes.length === 0) {
    for (const line of lines.slice(0, 30)) {
      const genericMatch = line.match(/^([A-Za-z\s]{3,25})[:|=]\s*([0-9]+(?:\.[0-9]+)?)\s*([A-Za-z/%^0-9]*)/);
      if (genericMatch && genericMatch[1] && genericMatch[2]) {
        const testName = genericMatch[1].trim();
        const testVal = parseFloat(genericMatch[2]);
        const testUnit = genericMatch[3]?.trim() || "unit";
        if (testName.length > 2 && !analytes.some((a) => a.name.toLowerCase() === testName.toLowerCase())) {
          analytes.push({
            name: testName,
            value: testVal,
            unit: testUnit,
            reference_range_low: 0,
            reference_range_high: 100,
            flag: "NORMAL",
            interpretation_hint: "Extracted from clinical document",
          });
        }
      }
    }
  }

  return {
    test_category: detectedCategory,
    analytes,
    raw_text: text,
  };
}

/**
 * Intelligent AI clinical extractor using Addis AI model
 */
export async function extractReportWithAi(text: string): Promise<ExtractedReport | null> {
  if (!config.addisAi.apiKey) return null;

  try {
    const prompt = `You are a medical laboratory data extraction assistant for LisanHealth.
Analyze the following medical report text and extract all laboratory analytes, measured values, units, reference intervals, and flags.
CRITICAL MEDICAL SAFETY: NEVER invent or hallucinate test results. Extract ONLY values genuinely present in the text.

Respond ONLY with a JSON object in this exact schema:
{
  "test_category": "Clinical Laboratory Report",
  "analytes": [
    {
      "name": "Hemoglobin",
      "value": 11.2,
      "unit": "g/dL",
      "reference_range_low": 13.5,
      "reference_range_high": 17.5,
      "flag": "LOW"
    }
  ]
}

Report Text:
${text.slice(0, 4000)}`;

    const response = await axios.post(
      `${config.addisAi.baseUrl}/chat/completions`,
      {
        model: config.addisAi.textModel,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
      },
      {
        headers: {
          Authorization: `Bearer ${config.addisAi.apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: config.addisAi.timeoutMs,
      }
    );

    const rawContent = response.data?.choices?.[0]?.message?.content;
    if (rawContent) {
      let clean = rawContent.trim();
      if (clean.startsWith("```")) {
        clean = clean.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
      }
      const parsed = JSON.parse(clean);
      if (parsed && Array.isArray(parsed.analytes) && parsed.analytes.length > 0) {
        const analytes: AnalyteValue[] = parsed.analytes.map((a: any) => ({
          name: String(a.name || "Test"),
          value: Number(a.value) || 0,
          unit: String(a.unit || ""),
          reference_range_low: Number(a.reference_range_low) || 0,
          reference_range_high: Number(a.reference_range_high) || 0,
          flag: (a.flag || "NORMAL").toUpperCase(),
          interpretation_hint: a.flag !== "NORMAL" ? `Flagged as ${a.flag}` : "Within normal limits",
        }));

        return {
          test_category: parsed.test_category || "Clinical Lab Report",
          analytes,
          raw_text: text,
        };
      }
    }
  } catch (err: any) {
    console.warn("[Addis AI Extraction Fallback]", err.message);
  }

  return null;
}

/**
 * Multimodal extraction using Google Gemini Vision (gemini-2.5-flash / gemini-1.5-flash)
 * Accurately extracts laboratory results from scanned medical images and PDFs.
 */
export async function extractReportWithGeminiVision(
  buffer: Buffer,
  mimetype: string
): Promise<ExtractedReport | null> {
  const apiKey = config.geminiAi?.apiKey || process.env.GEMINI_API_KEY || process.env.REASONING_API_KEY;
  if (!apiKey) return null;

  const model = config.geminiAi?.model || process.env.GEMINI_MODEL || process.env.REASONING_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const prompt = `You are a certified clinical laboratory report extraction expert for LisanHealth.
Carefully examine this medical report image or document.
Extract all laboratory test names, measured values, units, reference intervals, and flags (NORMAL, HIGH, LOW, or ABNORMAL).

CRITICAL MEDICAL SAFETY:
1. NEVER invent or guess numbers. Extract ONLY values genuinely present in the document.
2. If numbers or reference ranges are visible, preserve them exactly.
3. Respond ONLY with a valid, clean JSON object matching this schema:
{
  "test_category": "Complete Blood Count (CBC)",
  "analytes": [
    {
      "name": "Hemoglobin",
      "value": 11.2,
      "unit": "g/dL",
      "reference_range_low": 13.5,
      "reference_range_high": 17.5,
      "flag": "LOW"
    }
  ],
  "raw_text": "Extracted transcription of the document..."
}`;

  try {
    const base64Data = buffer.toString("base64");
    const mime = mimetype || "image/jpeg";

    const response = await axios.post(
      url,
      {
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mime,
                  data: base64Data,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: config.geminiAi?.timeoutMs || 45000,
      }
    );

    const candidates = response.data?.candidates;
    const contentText = candidates?.[0]?.content?.parts?.[0]?.text;
    if (contentText) {
      let clean = contentText.trim();
      if (clean.startsWith("```")) {
        clean = clean.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
      }
      const parsed = JSON.parse(clean);
      if (parsed && Array.isArray(parsed.analytes) && parsed.analytes.length > 0) {
        const analytes: AnalyteValue[] = parsed.analytes.map((a: any) => ({
          name: String(a.name || "Test"),
          value: Number(a.value) || 0,
          unit: String(a.unit || ""),
          reference_range_low: Number(a.reference_range_low) || 0,
          reference_range_high: Number(a.reference_range_high) || 0,
          flag: (a.flag || "NORMAL").toUpperCase(),
          interpretation_hint:
            a.flag && a.flag !== "NORMAL"
              ? `Flagged as ${a.flag} (${a.reference_range_low || 0} - ${a.reference_range_high || 0} ${a.unit || ""})`
              : "Within normal limits",
        }));

        return {
          test_category: parsed.test_category || "Clinical Laboratory Report",
          analytes,
          raw_text: parsed.raw_text || `Extracted via Gemini Vision from uploaded document (${analytes.length} tests found).`,
        };
      }
    }
  } catch (err: any) {
    console.warn("[Gemini Vision Extraction Warning]", err.response?.data?.error?.message || err.message);
  }

  return null;
}

/**
 * Extracts clinical lab report from an uploaded file buffer (PDF, image, or text).
 * Fully asynchronous with native PDF stream decoding, Gemini multimodal vision, and Addis AI.
 */
export async function extractReportFromFileBuffer(
  buffer: Buffer,
  originalname: string,
  mimetype: string
): Promise<ExtractedReport> {
  const lowerName = originalname.toLowerCase();
  let extractedText = "";

  // 1. Plain text / CSV files
  if (mimetype.includes("text") || lowerName.endsWith(".txt") || lowerName.endsWith(".csv")) {
    extractedText = buffer.toString("utf-8");
  }

  // 2. PDF Documents (extract text with pdf-parse)
  if (mimetype === "application/pdf" || lowerName.endsWith(".pdf")) {
    try {
      const { PDFParse } = require("pdf-parse");
      const parser = new PDFParse({ data: buffer });
      const res = await parser.getText();
      await parser.destroy();
      extractedText = (res.text || "").trim();
    } catch (pdfErr: any) {
      console.warn("[PDF Parse Error, using buffer fallback]", pdfErr.message);
      // Fallback: extract printable strings from raw buffer
      const raw = buffer.toString("binary");
      const matches = raw.match(/[a-zA-Z0-9\s:.,><=/%-]{3,}/g) || [];
      extractedText = matches.join("\n");
    }
  }

  // If text was extracted from PDF or text file
  if (extractedText.length > 0) {
    // Try deterministic regex extraction first
    const regexReport = extractReportFromText(extractedText);
    if (regexReport.analytes.length >= 2) {
      return regexReport;
    }

    // Try Addis AI extraction if regex found few analytes
    const aiReport = await extractReportWithAi(extractedText);
    if (aiReport && aiReport.analytes.length > 0) {
      return aiReport;
    }

    if (regexReport.analytes.length > 0) {
      return regexReport;
    }
  }

  // 3. For images (PNG, JPG, WEBP) or scanned image PDFs without selectable text:
  // Use Google Gemini Multimodal Vision API
  const isImageOrPdf =
    mimetype.startsWith("image/") ||
    mimetype === "application/pdf" ||
    /\.(png|jpe?g|webp|pdf)$/i.test(lowerName);

  if (isImageOrPdf) {
    const visionReport = await extractReportWithGeminiVision(buffer, mimetype || "image/jpeg");
    if (visionReport && visionReport.analytes.length > 0) {
      return visionReport;
    }
  }

  // 4. Return report with extracted text or notice for image
  let category = "Clinical Laboratory Document";
  if (lowerName.includes("lipid") || lowerName.includes("cholesterol")) {
    category = "Lipid Profile Panel";
  } else if (lowerName.includes("cbc") || lowerName.includes("blood")) {
    category = "Complete Blood Count (CBC)";
  } else if (lowerName.includes("metabolic") || lowerName.includes("glucose")) {
    category = "Metabolic Panel";
  }

  return {
    test_category: category,
    analytes: [],
    raw_text: extractedText || `Uploaded medical document: ${originalname} (${mimetype}).`,
  };
}
