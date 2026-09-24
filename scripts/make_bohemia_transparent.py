from PIL import Image
from pathlib import Path

src = Path(r"c:\Users\maria\Documents\Programacion\InvitacionMatrimonioFM\public\images\gallery\bohemia-banner.jpg")
dst = Path(r"c:\Users\maria\Documents\Programacion\InvitacionMatrimonioFM\public\images\gallery\bohemia-banner.png")

img = Image.open(src).convert("RGBA")
pixels = img.load()
w, h = img.size

for y in range(h):
    for x in range(w):
        r, g, b, a = pixels[x, y]
        mx = max(r, g, b)
        if mx < 18:
            pixels[x, y] = (r, g, b, 0)
        elif mx < 48:
            alpha = int(255 * (mx - 18) / 30)
            pixels[x, y] = (r, g, b, alpha)

img.save(dst, "PNG")
print("saved", dst, dst.stat().st_size, img.size)
