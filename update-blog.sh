#!/usr/bin/env bash
# update-blog.sh — Rebuild blog-manifest.json by scanning blog/*.html meta tags.
# Run after adding a new post (or editing metadata), then commit & push.
#
# Each post file must include these <meta> tags in <head>:
#   <title>Post Title | Channel Outfitters Journal</title>
#   <meta name="description" content="...">              (used as excerpt fallback)
#   <meta name="excerpt"    content="...">               (optional)
#   <meta name="date"       content="YYYY-MM-DD">
#   <meta name="featured-image" content="../images/blog/foo.jpg">   (optional)
#   <meta name="category"   content="fishing">                      (optional)

set -euo pipefail
cd "$(dirname "$0")"

python3 - <<'PYEOF'
import os, re, json, glob
from datetime import datetime

def extract_meta(html, name):
    # Match <meta name="X" content="Y"> or <meta content="Y" name="X">
    # Use backreferences so apostrophes inside content don't break the match.
    patterns = [
        rf'<meta\s+name=(["\']){re.escape(name)}\1\s+content=(["\'])(.*?)\2\s*/?>',
        rf'<meta\s+content=(["\'])(.*?)\1\s+name=(["\']){re.escape(name)}\3\s*/?>',
    ]
    for i, p in enumerate(patterns):
        m = re.search(p, html, re.IGNORECASE | re.DOTALL)
        if m:
            # Group index of the content value depends on the pattern
            return (m.group(3) if i == 0 else m.group(2)).strip()
    return ""

def extract_title(html):
    m = re.search(r'<title>([^<]+)</title>', html, re.IGNORECASE)
    if not m:
        return ""
    t = m.group(1).strip()
    t = re.split(r'\s*\|\s*Channel Outfitters', t, maxsplit=1)[0]
    return t.strip()

def format_date_display(d):
    if not d:
        return ""
    try:
        dt = datetime.strptime(d, "%Y-%m-%d")
        return dt.strftime("%B %-d, %Y")
    except ValueError:
        return d

def normalize_image(path):
    if path.startswith("../"):
        return path[3:]
    return path

posts = []
for path in sorted(glob.glob("blog/*.html")):
    base = os.path.basename(path)
    if base.startswith("_") or base.startswith("."):
        continue
    slug = os.path.splitext(base)[0]
    with open(path, "r", encoding="utf-8") as f:
        html = f.read()

    title = extract_title(html)
    date = extract_meta(html, "date")
    excerpt = extract_meta(html, "excerpt") or extract_meta(html, "description")
    image = normalize_image(extract_meta(html, "featured-image"))
    category = extract_meta(html, "category")

    posts.append({
        "slug": slug,
        "title": title,
        "date": date,
        "dateDisplay": format_date_display(date),
        "excerpt": excerpt,
        "image": image,
        "category": category,
    })

posts.sort(key=lambda p: p.get("date", ""), reverse=True)

manifest = {"posts": posts}
with open("blog-manifest.json", "w", encoding="utf-8") as f:
    json.dump(manifest, f, indent=2, ensure_ascii=False)
    f.write("\n")

print(f"blog-manifest.json updated: {len(posts)} posts")
for p in posts:
    print(f"  - {p['slug']}.html  [{p['date'] or 'NO DATE'}]  {p['title']}")
# ---- SEO: BlogPosting schema on every post, Service schema on service pages, sitemap ----
import html as _html
SITE = "https://www.channeloutfitters.com"
BIZ = {"@id": SITE + "/#business"}

def set_ldjson(page_html, key, data):
    block = f'<script type="application/ld+json" data-seo="{key}">' + json.dumps(data, ensure_ascii=False) + '</script>'
    pat = re.compile(r'<script type="application/ld\+json" data-seo="' + re.escape(key) + r'">.*?</script>', re.S)
    if pat.search(page_html):
        return pat.sub(lambda m: block, page_html)
    return page_html.replace("</head>", "  " + block + "\n</head>", 1)

for p in posts:
    path = f"blog/{p['slug']}.html"
    page = open(path, encoding="utf-8").read()
    data = {"@context": "https://schema.org", "@type": "BlogPosting",
            "headline": _html.unescape(p["title"]),
            "url": f"{SITE}/blog/{p['slug']}.html",
            "mainEntityOfPage": f"{SITE}/blog/{p['slug']}.html",
            "author": {"@type": "Organization", "name": "Channel Outfitters"},
            "publisher": BIZ}
    if p["date"]: data["datePublished"] = p["date"]
    if p["excerpt"]: data["description"] = _html.unescape(p["excerpt"])
    if p["image"]: data["image"] = f"{SITE}/{p['image']}"
    new = set_ldjson(page, "post", data)
    if new != page:
        open(path, "w", encoding="utf-8").write(new)

SERVICES = {"guided-trips.html": "Guided fly fishing trips", "hunting.html": "Guided big-game hunts", "lodging.html": "Lodging"}
for fname, stype in SERVICES.items():
    if not os.path.exists(fname):
        continue
    page = open(fname, encoding="utf-8").read()
    m = re.search(r'<meta name="description" content="([^"]*)"', page)
    data = {"@context": "https://schema.org", "@type": "Service", "serviceType": stype,
            "name": _html.unescape(extract_title(page)) or stype,
            "url": f"{SITE}/{fname}", "provider": BIZ,
            "areaServed": {"@type": "State", "name": "Montana"}}
    if m: data["description"] = _html.unescape(m.group(1))
    new = set_ldjson(page, "service", data)
    if new != page:
        open(fname, "w", encoding="utf-8").write(new)

PAGES = [("", "1.0"), ("guided-trips.html", "0.8"), ("hunting.html", "0.8"), ("lodging.html", "0.7"),
         ("about.html", "0.7"), ("gallery.html", "0.6"), ("blog.html", "0.7"), ("contact.html", "0.6")]
today = datetime.now().strftime("%Y-%m-%d")
urls = [(f"{SITE}/{u}", today, pr) for u, pr in PAGES if u == "" or os.path.exists(u)]
urls += [(f"{SITE}/blog/{p['slug']}.html", p["date"] or today, "0.6") for p in posts]
with open("sitemap.xml", "w", encoding="utf-8") as f:
    f.write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
    for loc, lm, pr in urls:
        f.write(f"  <url>\n    <loc>{loc}</loc>\n    <lastmod>{lm}</lastmod>\n    <priority>{pr}</priority>\n  </url>\n")
    f.write("</urlset>\n")
print(f"sitemap.xml: {len(urls)} URLs · schema on {len(posts)} posts + service pages")
PYEOF
