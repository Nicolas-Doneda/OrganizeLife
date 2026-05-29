# OrganizeLife Design System (v4)

## Overview
OrganizeLife's visual design is rooted in premium, comforting personal finance stationery. It rejects generic tech grays and glowing neon elements in favor of a deep warm charcoal and sand color palette. The interface acts as a calm, physical tool featuring soft, hair-thin lines, subtle topographic curves, and elastically aligned transaction elements to evoke control, precision, and order.

---

## Colors (Tokens OKLCH)

The color palette is mapped directly inside the stylesheet `@theme` block using the CSS custom properties dynamically updated based on the `.dark` class.

### Brand Accents
* **Primary (Warm Sand/Amber):** `oklch(72% 0.082 74)` / `#C9AA72` — Used for main actions, active navigation anchors, and primary brand buttons.
* **Secondary Light Sand:** `oklch(83% 0.068 78)` / `#E2CC9A` — Highlights, borders, active toggles, and drawing effects.
* **Success (Mint Emerald):** `oklch(62% 0.160 155)` — Received values, positive cashflows, and organized states.
* **Danger (Crimson Rose):** `oklch(58% 0.190 25)` — Overdue bills and alert values.
* **Warning (Warm Bronze):** `oklch(70% 0.150 65)` — Pending entries and warning indications.

### Light Mode (Soft Warm Creme)
* **Background Primary:** `oklch(97% 0.010 80)` — Base page background.
* **Background Secondary:** `oklch(93% 0.012 78)` — Section alternates.
* **Background Card/Tertiary:** `oklch(100% 0.000 0)` — White cards, inputs, and popovers.
* **Border Structural:** `oklch(88% 0.010 78)` — Thin borders (1px) with soft opacity.
* **Text Main:** `oklch(13% 0.012 75)` — High contrast warm dark charcoal.
* **Text Muted:** `oklch(42% 0.012 75)` — Labels and descriptions.

### Dark Mode (Noite Quente / Charcoal)
* **Background Primary:** `oklch(11% 0.008 75)` — Deep obsidian/charcoal dark base.
* **Background Secondary:** `oklch(17% 0.008 75)` — Dark sand/charcoal section alternates.
* **Background Card/Tertiary:** `oklch(23% 0.010 75)` — Lighter cards, forms, and popovers.
* **Border Structural:** `oklch(28% 0.009 75)` — Thin borders (1px) with low opacity.
* **Text Main:** `oklch(96% 0.006 80)` — High contrast soft cream text.
* **Text Muted:** `oklch(72% 0.008 75)` — Secondary descriptions.

---

## Typography
* **Font Sans (Body, Numbers & Labels):** `Geist` + default system font stack. Financial fields utilize tabular monospace numbers so data aligns correctly.
* **Font Heading (Titles & Branding):** `Plus Jakarta Sans` — Used for high-end headlines, badges, and the main navbar logo.

---

## Motion and Animation Guidelines
* **Interactive Elements:** Focus transitions use elastically interpolated spring loops (Magnetic Button) using standard LERP physics (`speed = 0.15` in `requestAnimationFrame`).
* **Hover State Elevation:** Cards lift sutilly with `translateY(-4px)`, expanding a discrete bottom drawer with micro-information (e.g. *"vence em 3 dias"*).
* **Topographical Backgrounds:** Slow, continuous background horizontal animations (`wave-move`) running via GPU acceleration (`translate3d`) at `45s` and `60s` intervals.
* **Accessible Fallback:** All styles listen to `@media (prefers-reduced-motion: reduce)`, instantly limiting transitions to `0.01ms`, disabling background wave movements, and hiding SVG flowing connection particles.

---

## Design Do's & Don'ts
* **DO** use OKLCH color variables to ensure consistency between light and dark themes.
* **DO** prioritize borders (1px with variable opacities) and soft shadows instead of heavy card background gradients.
* **DON'T** use floating 3D glass spheres, cyberpunk grid overlays, neon blue/purple cyber aesthetics, or AI-dashboard concepts.
* **DON'T** write generic metric placeholders like "100% cloud backup" or "50ms response time". Always relate data cards to actual personal finance flows.
