# /init
> Source: <https://impeccable.style/docs/init>
> Fetched: 2025-01
> Repository: azkar-app
Reference for the `/impeccable init` command.
---## When to use it

Run /impeccable init once at the start of a project. Without it, every other command has to guess: generic SaaS voice, safe-default fonts, the AI color palette. With it, every command reads your answers before it generates.

Reach for it when:

- You just installed Impeccable in a new project. First thing to run. Other commands will nudge you toward it if you skip.
- The project’s brand direction has shifted. New positioning, new audience, new voice. Re-run init and the updated context flows through every command.
- Another command said “no design context found” and stopped. That is the signal: run init, then resume.

## How it works

One codebase scan feeds everything init writes:

- PRODUCT.md is the strategic file. Platform, users and their situation, product purpose, positioning, operating context, capabilities and constraints, brand commitments, evidence on hand, design principles, and accessibility needs. Answers “who, what, why”.
- DESIGN.md is the visual file. Colors, typography, elevation, components, do’s and don’ts. Answers “how it looks”. Written by the delegated /impeccable document command, which init invokes at the end.
- Live mode config. Since the same crawl already knows your framework and entry files, init pre-configures /impeccable live so it opens straight into variant mode with no first-time setup.

The flow scans the codebase first (README, package.json, components, tokens, brand assets) and turns that into a hypothesis rather than a questionnaire. It forms its own read of the platform (web, ios, android, or adaptive) and asks only when the evidence is genuinely ambiguous, so most projects never answer a platform question at all.

Then it asks what the repository could not tell it, at most three questions per round:

- who the primary user is, in what situation, doing what job;
- what the product makes possible, and the mechanism or claim a neighboring product could not truthfully copy;
- what durable constraints, assets, evidence, or product facts future work must preserve.

Init deliberately does not ask for an aesthetic direction: no colors, no typography, no visual references. Those decisions belong to the design work itself, where the surface, its mode, and the direction roll all get a say. If you volunteer a binding visual constraint, init records it without expanding on it.

PRODUCT.md is strategic only. No colors, no fonts, no pixel values. Those live in DESIGN.md. Keeping the two files separate is deliberate: strategy can stay stable while the visual system evolves. See Design Context for the full load order and how the files interact.

It closes by pointing you at the best commands to run next, picked from what the scan turned up: shape to plan new work, critique or audit for what is already there, live to iterate visually. For a build, you can simply describe what you want and Impeccable routes it through the new-work flow. No guessing where to begin.

## Try it

```
/impeccable init
```

Expect a short interview, usually one round of two or three questions. Init quotes back what it inferred from your code (“from the routes and the Swift package, this reads as an iOS app, match?”) so you are confirming rather than starting from scratch.

Along the way it offers to run /impeccable document for you. Say yes unless you have a specific reason to hold off. A real DESIGN.md is what keeps variants, polishes, and audits on-brand.

## Pitfalls

- Skipping it to “just try a command quickly”. Every other command will interview you mid-flight instead. Running init first is faster, not slower.
- Giving generic answers. “It helps teams collaborate” is not useful. “It traces every alert back to the deploy that caused it” is. The positioning line is the one future work leans on hardest.
- Treating PRODUCT.md as immutable. The file is yours. If init put something in there that is not quite right, edit it. Every command reads the current file.
- Expecting it to ask about visuals. It will not, on purpose. Colors, type, and references belong to the design work, where the surface and its direction are decided together.
- Claiming evidence you do not have. The Evidence on Hand section exists so later work knows what is real. State the absences too, and nothing downstream will invent a customer logo or a fake metric.
