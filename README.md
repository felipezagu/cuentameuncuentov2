# Cuéntame un Cuento

Aplicación web infantil para leer y escuchar cuentos interactivos con modo karaoke, desarrollada con **FastAPI**, **TailwindCSS**, **HTML5/CSS3/JS** y **SQLite**.

## Requisitos

- Python 3.10+
- pip

## Instalación

```bash
cd cuentameuncuento
pip install -r requirements.txt
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
- Panel admin: `/admin`

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
