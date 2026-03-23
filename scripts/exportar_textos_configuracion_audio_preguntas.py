# -*- coding: utf-8 -*-
"""
Genera TXT con todo el texto que el frontend usa al leer:
- panel final del cuento
- mensajes motivacionales al terminar las preguntas
- cada pregunta y sus opciones (texto exacto de speakQuestionAndOptions)

Output: c:/webpautas/py/cuentameuncuento/imagenes/configuracion/*.txt
"""

from __future__ import annotations

import json
import os
import re
import unicodedata
from typing import Any, Dict, List


ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PATH_JSON = os.path.join(ROOT, "cuentos.json")
OUT_DIR = os.path.join(ROOT, "imagenes", "configuracion")


def strip_v2_suffix(title: str) -> str:
    t = str(title or "").strip()
    # Quita sufijos tipo:
    # - "(v2 — narrador hombre)"
    # - "(v2 — narrador mujer)"
    # - "(v2 ... narrador)" (por si quedó sin el género)
    t = re.sub(r"\(\s*v2[^)]*narrador[^)]*\)\s*$", "", t, flags=re.I).strip()
    return t


def _strip_accents(s: str) -> str:
    nfkd = unicodedata.normalize("NFKD", s)
    return "".join([c for c in nfkd if not unicodedata.combining(c)])


def slugify_title_for_assets(title: str) -> str:
    base = strip_v2_suffix(title)
    s = _strip_accents(base).lower()
    s = re.sub(r"[^a-z0-9]+", "", s)
    # Caso especial observado en el repo.
    if s == "lostrescerditos":
        return "los3cerditos"
    return s


def ensure_out_dir() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)


def atomic_write(path: str, content: str) -> None:
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        f.write(content)
    os.replace(tmp, path)


def parse_preguntas(p: Any) -> List[Dict[str, Any]]:
    if not p:
        return []
    if isinstance(p, list):
        return p
    if isinstance(p, str):
        try:
            return json.loads(p)
        except Exception:
            return []
    return []


def main() -> None:
    with open(PATH_JSON, "r", encoding="utf-8") as f:
        data = json.load(f)

    cuentos = data.get("cuentos") or []
    if not isinstance(cuentos, list):
        raise SystemExit("cuentos.json: campo 'cuentos' no es lista")

    ensure_out_dir()

    # Mensajes fijos (QUIZ_DONE_MESSAGES y panel final) copiados del frontend.
    quiz_done_messages = [
        "¡Bravo! Has respondido todas las preguntas. Eres un explorador de cuentos muy valiente. ¡Sigue leyendo y soñando!",
        "¡Lo lograste! Cada respuesta que diste es una estrella en tu mente. ¡Estamos muy orgullosos de ti!",
        "¡Genial! Aprendes un poquito más cada día. Así se hace: curiosidad, esfuerzo y mucha imaginación.",
        "¡Fantástico! Has terminado el cuestionario como un campeón. Los cuentos te abren puertas a mundos increíbles.",
        "¡Muy bien! Tu cabeza brilla como un tesoro. Sigue así: leer y preguntar te hace más fuerte cada día.",
        "¡Increíble! Completaste todas las preguntas. Eso demuestra que prestaste atención y que te gusta aprender. ¡Eres genial!",
        "¡Felicitaciones! Eres un lector valiente. Cada cuento que escuchas y cada pregunta que respondes te hace crecer.",
        "¡Qué bien! Terminaste el cuestionario con todo tu esfuerzo. Recuerda: leer es un superpoder que llevas dentro.",
        "¡Sí se puede! Respondiste todo el cuestionario. Eres capaz de muchas cosas bonitas cuando te concentras.",
        "¡Enhorabuena! Has llegado al final de las preguntas. Sigue disfrutando los cuentos: son magia para el corazón y la mente.",
        "¡Eres una estrella! Cada pregunta superada es un pasito más hacia ser un gran lector. ¡Sigue así!",
        "¡Qué orgullo! Escuchaste con atención y lo demostraste con tus respuestas. Los cuentos te acompañan siempre.",
        "¡Brillante! Tu imaginación y tu esfuerzo hacen equipo. ¡El próximo cuento te espera con más aventuras!",
        "¡Campeón o campeona del cuento! Terminaste las preguntas con alegría. Eso también es aprender jugando.",
        "¡Tú puedes! Las historias te enseñan cosas sin que casi te des cuenta. ¡Sigue preguntando y descubriendo!",
        "¡Un aplauso para ti! Completar el cuestionario no es fácil, y tú lo lograste. ¡Eres muy capaz!",
        "¡Magia pura! Cuando lees y respondes, entrenas tu memoria y tu corazón. ¡Eres increíble!",
        "¡Súper! Las respuestas correctas importan, pero lo más bonito es que te hayas atrevido a intentarlo todo.",
        "¡Héroe o heroína de la lectura! Cada cuento te deja algo bueno. ¡Hoy te dejó una sonrisa y un ¡muy bien hecho!",
        "¡Dale una estrella a tu esfuerzo! Terminaste el cuestionario. El mundo de los cuentos siempre te abrirá la puerta.",
    ]

    endpanel_con_preguntas = "¡Has llegado al final del cuento! ¿Quieres responder algunas preguntas sobre la historia o prefieres escuchar otro cuento?"
    endpanel_sin_preguntas = "¡Has llegado al final del cuento! ¿Quieres escuchar otro cuento?"

    # Limpiar salida anterior (solo txt de este módulo)
    for fn in os.listdir(OUT_DIR):
        if fn.startswith("config_") and fn.endswith(".txt"):
            try:
                os.remove(os.path.join(OUT_DIR, fn))
            except Exception:
                pass

    atomic_write(os.path.join(OUT_DIR, "config_endpanel_con_preguntas.txt"), endpanel_con_preguntas)
    atomic_write(os.path.join(OUT_DIR, "config_endpanel_sin_preguntas.txt"), endpanel_sin_preguntas)

    for i, msg in enumerate(quiz_done_messages, start=1):
        atomic_write(os.path.join(OUT_DIR, f"config_quiz_done_{i:02d}.txt"), msg)

    # Por cada entrada cuento (pueden existir versiones hombre/mujer con mismo titulo),
    # exportamos SOLO una vez por base slug.
    exported_question_keys = set()

    for c in cuentos:
        if not isinstance(c, dict):
            continue
        titulo = c.get("titulo") or ""
        slug = slugify_title_for_assets(str(titulo))
        preguntas = parse_preguntas(c.get("preguntas"))
        if not preguntas:
            continue
        for qidx, q in enumerate(preguntas, start=1):
            p = q.get("p") or q.get("pregunta") or ""
            opciones = q.get("opciones") or []
            correcta = q.get("correcta")

            # texto exacto que genera speakQuestionAndOptions:
            # questionLabel = "{n}. {p}"
            question_label = f"{qidx}. {p}"
            parts = ["Pregunta. " + question_label]
            if opciones and isinstance(opciones, list):
                for opt_i, op in enumerate(opciones, start=1):
                    parts.append("Opción " + str(opt_i) + ": " + str(op))
            spoken_text = ". ".join(parts).replace("..", ".")

            key = (slug, qidx, spoken_text)
            if key in exported_question_keys:
                continue
            exported_question_keys.add(key)

            atomic_write(os.path.join(OUT_DIR, f"config_{slug}__q{qidx:02d}.txt"), spoken_text)

    total_q = len([f for f in os.listdir(OUT_DIR) if f.startswith("config_") and f.endswith(".txt")])
    print(f"Listo. Generados {total_q} TXT en {OUT_DIR}.")


if __name__ == "__main__":
    main()

