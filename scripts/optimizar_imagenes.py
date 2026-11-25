# -*- coding: utf-8 -*-
"""
Convierte las ilustraciones nuevas (.png / .jpg) de imagenes/ a WebP y borra el original.

- Escenas: máximo 1280 px, calidad 80 (≈ 8 veces más livianas que el PNG).
- Portadas: además genera imagenes/portadas/sm/<nombre>.webp (400 px) para las tarjetas.

Después ejecuta `python scripts/migrar_db.py`: actualiza solas las rutas en la base de datos.
Recuerda cambiar también las rutas en cuentos.json si agregaste cuentos ahí.

    python scripts/optimizar_imagenes.py
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent / "imagenes"


def main():
    before = after = n = 0
    files = [p for ext in ("*.png", "*.jpg", "*.jpeg") for p in ROOT.rglob(ext)]
    for f in sorted(files):
        out = f.with_suffix(".webp")
        im = Image.open(f)
        im.load()
        has_alpha = im.mode in ("RGBA", "LA") and im.getchannel("A").getextrema()[0] < 255
        im = im.convert("RGBA" if has_alpha else "RGB")
        if max(im.size) > 1280:
            im.thumbnail((1280, 1280), Image.LANCZOS)
        im.save(out, "WEBP", quality=80, method=6)
        if f.parent.name == "portadas":
            sm = f.parent / "sm"
            sm.mkdir(exist_ok=True)
            thumb = im.copy()
            thumb.thumbnail((400, 400), Image.LANCZOS)
            thumb.save(sm / out.name, "WEBP", quality=78, method=6)
        before += f.stat().st_size
        after += out.stat().st_size
        n += 1
        f.unlink()
    if n:
        print(f"{n} imágenes: {before / 1e6:.1f} MB -> {after / 1e6:.1f} MB")
    else:
        print("No hay imágenes .png/.jpg nuevas.")


if __name__ == "__main__":
    main()
