# LisanHealth Frontend

React, TypeScript, and Vite single-page application for secure report upload, localized explanations, history, and on-demand speech.

## Language contract

The selector supports English (`en`), Amharic (`am`), Afaan Oromoo (`om`), and Tigrinya (`ti`). Selection applies to interface labels, report text, safety messages, doctor questions, and speech configuration where the provider supports the voice. Values, units, intervals, and flags remain invariant.

## Important areas

- `src/App.tsx` — routing, authentication state, and shared layout.
- `src/pages/` — home, login, registration, history, and admin pages.
- `src/components/ReportUpload.tsx` — authenticated upload and processing.
- `src/components/ObservationTable.tsx` — structured result display.
- `src/components/AudioPlayer.tsx` — protected, on-demand audio.
- `src/i18n.ts` — dictionaries and fallback behavior.
- `public/logo.png` — optimized logo.

## Run, build, and test

Run `npm ci`, `npm run dev`, `npm run test:run`, and `npm run build` from this directory. Vite serves `http://localhost:5173`; the production container serves the build through Nginx. Secondary pages are lazy-loaded to reduce the initial bundle. Playwright browser validation should be run manually against a disposable environment with synthetic data.

## User flow

1. Register or sign in.
2. Select `en`, `am`, `om`, or `ti`.
3. Upload an allowed PDF, PNG, or JPEG.
4. Review extracted values and flags.
5. Read the explanation and doctor questions.
6. Press Play to request speech; audio is not generated or billed until requested.
7. Use History to view only your own saved reports.

The browser never receives provider API keys. The interface is educational and must not be presented as diagnosis or prescription. Check mobile layout, keyboard navigation, screen readers, and all four scripts before release.

**© 2026 Yeabsera Andnet · LisanHealth**
