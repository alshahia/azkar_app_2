# /audit
> Source: <https://impeccable.style/docs/audit>
> Fetched: 2025-01
> Repository: azkar-app
Reference for the `/impeccable audit` command.
---## When to use it

/impeccable audit is the technical counterpart to /impeccable critique. Where /impeccable critique asks “does this feel right”, /impeccable audit asks “does this hold up”. It runs accessibility, performance, theming, responsive design, and anti-pattern checks against the implementation, scores each dimension 0 to 4, and produces a plan with P0 to P3 severity ratings.

Use it before shipping, during a quality sprint, or whenever a tech lead says “we should really look at accessibility”.

## How it works

The skill scans your code across five dimensions:

1. Accessibility: WCAG contrast, ARIA, keyboard nav, semantic HTML, form labels.
2. Performance: layout thrashing, expensive animations, missing lazy loading, bundle weight.
3. Theming: hard-coded colors, dark mode coverage, token consistency.
4. Responsive: breakpoint behavior, touch targets, mobile viewport handling.
5. Anti-patterns: the same deterministic checks the Detector CLI runs.

Each dimension gets a 0 to 4 score. Each finding gets a severity: P0 blocks the release, P1 should fix this sprint, P2 is next cycle, P3 is polish. You get back a single document you can paste into a ticket tracker.

Audit does not fix anything. It documents. Route the findings to /impeccable polish, /impeccable harden, or /impeccable optimize depending on the category.

On a native project, audit runs a different pass. When PRODUCT.md declares ios, android, or adaptive, the five web dimensions do not apply, so audit swaps to a native version: VoiceOver and TalkBack behavior, Dynamic Type and font scaling, touch targets at platform minimums, and conformance to the Apple HIG or Material 3 conventions your platform is held to. The deterministic detector has no native equivalent and sits out. See Design Context for how the platform is set, which is usually automatically.

## Try it

```
/impeccable audit the checkout flow
```

Expected output:

```
Accessibility: 2/4 (partial)
 P0: Missing form labels on 4 inputs
 P1: Contrast 3.1:1 on disabled button state
 P2: No visible focus indicator on custom dropdown

Performance: 3/4 (good)
 P1: Hero image not lazy-loaded (340KB)
 ...
```

Hand the P0s to /impeccable harden, the theming and typography P1s to /impeccable typeset and /impeccable polish, the rest to /impeccable polish.

## Pitfalls

- Confusing it with /impeccable critique. Audit is implementation quality. Critique is design quality. Run both for a full picture.
- Fixing P3s before P0s. The severity scale exists for a reason. Start at the top.
- Skipping the dimensions you think are fine. Theming and responsive are the ones most people assume are fine until they are not.
