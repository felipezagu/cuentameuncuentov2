"""Páginas públicas del sitio (inicio, cuento, legales, contacto, SEO)."""
import os
import re
import smtplib
from email.message import EmailMessage

from fastapi import APIRouter, Form, Request
from fastapi.responses import HTMLResponse, PlainTextResponse, RedirectResponse, Response

from fastapi.responses import FileResponse

from ..config import SITE_URL, STATIC_DIR, templates
from ..database import SessionLocal
from ..models import DailyStat, Story, StoryAlias, StoryStat
from ..stats import bump_daily_visits, bump_story_read, run_in_background, stats_enabled

router = APIRouter(tags=["pages"])


def _page(request: Request, template: str, **ctx):
    return templates.TemplateResponse(
        template, {"request": request, "adsense_enabled": True, **ctx}
    )


@router.get("/healthz")
async def healthz():
    return {"ok": True}


@router.get("/ads.txt", response_class=PlainTextResponse)
async def ads_txt():
    # Formato oficial de AdSense para autorización de inventario.
    return "google.com, pub-3994777682000954, DIRECT, f08c47fec0942fa0\n"


@router.get("/sw.js", include_in_schema=False)
async def service_worker():
    # Servido desde la raíz para que pueda controlar todo el sitio.
    return FileResponse(
        STATIC_DIR / "sw.js",
        media_type="application/javascript",
        headers={"Cache-Control": "no-cache", "Service-Worker-Allowed": "/"},
    )


@router.get("/manifest.webmanifest", include_in_schema=False)
async def manifest():
    return FileResponse(STATIC_DIR / "manifest.webmanifest", media_type="application/manifest+json")


@router.get("/", response_class=HTMLResponse)
async def home(request: Request):
    if stats_enabled():
        run_in_background(bump_daily_visits)
    return _page(request, "index.html")


def _resolve_story_alias(story_id: int) -> int | None:
    """Si el id corresponde a un cuento fusionado (antigua copia por voz), devuelve el id actual."""
    db = SessionLocal()
    try:
        if db.get(Story, story_id) is not None:
            return None
        alias = db.get(StoryAlias, story_id)
        return alias.story_id if alias else None
    finally:
        db.close()


@router.get("/cuento/{story_id}", response_class=HTMLResponse)
async def story_page(request: Request, story_id: int):
    new_id = _resolve_story_alias(story_id)
    if new_id is not None:
        # Las URLs antiguas (una por voz) redirigen al cuento unificado.
        return RedirectResponse(url=f"/cuento/{new_id}", status_code=301)
    if stats_enabled():
        run_in_background(lambda: bump_story_read(story_id))
    return _page(request, "story.html", story_id=story_id)


@router.get("/acerca", response_class=HTMLResponse)
async def acerca_page(request: Request):
    return _page(request, "acerca.html")


@router.get("/contacto", response_class=HTMLResponse)
async def contacto_page(request: Request):
    return _page(request, "contacto.html")


def _send_contact_email(nombre: str, email: str, mensaje: str) -> None:
    smtp_host = (os.getenv("SMTP_HOST") or "smtp.gmail.com").strip()
    smtp_port = int((os.getenv("SMTP_PORT") or "587").strip())
    smtp_user = (os.getenv("SMTP_USER") or "").strip()
    smtp_password = (os.getenv("SMTP_PASSWORD") or "").strip().replace(" ", "")
    smtp_secure = (os.getenv("SMTP_SECURE") or "starttls").strip().lower()
    mail_to = (os.getenv("CONTACT_EMAIL_TO") or "").strip()

    if not smtp_user or not smtp_password or not mail_to:
        raise RuntimeError("SMTP no configurado: faltan SMTP_USER/SMTP_PASSWORD/CONTACT_EMAIL_TO")

    msg = EmailMessage()
    msg["Subject"] = f"[Contacto CUC] Mensaje de {nombre}"
    msg["From"] = smtp_user
    msg["To"] = mail_to
    msg["Reply-To"] = email
    msg.set_content(
        "Nuevo mensaje desde formulario de contacto de cuentameuncuento.cl\n\n"
        f"Nombre: {nombre}\n"
        f"Email: {email}\n\n"
        "Mensaje:\n"
        f"{mensaje}\n"
    )

    if smtp_secure == "ssl":
        with smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=25) as server:
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
        return

    # starttls por defecto. Si el host/proxy falla con STARTTLS, intentamos SSL:465.
    try:
        with smtplib.SMTP(smtp_host, smtp_port, timeout=25) as server:
            if smtp_secure in ("starttls", "tls", ""):
                server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
            return
    except Exception:
        if smtp_secure not in ("starttls", "tls", ""):
            raise

    with smtplib.SMTP_SSL(smtp_host, 465, timeout=25) as server:
        server.login(smtp_user, smtp_password)
        server.send_message(msg)



@router.post("/contacto")
async def contacto_submit(
    request: Request,
    nombre: str = Form(...),
    email: str = Form(...),
    mensaje: str = Form(...),
    website: str = Form(""),
):
    # Honeypot anti-bot: campo oculto debe quedar vacío.
    if (website or "").strip():
        return RedirectResponse(url="/contacto?ok=1", status_code=303)

    nombre = (nombre or "").strip()
    email = (email or "").strip()
    mensaje = (mensaje or "").strip()

    if len(nombre) < 2 or len(mensaje) < 15:
        return RedirectResponse(url="/contacto?error=validacion", status_code=303)
    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
        return RedirectResponse(url="/contacto?error=email", status_code=303)

    try:
        _send_contact_email(nombre=nombre, email=email, mensaje=mensaje)
    except Exception as exc:
        print(f"[contacto] error enviando correo: {exc}", flush=True)
        return RedirectResponse(url="/contacto?error=envio", status_code=303)

    return RedirectResponse(url="/contacto?ok=1", status_code=303)


@router.get("/privacidad", response_class=HTMLResponse)
async def privacidad_page(request: Request):
    return _page(request, "privacidad.html")


@router.get("/terminos", response_class=HTMLResponse)
async def terminos_page(request: Request):
    return _page(request, "terminos.html")


@router.get("/robots.txt", response_class=PlainTextResponse)
async def robots_txt():
    return f"User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /tools\nSitemap: {SITE_URL}/sitemap.xml\n"


@router.get("/sitemap.xml")
async def sitemap_xml():
    urls = [f"{SITE_URL}/" + p for p in ("", "acerca", "contacto", "privacidad", "terminos")]
    db = SessionLocal()
    try:
        urls += [f"{SITE_URL}/cuento/{sid}" for (sid,) in db.query(Story.id).order_by(Story.id)]
    except Exception:
        pass
    finally:
        db.close()
    body = "".join(
        f"<url><loc>{u}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>"
        for u in urls
    )
    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + body + "</urlset>"
    )
    return Response(content=xml, media_type="application/xml")


@router.get("/estadisticas", response_class=HTMLResponse)
async def public_stats_page(request: Request):
    db = SessionLocal()
    try:
        daily = db.query(DailyStat).order_by(DailyStat.date.desc()).limit(30).all()
        daily = list(reversed(daily))
        total_visits = sum(d.visits_total for d in daily)
        total_reads = sum(d.story_reads_total for d in daily)
        top_stories = (
            db.query(StoryStat, Story)
            .join(Story, Story.id == StoryStat.story_id)
            .order_by(StoryStat.read_count.desc())
            .limit(10)
            .all()
        )
        return templates.TemplateResponse(
            "estadisticas.html",
            {
                "request": request,
                "daily": daily,
                "total_visits": total_visits,
                "total_reads": total_reads,
                "top_stories": top_stories,
            },
        )
    finally:
        db.close()

