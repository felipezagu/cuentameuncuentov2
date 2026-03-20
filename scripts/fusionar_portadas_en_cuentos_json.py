# -*- coding: utf-8 -*-
"""
Copia en cuentos.json las portadas (y rutas de imagen por escena) desde
cuentos_portadas.json, coincidiendo por título exacto.

Así las portadas quedan fijas en el JSON que usa cargar_cuentos_en_db.py.
Ejecutar tras actualizar cuentos_portadas.json:

    python scripts/fusionar_portadas_en_cuentos_json.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
ROOT = SCRIPT_DIR.parent
PATH_PORTADAS = ROOT / "cuentos_portadas.json"
PATH_CUENTOS = ROOT / "cuentos.json"


def main() -> None:
    if not PATH_PORTADAS.is_file():
        print("No existe cuentos_portadas.json")
        sys.exit(1)
    if not PATH_CUENTOS.is_file():
        print("No existe cuentos.json")
        sys.exit(1)

    with open(PATH_PORTADAS, encoding="utf-8") as f:
        port_data = json.load(f)
    with open(PATH_CUENTOS, encoding="utf-8") as f:
        cuentos_data = json.load(f)

    by_title: dict[str, dict] = {}
    for c in port_data.get("cuentos") or []:
        t = (c.get("titulo") or "").strip()
        if t:
            by_title[t] = c

    n_portada = 0
    n_imagen = 0

    for c in cuentos_data.get("cuentos") or []:
        t = (c.get("titulo") or "").strip()
        src = by_title.get(t)
        if not src:
            continue

        if src.get("portada"):
            c["portada"] = src["portada"]
            n_portada += 1

        src_esc = src.get("escenas") or []
        if not src_esc:
            continue
        src_by_orden = {}
        for e in src_esc:
            try:
                o = int(e.get("orden", 0))
            except (TypeError, ValueError):
                continue
            if o:
                src_by_orden[o] = e

        for e in c.get("escenas") or []:
            try:
                o = int(e.get("orden", 0))
            except (TypeError, ValueError):
                continue
            se = src_by_orden.get(o)
            if se and se.get("imagen"):
                e["imagen"] = se["imagen"]
                n_imagen += 1

    with open(PATH_CUENTOS, "w", encoding="utf-8") as f:
        json.dump(cuentos_data, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(
        f"Listo. Portadas aplicadas: {n_portada} cuentos. "
        f"Imágenes de escena: {n_imagen}. "
        f"Cuentos sin fila en cuentos_portadas.json: no se modifican."
    )


if __name__ == "__main__":
    main()
