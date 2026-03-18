import json
import os
import time
from pathlib import Path
from typing import Annotated

from dotenv import load_dotenv

from fastapi import Depends, FastAPI, Form, HTTPException, Request

# Cargar .env.local y .env para LUMA_API_KEY, etc.
load_dotenv(Path(__file__).resolve().parent.parent / ".env.local")
load_dotenv(Path(__file__).resolve().parent.parent / ".env")
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.middleware.sessions import SessionMiddleware

from .database import Base, engine, SessionLocal
from .models import Story, Scene, DailyStat, StoryStat
from .routes import stories as stories_router
from .routes import admin as admin_router

BASE_DIR = Path(__file__).resolve().parent.parent

app = FastAPI(title="Cuéntame un Cuento")

app.add_middleware(SessionMiddleware, secret_key="super-secret-cuentos")

@app.middleware("http")
async def _request_timing_log(request: Request, call_next):
    start = time.monotonic()
    path = request.url.path
    method = request.method
    print(f"[req] start {method} {path}", flush=True)
    try:
        response = await call_next(request)
        return response
    finally:
        dur_ms = int((time.monotonic() - start) * 1000)
        print(f"[req] end   {method} {path} {dur_ms}ms", flush=True)


@app.get("/healthz")
async def healthz():
    return {"ok": True}

templates = Jinja2Templates(directory=str(BASE_DIR / "frontend" / "templates"))

static_dir = BASE_DIR / "frontend" / "static"
static_dir.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

uploads_dir = BASE_DIR / "uploads"
(uploads_dir / "portadas").mkdir(parents=True, exist_ok=True)
(uploads_dir / "escenas").mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

imagenes_dir = BASE_DIR / "imagenes"
imagenes_dir.mkdir(parents=True, exist_ok=True)
app.mount("/imagenes", StaticFiles(directory=str(imagenes_dir)), name="imagenes")

data_dir = BASE_DIR / "data"
data_dir.mkdir(exist_ok=True)


def init_db():
    Base.metadata.create_all(bind=engine)
    # Añadir columna preguntas si no existe (DBs antiguas)
    from sqlalchemy import text
    with engine.connect() as conn:
        r = conn.execute(text("PRAGMA table_info(stories)"))
        cols = [row[1] for row in r]
        if "preguntas" not in cols:
            conn.execute(text("ALTER TABLE stories ADD COLUMN preguntas TEXT"))
            conn.commit()
        if "luma_revisado" not in cols:
            conn.execute(text("ALTER TABLE stories ADD COLUMN luma_revisado BOOLEAN DEFAULT 0"))
            conn.commit()


def seed_demo_data():
    from .database import SessionLocal
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
                escena = Scene(
                    story_id=story.id,
                    orden=i,
                    texto=texto,
                    imagen=portada,
                )
                db.add(escena)
            if idx < len(preguntas_seed):
                story.preguntas = json.dumps(preguntas_seed[idx])

        db.commit()
    finally:
        db.close()


@app.on_event("startup")
def on_startup():
    """
    En hosting tipo PythonAnywhere (uWSGI con múltiples workers), ejecutar migraciones/seed
    automáticamente puede provocar locks en SQLite y timeouts ("harakiri").

    Por defecto NO hacemos init/seed en startup. Para habilitarlo explícitamente:
    - AUTO_INIT_DB=1
    - AUTO_SEED_DEMO=1
    """
    if os.getenv("AUTO_INIT_DB") == "1":
        init_db()

    if os.getenv("AUTO_SEED_DEMO") == "1":
        # Ejecutar seed en segundo plano para no bloquear el arranque
        import threading

        def _run_seed():
            seed_demo_data()

        threading.Thread(target=_run_seed, daemon=True).start()


app.include_router(stories_router.router)
app.include_router(admin_router.router)


from datetime import date
import threading


def _bump_daily_visits(db):
  today = date.today().isoformat()
  stat = db.query(DailyStat).filter(DailyStat.date == today).first()
  if not stat:
      stat = DailyStat(date=today, visits_total=0, story_reads_total=0)
      db.add(stat)
  stat.visits_total += 1


def _bump_story_read(db, story_id: int):
  today = date.today().isoformat()
  stat = db.query(DailyStat).filter(DailyStat.date == today).first()
  if not stat:
      stat = DailyStat(date=today, visits_total=0, story_reads_total=0)
      db.add(stat)
  stat.story_reads_total += 1
  sstat = db.query(StoryStat).filter(StoryStat.story_id == story_id).first()
  if not sstat:
      sstat = StoryStat(story_id=story_id, read_count=0)
      db.add(sstat)
  sstat.read_count += 1


def _run_in_background(fn):
    """
    Evita bloquear requests por locks de SQLite (PythonAnywhere/uWSGI multi-worker).
    Si algo falla, lo ignoramos para que la página cargue igual.
    """
    def _wrapper():
        try:
            fn()
        except Exception:
            # No queremos tumbar la request por estadísticas
            pass

    threading.Thread(target=_wrapper, daemon=True).start()


@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    if os.getenv("DISABLE_STATS") == "1":
        return templates.TemplateResponse("index.html", {"request": request})

    def _bump():
        db = SessionLocal()
        try:
            _bump_daily_visits(db)
            db.commit()
        finally:
            db.close()

    _run_in_background(_bump)
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/cuento/{story_id}", response_class=HTMLResponse)
async def story_page(request: Request, story_id: int):
    if os.getenv("DISABLE_STATS") == "1":
        return templates.TemplateResponse(
            "story.html", {"request": request, "story_id": story_id}
        )

    def _bump():
        db = SessionLocal()
        try:
            _bump_story_read(db, story_id)
            db.commit()
        finally:
            db.close()

    _run_in_background(_bump)
    return templates.TemplateResponse(
        "story.html", {"request": request, "story_id": story_id}
    )


def is_admin(request: Request) -> bool:
    return bool(request.session.get("is_admin"))


@app.get("/admin", response_class=HTMLResponse)
async def admin_login_page(request: Request):
    if is_admin(request):
        return RedirectResponse(url="/admin/cuentos", status_code=302)
    return templates.TemplateResponse("admin_login.html", {"request": request})


@app.post("/admin/login")
async def admin_login(
    request: Request,
    password: Annotated[str, Form(...)] = "",
):
    # Clave única para acceder al panel de administración
    ADMIN_KEY = 'FELI14157!"#'
    if password == ADMIN_KEY:
        request.session["is_admin"] = True
        return RedirectResponse(url="/admin/cuentos", status_code=302)
    return templates.TemplateResponse(
        "admin_login.html",
        {"request": request, "error": "Clave incorrecta"},
        status_code=400,
    )


@app.get("/admin/logout")
async def admin_logout(request: Request):
    request.session.clear()
    return RedirectResponse(url="/admin", status_code=302)


@app.get("/admin/cuentos", response_class=HTMLResponse)
async def admin_stories_page(request: Request):
    if not is_admin(request):
        return RedirectResponse(url="/admin", status_code=302)
    return templates.TemplateResponse("admin_stories.html", {"request": request})


@app.get("/admin/estadisticas", response_class=HTMLResponse)
async def admin_stats_page(request: Request):
    if not is_admin(request):
        return RedirectResponse(url="/admin", status_code=302)
    db = SessionLocal()
    try:
        # Últimos 14 días
        daily = db.query(DailyStat).order_by(DailyStat.date.desc()).limit(14).all()
        daily = list(reversed(daily))
        total_visits = sum(d.visits_total for d in daily)
        total_reads = sum(d.story_reads_total for d in daily)
        top_stories = (
            db.query(StoryStat, Story)
            .join(Story, Story.id == StoryStat.story_id)
            .order_by(StoryStat.read_count.desc())
            .limit(5)
            .all()
        )
        context = {
            "request": request,
            "daily": daily,
            "total_visits": total_visits,
            "total_reads": total_reads,
            "top_stories": top_stories,
        }
        return templates.TemplateResponse("admin_stats.html", context)
    finally:
        db.close()

