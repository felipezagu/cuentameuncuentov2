# -*- coding: utf-8 -*-
"""
Integra las imágenes de imagenes/<nombre_cuento>/01 a 05 en las escenas de cada cuento.
Estructura esperada: imagenes/<carpeta_con_nombre_del_cuento>/01.jpg, 02.jpg, ... 05.jpg
(extensiones .jpg o .png). Actualiza la columna imagen de cada escena en la base de datos.
"""
import os
import sys
from pathlib import Path
from urllib.parse import quote

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(SCRIPT_DIR)
sys.path.insert(0, ROOT)

IMAGENES_DIR = Path(ROOT) / "imagenes"


def slug_titulo(titulo: str) -> str:
    """Nombre de carpeta/código: minúsculas, espacios a _, sin acentos."""
    if not titulo or not titulo.strip():
        return ""
    s = titulo.strip().lower()
    for a, b in [("á", "a"), ("é", "e"), ("í", "i"), ("ó", "o"), ("ú", "u"), ("ñ", "n"), ("ü", "u")]:
        s = s.replace(a, b)
    s = "".join(c for c in s if c.isalnum() or c in " -")
    s = s.replace(" ", "_").replace("-", "_")
    while "__" in s:
        s = s.replace("__", "_")
    return s.strip("_")


def _normalizar_para_carpeta(s: str) -> str:
    """Texto sin guiones, en minúsculas. Para comparar con carpetas tipo caperucitaroja, los3cerditos."""
    s = (s or "").lower().strip()
    s = "".join(c for c in s if c.isalnum())
    # Carpetas que usan 3/7 en lugar de tres/siete
    s = s.replace("3", "tres").replace("7", "siete")
    return s


def buscar_carpeta_cuento(titulo: str) -> Path | None:
    """Devuelve la ruta de la carpeta en imagenes/ que corresponde a este cuento, o None."""
    if not IMAGENES_DIR.is_dir():
        return None
    slug = slug_titulo(titulo)
    slug_compacto = _normalizar_para_carpeta(slug.replace("_", ""))  # caperucita_roja -> caperucitaroja
    titulo_limpio = (titulo or "").strip()
    for nombre in os.listdir(IMAGENES_DIR):
        carpeta = IMAGENES_DIR / nombre
        if not carpeta.is_dir():
            continue
        nombre_slug = slug_titulo(nombre)
        nombre_compacto = _normalizar_para_carpeta(nombre)
        if (
            nombre.strip() == titulo_limpio
            or nombre_slug == slug
            or nombre_compacto == slug_compacto
        ):
            return carpeta
    return None


def extension_archivo(carpeta: Path, numero: str) -> str | None:
    """Devuelve '.jpg' o '.png' si existe 01.jpg / 01.png en la carpeta."""
    for ext in (".jpg", ".jpeg", ".png"):
        if (carpeta / f"{numero}{ext}").is_file():
            return ext
    return None


def main():
    from backend.database import SessionLocal
    from backend.models import Story, Scene

    db = SessionLocal()
    try:
        stories = db.query(Story).order_by(Story.id).all()
        if not stories:
            print("No hay cuentos en la base de datos.")
            return

        for story in stories:
            titulo = story.titulo or ""
            carpeta = buscar_carpeta_cuento(titulo)
            if not carpeta:
                slug = slug_titulo(titulo)
                print(f"  [omitido] No hay carpeta para: {titulo}  →  crea: imagenes/{slug}/  (con 01.jpg … 05.jpg)")
                continue

            escenas = sorted(story.escenas, key=lambda e: e.orden)
            if len(escenas) < 5:
                print(f"  [omitido] '{story.titulo}' tiene {len(escenas)} escenas (se esperan al menos 5).")
                continue

            # Asignar imágenes 01..05 a las primeras 5 escenas
            nombre_carpeta = carpeta.name
            base_url = "/imagenes/" + quote(nombre_carpeta, safe="")
            actualizadas = 0
            for i, escena in enumerate(escenas[:5]):
                num = f"{i + 1:02d}"
                ext = extension_archivo(carpeta, num)
                if ext:
                    escena.imagen = f"{base_url}/{num}{ext}"
                    actualizadas += 1
            db.commit()
            print(f"  OK '{story.titulo}': {actualizadas} escenas con imagen (carpeta: {nombre_carpeta})")
    finally:
        db.close()


if __name__ == "__main__":
    main()
