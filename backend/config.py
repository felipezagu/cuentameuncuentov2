"""Configuración compartida: rutas, variables de entorno y plantillas."""
import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi.templating import Jinja2Templates

BASE_DIR = Path(__file__).resolve().parent.parent

# .env.local tiene prioridad sobre .env (load_dotenv no pisa variables ya definidas)
load_dotenv(BASE_DIR / ".env.local")
load_dotenv(BASE_DIR / ".env")

SITE_URL = (os.getenv("SITE_URL") or "https://cuentameuncuento.cl").rstrip("/")

FRONTEND_DIR = BASE_DIR / "frontend"
STATIC_DIR = FRONTEND_DIR / "static"
IMAGENES_DIR = BASE_DIR / "imagenes"
UPLOADS_DIR = BASE_DIR / "uploads"
DATA_DIR = BASE_DIR / "data"

templates = Jinja2Templates(directory=str(FRONTEND_DIR / "templates"))


def env_flag(name: str) -> bool:
    return (os.getenv(name) or "").strip().lower() in ("1", "true", "yes", "on")
