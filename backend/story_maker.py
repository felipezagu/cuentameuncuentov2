"""
"Crea tu cuento": arma un cuento corto a partir de lo que elige el niño.

Dos motores:
- Plantillas (gratis, siempre disponible, sin internet).
- IA (Claude Haiku) si existe ANTHROPIC_API_KEY. Si la IA falla, se agota el cupo
  o la respuesta no es válida, se usa la plantilla: el niño siempre recibe su cuento.
"""
import json
import os
import random
import re
import time
from collections import deque

import httpx

# --------------------------------------------------------------------------------------
# Opciones que ofrece el formulario (la misma lista se envía al frontend)
# --------------------------------------------------------------------------------------
PERSONAJES = {
    "nina": {"label": "Niña", "emoji": "👧", "g": "f", "un": "una niña"},
    "nino": {"label": "Niño", "emoji": "👦", "g": "m", "un": "un niño"},
    "gatito": {"label": "Gatito", "emoji": "🐱", "g": "m", "un": "un gatito"},
    "perrita": {"label": "Perrita", "emoji": "🐶", "g": "f", "un": "una perrita"},
    "dragon": {"label": "Dragón", "emoji": "🐉", "g": "m", "un": "un dragón"},
    "robot": {"label": "Robot", "emoji": "🤖", "g": "m", "un": "un robot"},
    "princesa": {"label": "Princesa", "emoji": "👸", "g": "f", "un": "una princesa"},
    "astronauta": {"label": "Astronauta", "emoji": "🧑‍🚀", "g": "f", "un": "una astronauta"},
    "unicornio": {"label": "Unicornio", "emoji": "🦄", "g": "m", "un": "un unicornio"},
    "dinosaurio": {"label": "Dinosaurio", "emoji": "🦖", "g": "m", "un": "un dinosaurio"},
    "conejita": {"label": "Conejita", "emoji": "🐰", "g": "f", "un": "una conejita"},
    "osito": {"label": "Osito", "emoji": "🐻", "g": "m", "un": "un osito"},
}

LUGARES = {
    "bosque": {
        "titulo": "el bosque", "label": "Bosque", "emoji": "🌳", "en": "en un bosque lleno de árboles gigantes",
        "problema": "un árbol muy viejo se había caído y tapaba el camino hacia el río, y los animales no podían ir a beber agua",
        "deco": ["🌲", "🍄", "🦋"],
    },
    "mar": {
        "titulo": "el mar", "label": "Mar", "emoji": "🌊", "en": "a la orilla de un mar azul y brillante",
        "problema": "una tortuga marina había quedado atrapada en una red vieja y no podía volver al agua",
        "deco": ["🐚", "🐠", "⛵"],
    },
    "espacio": {
        "titulo": "el espacio", "label": "Espacio", "emoji": "🚀", "en": "en una pequeña nave que viajaba entre las estrellas",
        "problema": "la estrella más pequeña del cielo se había apagado y tenía miedo de quedarse a oscuras para siempre",
        "deco": ["⭐", "🪐", "🌙"],
    },
    "castillo": {
        "titulo": "el castillo", "label": "Castillo", "emoji": "🏰", "en": "en un castillo con torres altísimas",
        "problema": "la llave del gran portón se había perdido y nadie podía salir a jugar al jardín",
        "deco": ["👑", "🗝️", "🌹"],
    },
    "ciudad": {
        "titulo": "la ciudad", "label": "Ciudad", "emoji": "🏙️", "en": "en una ciudad llena de calles de colores",
        "problema": "el parque del barrio estaba lleno de basura y los pájaros ya no querían cantar allí",
        "deco": ["🚲", "🌳", "🐦"],
    },
    "selva": {
        "titulo": "la selva", "label": "Selva", "emoji": "🌴", "en": "en una selva verde donde cantaban mil pájaros",
        "problema": "un monito bebé se había perdido y no encontraba a su mamá",
        "deco": ["🐒", "🦜", "🌺"],
    },
    "montana": {
        "titulo": "la montaña", "label": "Montaña", "emoji": "🏔️", "en": "en lo alto de una montaña nevada",
        "problema": "se acercaba una tormenta de nieve y una cabrita no encontraba el camino a su casa",
        "deco": ["❄️", "🐐", "☁️"],
    },
    "granja": {
        "titulo": "la granja", "label": "Granja", "emoji": "🚜", "en": "en una granja con un granero rojo",
        "problema": "los huevos de la gallina Clotilde habían desaparecido justo antes de nacer los pollitos",
        "deco": ["🐔", "🐮", "🌻"],
    },
}

VALORES = {
    "amistad": {
        "label": "Amistad", "emoji": "🤝",
        "solucion": "{a} y {b} se tomaron de la mano y decidieron que, juntos, nada era imposible. Cada uno puso lo mejor de sí: uno tenía buenas ideas y el otro mucha fuerza.",
        "moraleja": "Con un buen amigo al lado, cualquier problema se vuelve más pequeño.",
    },
    "valentia": {
        "label": "Valentía", "emoji": "🦁",
        "solucion": "{a} sintió un poquito de miedo, pero respiró hondo, contó hasta tres y dio el primer paso. {b} le gritó: ¡tú puedes!",
        "moraleja": "Ser valiente no es no tener miedo: es intentarlo aunque lo tengas.",
    },
    "compartir": {
        "label": "Compartir", "emoji": "🍎",
        "solucion": "{a} abrió su mochila y compartió todo lo que tenía: una cuerda, una linterna y unas galletas. {b} también sacó lo suyo, y con todo junto armaron un gran plan.",
        "moraleja": "Cuando compartimos, todos tenemos más.",
    },
    "honestidad": {
        "label": "Decir la verdad", "emoji": "💬",
        "solucion": "Al principio {a} se había equivocado de camino, pero en vez de esconderlo dijo la verdad. Gracias a eso, {b} supo dónde buscar y encontraron la solución.",
        "moraleja": "Decir la verdad, aunque cueste, siempre ayuda a arreglar las cosas.",
    },
    "paciencia": {
        "label": "Paciencia", "emoji": "🐢",
        "solucion": "No funcionó a la primera, ni a la segunda. Pero {a} y {b} no se rindieron: lo intentaron con calma, paso a pasito, hasta que por fin lo lograron.",
        "moraleja": "Las cosas importantes a veces toman tiempo, y la paciencia es una gran ayuda.",
    },
    "naturaleza": {
        "label": "Cuidar la naturaleza", "emoji": "🌱",
        "solucion": "{a} y {b} trabajaron con cuidado para no dañar ninguna planta ni asustar a ningún animal. Al terminar, plantaron una semillita como regalo.",
        "moraleja": "Si cuidamos la naturaleza, ella nos cuida a nosotros.",
    },
}

OPCIONES = {
    "personajes": {k: {"label": v["label"], "emoji": v["emoji"]} for k, v in PERSONAJES.items()},
    "lugares": {k: {"label": v["label"], "emoji": v["emoji"], "deco": v["deco"]} for k, v in LUGARES.items()},
    "valores": {k: {"label": v["label"], "emoji": v["emoji"]} for k, v in VALORES.items()},
}

_NAME_RE = re.compile(r"[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]")


def clean_name(s: str | None, default: str) -> str:
    s = _NAME_RE.sub("", (s or "")).strip()[:20]
    return s[:1].upper() + s[1:] if s else default


def clean_idea(s: str | None) -> str:
    s = re.sub(r"[<>{}\[\]`]", "", (s or "")).strip()
    return re.sub(r"\s+", " ", s)[:160]


def _o(g: str) -> str:
    return "a" if g == "f" else "o"


# --------------------------------------------------------------------------------------
# Motor 1: plantillas
# --------------------------------------------------------------------------------------
def make_story_template(nombre, personaje, amigo, amigo_tipo, lugar, valor, seed=None) -> dict:
    rnd = random.Random(seed)
    p = PERSONAJES[personaje]
    q = PERSONAJES[amigo_tipo]
    lu = LUGARES[lugar]
    va = VALORES[valor]
    o, oq = _o(p["g"]), _o(q["g"])

    rasgos = [
        "Le encantaba hacer preguntas y descubrir cosas nuevas.",
        "Tenía una risa tan contagiosa que todos sonreían al escucharla.",
        "Siempre llevaba una mochila llena de cosas útiles, por si acaso.",
        "Cada mañana saludaba al sol con un gran bostezo.",
    ]
    llegadas = [
        f"Un día, mientras paseaba, escuchó una vocecita detrás de unas hojas. Era {amigo}, {q['un']} muy simpátic{oq}.",
        f"Una tarde conoció a {amigo}, {q['un']} que estaba sentad{oq} mirando el horizonte.",
        f"Un buen día apareció {amigo}, {q['un']} que corría muy apurad{oq}.",
    ]
    saludos = [
        f"—¡Hola! ¿Quieres ser mi amig{oq}? —preguntó {nombre}. Y {amigo} dijo que sí con una enorme sonrisa.",
        f"—¿Jugamos juntos? —dijo {amigo}. {nombre} aceptó feliz, y desde ese momento fueron inseparables.",
    ]
    finales = [
        f"Esa noche, {nombre} y {amigo} miraron el cielo y se prometieron vivir muchas aventuras más.",
        f"Todos celebraron con una gran fiesta, y {nombre} se fue a dormir content{o} y orgullos{o}.",
        f"Desde ese día, cada vez que alguien necesita ayuda, sabe a quién llamar: a {nombre} y a {amigo}.",
    ]

    paginas = [
        f"Había una vez {p['un']} llamad{o} {nombre} que vivía {lu['en']}. {rnd.choice(rasgos)}",
        f"{rnd.choice(llegadas)} {rnd.choice(saludos)}",
        f"Pero de pronto pasó algo: {lu['problema']}. {nombre} y {amigo} se miraron y supieron que tenían que ayudar.",
        va["solucion"].format(a=nombre, b=amigo) + " ¡Y lo consiguieron! Todos aplaudieron de alegría.",
        f"{rnd.choice(finales)} Y aprendieron algo muy importante. {va['moraleja']}",
    ]

    lugares_otros = rnd.sample([v["label"] for k, v in LUGARES.items() if k != lugar], 2)
    opts_lugar = [lu["label"]] + lugares_otros
    rnd.shuffle(opts_lugar)
    otros_valores = rnd.sample([v["label"] for k, v in VALORES.items() if k != valor], 2)
    opts_valor = [va["label"]] + otros_valores
    rnd.shuffle(opts_valor)
    preguntas = [
        {"p": f"¿Dónde vivía {nombre}?", "opciones": opts_lugar, "correcta": opts_lugar.index(lu["label"])},
        {"p": "¿Qué aprendieron en el cuento?", "opciones": opts_valor, "correcta": opts_valor.index(va["label"])},
    ]
    return {
        "titulo": f"{nombre} y {amigo}: una aventura en {lu['titulo']}",
        "paginas": paginas,
        "preguntas": preguntas,
        "motor": "plantilla",
    }


# --------------------------------------------------------------------------------------
# Motor 2: IA (opcional) con límites de uso para controlar el costo
# --------------------------------------------------------------------------------------
AI_MODEL = os.getenv("CREA_CUENTO_MODEL", "claude-haiku-5-5")
_hits_by_ip: dict[str, deque] = {}
_day_counter = {"day": "", "count": 0}


def ai_enabled() -> bool:
    return bool((os.getenv("ANTHROPIC_API_KEY") or "").strip())


def _allow(ip: str) -> bool:
    """Máx. CREA_CUENTO_POR_HORA por IP y CREA_CUENTO_MAX_DIA en total (por proceso)."""
    per_hour = int(os.getenv("CREA_CUENTO_POR_HORA", "5"))
    per_day = int(os.getenv("CREA_CUENTO_MAX_DIA", "300"))
    now = time.time()
    today = time.strftime("%Y-%m-%d")
    if _day_counter["day"] != today:
        _day_counter.update(day=today, count=0)
    if _day_counter["count"] >= per_day:
        return False
    q = _hits_by_ip.setdefault(ip, deque())
    while q and now - q[0] > 3600:
        q.popleft()
    if len(q) >= per_hour:
        return False
    q.append(now)
    _day_counter["count"] += 1
    return True


SYSTEM_PROMPT = """Eres un autor de cuentos infantiles en español latinoamericano para niños de 4 a 9 años.
Escribes cuentos cortos, tiernos, alegres y seguros: sin violencia, sin miedo intenso, sin contenido
adulto, sin marcas ni personajes con derechos de autor, sin datos personales.
Si la idea del niño trae algo inapropiado o que da miedo, transfórmalo con suavidad en algo amable.
Usa frases cortas y vocabulario sencillo, ideal para leer en voz alta con karaoke.
Responde SOLO con JSON válido, sin texto antes ni después, con esta forma exacta:
{"titulo": "...", "paginas": ["...", "...", "...", "...", "..."],
 "preguntas": [{"p": "...", "opciones": ["...", "...", "..."], "correcta": 0}, {...}]}
Reglas: exactamente 5 páginas de 2 a 4 oraciones cada una (máximo 55 palabras por página);
exactamente 2 preguntas fáciles sobre el cuento con 3 opciones y el índice de la correcta."""


def _validate(data) -> dict | None:
    if not isinstance(data, dict):
        return None
    titulo = str(data.get("titulo") or "").strip()[:90]
    paginas = [str(x).strip()[:450] for x in (data.get("paginas") or []) if str(x).strip()]
    if not titulo or not (3 <= len(paginas) <= 6):
        return None
    preguntas = []
    for q in data.get("preguntas") or []:
        try:
            opciones = [str(o)[:60] for o in q["opciones"]][:4]
            correcta = int(q["correcta"])
            if str(q["p"]).strip() and 2 <= len(opciones) and 0 <= correcta < len(opciones):
                preguntas.append({"p": str(q["p"])[:140], "opciones": opciones, "correcta": correcta})
        except (KeyError, TypeError, ValueError):
            continue
    return {"titulo": titulo, "paginas": paginas, "preguntas": preguntas[:3], "motor": "ia"}


def make_story_ai(nombre, personaje, amigo, amigo_tipo, lugar, valor, idea) -> dict | None:
    key = (os.getenv("ANTHROPIC_API_KEY") or "").strip()
    if not key:
        return None
    p, q, lu, va = PERSONAJES[personaje], PERSONAJES[amigo_tipo], LUGARES[lugar], VALORES[valor]
    user = (
        f"Protagonista: {nombre}, {p['un']}.\n"
        f"Amigo/a: {amigo}, {q['un']}.\n"
        f"Lugar: {lu['label']}.\n"
        f"Valor que enseña el cuento: {va['label']}.\n"
        + (f"Idea del niño (úsala si es apropiada): {idea}\n" if idea else "")
    )
    try:
        r = httpx.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": AI_MODEL,
                "max_tokens": 1200,
                "system": SYSTEM_PROMPT,
                "messages": [{"role": "user", "content": user}],
            },
            timeout=25,
        )
        r.raise_for_status()
        text = "".join(b.get("text", "") for b in r.json().get("content", []) if b.get("type") == "text")
        m = re.search(r"\{.*\}", text, re.S)
        return _validate(json.loads(m.group(0))) if m else None
    except Exception as exc:  # red, cupo, JSON inválido... -> plantilla
        print(f"[crea-cuento] IA no disponible: {exc!r}", flush=True)
        return None


def make_story(form: dict, ip: str = "") -> dict:
    personaje = form.get("personaje") if form.get("personaje") in PERSONAJES else "nina"
    amigo_tipo = form.get("amigo_tipo") if form.get("amigo_tipo") in PERSONAJES else "perrita"
    lugar = form.get("lugar") if form.get("lugar") in LUGARES else "bosque"
    valor = form.get("valor") if form.get("valor") in VALORES else "amistad"
    nombre = clean_name(form.get("nombre"), "Luna")
    amigo = clean_name(form.get("amigo"), "Pipo")
    idea = clean_idea(form.get("idea"))

    story = None
    if ai_enabled() and _allow(ip or "?"):
        story = make_story_ai(nombre, personaje, amigo, amigo_tipo, lugar, valor, idea)
    if story is None:
        story = make_story_template(nombre, personaje, amigo, amigo_tipo, lugar, valor)
    story["escena"] = {
        "protagonista": PERSONAJES[personaje]["emoji"],
        "amigo": PERSONAJES[amigo_tipo]["emoji"],
        "lugar": lugar,
        "lugar_emoji": LUGARES[lugar]["emoji"],
        "deco": LUGARES[lugar]["deco"],
        "valor_emoji": VALORES[valor]["emoji"],
    }
    return story
