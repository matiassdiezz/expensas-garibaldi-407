# Expensas Claras — Design System

> Generated with /web-design skill | Inspired by Linear, Vercel
> Date: 2026-04-08T18:00:00
> Direction: "Obsidian" — dark, minimal, data-first

## 1. Visual Theme & Atmosphere

Herramienta seria para gente que quiere entender a dónde va su plata. Minimalista, data-dense, sin decoración innecesaria. El diseño se borra — la información habla. Negro profundo con tipografía clara y acentos emerald que evocan crecimiento y finanzas saludables. La landing es limpia y directa: explica qué es, muestra el mapa, lista los edificios. Sin hero gigante, sin gradientes, sin bullshit.

## 2. Color Palette & Roles

> All text/background pairs verified for WCAG 2.1 AA compliance.
> Dark-first design — light mode not planned.

### WCAG Contrast Requirements
| Context | Minimum Ratio |
|---|---|
| Normal text (< 18px) | 4.5:1 |
| Large text (>= 18px bold or >= 24px) | 3:1 |
| UI components & graphics | 3:1 |
| Decorative / disabled | No requirement |

### Dark Mode (Primary)
| Role | Value | Usage | Contrast vs BG |
|---|---|---|---|
| Background | `#08090a` | Page background | — |
| Surface | `#141516` | Cards, panels, elevated elements | — |
| Surface Raised | `#1a1b1c` | Hover states on cards, active nav | — |
| Border | `rgba(255,255,255,0.08)` | Dividers, card borders, input borders | 3:1 |
| Border Strong | `rgba(255,255,255,0.15)` | Focused inputs, active borders | 3:1 |
| Text Primary | `#f7f8f8` | Headings, body text, numbers | 19.5:1 |
| Text Secondary | `#8a8f98` | Captions, labels, placeholders | 6.2:1 |
| Text Tertiary | `#62666d` | Disabled text, timestamps | 3.8:1 |
| Accent | `#10b981` | CTAs, links, positive indicators, active states | 7.4:1 |
| Accent Hover | `#34d399` | Hover on accent elements | 10.2:1 |
| Accent Muted | `rgba(16,185,129,0.12)` | Accent backgrounds, subtle highlights | — |
| Destructive | `#ef4444` | Errors, high-variation badges (>30%) | 4.6:1 |
| Destructive Muted | `rgba(239,68,68,0.12)` | Error backgrounds | — |
| Warning | `#f59e0b` | Moderate variation badges | 8.2:1 |
| Warning Muted | `rgba(245,158,11,0.12)` | Warning backgrounds | — |

### Emerald Scale (9-step)
| Step | Hex | Usage |
|---|---|---|
| 50 | `#ecfdf5` | — (reserved, light mode) |
| 100 | `#d1fae5` | — |
| 200 | `#a7f3d0` | — |
| 300 | `#6ee7b7` | Hover text on dark |
| 400 | `#34d399` | Hover states, secondary accent |
| 500 | `#10b981` | **Brand / Primary accent** |
| 600 | `#059669` | Pressed states |
| 700 | `#047857` | Muted accent on dark |
| 800 | `#065f46` | Subtle backgrounds |
| 900 | `#064e3b` | Darkest accent bg |

### Gray Scale (surfaces & text)
| Step | Hex | Usage |
|---|---|---|
| 950 | `#08090a` | Page background |
| 900 | `#141516` | Surface / cards |
| 850 | `#1a1b1c` | Raised surface / hover |
| 800 | `#23252a` | Strong borders |
| 700 | `#34343a` | Dividers |
| 600 | `#62666d` | Tertiary text |
| 500 | `#8a8f98` | Secondary text |
| 400 | `#a1a1aa` | Icons |
| 300 | `#d0d6e0` | Emphasis text |
| 200 | `#e5e7eb` | High emphasis |
| 100 | `#f7f8f8` | Primary text |

## 3. Typography Rules

> Using Geist (already in project via next/font/google). Modular scale: base 16px x 1.25 ratio.

| Element | Font | Weight | Size | Line Height | Letter Spacing |
|---|---|---|---|---|---|
| Display | Geist Sans | 600 | 48px | 1.00 | -1.2px |
| H1 | Geist Sans | 600 | 32px | 1.15 | -0.7px |
| H2 | Geist Sans | 600 | 24px | 1.25 | -0.4px |
| H3 | Geist Sans | 500 | 20px | 1.30 | -0.3px |
| H4 | Geist Sans | 500 | 16px | 1.40 | -0.1px |
| Body (lg) | Geist Sans | 400 | 18px | 1.60 | 0 |
| Body | Geist Sans | 400 | 16px | 1.50 | 0 |
| Body (sm) | Geist Sans | 400 | 14px | 1.50 | 0 |
| Caption | Geist Sans | 500 | 12px | 1.40 | 0.02em |
| Label | Geist Sans | 500 | 11px | 1.40 | 0.05em |
| Code / Numbers | Geist Mono | 400 | 14px | 1.50 | 0 |
| Numbers (lg) | Geist Mono | 500 | 16px | 1.40 | -0.02em |

**Font Stack:**
```css
--font-heading: 'Geist', system-ui, -apple-system, sans-serif;
--font-body: 'Geist', system-ui, -apple-system, sans-serif;
--font-mono: 'Geist Mono', ui-monospace, 'SF Mono', monospace;
```

**Rules:**
- ALL monetary values use Geist Mono — never sans for numbers
- Headings tighten letter-spacing at large sizes
- Uppercase labels only for section headers ("EDIFICIOS", "CATEGORIAS")
- Body text max-width: 65ch for readability

## 4. Component Stylings

### Buttons
**Primary:**
- Background: `#10b981`
- Text: `#08090a` (dark on accent)
- Padding: 10px 20px
- Radius: 8px
- Font: 14px, weight 500
- `:hover` — `#34d399`
- `:active` — `transform: scale(0.97)`, 160ms ease-out
- `:focus-visible` — `0 0 0 2px #08090a, 0 0 0 4px #10b981`

**Secondary / Ghost:**
- Background: `rgba(255,255,255,0.04)`
- Text: `#d0d6e0`
- Border: `1px solid rgba(255,255,255,0.08)`
- Radius: 8px
- `:hover` — bg `rgba(255,255,255,0.08)`, text `#f7f8f8`
- `:active` — `scale(0.97)`

**Destructive:**
- Background: `rgba(239,68,68,0.12)`
- Text: `#ef4444`
- `:hover` — bg `rgba(239,68,68,0.2)`

### Cards
- Background: `#141516`
- Border: `1px solid rgba(255,255,255,0.08)`
- Radius: 12px
- Padding: 20px (desktop), 16px (mobile)
- Hover (if clickable): border `rgba(255,255,255,0.15)`, bg `#1a1b1c`
- No box-shadow by default — depth from border only

### Building Cards (Home)
- Same as Cards but with left accent bar: `3px solid #10b981` (or category color)
- Hover: full border transition to `rgba(255,255,255,0.15)`

### Inputs
- Background: `rgba(255,255,255,0.04)`
- Text: `#f7f8f8`
- Placeholder: `#62666d`
- Border: `1px solid rgba(255,255,255,0.08)`
- Radius: 8px
- Padding: 10px 14px
- Focus: border `#10b981`, ring `0 0 0 3px rgba(16,185,129,0.15)`

### Badges / Tags
**Positive (variation < 10%):**
- Background: `rgba(16,185,129,0.12)`
- Text: `#34d399`
- Radius: 6px, padding 2px 8px, font 12px mono weight 500

**Warning (variation 10-30%):**
- Background: `rgba(245,158,11,0.12)`
- Text: `#f59e0b`

**Destructive (variation > 30%):**
- Background: `rgba(239,68,68,0.12)`
- Text: `#ef4444`

### Tooltips
- Background: `#1a1b1c`
- Border: `1px solid rgba(255,255,255,0.1)`
- Text: `#f7f8f8`
- Radius: 8px
- Delay: 400ms first, instant subsequent
- Enter: `scale(0.97) + opacity: 0` to `scale(1) + opacity: 1`, 150ms ease-out

### Navigation
- Sticky top, background: `#08090a` with `backdrop-filter: blur(12px)` at 90% opacity
- Border bottom: `1px solid rgba(255,255,255,0.05)`
- Logo: "Expensas Claras" — Geist Sans, 16px, weight 600
- Nav links: 14px, weight 400, `#8a8f98` default, `#f7f8f8` hover/active

### Map Container
- Radius: 12px (match cards)
- Border: `1px solid rgba(255,255,255,0.08)`
- CARTO dark tiles (already implemented)
- Marker popups: match tooltip style

## 5. Layout & Spacing

### Spacing System (8-point grid)
| Token | Value | Usage |
|---|---|---|
| `--space-xs` | 4px | Inline icon gaps, badge padding |
| `--space-sm` | 8px | Compact gaps, table cell padding |
| `--space-md` | 16px | Card padding (mobile), component gaps |
| `--space-lg` | 24px | Card padding (desktop), section gaps |
| `--space-xl` | 32px | Major section breaks |
| `--space-2xl` | 48px | Page section padding (mobile) |
| `--space-3xl` | 64px | Page section padding (desktop) |
| `--space-4xl` | 96px | Hero section padding |

### Layout
- **Max width:** 960px (content), 1200px (with map/wide sections)
- **Grid:** 12-column, 16px gutter
- **Container:** centered, `px-4 sm:px-6`
- **Content density:** Compact for dashboard/tables, balanced for landing sections

### Home Page Layout (Landing + Tool)
```
[Nav — sticky, blurred bg]
[Hero — compact, title + subtitle + CTA, max 200px height]
[Map — full-width within container, 300px, rounded-xl]
[Building Grid — 2 cols desktop, 1 col mobile, accent left border]
[Footer — minimal, muted text]
```

### Dashboard Layout (per-building)
```
[Nav — back link + building name]
[Summary Cards — 3-col grid: total, variation, cash flow]
[Category Overview — pie + table side by side]
[Monthly Trend — full-width chart]
[Expense Table — compact, sortable]
```

### Density Guide
| Context | Density | Typical padding |
|---|---|---|
| Expense tables | Compact | `--space-xs` to `--space-sm` |
| Dashboard cards | Balanced | `--space-md` to `--space-lg` |
| Landing sections | Balanced | `--space-xl` to `--space-3xl` |
| Hero | Airy | `--space-3xl` to `--space-4xl` |

## 6. Depth & Elevation

| Level | Treatment | Usage |
|---|---|---|
| 0 | No shadow, no border | Page background |
| 1 | `1px solid rgba(255,255,255,0.08)` | Cards, panels, inputs |
| 2 | `1px solid rgba(255,255,255,0.15)` | Hover cards, active elements |
| 3 | `0 4px 12px rgba(0,0,0,0.4)` + border | Tooltips, popovers |

Depth is communicated through border opacity, not shadows. Max 3 levels. No box-shadow on cards.

## 7. Design Do's and Don'ts

### Do
- Use Geist Mono for ALL monetary values and percentages
- Use emerald accent sparingly — only for CTAs, active states, positive indicators
- Use `rgba(255,255,255,0.08)` borders for subtle depth
- Use semantic color for badges: emerald/warning/destructive based on variation thresholds
- Keep tables compact — this is financial data, density matters
- Use uppercase + letter-spacing for section labels ("EDIFICIOS", "CATEGORIAS")
- Show skeleton loaders for data loading (not spinners)
- Add `:active` scale(0.97) to all clickable elements
- Use `@media (hover: hover) and (pointer: fine)` for hover states
- Gate map interactions: scrollWheelZoom disabled (already done)
- Format currency as AR$ with dots for thousands: `$1.234.567`

### Don't
- Use purple/indigo anywhere — accent is emerald only
- Put gradients on any surface
- Use box-shadow for cards — borders only
- Use `rounded-2xl` or larger — max `rounded-xl` (12px) for cards, `rounded-lg` (8px) for buttons
- Use decorative illustrations or icons — let data speak
- Make the hero bigger than 200px — this is a tool, not a marketing page
- Use spinner loaders — skeletons only
- Use `transition: all` — specify exact properties
- Use `ease-in` for UI — always ease-out
- Animate keyboard-initiated actions
- Use Inter — Geist is the font for this project
- Show empty states without a clear action CTA

## 8. Responsive Behavior

> Mobile-first: base styles = mobile. Use `min-width` media queries to layer up.

| Breakpoint | Width | Token | Changes |
|---|---|---|---|
| Mobile (base) | 0-639px | `sm` | Single column, stacked cards, map 220px height, compact tables |
| Tablet | 640-1023px | `md` | 2-column building grid, map 280px, side-by-side pie+table |
| Desktop | 1024-1439px | `lg` | Full layout, 960px container, hover interactions |
| Wide | >= 1440px | `xl` | 1200px container for map sections |

### Loading States
- Content areas: skeleton loaders matching card shapes (dark shimmer on `#141516`)
- Actions: optimistic UI — show success immediately
- Transitions: fade content in with opacity, 200ms ease-out

## 9. Motion & Animation

### Easing
```css
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
```

### Duration
| Element | Duration |
|---|---|
| Button press | 160ms |
| Badge/tooltip appear | 150ms |
| Card hover border | 200ms |
| Page transitions | 250ms |
| Map markers | 300ms |

### Rules
- Only animate `transform` and `opacity`
- Button `:active` → `scale(0.97)`, 160ms ease-out
- Card hover → border-color transition, 200ms ease-out
- List stagger: 40ms delay between items
- No animation on keyboard-initiated actions
- `prefers-reduced-motion: reduce` → keep opacity, remove transforms

## 10. Agent Prompt Guide

When building UI for Expensas Claras:

**Visual — tokens only:**
- Dark background: `#08090a`. Surface: `#141516`. Never use other dark values.
- Accent: `#10b981` emerald. Never purple, blue, or indigo.
- Text: `#f7f8f8` primary, `#8a8f98` secondary, `#62666d` tertiary.
- Borders: `rgba(255,255,255,0.08)` standard, `0.15` hover/focus.
- ALL money/numbers in Geist Mono. No exceptions.
- Max border-radius: 12px (cards), 8px (buttons/inputs), 6px (badges).

**Anti-AI-aesthetic:**
- NO purple/indigo palette
- NO gradients on surfaces
- NO uniform card grids — vary sizes, use featured/compact layouts
- NO box-shadow on cards — use border-opacity for depth
- NO oversized padding on dashboard sections — financial data needs density
- NO "Lorem ipsum" — use realistic Argentine building expense data
- NO decorative illustrations — this is a data tool

**Components (shadcn/ui):**
- Use shadcn Card, Badge, Button as base — override with tokens above
- Badge variants: map to emerald/warning/destructive based on variation %
- Tables: compact padding, alternating subtle row hover
- Charts (Recharts): use emerald scale for positive, gray for neutral, red for negative

**Financial formatting:**
- Currency: `$` prefix, dots for thousands, comma for decimals: `$1.234.567,89`
- Percentages: Geist Mono, include sign: `+12,5%` or `-3,2%`
- Dates: Spanish month names: "Enero 2026", "Feb → Mar"

**Accessibility:**
- All interactive elements keyboard-navigable
- Focus-visible: `0 0 0 2px #08090a, 0 0 0 4px #10b981`
- Touch targets minimum 44x44px on mobile
- ARIA labels on icon-only buttons and chart elements
- Color is never the only indicator — pair with +/- signs on percentages
