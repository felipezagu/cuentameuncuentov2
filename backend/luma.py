"""
Generación de imágenes con Luma (SDK oficial).
Docs: https://docs.lumalabs.ai/docs/python-image-generation
- Modelo: photon-1
- Aspect ratio: 1:1
"""

from __future__ import annotations

import os
import re
import time
from pathlib import Path

import httpx

# El SDK oficial usa LUMAAI_API_KEY; aceptamos también LUMA_API_KEY
def _get_api_key() -> str:
    key = os.environ.get("LUMAAI_API_KEY") or os.environ.get("LUMA_API_KEY")
    if not key:
        raise RuntimeError(
            "LUMAAI_API_KEY o LUMA_API_KEY no está configurada. "
            "Pon tu clave en .env.local o exporta la variable."
        )
    return key


def _client():
    """Cliente LumaAI usando la clave de entorno."""
    try:
        from lumaai import LumaAI
    except ImportError:
        raise RuntimeError(
            "Falta el paquete lumaai. Instala con: pip install lumaai"
        )
    return LumaAI(auth_token=_get_api_key())


def generate_scene_image_luma(
    prompt: str,
    save_path: Path,
    aspect_ratio: str = "1:1",
    model: str = "photon-1",
) -> bool:
    """
    Genera una imagen con Luma para una estrofa.
    En caso de error lanza RuntimeError con el mensaje para mostrarlo al usuario.
    """
    client = _client()
    try:
        generation = client.generations.image.create(
            prompt=prompt,
            aspect_ratio=aspect_ratio,
            model=model,
        )
    except Exception as e:
        raise RuntimeError(f"Luma create falló: {e!s}") from e

    gen_id = getattr(generation, "id", None) or (generation if isinstance(generation, str) else None)
    if not gen_id:
        raise RuntimeError("Luma no devolvió id de generación")

    # Polling hasta completed o failed
    last_error = None
    for _ in range(90):
        try:
            generation = client.generations.get(id=gen_id)
        except Exception as e:
            last_error = e
            time.sleep(2)
            continue
        state = getattr(generation, "state", None) or ""
        if state == "completed":
            break
        if state == "failed":
            reason = getattr(generation, "failure_reason", None) or "sin motivo"
            raise RuntimeError(f"Luma rechazó la generación: {reason}")
        time.sleep(2)
    else:
        msg = f"Timeout esperando imagen de Luma. Último error: {last_error!s}" if last_error else "Timeout esperando imagen de Luma."
        raise RuntimeError(msg)

    state = getattr(generation, "state", None)
    if state != "completed":
        raise RuntimeError("Luma no completó la generación")

    assets = getattr(generation, "assets", None)
    image_url = None
    if assets is not None:
        image_url = getattr(assets, "image", None)
        if image_url is None and isinstance(assets, dict):
            image_url = assets.get("image")
    if not image_url:
        raise RuntimeError("Luma no devolvió URL de imagen")

    # Descargar y guardar
    try:
        with httpx.Client(timeout=60.0, follow_redirects=True) as client_http:
            r = client_http.get(image_url)
            if r.status_code != 200:
                raise RuntimeError(f"Descarga de imagen falló: HTTP {r.status_code}")
            save_path.parent.mkdir(parents=True, exist_ok=True)
            save_path.write_bytes(r.content)
            return True
    except RuntimeError:
        raise
    except Exception as e:
        raise RuntimeError(f"Error descargando imagen: {e!s}") from e


def slug_nombre_cuento(titulo: str) -> str:
    """
    Convierte el título del cuento en un nombre de archivo seguro.
    Ej: "El dragón y la luna" -> "el_dragon_y_la_luna"
    """
    if not titulo or not titulo.strip():
        return "cuento"
    s = titulo.strip().lower()
    # Reemplazar acentos (simple)
    replacements = (
        ("á", "a"), ("é", "e"), ("í", "i"), ("ó", "o"), ("ú", "u"),
        ("ñ", "n"), ("ü", "u"),
    )
    for a, b in replacements:
        s = s.replace(a, b)
    s = re.sub(r"[^a-z0-9\s\-]", "", s)
    s = re.sub(r"\s+", "_", s)
    s = re.sub(r"_+", "_", s).strip("_")
    return s or "cuento"
