"""
Punto de entrada de la app FastAPI.

Aquí solo se arma la aplicación: middlewares, archivos estáticos y routers.
La lógica vive en:
- routes/pages.py        páginas públicas (inicio, cuento, contacto, SEO)
- routes/stories.py      API pública de cuentos (/api/stories)
- routes/admin.py        API de administración (/api/admin, requiere login)
- routes/admin_pages.py  páginas del panel /admin
- routes/tools.py        herramientas locales de narración (/tools)
- db_init.py             creación/migración de la BD y carga de cuentos.json
"""
import os
import threading
import time

from fastapi import Depends, FastAPI, Request
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware

from .config import DATA_DIR, IMAGENES_DIR, STATIC_DIR, UPLOADS_DIR, env_flag
from .db_init import init_db, seed_demo_data
from .routes import admin as admin_router
from .routes import admin_pages, pages, tools
from .routes import stories as stories_router
from .security import require_admin, session_secret

app = FastAPI(title="Cuéntame un Cuento")

app.add_middleware(SessionMiddleware, secret_key=session_secret(), same_site="lax")


if env_flag("REQUEST_LOG"):
    @app.middleware("http")
    async def _request_timing_log(request: Request, call_next):
        start = time.monotonic()
        try:
            return await call_next(request)
        finally:
            dur_ms = int((time.monotonic() - start) * 1000)
            print(f"[req] {request.method} {request.url.path} {dur_ms}ms", flush=True)


# --- Archivos estáticos -----------------------------------------------------
for d in (STATIC_DIR, IMAGENES_DIR, DATA_DIR, UPLOADS_DIR / "portadas", UPLOADS_DIR / "escenas"):
    d.mkdir(parents=True, exist_ok=True)

app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")
app.mount("/imagenes", StaticFiles(directory=str(IMAGENES_DIR)), name="imagenes")


# --- Routers ------------------------------------------------------------------
app.include_router(stories_router.router)
app.include_router(admin_router.router, dependencies=[Depends(require_admin)])
app.include_router(pages.router)
app.include_router(admin_pages.router)
app.include_router(tools.router)


@app.on_event("startup")
def on_startup():
    """
    En hosting tipo PythonAnywhere (uWSGI con múltiples workers), ejecutar migraciones/seed
    automáticamente puede provocar locks en SQLite y timeouts ("harakiri").

    Por defecto NO hacemos init/seed en startup. Para habilitarlo explícitamente:
    - AUTO_INIT_DB=1   (crea tablas y migra; idempotente)
    - AUTO_SEED_DEMO=1

    En producción, tras actualizar el código, ejecuta una vez: python scripts/migrar_db.py

    En Railway (y similares) la carpeta `data/` no viene en el repo: sin tablas la app
    falla o queda vacía. Si existe RAILWAY_ENVIRONMENT, creamos tablas al arrancar.
    """
    if os.getenv("AUTO_INIT_DB") == "1" or os.getenv("RAILWAY_ENVIRONMENT"):
        init_db()
    if os.getenv("AUTO_SEED_DEMO") == "1":
        threading.Thread(target=seed_demo_data, daemon=True).start()
