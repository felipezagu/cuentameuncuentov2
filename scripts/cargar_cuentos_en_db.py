# -*- coding: utf-8 -*-
"""
Sincroniza la base de datos con cuentos.json (la fuente de verdad de los cuentos).

Actualiza cada cuento en su lugar (por su "id"), así se conservan las estadísticas de
lecturas y las URLs /cuento/<id>. Los cuentos que no estén en el JSON se borran.
Railway lo ejecuta en cada despliegue.

    python scripts/cargar_cuentos_en_db.py            # sincronizar (recomendado)
    python scripts/cargar_cuentos_en_db.py --reset    # borrar todo y cargar de cero
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from backend.db_init import load_cuentos_json  # noqa: E402


def main():
    path = ROOT / "cuentos.json"
    if not path.is_file():
        print("No se encuentra cuentos.json en la raíz del proyecto.")
        sys.exit(1)
    n = load_cuentos_json(path, reset="--reset" in sys.argv)
    print(f"Listo. Hay {n} cuentos en la base de datos.")


if __name__ == "__main__":
    main()
