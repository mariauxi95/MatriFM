import cv2
import numpy as np
from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter

ASSETS = Path(
    r"C:\Users\maria\.cursor\projects\c-Users-maria-Documents-Programacion-InvitacionMatrimonioFM\assets"
)
DEST = Path("public/images/gallery/cita.jpg")


def load() -> np.ndarray:
    src = next(p for p in ASSETS.iterdir() if "Cita1" in p.name)
    rgb = np.array(Image.open(rf"\\?\{src}").convert("RGB"))
    return cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)


def cover_people(img: np.ndarray) -> np.ndarray:
    original = img.copy()
    height, width = img.shape[:2]
    red = original[:, :, 2].astype(np.int16)
    green = original[:, :, 1].astype(np.int16)
    blue = original[:, :, 0].astype(np.int16)
    jacket = (red > 165) & (green < 80) & (blue < 70) & (red > green + 80)
    work = original.copy()
    work[jacket] = original[180, 180]
    mask_u8 = np.zeros((height, width), np.uint8)
    for cx, cy, rx, ry in ((348, 318, 44, 76), (418, 310, 50, 82), (512, 316, 54, 90)):
        cv2.ellipse(mask_u8, (cx, cy), (rx, ry), 0, 0, 360, 255, -1)
    jacket_u8 = jacket.astype(np.uint8)
    count, labels = cv2.connectedComponents(jacket_u8)
    if count > 1:
        sizes = [(labels == i).sum() for i in range(1, count)]
        jacket_u8 = (labels == (1 + int(np.argmax(sizes)))).astype(np.uint8)
    halo = cv2.dilate(jacket_u8, np.ones((5, 5), np.uint8), iterations=2)
    mask_u8[halo > 0] = 0
    return cv2.inpaint(work, mask_u8, 5, cv2.INPAINT_TELEA)


def debug_grid() -> None:
    image = load()
    view = image[180:520].copy()
    for x in range(0, view.shape[1], 40):
        cv2.line(view, (x, 0), (x, view.shape[0]), (0, 255, 255), 1)
        cv2.putText(view, str(x), (x + 2, 16), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (0, 255, 255), 1)
    for y in range(180, 520, 40):
        cv2.line(view, (0, y - 180), (view.shape[1], y - 180), (0, 255, 255), 1)
        cv2.putText(view, str(y), (4, y - 180 + 14), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (0, 255, 255), 1)
    big = cv2.resize(view, (view.shape[1] * 2, view.shape[0] * 2), interpolation=cv2.INTER_NEAREST)
    cv2.imwrite("public/images/gallery/_grid.jpg", big, [int(cv2.IMWRITE_JPEG_QUALITY), 90])


def main() -> None:
    src = load()
    cv2.imwrite("public/images/gallery/_donor.jpg", cv2.resize(src[70:240, 120:340], None, fx=2, fy=2, interpolation=cv2.INTER_NEAREST), [int(cv2.IMWRITE_JPEG_QUALITY), 90])
    debug_grid()
    image = load()
    height, width = image.shape[:2]
    original = image.copy()
    image = cover_people(image)
    diff = np.abs(original.astype(np.int16) - image.astype(np.int16)).sum(axis=2)
    marked = original.copy()
    box = np.zeros(original.shape[:2], np.uint8)
    cv2.rectangle(box, (312, 228), (582, 398), 255, -1)
    marked[box > 0] = (0, 255, 0)
    cv2.imwrite("public/images/gallery/_mask.jpg", marked[180:460], [int(cv2.IMWRITE_JPEG_QUALITY), 85])
    rows = np.where((diff > 12).any(axis=1))[0]
    cols = np.where((diff > 12).any(axis=0))[0]
    print("changed", int((diff > 12).sum()), "y", int(rows[0]), int(rows[-1]), "x", int(cols[0]), int(cols[-1]))
    for name, sl in {
        "curly": (slice(250, 370), slice(300, 385)),
        "glasses": (slice(240, 360), slice(360, 460)),
        "long": (slice(230, 400), slice(450, 575)),
    }.items():
        gray_o = cv2.cvtColor(original[sl], cv2.COLOR_BGR2GRAY)
        gray_e = cv2.cvtColor(image[sl], cv2.COLOR_BGR2GRAY)
        print(
            name,
            "mean",
            np.round(original[sl].mean(axis=(0, 1)), 1).tolist(),
            "->",
            np.round(image[sl].mean(axis=(0, 1)), 1).tolist(),
        )

    def skin_frac(src: np.ndarray, ys: slice, xs: slice) -> float:
        b = src[ys, xs, 0].astype(np.int16)
        g = src[ys, xs, 1].astype(np.int16)
        r = src[ys, xs, 2].astype(np.int16)
        skin = (r > 90) & (g > 40) & (b > 20) & (r > g) & (r > b) & ((np.maximum(np.maximum(r, g), b) - np.minimum(np.minimum(r, g), b)) > 12)
        return float(skin.mean())

    for name, sl in {
        "glasses": (slice(248, 330), slice(370, 455)),
        "long": (slice(245, 340), slice(455, 555)),
        "curly": (slice(255, 340), slice(305, 375)),
    }.items():
        print("skin", name, round(skin_frac(original, *sl), 3), "->", round(skin_frac(image, *sl), 3))
    cv2.imwrite(
        "public/images/gallery/_zoom.jpg",
        cv2.resize(image[220:430, 240:604], None, fx=2, fy=2, interpolation=cv2.INTER_NEAREST),
        [int(cv2.IMWRITE_JPEG_QUALITY), 90],
    )

    rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    photo = Image.fromarray(rgb)
    aspect = 350 / 180
    left, top = 28, 96
    crop_w = width - left
    crop_h = round(crop_w / aspect)
    crop = photo.crop((left, top, left + crop_w, top + crop_h))
    scaled = crop.resize((1500, round(1500 * crop.height / crop.width)), Image.Resampling.LANCZOS)
    sharp = scaled.filter(ImageFilter.UnsharpMask(radius=1.05, percent=110, threshold=2))
    sharp = ImageEnhance.Contrast(sharp).enhance(1.03)
    preview = Path("public/images/gallery/_cita_try.jpg")
    sharp.save(preview, quality=90)
    print(preview.name, sharp.size)


if __name__ == "__main__":
    main()
