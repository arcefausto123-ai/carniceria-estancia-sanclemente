#!/usr/bin/env python3
"""
Genera los íconos del sitio a partir del logo oficial.

    pip install pillow && python3 scripts/generate-icons.py

Entrada:  public/logo-original.png  (logo tal como lo entregó el cliente)
Salidas:  public/logo.png           recortado al contenido, para la interfaz
          src/app/favicon.ico       16/32/48 px
          src/app/icon.png          512 px
          src/app/apple-icon.png    180 px

Por qué el monograma: el logo es un lettering de tres líneas. A 16 px —el
tamaño real de una pestaña— queda ilegible, así que los tamaños chicos usan
una "E" con los dos puntos de la marca. El apple-icon sí lleva el lettering
completo, porque iOS lo muestra grande.

Y por qué la pastilla navy: el logo es blanco sobre transparente; sin fondo
oscuro desaparece en las pestañas con tema claro.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "public" / "logo-original.png"
NAVY = (15, 43, 76, 255)
WHITE = (253, 251, 247, 255)
SERIF = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"


def trimmed_mark() -> Image.Image:
    """El logo recortado a su contenido real, sin el margen del lienzo."""
    src = Image.open(SOURCE).convert("RGBA")
    return src.crop(src.getchannel("A").getbbox())


def plate(size: int, radius_ratio: float) -> Image.Image:
    """Pastilla navy con esquinas redondeadas, dibujada a 4x para suavizarlas."""
    big = size * 4
    layer = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    ImageDraw.Draw(layer).rounded_rectangle(
        [0, 0, big - 1, big - 1], radius=int(big * radius_ratio), fill=NAVY
    )
    return layer.resize((size, size), Image.LANCZOS)


def monogram(size: int, radius_ratio: float = 0.18, dots: bool = True) -> Image.Image:
    img = plate(size, radius_ratio)
    draw = ImageDraw.Draw(img)

    body = size
    while body > 8:
        font = ImageFont.truetype(SERIF, body)
        box = draw.textbbox((0, 0), "E", font=font)
        if box[2] - box[0] <= size * 0.42:
            break
        body -= 2

    font = ImageFont.truetype(SERIF, body)
    box = draw.textbbox((0, 0), "E", font=font)
    width, height = box[2] - box[0], box[3] - box[1]
    draw.text(
        ((size - width) / 2 - box[0], (size - height) / 2 - box[1]),
        "E", font=font, fill=WHITE,
    )

    if dots:
        r = max(1, round(size * 0.028))
        cy = size // 2
        for cx in (size * 0.17, size * 0.83):
            draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=WHITE)
    return img


def lockup(size: int, radius_ratio: float, margin: float) -> Image.Image:
    """Pastilla navy con el lettering completo centrado."""
    img = plate(size, radius_ratio)
    mark = trimmed_mark()
    width = int(size * (1 - margin * 2))
    height = max(1, round(width * mark.height / mark.width))
    resized = mark.resize((width, height), Image.LANCZOS)
    img.alpha_composite(resized, ((size - width) // 2, (size - height) // 2))
    return img


def main() -> None:
    mark = trimmed_mark()

    # Logo de la interfaz: contenido + 2% de respiro parejo.
    pad = round(mark.width * 0.02)
    ui = Image.new("RGBA", (mark.width + pad * 2, mark.height + pad * 2), (0, 0, 0, 0))
    ui.paste(mark, (pad, pad))
    ui.save(ROOT / "public" / "logo.png")
    print(f"public/logo.png            {ui.width}×{ui.height}")

    ico = ROOT / "src" / "app" / "favicon.ico"
    monogram(48).save(
        ico, format="ICO", sizes=[(16, 16), (32, 32), (48, 48)],
        append_images=[monogram(32), monogram(16, dots=False)],
    )
    print("src/app/favicon.ico        16/32/48")

    monogram(512).save(ROOT / "src" / "app" / "icon.png")
    print("src/app/icon.png           512×512")

    lockup(180, 0.0, 0.11).save(ROOT / "src" / "app" / "apple-icon.png")
    print("src/app/apple-icon.png     180×180")


if __name__ == "__main__":
    main()
