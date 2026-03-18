# Para PythonAnywhere (y otros hostings WSGI).
# En la consola de PA, el archivo WSGI suele estar en:
# /var/www/tuusuario_pythonanywhere_com_wsgi.py
# Pega ahí el contenido que tenga sentido para tu ruta (abajo).

import sys
import os

# Ruta de tu proyecto en PythonAnywhere (cámbiala por la tuya)
# Ejemplo: /home/tuusuario/cuentameuncuento
PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
if PROJECT_DIR not in sys.path:
    sys.path.insert(0, PROJECT_DIR)

os.chdir(PROJECT_DIR)

from mangum import Mangum
from backend.main import app

application = Mangum(app)
