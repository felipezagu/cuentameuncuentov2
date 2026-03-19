import json
import os
import sys

"""
Sincroniza las portadas de la base de datos con las de `cuentos_portadas.json`.

- NO borra cuentos ni escenas.
- Solo actualiza `Story.portada` cuando encuentra coincidencia exacta por título.
"""


SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(SCRIPT_DIR)
sys.path.insert(0, ROOT)

PATH_JSON = os.path.join(ROOT, "cuentos_portadas.json")


def main() -> None:
    if not os.path.isfile(PATH_JSON):
        print("No se encuentra cuentos_portadas.json en la raíz del proyecto.")
        sys.exit(1)

    from backend.database import SessionLocal
    from backend.models import Story

    with open(PATH_JSON, "r", encoding="utf-8") as f:
        data = json.load(f)

    cuentos = data.get("cuentos") or []
    mapping: dict[str, str] = {}
    for c in cuentos:
        titulo = (c.get("titulo") or "").strip()
        portada = c.get("portada") or None
        if titulo and portada:
            mapping[titulo] = portada

    if not mapping:
        print("No se encontraron portadas en cuentos_portadas.json.")
        return

    db = SessionLocal()
    try:
        stories = db.query(Story).all()
        if not stories:
            print("No hay cuentos en la base de datos. Ejecuta primero cargar_cuentos_en_db.py.")
            return

        actualizados = 0
        sin_match = 0

        for story in stories:
            titulo = (story.titulo or "").strip()
            nueva_portada = mapping.get(titulo)
            if nueva_portada:
                if story.portada != nueva_portada:
                    story.portada = nueva_portada
                    actualizados += 1
            else:
                sin_match += 1

        db.commit()
        print(
            f"Portadas actualizadas para {actualizados} cuentos. "
            f"Sin coincidencia de título para {sin_match} cuentos."
        )
    finally:
        db.close()


if __name__ == "__main__":
    main()

