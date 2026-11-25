"""API pública de cuentos (solo lectura)."""
import json
from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..models import Story, StoryAlias

router = APIRouter(prefix="/api/stories", tags=["stories"])


class SceneOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    orden: int
    texto: str
    imagen: str | None


class NarrationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    voz: str
    audio: str
    sync: str


class StoryOut(BaseModel):
    id: int
    titulo: str
    descripcion: str | None
    portada: str | None
    categoria: str | None
    autor: str | None = None
    ambiente: str | None
    destacado: bool
    narraciones: List[NarrationOut] = []
    num_escenas: int = 0


class StoryDetailOut(StoryOut):
    escenas: List[SceneOut]
    preguntas: List[Any] | None = None


def _story_out(s: Story, cls=StoryOut, **extra):
    return cls(
        id=s.id,
        titulo=s.titulo,
        descripcion=s.descripcion,
        portada=s.portada,
        categoria=s.categoria,
        autor=s.autor,
        ambiente=s.ambiente,
        destacado=bool(s.destacado),
        narraciones=[NarrationOut.model_validate(n) for n in s.narraciones],
        num_escenas=len(s.escenas or []),
        **extra,
    )


@router.get("/", response_model=List[StoryOut])
def list_stories(db: Session = Depends(get_db)):
    try:
        stories = (
            db.query(Story)
            .options(selectinload(Story.escenas), selectinload(Story.narraciones))
            .order_by(Story.id)
            .all()
        )
        return [_story_out(s) for s in stories]
    except OperationalError:
        # Si SQLite está bloqueado, devolvemos rápido para que la UI no quede colgada.
        return []


@router.get("/{story_id}", response_model=StoryDetailOut)
def get_story(story_id: int, db: Session = Depends(get_db)):
    story = db.get(Story, story_id)
    if not story:
        alias = db.get(StoryAlias, story_id)
        story = db.get(Story, alias.story_id) if alias else None
    if not story:
        raise HTTPException(status_code=404, detail="Cuento no encontrado")
    preguntas = None
    if story.preguntas:
        try:
            preguntas = json.loads(story.preguntas)
        except (TypeError, json.JSONDecodeError):
            pass
    return _story_out(
        story,
        StoryDetailOut,
        escenas=[SceneOut.model_validate(e) for e in story.escenas],
        preguntas=preguntas,
    )
