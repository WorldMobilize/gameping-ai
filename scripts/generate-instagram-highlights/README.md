# Instagram Highlights generator

Local script for **1080×1920** story PNGs → `exports/instagram-highlights/` (gitignored).

## Approach

Vertical **marketing compositions** (mobile ad / Instagram story), not shrunk webpage screenshots.

- Real GamePing styling and components (`RecommendResultCardView`, homepage copy, game detail price UI)
- **80px** safe padding, content centered, blocks stacked for story aspect ratio
- 1–2 enlarged UI pieces per slide; no full desktop sections, no crop-to-fit

## Slides

| File | Content |
|------|---------|
| `01-intro.png` | Hero headline + live AI picks preview card |
| `02-how-it-works.png` | Three large step cards (Describe / Smarter picks / Track deals) |
| `03-recommendations.png` | Prompt card → AI matching → one result card |
| `04-refine.png` | Mini picks → refine input → refined result |
| `05-price-alerts.png` | Game art + price card + Track price + alert copy |
| `06-taste-profile.png` | Persistent taste + Premium (unchanged direction) |

## Run

```bash
npm run generate:instagram-highlights
```

Requires Playwright Chromium and network (RAWG cover images).

Generator-only — does not change app routes or recommendation logic.
