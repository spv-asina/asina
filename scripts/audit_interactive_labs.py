#!/usr/bin/env python3
"""Actual browser interaction audit for case workbenches and embedded site demos."""
from __future__ import annotations

import http.server
import json
import sys
import threading
from pathlib import Path
from urllib.parse import quote

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "artifacts" / "interactive-labs"
SIZES = (320, 390, 1440)


class Quiet(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)
    def log_message(self, *_args):
        pass


def main():
    pages = sorted(ROOT.glob("case-*.html"))
    technical = [p for p in pages if not p.name.startswith("case-site-")]
    sites = [p for p in pages if p.name.startswith("case-site-")]
    OUT.mkdir(parents=True, exist_ok=True)
    if len(technical) != 34 or len(sites) != 11:
        raise SystemExit("Expected 34 technical + 11 site cases; got %s / %s" % (len(technical), len(sites)))
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Quiet)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = "http://127.0.0.1:%s" % server.server_port
    records = []
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, args=["--no-sandbox"])
        for idx, path in enumerate(pages, start=1):
            page = browser.new_page(viewport={"width": 390, "height": 844}, reduced_motion="reduce")
            errors = []
            page.on("pageerror", lambda exc: errors.append(str(exc)))
            is_site = path in sites
            for width in SIZES:
                row = {"page": path.name, "width": width, "kind": "site" if is_site else "product", "errors": [], "warnings": []}
                try:
                    page.set_viewport_size({"width": width, "height": 844})
                    page.goto(base + "/" + quote(path.name), wait_until="domcontentloaded", timeout=25000)
                    if is_site:
                        iframe = page.locator("iframe.site-demo-frame")
                        iframe.wait_for(state="attached", timeout=12000)
                        content = page.frame_locator("iframe.site-demo-frame")
                        body = content.locator("body")
                        body.wait_for(state="visible", timeout=12000)
                        inner = body.evaluate("""el => ({
                          text: (el.innerText||'').length,
                          scroll: document.documentElement.scrollWidth,
                          width: innerWidth,
                          buttons: document.querySelectorAll('button').length,
                          links: document.querySelectorAll('a[href]').length,
                          fields: document.querySelectorAll('input,textarea,select').length
                        })""")
                        row["iframe"] = inner
                        bar = page.locator(".site-demo-devicebar")
                        if bar.count() != 1:
                            row["errors"].append("missing device switcher")
                        elif width == 1440:
                            frame_width = iframe.bounding_box()["width"]
                            bar.locator('[data-site-width="phone"]').click()
                            phone_width = iframe.bounding_box()["width"]
                            if phone_width > 400 or phone_width > frame_width:
                                row["errors"].append("phone mode did not reduce iframe width")
                            bar.locator('[data-site-width="desktop"]').click()
                            if iframe.bounding_box()["width"] < 650:
                                row["errors"].append("desktop mode did not restore iframe width")
                            bar.locator("[data-site-reset]").click()
                            row["device_switcher"] = "tested"
                        if width in (390, 1440):
                            page.locator(".site-demo-shell").screenshot(path=str(OUT / (path.stem+"-"+str(width)+".png")), timeout=20000)
                        if width == 390:
                            # Verify at least one real control in the embedded page, not just the iframe wrapper.
                            toggles = content.locator("button[aria-expanded]")
                            verified = False
                            for j in range(min(4, toggles.count())):
                                btn = toggles.nth(j)
                                if not btn.is_visible(): continue
                                before = btn.get_attribute("aria-expanded")
                                btn.click(timeout=5000)
                                page.wait_for_timeout(110)
                                after = btn.get_attribute("aria-expanded")
                                if before != after:
                                    verified = True
                                    break
                            if not verified:
                                tabs = content.locator("button[data-tab],button[role=tab]")
                                for j in range(min(6, tabs.count())):
                                    btn = tabs.nth(j)
                                    if not btn.is_visible(): continue
                                    before = btn.get_attribute("class")
                                    btn.click(timeout=5000)
                                    page.wait_for_timeout(110)
                                    after = btn.get_attribute("class")
                                    if before != after:
                                        verified = True
                                        break
                            row["embedded_control_tested"] = verified
                            if not verified:
                                row["warnings"].append("no stateful embedded control verified automatically")
                        if inner["text"] < 150: row["errors"].append("site preview has little content")
                        if inner["buttons"] + inner["links"] < 3: row["errors"].append("site lacks enough interactive controls")
                        if inner["scroll"] > inner["width"] + 4:
                            row["warnings"].append("embedded site horizontal overflow: %s" % (inner["scroll"]-inner["width"]))
                    else:
                        frame = page.locator(".spv-lab")
                        frame.wait_for(state="visible", timeout=15000)
                        shortcut = page.locator(".case-hero .spv-demo-shortcut")
                        expected_hash = "#demo-title-" + path.stem.replace("case-", "").upper()
                        if shortcut.count() != 1:
                            row["errors"].append("missing one-click access to interactive demo")
                        elif shortcut.get_attribute("href") != expected_hash:
                            row["errors"].append("shortcut does not target this case")
                        elif width == 390:
                            shortcut.click(timeout=10000)
                            if page.evaluate("window.location.hash") != expected_hash:
                                row["errors"].append("try-demo anchor did not navigate")
                        if frame.get_attribute("data-lab") != path.stem.replace("case-", "").upper():
                            row["errors"].append("wrong or missing case-specific lab")
                        first = frame.locator(".spv-lab__result").inner_text()
                        run = frame.locator('[data-lab-action="run"]')
                        if run.count() != 1: row["errors"].append("no primary operation button")
                        else:
                            run.click(timeout=10000)
                            page.wait_for_timeout(100)
                            after = frame.locator(".spv-lab__result").inner_text()
                            if first == after: row["errors"].append("primary action did not change output")
                            if "Ошибка локального сценария" in frame.inner_text():
                                row["errors"].append("scenario exception recorded")
                            result_size = frame.evaluate("""el => ({
                              outerWidth: Math.round(el.getBoundingClientRect().width),
                              contentWidth: el.scrollWidth,
                              fields: el.querySelectorAll('[data-lab-field]').length,
                              actions: el.querySelectorAll('[data-lab-action]').length,
                              logEntries: el.querySelectorAll('.spv-lab__log span').length
                            })""")
                            row["lab"] = result_size
                            if result_size["contentWidth"] > result_size["outerWidth"] + 4:
                                row["warnings"].append("lab overflows horizontally by %dpx" % (result_size["contentWidth"]-result_size["outerWidth"]))
                            if result_size["fields"] < 1: row["errors"].append("no editable inputs")
                            if result_size["logEntries"] < 1: row["errors"].append("action did not add history")
                            if width in (390, 1440):
                                frame.screenshot(path=str(OUT / (path.stem+"-"+str(width)+".png")), timeout=20000)
                            reset = frame.locator('[data-lab-action="reset"]')
                            reset.click(timeout=10000)
                            if frame.locator(".spv-lab__log").count() == 0:
                                row["errors"].append("reset did not record an action")
                            run.click(timeout=10000)
                            if "Ошибка локального сценария" in frame.inner_text():
                                row["errors"].append("scenario exception after reset")
                            if width == 390:
                                # Exercise a non-primary action if the case provides one.
                                secondary = frame.locator('[data-lab-action]:not([data-lab-action="run"]):not([data-lab-action="reset"])')
                                if secondary.count():
                                    secondary.first.click(timeout=10000)
                                    page.wait_for_timeout(50)
                                    if "Ошибка локального сценария" in frame.inner_text():
                                        row["errors"].append("secondary action raised a scenario exception")
                                # Ensure editable data is actually consumed by the mini-app.
                                selector = frame.locator('select[data-lab-field]').first
                                if selector.count() and selector.locator("option").count() > 1:
                                    original = selector.input_value()
                                    options = selector.locator("option")
                                    chosen = options.nth(1).get_attribute("value")
                                    if chosen == original:
                                        chosen = options.nth(0).get_attribute("value")
                                    selector.select_option(value=chosen)
                                    frame.locator('[data-lab-action="run"]').click(timeout=10000)
                                    if "Ошибка локального сценария" in frame.inner_text():
                                        row["errors"].append("edited input caused scenario exception")
                                row["secondary_checked"] = secondary.count() > 0
                    outer = page.evaluate("""() => ({width: innerWidth, scroll: document.documentElement.scrollWidth})""")
                    if outer["scroll"] > outer["width"] + 4:
                        row["warnings"].append("outer page overflow: %dpx" % (outer["scroll"]-outer["width"]))
                    if errors:
                        row["errors"].extend(errors[:3])
                        errors.clear()
                except Exception as exc:
                    row["errors"].append(str(exc)[:350])
                records.append(row)
            page.close()
            print("[%02d/%02d] %s" % (idx, len(pages), path.name), flush=True)
        browser.close()
    server.shutdown()
    failed = [x for x in records if x["errors"]]
    warnings = [x for x in records if x["warnings"]]
    report = {"technical": len(technical), "sites": len(sites), "screens": len(records),
              "errors": len(failed), "warnings": len(warnings), "rows": records}
    (OUT / "audit.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({k: v for k, v in report.items() if k != "rows"}, ensure_ascii=False), flush=True)
    for item in failed[:40]: print("ERROR %s %s: %s" % (item["page"],item["width"],item["errors"]),file=sys.stderr)
    for item in warnings[:25]: print("WARN %s %s: %s" % (item["page"],item["width"],item["warnings"]),flush=True)
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
