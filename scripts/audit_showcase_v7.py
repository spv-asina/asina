#!/usr/bin/env python3
"""Visual and functional regression for 11 individually designed showcase websites V7."""
from __future__ import annotations

import http.server
import json
import re
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "artifacts" / "showcase-v7"
SITES = (
    "lexforma", "aeris", "meridian", "axis", "verdict", "atelier",
    "monolith", "lumen", "kinetic", "bloom", "lapka",
)
MODELS = set(SITES) - {"lumen", "verdict"}
WIDTHS = (320, 390, 760, 1440)
BRAND_BACKGROUNDS = {
    "lexforma": "rgb(21, 18, 17)", "aeris": "rgb(243, 246, 248)",
    "meridian": "rgb(16, 42, 42)", "axis": "rgb(16, 29, 41)",
    "verdict": "rgb(240, 237, 230)", "atelier": "rgb(247, 240, 231)",
    "monolith": "rgb(24, 25, 23)", "lumen": "rgb(16, 14, 18)",
    "kinetic": "rgb(202, 223, 74)", "bloom": "rgb(255, 222, 209)",
    "lapka": "rgb(240, 239, 223)",
}


class Quiet(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, *_args):
        pass


def audit_standalone(browser, base, engine):
    records = []
    for name in SITES:
        for width in WIDTHS:
            page = browser.new_page(
                viewport={"width": width, "height": 870},
                reduced_motion="reduce",
            )
            errors = []
            exceptions = []
            page.on("pageerror", lambda exc: exceptions.append(str(exc)))
            try:
                res = page.goto(f"{base}/showcase/{name}.html",
                                wait_until="domcontentloaded", timeout=30000)
                page.locator("[data-v7-hero]").wait_for(state="visible", timeout=12000)
                page.wait_for_timeout(140)
                m = page.evaluate("""() => {
                  const h=document.querySelector('.v7-title');
                  const hero=document.querySelector('[data-v7-hero]');
                  const img=document.querySelector('.v7-image');
                  const old=document.querySelector('.v7-original-hero');
                  const visible=x=>x&&getComputedStyle(x).display!=='none';
                  const mainButton=hero?.querySelector('.v7-btn-primary');
                  const secondary=hero?.querySelector('[data-v7-open]');
                  const primaryTarget=mainButton?.getAttribute('href');
                  return {
                    width:innerWidth,scroll:document.documentElement.scrollWidth,
                    brand:document.documentElement.dataset.spvShowcase,
                    headline:h?.innerText?.replace(/\\s+/g,' ').trim()||'',
                    headlineOverflow:h?Math.max(0,h.scrollWidth-h.clientWidth):null,
                    heroHeight:Math.round(hero?.getBoundingClientRect().height||0),
                    brandBackground:hero?getComputedStyle(hero).backgroundColor:'',
                    photoHeight:Math.round(img?.getBoundingClientRect().height||0),
                    photoSrcset:img?.srcset||'',photoLoading:img?.loading,
                    originalHidden:!!old?.hidden,
                    originalCount:document.querySelectorAll('.v7-original-hero').length,
                    primaryHref:primaryTarget,
                    primaryTargetExists:!!(primaryTarget?.startsWith('#')&&document.getElementById(primaryTarget.slice(1))),
                    hasModelButton:!!secondary,
                    modelExpanded:secondary?.getAttribute('aria-expanded'),
                    fontSize:h?getComputedStyle(h).fontSize:'',
                    css:!!Array.from(document.styleSheets).find(x=>x.href?.includes('showcase-experience-v7.css')),
                    footerNotice:!!document.querySelector('.spv-concept-notice--footer'),
                    sectionCount:document.querySelectorAll('section').length
                  }
                }""")
                if not res or res.status != 200:
                    errors.append("standalone HTML does not load")
                if m["brand"] != name or not m["css"]:
                    errors.append("wrong brand or missing design system")
                if m["brandBackground"] != BRAND_BACKGROUNDS[name]:
                    errors.append(f"brand palette overridden: {m['brandBackground']}")
                if not m["headline"] or m["originalCount"] != 1:
                    errors.append("missing custom headline or original module")
                if m["headlineOverflow"] is None or m["headlineOverflow"] > 16:
                    errors.append(f"headline overflow {m['headlineOverflow']}px")
                if m["scroll"] > width + 4:
                    errors.append(f"horizontal overflow {m['scroll'] - width}px")
                if not (m["photoSrcset"] and "480w" in m["photoSrcset"]):
                    errors.append("responsive photographic source missing")
                if not m["originalHidden"]:
                    errors.append("old duplicate hero visible")
                if not m["primaryTargetExists"]:
                    errors.append("primary CTA has no section target")
                if (name in MODELS) != m["hasModelButton"]:
                    errors.append("model control mismatch")
                if not m["footerNotice"]:
                    errors.append("fictional brand disclosure missing")
                if m["sectionCount"] < 4:
                    errors.append("sections lost when re-rendering")
                if exceptions:
                    errors.append("JS: " + "; ".join(exceptions[:2]))

                if width == 390 and name in MODELS and not errors:
                    try:
                        open_button=page.locator(".v7-btn-secondary[data-v7-open]")
                        open_button.click(timeout=6000)
                        model=page.locator(".v7-original-hero")
                        if model.is_hidden() or model.locator(".v7-model-node").count() != 1:
                            errors.append("original product widget not restored")
                        elif not model.locator(".v7-model-node").is_visible():
                            errors.append("model not visible after opening")
                        if open_button.get_attribute("aria-expanded") != "true":
                            errors.append("model expanded state not announced")
                        model.locator("[data-v7-close]").click(timeout=6000)
                        if not model.is_hidden() or open_button.get_attribute("aria-expanded") != "false":
                            errors.append("model cannot return to editorial homepage")
                    except Exception as ex:
                        errors.append("model interaction failed: " + str(ex)[:170])

                if width in (390,1440) and engine == "chromium":
                    page.screenshot(path=str(OUT / f"{name}-{width}.png"),
                                    animations="disabled", timeout=20000)
                records.append({
                    "brand":name, "engine":engine, "width":width,
                    "metrics":m, "errors":errors,
                })
                if errors:
                    print("ISSUE",name,engine,width,errors,flush=True)
            finally:
                page.close()
    return records


def audit_wrappers(browser, base):
    errors=[]
    for name in SITES:
        page=browser.new_page(viewport={"width":390,"height":860},
                              reduced_motion="reduce")
        try:
            page.goto(f"{base}/case-site-{name}.html",wait_until="domcontentloaded")
            iframe=page.locator("iframe.site-demo-frame")
            iframe.wait_for(state="attached",timeout=12000)
            frame=page.frame_locator("iframe.site-demo-frame")
            frame.locator("[data-v7-hero]").wait_for(state="visible",timeout=15000)
            if iframe.get_attribute("src") != f"./showcase/{name}.html":
                errors.append(f"{name}: frame source incorrect")
            link=page.locator(".site-demo-devicebar__open")
            if link.count()!=1 or link.get_attribute("href")!=iframe.get_attribute("src"):
                errors.append(f"{name}: full-screen link incorrect")
            page.locator('[data-site-width="desktop"]').click()
            if iframe.get_attribute("data-device")!="desktop":
                errors.append(f"{name}: desktop switch broken")
            page.locator('[data-site-width="phone"]').click()
            if iframe.get_attribute("data-device")!="phone":
                errors.append(f"{name}: phone switch broken")
            page.locator("[data-site-reset]").click()
            if iframe.get_attribute("src")!=f"./showcase/{name}.html":
                errors.append(f"{name}: reset broken")
        finally:
            page.close()
    page=browser.new_page(viewport={"width":390,"height":870})
    try:
        page.goto(base+"/cases.html",wait_until="domcontentloaded")
        for name in SITES:
            selector=f'.portfolio-card--site a[href="./showcase/{name}.html"]'
            if page.locator(selector).count()!=1:
                errors.append(f"{name}: catalog direct link missing")
    finally:
        page.close()
    return errors


def main():
    OUT.mkdir(parents=True,exist_ok=True)
    for name in SITES:
        if not (ROOT/"showcase"/(name+".html")).exists():
            raise SystemExit("Missing showcase "+name)
    server=http.server.ThreadingHTTPServer(("127.0.0.1",0),Quiet)
    threading.Thread(target=server.serve_forever,daemon=True).start()
    base=f"http://127.0.0.1:{server.server_port}"
    try:
        with sync_playwright() as pw:
            allrows=[]
            for engine in ("chromium","webkit"):
                browser=getattr(pw,engine).launch(headless=True)
                allrows+=audit_standalone(browser,base,engine)
                if engine=="chromium":
                    wrapper_errors=audit_wrappers(browser,base)
                browser.close()
        failed=[r for r in allrows if r["errors"]]
        report={
            "sites":len(SITES),"views":len(allrows),
            "errors":len(failed)+len(wrapper_errors),
            "failed":failed,"wrapper_errors":wrapper_errors,
            "records":allrows,
        }
        (OUT/"report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2),
                                       encoding="utf-8")
        print(json.dumps({k:v for k,v in report.items() if k!="records"},
                         ensure_ascii=False),flush=True)
        if report["errors"]:
            raise SystemExit(1)
    finally:
        server.shutdown()


if __name__=="__main__":
    main()
