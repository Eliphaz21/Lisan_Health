# LisanHealth

<p align="center"><img src="./frontend/public/logo.png" alt="LisanHealth logo" width="112" /></p>
<p align="center"><strong>LisanHealth · ልሳን ጤና</strong><br />Your health report, in your language</p>
<p align="center"><sub>Multilingual explanations and Addis AI speech in Amharic, Afaan Oromoo, and Tigrinya</sub></p>

LisanHealth is an Ethiopian-focused multilingual medical-report explainer for English, Amharic (`am`), Afaan Oromoo (`om`), and Tigrinya (`ti`). It provides structured educational explanations and on-demand speech. It is not a diagnostic, prescribing, or treatment system.

[![CI](https://github.com/Eliphaz21/Lisan_Health/actions/workflows/ci.yml/badge.svg)](https://github.com/Eliphaz21/Lisan_Health/actions/workflows/ci.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE) [![Node.js 24](https://img.shields.io/badge/Node.js-24-green.svg)](https://nodejs.org/)

## Product flow

1. An authenticated user uploads a PDF, PNG, or JPEG laboratory report.
2. The backend validates type, signature, size, and processing limits.
3. Deterministic extraction preserves values, units, signs, and reference intervals.
4. Provider A creates a structured English explanation; Addis AI localizes it to the selected language.
5. Safety checks prevent downstream text from changing extracted clinical facts.
6. Addis AI speech is generated only when the user presses Play.
7. Private report metadata and history are stored in PostgreSQL for the owning user.

| Code | Language | Text | Speech |
|---|---|---:|---:|
| `en` | English | Yes | Provider configuration dependent |
| `am` | አማርኛ (Amharic) | Yes | Addis AI |
| `om` | Afaan Oromoo | Yes | Addis AI |
| `ti` | ትግርኛ (Tigrinya) | Yes | Addis AI/provider configuration dependent |

## Architecture

```mermaid
flowchart LR
  Browser[React + Vite UI] --> API[TypeScript Express API]
  API --> Extract[Validation and PDF/image extraction]
  Extract --> Guard[Value and unit preservation guard]
  Guard --> Reason[Provider A English reasoning]
  Reason --> Localize[Addis AI localization]
  Localize --> Speech[Addis AI on-demand TTS]
  API --> DB[(PostgreSQL / AletCloud or CI PostgreSQL)]
  API --> Private[Private report/audio storage]
```

## Repository map

| Area | Purpose |
|---|---|
| `backend/` | TypeScript Express API, Prisma schema, authentication, persistence, and AI pipeline |
| `frontend/` | React/TypeScript/Vite UI, language selection, reports, and audio player |
| `infrastructure/` | Docker, Kustomize, Helm, Terraform, GitOps, and monitoring |
| `docs/` | Product, requirements, architecture, testing, security, and approval gates |
| `.github/workflows/` | CI quality gates and CD validation/image publishing |

## DevOps stack

The project demonstrates the complete delivery path: Git and GitHub Actions for CI/CD, multi-stage Docker images and Compose for local environments, Kustomize and Helm for Kubernetes packaging, Terraform for AWS VPC/EKS infrastructure, GHCR for immutable container images, and Prometheus/Grafana configuration for observability. AWS deployment remains an account-specific step described in the infrastructure guide.

## Run the website

Use Windows PowerShell and follow these steps:

1. Copy `.env.example` to `.env` and add local development values. Never commit `.env` or API keys.
2. Start the backend: `cd backend`, `npm ci`, `npm run build`, `npm test`, then `npm run dev`.
3. In a second terminal start the frontend: `cd frontend`, `npm ci`, then `npm run dev`.
4. Open `http://localhost:5173` and confirm the API health at `http://localhost:8000/api/v1/health`.
5. Sign in, select `English`, `Amharic`, `Afaan Oromoo`, or `Tigrinya`, and upload a synthetic report.

For a containerized run, use `docker compose config`, `docker compose up --build -d`, and `docker compose ps`. Stop it with `docker compose down`. Use a dedicated AletCloud/PostgreSQL development database for cloud-backed local testing; never use production data.

## Addis AI speech workflow

1. Provider A extracts and explains the report in a structured English result.
2. Addis AI converts that approved result into the selected local language: Amharic, Afaan Oromoo, or Tigrinya. English remains available as the source language.
3. The localized explanation, safety disclaimer, cultural context, and doctor questions are shown as text.
4. Speech is generated only after the user presses **Play**, using the selected language voice configured for Addis AI.
5. The backend authenticates and stores the generated audio privately with the user’s report history; it is never publicly served.
6. If speech generation fails, the localized text remains available and the UI shows a clear error instead of an empty audio player.

Audio availability depends on the configured Addis AI voice and valid server-side credentials. The browser never receives the Addis AI API key.

## Delivery and AWS status

CI validates backend/frontend builds and tests, disposable PostgreSQL, Docker, Kustomize, Helm, Terraform, dependency/security checks, and GHCR publishing. ZAP/Trivy results are security evidence requiring review; a green workflow is not a professional penetration test.

Terraform provisions an AWS EKS cluster with EC2-backed worker nodes; it is not an already deployed AWS environment. Before `terraform apply`, configure approved remote state, AWS/OIDC credentials, DNS/TLS, secrets, PostgreSQL network access, backups, and cost limits. See [infrastructure/README.md](infrastructure/README.md).

## Documentation

- [Backend guide](backend/README.md) · [Frontend guide](frontend/README.md) · [Infrastructure/AWS guide](infrastructure/README.md)
- [PRD](docs/PRD.md) · [SRS](docs/SRS.md) · [Architecture](docs/architecture.md)
- [Testing](docs/testing.md) · [Security](docs/security.md) · [Implementation roadmap](docs/implementation-plan.md)
- [External approval gates](docs/external-approval-gates.md)

## Safety, privacy, and release status

LisanHealth does not diagnose illness, prescribe medicine, change treatment, or replace a qualified clinician. Do not upload unnecessary personal identifiers. Development and CI use synthetic data. Commercial launch still requires clinical safety, Ethiopian privacy/legal, data-protection, native-language, backup/restore, and professional penetration-test reviews.

Licensed under the [MIT License](LICENSE).

**© 2026 Yeabsera Andnet · LisanHealth**
