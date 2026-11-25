# -*- coding: utf-8 -*-
"""
Añade a la base de datos los cuentos populares con versión completa
que están en cuentos_reales.py. No borra los que ya existen; solo inserta
los que aún no están (por título).
"""
import json
import os
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(SCRIPT_DIR)
sys.path.insert(0, SCRIPT_DIR)
sys.path.insert(0, ROOT)

from cuentos_reales import get_mejoras


# Categoría por defecto para cada cuento (opcional; si no está, se usa "Clásicos")
CATEGORIAS = {
    "La Liebre y la Tortuga": "Fábulas",
    "El León y el Ratón": "Fábulas",
    "La Cigarra y la Hormiga": "Fábulas",
    "El Zorro y la Cigüeña": "Fábulas",
    "La Gallina de los Huevos de Oro": "Fábulas",
    "El Pastorcito Mentiroso": "Fábulas",
    "El Zorro y las Uvas": "Fábulas",
    "La Lechera": "Fábulas",
    "El Perro y su Reflejo": "Fábulas",
    "La Hormiga y la Paloma": "Fábulas",
    "La Zorra y el Cuervo": "Fábulas",
    "La Princesa y el Guisante": "Princesas",
    "La Bella y la Bestia": "Princesas",
    "Rapunzel": "Princesas",
    "El Traje Nuevo del Emperador": "Fábulas",
    "El Rey Midas": "Clásicos",
    "Peter Pan": "Aventuras",
    "El Mago de Oz": "Aventuras",
    "Alicia en el País de las Maravillas": "Aventuras",
    "El Principito": "Clásicos",
    "El Libro de la Selva": "Aventuras",
    "Aladino": "Aventuras",
}


def main():
    from backend.database import SessionLocal
    from backend.models import Story, Scene

    mejoras = get_mejoras()
    db = SessionLocal()
    try:
        # Títulos que ya existen en la base de datos
        existentes = {s.titulo for s in db.query(Story.titulo).all()}
        agregados = 0
        for titulo, data in mejoras.items():
            if titulo in existentes:
                continue
            descripcion = data.get("descripcion") or ""
            categoria = CATEGORIAS.get(titulo, "Clásicos")
            preguntas = data.get("preguntas")
            if isinstance(preguntas, list):
                preguntas = json.dumps(preguntas, ensure_ascii=False)
            story = Story(
                titulo=titulo,
                descripcion=descripcion,
                portada=None,
                categoria=categoria,
                ambiente=None,
                destacado=True,
                preguntas=preguntas,
            )
            db.add(story)
            db.flush()
            for e in data.get("escenas") or []:
                scene = Scene(
                    story_id=story.id,
                    orden=int(e.get("orden", 1)),
                    texto=e.get("texto") or "",
                    imagen=e.get("imagen"),
                )
                db.add(scene)
            agregados += 1
            print(f"  Añadido: {titulo}")
        db.commit()
        total = db.query(Story).count()
        print(f"Listo. Se añadieron {agregados} cuentos populares. Total en la app: {total}. Recarga la página.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
