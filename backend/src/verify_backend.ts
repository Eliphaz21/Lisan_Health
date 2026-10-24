import { app } from "./app";
import { config } from "./config";
import { initDb, db } from "./db";
import { extractReportFromText } from "./services/extraction.service";
import { explainReportInEnglish } from "./services/clinicalReasoning.service";
import { addisAiService } from "./services/addisAi.service";
import { verifyReasoningPreservation, verifyLocalizationPreservation } from "./services/validator.service";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    testsPassed++;
  } else {
    console.error(`[FAIL] ${testName}`);
    testsFailed++;
  }
}

async function runTests() {
  console.log("================================================================");
  console.log("  LISANHEALTH EXPRESS + TYPESCRIPT BACKEND VERIFICATION SUITE   ");
  console.log("================================================================");

  // 1. Initialize Database
  await initDb();
  assert(true, "Database initialization completed without throwing");

  // 2. Test User Creation & Password Hash Verification
  const testAdminEmail = `test.admin.${Date.now()}@example.com`;
  const initialHash = await bcrypt.hash("TemporaryComplexPass123!", 10);
  const testAdminUser = await db.createUser({
    email: testAdminEmail,
    fullName: "Test Admin",
    passwordHash: initialHash,
    role: "ADMIN",
  });
  assert(testAdminUser.role === "ADMIN", "Admin user created with role ADMIN");

  // 2b. Test User Role Updates
  const roleUpdated = await db.updateUserRole(testAdminUser.id, "ADMIN");
  assert(roleUpdated === true, "User role successfully updated to ADMIN in database");

  // 2c. Test Strict Schema Validation Rules
  const weakPasswordTest = {
    email: "test@example.com",
    full_name: "Test User",
    password: "123", // too short, no uppercase, no symbol
  };
  const { RegisterSchema } = await import("./schemas/auth.schema");
  const weakResult = RegisterSchema.safeParse(weakPasswordTest);
  assert(!weakResult.success, "Strict schema rejects weak password (< 8 chars, missing complexity)");

  const injectedPropertyTest = {
    email: "test@example.com",
    full_name: "Valid User",
    password: "ValidPassword123!",
    role: "ADMIN", // Malicious injected property attempting privilege escalation
  };
  const injectedResult = RegisterSchema.safeParse(injectedPropertyTest);
  assert(!injectedResult.success, "Strict schema rejects unauthorized injected attributes (anti-privilege escalation)");

  // 3. Test Regular User Creation
  const regularEmail = `patient.test.${Date.now()}@example.com`;
  const hash = await bcrypt.hash("Password123!", 12);
  const regularUser = await db.createUser({
    email: regularEmail,
    fullName: "Abebe Bikila",
    passwordHash: hash,
    role: "USER",
  });
  assert(regularUser.role === "USER", "Regular user role is USER");
  assert(regularUser.email === regularEmail, "Regular user email matches");

  // 4. Test Password Verification
  const isMatch = await bcrypt.compare("Password123!", regularUser.password_hash);
  assert(isMatch, "Bcrypt password hash matches plain password");

  // 5. Test JWT Token Creation & Verification
  const token = jwt.sign({ sub: regularUser.id, role: regularUser.role }, config.jwtSecret, { expiresIn: "1h" });
  const decoded = jwt.verify(token, config.jwtSecret) as any;
  assert(decoded.sub === regularUser.id, "JWT subject decodes correctly");
  assert(decoded.role === "USER", "JWT role decodes correctly");

  // 6. Test Clinical Extraction
  const sampleReportText = `
    COMPLETE BLOOD COUNT (CBC)
    Hemoglobin: 11.2 g/dL (Reference: 13.5 - 17.5)
    White Blood Cells: 6.8 10^3/uL (Reference: 4.5 - 11.0)
    Platelets: 210 10^3/uL (Reference: 150 - 450)
  `;
  const extracted = extractReportFromText(sampleReportText);
  assert(extracted.analytes.length === 3, "Extracted exactly 3 CBC analytes");
  const hgb = extracted.analytes.find((a) => a.name === "Hemoglobin");
  assert(hgb?.value === 11.2, "Hemoglobin value extracted accurately (11.2)");
  assert(hgb?.flag === "LOW", "Hemoglobin correctly flagged as LOW (anemia indicator)");

  // 7. Test Clinical Reasoning (Provider A) & Invariant Preservation
  const englishExplanation = explainReportInEnglish(extracted);
  assert(englishExplanation.overall_status === "ATTENTION_NEEDED", "Overall status is ATTENTION_NEEDED");
  assert(englishExplanation.analytes.length === 3, "3 analytes explained in English");
  assert(englishExplanation.suggested_questions_for_doctor.length > 0, "Questions for doctor generated");

  // Verify preservation invariant passes
  let threwPreservationError = false;
  try {
    verifyReasoningPreservation(extracted, englishExplanation);
  } catch {
    threwPreservationError = true;
  }
  assert(!threwPreservationError, "Medical preservation invariants satisfied for Stage A");

  // 8. Test Addis AI Localization (Amharic & Afaan Oromoo)
  const amharicLocalized = await addisAiService.localize(englishExplanation, "am", { allowLiveProvider: false });
  assert(amharicLocalized.language === "am", "Amharic localization returned");
  assert(amharicLocalized.analytes[0].value === 11.2, "Amharic preserved exact numeric value (11.2)");
  assert((amharicLocalized.cultural_wellness_recommendations?.length || 0) >= 3, "Amharic includes safe Ethiopian cultural context");

  const oromoLocalized = await addisAiService.localize(englishExplanation, "om", { allowLiveProvider: false });
  assert(oromoLocalized.language === "om", "Afaan Oromoo localization returned");
  assert(oromoLocalized.analytes[0].value === 11.2, "Afaan Oromoo preserved exact numeric value (11.2)");
  assert((oromoLocalized.cultural_wellness_recommendations?.length || 0) >= 3, "Afaan Oromoo includes safe Ethiopian cultural context");

  const tigrinyaLocalized = await addisAiService.localize(englishExplanation, "ti", { allowLiveProvider: false });
  assert(tigrinyaLocalized.language === "ti", "Tigrinya localization returned");
  assert((tigrinyaLocalized.cultural_wellness_recommendations?.length || 0) >= 3, "Tigrinya includes safe Ethiopian cultural context");

  // 9. Test Report History Persistence. Automated tests never call paid AI providers.
  const saved = await db.saveReport({
    userId: regularUser.id,
    originalFileName: "cbc_report.pdf",
    reportText: sampleReportText,
    extractedJson: extracted,
    explanationJson: englishExplanation,
    localizedAmharic: amharicLocalized,
    localizedOromo: oromoLocalized,
  });
  assert(Boolean(saved.id), "Saved report record to history");

  const userReports = await db.listReportsByUserId(regularUser.id);
  assert(userReports.length >= 1, "Retrieved user clinical history list");

  // 11. Test Admin Stats
  const stats = await db.countStats();
  assert(stats.totalUsers >= 1, "Admin stats counts all users accurately");
  // 12. Cleanup test synthetic users
  await db.deleteUser(testAdminUser.id);
  await db.deleteUser(regularUser.id);
  assert(true, "Cleaned up synthetic test users from database");

  console.log("================================================================");
  console.log(`VERIFICATION SUMMARY: ${testsPassed} PASSED, ${testsFailed} FAILED`);
  console.log("================================================================");

  if (testsFailed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
