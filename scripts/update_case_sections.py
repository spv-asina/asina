#!/usr/bin/env python3
"""Render concise, distinct technical sections into all 34 case pages.

Source of truth: scripts/case_narratives.json.
Run with --write to update HTML, or --check to verify generated content.
"""
from __future__ import annotations

import argparse
import html
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / "scripts/case_narratives.json").read_text(encoding="utf-8"))
OLD_START = '<section class="section"><div class="container case-section-grid"><div><div class="eyebrow">Состав</div><h2>Функциональный контур</h2>'
NEW_START = '<section class="section case-technical-section" data-case-technical="'
NEXT_SECTION = '<section class="section compact">'


def escape(value: str) -> str:
    return html.escape(value, quote=True).replace("&#x27;", "&#39;")


def list_html(items: list[str], kind: str) -> str:
    return '<ul class="case-tech-list" data-case-checklist="' + kind + '">' + "".join(
        '<li>' + escape(item) + '</li>' for item in items
    ) + '</ul>'


def render(slug: str, story: dict) -> str:
    if len(story["mechanics"]) != 2 or len(story["checks"]) != 2:
        raise ValueError(f"{slug}: expected two mechanics and two checks")
    return (
        '<section class="section case-technical-section" data-case-technical="' + slug.upper() + '">'
        '<div class="container case-section-grid">'
        '<div class="case-tech-intro"><div class="eyebrow">Технические детали</div>'
        '<h2>Что происходит внутри</h2>'
        '<p class="case-tech-subtitle">Без повторения экранов демонстрации.</p></div>'
        '<div class="case-tech-main"><p class="case-tech-lead">' + escape(story["lead"]) + '</p>'
        '<div class="case-tech-columns">'
        '<div class="case-tech-panel"><h3>Механика</h3>' + list_html(story["mechanics"], "mechanics") + '</div>'
        '<div class="case-tech-panel"><h3>Что проверить в демо</h3>' + list_html(story["checks"], "checks") + '</div>'
        '</div>'
        '<div class="case-tech-contribution"><h3>Моя зона работы</h3><p>' + escape(story["work"]) + '</p></div>'
        '</div></div></section>'
    )


def transform(text: str, slug: str) -> str:
    new_start = text.find(NEW_START)
    old_start = text.find(OLD_START)
    start = new_start if new_start >= 0 else old_start
    if start < 0:
        raise ValueError(f"{slug}: old or new content section not found")
    end = text.find(NEXT_SECTION, start)
    if end < 0:
        raise ValueError(f"{slug}: related project section not found")
    if text[start:end].count('data-case-technical=') > 1:
        raise ValueError(f"{slug}: multiple generated sections")
    return text[:start] + render(slug, DATA[slug]) + text[end:]


def main() -> None:
    parser = argparse.ArgumentParser()
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--write", action="store_true")
    mode.add_argument("--check", action="store_true")
    args = parser.parse_args()
    paths = sorted(ROOT.glob("case-*.html"))
    technical = [p for p in paths if not p.name.startswith("case-site-")]
    if len(technical) != 34 or set(DATA) != {p.stem.removeprefix("case-") for p in technical}:
        raise SystemExit("Case count or narrative coverage mismatch: expected exactly 34")
    different = []
    for page in technical:
        slug = page.stem.removeprefix("case-")
        before = page.read_text(encoding="utf-8")
        after = transform(before, slug)
        if before != after:
            different.append(page.name)
            if args.write:
                page.write_text(after, encoding="utf-8")
    if args.check and different:
        raise SystemExit("Outdated generated pages: " + ", ".join(different))
    print(f"{len(technical)} case pages verified; {len(different)} {'updated' if args.write else 'outdated'}")


if __name__ == "__main__":
    main()
