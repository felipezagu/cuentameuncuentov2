"""
Integración con Leonardo.ai para generar imágenes de escenas en modo infantil.
API: https://cloud.leonardo.ai/api/rest/v1
"""
import os
import time
from pathlib import Path

import httpx

LEONARDO_BASE = "https://cloud.leonardo.ai/api/rest/v1"
# Clave por defecto; preferir variable de entorno LEONARDO_API_KEY
DEFAULT_API_KEY = "82d9f6c8-2bc6-4b0c-91f9-49f42a0535c4"


def _get_api_key() -> str:
    return os.environ.get("LEONARDO_API_KEY", DEFAULT_API_KEY)


def _headers() -> dict:
    return {
        "Authorization": f"Bearer {_get_api_key()}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }


def build_prompt(nombre_cuento: str, estrofa: str) -> str:
    """
    Construye el texto que se le envía a la IA para generar la imagen de UNA sola estrofa.
    """
    texto = estrofa.strip()
    if len(texto) > 500:
        texto = texto[:497] + "..."
    return (
        f"generame esta estrofa del cuento \"{nombre_cuento}\" en una imagen estilo disney que sea la imagen cuadrada: {texto}"
    )


# Sufijo de estilo para Luma: genérico, sin marcas. Objetivo: look de animación infantil tipo cuento clásico.
_LUMA_STYLE_SUFFIX = (
    " Estilo visual: animación infantil, fantasía, cuento ilustrado, estilo caricatura moderno. "
    "Colorido, amigable, iluminación cálida, apariencia mágica. "
    "Sin usar nombres de marcas o estudios. "
    "La imagen NO debe contener texto, palabras ni letras; solo ilustración."
)

# Prompts seguros para cuentos que activan el moderador de Luma (solo descripción visual, sin narrativa sensible).
# Clave: título del cuento normalizado (minúsculas). Valor: lista de prompts por escena (orden 1 = índice 0).
_LUMA_SAFE_PROMPTS: dict[str, list[str]] = {
    "la gallina de los huevos de oro": [
        "Granja con una gallina blanca y un huevo dorado brillante en el suelo. Granjero y mujer sonriendo." + _LUMA_STYLE_SUFFIX,
        "Mujer y granjero en la puerta de la granja hablando. Corral con gallinas al fondo." + _LUMA_STYLE_SUFFIX,
        "Granjero y mujer con expresión de sorpresa en la granja. Corral vacío al lado." + _LUMA_STYLE_SUFFIX,
        "Granjero y mujer tristes junto al corral vacío. Atardecer suave." + _LUMA_STYLE_SUFFIX,
        "Libro abierto con un dibujo de una gallina y un huevo dorado. Estilo moraleja de fábula para niños." + _LUMA_STYLE_SUFFIX,
    ],
    "la bella y la bestia": [
        "Castillo encantado de noche, jardín con rosas. Mercader con capa cogiendo una rosa. Figura grande a la sombra. Fantasía, cuento ilustrado." + _LUMA_STYLE_SUFFIX,
        "Joven con vestido amarillo en un castillo lujoso, salón con candelabros. Cena elegante. Ambiente mágico y acogedor." + _LUMA_STYLE_SUFFIX,
        "Joven mirando un espejo mágico que muestra un castillo. Expresión de preocupación. Interior de cabaña y ventana al castillo." + _LUMA_STYLE_SUFFIX,
        "Joven abrazando a una figura grande y peluda en un salón del castillo. Luz dorada de transformación mágica. Momento emotivo." + _LUMA_STYLE_SUFFIX,
        "Boda en un castillo, joven con vestido de princesa y príncipe. Vitrales, flores, final feliz de cuento de hadas." + _LUMA_STYLE_SUFFIX,
    ],
}


def build_prompt_luma(nombre_cuento: str, estrofa: str, orden: int | None = None) -> str:
    """
    Prompt para Luma: evita marcas y narrativas que activen el filtro de IP o moderación.
    Si el cuento tiene prompts seguros predefinidos (p. ej. La gallina de los huevos de oro), los usa.
    """
    titulo = (nombre_cuento or "").strip() or "cuento"
    key = titulo.lower()
    safe_list = _LUMA_SAFE_PROMPTS.get(key)
    if orden is not None and safe_list and 1 <= orden <= len(safe_list):
        return safe_list[orden - 1]

    texto = estrofa.strip()
    if len(texto) > 500:
        texto = texto[:497] + "..."
    return (
        f"Ilustración infantil para una escena: {texto}. "
        f"Contexto: cuento titulado \"{titulo}\". "
        "Composición cuadrada."
        + _LUMA_STYLE_SUFFIX
    )


def _negative_prompt() -> str:
    """Elementos a evitar en la imagen."""
    return (
        "text, watermark, words, letters, logo, blurry, distorted, deformed, "
        "modern clothing, photograph, realistic photo, dark, gritty, anime, "
        "wrong characters, inconsistent style, ugly, scary, violent."
    )


def create_generation(prompt: str) -> str | None:
    """
    Crea una generación en Leonardo.ai. Devuelve generationId o None si falla.
    Parámetros ajustados para ilustraciones de cuento fieles al texto.
    """
    payload = {
        "prompt": prompt,
        "negative_prompt": _negative_prompt(),
        "num_images": 1,
        "width": 768,
        "height": 768,
        "alchemy": True,
        "guidance_scale": 9,
        "num_inference_steps": 30,
    }
    with httpx.Client(timeout=60.0) as client:
        r = client.post(
            f"{LEONARDO_BASE}/generations",
            headers=_headers(),
            json=payload,
        )
    if r.status_code != 200:
        return None
    data = r.json()
    job = data.get("sdGenerationJob") or data.get("generationId")
    if job is None:
        return None
    if isinstance(job, dict):
        return job.get("generationId")
    return str(job)


def get_generation_result(generation_id: str) -> str | None:
    """
    Obtiene el resultado de una generación (polling). Devuelve la URL de la primera imagen o None.
    """
    with httpx.Client(timeout=30.0) as client:
        for _ in range(60):
            r = client.get(
                f"{LEONARDO_BASE}/generations/{generation_id}",
                headers=_headers(),
            )
            if r.status_code != 200:
                return None
            data = r.json()
            gen = data.get("generations_by_pk") or data.get("generation") or data
            status = (gen.get("status") or "").upper()
            if status == "FAILED":
                return None
            images = gen.get("generated_images") or []
            if images and len(images) > 0:
                img = images[0]
                url = img.get("url") or (img.get("generated_image") or {}).get("url")
                if url:
                    return url
            time.sleep(2)
    return None


def download_image(url: str, save_path: Path) -> bool:
    """Descarga la imagen desde url y la guarda en save_path."""
    try:
        with httpx.Client(timeout=60.0, follow_redirects=True) as client:
            r = client.get(url)
            if r.status_code != 200:
                return False
            save_path.write_bytes(r.content)
            return True
    except Exception:
        return False


def generate_scene_image(
    nombre_cuento: str,
    estrofa: str,
    save_path: Path,
) -> bool:
    """
    Genera una imagen para la escena con Leonardo.ai (modo infantil),
    la descarga y guarda en save_path. Devuelve True si todo fue bien.
    """
    prompt = build_prompt(nombre_cuento, estrofa)
    gen_id = create_generation(prompt)
    if not gen_id:
        return False
    image_url = get_generation_result(gen_id)
    if not image_url:
        return False
    return download_image(image_url, save_path)
