# COMRADES GYM — Design System

This file is the single source of truth for all UI decisions on this platform.

---

## Brand Identity

- **Name:** Comrades Gym
- **Tagline:** Forge Your Legacy
- **Vibe:** Professional Personal Trainer Platform — disciplined but welcoming. Raw energy meets clean UX.
- **Core Concept:** Trainer-Trainee premium relationship with level-based program progression.

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

### Accent — Warm Amber
| Token | Value | Usage |
|---|---|---|
| `--amber` | `#E8973A` | Secondary CTAs, premium highlights |
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
|---|---|---|---|---|
| `.t-display` | `clamp(3rem, 8vw, 7rem)` | 400 (Anton) | Hero titles |
| `.t-h1` | `2.5rem` | 700 (Inter) | Page titles |
| `.t-h2` | `1.5rem` | 600 (Inter) | Section titles |
| `.t-h3` | `1.1rem` | 600 (Inter) | Card headings |
| `.t-body` | `0.95rem` | 400 (Inter) | Body text |
| `.t-small` | `0.8rem` | 400 (Inter) | Meta, timestamps |
| `.t-label` | `0.7rem` | 600 (Syncopate) | Badges, labels |

---

## Components

### Card `.card`
Background: `var(--surface)`, border: `1px solid var(--border)`, radius: `--radius-m`, padding: `24px`

### Button Primary `.btn`
Background: `var(--red)`, color: `#fff`, radius: `--radius-s`, padding: `10px 20px`
Hover: `opacity: 0.88; transform: translateY(-1px);`

### Button Ghost `.btn-ghost`
Transparent bg, border: `1px solid var(--border-active)`, color: `var(--text)`

### Input `.field`
Background: `var(--surface-2)`, border: `1px solid var(--border)`, radius: `--radius-s`
Focus: `border-color: var(--red)`

### Badge `.badge`
`.badge-red` → background: `var(--red-soft)`, color: `var(--red)`
`.badge-green` → background: `rgba(62,207,142,0.12)`, color: `var(--green)`
`.badge-amber` → background: `var(--amber-soft)`, color: `var(--amber)`

---

## Program Levels

### Beginner (Free)
- Foundation Strength — 4 weeks / 12 sessions
- Bodyweight Mastery — 6 weeks / 18 sessions

### Intermediate (Premium — $29–$39)
- Hypertrophy Accelerator — 8 weeks / 24 sessions
- Power & Explosiveness — 6 weeks / 18 sessions

### Advanced (Premium — $79–$149)
- Elite Performance — 12 weeks / 36 sessions
- Certified Coach Program — 16 weeks / 48 sessions

---

## Do's and Don'ts

✅ Use `var(--*)` tokens — never hardcode hex values  
✅ Apply `transition` on interactive elements  
✅ Use `Inter` for UI text; `Anton` for impact headings only  
✅ Inner page sections use `padding-top: 80px` (accounts for fixed nav)  
❌ Don't use `border-radius: 0` on cards or inputs  
❌ Don't use raw `rgba(red-value)` — use the defined token  
❌ Don't hardcode colors — always reference CSS variables
