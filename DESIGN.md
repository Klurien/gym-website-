# COMRADES GYM — Design System (Claude Design Standard)

This file is the single source of truth for all UI decisions on this platform.
Every page, component, and style must derive from these tokens.

---

## Brand Identity

- **Name:** Comrades Gym
- **Tagline:** Forge Your Legacy
- **Vibe:** Professional Personal Trainer Platform — disciplined but welcoming. Not military-aggressive on interior pages. Raw energy on the landing page only.

---

## Color Palette

### Core
| Token | Value | Usage |
|---|---|---|
| `--bg` | `#0A0A0B` | Page background |
| `--bg-2` | `#111114` | Elevated surface (sidebar, nav) |
| `--surface` | `#18181C` | Card background |
| `--surface-2` | `#1F1F25` | Input fields, nested cards |
| `--border` | `rgba(255,255,255,0.08)` | Subtle dividers |
| `--border-active` | `rgba(255,255,255,0.18)` | Focused/hovered borders |

### Accent — Primary Red (Brand)
| Token | Value | Usage |
|---|---|---|
| `--red` | `#E8294A` | CTAs, active states, brand hits |
| `--red-soft` | `rgba(232,41,74,0.12)` | Backgrounds under red text |
| `--red-glow` | `rgba(232,41,74,0.3)` | Button shadows |

### Accent — Warm Amber (Claude Design Influence)
| Token | Value | Usage |
|---|---|---|
| `--amber` | `#E8973A` | Secondary CTAs, highlights |
| `--amber-soft` | `rgba(232,151,58,0.12)` | Tag/badge backgrounds |

### Text
| Token | Value | Usage |
|---|---|---|
| `--text` | `#F2F2F3` | Primary body text |
| `--text-2` | `#A0A0AB` | Secondary/muted text |
| `--text-3` | `#5C5C6B` | Placeholder, disabled |

### Status
| Token | Value | Usage |
|---|---|---|
| `--green` | `#3ECF8E` | Success, active |
| `--yellow` | `#EAB308` | Warning, pending |

---

## Typography

```
Primary UI:   'Inter', system-ui, sans-serif     — weights: 400, 500, 600
Display:      'Anton', serif                     — headings, hero
Accent:       'Syncopate', sans-serif            — labels, section badges
```

### Scale
| Class | Size | Weight | Usage |
|---|---|---|---|
| `.t-display` | `clamp(3rem, 8vw, 7rem)` | 400 (Anton) | Hero titles |
| `.t-h1` | `2.5rem` | 700 (Inter) | Page titles |
| `.t-h2` | `1.5rem` | 600 (Inter) | Section titles |
| `.t-h3` | `1.1rem` | 600 (Inter) | Card headings |
| `.t-body` | `0.95rem` | 400 (Inter) | Body text |
| `.t-small` | `0.8rem` | 400 (Inter) | Meta, timestamps |
| `.t-label` | `0.7rem` | 600 (Syncopate) | Badges, labels |

---

## Spacing

Base unit: `4px`. Use multiples only.

```
--space-1: 4px    --space-2: 8px    --space-3: 12px   --space-4: 16px
--space-5: 20px   --space-6: 24px   --space-8: 32px   --space-10: 40px
--space-12: 48px  --space-16: 64px
```

---

## Border Radius

```
--radius-xs: 4px     (tags, chips)
--radius-s: 8px      (inputs, small cards)
--radius-m: 12px     (cards, panels)
--radius-l: 16px     (modals, large cards)
--radius-xl: 24px    (messaging bubbles)
--radius-full: 9999px (avatars, pills)
```

---

## Shadows

```
--shadow-sm:  0 1px 3px rgba(0,0,0,0.4)
--shadow-md:  0 4px 16px rgba(0,0,0,0.5)
--shadow-lg:  0 8px 32px rgba(0,0,0,0.6)
--shadow-red: 0 4px 20px rgba(232,41,74,0.25)
```

---

## Components

### Card `.card`
```css
background: var(--surface);
border: 1px solid var(--border);
border-radius: var(--radius-m);
padding: 24px;
box-shadow: var(--shadow-sm);
transition: border-color 0.2s ease, box-shadow 0.2s ease;
```

### Button Primary `.btn`
```css
background: var(--red);
color: #fff;
border-radius: var(--radius-s);
padding: 10px 20px;
font-size: 0.85rem; font-weight: 600;
box-shadow: var(--shadow-red);
transition: opacity 0.2s ease, transform 0.15s ease;
```
Hover: `opacity: 0.88; transform: translateY(-1px);`

### Button Ghost `.btn-ghost`
```css
background: transparent;
border: 1px solid var(--border-active);
color: var(--text);
border-radius: var(--radius-s);
padding: 10px 20px;
```

### Input `.field`
```css
background: var(--surface-2);
border: 1px solid var(--border);
border-radius: var(--radius-s);
color: var(--text);
padding: 10px 14px;
font-size: 0.9rem;
```
Focus: `border-color: var(--red); outline: none;`

### Badge `.badge`
```css
display: inline-flex;
padding: 3px 10px;
border-radius: var(--radius-full);
font-size: 0.65rem; font-weight: 600;
letter-spacing: 0.05em; text-transform: uppercase;
```
`.badge-red` → `background: var(--red-soft); color: var(--red);`
`.badge-green` → `background: rgba(62,207,142,0.12); color: var(--green);`
`.badge-amber` → `background: var(--amber-soft); color: var(--amber);`

---

## Messaging Components

### Conversation Item `.conv-item`
- Height: `72px`; padding: `12px 16px`
- Avatar: `40px` circle, border `2px solid var(--border)`
- Name: `.t-body` weight 600
- Preview: `.t-small` color `var(--text-2)` truncated
- Unread dot: `8px` circle `var(--red)` aligned top-right of avatar

### Message Bubble
- Outgoing `.bubble-out`: `background: var(--red); color: #fff; border-radius: 18px 18px 4px 18px;`
- Incoming `.bubble-in`: `background: var(--surface-2); color: var(--text); border-radius: 18px 18px 18px 4px;`
- Max width: `70%`; padding: `10px 14px`

---

## Do's and Don'ts

✅ Use `var(--*)` tokens — never hardcode hex values  
✅ Apply `transition` on interactive elements  
✅ Use `Inter` for UI text; `Anton` for impact headings only  
✅ Inner page hero sections use `padding-top: 120px` (accounts for fixed nav)  
❌ Don't use `all-caps` on body text in interior pages (landing only)  
❌ Don't use `border-radius: 0` on cards or inputs  
❌ Don't use raw `rgba(red-value)` — use the defined token  
