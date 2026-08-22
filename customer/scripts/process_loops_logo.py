from PIL import Image
from pathlib import Path

src = Path(r"C:\Users\habib\.cursor\projects\c-Users-habib-Downloads-RestaurantApp\assets\c__Users_habib_AppData_Roaming_Cursor_User_workspaceStorage_e586425a37921ce6c5a8f331cb3f87f9_images_image-330d83a3-7f6d-421a-a6a2-4451c2e133d0.png")
out_dir = Path(r"c:\Users\habib\Downloads\RestaurantApp\Restaurant-frontend-repo\customer\src\assets\brand")
out_dir.mkdir(parents=True, exist_ok=True)

img = Image.open(src).convert("RGBA")
pixels = img.load()
w, h = img.size

# Sample background from corners
samples = [
    pixels[2, 2],
    pixels[w - 3, 2],
    pixels[2, h - 3],
    pixels[w - 3, h - 3],
    pixels[w // 2, 2],
    pixels[2, h // 2],
]
br = sum(s[0] for s in samples) / len(samples)
bg = sum(s[1] for s in samples) / len(samples)
bb = sum(s[2] for s in samples) / len(samples)
print("bg sample", br, bg, bb)

dark = Image.new("RGBA", (w, h), (0, 0, 0, 0))
light = Image.new("RGBA", (w, h), (0, 0, 0, 0))
dp = dark.load()
lp = light.load()

for y in range(h):
    for x in range(w):
        r, g, b, a = pixels[x, y]
        if a < 8:
            continue
        # distance from background color
        dist = ((r - br) ** 2 + (g - bg) ** 2 + (b - bb) ** 2) ** 0.5
        lum = (r + g + b) / 3.0
        chroma = max(r, g, b) - min(r, g, b)

        # treat near-background as transparent (generous threshold)
        if dist < 55 and lum < 90:
            continue
        if lum < 55 and chroma < 50:
            continue

        # letterforms: bright, low chroma
        if lum > 160 and chroma < 55:
            dp[x, y] = (255, 255, 255, 255)
            lp[x, y] = (12, 12, 14, 255)
            continue

        # soft-edge: fade pixels that are close to bg
        alpha = a
        if dist < 85 and chroma < 60:
            alpha = max(0, min(255, int(a * (dist - 40) / 45)))
            if alpha < 12:
                continue

        dp[x, y] = (r, g, b, alpha)
        lp[x, y] = (r, g, b, alpha)


def trim(im, pad=4):
    bbox = im.getbbox()
    if not bbox:
        return im
    l, t, r, b = bbox
    l = max(0, l - pad)
    t = max(0, t - pad)
    r = min(im.width, r + pad)
    b = min(im.height, b + pad)
    return im.crop((l, t, r, b))


dark = trim(dark)
light = trim(light)

# Downscale for web
max_w = 640
if dark.width > max_w:
    ratio = max_w / dark.width
    size = (max_w, max(1, int(dark.height * ratio)))
    dark = dark.resize(size, Image.Resampling.LANCZOS)
    light = light.resize(size, Image.Resampling.LANCZOS)

dark.save(out_dir / "loops-logo-dark.png", optimize=True)
light.save(out_dir / "loops-logo-light.png", optimize=True)
print("saved", dark.size, light.size)
