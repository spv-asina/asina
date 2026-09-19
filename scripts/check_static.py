"""Check HTML entry points, links, metadata and content preservation. Stdlib only."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import json

ROOT = Path(__file__).resolve().parents[1]
class Page(HTMLParser):
    def __init__(self):
        super().__init__(); self.links=[]; self.ids=[]; self.h1=0; self.main=0; self.lang=None
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if a.get('id'): self.ids.append(a['id'])
        if tag=='h1': self.h1+=1
        if tag=='main': self.main+=1
        if tag=='html': self.lang=a.get('lang')
        if tag=='a' and 'href' in a: self.links.append(a['href'])
        if tag in ('link','script','img'):
            link=a.get('src') or a.get('href')
            if link: self.links.append(link)

pages={}; errors=[]; checked=0
for file in ROOT.glob('*.html'):
    p=Page(); p.feed(file.read_text()); pages[file.name]=p
    if p.h1!=1: errors.append(f'{file.name}: {p.h1} h1 elements')
    if p.main!=1: errors.append(f'{file.name}: {p.main} main elements')
    if p.lang!='ru': errors.append(f'{file.name}: incorrect lang')
    if len(p.ids)!=len(set(p.ids)): errors.append(f'{file.name}: duplicate IDs')
for name,p in pages.items():
    for link in p.links:
        url=urlsplit(link)
        if url.scheme or url.netloc: continue
        target=unquote(url.path).removeprefix('/asina/').removeprefix('./') or name
        checked+=1
        if not (ROOT/target).exists(): errors.append(f'{name}: missing {link}')
        elif url.fragment and target in pages and url.fragment not in pages[target].ids: errors.append(f'{name}: missing anchor {link}')
source=json.loads((ROOT/'content.json').read_text())
if set(source)!=set(pages): errors.append('Original entry-point inventory changed')
report={'pages':len(pages),'cases':sum(p.startswith('case-') for p in pages),'local_links_checked':checked,'errors':errors}
print(json.dumps(report,ensure_ascii=False,indent=2))
raise SystemExit(bool(errors))
