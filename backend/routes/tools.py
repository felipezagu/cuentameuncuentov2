"""
Herramientas internas de narración (ElevenLabs TTS / STT -> sync.json).

Solo disponibles en local / red privada (ver ``security.ensure_localhost_only``).
No forman parte del sitio público.
"""
import io
import json
import os
import re
import unicodedata
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, File, Form, Request, UploadFile
from fastapi.responses import HTMLResponse

from ..config import BASE_DIR, templates
from ..security import ensure_localhost_only

router = APIRouter(tags=["tools"])


@router.get("/tools/tts-upload", response_class=HTMLResponse)
async def tts_upload_page(request: Request):
    ensure_localhost_only(request)
    default_voice_female = (os.getenv("ELEVENLABS_VOICE_ID_FEMALE") or os.getenv("ELEVENLABS_VOICE_ID") or "rrErIO88ehxTnspOjKvf").strip()
    default_voice_male = (os.getenv("ELEVENLABS_VOICE_ID_MALE") or "HNSF1CTQmub252yhXROX").strip()
    return templates.TemplateResponse(
        "tts_upload.html",
        {
            "request": request,
            "default_voice_female": default_voice_female,
            "default_voice_male": default_voice_male,
        },
    )



def _safe_slug(text: str) -> str:
    s = (text or "").strip().lower()
    s = unicodedata.normalize("NFD", s)
    s = "".join(ch for ch in s if unicodedata.category(ch) != "Mn")
    s = re.sub(r"[^a-z0-9]+", "", s)
    return s or "cuento"


def _scene_index_for_time(start_sec: float, boundaries: list[float]) -> int:
    for i, b in enumerate(boundaries):
        if start_sec < b:
            return i
    return len(boundaries)


def _sec_to_mmss(sec: float) -> str:
    s = max(0, int(sec))
    mm = s // 60
    ss = s % 60
    return f"{mm:02d}:{ss:02d}"


def _words_to_timed_sentences(words) -> list[tuple[float, str]]:
    """
    Convierte palabras con timestamps a segmentos de frase (start_sec, texto).
    """
    items = []
    cur_tokens: list[str] = []
    cur_start: float | None = None
    word_count = 0

    for w in words or []:
        wtype = getattr(w, "type", "")
        if str(wtype) != "word":
            continue
        token = (getattr(w, "text", "") or "").strip()
        if not token:
            continue
        ws = getattr(w, "start", None)
        if cur_start is None and ws is not None:
            cur_start = float(ws)

        # Espaciado simple antes de puntuación
        if token in {".", ",", ";", ":", "!", "?", ")", "]"} and cur_tokens:
            cur_tokens[-1] = cur_tokens[-1].rstrip() + token
        else:
            cur_tokens.append(token)
            word_count += 1

        sentence = " ".join(cur_tokens).strip()
        ends_sentence = sentence.endswith((".", "!", "?"))
        if ends_sentence or word_count >= 22:
            if cur_start is None:
                cur_start = 0.0
            items.append((cur_start, sentence))
            cur_tokens = []
            cur_start = None
            word_count = 0

    if cur_tokens:
        sentence = " ".join(cur_tokens).strip()
        items.append((cur_start or 0.0, sentence))
    return items


@router.post("/tools/tts-upload")
async def tts_upload_generate(
    request: Request,
    txt_file: UploadFile = File(...),
    cuento_nombre: Annotated[str, Form(...)] = "",
    version: Annotated[str, Form(...)] = "mujer",
    voice_id_override: Annotated[str, Form(...)] = "",
    model_id: Annotated[str, Form(...)] = "eleven_multilingual_v2",
    output_format: Annotated[str, Form(...)] = "mp3_44100_128",
):
    ensure_localhost_only(request)
    default_voice_female = (os.getenv("ELEVENLABS_VOICE_ID_FEMALE") or os.getenv("ELEVENLABS_VOICE_ID") or "rrErIO88ehxTnspOjKvf").strip()
    default_voice_male = (os.getenv("ELEVENLABS_VOICE_ID_MALE") or "HNSF1CTQmub252yhXROX").strip()

    def _render_error(msg: str, status_code: int = 400):
        return templates.TemplateResponse(
            "tts_upload.html",
            {
                "request": request,
                "default_voice_female": default_voice_female,
                "default_voice_male": default_voice_male,
                "error": msg,
            },
            status_code=status_code,
        )

    api_key = (os.getenv("ELEVENLABS_API_KEY") or "").strip()
    if not api_key:
        return _render_error("Falta ELEVENLABS_API_KEY en .env.local o .env.", status_code=503)

    version = (version or "mujer").strip().lower()
    if version not in {"mujer", "hombre"}:
        return _render_error("La versión debe ser 'mujer' o 'hombre'.")

    chosen_voice = (voice_id_override or "").strip()
    if not chosen_voice:
        chosen_voice = default_voice_male if version == "hombre" else default_voice_female
    if not chosen_voice:
        return _render_error("No se encontró voice_id. Define ELEVENLABS_VOICE_ID_FEMALE / ELEVENLABS_VOICE_ID_MALE o usa override.")

    if not txt_file.filename or not txt_file.filename.lower().endswith(".txt"):
        return _render_error("Sube un archivo .txt válido.")

    raw = await txt_file.read()
    text = ""
    for enc in ("utf-8", "utf-8-sig", "latin-1"):
        try:
            text = raw.decode(enc)
            break
        except UnicodeDecodeError:
            continue
    text = text.strip()
    if not text:
        return _render_error("El archivo .txt está vacío.")

    try:
        from elevenlabs.client import ElevenLabs
        from elevenlabs.core.api_error import ApiError
    except Exception:
        return _render_error("No se pudo importar elevenlabs. Revisa la instalación en tu entorno.", status_code=500)

    try:
        client = ElevenLabs(api_key=api_key)
        with client.text_to_speech.with_raw_response.convert(
            text=text,
            voice_id=chosen_voice,
            model_id=(model_id or "eleven_multilingual_v2").strip(),
            output_format=(output_format or "mp3_44100_128").strip(),
        ) as response:
            # En esta versión del SDK, data es un iterador de bytes.
            audio_data = b"".join(response.data)
            char_cost = response.headers.get("x-character-count")
            req_id = response.headers.get("request-id")
    except ApiError as e:
        if e.status_code == 402:
            body = e.body if isinstance(e.body, dict) else {}
            detail = body.get("detail") if isinstance(body, dict) else {}
            code = detail.get("code") if isinstance(detail, dict) else ""
            msg = detail.get("message") if isinstance(detail, dict) else ""
            if code == "paid_plan_required":
                return _render_error(
                    "ElevenLabs bloqueó este voice_id en plan free (paid_plan_required). "
                    "Usa una voz propia (Voice Design / Instant Voice Clone) o cambia a un voice_id permitido para API en tu plan."
                )
            return _render_error(
                f"ElevenLabs respondió 402 (Payment Required). {msg or 'Revisa tu plan o voz seleccionada.'}"
            )
        return _render_error(f"Error API ElevenLabs ({e.status_code}): {e.body}", status_code=502)
    except Exception as e:
        return _render_error(f"Error llamando a ElevenLabs: {e}", status_code=502)

    folder_src = (cuento_nombre or "").strip() or Path(txt_file.filename).stem
    folder = _safe_slug(folder_src)
    out_name = f"{folder}{version}.mp3"

    out_dir = BASE_DIR / "imagenes" / folder
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / out_name
    out_path.write_bytes(audio_data)

    mp3_url = f"/imagenes/{folder}/{out_name}"
    timings_name = f"{out_name}.txt"
    timings_hint = f"/imagenes/{folder}/{timings_name}"

    return templates.TemplateResponse(
        "tts_upload.html",
        {
            "request": request,
            "default_voice_female": default_voice_female,
            "default_voice_male": default_voice_male,
            "ok": True,
            "saved_path": str(out_path.relative_to(BASE_DIR)),
            "mp3_url": mp3_url,
            "timings_hint": timings_hint,
            "char_cost": char_cost or "",
            "request_id": req_id or "",
            "used_voice_id": chosen_voice,
            "used_version": version,
            "cuento_slug": folder,
        },
    )


@router.post("/tools/tts-upload-bulk-config")
async def tts_upload_bulk_config_generate(
    request: Request,
    txt_files: list[UploadFile] = File(...),
    model_id: Annotated[str, Form(...)] = "eleven_multilingual_v2",
    output_format: Annotated[str, Form(...)] = "mp3_44100_128",
    voice_id_female_override: Annotated[str, Form(...)] = "",
    voice_id_male_override: Annotated[str, Form(...)] = "",
):
    ensure_localhost_only(request)
    default_voice_female = (os.getenv("ELEVENLABS_VOICE_ID_FEMALE") or os.getenv("ELEVENLABS_VOICE_ID") or "rrErIO88ehxTnspOjKvf").strip()
    default_voice_male = (os.getenv("ELEVENLABS_VOICE_ID_MALE") or "HNSF1CTQmub252yhXROX").strip()

    def _render_error(msg: str, status_code: int = 400):
        return templates.TemplateResponse(
            "tts_upload.html",
            {
                "request": request,
                "default_voice_female": default_voice_female,
                "default_voice_male": default_voice_male,
                "error": msg,
            },
            status_code=status_code,
        )

    api_key = (os.getenv("ELEVENLABS_API_KEY") or "").strip()
    if not api_key:
        return _render_error("Falta ELEVENLABS_API_KEY en .env.local o .env.", status_code=503)

    if not txt_files:
        return _render_error("Debes subir al menos un archivo .txt.")

    voice_female = (voice_id_female_override or "").strip() or default_voice_female
    voice_male = (voice_id_male_override or "").strip() or default_voice_male
    if not voice_female or not voice_male:
        return _render_error("Faltan voice_id mujer/hombre (override o variables de entorno).")

    try:
        from elevenlabs.client import ElevenLabs
        from elevenlabs.core.api_error import ApiError
    except Exception:
        return _render_error("No se pudo importar elevenlabs. Revisa la instalación en tu entorno.", status_code=500)

    out_dir = BASE_DIR / "imagenes" / "configuracion"
    out_dir.mkdir(parents=True, exist_ok=True)

    client = ElevenLabs(api_key=api_key)
    results_bulk = []
    failed_bulk = []

    for f in txt_files:
        fname = (f.filename or "").strip()
        if not fname.lower().endswith(".txt"):
            failed_bulk.append(
                {
                    "txt": fname or "[sin nombre]",
                    "version": "ambas",
                    "error": "Archivo inválido (no .txt)",
                }
            )
            continue

        raw = await f.read()
        text = ""
        for enc in ("utf-8", "utf-8-sig", "latin-1"):
            try:
                text = raw.decode(enc)
                break
            except UnicodeDecodeError:
                continue
        text = text.strip()
        if not text:
            failed_bulk.append(
                {
                    "txt": fname,
                    "version": "ambas",
                    "error": "El archivo está vacío",
                }
            )
            continue

        stem = _safe_slug(Path(fname).stem)
        row = {"txt": fname, "saved": []}
        for ver, voice_id in [("mujer", voice_female), ("hombre", voice_male)]:
            out_name = f"{stem}{ver}.mp3"
            out_path = out_dir / out_name
            try:
                with client.text_to_speech.with_raw_response.convert(
                    text=text,
                    voice_id=voice_id,
                    model_id=(model_id or "eleven_multilingual_v2").strip(),
                    output_format=(output_format or "mp3_44100_128").strip(),
                ) as response:
                    audio_data = b"".join(response.data)
            except ApiError as e:
                failed_bulk.append(
                    {
                        "txt": fname,
                        "version": ver,
                        "error": f"Error API ElevenLabs: {e}",
                    }
                )
                # Si ya no hay créditos, evitamos seguir gastando tiempo.
                e_text = str(e).lower()
                if "quota_exceeded" in e_text or "401" in e_text:
                    return templates.TemplateResponse(
                        "tts_upload.html",
                        {
                            "request": request,
                            "default_voice_female": default_voice_female,
                            "default_voice_male": default_voice_male,
                            "ok_bulk": True,
                            "results_bulk": results_bulk,
                            "failed_bulk": failed_bulk,
                            "bulk_target_dir": str((BASE_DIR / "imagenes" / "configuracion").relative_to(BASE_DIR)),
                            "bulk_warning": "Se detuvo por cuota/créditos insuficientes en ElevenLabs. Se guardó lo que sí alcanzó.",
                        },
                    )
                continue
            except Exception as e:
                failed_bulk.append(
                    {
                        "txt": fname,
                        "version": ver,
                        "error": f"Error generando audio: {e}",
                    }
                )
                continue

            out_path.write_bytes(audio_data)
            row["saved"].append(f"/imagenes/configuracion/{out_name}")
        if row["saved"]:
            results_bulk.append(row)

    return templates.TemplateResponse(
        "tts_upload.html",
        {
            "request": request,
            "default_voice_female": default_voice_female,
            "default_voice_male": default_voice_male,
            "ok_bulk": True,
            "results_bulk": results_bulk,
            "failed_bulk": failed_bulk,
            "bulk_target_dir": str((BASE_DIR / "imagenes" / "configuracion").relative_to(BASE_DIR)),
        },
    )


@router.post("/tools/complete-flow-both")
async def complete_flow_both_generate(
    request: Request,
    txt_file: UploadFile = File(...),
    cuento_nombre: Annotated[str, Form(...) ] = "",
    scene_boundaries: Annotated[str, Form(...)] = "24,44,63,83",
    language_code: Annotated[str, Form(...)] = "spa",
    tts_model_id: Annotated[str, Form(...)] = "eleven_multilingual_v2",
    tts_output_format: Annotated[str, Form(...)] = "mp3_44100_128",
    stt_model_id: Annotated[str, Form(...)] = "scribe_v2",
    text_source_name: Annotated[str, Form(...)] = "",
    voice_id_female_override: Annotated[str, Form(...)] = "",
    voice_id_male_override: Annotated[str, Form(...)] = "",
):
    ensure_localhost_only(request)
    default_voice_female = (os.getenv("ELEVENLABS_VOICE_ID_FEMALE") or os.getenv("ELEVENLABS_VOICE_ID") or "rrErIO88ehxTnspOjKvf").strip()
    default_voice_male = (os.getenv("ELEVENLABS_VOICE_ID_MALE") or "HNSF1CTQmub252yhXROX").strip()

    def _render_error(msg: str, status_code: int = 400):
        return templates.TemplateResponse(
            "tts_upload.html",
            {
                "request": request,
                "default_voice_female": default_voice_female,
                "default_voice_male": default_voice_male,
                "error": msg,
            },
            status_code=status_code,
        )

    api_key = (os.getenv("ELEVENLABS_API_KEY") or "").strip()
    if not api_key:
        return _render_error("Falta ELEVENLABS_API_KEY en .env.local o .env.", status_code=503)

    folder_src = (cuento_nombre or "").strip() or Path(txt_file.filename).stem
    folder = _safe_slug(folder_src)

    boundaries = []
    try:
        boundaries = [float(x.strip()) for x in (scene_boundaries or "").split(",") if x.strip()]
    except ValueError:
        return _render_error("Cortes de escena inválidos. Usa formato como 24,44,63,83.")

    if not txt_file.filename or not txt_file.filename.lower().endswith(".txt"):
        return _render_error("Sube un archivo .txt válido.")

    raw = await txt_file.read()
    text = ""
    for enc in ("utf-8", "utf-8-sig", "latin-1"):
        try:
            text = raw.decode(enc)
            break
        except UnicodeDecodeError:
            continue
    text = text.strip()
    if not text:
        return _render_error("El archivo .txt está vacío.")

    try:
        from elevenlabs.client import ElevenLabs
        from elevenlabs.core.api_error import ApiError
    except Exception:
        return _render_error("No se pudo importar elevenlabs.", status_code=500)

    voice_female = (voice_id_female_override or "").strip() or default_voice_female
    voice_male = (voice_id_male_override or "").strip() or default_voice_male
    if not voice_female or not voice_male:
        return _render_error("Faltan voice_id mujer/hombre (override o variables de entorno).")

    out_dir = BASE_DIR / "imagenes" / folder
    out_dir.mkdir(parents=True, exist_ok=True)

    versions = [
        ("mujer", voice_female),
        ("hombre", voice_male),
    ]

    # 1) TXT -> MP3 (ambos)
    client = ElevenLabs(api_key=api_key)
    for ver, voice_id in versions:
        mp3_name = f"{folder}{ver}.mp3"
        mp3_path = out_dir / mp3_name
        try:
            with client.text_to_speech.with_raw_response.convert(
                text=text,
                voice_id=voice_id,
                model_id=(tts_model_id or "eleven_multilingual_v2").strip(),
                output_format=(tts_output_format or "mp3_44100_128").strip(),
            ) as response:
                audio_bytes = b"".join(response.data)
        except ApiError as e:
            return _render_error(f"ElevenLabs TTS bloqueó la voz {ver}: {e}")
        except Exception as e:
            return _render_error(f"Error en TTS ({ver}): {e}", status_code=502)
        mp3_path.write_bytes(audio_bytes)

    # 2) MP3 -> .mp3.txt + .sync.json (ambos)
    results = {}
    for ver, _voice_id in versions:
        mp3_name = f"{folder}{ver}.mp3"
        mp3_path = out_dir / mp3_name

        if not mp3_path.exists():
            return _render_error(f"MP3 no existe para {ver}: {mp3_path.relative_to(BASE_DIR)}")

        try:
            transcription = client.speech_to_text.convert(
                file=io.BytesIO(mp3_path.read_bytes()),
                model_id=(stt_model_id or "scribe_v2").strip(),
                language_code=(language_code or "spa").strip(),
                diarize=False,
                tag_audio_events=False,
                timestamps_granularity="word",
            )
        except ApiError as e:
            return _render_error(f"ElevenLabs STT bloqueó {ver}: {e}", status_code=502)
        except Exception as e:
            return _render_error(f"Error STT ({ver}): {e}", status_code=502)

        words = getattr(transcription, "words", []) or []
        sentences = _words_to_timed_sentences(words)
        if not sentences:
            return _render_error(f"No se pudieron extraer segmentos con tiempos desde STT para {ver}.")

        # Guardar .mp3.txt con marcas
        timings_path = out_dir / f"{mp3_name}.txt"
        txt_lines = [f"({_sec_to_mmss(start)}) {t}" for start, t in sentences]
        timings_path.write_text("\n".join(txt_lines).strip() + "\n", encoding="utf-8")

        # Guardar sync.json
        segs = []
        for idx, (start, seg_text) in enumerate(sentences):
            end = sentences[idx + 1][0] if idx + 1 < len(sentences) else None
            item = {
                "index": idx,
                "sceneIndex": _scene_index_for_time(float(start), boundaries),
                "startSec": round(float(start), 3),
                "text": seg_text,
            }
            if end is not None:
                item["endSec"] = round(float(end), 3)
            else:
                last_end = None
                for w in reversed(words):
                    we = getattr(w, "end", None)
                    if we is not None:
                        last_end = float(we)
                        break
                if last_end is not None:
                    item["endSec"] = round(last_end, 3)
                else:
                    item["endSec"] = round(float(start) + 10.0, 3)
                    item["endSecEstimated"] = True
            segs.append(item)

        script_text = (text_source_name or "").strip() or f"{folder}.txt"
        sync_data = {
            "version": 3,
            "audio": mp3_name,
            "sources": {"text": script_text, "timings": timings_path.name},
            "method": "segments_from_stt_word_timestamps",
            "note": "Generado automáticamente desde ElevenLabs Speech-to-Text (timestamps word).",
            "segments": segs,
        }
        sync_path = out_dir / f"{folder}{ver}.sync.json"
        sync_path.write_text(json.dumps(sync_data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

        results[ver] = {
            "mp3_url": f"/imagenes/{folder}/{mp3_name}",
            "timings_url": f"/imagenes/{folder}/{timings_path.name}",
            "sync_url": f"/imagenes/{folder}/{sync_path.name}",
            "segment_count": len(segs),
        }

    return templates.TemplateResponse(
        "tts_upload.html",
        {
            "request": request,
            "default_voice_female": default_voice_female,
            "default_voice_male": default_voice_male,
            "ok_full": True,
            "cuento_slug": folder,
            "results": results,
        },
    )


@router.post("/tools/stt-to-sync")
async def stt_to_sync_generate(
    request: Request,
    cuento_nombre: Annotated[str, Form(...)] = "",
    version: Annotated[str, Form(...)] = "mujer",
    scene_boundaries: Annotated[str, Form(...)] = "24,44,63,83",
    language_code: Annotated[str, Form(...)] = "spa",
    model_id: Annotated[str, Form(...)] = "scribe_v2",
    text_source_name: Annotated[str, Form(...)] = "",
    mp3_file: UploadFile | None = File(default=None),
):
    ensure_localhost_only(request)
    default_voice_female = (os.getenv("ELEVENLABS_VOICE_ID_FEMALE") or os.getenv("ELEVENLABS_VOICE_ID") or "rrErIO88ehxTnspOjKvf").strip()
    default_voice_male = (os.getenv("ELEVENLABS_VOICE_ID_MALE") or "HNSF1CTQmub252yhXROX").strip()

    def _render_error(msg: str, status_code: int = 400):
        return templates.TemplateResponse(
            "tts_upload.html",
            {
                "request": request,
                "default_voice_female": default_voice_female,
                "default_voice_male": default_voice_male,
                "error": msg,
            },
            status_code=status_code,
        )

    api_key = (os.getenv("ELEVENLABS_API_KEY") or "").strip()
    if not api_key:
        return _render_error("Falta ELEVENLABS_API_KEY en .env.local o .env.", status_code=503)

    folder = _safe_slug(cuento_nombre)
    version = (version or "mujer").strip().lower()
    if version not in {"mujer", "hombre"}:
        return _render_error("La versión debe ser 'mujer' o 'hombre'.")

    boundaries = []
    try:
        boundaries = [float(x.strip()) for x in (scene_boundaries or "").split(",") if x.strip()]
    except ValueError:
        return _render_error("Cortes de escena inválidos. Usa formato como 24,44,63,83.")

    out_dir = BASE_DIR / "imagenes" / folder
    mp3_name = f"{folder}{version}.mp3"
    mp3_path = out_dir / mp3_name
    out_dir.mkdir(parents=True, exist_ok=True)

    # Si viene MP3 subido, se guarda primero con el nombre estándar.
    if mp3_file is not None and mp3_file.filename:
        if not mp3_file.filename.lower().endswith(".mp3"):
            return _render_error("El archivo de audio debe ser .mp3")
        mp3_raw = await mp3_file.read()
        if not mp3_raw:
            return _render_error("El MP3 subido está vacío.")
        mp3_path.write_bytes(mp3_raw)

    if not mp3_path.exists():
        return _render_error(
            f"No existe el MP3 esperado: {mp3_path.relative_to(BASE_DIR)}. "
            "Súbelo en este formulario o genera primero con el Paso 1."
        )

    try:
        from elevenlabs.client import ElevenLabs
        from elevenlabs.core.api_error import ApiError
    except Exception:
        return _render_error("No se pudo importar elevenlabs.", status_code=500)

    try:
        client = ElevenLabs(api_key=api_key)
        audio_bytes = mp3_path.read_bytes()
        transcription = client.speech_to_text.convert(
            file=io.BytesIO(audio_bytes),
            model_id=(model_id or "scribe_v2").strip(),
            language_code=(language_code or "spa").strip(),
            diarize=False,
            tag_audio_events=False,
            timestamps_granularity="word",
        )
    except ApiError as e:
        return _render_error(f"Error API ElevenLabs STT ({e.status_code}): {e.body}", status_code=502)
    except Exception as e:
        return _render_error(f"Error en Speech-to-Text: {e}", status_code=502)

    words = getattr(transcription, "words", []) or []
    sentences = _words_to_timed_sentences(words)
    if not sentences:
        return _render_error("No se pudieron extraer segmentos con tiempos desde STT.")

    # 1) Guardar txt con tiempos estilo any2text
    timings_path = out_dir / f"{mp3_name}.txt"
    txt_lines = [f"({_sec_to_mmss(start)}) {text}" for start, text in sentences]
    timings_path.write_text("\n".join(txt_lines).strip() + "\n", encoding="utf-8")

    # 2) Guardar sync.json
    segs = []
    for idx, (start, text) in enumerate(sentences):
        end = sentences[idx + 1][0] if idx + 1 < len(sentences) else None
        item = {
            "index": idx,
            "sceneIndex": _scene_index_for_time(float(start), boundaries),
            "startSec": round(float(start), 3),
            "text": text,
        }
        if end is not None:
            item["endSec"] = round(float(end), 3)
        else:
            # Intento usar el último end de palabra; fallback +10s
            last_end = None
            for w in reversed(words):
                we = getattr(w, "end", None)
                if we is not None:
                    last_end = float(we)
                    break
            if last_end is not None:
                item["endSec"] = round(last_end, 3)
            else:
                item["endSec"] = round(float(start) + 10.0, 3)
                item["endSecEstimated"] = True
        segs.append(item)

    script_text = (text_source_name or "").strip() or f"{folder}.txt"
    sync_data = {
        "version": 3,
        "audio": mp3_name,
        "sources": {
            "text": script_text,
            "timings": timings_path.name,
        },
        "method": "segments_from_stt_word_timestamps",
        "note": "Generado automáticamente desde ElevenLabs Speech-to-Text (timestamps word).",
        "segments": segs,
    }
    sync_path = out_dir / f"{folder}{version}.sync.json"
    sync_path.write_text(json.dumps(sync_data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    return templates.TemplateResponse(
        "tts_upload.html",
        {
            "request": request,
            "default_voice_female": default_voice_female,
            "default_voice_male": default_voice_male,
            "ok_stt": True,
            "saved_mp3": str(mp3_path.relative_to(BASE_DIR)),
            "saved_timings": str(timings_path.relative_to(BASE_DIR)),
            "saved_sync": str(sync_path.relative_to(BASE_DIR)),
            "sync_url": f"/imagenes/{folder}/{sync_path.name}",
            "timings_url": f"/imagenes/{folder}/{timings_path.name}",
            "segment_count": len(segs),
            "cuento_slug": folder,
            "used_version": version,
        },
    )

