# LisanHealth Design System & UI Specifications

**Document Version:** 1.0.0  
**Status:** Approved  
**Brand Identity:** LisanHealth (ልሳን ጤና) — "Your Health Report, in Your Language"

---

## 1. Brand Identity & Principles

1. **Calm & Non-Alarmist:** Medical reports frequently trigger anxiety. The visual tone must be tranquil, clinical, and reassuring rather than alarming.
2. **Multilingual First-Class Typography:** Equal visual hierarchy for Latin script (English, Afaan Oromoo) and Ge'ez script (Amharic).
3. **Information Clarity:** Distinct visual treatment for observed values, reference intervals, out-of-range indicators, and educational explanations.
4. **Accessible Audio Integration:** Spoken audio is an integral access modality, not a secondary afterthought.

---

## 2. Color Palette & Design Tokens

```css
:root {
  /* Brand Primary: Ethiopian Emerald / Deep Health Teal */
  --color-primary: #0D6955;
  --color-primary-light: #169E81;
  --color-primary-dark: #074739;
  --color-primary-surface: #E8F5F2;

  /* Accent: Warm Ochre (Ethiopic Gold / Sunshine) */
  --color-accent: #E08714;
  --color-accent-light: #F7B85E;
  --color-accent-surface: #FDF6E9;

  /* Clinical Status Tokens */
  --color-status-normal: #10B981;    /* Green: Value within reference range */
  --color-status-flag: #F59E0B;      /* Amber: Value outside reference range */
  --color-status-critical: #EF4444;  /* Red: Substantially deviant / requires physician prompt */
  --color-status-neutral: #64748B;   /* Slate: Informational */

  /* Neutral Surface & Typography */
  --color-bg-base: #F8FAFC;
  --color-bg-surface: #FFFFFF;
  --color-bg-elevated: #FFFFFF;
  --color-border: #E2E8F0;
  --color-text-main: #0F172A;
  --color-text-muted: #64748B;
  --color-text-inverse: #FFFFFF;

  /* Elevation Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-full: 9999px;
}
```

---

## 3. Typography & Multi-Script Font Stack

```css
/* Typography Stack supporting English, Afaan Oromoo, and Amharic */
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Ethiopic", "Abyssinica SIL", sans-serif;
  line-height: 1.6;
  color: var(--color-text-main);
  background-color: var(--color-bg-base);
}

/* Headings */
h1, h2, h3 {
  font-weight: 700;
  line-height: 1.25;
  color: var(--color-text-main);
}
```

---

## 4. UI States & Experience

- **Empty State:** Clear drop zone inviting PDF or image upload, displaying sample synthetic reports for immediate testing.
- **Extracting / Loading State:** Animated step-progress indicator showing:
  1. *Extracting report values...*
  2. *Grounding clinical references...*
  3. *Localizing into Amharic / Afaan Oromoo...*
  4. *Synthesizing voice audio...*
- **Review State:** Table listing each test (e.g., Hemoglobin, Glucose), reported value, unit, reference interval, and status badge.
- **Audio Playback State:** Embedded accessible player with Play, Pause, Scrub, Speed control (1x, 0.9x for language clarity), and Language Switcher.
