"""Control de acceso al panel admin y a las herramientas internas."""
import hashlib
import ipaddress
import os
import secrets

from fastapi import HTTPException, Request

from .config import env_flag


def session_secret() -> str:
    """
    Clave para firmar la cookie de sesión.

    Usa SESSION_SECRET si existe. Si no, la deriva de ADMIN_KEY (estable entre
    workers y reinicios). Como último recurso genera una aleatoria por proceso
    (las sesiones admin se pierden al reiniciar, pero nunca queda una clave fija en el código).
    """
    explicit = (os.getenv("SESSION_SECRET") or "").strip()
    if explicit:
        return explicit
    admin_key = (os.getenv("ADMIN_KEY") or "").strip()
    if admin_key:
        return hashlib.sha256(("cuc-session:" + admin_key).encode("utf-8")).hexdigest()
    return secrets.token_hex(32)


def _request_host(request: Request) -> str:
    host = (request.headers.get("host") or "").strip().lower()
    if host.startswith("["):  # IPv6 con puerto: [::1]:8000
        return host[1:].split("]")[0]
    return host.split(":")[0]


def is_admin_tools_request_allowed(request: Request) -> bool:
    """
    Admin y /tools solo en entorno local:
    - localhost / 127.0.0.1 / ::1
    - IP privada (p. ej. abres la app como http://192.168.x.x:8000 desde la misma red)
    - o ALLOW_ADMIN_TOOLS=1 en .env (solo si sabes lo que haces; no en producción pública)
    """
    if env_flag("ALLOW_ADMIN_TOOLS"):
        return True
    host = _request_host(request)
    if host in {"localhost", "127.0.0.1", "::1"}:
        return True
    try:
        ip = ipaddress.ip_address(host)
        return bool(ip.is_loopback or ip.is_private)
    except ValueError:
        return False


def ensure_localhost_only(request: Request) -> None:
    # En producción pública (dominio normal) ocultamos admin/tools.
    if not is_admin_tools_request_allowed(request):
        raise HTTPException(status_code=404, detail="Not Found")


def is_admin(request: Request) -> bool:
    return bool(request.session.get("is_admin"))


def require_admin(request: Request) -> None:
    """Dependencia para la API de administración: host permitido + sesión iniciada."""
    ensure_localhost_only(request)
    if not is_admin(request):
        raise HTTPException(status_code=401, detail="Inicia sesión en /admin")
