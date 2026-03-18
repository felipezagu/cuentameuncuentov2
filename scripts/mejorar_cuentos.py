# -*- coding: utf-8 -*-
"""
Script para mejorar cuentos.json: reemplaza los cuentos con texto placeholder
por versiones reales adaptadas (cuentos clásicos) y mejora el resto con una
narrativa breve coherente.
"""
import json
import os
import sys

# Añadir directorio scripts para importar cuentos_reales
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(SCRIPT_DIR)
sys.path.insert(0, SCRIPT_DIR)

from cuentos_reales import get_mejoras

PATH_JSON = os.path.join(ROOT, "cuentos.json")
PLACEHOLDER_MARKER = "Érase una vez algo relacionado con"


def es_placeholder(cuento):
    """True si el cuento tiene texto placeholder en la primera escena."""
    escenas = cuento.get("escenas") or []
    if not escenas:
        return False
    texto = (escenas[0].get("texto") or "").strip()
    return PLACEHOLDER_MARKER in texto


def aplicar_mejora(cuento, mejora):
    """Aplica la mejora al cuento manteniendo portada e imágenes originales."""
    escenas_orig = cuento.get("escenas") or []
    imagenes = [e.get("imagen") or "" for e in escenas_orig]
    # Asegurar 5 imágenes (repetir la última si hace falta)
    while len(imagenes) < 5:
        imagenes.append(imagenes[-1] if imagenes else "")
    imagenes = imagenes[:5]

    nuevas_escenas = []
    for i, esc in enumerate(mejora["escenas"]):
        orden = esc.get("orden", i + 1)
        texto = esc.get("texto", "")
        img = imagenes[i] if i < len(imagenes) else (cuento.get("portada") or "")
        nuevas_escenas.append({"orden": orden, "texto": texto, "imagen": img})
    cuento["descripcion"] = mejora["descripcion"]
    cuento["escenas"] = nuevas_escenas
    # Preguntas: en el JSON se guardan como string (JSON)
    preg = mejora.get("preguntas")
    if isinstance(preg, list):
        cuento["preguntas"] = json.dumps(preg, ensure_ascii=False)
    else:
        cuento["preguntas"] = preg or cuento.get("preguntas")


def narrativa_breve(titulo, categoria):
    """Genera 5 escenas mínimas coherentes para un cuento sin versión real."""
    titulo_lower = titulo.lower()
    return [
        {"orden": 1, "texto": f"Érase una vez un cuento que tenía que ver con {titulo_lower}. Todo comenzó en un lugar muy especial, donde los personajes vivían sus aventuras."},
        {"orden": 2, "texto": f"En esta historia pasaban cosas muy interesantes. Los protagonistas se enfrentaban a retos y conocían amigos. El tema de {titulo_lower} daba mucho juego."},
        {"orden": 3, "texto": "Llegó un momento en que todo parecía difícil. Pero con valor y ayuda, los personajes siguieron adelante. Cada cuento enseña algo importante."},
        {"orden": 4, "texto": "Poco a poco todo se fue arreglando. Los buenos actos y la amistad hicieron que la historia tuviera un rumbo feliz. Así son los cuentos que nos gustan."},
        {"orden": 5, "texto": f"Y colorín colorado, este cuento sobre {titulo_lower} se ha acabado. Si quieres saber más, busca la historia completa en un libro o pide que te la cuenten."},
    ]


def main():
    if not os.path.isfile(PATH_JSON):
        print("No se encuentra cuentos.json en la raíz del proyecto.")
        sys.exit(1)

    with open(PATH_JSON, "r", encoding="utf-8") as f:
        data = json.load(f)

    cuentos = data.get("cuentos") or []
    mejoras = get_mejoras()
    reemplazados = 0
    narrativa_fallback = 0

    for cuento in cuentos:
        titulo = (cuento.get("titulo") or "").strip()
        if titulo in mejoras:
            aplicar_mejora(cuento, mejoras[titulo])
            reemplazados += 1
            continue
        if not es_placeholder(cuento):
            continue
        # Fallback: narrativa breve para que no quede el placeholder
        categoria = cuento.get("categoria") or "Cuentos"
        escenas_nuevas = narrativa_breve(titulo, categoria)
        escenas_orig = cuento.get("escenas") or []
        imagenes = [e.get("imagen") or "" for e in escenas_orig]
        while len(imagenes) < 5:
            imagenes.append(imagenes[-1] if imagenes else cuento.get("portada") or "")
        imagenes = imagenes[:5]
        cuento["escenas"] = [
            {"orden": i + 1, "texto": esc["texto"], "imagen": imagenes[i]}
            for i, esc in enumerate(escenas_nuevas)
        ]
        cuento["descripcion"] = f"Cuento sobre {titulo.lower()}. Busca la historia completa en un libro para disfrutarla con todos los detalles."
        narrativa_fallback += 1

    with open(PATH_JSON, "w", encoding="utf-8") as f:
        json.dump({"cuentos": cuentos}, f, ensure_ascii=False, indent=2)

    print(f"Listo. Cuentos con versión real: {reemplazados}. Con narrativa breve: {narrativa_fallback}.")


def filtrar_solo_reales():
    """Deja en cuentos.json solo los cuentos con versión real completa; elimina el resto."""
    if not os.path.isfile(PATH_JSON):
        print("No se encuentra cuentos.json.")
        sys.exit(1)
    with open(PATH_JSON, "r", encoding="utf-8") as f:
        data = json.load(f)
    cuentos = data.get("cuentos") or []
    mejoras = get_mejoras()
    NARRATIVA_BREVE = "Érase una vez un cuento que tenía que ver con"
    def tiene_version_completa(c):
        if (c.get("titulo") or "").strip() in mejoras:
            return True
        escenas = c.get("escenas") or []
        if not escenas:
            return False
        texto = (escenas[0].get("texto") or "")
        if PLACEHOLDER_MARKER in texto or NARRATIVA_BREVE in texto:
            return False
        return True
    filtrados = [c for c in cuentos if tiene_version_completa(c)]
    data["cuentos"] = filtrados
    with open(PATH_JSON, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Quedaron {len(filtrados)} cuentos con versión completa. Se eliminaron {len(cuentos) - len(filtrados)}.")


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--solo-reales":
        filtrar_solo_reales()
    else:
        main()
