# SPV ASINA — product-like redesign

## Scope

Existing GitHub Pages repository, no hosting migration. All 58 entry-point URLs preserved.
No authentication, backend, payment collection, fabricated testimonials or result metrics.

## Before implementation: design specification

1. Replace the long technical home page with five concise blocks: hero + interactive lab,
   featured work, client-oriented solutions, personal introduction, contact action.
2. Move implementation details into disclosure sections on case pages. Preserve original
   text in content.json. Preserve original website demonstrations under demos/.
3. Introduce shared typography, spacing, borders, buttons and states; warm light theme and
   graphite dark theme with lavender accent. Respect system preference and persist overrides.
4. Design desktop and mobile compositions separately within one maintainable responsive site:
   desktop side-by-side hero and large lab; mobile compact side-by-side mascot/demo block,
   bottom navigation, touch-friendly controls and single-column project cards.
5. Add a custom SVG chibi with bounded cursor tracking, blinking and a tap greeting. Respect
   reduced motion. Keep it in the hero, never obstructing content as a floating overlay.
6. Provide three explicitly labelled prepared-data demos (documents, lectures, orders).
7. Filter the full project catalog with shareable query parameters, incremental reveal and
   restoration of the catalog position after visiting a case.
8. Build a three-step local-only brief, input validation, copy action and explicit Telegram
   handoff. Never claim a message has been sent. Explain local draft storage and deletion.
9. Verify both themes across mobile/tablet/desktop, navigation, links, keyboard and reduced
   motion; inspect browser screenshots, correct visual inconsistencies, rerun regression.

## Architecture

- `content.json`: migrated text of existing pages.
- `scripts/build.py`: deterministic static generator, Python standard library only.
- `assets/style.css`: shared design tokens, layouts, breakpoints, motion rules.
- `assets/app.js`: progressive enhancement; no dependency or external API calls.
- `assets/theme.js`: early theme application to avoid theme flashing.
- `assets/mascot-personal.svg`: reference-inspired chestnut-haired chibi in a charcoal hoodie,
  seated with a black cat; separate eyes, pupils, head and greeting groups. SVG interpretation,
  intentionally simpler than the supplied painterly/pixel reference sheets.
- `demos/`: original website-case presentations; not restyled, intentionally treated as
  historical project demonstrations rather than portfolio navigation pages.

## Rebuild and preview

```sh
python scripts/build.py
python -m http.server 8080
```

Open http://localhost:8080/. Publish repository root to GitHub Pages as before.
The optional one-time migration tool requires lxml and the explicit original commit:
`python scripts/extract.py a4fb9d39ecf934ce7fee24dc72642c5896366d7d`.
Normal rebuilds use only `scripts/build.py` and do not need lxml.

## Asset and data notes

All illustrated previews are representations using test data, not screenshots of customer
systems. Existing project claims were migrated without independently verifying them.
Manrope Cyrillic and Latin variable fonts are self-hosted with their OFL license; Arial fallback.
No application data leaves the browser until the visitor opens an external service.
The privacy page describes the new behavior; historical demos retain original presentation.

## Release policy

Work is prepared on a separate branch; no automatic merge to main and no production deploy.
Review screenshots and test report before approving publication.
