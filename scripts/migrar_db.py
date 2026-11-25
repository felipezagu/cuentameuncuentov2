# -*- coding: utf-8 -*-
"""
Actualiza el esquema de la base de datos SIN borrar nada. Es seguro ejecutarlo varias veces.

- Crea las tablas nuevas (narrations, story_aliases).
- Pasa las narraciones del modelo antiguo (un cuento duplicado por voz) a
  "un cuento con varias voces". Los ids antiguos quedan como alias y sus URLs
  /cuento/<id> redirigen (301) al cuento unificado.

Ejecútalo una vez en el servidor después de actualizar el código:

    python scripts/migrar_db.py
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from backend.database import SessionLocal  # noqa: E402
from backend.db_init import init_db  # noqa: E402
from backend.models import Narration, Story, StoryAlias  # noqa: E402

if __name__ == "__main__":
    init_db()
    db = SessionLocal()
    try:
        print(
            f"OK: {db.query(Story).count()} cuentos, "
            f"{db.query(Narration).count()} narraciones, "
            f"{db.query(StoryAlias).count()} ids antiguos redirigidos."
        )
    finally:
        db.close()
