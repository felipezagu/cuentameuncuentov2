#!/usr/bin/env python3
"""
Convierte un .txt con marcas (mm:ss) al inicio de cada frase (estilo any2text)
en un archivo .sync.json para la narración.

Formato de entrada: el texto puede ir en una o varias líneas; cada segmento
empieza con (mm:ss) seguido del texto hasta la siguiente marca.

Uso:
  python scripts/txt_to_sync_json.py imagenes/caperucitaroja/any2textcaperucitarojahombre.txt \\
    --audio caperucitarojahombre.mp3 --out imagenes/caperucitaroja/caperucitarojahombre.sync.json

Límites de escena (Caperucita, 5 escenas): por defecto 24,44,63,83 segundos
(startSec en [0,24)->0, [24,44)->1, ...). Personalizar con --scene-boundaries.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

TIMESTAMP_RE = re.compile(r"\((\d{2}):(\d{2})\)\s*")

# Límites inferidos del sync original de Caperucita (5 escenas).
DEFAULT_CAPERUCITA_SCENE_BOUNDARIES_SEC = [24, 44, 63, 83]


def parse_mm_ss_groups(content: str) -> list[tuple[int, str]]:
    """Devuelve lista de (start_sec, texto) por cada marca (mm:ss)."""
    content = content.replace("\r\n", "\n").replace("\r", "\n")
    matches = list(TIMESTAMP_RE.finditer(content))
    if not matches:
        raise ValueError("No se encontró ninguna marca (mm:ss) en el texto.")

    segments: list[tuple[int, str]] = []
    for i, m in enumerate(matches):
        mm, ss = int(m.group(1)), int(m.group(2))
        start_sec = mm * 60 + ss
        start_pos = m.end()
        end_pos = matches[i + 1].start() if i + 1 < len(matches) else len(content)
        raw = content[start_pos:end_pos]
        text = " ".join(raw.split()).strip()
        segments.append((start_sec, text))

    return segments


def scene_index_for_time(start_sec: float, boundaries: list[float]) -> int:
    """boundaries[i] = primer segundo que NO pertenece a la escena i."""
    for i, b in enumerate(boundaries):
        if start_sec < b:
            return i
    return len(boundaries)


def build_sync_json(
    segments: list[tuple[int, str]],
    *,
    version: int,
    audio_name: str,
    text_source: str,
    timings_source: str,
    audio_duration_sec: float | None,
    scene_boundaries: list[float],
    method: str,
    note: str,
) -> dict:
    out_segments = []
    n = len(segments)
    for idx, (start_sec, text) in enumerate(segments):
        si = scene_index_for_time(float(start_sec), scene_boundaries)
        end_sec = float(segments[idx + 1][0]) if idx + 1 < n else None
        item: dict = {
            "index": idx,
            "sceneIndex": si,
            "startSec": start_sec,
            "text": text,
        }
        if end_sec is not None:
            item["endSec"] = end_sec
        else:
            if audio_duration_sec is not None:
                item["endSec"] = round(audio_duration_sec, 3)
            else:
                # Último segmento: estimar si no hay duración
                item["endSec"] = float(start_sec) + 10.0
                item["endSecEstimated"] = True
        out_segments.append(item)

    return {
        "version": version,
        "audio": audio_name,
        "sources": {"text": text_source, "timings": timings_source},
        "method": method,
        "note": note,
        "segments": out_segments,
    }


def convert_txt_to_sync(
    input_txt: Path,
    *,
    out: Path | None = None,
    audio: str = "caperucitarojahombre.mp3",
    text_source: str = "caperucitaroja.txt",
    duration: float | None = None,
    scene_boundaries_csv: str | None = None,
    version: int = 3,
) -> tuple[Path, int]:
    """
    Convierte TXT con (mm:ss) a .sync.json.
    Devuelve (ruta_salida, número_de_segmentos).
    """
    if scene_boundaries_csv is None:
        scene_boundaries_csv = ",".join(str(x) for x in DEFAULT_CAPERUCITA_SCENE_BOUNDARIES_SEC)
    boundaries = [float(x.strip()) for x in scene_boundaries_csv.split(",") if x.strip()]

    raw = input_txt.read_text(encoding="utf-8")
    segs = parse_mm_ss_groups(raw)

    out_path = out
    if out_path is None:
        stem = input_txt.stem
        if stem.endswith(".sync"):
            stem = stem[:-5]
        out_path = input_txt.with_name(stem + ".sync.json")

    note = (
        "Generado desde TXT con marcas (mm:ss). "
        "Cada segmento: startSec = marca; endSec = inicio del siguiente "
        "(último: duración o estimado). sceneIndex según límites de escena."
    )
    data = build_sync_json(
        segs,
        version=version,
        audio_name=audio,
        text_source=text_source,
        timings_source=input_txt.name,
        audio_duration_sec=duration,
        scene_boundaries=boundaries,
        method="segments_from_any2text_timestamps",
        note=note,
    )

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return out_path, len(segs)


def main() -> int:
    parser = argparse.ArgumentParser(description="TXT (mm:ss) → .sync.json")
    parser.add_argument("input_txt", type=Path, help="Archivo .txt con marcas (mm:ss)")
    parser.add_argument(
        "--out",
        type=Path,
        default=None,
        help="Salida .sync.json (por defecto: mismo directorio que input, nombre stem + .sync.json)",
    )
    parser.add_argument("--audio", default="caperucitarojahombre.mp3", help="Nombre del MP3 en JSON")
    parser.add_argument(
        "--text-source",
        default="caperucitaroja.txt",
        help="Campo sources.text (referencia al guion)",
    )
    parser.add_argument(
        "--duration",
        type=float,
        default=None,
        help="Duración total del audio en segundos (para endSec del último segmento)",
    )
    parser.add_argument(
        "--scene-boundaries",
        default=",".join(str(x) for x in DEFAULT_CAPERUCITA_SCENE_BOUNDARIES_SEC),
        help="Segundos donde cambia de escena (lista separada por comas). Ej: 24,44,63,83",
    )
    parser.add_argument("--version", type=int, default=3)
    args = parser.parse_args()

    try:
        out_path, n = convert_txt_to_sync(
            args.input_txt,
            out=args.out,
            audio=args.audio,
            text_source=args.text_source,
            duration=args.duration,
            scene_boundaries_csv=args.scene_boundaries,
            version=args.version,
        )
    except ValueError as e:
        print(e, file=sys.stderr)
        return 1

    print(f"OK: {n} segmentos -> {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
