# -*- coding: utf-8 -*-
"""
Ajusta `escenas` en `cuentos.json` para que la narración grabada se active:

El frontend activa grabación solo si:
  max(sceneIndex) == nEscenas - 1

Este script:
- Lee cada cuento con `narracion_audio` + `narracion_sync`
- Calcula required_len = maxSceneIndex + 1 desde el .sync.json (segments)
- Si el cuento tiene más escenas que required_len, hace merges:
  - required_len == 4: une orden 5 -> orden 4 (textos) y imagen 4 = imagen 5
  - required_len == 3: une orden 4 + 5 -> orden 3 (textos) y imagen 3 = imagen 5
- Guarda nuevamente `cuentos.json`
"""

from __future__ import annotations

import json
import os
from typing import Any, Dict, List, Tuple


SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(SCRIPT_DIR)
PATH_JSON = os.path.join(ROOT, "cuentos.json")


def load_json(path: str) -> Any:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def local_path_from_rel(rel_or_abs: str) -> str:
    p = str(rel_or_abs or "").strip()
    if p.startswith("/"):
        p = p[1:]
    return os.path.join(ROOT, p.replace("/", os.sep))


def max_scene_index_from_sync(sync_json: Dict[str, Any]) -> int:
    segs = sync_json.get("segments", [])
    if not isinstance(segs, list) or not segs:
        return -1
    max_si = 0
    for s in segs:
        if not isinstance(s, dict):
            continue
        si = s.get("sceneIndex", 0)
        try:
            si = int(si)
        except Exception:
            si = 0
        if si > max_si:
            max_si = si
    return max_si


def adjust_escenas_for_required_len(escenas: List[Dict[str, Any]], required_len: int) -> List[Dict[str, Any]]:
    if required_len <= 0:
        return escenas

    # Asegura orden por `orden`
    esc = list(escenas or [])
    esc.sort(key=lambda x: int(x.get("orden", 0)) if isinstance(x, dict) else 0)

    cur_len = len(esc)
    if cur_len == required_len:
        return esc
    if cur_len < required_len:
        # No intentamos "crear" escenas; preferimos no romper.
        return esc

    # Solo manejamos reducción desde 5 a 4 o 3 (caso del repo actual).
    # Si el repo cambia, se puede extender aquí.
    if required_len == 4:
        # Unir orden 5 en orden 4
        scene4 = None
        scene5 = None
        for s in esc:
            o = int(s.get("orden", 0))
            if o == 4:
                scene4 = s
            elif o == 5:
                scene5 = s
        if not scene4 or not scene5:
            return esc
        txt4 = str(scene4.get("texto") or "").strip()
        txt5 = str(scene5.get("texto") or "").strip()
        merged = (txt4 + " " + txt5).strip()
        scene4["texto"] = merged
        # Imagen: tomamos la última
        scene4["imagen"] = scene5.get("imagen")
        # Mantener solo 1..4 y reenumerar
        new_esc = [s for s in esc if int(s.get("orden", 0)) in (1, 2, 3, 4)]
        new_esc.sort(key=lambda x: int(x.get("orden", 0)))
        for i, s in enumerate(new_esc, start=1):
            s["orden"] = i
        return new_esc

    if required_len == 3:
        # Unir orden 4 y 5 en orden 3
        scene3 = None
        scene4 = None
        scene5 = None
        for s in esc:
            o = int(s.get("orden", 0))
            if o == 3:
                scene3 = s
            elif o == 4:
                scene4 = s
            elif o == 5:
                scene5 = s
        if not scene3 or not scene4 or not scene5:
            return esc
        txt3 = str(scene3.get("texto") or "").strip()
        txt4 = str(scene4.get("texto") or "").strip()
        txt5 = str(scene5.get("texto") or "").strip()
        merged = (txt3 + " " + txt4 + " " + txt5).strip()
        scene3["texto"] = merged
        scene3["imagen"] = scene5.get("imagen")
        new_esc = [s for s in esc if int(s.get("orden", 0)) in (1, 2, 3)]
        new_esc.sort(key=lambda x: int(x.get("orden", 0)))
        for i, s in enumerate(new_esc, start=1):
            s["orden"] = i
        return new_esc

    return esc


def main() -> None:
    data = load_json(PATH_JSON)
    cuentos = data.get("cuentos") or []
    if not isinstance(cuentos, list):
        raise SystemExit("cuentos.json: 'cuentos' no es lista")

    adjusted = 0
    checked = 0
    failures: List[Tuple[str, str, str]] = []

    for c in cuentos:
        if not isinstance(c, dict):
            continue
        na = c.get("narracion_audio")
        ns = c.get("narracion_sync")
        if not na or not ns:
            continue

        checked += 1
        sync_local = local_path_from_rel(ns)
        try:
            sync_json = load_json(sync_local)
            max_si = max_scene_index_from_sync(sync_json)
            if max_si < 0:
                continue
            required_len = max_si + 1
            esc_before = c.get("escenas") or []
            cur_len = len(esc_before)
            if cur_len != required_len:
                c["escenas"] = adjust_escenas_for_required_len(esc_before, required_len)
                adjusted += 1
        except Exception as e:
            failures.append((str(c.get("titulo")), str(na), str(e)))

    data["cuentos"] = cuentos
    with open(PATH_JSON, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"Checked {checked} entradas con narración. Ajustadas {adjusted}. Failures: {len(failures)}")
    if failures:
        print("Primeras failures:", failures[:5])


if __name__ == "__main__":
    main()

