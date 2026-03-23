# -*- coding: utf-8 -*-
"""
Asigna autores reales (o atribución clásica) en cuentos.json.

Criterio:
- Obras de autor identificado -> nombre del autor.
- Cuentos/fábulas de tradición oral o atribuibles a recopiladores:
  se usa autor clásico/recopilador más reconocido.
"""

from __future__ import annotations

import json
import os
import re
import unicodedata


ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PATH_JSON = os.path.join(ROOT, "cuentos.json")


def strip_v2_suffix(title: str) -> str:
    t = str(title or "").strip()
    return re.sub(r"\(\s*v2[^)]*narrador[^)]*\)\s*$", "", t, flags=re.I).strip()


def normalize_key(s: str) -> str:
    s = strip_v2_suffix(s)
    s = unicodedata.normalize("NFD", s.lower())
    s = "".join(ch for ch in s if unicodedata.category(ch) != "Mn")
    s = re.sub(r"[^a-z0-9]+", "", s)
    return s


AUTHOR_BY_KEY = {
    "aladino": "Anónimo (tradición de Las mil y una noches)",
    "aliciaenelpaisdelasmaravillas": "Lewis Carroll",
    "blancanieves": "Hermanos Grimm (recopilación)",
    "caperucitaroja": "Charles Perrault (versión clásica)",
    "cenicienta": "Charles Perrault (versión clásica)",
    "elleonyelraton": "Esopo",
    "ellibrodelaselva": "Rudyard Kipling",
    "elmagodeoz": "L. Frank Baum",
    "elpastorcitomentiroso": "Esopo",
    "elpatitofeo": "Hans Christian Andersen",
    "elperroysureflejo": "Esopo",
    "elprincipito": "Antoine de Saint-Exupéry",
    "elreymidas": "Mito de tradición griega (atribuido en fuentes clásicas como Ovidio)",
    "elsastrecillovaliente": "Hermanos Grimm (recopilación)",
    "eltrajenuevodelemperador": "Hans Christian Andersen",
    "elzorroylaciguena": "Esopo",
    "elzorroylasuvas": "Esopo",
    "hanselygretel": "Hermanos Grimm (recopilación)",
    "labelladurmiente": "Charles Perrault (versión clásica)",
    "labellaylabestia": "Jeanne-Marie Leprince de Beaumont",
    "lacigarraylahormiga": "Esopo",
    "lagallinadeloshuevosdeoro": "Esopo",
    "lahormigaylapaloma": "Esopo",
    "lalechera": "Félix María de Samaniego",
    "laliebreylatortuga": "Esopo",
    "laprincesayelguisante": "Hans Christian Andersen",
    "laratitapresumida": "Tradición popular española",
    "lasirenita": "Hans Christian Andersen",
    "lazorrayelcuervo": "Esopo",
    "lostrescerditos": "Joseph Jacobs (versión popular inglesa)",
    "losmusicosdebremen": "Hermanos Grimm (recopilación)",
    "lossietecabritillos": "Hermanos Grimm (recopilación)",
    "peterpan": "J. M. Barrie",
    "pinocho": "Carlo Collodi",
    "rapunzel": "Hermanos Grimm (recopilación)",
    "ricitosdeoro": "Robert Southey (versión literaria clásica)",
    "elgatoconbotas": "Charles Perrault",
    "elflautistadehamelin": "Leyenda alemana (popularizada por los Hermanos Grimm)",
}


def main() -> None:
    with open(PATH_JSON, "r", encoding="utf-8") as f:
        data = json.load(f)

    cuentos = data.get("cuentos") or []
    updated = 0
    missing = set()

    for c in cuentos:
        if not isinstance(c, dict):
            continue
        k = normalize_key(c.get("titulo", ""))
        author = AUTHOR_BY_KEY.get(k)
        if author:
            c["autor"] = author
            updated += 1
        else:
            c["autor"] = c.get("autor") or "Autor desconocido"
            missing.add(c.get("titulo", ""))

    data["cuentos"] = cuentos
    with open(PATH_JSON, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"Autores asignados en {updated} entradas. Títulos sin mapeo: {len(missing)}")
    if missing:
        print("Sin mapeo:", sorted(missing))


if __name__ == "__main__":
    main()

