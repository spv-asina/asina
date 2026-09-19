"""One-time content migration from the repository's original HTML; no network."""
from pathlib import Path
import json
import subprocess
import sys
from lxml import html

ROOT = Path(__file__).resolve().parents[1]
if len(sys.argv) != 2:
    raise SystemExit('Usage: python scripts/extract.py ORIGINAL_GIT_REF')
REF = sys.argv[1]
def original(name):
    return subprocess.check_output(['git', 'show', f'{REF}:{name}'], cwd=ROOT).decode()
def text(node):
    return ' '.join(' '.join(node.itertext()).split())
catalog = html.fromstring(original('cases.html'))
cards = {}
for a in catalog.xpath('//main//a[.//h3]'):
    path = a.get('href', '').removeprefix('./')
    if not path.startswith('case-'):
        continue
    tags = a.xpath('.//*[contains(concat(" ",normalize-space(@class)," ")," tag ")]')
    cards[path] = {'title': text(a.xpath('.//h3')[0]), 'description': text(a.xpath('.//p')[0]), 'category': text(tags[0]) if tags else 'Проекты'}
pages = {}
for file in sorted(ROOT.glob('*.html')):
    tree = html.fromstring(original(file.name))
    heading = tree.xpath('//main//h1')
    leads = tree.xpath('//main//*[contains(concat(" ",normalize-space(@class)," ")," lead ")]')
    sections = []
    for section in tree.xpath('//main/section'):
        hs = section.xpath('.//h2')
        if not hs or 'demo' in section.get('class', '') or 'Ещё в этом' in text(hs[0]):
            continue
        paragraphs = [text(p) for p in section.xpath('.//p | .//li | .//*[contains(concat(" ",normalize-space(@class)," ")," note ")]') if text(p)]
        for class_name in ['feature-card', 'arch-node', 'test-row']:
            paragraphs += [text(p) for p in section.xpath(f'.//*[contains(concat(" ",normalize-space(@class)," ")," {class_name} ")]') if text(p)]
        paragraphs = list(dict.fromkeys(paragraphs))
        sections.append({'title': text(hs[0]), 'paragraphs': paragraphs})
    pages[file.name] = {'title': text(heading[0]) if heading else 'Страница не найдена', 'description': text(leads[0]) if leads else '', 'sections': sections, **cards.get(file.name, {})}
    if file.name.startswith('case-site-'):
        dest = ROOT / 'demos' / file.name
        dest.parent.mkdir(exist_ok=True)
        # Keep the original interactive project demonstration intact and its relative links valid.
        dest.write_text(original(file.name).replace('<head>', '<head>\n<base href="../">', 1))
(ROOT / 'content.json').write_text(json.dumps(pages, ensure_ascii=False, indent=2))
print(f'Extracted {len(pages)} pages, {len(cards)} cases; preserved original website demos.')
