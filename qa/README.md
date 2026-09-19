# Verification — 19 September 2026

## Automated

- Static inventory: 58 original entry points, 45 cases.
- 1,110 local links/assets checked: no missing targets or anchors.
- 144 layout combinations: 8 representative pages × 9 widths × 2 themes.
- Widths: 320, 375, 390, 430, 600, 768, 1024, 1440, 1920 CSS pixels.
- Theme persistence, mouse tracking and touch greeting, accessible demo tabs.
- Catalog filters, URL state, incremental display and returning from a case.
- Brief validation, summary, persistence, deletion and explicit Telegram handoff.
- All 58 pages opened in Chromium, zero JavaScript exceptions.
- Reduced-motion mode disables animated tracking/blinking.
- No-JavaScript catalog keeps all 45 case links accessible.
- 16 axe-core WCAG A/AA audits: 4 pages × 2 widths × 2 themes, zero violations.

The machine-readable results are in report.json. Browser checks use Playwright with Chromium.
This is not a claim of complete WCAG conformance, testing on physical devices or Safari/Firefox.
Telegram recipient and prefilled link are checked; no message was sent.

## Visual review and revisions

Reviewed home (both themes, mobile/desktop), mobile contact form and mobile case screenshots.
Replaced generic mascot with reference-inspired chestnut hair, charcoal hoodie, seated pose,
black cat and lavender accent. Simplified vector interpretation, not a painterly copy.
Improved mobile CTA spacing, self-hosted Manrope for stable typography, checked both palettes.
Rechecked content migration to retain feature cards, architecture steps and test scenarios
inside technical disclosures, in addition to ordinary paragraphs.

## Boundaries

Project illustrations are explicitly labelled demos using test data, not working customer apps.
Historical website demos in demos/ intentionally preserve their original design and are not
covered by the new theme or by the 144 main-portfolio layout combinations.
The main branch and live GitHub Pages site are not changed by this delivery.
