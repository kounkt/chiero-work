"""Read-only checks for the current advisory site and quote-based pricing.

The retired fixed-price and brand-rule checks remain in Git history and the
release backup. This verifies public content and routing, not legal compliance
or real payment settlement. Run from any directory: python3 tools/gate.py.
"""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
import json,re,sys
ROOT=Path(__file__).resolve().parent.parent
OLD_FEE=re.compile(r'1[,，]?100[,，]?000|2[,，]?200[,，]?000|1[,，]?050[,，]?000|(?:110|220|105)万|366[,，]?667|733[,，]?333')
OLD_PAYMENT=['https://univa.cc/K9JH3K','https://univa.cc/z8WmPn']
class Page(HTMLParser):
 def __init__(self,s):
  super().__init__();self.tags=[];self.feed(s)
 def handle_starttag(self,t,a):self.tags.append((t,dict(a)))
 def attrs(self,t):return [a for k,a in self.tags if k==t]
 def ids(self):return [a['id'] for _,a in self.tags if a.get('id')]
 def meta(self,n):return next((a.get('content','') for a in self.attrs('meta') if a.get('name',a.get('property'))==n),'')
def verify():
 errors=[];checks=0
 def check(ok,label):
  nonlocal checks;checks+=1
  if not ok:errors.append(label)
 for f in ROOT.rglob('*'):
  if '.git' in f.parts or 'tools' in f.parts or f.suffix not in ('.html','.txt','.json','.js','.xml','.md'):continue
  s=f.read_text();rel=str(f.relative_to(ROOT))
  check(not OLD_FEE.search(unquote(unquote(s))),rel+' retired continuation fees absent')
  check(not any(x in s for x in OLD_PAYMENT),rel+' retired generic continuation checkout absent')
  if f.suffix!='.html' or f.name!='index.html':continue
  p=Page(s)
  check(len(p.attrs('h1'))==1 and len(p.ids())==len(set(p.ids())),rel+' one H1 / unique IDs')
  check(not re.search(r'@[A-Z_:]+@|CONTACT_EMAIL|UNIVAPAY_LINK_',s),rel+' no unresolved template placeholders')
  if 'workbook/thanks' not in rel:
   check('https://work.chiero.jp/'+rel.removesuffix('index.html') in s,rel+' canonical host')
  for tag,a in p.tags:
   ref=a.get('href') if tag in ('a','link') else a.get('src') if tag in ('script','img') else None
   if not ref:continue
   u=urlsplit(ref)
   if u.scheme not in ('','https','http') or (u.netloc and u.netloc!='work.chiero.jp'):continue
   target=(ROOT/unquote(u.path.lstrip('/'))) if u.path.startswith('/') or u.netloc else f.parent/unquote(u.path)
   if not u.path:target=f
   elif target.is_dir():target=target/'index.html'
   check(target.is_file(),rel+' link '+ref)
   if u.fragment and target.suffix=='.html' and target.is_file():check(unquote(u.fragment) in Page(target.read_text()).ids(),rel+' anchor '+ref)
  for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>',s,re.S):
   try: json.loads(block)
   except ValueError:errors.append(rel+' invalid JSON-LD')
  check(s.count('static.cloudflareinsights.com/beacon.min.js')==1,rel+' one analytics beacon')
  check('AggregateRating' not in s,rel+' no invented aggregate rating')
 for rel in ['index.html','apply/index.html','advisory/index.html','tokushoho/index.html','ai-prompt.txt','assets/renewal/work-prompt.txt','llms.txt']:
  s=(ROOT/rel).read_text()
  check('個別見積もり' in s,rel+' quote-based continuation')
  check('50,000' in s or '5万円' in s,rel+' initial fee retained')
  check('充当' in s,rel+' initial-fee credit retained')
 for rel in ['index.html','advisory/index.html','tokushoho/index.html','ai-prompt.txt','llms.txt']:
  s=(ROOT/rel).read_text();check('税込総額' in s and any(t in s for t in ('事前','契約前','期間の終了前')),rel+' total before agreement')
  check('自動更新・自動課金' in s,rel+' explicit no automatic renewal/charge')
 s=(ROOT/'index.html').read_text();p=Page(s)
 check('quote' in p.ids() and '初回相談のお申し込み・お支払いは不要' in s,'quote inquiry available before paid consultation')
 check('https://lin.ee/YCCoRsBu' in s and 'mailto:work@chiero.jp' in s,'working quote contact destinations')
 check('https://apply.chiero.jp/p/UIA2tAAbI1rW' in s,'current initial booking path unchanged')
 s=(ROOT/'apply/index.html').read_text();check('https://univa.cc/4L4YkZ' in s,'legacy initial-only checkout retained')
 s=(ROOT/'advisory/index.html').read_text();check('univa.cc' not in s,'advisory requires an individual invoice')
 tk=(ROOT/'tokushoho/index.html').read_text()
 for item in ['販売事業者','代表者','所在地','電話番号','work@chiero.jp','販売価格','お支払方法','お支払時期','役務の提供時期','キャンセル','必要料金']:
  check(item in tk,'commercial disclosure '+item)
 check('遅滞なく' in tk and '電子メール' in tk,'quote terms request before commitment')
 check('未実施分を返金' in tk and '24時間前' in tk,'existing cancellation conditions retained')
 check((ROOT/'ai-prompt.txt').read_bytes()==(ROOT/'assets/renewal/work-prompt.txt').read_bytes(),'copied and downloadable AI summary agree')
 schema=json.loads(re.search(r'<script type="application/ld\+json">(.*?)</script>',(ROOT/'index.html').read_text(),re.S)[1])
 offers=[n['offers'] for n in schema['@graph'] if 'offers' in n]
 check(len(offers)==1 and offers[0]['price']=='50000' and offers[0]['priceCurrency']=='JPY' and '初回' in offers[0]['name'],'structured offer only for fixed-price initial consultation')
 print(f'{checks} checks; {len(errors)} failures')
 for e in errors:print('FAIL:',e)
 return bool(errors)
if __name__=='__main__':sys.exit(verify())
