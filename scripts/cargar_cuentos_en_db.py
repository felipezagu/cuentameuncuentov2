# -*- coding: utf-8 -*-
"""
Carga en la base de datos los cuentos de cuentos.json.

Borra todos los cuentos actuales y los reemplaza por los del JSON
(acepta el formato nuevo con "narraciones" y el antiguo con narracion_audio/sync).

    python scripts/cargar_cuentos_en_db.py
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
    n = load_cuentos_json(path)
    print(f"Listo. Hay {n} cuentos en la base de datos. Recarga la app para verlos.")


if __name__ == "__main__":
    main()
