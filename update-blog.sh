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
PYEOF
