#!/usr/bin/env python3
"""Static, dependency-free smoke checks for concise 34 case narratives."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
pages = sorted(p for p in ROOT.glob("case-*.html") if not p.name.startswith("case-site-"))
assert len(pages) == 34, f"Expected 34 technical cases, got {len(pages)}"
for page in pages:
    s = page.read_text(encoding="utf-8")
    slug = page.stem.removeprefix("case-").upper()
    assert s.count(f'data-case-technical="{slug}"') == 1, page
    assert s.count('data-case-checklist="mechanics"') == 1, page
    assert s.count('data-case-checklist="checks"') == 1, page
    assert s.count('<section class="section case-demo-section"') == 1, page
    assert s.count('<div data-demo-root>') == 1, page
    assert '<h2>Функциональный контур</h2>' not in s, page
    assert '<h2>Поток системы</h2>' not in s, page
    assert '<h2>Тестовые сценарии</h2>' not in s, page
    for stale in (
        'Компонент входит в описанный технический контур',
        'Проверяется вход, ожидаемое преобразование',
        'сценарий зафиксирован',
    ):
        assert stale not in s, (page, stale)
    start = s.index('<section class="section case-technical-section"')
    end = s.index('<section class="section compact">', start)
    block = s[start:end]
    for kind in ("mechanics", "checks"):
        content = re.search(r'data-case-checklist="' + kind + r'">(.*?)</ul>', block)
        assert content, (page, kind)
        assert content.group(1).count("<li>") == 2, (page, kind)
    assert s.count('Моя зона работы') == 1, page
print("PASS: 34 unique case narratives, two technical notes and two checks each; demos preserved")
