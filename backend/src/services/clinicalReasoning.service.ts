import { ExtractedReport, ClinicalExplanation, AnalyteExplanation } from "../types";
import { verifyReasoningPreservation } from "./validator.service";

const ANALYTE_EXPLANATIONS: Record<string, { plain: string; what: string }> = {
  Hemoglobin: {
    plain: "Hemoglobin carries oxygen throughout your body. Normal levels ensure your tissues receive adequate energy.",
    what: "The primary oxygen-carrying protein in red blood cells.",
  },
  "White Blood Cells": {
    plain: "White blood cells defend against infections. High levels may indicate an immune response or inflammation.",
    what: "The cells of your immune system responsible for fighting off bacteria and viruses.",
  },
  Platelets: {
    plain: "Platelets help your blood clot when you have an injury, preventing excessive bleeding.",
    what: "Cell fragments crucial for blood clotting and wound repair.",
  },
  "Total Cholesterol": {
    plain: "Cholesterol is a fat-like substance needed to build cells. Elevated levels may increase cardiovascular risk.",
    what: "The overall measurement of fats and lipids circulating in your bloodstream.",
  },
  Triglycerides: {
    plain: "Triglycerides are the main type of fat in your blood. High values are often related to diet and metabolism.",
    what: "Storage fats circulating in the bloodstream after meals.",
  },
  "HDL Cholesterol": {
    plain: "Often called 'good cholesterol', HDL helps remove other forms of cholesterol from your bloodstream.",
    what: "High-density lipoprotein that protects cardiovascular blood vessels.",
  },
  "LDL Cholesterol": {
    plain: "Often called 'bad cholesterol', LDL can build up in arterial walls if levels are too high.",
    what: "Low-density lipoprotein that can form plaques in blood vessels.",
  },
  "Fasting Blood Glucose": {
    plain: "Measures blood sugar after fasting. Elevated levels may indicate insulin resistance or diabetes.",
    what: "The primary circulating sugar providing energy to your body cells.",
  },
  "Serum Creatinine": {
    plain: "A waste product from muscle breakdown filtered by kidneys. Elevated levels suggest renal stress.",
    what: "A biomarker reflecting kidney filtration capacity.",
  },
};

export function explainReportInEnglish(extracted: ExtractedReport): ClinicalExplanation {
  const analytes: AnalyteExplanation[] = [];
  let hasAbnormal = false;

  for (const a of extracted.analytes) {
    const meta = ANALYTE_EXPLANATIONS[a.name] || {
      plain: `Measures levels of ${a.name} in your bloodstream.`,
      what: `Clinical biomarker for ${extracted.test_category}.`,
    };

    let statusText: AnalyteExplanation["status"] = "Normal";
    if (a.flag === "LOW") {
      statusText = "Low";
      hasAbnormal = true;
    } else if (a.flag === "HIGH" || a.flag === "CRITICAL") {
      statusText = "High";
      hasAbnormal = true;
    }

    analytes.push({
      name: a.name,
      value: a.value,
      unit: a.unit,
      reference_range: `${a.reference_range_low} - ${a.reference_range_high} ${a.unit}`,
      status: statusText,
      plain_explanation: meta.plain,
      what_this_measures: meta.what,
    });
  }

  const overall_status = hasAbnormal ? "ATTENTION_NEEDED" : "NORMAL";
  const summary = hasAbnormal
    ? `Your ${extracted.test_category} includes results that fall outside the standard reference range. Consult your healthcare provider for clinical review.`
    : `All reported analytes in your ${extracted.test_category} appear within expected healthy reference intervals.`;

  const suggested_questions_for_doctor = [
    `What do these specific ${extracted.test_category} numbers indicate for my daily routine?`,
    "Do any of these results require repeat testing or lifestyle modifications?",
    "Should we explore further diagnostic tests based on these findings?",
  ];

  const disclaimer =
    "This report explanation is provided for educational purposes only and does not constitute a medical diagnosis, clinical opinion, or treatment plan. Always consult a licensed healthcare professional.";

  const explanation: ClinicalExplanation = {
    test_category: extracted.test_category,
    summary,
    overall_status,
    analytes,
    suggested_questions_for_doctor,
    disclaimer,
  };

  // Enforce zero-hallucination preservation
  verifyReasoningPreservation(extracted, explanation);

  return explanation;
}
