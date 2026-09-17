import re
import urllib.request

headers = {"User-Agent": "Mozilla/5.0"}

def get(url: str) -> str:
    req = urllib.request.Request(url, headers=headers)
    return urllib.request.urlopen(req, timeout=25).read().decode("utf-8", "ignore")

# Find large jpg/webp on hotel sites
pages = {
    "gaelia": "https://gaeliabeach.com/",
    "iwana": "https://casaiwana.com/",
    "iwana2": "https://casaiwana.com/casa-iwana/",
    "blue": "https://bluemangocolombia.com/",
}

for key, url in pages.items():
    try:
        html = get(url)
        imgs = re.findall(r"https?://[^\"'\s>]+\.(?:jpg|jpeg|webp|png)", html, re.I)
        # unique preserve order
        seen = []
        for img in imgs:
            if img not in seen and "logo" not in img.lower() and "icon" not in img.lower():
                seen.append(img)
        print("\n", key, "count", len(seen))
        for img in seen[:8]:
            print(" ", img[:160])
    except Exception as exc:
        print(key, "ERR", exc)

# Booking page titles / redirects
for slug in [
    "blue-mango-beach",
    "gaelia",
    "la-brisa-tranquila",
    "cayena-by-masaya-collection",
    "casa-iwana-tayrona-suites-deluxe-playa-y-ac",
    "casa-iwana",
]:
    url = f"https://www.booking.com/hotel/co/{slug}.html"
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=20) as resp:
            final = resp.geturl()
            html = resp.read().decode("utf-8", "ignore")
            title = re.search(r"<title>([^<]+)</title>", html, re.I)
            print("\nBOOK", slug, "->", final[:80], "|", (title.group(1)[:80] if title else "?"))
    except Exception as exc:
        print("\nBOOK", slug, "ERR", exc)
