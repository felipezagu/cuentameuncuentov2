#!/usr/bin/env python3
"""
Exporta cada cuento de cuentos.json a un .txt en la carpeta cuentos/
Un párrafo por escena (orden 1–5), separados por una línea en blanco.

Uso (desde la raíz del proyecto):
  python scripts/exportar_cuentos_txt.py
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

# Caracteres no válidos en nombres de archivo en Windows + reservados
INVALID_FS = re.compile(r'[<>:"/\\|?*\x00-\x1f]')
MULTISPACE = re.compile(r"\s+")


def slug_titulo(titulo: str, max_len: int = 120) -> str:
    s = titulo.strip()
    s = INVALID_FS.sub("_", s)
    s = MULTISPACE.sub(" ", s).strip()
    s = s.rstrip(" .")
    if len(s) > max_len:
        s = s[:max_len].rstrip(" .")
    return s or "cuento_sin_titulo"


def escenas_ordenadas(cuento: dict) -> list[str]:
    escenas = cuento.get("escenas") or []
    try:
        escenas = sorted(escenas, key=lambda e: int(e.get("orden", 0)))
    except (TypeError, ValueError):
        escenas = sorted(escenas, key=lambda e: str(e.get("orden", "")))
    textos = []
    for e in escenas[:5]:
        t = (e.get("texto") or "").strip()
        textos.append(t)
    while len(textos) < 5:
        textos.append("")
    return textos[:5]


def main() -> int:
    root = Path(__file__).resolve().parent.parent
    json_path = root / "cuentos.json"
    out_dir = root / "cuentos"
    out_dir.mkdir(parents=True, exist_ok=True)

    if not json_path.is_file():
        print(f"No se encuentra {json_path}", file=sys.stderr)
        return 1

    data = json.loads(json_path.read_text(encoding="utf-8"))
    cuentos = data.get("cuentos") or []
    used_names: set[str] = set()
    n_ok = 0

    for i, c in enumerate(cuentos):
        titulo = (c.get("titulo") or f"cuento_{i}").strip()
        base = slug_titulo(titulo)
        fname = f"{base}.txt"
        n = 1
        while fname.lower() in used_names:
            n += 1
            fname = f"{base}_{n}.txt"
        used_names.add(fname.lower())

        paras = escenas_ordenadas(c)
        # Cinco párrafos separados por una línea en blanco (listo para locución / any2text)
        body = "\n\n".join(paras)

        path = out_dir / fname
        path.write_text(body.rstrip() + "\n", encoding="utf-8")
        n_ok += 1
        print(path.relative_to(root))

    print(f"\nOK: {n_ok} archivos en {out_dir.relative_to(root)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
