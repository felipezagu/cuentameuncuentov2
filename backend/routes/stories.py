import json
from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models import Story


router = APIRouter(prefix="/api/stories", tags=["stories"])


class SceneOut(BaseModel):
    id: int
    orden: int
    texto: str
    imagen: str | None

    class Config:
        from_attributes = True


class StoryOut(BaseModel):
    id: int
    titulo: str
    descripcion: str | None
    portada: str | None
    categoria: str | None
    autor: str | None = None
    ambiente: str | None
    destacado: bool
    narracion_audio: str | None = None
    narracion_sync: str | None = None
    num_escenas: int = 0

    class Config:
        from_attributes = True


class StoryDetailOut(StoryOut):
    escenas: List[SceneOut]
    preguntas: List[Any] | None = None


@router.get("/", response_model=List[StoryOut])
def list_stories(db: Session = Depends(get_db)):
    try:
        stories = (
            db.query(Story)
            .options(joinedload(Story.escenas))
            .order_by(Story.id)
            .all()
        )
        return [
            StoryOut(
                id=s.id,
                titulo=s.titulo,
                descripcion=s.descripcion,
                portada=s.portada,
                categoria=s.categoria,
                autor=getattr(s, "autor", None),
                ambiente=s.ambiente,
                destacado=s.destacado,
                narracion_audio=getattr(s, "narracion_audio", None),
                narracion_sync=getattr(s, "narracion_sync", None),
                num_escenas=len(s.escenas or []),
            )
            for s in stories
        ]
    except OperationalError:
        # Si SQLite está bloqueado, devolvemos rápido para que la UI no quede colgada.
        return []


@router.get("/{story_id}", response_model=StoryDetailOut)
def get_story(story_id: int, db: Session = Depends(get_db)):
    story = db.query(Story).filter(Story.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Cuento no encontrado")
    preguntas = None
    if story.preguntas:
        try:
            preguntas = json.loads(story.preguntas)
        except (TypeError, json.JSONDecodeError):
            pass
    return StoryDetailOut(
        id=story.id,
        titulo=story.titulo,
        descripcion=story.descripcion,
        portada=story.portada,
        categoria=story.categoria,
        autor=getattr(story, "autor", None),
        ambiente=story.ambiente,
        destacado=story.destacado,
        narracion_audio=getattr(story, "narracion_audio", None),
        narracion_sync=getattr(story, "narracion_sync", None),
        num_escenas=len(story.escenas or []),
        escenas=story.escenas,
        preguntas=preguntas,
    )

