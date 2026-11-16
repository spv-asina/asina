#!/usr/bin/env python3
"""Standalone showcase regression: 11 websites, real rendering, links and responsive screenshots."""
from __future__ import annotations

import http.server
import json
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / "artifacts" / "showcase-v2"
SITES = (
    "lexforma", "aeris", "meridian", "axis", "verdict", "atelier",
    "monolith", "lumen", "kinetic", "bloom", "lapka",
)
SIZES = (320, 390, 1440)


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, *_args):
        pass


def run_engine(browser, base: str, engine: str):
    results = []
    for name in SITES:
        for width in SIZES:
            page = browser.new_page(
                viewport={"width": width, "height": 860},
                reduced_motion="reduce",
            )
            errors = []
            page.on("pageerror", lambda exc: errors.append(str(exc)))
            try:
                url = f"{base}/showcase/{name}.html"
                response = page.goto(url, wait_until="domcontentloaded", timeout=30000)
                page.wait_for_function(
                    "() => (document.body?.innerText || '').length > 450",
                    timeout=15000,
                )
                page.wait_for_timeout(140)
                metrics = page.evaluate("""() => ({
                  width: innerWidth,
                  documentWidth: document.documentElement.scrollWidth,
                  bodyText: document.body.innerText.length,
                  heading: (document.querySelector('h1')?.innerText || '').slice(0, 150),
                  brand: document.documentElement.dataset.spvShowcase,
                  cssLoaded: Array.from(document.styleSheets).some(sheet =>
                    sheet.href && sheet.href.includes('showcase-editorial.css')),
                  links: document.querySelectorAll('a[href]').length,
                  buttons: document.querySelectorAll('button').length,
                  fields: document.querySelectorAll('input,select,textarea').length,
                })""")
                issues = []
                if response is None or response.status != 200:
                    issues.append("standalone page is not HTTP 200")
                if metrics["brand"] != name:
                    issues.append("site-specific design token missing")
                if not metrics["cssLoaded"]:
                    issues.append("editorial stylesheet did not load")
                if not metrics["heading"]:
                    issues.append("the landing page has no visible headline")
                if metrics["links"] + metrics["buttons"] < 4:
                    issues.append("not enough working interface entry points")
                if metrics["documentWidth"] > width + 4:
                    issues.append(f"horizontal overflow: {metrics['documentWidth'] - width}px")
                if errors:
                    issues.append("runtime errors: " + "; ".join(errors[:2]))
                if width in (390, 1440) and engine == "chromium":
                    page.screenshot(
                        path=str(ART / f"{name}-{width}-viewport.png"),
                        animations="disabled", timeout=22000,
                    )
                results.append({
                    "site": name, "engine": engine, "width": width,
                    "metrics": metrics, "errors": issues,
                })
                if issues:
                    print("ISSUE", name, engine, width, issues, flush=True)
            finally:
                page.close()
    return results


def test_wrappers(browser, base):
    issues = []
    for name in SITES:
        page = browser.new_page(
            viewport={"width": 390, "height": 860},
            reduced_motion="reduce",
        )
        try:
            page.goto(f"{base}/case-site-{name}.html", wait_until="domcontentloaded")
            frame = page.locator("iframe.site-demo-frame")
            frame.wait_for(state="attached")
            frame_url = frame.get_attribute("src")
            link = page.locator(".site-demo-devicebar__open")
            if frame_url != f"./showcase/{name}.html":
                issues.append(f"{name}: embedded source path missing")
            if link.count() != 1 or link.get_attribute("href") != frame_url:
                issues.append(f"{name}: full screen link missing or wrong")
            content = page.frame_locator("iframe.site-demo-frame")
            content.locator("body").wait_for(state="visible")
            page.wait_for_function(
                """() => {
                  const frame=document.querySelector('iframe.site-demo-frame');
                  try{return (frame.contentDocument?.body?.innerText||'').length>450}
                  catch(e){return false}
                }""",
                timeout=15000,
            )
            page.locator('[data-site-width="desktop"]').click()
            if frame.get_attribute("data-device") != "desktop":
                issues.append(f"{name}: desktop preview switch failed")
            page.locator('[data-site-width="phone"]').click()
            if frame.get_attribute("data-device") != "phone":
                issues.append(f"{name}: mobile preview switch failed")
            page.locator("[data-site-reset]").click()
            if frame.get_attribute("src") != frame_url:
                issues.append(f"{name}: reset lost source")
        finally:
            page.close()
    return issues


def main():
    ART.mkdir(parents=True, exist_ok=True)
    for name in SITES:
        if not (ROOT / "showcase" / (name + ".html")).exists():
            raise SystemExit("Missing standalone site " + name)
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{server.server_port}"
    try:
        with sync_playwright() as pw:
            results = []
            for engine in ("chromium", "webkit"):
                browser = getattr(pw, engine).launch(headless=True)
                results.extend(run_engine(browser, base, engine))
                if engine == "chromium":
                    wrapper_errors = test_wrappers(browser, base)
                browser.close()
        failed = [row for row in results if row["errors"]]
        report = {
            "sites": len(SITES),
            "responsive_views": len(results),
            "errors": len(failed) + len(wrapper_errors),
            "failed": failed,
            "wrapper_errors": wrapper_errors,
        }
        (ART / "report.json").write_text(
            json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8",
        )
        print(json.dumps({
            "sites": report["sites"], "views": report["responsive_views"],
            "errors": report["errors"], "wrapper_errors": wrapper_errors,
            "failed": failed,
        }, ensure_ascii=False), flush=True)
        if report["errors"]:
            raise SystemExit(1)
    finally:
        server.shutdown()


if __name__ == "__main__":
    main()
