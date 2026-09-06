# Overview
> Source: <https://impeccable.style/>
> Fetched: 2025-01
> Repository: azkar-app

Project description, the 23-command design vocabulary, anti-patterns overview, install options, supported agents.
---

## What it is

Impeccable is a **design vocabulary for AI coding agents**. It gives a precise shared language between humans and the AI generating UI, so the agent stops reaching for the same generic "AI slop" defaults every other tool produces.

It comes as:

- **1 skill** — the underlying rules, anti-patterns, and do/don't catalog
- **23 commands** — each names one kind of intervention
- **61 detector checks** — automated lint that catches visible AI tells: gradient text, purple palettes, side-tab borders, nested cards, AI beige, italic serif, etc.
- **2 project files** the agent reads before generating:
  - `PRODUCT.md` — strategy (who, what, why)
  - `DESIGN.md` — visual system (colors, typography, components, do's and don'ts)

## What it strips from AI output

The main page ("Detects and removes AI slop") calls out the recurring defaults the skill is designed to catch:

- **Gradient text** — colored text that fades between hues
- **Purple palettes** — the default Tailwind/shadcn indigo-violet
- **Side-tab borders** — vertical accent stripes next to navigation items
- **AI beige** — the warm off-white every agent reaches for
- **Italic serif** — gratuitous serif italic for "elegance"
- **Pulsing dots** — the loading dots that say "AI was here"
- **Cards in cards** — nested card-on-card layouts

The detector is available standalone as `npx impeccable detect` and runs 61 deterministic checks against any codebase.

## The 23 commands

Grouped by intent. See `README.md` for the full table with per-command doc links.

| Category | Count | Commands |
|---|---|---|
| **Create** | 2 | `impeccable`, `shape` |
| **Evaluate** | 2 | `audit`, `critique` |
| **Refine** | 8 | `animate`, `bolder`, `colorize`, `delight`, `layout`, `overdrive`, `quieter`, `typeset` |
| **Simplify** | 3 | `adapt`, `clarify`, `distill` |
| **Harden** | 4 | `harden`, `onboard`, `optimize`, `polish` |
| **System** | 4 | `document`, `extract`, `init`, `live` |

Each command reads `PRODUCT.md` + `DESIGN.md` before writing anything, so the agent never has to guess the brand voice or visual system.

## Install

Single command from the project root:

```sh
npx impeccable install
```

Then reload your agent and run `/impeccable init` once to generate `PRODUCT.md` and `DESIGN.md` from a scan of the codebase.

## Supported agents

Impeccable ships as an installable skill for:

- **Claude Code** (Anthropic)
- **Cursor**
- **GitHub Copilot**
- **Gemini CLI** (Google)
- **Codex CLI** (OpenAI)
- **Grok Build** (xAI)
- **Antigravity**
- **OpenCode**
- **Pi**
- **Hermes Agent**

After `npx impeccable install`, restart the agent and the slash commands become available automatically.

## How the live loop works

The pull-quote from the main page:

> Give direction in chat. Refine the result on the page.
> Every change lands in your source.

The flow:

1. You describe a change in the agent chat (`/impeccable polish the pricing page. Keep our sharp corners and sober palette. Remove the AI tells.`).
2. The agent reads `DESIGN.md` and applies the change in your source.
3. It runs the detector and reports findings (`4 tells found: AI beige, italic serif, side-tab, pulsing dot`).
4. `/impeccable live` opens the running app for in-place iteration.

## When to reach for it in azkar-app

- **New screen**: `/shape` first to capture the design brief, then `/impeccable` to build.
- **Existing screen looks "off"**: `/critique` for honest scoring, then `/polish` to act on findings.
- **Pre-ship check**: `/audit` for measurable issues (a11y, perf, theming, responsive).
- **Edge cases**: `/harden` for empty/loading/error states, dark mode, a11y.
- **Visual tuning**: `/bolder` or `/quieter` depending on the impression you want.
- **Last 5%**: `/polish` — pixel alignment, focus states, copy tone.
- **Brand refresh**: `/init` to rewrite `PRODUCT.md` + `DESIGN.md`, then re-run targeted commands.
