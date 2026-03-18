# Cómo instalar Cuéntame un Cuento en PythonAnywhere

## 1. Cuenta y proyecto

1. Entra en **https://www.pythonanywhere.com** y crea una cuenta (plan gratuito vale).
2. En el **Dashboard**, abre la pestaña **Consoles** y crea una **Bash**.

## 2. Clonar el proyecto desde GitHub

En la consola Bash:

```bash
cd ~
git clone https://github.com/TU_USUARIO/cuentameuncuento.git
cd cuentameuncuento
```

(Sustituye `TU_USUARIO` por tu usuario de GitHub. Si el repo es privado, usa la URL con token o SSH.)

## 3. Crear el entorno virtual e instalar dependencias

```bash
python3.10 -m venv venv
source venv/bin/activate   # En Linux; en Windows sería venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt
```

Si `python3.10` no existe, prueba `python3.9` o el que ofrezca tu cuenta.

## 4. Crear la base de datos y cargar cuentos (opcional)

```bash
# Sigue en la misma consola con el venv activado (source venv/bin/activate)
python -c "from backend.main import init_db; init_db()"
# Si tienes cuentos.json y quieres cargarlos:
python scripts/cargar_cuentos_en_db.py
python scripts/integrar_imagenes_escenas.py
```

## 5. Configurar la Web app

1. En el **Dashboard**, ve a la pestaña **Web**.
2. Clic en **Add a new web app** → **Next** → elige **Manual configuration** (no Flask) → **Next** → elige **Python 3.10** (o la versión que usaste) → **Finish**.
3. En **Code**:
   - **Source code:** `/home/tuusuario/cuentameuncuento` (tu usuario en lugar de `tuusuario`).
   - **Working directory:** deja vacío o pon `/home/tuusuario/cuentameuncuento`.
4. **Virtualenv:** clic en el enlace y escribe:
   ```
   /home/tuusuario/cuentameuncuento/venv
   ```
   (con tu usuario).

## 6. Archivo WSGI

En la sección **Code** de la Web app, haz clic en el enlace del **WSGI configuration file** (algo como `/var/www/tuusuario_pythonanywhere_com_wsgi.py`). Borra todo y pega esto (ajustando `tuusuario`):

```python
import sys
import os

PROJECT_DIR = "/home/tuusuario/cuentameuncuento"
if PROJECT_DIR not in sys.path:
    sys.path.insert(0, PROJECT_DIR)
os.chdir(PROJECT_DIR)

from mangum import Mangum
from backend.main import app

application = Mangum(app)
```

Guarda el archivo (Save).

## 7. Archivos estáticos (Static files)

En la misma página de la Web app, baja a **Static files**. Añade estas entradas (con tu usuario):

| URL           | Directory |
|---------------|-----------|
| /static       | /home/tuusuario/cuentameuncuento/frontend/static |
| /uploads      | /home/tuusuario/cuentameuncuento/uploads |
| /imagenes     | /home/tuusuario/cuentameuncuento/imagenes |

Así el servidor sirve CSS, JS e imágenes directamente.

## 8. Variables de entorno (claves secretas)

En la Web app, en **Environment variables** (o en el WSGI antes de importar), añade por ejemplo:

- `LUMA_API_KEY` = tu clave de Luma (si usas generación de imágenes en el admin).

En la interfaz de PA suele ser algo como "Add a new environment variable": nombre `LUMA_API_KEY`, valor tu clave.

## 9. Recargar la app

En la pestaña **Web**, clic en el botón verde **Reload** de tu dominio.

Tu sitio quedará en: **https://tuusuario.pythonanywhere.com**

---

## Resumen de comandos (copiar/pegar en Bash)

```bash
cd ~
git clone https://github.com/TU_USUARIO/cuentameuncuento.git
cd cuentameuncuento
python3.10 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
python -c "from backend.main import init_db; init_db()"
```

Luego configura la Web app (Manual config, Python 3.10), virtualenv, WSGI y Static files como arriba, y Reload.

## Problemas frecuentes

- **502 Bad Gateway:** Revisa el **Error log** en la pestaña Web. Suele ser un fallo al importar (falta dependencia o ruta incorrecta en el WSGI).
- **Static files no cargan:** Comprueba que las rutas en Static files usen tu usuario y que existan las carpetas `frontend/static`, `uploads`, `imagenes`.
- **Base de datos vacía:** Ejecuta `python scripts/cargar_cuentos_en_db.py` y `python scripts/integrar_imagenes_escenas.py` desde la consola con el venv activado.
