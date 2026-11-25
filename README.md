# Cuéntame un Cuento

Aplicación web infantil para leer y escuchar cuentos interactivos con modo karaoke, desarrollada con **FastAPI**, **TailwindCSS**, **HTML5/CSS3/JS** y **SQLite**.

## Requisitos

- Python 3.10+
- pip

## Instalación

```bash
cd cuentameuncuentov2
pip install -r requirements.txt
cp .env.example .env   # y define ADMIN_KEY
python scripts/cargar_cuentos_en_db.py
```

## Ejecución

**Solo en tu PC:**
```bash
uvicorn backend.main:app --reload
```

**Para usar desde el celular (misma WiFi):** arranca el servidor escuchando en toda la red:
```bash
python run.py
```
(o: `uvicorn backend.main:app --reload --host 0.0.0.0`)

Luego:
- En la PC: `http://localhost:8000/`
- En el celular: `http://192.168.100.76:8000/` (usa la IP de tu PC en la red; si cambia, revisa con `ipconfig` en Windows).
- Panel admin: `http://localhost:8000/admin` (también funciona si abres la app por IP de tu red, p. ej. `http://192.168.x.x:8000/admin`).
- Herramientas TTS/sync: `/tools/tts-upload` (mismas reglas que el admin; en producción pública están ocultas).

## Estructura del proyecto

```
backend/
  main.py              arma la app (middlewares, estáticos, routers)
  config.py            rutas, .env y plantillas
  security.py          acceso a /admin y /tools (red local + sesión)
  models.py            Story, Scene, Narration (voz hombre/mujer), StoryAlias, estadísticas
  db_init.py           crear/migrar la BD y cargar cuentos.json
  stats.py             contadores de visitas/lecturas
  routes/
    pages.py           páginas públicas, contacto, sitemap
    stories.py         API pública  /api/stories
    admin.py           API admin    /api/admin   (requiere login)
    admin_pages.py     panel        /admin
    tools.py           herramientas de narración /tools (solo local)
frontend/
  templates/           HTML (Jinja2)
  static/js/main.js    portada: catálogo, filtros, favoritos
  static/js/rewards.js estrellas y álbum de cuentos leídos (localStorage)
  static/js/story/     página del cuento, en orden de carga:
    state.js  voices.js  pages.js  player.js  quiz.js  main.js  interact.js
cuentos.json           fuente de verdad de los cuentos
imagenes/<cuento>/     ilustraciones, MP3 por voz y sync.json
scripts/               utilidades (scripts/legacy = migraciones antiguas ya aplicadas)
```

## Base de datos

- **Sincronizar con `cuentos.json`:** `python scripts/cargar_cuentos_en_db.py` (Railway lo hace en cada despliegue).
  Actualiza cada cuento por su `id` y **conserva las estadísticas**; `--reset` borra todo y carga de cero.
- Cada cuento tiene un `id` fijo (no lo cambies: es su URL `/cuento/<id>`). Para un cuento nuevo, usa un número que no exista o deja el `id` fuera.
- `ids_antiguos`: URLs viejas que redirigen a ese cuento.
- **Después de actualizar el código:** `python scripts/migrar_db.py` (no borra nada; es seguro repetirlo).

### Formato de un cuento en `cuentos.json`

Cada cuento aparece **una sola vez**; sus voces van en `narraciones`:

```json
{
  "titulo": "Caperucita Roja",
  "descripcion": "…",
  "portada": "/imagenes/portadas/caperucitaroja.jpg",
  "categoria": "Clásico",
  "autor": "Charles Perrault",
  "destacado": true,
  "preguntas": [{ "p": "¿A quién visitaba?", "opciones": ["…", "…"], "correcta": 1 }],
  "narraciones": [
    { "voz": "hombre", "audio": "/imagenes/caperucitaroja/caperucitarojahombre.mp3",
      "sync": "/imagenes/caperucitaroja/caperucitarojahombre.sync.json" },
    { "voz": "mujer",  "audio": "/imagenes/caperucitaroja/caperucitarojamujer.mp3",
      "sync": "/imagenes/caperucitaroja/caperucitarojamujer.sync.json" }
  ],
  "escenas": [{ "orden": 1, "texto": "…", "imagen": "/imagenes/caperucitaroja/01.png" }]
}
```

## Cómo interactúa el niño con un cuento

- **Escuchar** con voz de hombre o mujer (se cambia sin salir del cuento; se recuerda la elección).
- **Lo leo yo:** sin narrador; pasa las páginas a su ritmo y puede pedir **Léemelo** desde la página actual.
- **Karaoke palabra a palabra:** las palabras leídas se colorean y la actual se marca en amarillo.
- **Tocar una palabra** para escucharla.
- **Deslizar** con el dedo (o flechas ← → del teclado) para cambiar de página; **espacio** pausa.
- **Estrellas:** 1 por terminar el cuento, +1 por acertar la mitad del quiz, +1 por acertarlo todo.
  En la portada se ve el progreso ("X de N cuentos leídos") y una fila de cuentos aún no leídos.
- **Puntos de página** bajo el libro para saltar a cualquier página, y botones **A− / A+** para el tamaño de letra.
- **Confeti** al conseguir las 3 estrellas.
- **Cuento del día** en la portada (el mismo para todos, cambia a medianoche).
- **App instalable** (PWA): botón "Instalar" en navegadores compatibles; los cuentos ya abiertos se pueden ver sin internet.

## Crea tu cuento (`/crea-tu-cuento`)

El niño elige héroe, amigo, lugar y valor (o aprieta 🎲 *Sorpréndeme*) y recibe un cuento de 5 páginas
con escena animada, lectura en voz alta con karaoke y 2 preguntas. Los cuentos creados se guardan en el
navegador ("Mis cuentos creados").

- **Sin configurar nada:** se arma con plantillas (gratis, siempre funciona).
- **Con IA:** define `ANTHROPIC_API_KEY` en las variables de Railway. Usa Claude Haiku: cada cuento
  cuesta una fracción de centavo de dólar. `CREA_CUENTO_POR_HORA` y `CREA_CUENTO_MAX_DIA` ponen un
  tope de gasto; al superarlo, o si la IA falla, se usan las plantillas automáticamente.
  Con IA aparece además un campo "¿Tienes una idea?" para que el niño proponga algo propio.

## Imágenes

Las ilustraciones están en **WebP** (≈ 8 veces más livianas que los PNG originales: de 208 MB a 24 MB).
Al agregar imágenes nuevas en `.png`/`.jpg`:

```bash
python scripts/optimizar_imagenes.py   # convierte a WebP y crea miniaturas de portadas
python scripts/migrar_db.py            # actualiza las rutas en la base de datos
```

## CSS

Tailwind se compila localmente. Si agregas clases nuevas en plantillas o JS:

```bash
cd tailwind
npm install          # solo la primera vez
npm run build:css    # genera frontend/static/css/tailwind.css (súbelo al repo)
```

## Exportar cuentos a TXT (un archivo por cuento, 5 párrafos)

Desde `cuentos.json` se genera un **`.txt` por cada cuento** en la carpeta **`cuentos/`**. El nombre del archivo es el **título del cuento** (caracteres raros se sustituyen por `_`). Cada archivo contiene **las 5 escenas** del JSON como **cinco párrafos** separados por **una línea en blanco** (orden 1 → 5), listos para locución o para añadir marcas `(mm:ss)` después.

```bash
python scripts/exportar_cuentos_txt.py
```

Vuelve a ejecutar el script cuando actualices `cuentos.json`. Si dos cuentos comparten el mismo título, el segundo archivo lleva sufijo `_2`, `_3`, etc.

**Flujo sugerido para narración:** exportar → generar audio del texto → crear `loquesea.mp3.txt` con tiempos (estilo any2text) → `sync_txt_gui` / `txt_to_sync_json.py` → subir MP3 + `.sync.json` y enlazar en el cuento (`narracion_audio`, `narracion_sync`).

## Herramienta: TXT con `(mm:ss)` → `sync.json` (narración)

Sirve para alinear la narración grabada (MP3) con las **páginas / escenas** del cuento en la web.

### Qué necesitas

1. Un **MP3** de la narración.
2. Un **`.txt`** donde cada frase (o trozo) lleve una marca **`(mm:ss)`** al inicio, con el tiempo **desde el inicio del audio** (ej. `(01:23)` = 83 segundos). El texto puede ir en varias líneas; cada segmento va desde una marca hasta la siguiente.
3. Saber la **duración total del MP3 en segundos** (para el último tramo del JSON). Si no la pones, el último segmento se estima.
4. Definir los **límites entre páginas** (ver abajo): lista de segundos separados por comas.

### Pasos para generar el archivo

1. Prepara el `.txt` con las marcas `(mm:ss)` (por ejemplo exportando desde subtítulos y adaptando el formato).
2. Abre la herramienta:
   - **Windows:** doble clic en `sync_txt_gui.bat` en la raíz del proyecto, **o**
   - En terminal: `python scripts/sync_txt_gui.py`
3. Elige el **TXT de entrada** y revisa la ruta del **`.sync.json`** de salida.
4. Indica el **nombre del MP3** tal como estará en la carpeta del cuento (ej. `caperucitarojahombre.mp3`).
5. En **Guion**, el nombre del archivo de texto del cuento que referencia el JSON (ej. `caperucitaroja.txt`).
6. Opcional: **duración del audio en segundos** (recomendado; coincide con el final real del MP3).
7. **Cortes de escena:** escribe los números separados por comas (sin espacios obligatorios) o usa el botón **Preset Caperucita** si aplica.
8. Pulsa **Generar sync.json** y coloca el JSON (y el MP3) en la carpeta del cuento; en la base o en `cuentos.json` apunta `narracion_sync` a ese archivo.

**Línea de comandos (equivalente):**

```bash
python scripts/txt_to_sync_json.py ruta/al/archivo.txt --out salida.sync.json --audio cuento.mp3 --duration 110 --scene-boundaries 24,44,63,83
```

### Qué significa `24,44,63,83` (cortes de escena)

**No** son “el segundo en que termina cada página” de forma aislada, sino los **instantes (en segundos desde el inicio del audio) en los que empieza la página siguiente**.

Con **5 páginas** hacen falta **4 números**: cada valor es el primer segundo en que ya aplica la escena **1, 2, 3 y 4**. La **página 0** va desde el segundo **0** hasta **antes** del primer número.

| Página (escena) | Se muestra mientras el audio está en… |
|-----------------|----------------------------------------|
| 0 | `[0 s , 24 s)` — desde 0 hasta justo antes del segundo 24 |
| 1 | `[24 s , 44 s)` |
| 2 | `[44 s , 63 s)` |
| 3 | `[63 s , 83 s)` |
| 4 | desde **83 s** hasta el final del audio |

En la práctica: **24** es donde “pasa” de la página 0 a la 1 (coincide con el momento en que debería cambiar la ilustración de la primera a la segunda escena). Si tu cuento tiene **otro número de páginas**, necesitas **un número menos** de cortes (ej. 3 páginas → 2 números: `30,60`).

Los valores concretos los sacas escuchando el MP3 y anotando en qué segundo encaja cada cambio de escena con el guion.
