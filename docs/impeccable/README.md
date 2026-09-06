# Impeccable — Design Vocabulary Reference

> Local reference for the [Impeccable](https://impeccable.style/) design skill, captured for use in the **azkar-app** project.
>
> Source: <https://impeccable.style/> · <https://impeccable.style/docs/>
> Fetched: 2025-01

## What is Impeccable?

Impeccable is a **design vocabulary for AI coding agents** (Cursor, Claude Code, GitHub Copilot, Gemini CLI, Codex CLI, and others). It gives a precise shared language between designers/PMs and the AI generating UI, so the agent stops reaching for generic "AI slop" defaults.

It comes as:

- **1 skill** — the underlying rules, anti-patterns, and do/don't catalog
- **23 commands** — each names one kind of intervention
- **61 detector checks** — automated lint that catches the defaults agents reach for (gradient text, purple palettes, side-tab borders, nested cards, AI beige, italic serif, etc.)

The skill writes two project files the agent reads before generating:

- `PRODUCT.md` — strategy (who, what, why)
- `DESIGN.md` — visual system (colors, typography, components, do's and don'ts)

## The 23 commands

Grouped by intent. Each command has a dedicated doc file under `commands/`.

### Create
| Command | Purpose | Doc |
|---|---|---|
| `/impeccable` | Run the full new-work flow on a described surface | [→](../overview.md) |
| `/shape` | Discovery conversation that produces a design brief before any code | [→](commands/shape.md) |

### Evaluate
| Command | Purpose | Doc |
|---|---|---|
| `/audit` | Implementation quality audit (a11y, perf, theming, responsive, anti-patterns) — scores 0–4, severity P0–P3 | [→](commands/audit.md) |
| `/critique` | Design quality review (Nielsen heuristics, cognitive load, persona lenses, AI-slop detector) | [→](commands/critique.md) |

### Refine
| Command | Purpose | Doc |
|---|---|---|
| `/animate` | Add motion / micro-interactions | [overview](../overview.md) |
| `/bolder` | Push the design toward more confident expression | [→](commands/bolder.md) |
| `/colorize` | Refine the palette and color usage | [overview](../overview.md) |
| `/delight` | Add the small surprises that elevate the experience | [overview](../overview.md) |
| `/layout` | Fix layout composition issues | [overview](../overview.md) |
| `/overdrive` | Maximum-expression variant | [overview](../overview.md) |
| `/quieter` | Pull the design toward restraint and calm | [→](commands/quieter.md) |
| `/typeset` | Refine typography hierarchy and rhythm | [overview](../overview.md) |

### Simplify
| Command | Purpose | Doc |
|---|---|---|
| `/adapt` | Adapt the design to a new context (screen size, platform) | [overview](../overview.md) |
| `/clarify` | Tighten copy and content | [overview](../overview.md) |
| `/distill` | Reduce complexity and remove unnecessary elements | [overview](../overview.md) |

### Harden
| Command | Purpose | Doc |
|---|---|---|
| `/harden` | Cover edge cases (a11y, dark mode, loading, errors, empty states) | [→](commands/harden.md) |
| `/onboard` | First-run experience and empty states | [overview](../overview.md) |
| `/optimize` | Performance pass | [overview](../overview.md) |
| `/polish` | Last-mile detail pass before shipping | [→](commands/polish.md) |

### System
| Command | Purpose | Doc |
|---|---|---|
| `/document` | Capture design system decisions in `DESIGN.md` | [overview](../overview.md) |
| `/extract` | Pull reusable patterns out of the codebase | [overview](../overview.md) |
| `/init` | Initialize Impeccable in a project (writes `PRODUCT.md` + `DESIGN.md`) | [→](commands/init.md) |
| `/live` | Open the running app in the agent for in-place iteration | [overview](../overview.md) |

> Commands without a dedicated doc page on impeccable.style are documented only in the overview; the [overview](overview.md) captures the project-level description and intent.

## How to use these files

This is reference material. Before any agent works on a non-trivial UI change in azkar-app, it should:

1. Read `README.md` (this file) to see the command vocabulary.
2. Read `overview.md` to understand what Impeccable's anti-patterns are.
3. Read the specific command doc under `commands/` that matches the work.
4. Inspect `PRODUCT.md` and `DESIGN.md` if they exist at the project root.

## Source files captured

| File | Source URL | Captured content |
|---|---|---|
| `overview.md` | <https://impeccable.style/> | Project description, install, the 23 commands, anti-pattern catalog overview |
| `getting-started.md` | <https://impeccable.style/docs> | How to install + run `/init` |
| `commands/init.md` | <https://impeccable.style/docs/init> | `/impeccable init` reference |
| `commands/audit.md` | <https://impeccable.style/docs/audit> | `/impeccable audit` reference |
| `commands/critique.md` | <https://impeccable.style/docs/critique> | `/impeccable critique` reference |
| `commands/polish.md` | <https://impeccable.style/docs/polish> | `/impeccable polish` reference |
| `commands/harden.md` | <https://impeccable.style/docs/harden> | `/impeccable harden` reference |
| `commands/bolder.md` | <https://impeccable.style/docs/bolder> | `/impeccable bolder` reference |
| `commands/quieter.md` | <https://impeccable.style/docs/quieter> | `/impeccable quieter` reference |
| `commands/shape.md` | <https://impeccable.style/docs/shape> | `/impeccable shape` reference |
