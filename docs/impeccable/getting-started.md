# Getting Started
> Source: <https://impeccable.style/docs>
> Fetched: 2025-01
> Repository: azkar-app

Install Impeccable, run `/impeccable init`, then choose the right command for the job.
---

## Three-step flow

1. **Install** — `npx impeccable install` (from project root), then reload your agent.
2. **Set context** — `/impeccable init` (writes `PRODUCT.md` + `DESIGN.md`).
3. **Try it** — point a command at a real page, e.g. `/impeccable polish the pricing page`.

## What `/impeccable init` does

The `/init` command is the entry point for every project. Without it, every other command has to guess: generic SaaS voice, safe-default fonts, the AI color palette. With it, every command reads your answers before it generates.

It performs one codebase scan and writes three things:

- **`PRODUCT.md`** — strategic file. Platform, users and their situation, product purpose, positioning, operating context, capabilities and constraints, brand commitments, evidence on hand, design principles, and accessibility needs. Answers "who, what, why".
- **`DESIGN.md`** — visual file. Colors, typography, elevation, components, do's and don'ts. Answers "how it looks". Delegated to `/impeccable document`, which init invokes at the end.
- **Live mode config** — pre-configured `/impeccable live` so it opens straight into variant mode with no first-time setup.

The flow scans the codebase first (README, package.json, components, tokens, brand assets) and turns that into a *hypothesis*, not a questionnaire. It infers platform (web / iOS / Android / adaptive) from the files and asks only when the evidence is genuinely ambiguous. Then it asks up to three questions per round:

- who the primary user is, in what situation, doing what job;
- what the product makes possible, and the mechanism a competitor could not truthfully copy;
- what durable constraints, assets, evidence, or product facts future work must preserve.

Init deliberately does **not** ask for an aesthetic direction: no colors, no typography, no visual references. Those decisions belong to the design work itself. If you volunteer a binding visual constraint, init records it without expanding on it.

`PRODUCT.md` stays strategic. `DESIGN.md` holds the visual language. Keeping them separate means strategy can stay stable while the visual system evolves.

See `commands/init.md` for the full reference.

## Choose a command

| Situation | Command |
|---|---|
| Start a project | `/impeccable init` |
| Build a new surface | `/impeccable <describe it>` |
| Plan a new feature before code | `/impeccable shape` |
| Polish before ship | `/impeccable polish` |
| Honest second-opinion review | `/impeccable critique` |
| Implementation quality audit | `/impeccable audit` |
| Iterate in the browser | `/impeccable live` |

## Context files (read by every command)

- **Design Context** — the `PRODUCT.md` + `DESIGN.md` pair. See [commands/init.md](commands/init.md).
- **Config and ignores** — what `/init` should not touch.
- **New work** — direction for new surfaces (`/shape`, `/impeccable`).

## Automation

- **Detector CLI** — `npx impeccable detect` runs the 61 deterministic anti-pattern checks standalone.
- **Design hooks** — `/impeccable hooks` wires the detector into pre-commit / CI.
- **Doctor** — diagnose a misconfigured install.

## Tutorials

- [Getting started](https://impeccable.style/docs) (the source of this doc)
- Iterate on UI with Live Mode
- Critique with the visual overlay
