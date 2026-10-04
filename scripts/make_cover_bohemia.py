from PIL import Image
from pathlib import Path

src = Path(
    r"C:\Users\maria\.cursor\projects\c-Users-maria-Documents-Programacion-InvitacionMatrimonioFM\assets\c__Users_maria_AppData_Roaming_Cursor_User_workspaceStorage_2175394169e5c623b963b25766d33110_images_Bohemia-c7fc3b8c-0db1-4b0a-bbd8-5d04151216a9.jpg"
)
dst = Path(r"c:\Users\maria\Documents\Programacion\InvitacionMatrimonioFM\public\images\cover-bohemia.png")

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
