"""Páginas HTML del panel de administración (login, cuentos, estadísticas)."""
import hmac
import os
from typing import Annotated

from fastapi import APIRouter, Form, Request
from fastapi.responses import HTMLResponse, RedirectResponse

from ..config import templates
from ..database import SessionLocal
from ..models import DailyStat, Story, StoryStat
from ..security import ensure_localhost_only, is_admin

router = APIRouter(tags=["admin-pages"])


@router.get("/admin", response_class=HTMLResponse)
async def admin_login_page(request: Request):
    ensure_localhost_only(request)
    if is_admin(request):
        return RedirectResponse(url="/admin/cuentos", status_code=302)
    return templates.TemplateResponse("admin_login.html", {"request": request})


@router.post("/admin/login")
async def admin_login(
    request: Request,
    password: Annotated[str, Form(...)] = "",
):
    ensure_localhost_only(request)
    # Clave del panel: define ADMIN_KEY en .env o .env.local (no en el código)
    admin_key = (os.getenv("ADMIN_KEY") or "").strip()
    if not admin_key:
        return templates.TemplateResponse(
            "admin_login.html",
            {
                "request": request,
                "error": "Panel no configurado: falta la variable ADMIN_KEY en el servidor.",
            },
            status_code=503,
        )
    if hmac.compare_digest(password.encode("utf-8"), admin_key.encode("utf-8")):
        request.session["is_admin"] = True
        return RedirectResponse(url="/admin/cuentos", status_code=302)
    return templates.TemplateResponse(
        "admin_login.html",
        {"request": request, "error": "Clave incorrecta"},
        status_code=400,
    )


@router.get("/admin/logout")
async def admin_logout(request: Request):
    ensure_localhost_only(request)
    request.session.clear()
    return RedirectResponse(url="/admin", status_code=302)


@router.get("/admin/cuentos", response_class=HTMLResponse)
async def admin_stories_page(request: Request):
    ensure_localhost_only(request)
    if not is_admin(request):
        return RedirectResponse(url="/admin", status_code=302)
    return templates.TemplateResponse("admin_stories.html", {"request": request})


@router.get("/admin/estadisticas", response_class=HTMLResponse)
async def admin_stats_page(request: Request):
    ensure_localhost_only(request)
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
