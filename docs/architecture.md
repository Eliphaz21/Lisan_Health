# LisanHealth Architecture & Technical Design

**Document Version:** 1.0.0  
**Status:** Approved  
**System:** Multilingual Medical Laboratory Explainer Platform

---

## 1. System Context & C4 Container Diagram

```mermaid
C4Context
    title System Context Diagram - LisanHealth Platform
    
    Person(patient, "Patient / Caregiver", "Uploads laboratory report, selects Amharic or Afaan Oromoo, listens to audio.")
    System(lisanHealth, "LisanHealth System", "Extracts lab parameters, reasons over reference intervals, localizes explanations, and synthesizes audio.")
    System_Ext(addisAi, "Addis AI Platform", "Ethiopian LLM localization and natural speech synthesis (TTS).")
    System_Ext(providerA, "Clinical Reasoning LLM", "English medical reasoning and plain-language explanation.")

    Rel(patient, lisanHealth, "Uses Web UI / Audio Player", "HTTPS")
    Rel(lisanHealth, providerA, "Requests English clinical reasoning", "HTTPS / JSON")
    Rel(lisanHealth, addisAi, "Requests Amharic/Oromo localization & TTS", "HTTPS / REST")
```

---

## 2. Component Architecture

```mermaid
graph TD
    subgraph ClientBrowser [Frontend: React + Vite + TypeScript]
        UploadComponent[Upload & Preview Component]
        ReviewComponent[Observation Review Table]
        AudioPlayer[Multilingual Audio Player]
        LangSelector[Language Selector: EN / AM / OM]
    end

    subgraph BackendAPI [Backend: TypeScript Express]
        Router[API Gateway / Router]
        ExtractorService[Deterministic Extraction / OCR Engine]
        ValidationLayer[Deterministic Schema & Unit Preservation Engine]
        PipelineOrchestrator[Dual-AI Pipeline Orchestrator]
        
        subgraph AIServices [AI Service Layer]
            ReasoningClient[Provider A Client: English Reasoning]
            AddisAiClient[Provider B Client: Addis AI Localization & TTS]
        end
    end

    subgraph DataStorage [Storage & Cache]
        TempStorage[(Encrypted Local Storage: Reports & Audio)]
        Database[(PostgreSQL: Metadata & User Jobs)]
    end

    ClientBrowser -->|REST API Requests| Router
    Router --> ExtractorService
    ExtractorService --> ValidationLayer
    ValidationLayer --> PipelineOrchestrator
    PipelineOrchestrator --> ReasoningClient
    PipelineOrchestrator --> AddisAiClient
    Router --> DataStorage
```

---

## 3. Dual-AI Pipeline Data Flow & Safety Boundary

The sequential pipeline isolates clinical reasoning from linguistic localization to guarantee safety:

```mermaid
sequenceDiagram
    autonumber
    participant Client as Web Client
    participant API as TypeScript Express Backend
    participant Extract as Extraction Engine
    participant Filter as Validation Filter
    participant ProvA as Provider A (Reasoning)
    participant Addis as Provider B (Addis AI)

    Client->>API: POST /api/v1/reports/process (file + language)
    API->>Extract: Deterministic PDF/OCR Parsing
    Extract-->>API: ExtractedLabReport (Items, Units, Reference Intervals)
    
    API->>Filter: Verify exact units, numbers, & absence of nulls
    Filter-->>API: Verified Extracted Data
    
    API->>ProvA: Request Clinical Reasoning (English)
    ProvA-->>API: EnglishExplanation (Measures, Flags, Doctor Questions)
    
    API->>Filter: Cross-validate values against ExtractedLabReport
    Note over Filter: Rejects if ProvA modified numbers or reference ranges
    
    API->>Addis: Request Localization (Amharic or Afaan Oromoo)
    Addis-->>API: LocalizedExplanation (Native text)
    
    opt If TTS is requested
        API->>Addis: Request TTS Audio Stream
        Addis-->>API: Audio Byte Stream (MP3/WAV)
    end
    
    API-->>Client: Final JSON Payload + Audio Stream URL
```

---

## 4. Key Architectural Decisions

1. **Decoupled AI Roles:** Addis AI is prioritized for native Ethiopian languages and speech synthesis, while an evidence-grounded reasoning model (Provider A) handles structured English clinical reasoning.
2. **Deterministic Safety Shield:** No LLM is permitted to directly parse raw PDFs or invent values. The intermediary deterministic filter strictly enforces that input numbers equal output numbers.
3. **Stateless Scalability:** Processing jobs are designed to be stateless, with audio generated on demand or stored in ephemeral private cache with TTL expirations.
4. **DevOps Progression:** Architecture evolves from Docker Compose in Phase 1 $\rightarrow$ Kind & Helm in Phase 2 $\rightarrow$ Cloud Ingress & Prometheus in Phase 3 $\rightarrow$ Terraform GitOps in Phase 4.
