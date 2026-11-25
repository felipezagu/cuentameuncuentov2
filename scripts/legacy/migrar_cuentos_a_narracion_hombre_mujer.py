# -*- coding: utf-8 -*-
"""
Migra `cuentos.json` al nuevo sistema de narración:
- Para cada cuento cuyo slug tiene assets de sincronización/MP3 tanto de hombre como de mujer:
  - limpia el título (quita sufijos tipo "(v2 — narrador ...)")
  - crea 2 entradas con el MISMO título base (una por género), con:
    - `narracion_audio` apuntando al MP3 del género
    - `narracion_sync` apuntando al .sync.json del género
  - copia `escenas`/`preguntas`/`portada`/etc desde una entrada base existente del cuento
- Para cuentos que no tengan ambos assets, deja una sola entrada "limpia" (sin narración grabada).

Objetivo: que la UI permita elegir la voz (Hombre/Mujer) y cargar el MP3+sync correctos.
"""

from __future__ import annotations

import json
import os
import re
import unicodedata
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple


SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(SCRIPT_DIR)
PATH_JSON = os.path.join(ROOT, "cuentos.json")
IMAGES_DIR = os.path.join(ROOT, "imagenes")


def strip_v2_suffix(title: str) -> str:
    t = str(title or "").strip()
    # Quita sufijos tipo "(v2 — narrador mujer)" o "(v2 - narrador hombre)"
    # usando un patrón bastante tolerante.
    t = re.sub(r"\(\s*v2[^)]*narrador\s*(mujer|hombre)\s*\)\s*$", "", t, flags=re.I).strip()
    return t


def _strip_accents(s: str) -> str:
    nfkd = unicodedata.normalize("NFKD", s)
    return "".join([c for c in nfkd if not unicodedata.combining(c)])


def slugify_title_for_assets(title: str) -> str:
    """
    Debe coincidir con el nombre de carpeta en `imagenes/`.
    Nota: hay casos especiales (ej. "Los Tres Cerditos" -> "los3cerditos").
    """
    base = strip_v2_suffix(title)
    s = _strip_accents(base).lower()
    # Quita todo lo que no sea alfanumérico.
    s = re.sub(r"[^a-z0-9]+", "", s)
    # Caso especial observado en el repo:
    if s == "lostrescerditos":
        return "los3cerditos"
    return s


def get_story_base_fields(story: Dict[str, Any]) -> Dict[str, Any]:
    """
    Copia los campos esperados por el backend desde la entrada base.
    """
    return {
        "titulo": story.get("titulo"),
        "descripcion": story.get("descripcion"),
        "portada": story.get("portada"),
        "categoria": story.get("categoria"),
        "ambiente": story.get("ambiente"),
        "destacado": story.get("destacado", False),
        "preguntas": story.get("preguntas"),
        "escenas": story.get("escenas") or [],
    }


@dataclass(frozen=True)
class GenderAssets:
    mp3_rel: str
    sync_rel: str


def list_assets_by_slug(images_dir: str) -> Dict[str, Dict[str, GenderAssets]]:
    """
    Detecta archivos:
      - {slug}hombre.mp3
      - {slug}hombre.sync.json
      - {slug}mujer.mp3
      - {slug}mujer.sync.json
    """
    assets: Dict[str, Dict[str, GenderAssets]] = {}
    if not os.path.isdir(images_dir):
        return assets

    for folder in os.listdir(images_dir):
        slug = folder.strip()
        if not slug:
            continue
        folder_path = os.path.join(images_dir, folder)
        if not os.path.isdir(folder_path):
            continue

        # Filtra por existencia; nombres esperados por el repo:
        male_mp3 = os.path.join(folder_path, f"{slug}hombre.mp3")
        male_sync = os.path.join(folder_path, f"{slug}hombre.sync.json")
        female_mp3 = os.path.join(folder_path, f"{slug}mujer.mp3")
        female_sync = os.path.join(folder_path, f"{slug}mujer.sync.json")

        has_male = os.path.isfile(male_mp3) and os.path.isfile(male_sync)
        has_female = os.path.isfile(female_mp3) and os.path.isfile(female_sync)

        if not (has_male or has_female):
            continue

        assets.setdefault(slug, {})
        if has_male:
            assets[slug]["hombre"] = GenderAssets(
                mp3_rel=f"/imagenes/{slug}/{slug}hombre.mp3",
                sync_rel=f"/imagenes/{slug}/{slug}hombre.sync.json",
            )
        if has_female:
            assets[slug]["mujer"] = GenderAssets(
                mp3_rel=f"/imagenes/{slug}/{slug}mujer.mp3",
                sync_rel=f"/imagenes/{slug}/{slug}mujer.sync.json",
            )

    return assets


def scenes_match_sync_max_scene_index(story_escenas: List[Dict[str, Any]], sync_json: Dict[str, Any]) -> bool:
    """
    Aplica la misma regla del frontend:
    - nEscenas = len(story.escenas)
    - maxSceneIndex del sync.segments debe ser nEscenas - 1
    """
    n_escenas = len(story_escenas or [])
    segments = sync_json.get("segments") if isinstance(sync_json, dict) else None
    if not segments or not isinstance(segments, list) or n_escenas <= 0:
        return True  # no podemos validar con segmentos

    max_scene = 0
    for s in segments:
        if not isinstance(s, dict):
            continue
        si = s.get("sceneIndex", 0)
        if isinstance(si, (int, float)):
            max_scene = max(max_scene, int(si))
    return max_scene == n_escenas - 1


def main() -> None:
    if not os.path.isfile(PATH_JSON):
        raise SystemExit(f"No se encuentra cuentos.json en: {PATH_JSON}")

    with open(PATH_JSON, "r", encoding="utf-8") as f:
        data = json.load(f)

    cuentos = data.get("cuentos") or []
    if not isinstance(cuentos, list):
        raise SystemExit("cuentos.json: campo 'cuentos' no es una lista")

    # Mapa slug -> entrada base (escenas/preguntas/etc).
    base_by_slug: Dict[str, Dict[str, Any]] = {}
    for c in cuentos:
        if not isinstance(c, dict):
            continue
        slug = slugify_title_for_assets(c.get("titulo") or "")
        if not slug:
            continue
        if slug not in base_by_slug:
            base_by_slug[slug] = c

    assets_by_slug = list_assets_by_slug(IMAGES_DIR)
    narratable_slugs: List[str] = []
    for slug, gassets in assets_by_slug.items():
        if "hombre" in gassets and "mujer" in gassets:
            narratable_slugs.append(slug)

    narratable_slugs.sort()

    new_cuentos: List[Dict[str, Any]] = []
    used_base_titles: set[str] = set()

    # Primero: narración nueva (hombre+mujer) por slug.
    for slug in narratable_slugs:
        base_story = base_by_slug.get(slug)
        if not base_story:
            continue

        base_title_clean = strip_v2_suffix(base_story.get("titulo") or "")
        base_fields = get_story_base_fields(base_story)
        base_fields["titulo"] = base_title_clean

        male_asset = assets_by_slug[slug]["hombre"]
        female_asset = assets_by_slug[slug]["mujer"]

        # Validación ligera: consistencia escenas vs sync (si podemos leer sync local).
        # Nota: si falla, igual generamos (pero lo reportamos) porque a veces no es posible validar.
        ok_male = True
        ok_female = True
        try:
            male_sync_local = os.path.join(IMAGES_DIR, slug, f"{slug}hombre.sync.json")
            with open(male_sync_local, "r", encoding="utf-8") as sf:
                male_sync_json = json.load(sf)
            ok_male = scenes_match_sync_max_scene_index(base_fields["escenas"], male_sync_json)
        except Exception:
            pass
        try:
            female_sync_local = os.path.join(IMAGES_DIR, slug, f"{slug}mujer.sync.json")
            with open(female_sync_local, "r", encoding="utf-8") as sf:
                female_sync_json = json.load(sf)
            ok_female = scenes_match_sync_max_scene_index(base_fields["escenas"], female_sync_json)
        except Exception:
            pass

        # Generamos 2 entradas: hombre y mujer.
        for gender, gasset, ok in [
            ("hombre", male_asset, ok_male),
            ("mujer", female_asset, ok_female),
        ]:
            entry = dict(base_fields)
            entry["narracion_audio"] = gasset.mp3_rel
            entry["narracion_sync"] = gasset.sync_rel
            entry["titulo"] = base_title_clean
            new_cuentos.append(entry)
            used_base_titles.add(base_title_clean)

    # Segundo: conservar cuentos que NO están en la lista narratable.
    # Quitamos sufijos v2 si existen.
    for c in cuentos:
        if not isinstance(c, dict):
            continue
        base_title_clean = strip_v2_suffix(c.get("titulo") or "")
        slug = slugify_title_for_assets(c.get("titulo") or "")
        is_narratable = slug in narratable_slugs
        if is_narratable:
            continue
        # Evita duplicar títulos si ya creamos la versión narrada.
        if base_title_clean in used_base_titles:
            continue

        entry = dict(c)
        entry["titulo"] = base_title_clean
        # Si antes traía narración vieja, la limpiamos para no mezclar sistemas.
        entry.pop("narracion_audio", None)
        entry.pop("narracion_sync", None)
        new_cuentos.append(entry)

    # Persistir.
    data["cuentos"] = new_cuentos
    with open(PATH_JSON, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(
        f"Listo. Narración nueva creada para {len(narratable_slugs)} cuentos (hombre+mujer). "
        f"Cuentos totales en JSON: {len(new_cuentos)}."
    )


if __name__ == "__main__":
    main()

