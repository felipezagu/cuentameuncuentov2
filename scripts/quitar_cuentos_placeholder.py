# -*- coding: utf-8 -*-
"""
Elimina los cuentos que empiezan con texto genérico (placeholder), por ejemplo:
"Érase una vez algo relacionado con... Todo empezó en un lugar muy bonito."
Los quita de la base de datos y también del archivo cuentos.json si existe.
"""
import json
import os
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(SCRIPT_DIR)
sys.path.insert(0, ROOT)

PATH_JSON = os.path.join(ROOT, "cuentos.json")
TEXTO_GENERICO_1 = "Érase una vez algo relacionado con"
TEXTO_GENERICO_2 = "Todo empezó en un lugar muy bonito."


def tiene_texto_generico(cuento):
    escenas = cuento.get("escenas") or []
    if not escenas:
        return False
    texto = (escenas[0].get("texto") or "").strip()
    return TEXTO_GENERICO_1 in texto or TEXTO_GENERICO_2 in texto


def filtrar_json():
    if not os.path.isfile(PATH_JSON):
        return 0
    with open(PATH_JSON, "r", encoding="utf-8") as f:
        data = json.load(f)
    cuentos = data.get("cuentos") or []
    original = len(cuentos)
    data["cuentos"] = [c for c in cuentos if not tiene_texto_generico(c)]
    with open(PATH_JSON, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    return original - len(data["cuentos"])


def main():
    # 1. Filtrar cuentos.json
    quitados_json = filtrar_json()
    if quitados_json > 0:
        print(f"En cuentos.json: se quitaron {quitados_json} cuentos con texto genérico.")

    # 2. Borrar de la base de datos
    from backend.database import SessionLocal
    from backend.models import Story, Scene

    db = SessionLocal()
    try:
        stories = db.query(Story).all()
        borrados = 0
        for story in stories:
            first_scene = (
                db.query(Scene)
                .filter(Scene.story_id == story.id)
                .order_by(Scene.orden)
                .first()
            )
            if not first_scene or not first_scene.texto:
                continue
            texto = first_scene.texto.strip()
            if TEXTO_GENERICO_1 in texto or TEXTO_GENERICO_2 in texto:
                db.delete(story)
                borrados += 1
                print(f"  Eliminado: {story.titulo}")
        db.commit()
        print(f"En la base de datos: se eliminaron {borrados} cuentos con texto genérico.")
        print("Recarga la página de la app para ver los cambios.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
