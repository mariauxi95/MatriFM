import re
import urllib.request

headers = {"User-Agent": "Mozilla/5.0"}
urls = {
    "gaelia": "https://gaeliabeach.com/",
    "blue": "https://bluemangocolombia.com/",
    "iwana": "https://casaiwana.com/",
    "masaya": "https://www.masaya-experience.com/",
    "cayena": "https://www.masaya-experience.com/en/collection/tayrona/",
    "booking_bm": "https://www.booking.com/hotel/co/blue-mango-beach.html",
    "booking_masaya": "https://www.booking.com/hotel/co/la-brisa-tranquila.html",
    "booking_gaelia": "https://www.booking.com/hotel/co/gaelia.html",
    "booking_cayena": "https://www.booking.com/hotel/co/cayena-by-masaya-collection.html",
    "booking_iwana": "https://www.booking.com/hotel/co/casa-iwana-tayrona-suites-deluxe-playa-y-ac.html",
}

for key, url in urls.items():
    try:
        req = urllib.request.Request(url, headers=headers)
        html = urllib.request.urlopen(req, timeout=25).read().decode("utf-8", "ignore")
        match = re.search(r'property=["\']og:image["\'][^>]*content=["\']([^"\']+)["\']', html)
        if not match:
            match = re.search(r'content=["\']([^"\']+)["\'][^>]*property=["\']og:image["\']', html)
        print(key, "=>", (match.group(1)[:180] if match else "NO OG"), "| status ok")
        # also check title for booking pages
        title = re.search(r"<title>([^<]+)</title>", html, re.I)
        if title:
            print("   title:", title.group(1)[:100])
    except Exception as exc:
        print(key, "ERR", exc)
