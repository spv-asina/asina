#!/usr/bin/env python3
"""End-to-end mobile portfolio route: catalog → case → live demo → contact.

Also checks compact result UX and the embedded website viewport switcher.
Runs entirely against local HTML served by the CI worker.
"""
from __future__ import annotations

import http.server
import json
import threading
from pathlib import Path
from urllib.parse import quote

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "artifacts" / "mobile-journey"
OUT.mkdir(parents=True, exist_ok=True)


class Quiet(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, *_args):
        pass


def open_catalog_case(page, base):
    page.goto(base + "/cases.html", wait_until="domcontentloaded")
    link = page.locator('a[href$="case-pip.html"]:visible').first
    link.wait_for(state="visible", timeout=15000)
    link.click()
    page.wait_for_url("**/case-pip.html", timeout=15000)


def verify(width, browser, base):
    page = browser.new_page(viewport={"width": width, "height": 844}, reduced_motion="reduce")
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    result = {"width": width, "steps": []}
    try:
        open_catalog_case(page, base)
        result["steps"].append("catalog → case")
        demo = page.locator(".case-demo-section .spv-lab")
        demo.wait_for(state="visible", timeout=15000)
        shortcut = page.locator(".case-hero .spv-demo-shortcut")
        assert shortcut.count() == 1, "Missing direct demo shortcut"
        shortcut.click()
        assert page.evaluate("location.hash") == "#demo-title-PIP"
        result["steps"].append("case → demo")
        assert demo.locator(".spv-lab__foot").count() == 1
        assert not demo.locator(".spv-lab__foot").evaluate("x => x.open")
        editor = demo.locator('[data-lab-field="event"]')
        editor.fill('{"order_id":42,"amount":12500}')
        demo.locator('[data-lab-action="run"]').click()
        output = demo.locator(".spv-lab__output pre")
        output.wait_for(state="visible", timeout=10000)
        assert '"tag": "new"' in output.inner_text(), "Expected mapped tag"
        assert demo.locator(".spv-lab__route").count() == 1
        assert demo.locator(".spv-lab__board").count() == 0, "PIP must not show unrelated cards"
        assert demo.locator(".spv-lab__log").count() == 1
        assert not demo.locator(".spv-lab__log").evaluate("x => x.open"), "History must start collapsed"
        result["steps"].append("webhook mapped")
        demo.locator('[data-lab-field="map"]').select_option("discount")
        demo.locator('[data-lab-field="target"]').select_option("telegram")
        demo.locator('[data-lab-action="run"]').click()
        assert '"discount": 1250' in output.inner_text(), "Discount mapping incorrect"
        assert "Telegram" in demo.locator(".spv-lab__route").inner_text()
        result["steps"].append("mapping and destination changed")
        demo.locator(".spv-lab__log summary").click()
        assert demo.locator(".spv-lab__log").evaluate("x => x.open")
        demo.locator('[data-lab-action="run"]').click()
        assert demo.locator(".spv-lab__log").evaluate("x => x.open"), "Expanded history resets unexpectedly"
        result["steps"].append("history expanded state retained")
        editor.fill('{"order_id":')
        demo.locator('[data-lab-action="run"]').click()
        assert "Некорректные данные" in demo.locator(".spv-lab__result").inner_text()
        assert "Ошибка входных данных" in demo.locator(".spv-lab__result").inner_text() or \
            "Проверьте JSON" in demo.locator(".spv-lab__result").inner_text()
        result["steps"].append("invalid JSON handled")
        editor.fill('{"order_id":42,"amount":12500}')
        demo.locator('[data-lab-action="reset"]').click()
        demo.locator('[data-lab-action="run"]').click()
        assert '"tag": "new"' in output.inner_text()
        result["steps"].append("reset and rerun")
        if width == 390:
            assert demo.locator(".spv-lab__log summary").bounding_box()["height"] >= 30
            height = demo.bounding_box()["height"]
            result["lab_height_390"] = round(height)
            assert height < 1080, "Mobile PIP still excessively tall (%dpx)" % height
            demo.screenshot(path=str(OUT / "pip-390.png"))
        overflow = page.evaluate("document.documentElement.scrollWidth - innerWidth")
        assert overflow <= 4, "Horizontal page overflow: %s" % overflow
        result["outer_overflow"] = overflow
        link = page.locator('.case-section-body a[href$="contacts.html"]:visible').last
        link.click()
        page.wait_for_url("**/contacts.html", timeout=15000)
        result["steps"].append("case → contact")
        assert not errors, errors[:3]
    finally:
        page.close()
    return result


def showcase(browser, base):
    page = browser.new_page(viewport={"width": 390, "height": 844}, reduced_motion="reduce")
    try:
        page.goto(base + "/case-site-atelier.html", wait_until="domcontentloaded")
        iframe = page.locator("iframe.site-demo-frame")
        iframe.wait_for(state="attached", timeout=15000)
        bar = page.locator(".site-demo-devicebar")
        assert bar.count() == 1
        assert iframe.get_attribute("data-device") == "phone", "Mobile must default to phone view"
        bar.locator('[data-site-width="desktop"]').click()
        assert iframe.get_attribute("data-device") == "desktop"
        bar.locator('[data-site-width="phone"]').click()
        assert iframe.get_attribute("data-device") == "phone"
        bar.locator("[data-site-reset]").click()
        assert iframe.get_attribute("data-device") == "phone"
        assert iframe.bounding_box()["width"] <= 390
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 4")
        page.locator(".site-demo-shell").screenshot(path=str(OUT / "atelier-390.png"))
        return {"switches": 3, "initial": "phone", "outer_overflow": 0}
    finally:
        page.close()


def main():
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Quiet)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = "http://127.0.0.1:%s" % server.server_port
    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=True, args=["--no-sandbox"])
            rows = [verify(w, browser, base) for w in (320, 390, 1440)]
            result = {"journey": rows, "showcase": showcase(browser, base)}
            browser.close()
        (OUT / "journey.json").write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
        print(json.dumps(result, ensure_ascii=False))
    finally:
        server.shutdown()


if __name__ == "__main__":
    main()
