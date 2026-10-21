# LisanHealth Security, Privacy & Threat Model

**Document Version:** 1.0.0  
**Status:** Approved

---

## 1. Threat Modeling (STRIDE)

| Threat Category | Potential Risk in LisanHealth | Mitigating Architecture & Controls |
| :--- | :--- | :--- |
| **Spoofing** | Unauthorized access to user reports or fake webhook triggers. | Secure JWT token authentication; signed ephemeral URLs for audio and reports. |
| **Tampering** | Modification of extracted lab values or manipulated AI output. | Deterministic schema validation layer verifying extracted inputs equal explained outputs. |
| **Repudiation** | Disputes over data deletion or consent. | Audit log of processing events with privacy redaction (no patient health data logged). |
| **Information Disclosure** | Exposure of private medical records or API keys in frontend/logs. | Strict `.gitignore`, zero client-side keys, memory-only file processing where possible, encrypted storage. |
| **Denial of Service** | Uploading massive decompression bombs or rapid-fire AI requests. | 10MB upload limit, PDF page limit (max 5 pages), rate limiting, request timeouts. |
| **Elevation of Privilege** | Unrestricted access to system configuration or worker queues. | Non-root Docker containers, minimal IAM roles, zero host mounts in production. |

---

## 2. File Upload Safety & Validation

1. **MIME & Magic Bytes Inspection:** Uploaded files must match their declared content type via binary magic-number inspection (e.g., `%PDF-` for PDFs, `\xFF\xD8\xFF` for JPEGs), rather than relying on file extensions.
2. **Size & Page Quotas:** Strict hard limit of 10MB per upload and a maximum of 5 pages for PDF documents.
3. **Randomized Internal Naming:** Files are renamed using UUIDv4 immediately upon receipt (e.g., `upload_3f89a1...pdf`) to prevent directory traversal or name collisions.
4. **Isolated Storage:** Files are stored in an unexposed local volume or encrypted S3 bucket, never inside web root directories.

---

## 3. Secret Management & AI Privacy Policy

1. **Backend Isolation:** `ADDIS_AI_API_KEY` and `REASONING_API_KEY` reside exclusively in the backend environment. No browser client ever receives or handles API credentials.
2. **Synthetic Data Policy:** All automated tests, CI builds, and developer environments must use synthetic test fixtures (`tests/fixtures/`). Never commit or transmit real patient records.
3. **Log Sanitization:** Application logs must never write extracted patient names, phone numbers, or raw medical text. Logs record process timings, status transitions, and error codes only.
4. **Retention & Ephemeral Deletion:** In production, uploaded files and temporary audio caches are automatically purged after 24 hours unless explicitly saved by an authenticated user.
