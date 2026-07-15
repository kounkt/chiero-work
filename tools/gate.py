"""work.chiero.jp を公開してよいか判定する。

このサイトは chiero.jp と違い「売る面」なので、通らせてはいけない条件が二種類ある。
  1. 法令 — 特商法の必須項目が埋まっていること。未記入のまま公開したのが旧WordPressの事故。
  2. 憲法 — Brand OS §2①の禁止語が入らないこと。旧LPは禁止語46回で不採用にした。
placeholder が1つでも残っていたら公開しない。
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
LP = (ROOT / "index.html").read_text(encoding="utf-8")
TK = (ROOT / "tokushoho/index.html").read_text(encoding="utf-8")
ng, ok, warn = [], [], []


def chk(cond, label, detail=""):
    """detail は落ちたときの説明。通ったときに出すと失敗に見えるので出さない。"""
    ok.append(label) if cond else ng.append(f"{label}{(' — ' + detail) if detail else ''}")


# ── 1. 未記入プレースホルダ（これが残る限り公開不可） ──────────────
PLACEHOLDERS = {
    "CONTACT_TEL": "特商法の電話番号（省略する場合も『請求があれば遅滞なく開示』の文言と実番号が要る）",
    "CONTACT_EMAIL": "問い合わせ先メール（申込ボタンの宛先も同じ）",
    "CANCEL_POLICY": "キャンセル・中途解約の条件（特商法11条の必須表示項目）",
}
for token, why in PLACEHOLDERS.items():
    hit = [n for n, s in (("index.html", LP), ("tokushoho/index.html", TK)) if token in s]
    chk(not hit, f"プレースホルダ {token} が解決済み", f"未記入: {', '.join(hit)} / {why}")

# 未記入テンプレの典型（旧WPのプライバシーが「制定日：xxxx年xx月xx日」だった）
for src, name in ((LP, "LP"), (TK, "特商法")):
    chk(not re.search(r"[xX]{3,}|〇〇|●●|TODO|FIXME|__", src), f"{name}に未記入テンプレの痕跡なし")

# ── 2. Brand OS §2① 禁止語 ────────────────────────────────
for w in ["コーチ", "コンサル", "講師", "メンター", "指導", "支援者"]:
    body = re.sub(r"<!--.*?-->", "", LP + TK, flags=re.S)
    chk(w not in body, f"禁止語「{w}」が無い")
# 「教える」は禁止語だが、「教えてほしい → お伝えしていません」の否定なら可。
# 否定語は同じ<li>/段落の後半に来るので、囲みブロック単位で見る（12文字窓では誤検知した）。
for block in re.findall(r"<(?:li|p|h3)[^>]*>.*?</(?:li|p|h3)>", LP, re.S):
    if "教え" in block and not re.search(r"(していません|しません|お伝えしていません|ません)", block):
        ng.append(f"「教える」が否定文以外で使われている — {re.sub(r'<[^>]+>', '', block).strip()}")

# ── 3. Brand OS §3/§4 売り込み面の指標 ──────────────────────
# 証言そのものは §4 で不可。ただし「載せていない」と宣言する否定文は可（むしろ証拠になる）。
# 「教える」と同じく、囲みブロック単位で否定を見る。
for block in re.findall(r"<(?:li|p|h2|h3|summary|div)[^>]*>.*?</(?:li|p|h2|h3|summary|div)>", LP, re.S):
    if re.search(r"お客様の声|ビフォー", block) and not re.search(r"(載っていない|載せていません|ありません|出しません)", block):
        ng.append(f"証言を載せている（§4） — {re.sub(r'<[^>]+>', '', block).strip()[:50]}")
ok.append("証言・ビフォーアフターを載せていない（§4）")
chk(not re.search(r"限定\s*\d|残り\s*\d|今だけ|先着", LP), "希少性の演出が無い（§4）")
chk(not re.search(r"必ず|絶対に|保証します", LP), "断定的判断の提供が無い（消費者契約法4条）")
chk("向いていないこと" in LP, "向いていない相手を明示している（売り込みの反対）")
chk("その場では契約しません" in LP, "初回の場で契約させない旨がある（勧誘リスクの遮断）")

# ── 4. 事実の正確さ（全公開物で横断チェック済みの2件） ──────────
for src, name in ((LP, "LP"), (TK, "特商法")):
    chk("王様のブランチ" not in src, f"『王様のブランチ』を書いていない（{name}）")
    chk("167冊" not in src, f"「167冊」を書いていない（{name}）")
chk("7290001091210" in LP, "法人番号（LP）")
chk("セルクル今泉404号室" in TK, "登記どおりの住所（特商法）")
chk("中田 光" in TK, "代表者名（特商法）")

# ── 5. 特商法11条の必須項目 ──────────────────────────────
REQUIRED = ["販売事業者", "代表者", "所在地", "電話番号", "販売価格",
            "お支払方法", "お支払時期", "役務の提供時期", "キャンセル", "必要料金"]
for item in REQUIRED:
    chk(item in TK, f"特商法の必須項目「{item}」")

# ── 6. 価格がLPと特商法で一致しているか ───────────────────────
def prices(s):
    return set(re.findall(r"(?:50,000|1,100,000)円", s))
chk(prices(LP) == prices(TK) == {"50,000円", "1,100,000円"},
    "価格がLPと特商法で一致", f"LP={sorted(prices(LP))} 特商法={sorted(prices(TK))}")
chk("税込" in LP and "税込" in TK, "総額表示（税込）が両方にある")
chk("充当" in LP and "充当" in TK, "5万円の充当がLPと特商法の両方に書いてある")

# ── 6b. 本人から受け取った3つの事実が、両ページで食い違わないか ──────
TEL, MAIL = "070-8336-0789", "chieropiero@gmail.com"
chk(TEL in TK, f"電話番号 {TEL} が特商法にある")
chk(MAIL in TK, f"メール {MAIL} が特商法にある")
chk(MAIL in LP, "申込ボタンの宛先が特商法のメールと同一", "LPのmailtoが特商法と違う")
# 「中途解約は返金なし」はLP(FAQ)と特商法で必ず一致させる。片方だけだと不実告知になる。
chk(re.search(r"中途解約.{0,40}返金.{0,10}(いたしません|ありません)", TK, re.S),
    "特商法に中途解約の返金なしが明記されている")
chk(re.search(r"途中でやめたら.{0,300}ありません", LP, re.S),
    "LPのFAQでも返金なしを明言している", "特商法にだけ書くのは不実告知に近い")

# ── 6c. ページが名乗るURLと、実際に配信されている場所が一致しているか ──
# CNAMEを置いた=work.chiero.jpで配信、置いていない=github.io配下。
# canonical/og:url がこれとズレると、共有リンクが死んだURLをプレビューする（実際にやった）。
LIVE = "https://work.chiero.jp/" if (ROOT / "CNAME").exists() else "https://kounkt.github.io/chiero-work/"
urls = re.findall(r'rel="canonical" href="([^"]+)"', LP + TK) + \
       re.findall(r'property="og:url" content="([^"]+)"', LP)
chk(urls and all(u.startswith(LIVE) for u in urls),
    f"canonical/og:url が配信場所（{LIVE}）と一致",
    f"CNAME{'あり' if (ROOT/'CNAME').exists() else 'なし'}なのに {[u for u in urls if not u.startswith(LIVE)]}")

# ── 7. 法定返品権の説明が正しいか ─────────────────────────
# 15条の3は「売買契約＝商品・特定権利」のみ。役務には適用されない。
if "15条の3" in TK or "法定返品権" in TK:
    chk("役務の提供であるため" in TK and "対象ではありません" in TK,
        "法定返品権が役務に適用されない旨を正しく書いている")

# ── 8. リンク切れ ───────────────────────────────────
for href in set(re.findall(r'href="(/[^"#]*)"', LP + TK)):
    p = ROOT / href.strip("/") / "index.html" if not href.endswith((".html", ".txt")) else ROOT / href.strip("/")
    chk(p.exists() or href == "/", f"内部リンク {href}", "リンク先が無い")

print("=" * 60)
print(f"✅ {len(ok)} 件")
for x in ok:
    print("   ", x)
if warn:
    print(f"\n⚠️  {len(warn)} 件")
    for x in warn:
        print("   ", x)
print(f"\n{'❌' if ng else '✅'} 未解決 {len(ng)} 件")
for x in ng:
    print("   ", x)
print("=" * 60)
print("\n🚫 公開不可" if ng else "\n🟢 公開してよい")
sys.exit(1 if ng else 0)
