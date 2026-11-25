from sqlalchemy import Boolean, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship, Mapped, mapped_column

from .database import Base


class Story(Base):
    __tablename__ = "stories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    titulo: Mapped[str] = mapped_column(String(200), nullable=False)
    descripcion: Mapped[str] = mapped_column(Text, nullable=True)
    portada: Mapped[str | None] = mapped_column(Text, nullable=True)
    categoria: Mapped[str] = mapped_column(String(100), nullable=True)
    autor: Mapped[str | None] = mapped_column(String(200), nullable=True)
    ambiente: Mapped[str] = mapped_column(String(100), nullable=True)
    destacado: Mapped[bool] = mapped_column(Boolean, default=False)
    preguntas: Mapped[str | None] = mapped_column(Text, nullable=True)
    luma_revisado: Mapped[bool] = mapped_column(Boolean, default=False)
    # Nota: las columnas antiguas narracion_audio / narracion_sync siguen en la BD
    # (SQLite no las borra) pero ya no se usan: ver tabla `narrations`.

    escenas: Mapped[list["Scene"]] = relationship(
        "Scene", back_populates="story", cascade="all, delete-orphan", order_by="Scene.orden"
    )
    narraciones: Mapped[list["Narration"]] = relationship(
        "Narration", back_populates="story", cascade="all, delete-orphan", order_by="Narration.voz"
    )


class Scene(Base):
    __tablename__ = "scenes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    story_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("stories.id", ondelete="CASCADE"), nullable=False
    )
    orden: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    texto: Mapped[str] = mapped_column(Text, nullable=False)
    imagen: Mapped[str | None] = mapped_column(Text, nullable=True)

    story: Mapped[Story] = relationship("Story", back_populates="escenas")


class Narration(Base):
    """Una narración pregrabada (MP3 + sync.json) de un cuento. Un cuento puede tener una por voz."""

    __tablename__ = "narrations"
    __table_args__ = (UniqueConstraint("story_id", "voz", name="uq_narration_story_voz"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    story_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("stories.id", ondelete="CASCADE"), nullable=False, index=True
    )
    voz: Mapped[str] = mapped_column(String(20), nullable=False)  # "hombre" | "mujer"
    audio: Mapped[str] = mapped_column(String(500), nullable=False)
    sync: Mapped[str] = mapped_column(String(500), nullable=False)

    story: Mapped[Story] = relationship("Story", back_populates="narraciones")


class StoryAlias(Base):
    """IDs antiguos de cuentos fusionados (antes había una copia por voz). Se usan para redirigir URLs viejas."""

    __tablename__ = "story_aliases"

    old_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    story_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("stories.id", ondelete="CASCADE"), nullable=False
    )


class DailyStat(Base):
    __tablename__ = "daily_stats"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    date: Mapped[str] = mapped_column(String(10), unique=True, nullable=False)
    visits_total: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    story_reads_total: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class StoryStat(Base):
    __tablename__ = "story_stats"

    story_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("stories.id", ondelete="CASCADE"), primary_key=True
    )
    read_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

