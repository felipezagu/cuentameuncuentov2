"""Contadores de visitas y lecturas (en segundo plano para no bloquear la página)."""
import os
import threading
from datetime import date

from .database import SessionLocal
from .models import DailyStat, StoryStat


def stats_enabled() -> bool:
    return os.getenv("DISABLE_STATS") != "1"


def _today_stat(db) -> DailyStat:
    today = date.today().isoformat()
    stat = db.query(DailyStat).filter(DailyStat.date == today).first()
    if not stat:
        stat = DailyStat(date=today, visits_total=0, story_reads_total=0)
        db.add(stat)
    return stat


def bump_daily_visits() -> None:
    db = SessionLocal()
    try:
        _today_stat(db).visits_total += 1
        db.commit()
    finally:
        db.close()


def bump_story_read(story_id: int) -> None:
    db = SessionLocal()
    try:
        _today_stat(db).story_reads_total += 1
        sstat = db.get(StoryStat, story_id)
        if not sstat:
            sstat = StoryStat(story_id=story_id, read_count=0)
            db.add(sstat)
        sstat.read_count += 1
        db.commit()
    finally:
        db.close()


def run_in_background(fn) -> None:
    """
    Evita bloquear requests por locks de SQLite (PythonAnywhere/uWSGI multi-worker).
    Si algo falla, lo ignoramos para que la página cargue igual.
    """
    def _wrapper():
        try:
            fn()
        except Exception:
            pass

    threading.Thread(target=_wrapper, daemon=True).start()
