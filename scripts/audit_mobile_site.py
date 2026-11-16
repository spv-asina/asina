#!/usr/bin/env python3
"""Mobile-only full-site browser audit with screenshots and desktop parity checks."""
from __future__ import annotations

import argparse
import http.server
import json
import math
import sys
import threading
from pathlib import Path
from urllib.parse import quote

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / "artifacts" / "mobile-wide"
SIZES = (320, 390, 760, 1440)
CAPTURES = (
    "index.html", "cases.html", "services.html", "about.html",
    "contacts.html", "automation.html", "case-pip.html",
    "case-fpl.html", "case-cdp.html", "case-site-atelier.html",
    "case-site-verdict.html",
)


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    directory_root = ROOT

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(self.directory_root), **kwargs)

    def log_message(self, *args):
        pass


def serve(directory: Path):
    class Handler(QuietHandler):
        directory_root = directory

    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server, "http://127.0.0.1:%d" % server.server_port


def capture_metrics(page, name: str):
    return page.evaluate("""() => {
      const p=document.querySelector('.spv-tilda-page, .spv-site-case');
      const hero=document.querySelector('main .hero, main .page-hero, main .case-hero, main .site-case-hero');
      const hdr=document.querySelector('.header, .site-case-header');
      const css=x=>x?getComputedStyle(x):null;
      const rect=x=>x?x.getBoundingClientRect():null;
      return {
        scroll:document.documentElement.scrollWidth, viewport:innerWidth,
        hero:hero?{height:Math.round(rect(hero).height), top:Math.round(rect(hero).top), font:css(hero.querySelector('h1'))?.fontSize, padding:css(hero).paddingTop}:null,
        header:hdr?{height:Math.round(rect(hdr).height), position:css(hdr).position}:null,
        main:document.querySelector('main')?.getBoundingClientRect().width||0,
        mobileCss:!!document.querySelector('link[href$="mobile-experience.css"]'),
        mobileJs:!!document.querySelector('script[src$="mobile-experience.js"]'),
        mobileFilters:document.querySelectorAll('.mobile-filter-rail').length,
        stickyCtaVisible:Array.from(document.querySelectorAll('.sticky-cta')).some(x=>{const c=css(x);return c.display!=='none'&&c.visibility!=='hidden'}),
        h1:document.querySelector('main h1')?.innerText?.slice(0,100)||''
      }
    }""")


def sample(page, base, path: str, width: int, result: list):
    page.set_viewport_size({"width": width, "height": 844})
    page.goto(base + "/" + quote(path), wait_until="domcontentloaded", timeout=30000)
    page.locator("main").wait_for(state="visible", timeout=15000)
    page.evaluate("document.fonts && document.fonts.ready")
    page.wait_for_timeout(90)
    m = capture_metrics(page, path)
    row = {"page": path, "width": width, **m, "errors": [], "warnings": []}
    if not m["mobileCss"] or not m["mobileJs"]:
        row["errors"].append("mobile design resources missing")
    if m["scroll"] > width + 4:
        msg = "horizontal overflow %dpx" % (m["scroll"] - width)
        if width <= 760:
            row["errors"].append(msg)
        else:
            row["warnings"].append("desktop overflow to compare against original: " + msg)
    if width >= 761 and m["mobileFilters"] != 0:
        row["errors"].append("mobile-only catalog wrapper retained on desktop")
    if width <= 760 and m["stickyCtaVisible"]:
        row["errors"].append("sticky CTA covers mobile viewport")
    if width in (320, 390) and path == "cases.html":
        if m["mobileFilters"] != 1:
            row["errors"].append("catalog category filter rail not mounted")
    if width == 390 and path in CAPTURES:
        page.screenshot(path=str(ART / (Path(path).stem + "-390-top.png")), animations="disabled", timeout=20000)
    if width == 390 and path in ("index.html", "cases.html", "contacts.html"):
        page.screenshot(path=str(ART / (Path(path).stem + "-390-full.png")), full_page=True, animations="disabled", timeout=25000)
    if width == 320 and path in ("index.html", "cases.html", "contacts.html"):
        page.screenshot(path=str(ART / (Path(path).stem + "-320-top.png")), animations="disabled", timeout=20000)
    if width == 1440 and path in ("index.html", "cases.html", "contacts.html"):
        page.screenshot(path=str(ART / (Path(path).stem + "-1440-top.png")), animations="disabled", timeout=20000)
    result.append(row)
    return row


def check_interaction(browser, base):
    page = browser.new_page(viewport={"width": 390, "height": 844}, reduced_motion="reduce")
    records = []
    try:
        page.goto(base + "/index.html", wait_until="domcontentloaded")
        primary = page.locator('.hero .actions a[href$="contacts.html"]')
        assert primary.count() == 1 and primary.is_visible(), "Homepage contact CTA missing"
        assert page.locator('.hero-panel .system-map__node').count() == 4, "Homepage route picker missing"
        assert page.locator("#entry-points").is_hidden(), "Repeated homepage routes visible"
        menu = page.locator(".header .menu")
        assert menu.is_visible(), "Mobile menu missing"
        menu.click()
        assert "open" in (page.locator(".header .nav").get_attribute("class") or ""), "Mobile menu does not open"
        page.locator('.header .nav a[href$="cases.html"]').click()
        page.wait_for_url("**/cases.html")
        records.append("home → menu → catalog")
        rail = page.locator(".mobile-filter-rail")
        assert rail.count() == 1, "Filter rail missing"
        rail.locator('[data-filter="ai"]').click()
        assert rail.locator('[data-filter="ai"]').get_attribute("class").find("is-active") >= 0
        page.locator(".case-search").fill("OCR")
        page.wait_for_timeout(250)
        visible = page.locator("[data-case-card]:visible").count()
        records.append("catalog filters and search (visible: %d)" % visible)
        page.goto(base + "/case-pip.html", wait_until="domcontentloaded")
        lab = page.locator(".case-demo-section .spv-lab")
        lab.wait_for(state="visible", timeout=15000)
        lab.locator('[data-lab-action="run"]').click()
        assert lab.locator(".spv-lab__output pre").is_visible(), "PIP output missing"
        records.append("interactive PIP data processing")
        page.goto(base + "/case-site-atelier.html", wait_until="domcontentloaded")
        frame = page.locator("iframe.site-demo-frame")
        frame.wait_for(state="attached", timeout=15000)
        assert frame.get_attribute("data-device") == "phone"
        page.locator('[data-site-width="desktop"]').click()
        assert frame.get_attribute("data-device") == "desktop"
        page.locator('[data-site-width="phone"]').click()
        assert frame.get_attribute("data-device") == "phone"
        records.append("showcase device switching")
        page.goto(base + "/contacts.html", wait_until="domcontentloaded")
        assert page.locator('form[data-mail-form] input').count() >= 2
        assert page.locator('form[data-mail-form] textarea').count() >= 1
        records.append("contact form ready (no external submission)")
    finally:
        page.close()
    return records


def compare_desktop(browser, base, baseline):
    if not baseline:
        return []
    results = []
    a = browser.new_page(viewport={"width": 1440, "height": 900}, reduced_motion="reduce")
    b = browser.new_page(viewport={"width": 1440, "height": 900}, reduced_motion="reduce")
    try:
        for path in ("index.html", "cases.html", "services.html", "contacts.html", "case-pip.html", "case-site-atelier.html"):
            a.goto(base + "/" + path, wait_until="domcontentloaded")
            b.goto(baseline + "/" + path, wait_until="domcontentloaded")
            a.wait_for_timeout(70); b.wait_for_timeout(70)
            ca = capture_metrics(a, path)
            cb = capture_metrics(b, path)
            if ca["scroll"] != cb["scroll"]:
                raise AssertionError("Desktop document width changed in %s (%d vs %d)" % (path, ca["scroll"], cb["scroll"]))
            if ca["hero"] and cb["hero"]:
                for key in ("font", "padding"):
                    if ca["hero"][key] != cb["hero"][key]:
                        raise AssertionError("Desktop changed in %s: hero %s %r vs %r" %
                                             (path, key, ca["hero"][key], cb["hero"][key]))
                if abs(ca["hero"]["height"] - cb["hero"]["height"]) > 2:
                    raise AssertionError("Desktop hero height changed in " + path)
            if ca["header"] and cb["header"] and abs(ca["header"]["height"] - cb["header"]["height"]) > 2:
                raise AssertionError("Desktop header changed in " + path)
            results.append(path)
    finally:
        a.close(); b.close()
    return results


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--baseline", type=Path)
    args = parser.parse_args()
    ART.mkdir(parents=True, exist_ok=True)
    pages = sorted(p.name for p in ROOT.glob("*.html"))
    if len(pages) != 58:
        raise SystemExit("Expected 58 pages, found %d" % len(pages))
    webserver, base = serve(ROOT)
    oldserver = None
    oldbase = None
    if args.baseline:
        oldserver, oldbase = serve(args.baseline.resolve())
    rows = []
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
            page = browser.new_page(viewport={"width": 390, "height": 844}, reduced_motion="reduce")
            for i, path in enumerate(pages):
                for width in SIZES:
                    row=sample(page,base,path,width,rows)
                    if row["errors"]:
                        print("ISSUE", path, width, row["errors"], flush=True)
                if (i+1) % 8 == 0:
                    print("Completed %d/%d pages" % (i+1, len(pages)), flush=True)
            page.close()
            interactions = check_interaction(browser, base)
            desktop = compare_desktop(browser, base, oldbase)
            browser.close()
        failures = [r for r in rows if r["errors"]]
        report = {"pages": len(pages), "views": len(rows), "errors": len(failures),
                  "interaction_steps": interactions, "desktop_parity_pages": desktop,
                  "failures": failures, "rows": rows}
        (ART/"report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf-8")
        print(json.dumps({k:v for k,v in report.items() if k!="rows"},ensure_ascii=False), flush=True)
        if failures:
            raise SystemExit(1)
    finally:
        webserver.shutdown()
        if oldserver:
            oldserver.shutdown()


if __name__ == "__main__":
    main()
