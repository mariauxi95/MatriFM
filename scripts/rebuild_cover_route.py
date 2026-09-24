"""Clean stub above start-heart; rebuild mapa-cover.png."""
from pathlib import Path

from PIL import Image, ImageFilter

root = Path(__file__).resolve().parents[1] / "public" / "images"
src = root / "mapa-v2-route-backup.png"
if not src.exists():
    src = root / "mapa-v2.png"

bak = Image.open(src).convert("RGBA")
bp = bak.load()
w, h = bak.size

# Dilated route mask from gold
mask = Image.new("L", (w, h), 0)
mp = mask.load()
for y in range(h):
    for x in range(w):
        r, g, b, a = bp[x, y]
        if a > 160 and r > 145 and g > 75 and b < 165 and (r - b) > 25 and r >= g - 15 and g <= r + 25:
            mp[x, y] = 255
for _ in range(5):
    mask = mask.filter(ImageFilter.MaxFilter(5))
mp = mask.load()

cream = (239, 230, 212, 255)
out = bak.copy()
op = out.load()

# Heart body keep zone (exclude stub above cleft ~y<463)
hx0, hy0, hx1, hy1 = 255, 463, 310, 505

for y in range(h):
    for x in range(w):
        if mp[x, y] < 128:
            continue
        if hx0 <= x <= hx1 and hy0 <= y <= hy1:
            continue
        r, g, b, a = op[x, y]
        if g > r + 15 and 50 < g < 180 and b < 140:
            continue
        op[x, y] = cream

# Extra pass: erase any gold stub just above the heart cleft
for y in range(440, 464):
    for x in range(270, 300):
        r, g, b, a = op[x, y]
        if r > 150 and g > 80 and b < 170 and (r - b) > 20 and r >= g - 15:
            op[x, y] = cream
        # pale antialias of stub
        elif r > 200 and g > 175 and b < 200 and (r - b) > 15 and abs(r - g) < 40:
            if abs(r - 239) + abs(g - 230) + abs(b - 212) > 12:
                op[x, y] = cream

dest = root / "mapa-cover.png"
out.save(dest)
print("wrote", dest)

dist = Path(__file__).resolve().parents[1] / "dist" / "images"
if dist.exists():
    out.save(dist / "mapa-cover.png")
    print("synced dist")
