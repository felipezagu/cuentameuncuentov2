"""'Crea tu cuento': página y API que arma un cuento con lo que elige el niño."""
from fastapi import APIRouter, Request
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import HTMLResponse

from ..config import templates
from ..story_maker import OPCIONES, ai_enabled, make_story

router = APIRouter(tags=["crea-tu-cuento"])


def _client_ip(request: Request) -> str:
    fwd = request.headers.get("x-forwarded-for") or ""
    return fwd.split(",")[0].strip() or (request.client.host if request.client else "")


@router.get("/crea-tu-cuento", response_class=HTMLResponse)
async def crea_page(request: Request):
    return templates.TemplateResponse(
        "crea.html", {"request": request, "adsense_enabled": True, "opciones": OPCIONES}
    )


@router.get("/api/crea-cuento/opciones")
async def crea_opciones():
    return {**OPCIONES, "ia": ai_enabled()}


@router.post("/api/crea-cuento")
async def crea_cuento(request: Request):
    try:
        form = await request.json()
    except Exception:
        form = {}
    if not isinstance(form, dict):
        form = {}
    # La llamada a la IA es bloqueante (httpx síncrono): fuera del event loop.
    return await run_in_threadpool(make_story, form, _client_ip(request))
