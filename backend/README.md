# LisanHealth Backend

TypeScript Express service owning authentication, PostgreSQL persistence, private file processing, the dual-AI pipeline, localized speech, rate limits, and security audit events.

## Pipeline

```text
request -> auth/authorization -> Zod/file validation -> deterministic extraction
 -> value/unit guard -> Provider A English explanation -> Addis AI en/am/om/ti localization
 -> optional on-demand Addis TTS -> private PostgreSQL history/audio delivery
```

Provider credentials stay server-side. Logs must not contain raw reports, keys, passwords, tokens, or unnecessary identifiers.

## Structure

- `src/config/` — validated environment configuration.
- `src/routes/` and `src/controllers/` — HTTP contracts and handlers.
- `src/services/` — extraction, AI adapters, speech, storage, and security.
- `src/db/` and `prisma/` — PostgreSQL client and schema/migrations.
- `tests/` — deterministic tests and synthetic fixtures.

## Run with a dedicated database

Copy the root `.env.example` to `.env` and configure a dedicated AletCloud/PostgreSQL development database when cloud-backed local testing is intentional. CI uses disposable PostgreSQL and must not target the live database.

Run `npm ci`, `npm run build`, `npm test`, `npm run test:api`, and `npm run dev` from this directory. Use `/api/v1/health` and `/api/v1/ready`; never print the full connection string.

## API areas

- `/api/v1/auth` — registration, login, refresh rotation, logout, account security.
- `/api/v1/reports` — authenticated upload, processing, ownership-scoped history, deletion.
- `/api/v1/speech` — authenticated, on-demand localized audio.
- `/api/v1/admin` — admin-only management actions.
- `/api/v1/health` and `/api/v1/ready` — liveness/readiness.

## Security and tests

The service implements short-lived access tokens, refresh-family reuse detection, CSRF protection for cookie flows, lockout controls, bounded requests, SSRF restrictions, magic-byte upload checks, PDF/image quotas, malware-scanner interfaces, private storage, audit events, and ownership checks. These controls reduce risk but do not replace independent penetration testing or clinical/privacy approval.

Tests use mock providers and synthetic fixtures. Integration coverage includes migrations, constraints, transactions, refresh concurrency, ownership isolation, upload rejection, rate limits, provider failures, admin authorization, and database failures. Paid keys and real patient data are never required for CI.

**© 2026 Yeabsera Andnet · LisanHealth**
