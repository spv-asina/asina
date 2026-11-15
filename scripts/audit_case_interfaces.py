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
SIZES = (320, 390, 760, 1440)


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, *_args):
        pass


def analyze(page, path: Path, width: int, report: list[dict]):
    is_site = path.name.startswith("case-site-")
    page.set_viewport_size({"width": width, "height": 900})
    page.wait_for_timeout(80)
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
              height: document.documentElement.scrollHeight,
              buttons: document.querySelectorAll('button').length,
              links: document.querySelectorAll('a[href]').length
            })""")
            row["iframe"] = frame_metrics
            if frame_metrics["scrollWidth"] > frame_metrics["viewport"] + 3:
                row["warnings"].append("embedded site horizontal overflow: %spx" % (frame_metrics["scrollWidth"] - frame_metrics["viewport"]))
            if not frame_metrics["buttons"] and not frame_metrics["links"]:
                row["errors"].append("embedded site has no interactive controls")
            if width == 390:
                menu = page.frame_locator("iframe.site-demo-frame").locator('button').first
                if menu.count():
                    try:
                        menu.click(timeout=3000)
                        row["iframe_clicked"] = True
                    except Exception:
                        row["warnings"].append("could not click first embedded button")
                page.locator(".site-demo-shell").screenshot(path=str(OUT / (path.stem + "-390.png")), timeout=15000)
    else:
        demo = page.locator(".case-demo-section [data-live-demo]")
        demo.wait_for(state="visible", timeout=10000)
        code = path.stem.replace("case-", "").upper()
        if demo.get_attribute("data-live-demo") != code:
            row["errors"].append("incorrect live demo code")
        fields = demo.locator("[data-live-field]").count()
        actions = demo.locator('[data-live-action]:not([data-live-action="reset"])')
        total = actions.count()
        row["live"] = {"fields": fields, "actions": total}
        if fields < 1 or total < 2:
            row["errors"].append("demo lacks inputs or actions")
        before = int(demo.locator("[data-live-runs]").get_attribute("data-live-runs"))
        # Exercise every case-specific action and check that it updates visible state.
        for idx in range(total):
            action = actions.nth(idx)
            name = action.get_attribute("data-live-action")
            action.click(timeout=5000)
            now = int(demo.locator("[data-live-runs]").get_attribute("data-live-runs"))
            if now <= before:
                row["errors"].append("action %s did not update state" % name)
            before = now
        if demo.locator(".live-history p b").count() == 0:
            row["errors"].append("no action history")
        demo.locator('[data-live-action="reset"]').click()
        if int(demo.locator("[data-live-runs]").get_attribute("data-live-runs")) != 0:
            row["errors"].append("reset did not clear state")
        # The fixed CTA must not cover the mini-app.
        page.locator(".case-demo-section").evaluate("el => el.scrollIntoView({block:'center', behavior:'instant'})")
        page.wait_for_timeout(100)
        sticky = page.locator(".sticky-cta")
        if sticky.count() and sticky.evaluate("el => el.classList.contains('is-shown')"):
            row["errors"].append("floating CTA overlaps interactive demo")
        if width in (390, 1440):
            page.locator(".case-demo-section .demo-shell").screenshot(path=str(OUT / (path.stem + "-"+str(width)+".png")), timeout=15000)
        if width == 390:
            flow = page.locator('[data-demo-tab="flow"]')
            flow.click(timeout=7000)
            page.wait_for_timeout(470)
            if not page.locator('[data-demo-panel="flow"]').is_visible():
                row["errors"].append("flow tab did not become visible")
            page.locator('[data-demo-tab="product"]').click(timeout=7000)
            page.wait_for_timeout(470)
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
