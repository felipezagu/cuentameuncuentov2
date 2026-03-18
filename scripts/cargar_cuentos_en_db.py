# -*- coding: utf-8 -*-
"""
Carga en la base de datos los cuentos que hay en cuentos.json.
Borra todos los cuentos actuales y los reemplaza por los del JSON.
Así la app mostrará solo lo que está en cuentos.json (p. ej. los 38 reales).
"""
import json
import os
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(SCRIPT_DIR)
sys.path.insert(0, ROOT)

PATH_JSON = os.path.join(ROOT, "cuentos.json")


def main():
    if not os.path.isfile(PATH_JSON):
        print("No se encuentra cuentos.json en la raíz del proyecto.")
        sys.exit(1)

    from backend.database import SessionLocal
    from backend.models import Story, Scene

    with open(PATH_JSON, "r", encoding="utf-8") as f:
        data = json.load(f)
    cuentos = data.get("cuentos") or []

    db = SessionLocal()
    try:
        # Borrar todos los cuentos (las escenas se borran en cascada)
        db.query(Story).delete()
        db.commit()

        for c in cuentos:
            titulo = c.get("titulo") or "Sin título"
            descripcion = c.get("descripcion") or ""
            portada = c.get("portada") or None
            categoria = c.get("categoria") or None
            ambiente = c.get("ambiente") or None
            destacado = bool(c.get("destacado", False))
            preguntas = c.get("preguntas")
            if isinstance(preguntas, list):
                preguntas = json.dumps(preguntas)
            escenas_data = c.get("escenas") or []
            story = Story(
                titulo=titulo,
                descripcion=descripcion,
                portada=portada,
                categoria=categoria,
                ambiente=ambiente,
                destacado=destacado,
                preguntas=preguntas,
            )
            db.add(story)
            db.flush()
            for e in escenas_data:
                scene = Scene(
                    story_id=story.id,
                    orden=int(e.get("orden", 1)),
                    texto=e.get("texto") or "",
                    imagen=e.get("imagen"),
                )
                db.add(scene)
        db.commit()
        print(f"Listo. Se cargaron {len(cuentos)} cuentos en la base de datos. Recarga la página de la app para ver solo estos.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
