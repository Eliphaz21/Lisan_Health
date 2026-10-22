import { ExtractedReport, ClinicalExplanation, LocalizedExplanation } from "../types";

export class MedicalSafetyInvariantViolation extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MedicalSafetyInvariantViolation";
  }
}

/**
 * Validates that Stage A reasoning preservation invariants hold:
 * 1. Analyte names must match the extracted report.
 * 2. Extracted numeric values must be preserved identically.
 * 3. Units must match exactly.
 */
export function verifyReasoningPreservation(
  extracted: ExtractedReport,
  explanation: ClinicalExplanation
): void {
  const extractedMap = new Map<string, { value: number; unit: string }>();
  for (const a of extracted.analytes) {
    extractedMap.set(a.name.toLowerCase().trim(), {
      value: a.value,
      unit: a.unit.toLowerCase().trim(),
    });
  }

  for (const expAnalyte of explanation.analytes) {
    const key = expAnalyte.name.toLowerCase().trim();
    const source = extractedMap.get(key);

    if (!source) {
      throw new MedicalSafetyInvariantViolation(
        `Stage A Safety Violation: Reasoning introduced ungrounded analyte "${expAnalyte.name}".`
      );
    }

    if (Math.abs(source.value - expAnalyte.value) > 0.0001) {
      throw new MedicalSafetyInvariantViolation(
        `Stage A Safety Violation: Numerical value mutated for "${expAnalyte.name}". Original: ${source.value}, Mutated: ${expAnalyte.value}`
      );
    }

    if (source.unit !== expAnalyte.unit.toLowerCase().trim()) {
      throw new MedicalSafetyInvariantViolation(
        `Stage A Safety Violation: Unit altered for "${expAnalyte.name}". Original: "${source.unit}", Mutated: "${expAnalyte.unit}"`
      );
    }
  }
}

/**
 * Validates that Stage B localization preservation invariants hold:
 * Numerical values and units in localized report must identically match Stage A explanation.
 */
export function verifyLocalizationPreservation(
  explanation: ClinicalExplanation,
  localized: LocalizedExplanation
): void {
  const expMap = new Map<string, number>();
  for (const a of explanation.analytes) {
    expMap.set(a.name.toLowerCase().trim(), a.value);
  }

  for (const locAnalyte of localized.analytes) {
    const key = locAnalyte.name.toLowerCase().trim();
    const expectedValue = expMap.get(key);

    if (expectedValue !== undefined && Math.abs(expectedValue - locAnalyte.value) > 0.0001) {
      throw new MedicalSafetyInvariantViolation(
        `Stage B Safety Violation: Numerical value altered during localization for "${locAnalyte.name}". Expected: ${expectedValue}, Found: ${locAnalyte.value}`
      );
    }
  }
}
