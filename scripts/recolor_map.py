from PIL import Image, ImageFilter, ImageChops

src_path = r"c:\Users\maria\Documents\Programacion\InvitacionMatrimonioFM\public\images\mapa.png"
bak_path = r"c:\Users\maria\Documents\Programacion\InvitacionMatrimonioFM\public\images\mapa-gold-backup.png"

src = Image.open(src_path).convert("RGBA")
w, h = src.size
pixels = src.load()

gold = Image.new("L", (w, h), 0)
white = Image.new("L", (w, h), 0)
gp = gold.load()
wp = white.load()

for y in range(h):
    for x in range(w):
        r, g, b, a = pixels[x, y]
        if a < 20:
            continue
        if r < 25 and g < 25 and b < 25:
            continue
        if r > 200 and g > 200 and b > 200:
            wp[x, y] = 255
            continue
        gp[x, y] = 255

# Thick regions (continents): shrink thin strokes away, then grow back
thick = gold
for _ in range(3):
    thick = thick.filter(ImageFilter.MinFilter(3))
for _ in range(3):
    thick = thick.filter(ImageFilter.MaxFilter(3))

thick = ImageChops.multiply(thick, gold)
thin = ImageChops.subtract(gold, thick)
thick = thick.filter(ImageFilter.MaxFilter(3))
thick = ImageChops.multiply(thick, gold)

out = Image.new("RGBA", (w, h), (0, 0, 0, 255))
op = out.load()
tp = thick.load()
thin_px = thin.load()
wh = white.load()

MINT = (152, 210, 185, 255)

try:
    Image.open(bak_path)
except OSError:
    src.save(bak_path)

for y in range(h):
    for x in range(w):
        if wh[x, y] > 128:
            op[x, y] = (255, 255, 255, 255)
        elif tp[x, y] > 128:
            op[x, y] = MINT
        elif thin_px[x, y] > 128:
            op[x, y] = pixels[x, y]

out.save(src_path)
print("saved", src_path)
