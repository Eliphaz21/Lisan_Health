# LisanHealth Design System & UI Specifications

**Document Version:** 1.1.0  
**Status:** Approved  
**Brand Identity:** LisanHealth (ልሳን ጤና) — "Your Health Report, in Your Language"

---

## 1. Brand Identity & Principles

1. **Bespoke Health Tech Elegance:** Depart from generic AI vibe-coding palettes. Utilize a bespoke, high-contrast **Graphite (`#25272C`)** base combined with luminous **Sky Mint (`#B8F7E4`)** accents and clean **White (`#FFFFFF`)** cards.
2. **Calm & Non-Alarmist:** Medical laboratory reports trigger natural anxiety. The visual tone is clinical, tranquil, and structured rather than alarming.
3. **Multilingual First-Class Typography:** Equal visual hierarchy for Latin script (English, Afaan Oromoo) and Ge'ez script (Amharic).
4. **Accessible Audio Integration:** Spoken audio is an integral access modality anchored in a high-contrast Graphite audio player card.
5. **Clean SVG Visuals:** Zero casual emojis; professional SVG iconography for clinical and media actions.

---

## 2. Color Palette & Design Tokens

```css
:root {
  /* Primary Base: Deep Graphite */
  --color-graphite: #25272C;
  --color-graphite-dark: #191B1F;
  --color-graphite-light: #373A41;
  --color-graphite-surface: #2D3037;

  /* Accent Highlight: Sky Mint */
  --color-skymint: #B8F7E4;
  --color-skymint-dark: #0D6E54;
  --color-skymint-surface: #F0FDF9;
  --color-skymint-border: #89E6CB;
  --color-skymint-glow: rgba(184, 247, 228, 0.35);

  /* Clean Surfaces & Canvas */
  --color-bg-base: #F8F9FA;
  --color-bg-surface: #FFFFFF;
  --color-bg-subtle: #F1F3F5;
  --color-border: #E5E7EB;
  --color-border-subtle: #ECEEF1;
  --color-border-focus: #25272C;

  /* Neutral Typography */
  --color-text-main: #25272C;
  --color-text-muted: #64748B;
  --color-text-subtle: #94A3B8;
  --color-text-inverse: #FFFFFF;

  /* Clinical Status Tokens */
  --color-status-normal: #0D6E54;    /* Deep Mint: Value within reference range */
  --color-status-normal-bg: #E8FBF4;
  --color-status-flag: #D97706;      /* Amber: Value outside reference range */
  --color-status-flag-bg: #FEF3C7;
  --color-status-critical: #DC2626;  /* Crimson: Substantially deviant / priority */
  --color-status-critical-bg: #FEE2E2;
  --color-status-uncertain: #6366F1; /* Indigo: Missing units or OCR ambiguity */
  --color-status-uncertain-bg: #EEF2FF;

  /* Elevation Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(37, 39, 44, 0.04);
  --shadow-md: 0 4px 12px -2px rgba(37, 39, 44, 0.08), 0 2px 4px -2px rgba(37, 39, 44, 0.04);
  --shadow-lg: 0 12px 24px -4px rgba(37, 39, 44, 0.12), 0 4px 8px -2px rgba(37, 39, 44, 0.06);

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-full: 9999px;
}
```

---

## 3. Brand Assets & Typography

- **Official Logo Asset:** `frontend/public/logo.png` — Circular deep navy backdrop with Heart (left: White with medical cross; right: Turquoise blending into acoustic sound waves).
- **Typography Stack:** Supporting English, Afaan Oromoo, and Amharic:
```css
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Ethiopic", "Abyssinica SIL", sans-serif;
  line-height: 1.6;
  color: var(--color-graphite);
  background-color: var(--color-bg-base);
}
```

---

## 4. UI Components & Experience

- **Header / Navbar:** Sticky white bar with 44px official logo, Graphite brand title with Sky Mint Ge'ez subtitle, and live API status badge.
- **Language Capsule:** High-contrast Graphite capsule with Sky Mint active pill button.
- **Upload Dropzone:** Clean card with dashed border, switching to Sky Mint surface on hover.
- **Results Table:** High-contrast table with clear analyte naming, tabular numerals, reference range formatting, and status pills.
- **Audio Narration Card:** Dark Graphite anchor card with Sky Mint play button, speed adjustments ($1.0\times, 0.9\times$), and sound wave animation icon.
