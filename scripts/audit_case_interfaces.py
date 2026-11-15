#!/usr/bin/env python3
"""Browser smoke for 34 product case demos and 11 embedded showcase sites."""
from __future__ import annotations

import http.server
import json
import sys
import threading
from pathlib import Path
from urllib.parse import quote

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "artifacts" / "case-mobile-audit"
SIZES = (320, 390, 760)


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, *_args):
        pass


def analyze(page, path: Path, width: int, report: list[dict]):
    is_site = path.name.startswith("case-site-")
    page.set_viewport_size({"width": width, "height": 844})
    page.wait_for_timeout(110)

    metrics = page.evaluate("""() => ({
      docWidth: document.documentElement.scrollWidth,
      viewport: window.innerWidth
    })""")
    row = {"page": path.name, "width": width, "type": "site" if is_site else "product", **metrics, "errors": [], "warnings": []}
    if metrics["docWidth"] > width + 3:
        row["warnings"].append("outer horizontal overflow: %spx" % (metrics["docWidth"] - width))

    if is_site:
        iframe = page.locator("iframe.site-demo-frame")
        iframe.wait_for(state="attached", timeout=10000)
        if iframe.count() != 1:
            row["errors"].append("expected one embedded showcase frame")
        else:
            inner = page.frame_locator("iframe.site-demo-frame").locator("body")
            inner.wait_for(state="attached", timeout=10000)
            frame_metrics = inner.evaluate("""() => ({
              viewport: window.innerWidth,
              scrollWidth: document.documentElement.scrollWidth,
              height: document.documentElement.scrollHeight
            })""")
            row["iframe"] = frame_metrics
            if frame_metrics["scrollWidth"] > frame_metrics["viewport"] + 3:
                row["warnings"].append("embedded site horizontal overflow: %spx" % (frame_metrics["scrollWidth"] - frame_metrics["viewport"]))
            if width == 390:
                page.locator(".site-demo-shell").screenshot(path=str(OUT / (path.stem + "-390.png")), timeout=15000)
    else:
        # New interactive workbenches replace the legacy static sidebar.
        # Their full action coverage is exercised in audit_interactive_labs.py.
        live = page.locator(".case-demo-section .spv-lab")
        if live.count():
            live.wait_for(state="visible", timeout=10000)
            expected = path.stem.replace("case-", "").upper()
            if live.get_attribute("data-lab") != expected:
                row["errors"].append("incorrect interactive workbench code")
            fields = live.locator("[data-lab-field]").count()
            run_action = live.locator('[data-lab-action="run"]')
            row["interactive_lab"] = {"fields": fields, "run_actions": run_action.count()}
            if fields < 1 or run_action.count() != 1:
                row["errors"].append("missing functional controls")
            report.append(row)
            return
        nav = page.locator(".case-demo-section .demo-sidebar nav")
        nav.wait_for(state="visible", timeout=10000)
        data = nav.evaluate("""el => {
          const items=[...el.querySelectorAll('.demo-nav-item')];
          const nr=el.getBoundingClientRect();
          const rects=items.map(e=>e.getBoundingClientRect());
          return {
            display:getComputedStyle(el).display,
            columns:getComputedStyle(el).gridTemplateColumns,
            width:Math.round(nr.width),
            itemWidths:rects.map(r=>Math.round(r.width)),
            itemHeights:rects.map(r=>Math.round(r.height)),
            distinctRows:new Set(rects.map(r=>Math.round(r.y))).size
          };
        }""")
        row["nav"] = data
        if data["display"] != "grid":
            row["errors"].append("demo sidebar is %s instead of grid" % data["display"])
        if len(data["itemWidths"]) != 4:
            row["errors"].append("expected four demo navigation entries")
        expected_rows = 4 if width <= 420 else 2
        if data["distinctRows"] != expected_rows:
            row["errors"].append("expected %s navigation rows, found %s" % (expected_rows, data["distinctRows"]))
        if data["itemWidths"] and min(data["itemWidths"]) < 100:
            row["errors"].append("navigation buttons narrower than 100px")
        if data["itemHeights"] and max(data["itemHeights"]) > 145:
            row["errors"].append("unusually tall demo navigation: %spx" % max(data["itemHeights"]))
        # The fixed sales CTA must not cover the interactive demo while reading it.
        page.locator(".case-demo-section").evaluate("el => el.scrollIntoView({block:'center', behavior:'instant'})")
        page.wait_for_timeout(180)
        sticky = page.locator(".sticky-cta")
        if sticky.count() and sticky.evaluate("el => el.classList.contains('is-shown')"):
            row["errors"].append("floating CTA overlaps interactive demo")
        if width == 390:
            page.locator(".case-demo-section .demo-shell").screenshot(path=str(OUT / (path.stem + "-390.png")), timeout=15000)
            flow = page.locator('[data-demo-tab="flow"]')
            flow.click(timeout=7000)
            page.wait_for_timeout(500)
            if not page.locator('[data-demo-panel="flow"]').is_visible():
                row["errors"].append("flow tab did not become visible")
            page.locator('[data-demo-tab="product"]').click(timeout=7000)
            page.wait_for_timeout(500)
            if not page.locator('[data-demo-panel="product"]').is_visible():
                row["errors"].append("product tab did not become visible")
    report.append(row)


def main():
    paths = sorted(ROOT.glob("case-*.html"))
    product = [p for p in paths if not p.name.startswith("case-site-")]
    sites = [p for p in paths if p.name.startswith("case-site-")]
    if len(product) != 34 or len(sites) != 11:
        print(f"Unexpected coverage: {len(product)} product and {len(sites)} site pages", file=sys.stderr)
        sys.exit(2)
    OUT.mkdir(parents=True, exist_ok=True)
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), QuietHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    base = f"http://127.0.0.1:{server.server_port}"
    report = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, args=["--no-sandbox"])
        for index, path in enumerate(paths, start=1):
            page = browser.new_page(viewport={"width": 390, "height": 844}, reduced_motion="reduce")
            try:
                page.goto(f"{base}/{quote(path.name)}", wait_until="domcontentloaded", timeout=20000)
                for width in SIZES:
                    try:
                        analyze(page, path, width, report)
                    except Exception as exc:
                        report.append({"page": path.name, "width": width, "type": "site" if path in sites else "product", "errors": [str(exc)[:500]], "warnings": []})
            finally:
                page.close()
            print(f"[{index:02}/{len(paths):02}] {path.name}", flush=True)
        browser.close()
    server.shutdown()
    errors = [r for r in report if r["errors"]]
    warnings = [r for r in report if r["warnings"]]
    results = {"pages": len(paths), "product_pages": len(product), "site_pages": len(sites), "widths": SIZES, "tested_views": len(report), "error_count": len(errors), "warning_count": len(warnings), "results": report}
    (OUT / "audit.json").write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({key: val for key, val in results.items() if key != "results"}, ensure_ascii=False))
    for r in errors[:25]:
        print("ERROR:", r["page"], r["width"], "; ".join(r["errors"]), file=sys.stderr)
    for r in warnings[:20]:
        print("WARN:", r["page"], r["width"], "; ".join(r["warnings"]))
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
