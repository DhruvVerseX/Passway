# Passway logo

## The concept

The mark is an open ring with a solid dot sitting in the gap — a gate,
not a closed loop, with a token passing through the one deliberate
opening. That's a direct visual echo of the product itself: controlled,
narrow passage — not a vault that shuts everything in, and not an open
door that lets everything through. It's also intentionally the same
visual language as the "conduit line" animation already used on the
landing page (a traveling pulse dot) — the logo and the site motif are
one system, not two unrelated design decisions.

It's deliberately simple: one continuous stroke plus one dot, no fine
detail, no gradient. That's what makes it hold up at 16px (a browser
tab favicon) as well as it does at billboard size — most logos that
look good at desktop size fall apart shrunk down, this doesn't because
there was never much to lose.

## Files

```
passway-mark.svg          — icon only, dark ink ring, for light backgrounds
passway-mark-dark.svg     — icon only, white ring, for dark backgrounds
passway-logo-light.svg    — icon + wordmark, for light backgrounds
passway-logo-dark.svg     — icon + wordmark, for dark backgrounds
exports/                  — PNG renders at 512/256/128/64/32/16px, both variants
```

Use the plain SVGs anywhere you can (website, Figma, docs) — they
scale perfectly at any size. Use the PNG exports where SVG isn't
supported: app store icons, some social platforms, email signatures.

## Colors

| | Hex | Used for |
|---|---|---|
| Ink | `#151A21` | Ring + wordmark on light backgrounds |
| White | `#FFFFFF` | Ring + wordmark on dark backgrounds |
| Cyan | `#14B8A6` | The dot — always this color, on every variant |

The cyan never changes between light/dark versions — it's the one
constant that should always read as "Passway" regardless of context,
the way Stripe's purple or Spotify's green stays fixed everywhere.

## Before you use this for real

Two things worth doing before this goes on an app icon or a public
site, both quick:

1. **The wordmark text is live SVG `<text>`, not outlined paths.** It's
   set in a generic sans-serif stack (`Arial, Helvetica`) so it
   renders consistently even where a custom font isn't loaded — but
   for a production logo file, open it in Figma or Inkscape and
   convert the text to outlines/paths. That way the logo renders
   identically everywhere, permanently, regardless of what fonts are
   installed on whatever machine or platform opens the file.
2. **Sanity-check the mark against your actual favicon pipeline** —
   browsers and app stores sometimes crop icons into a circle or
   rounded square automatically. The 16px and 32px exports here are a
   good start, but generate a proper `favicon.ico` (multi-resolution)
   and any platform-specific app icon sizes (iOS/Android have their
   own required dimensions) when you're ready to ship this for real.
