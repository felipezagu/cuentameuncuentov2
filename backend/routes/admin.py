import json
from pathlib import Path
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Story, Scene
from ..leonardo import build_prompt, build_prompt_luma
from ..luma import generate_scene_image_luma, slug_nombre_cuento


router = APIRouter(prefix="/api/admin", tags=["admin"])


class SceneIn(BaseModel):
    orden: int
    texto: str
    imagen: str | None = None


class StoryIn(BaseModel):
    titulo: str
    descripcion: str | None = None
    portada: str | None = None
    categoria: str | None = None
    ambiente: str | None = None
    destacado: bool = False
    narracion_audio: str | None = None
    narracion_sync: str | None = None
    escenas: List[SceneIn]


@router.post("/stories", status_code=status.HTTP_201_CREATED)
def create_story(payload: StoryIn, db: Session = Depends(get_db)):
    story = Story(
        titulo=payload.titulo,
        descripcion=payload.descripcion,
        portada=payload.portada,
        categoria=payload.categoria,
        ambiente=payload.ambiente,
        destacado=payload.destacado,
    )
    db.add(story)
    db.flush()

    for s in payload.escenas:
        scene = Scene(
            story_id=story.id,
            orden=s.orden,
            texto=s.texto,
            imagen=s.imagen,
        )
        db.add(scene)

    db.commit()
    db.refresh(story)
    return {"id": story.id}


@router.put("/stories/{story_id}")
def update_story(story_id: int, payload: StoryIn, db: Session = Depends(get_db)):
    story: Story | None = db.query(Story).filter(Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Cuento no encontrado")

    story.titulo = payload.titulo
    story.descripcion = payload.descripcion
    story.portada = payload.portada
    story.categoria = payload.categoria
    story.ambiente = payload.ambiente
    story.destacado = payload.destacado
    story.narracion_audio = (payload.narracion_audio or "").strip() or None
    story.narracion_sync = (payload.narracion_sync or "").strip() or None

    db.query(Scene).filter(Scene.story_id == story.id).delete()
    for s in payload.escenas:
        db.add(
            Scene(
                story_id=story.id,
                orden=s.orden,
                texto=s.texto,
                imagen=s.imagen,
            )
        )

    db.commit()
    return {"ok": True}


@router.delete("/stories/{story_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_story(story_id: int, db: Session = Depends(get_db)):
    story = db.query(Story).filter(Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Cuento no encontrado")
    db.delete(story)
    db.commit()
    return


@router.get("/stories")
def list_stories_with_luma_status(db: Session = Depends(get_db)):
    """
    Lista todos los cuentos con estado de imágenes Luma (para tabla de seguimiento).
    """
    stories = db.query(Story).order_by(Story.id).all()
    out = []
    for s in stories:
        escenas = sorted(s.escenas, key=lambda e: e.orden)
        total = len(escenas)
        con_imagen = sum(1 for e in escenas if e.imagen and (e.imagen or "").strip())
        out.append({
            "id": s.id,
            "titulo": s.titulo or "(sin título)",
            "escenas_total": total,
            "escenas_con_imagen": con_imagen,
            "luma_completo": total > 0 and con_imagen == total,
            "luma_revisado": getattr(s, "luma_revisado", False),
        })
    return out


@router.patch("/stories/{story_id}/luma-revisado")
def set_luma_revisado(story_id: int, payload: dict, db: Session = Depends(get_db)):
    """Marca o desmarca que tú has revisado/generado las imágenes de este cuento."""
    story = db.query(Story).filter(Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Cuento no encontrado")
    revisado = payload.get("revisado", False)
    story.luma_revisado = bool(revisado)
    db.commit()
    return {"ok": True, "luma_revisado": story.luma_revisado}


@router.get("/export-cuentos")
def export_cuentos(db: Session = Depends(get_db)):
    """Exporta todos los cuentos con sus escenas y preguntas a JSON descargable."""
    stories = db.query(Story).order_by(Story.id).all()
    cuentos = []
    for s in stories:
        escenas = [{"orden": e.orden, "texto": e.texto, "imagen": e.imagen} for e in sorted(s.escenas, key=lambda x: x.orden)]
        cuentos.append({
            "titulo": s.titulo,
            "descripcion": s.descripcion or "",
            "portada": s.portada or "",
            "categoria": s.categoria or "",
            "ambiente": s.ambiente or "",
            "destacado": bool(s.destacado),
            "preguntas": s.preguntas,
            "narracion_audio": getattr(s, "narracion_audio", None) or "",
            "narracion_sync": getattr(s, "narracion_sync", None) or "",
            "escenas": escenas,
        })
    body = json.dumps({"cuentos": cuentos}, ensure_ascii=False, indent=2)
    return Response(
        content=body,
        media_type="application/json",
        headers={"Content-Disposition": "attachment; filename=cuentos.json"},
    )


@router.post("/import-cuentos")
def import_cuentos(payload: dict, db: Session = Depends(get_db)):
    """Carga cuentos desde un JSON con formato { \"cuentos\": [ { titulo, descripcion, portada, categoria, destacado, preguntas, escenas }, ... ] }."""
    cuentos = payload.get("cuentos") if isinstance(payload, dict) else []
    if not isinstance(cuentos, list):
        raise HTTPException(status_code=400, detail="El JSON debe tener una lista 'cuentos'")
    created = 0
    for c in cuentos:
        titulo = c.get("titulo") or "Sin título"
        descripcion = c.get("descripcion") or ""
        portada = c.get("portada") or None
        categoria = c.get("categoria") or None
        ambiente = c.get("ambiente") or None
        destacado = bool(c.get("destacado", False))
        preguntas = c.get("preguntas")
        if isinstance(preguntas, list):
            preguntas = json.dumps(preguntas)
        narracion_audio = (c.get("narracion_audio") or "").strip() or None
        narracion_sync = (c.get("narracion_sync") or "").strip() or None
        escenas_data = c.get("escenas") or []
        story = Story(
            titulo=titulo,
            descripcion=descripcion,
            portada=portada,
            categoria=categoria,
            ambiente=ambiente,
            destacado=destacado,
            preguntas=preguntas,
            narracion_audio=narracion_audio,
            narracion_sync=narracion_sync,
        )
        db.add(story)
        db.flush()
        for e in escenas_data:
            scene = Scene(
                story_id=story.id,
                orden=int(e.get("orden", 1)),
                texto=e.get("texto") or "",
                imagen=e.get("imagen"),
            )
            db.add(scene)
        created += 1
    db.commit()
    return {"ok": True, "importados": created}


@router.get("/stories/{story_id}/gemini-prompts")
def get_gemini_prompts_for_story(story_id: int, db: Session = Depends(get_db)):
    """
    Devuelve, para cada escena del cuento, el texto listo para pegar en gemini.google.com
    y generar la imagen manualmente.
    """
    story = db.query(Story).filter(Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Cuento no encontrado")
    if not story.escenas:
        raise HTTPException(status_code=400, detail="El cuento no tiene escenas")

    escenas_sorted = sorted(story.escenas, key=lambda e: e.orden)
    prompts = []
    for escena in escenas_sorted:
        prompt = build_prompt(story.titulo, escena.texto or "")
        prompts.append(
            {
                "orden": escena.orden,
                "estrofa": escena.texto or "",
                "prompt_gemini": prompt,
            }
        )

    return {
        "ok": True,
        "story_id": story.id,
        "titulo": story.titulo,
        "total_escenas": len(escenas_sorted),
        "prompts": prompts,
    }


@router.post("/stories/{story_id}/luma-generate")
def generate_luma_images_for_story(story_id: int, db: Session = Depends(get_db)):
    """
    Genera imágenes con Luma para cada escena del cuento usando el mismo prompt que Gemini.
    Guarda las imágenes en uploads/escenas y actualiza la columna `imagen` de cada escena.
    """
    try:
        story = db.query(Story).filter(Story.id == story_id).first()
        if not story:
            raise HTTPException(status_code=404, detail="Cuento no encontrado")
        if not story.escenas:
            raise HTTPException(status_code=400, detail="El cuento no tiene escenas")

        # Misma raíz que main.py: proyecto/uploads (no backend/uploads)
        project_root = Path(__file__).resolve().parent.parent.parent
        escenas_dir = project_root / "uploads" / "escenas"
        escenas_dir.mkdir(parents=True, exist_ok=True)

        escenas_sorted = sorted(story.escenas, key=lambda e: e.orden)
        generadas: list[dict] = []
        slug = slug_nombre_cuento(story.titulo or "cuento")

        for escena in escenas_sorted:
            texto = escena.texto or ""
            if not texto.strip():
                continue
            prompt = build_prompt_luma(story.titulo, texto, orden=escena.orden)
            filename = f"{slug}_{escena.orden}.jpg"
            save_path = escenas_dir / filename

            ok = generate_scene_image_luma(prompt, save_path)
            if not ok:
                continue

            escena.imagen = f"/uploads/escenas/{filename}"
            generadas.append(
                {
                    "orden": escena.orden,
                    "imagen": escena.imagen,
                }
            )

        db.commit()

        if not generadas:
            raise HTTPException(status_code=500, detail="No se pudo generar ninguna imagen con Luma.")

        return {
            "ok": True,
            "story_id": story.id,
            "total_generadas": len(generadas),
            "escenas": generadas,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error en Luma: {type(e).__name__}: {e!s}",
        )

