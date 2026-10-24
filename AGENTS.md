# AGENTS.md — LisanHealth Developer & AI Pair-Programming Rules

## 1. Project Overview & Role
You are pair-programming on **LisanHealth** ("Your Health Report, in Your Language"), an Ethiopian-focused multilingual medical-report explainer built as a dual-stack software product and an 11-week DevOps portfolio project.

- **Stack:** TypeScript (Express, Zod, PostgreSQL), React (TypeScript, Vite, Vanilla CSS), Docker, Kind, Helm, GitHub Actions.
- **Dual-AI Architecture:**
  1. **Provider A:** English reasoning and evidence-grounded clinical explanation.
  2. **Provider B (Addis AI):** Ethiopian localization (English, Amharic, Afaan Oromoo) and speech (TTS).
- **Medical Safety:** The system is an educational explainer, NOT a diagnostic tool.

---

## 2. Strict Engineering Guidelines

### Safe Tool Execution & Approval Gates
1. **Never make unreviewed destructive changes:** Do not run `git reset --hard`, `git push --force`, or destructive shell commands without explicit approval.
2. **Never expose secrets:** Never print or commit `.env` files, API keys, or private medical documents.
3. **No phantom success:** Never claim a test, build, or deployment succeeded unless the exact command was executed and verified in the terminal.
4. **PowerShell Compatibility:** All shell commands must be tested and formatted for Windows PowerShell.

### Code Style & Structure
- **Backend:** Modular design with strict separation of concerns (`api/`, `core/`, `models/`, `schemas/`, `services/`, `tests/`).
- **Pydantic Validation:** All external data and AI outputs must pass strict schema validation.
- **Deterministic Testing:** Automated tests must use mock providers and synthetic lab fixtures (`tests/fixtures/`). Tests must never require paid API keys to pass.

---

## 3. Git Workflow & Conventional Commits

All changes must follow branch-based development:
- `main`: Production-ready, reviewed, and tested code.
- `feature/<short-name>`: New feature implementations.
- `fix/<short-name>`: Bug fixes.
- `docs/<short-name>`: Documentation updates.
- `test/<short-name>`: Test improvements.
- `ci/<short-name>`: CI/CD workflow modifications.

Commit messages must strictly follow the **Conventional Commits** specification:
```
<type>(<scope>): <imperative summary>

[optional body]

[optional footer]
```
Allowed types: `feat`, `fix`, `test`, `docs`, `refactor`, `chore`, `build`, `ci`, `perf`, `security`, `style`.

---

## 4. Medical Safety & Privacy Boundaries
- **Zero Hallucination Tolerance:** The AI must never invent laboratory test results, units, or reference intervals.
- **Deterministic Preservation:** Numeric values and reference intervals extracted in Stage A must match identically across all downstream stages.
- **No Diagnostic or Prescription Claims:** The output must explain what the test measures in plain language, note out-of-range flags, and provide safe questions to ask a doctor.
- **Traditional Medicine:** Traditional Ethiopian herbal remedies are NOT part of the medical report explainer. Do not generate unsolicited herbal advice.
