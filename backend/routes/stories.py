import json
from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Story, Scene


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
    ambiente: str | None
    destacado: bool

    class Config:
        from_attributes = True


class StoryDetailOut(StoryOut):
    escenas: List[SceneOut]
    preguntas: List[Any] | None = None


@router.get("/", response_model=List[StoryOut])
def list_stories(db: Session = Depends(get_db)):
    try:
        stories = db.query(Story).order_by(Story.id).all()
        return stories
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
        ambiente=story.ambiente,
        destacado=story.destacado,
        escenas=story.escenas,
        preguntas=preguntas,
    )

