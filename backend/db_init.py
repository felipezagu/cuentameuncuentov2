"""
Creación/migración de la base de datos y carga de cuentos.

- ``init_db()``: crea tablas, añade columnas que falten en BDs antiguas y
  migra las narraciones al modelo "1 cuento → varias voces". Es idempotente.
- ``load_cuentos_json()``: reemplaza los cuentos de la BD por los de ``cuentos.json``.
"""
import json
import re
from pathlib import Path

from sqlalchemy import text
from sqlalchemy.orm import Session

from .config import BASE_DIR
from .database import Base, SessionLocal, engine
from .models import Narration, Scene, Story, StoryAlias, StoryStat

VOCES = ("hombre", "mujer")

# Títulos antiguos tipo "Caperucita Roja (v2 – narrador mujer)"
_V2_VOICE_SUFFIX_RE = re.compile(r"\(\s*v2[^)]*narrador\s*(mujer|hombre)\s*\)\s*$", re.I)


def voz_from_audio(url: str | None) -> str | None:
    """Detecta la voz a partir del nombre del MP3 (convención: ...hombre.mp3 / ...mujer.mp3)."""
    u = (url or "").lower()
    if "mujer" in u:
        return "mujer"
    if "hombre" in u:
        return "hombre"
    return None


def base_title(titulo: str | None) -> str:
    t = (titulo or "").strip()
    return _V2_VOICE_SUFFIX_RE.sub("", t).strip()


def _title_key(titulo: str | None) -> str:
    return re.sub(r"\s+", " ", base_title(titulo)).casefold()


# ---------------------------------------------------------------------------
# Esquema
# ---------------------------------------------------------------------------

def _add_missing_story_columns() -> None:
    """Añade columnas nuevas a BDs creadas con versiones anteriores."""
    with engine.connect() as conn:
        cols = {row[1] for row in conn.execute(text("PRAGMA table_info(stories)"))}
        for name, ddl in (
            ("preguntas", "TEXT"),
            ("luma_revisado", "BOOLEAN DEFAULT 0"),
            ("autor", "VARCHAR(200)"),
        ):
            if name not in cols:
                conn.execute(text(f"ALTER TABLE stories ADD COLUMN {name} {ddl}"))
        conn.commit()


def _migrate_legacy_narration_columns(db: Session) -> int:
    """Copia stories.narracion_audio/sync (modelo antiguo) a la tabla narrations."""
    cols = {row[1] for row in db.execute(text("PRAGMA table_info(stories)"))}
    if "narracion_audio" not in cols or "narracion_sync" not in cols:
        return 0
    rows = db.execute(
        text(
            "SELECT id, narracion_audio, narracion_sync FROM stories "
            "WHERE narracion_audio IS NOT NULL AND narracion_audio != '' "
            "AND narracion_sync IS NOT NULL AND narracion_sync != ''"
        )
    ).all()
    moved = 0
    for story_id, audio, sync in rows:
        voz = voz_from_audio(audio) or "hombre"
        exists = (
            db.query(Narration)
            .filter(Narration.story_id == story_id, Narration.voz == voz)
            .first()
        )
        if not exists:
            db.add(Narration(story_id=story_id, voz=voz, audio=audio.strip(), sync=sync.strip()))
            moved += 1
    db.execute(text("UPDATE stories SET narracion_audio = NULL, narracion_sync = NULL"))
    db.flush()
    return moved


def merge_voice_duplicates(db: Session) -> int:
    """
    Fusiona cuentos duplicados por voz (mismo título, distinta narración) en uno solo.

    Se conserva la copia con más escenas; las demás pasan sus narraciones y
    lecturas al cuento conservado y su id queda como alias (redirección 301).
    Solo se fusiona si las voces no chocan, para no perder nada.
    """
    groups: dict[str, list[Story]] = {}
    for s in db.query(Story).order_by(Story.id).all():
        groups.setdefault(_title_key(s.titulo), []).append(s)

    merged = 0
    for stories in groups.values():
        if len(stories) < 2:
            continue
        voces = [n.voz for s in stories for n in s.narraciones]
        if not voces or len(voces) != len(set(voces)):
            continue  # sin narraciones o voces repetidas: no es un duplicado por voz

        keep = max(stories, key=lambda s: (len(s.escenas), -s.id))
        keep.titulo = base_title(keep.titulo)
        keep_stat = db.get(StoryStat, keep.id)
        for other in stories:
            if other.id == keep.id:
                continue
            for n in list(other.narraciones):
                n.story_id = keep.id
            other_stat = db.get(StoryStat, other.id)
            if other_stat:
                if keep_stat is None:
                    keep_stat = StoryStat(story_id=keep.id, read_count=0)
                    db.add(keep_stat)
                keep_stat.read_count += other_stat.read_count
                db.delete(other_stat)
            db.query(StoryAlias).filter(StoryAlias.story_id == other.id).update(
                {StoryAlias.story_id: keep.id}
            )
            db.flush()
            db.expire(other, ["narraciones"])
            db.delete(other)
            db.flush()
            db.add(StoryAlias(old_id=other.id, story_id=keep.id))
            merged += 1
    db.flush()
    return merged


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    _add_missing_story_columns()
    db = SessionLocal()
    try:
        moved = _migrate_legacy_narration_columns(db)
        merged = merge_voice_duplicates(db)
        db.commit()
        if moved or merged:
            print(f"[init_db] narraciones migradas: {moved}, cuentos fusionados: {merged}", flush=True)
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Carga desde cuentos.json
# ---------------------------------------------------------------------------

def narraciones_from_json(c: dict) -> list[dict]:
    out = []
    for n in c.get("narraciones") or []:
        audio = (n.get("audio") or "").strip()
        sync = (n.get("sync") or "").strip()
        voz = (n.get("voz") or voz_from_audio(audio) or "").strip().lower()
        if audio and sync and voz:
            out.append({"voz": voz, "audio": audio, "sync": sync})
    # Formato antiguo: un MP3 por cuento
    audio = (c.get("narracion_audio") or "").strip()
    sync = (c.get("narracion_sync") or "").strip()
    if audio and sync:
        out.append({"voz": voz_from_audio(audio) or "hombre", "audio": audio, "sync": sync})
    return out


def load_cuentos_json(path: Path | None = None) -> int:
    """Borra los cuentos de la BD y carga los de cuentos.json. Devuelve cuántos quedaron."""
    path = path or (BASE_DIR / "cuentos.json")
    data = json.loads(path.read_text(encoding="utf-8"))
    cuentos = data.get("cuentos") or []

    init_db()
    db = SessionLocal()
    try:
        db.query(StoryAlias).delete()
        db.query(Story).delete()
        db.flush()
        for c in cuentos:
            preguntas = c.get("preguntas")
            if isinstance(preguntas, list):
                preguntas = json.dumps(preguntas, ensure_ascii=False)
            story = Story(
                titulo=base_title(c.get("titulo")) or "Sin título",
                descripcion=c.get("descripcion") or "",
                portada=c.get("portada") or None,
                categoria=c.get("categoria") or None,
                autor=c.get("autor") or None,
                ambiente=c.get("ambiente") or None,
                destacado=bool(c.get("destacado", False)),
                preguntas=preguntas or None,
            )
            db.add(story)
            db.flush()
            for i, e in enumerate(c.get("escenas") or [], start=1):
                db.add(
                    Scene(
                        story_id=story.id,
                        orden=int(e.get("orden") or i),
                        texto=e.get("texto") or "",
                        imagen=e.get("imagen") or None,
                    )
                )
            for n in narraciones_from_json(c):
                db.add(Narration(story_id=story.id, **n))
            db.flush()
        db.expire_all()
        merge_voice_duplicates(db)
        db.commit()
        return db.query(Story).count()
    finally:
        db.close()


def story_to_json(s: Story) -> dict:
    """Formato de un cuento en cuentos.json (inverso de load_cuentos_json)."""
    preguntas = None
    if s.preguntas:
        try:
            preguntas = json.loads(s.preguntas)
        except (TypeError, json.JSONDecodeError):
            preguntas = None
    return {
        "titulo": s.titulo,
        "descripcion": s.descripcion or "",
        "portada": s.portada or "",
        "categoria": s.categoria or "",
        "autor": s.autor or "",
        "ambiente": s.ambiente or "",
        "destacado": bool(s.destacado),
        "preguntas": preguntas or [],
        "narraciones": [
            {"voz": n.voz, "audio": n.audio, "sync": n.sync} for n in s.narraciones
        ],
        "escenas": [
            {"orden": e.orden, "texto": e.texto, "imagen": e.imagen or ""} for e in s.escenas
        ],
    }


# ---------------------------------------------------------------------------
# Demo (solo si la BD está vacía y AUTO_SEED_DEMO=1)
# ---------------------------------------------------------------------------

def seed_demo_data() -> None:
    from . import seed_data

    db = SessionLocal()
    try:
        if db.query(Story).count() > 0:
            return
        demos = seed_data.get_demos()
        escena_textos = seed_data.get_escena_textos()
        preguntas_seed = seed_data.get_preguntas_seed()
        for idx, (demo, escenas) in enumerate(zip(demos, escena_textos)):
            titulo, descripcion, portada = demo[0], demo[1], demo[2]
            categoria = demo[3] if len(demo) > 3 else None
            story = Story(
                titulo=titulo,
                descripcion=descripcion,
                portada=portada,
                categoria=categoria,
                destacado=True,
            )
            db.add(story)
            db.flush()
            for i, texto in enumerate(escenas, start=1):
                db.add(Scene(story_id=story.id, orden=i, texto=texto, imagen=portada))
            if idx < len(preguntas_seed):
                story.preguntas = json.dumps(preguntas_seed[idx])
        db.commit()
    finally:
        db.close()
