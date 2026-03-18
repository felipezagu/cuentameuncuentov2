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
