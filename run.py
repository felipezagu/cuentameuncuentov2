"""
Arranca el servidor para que puedas abrir la app desde el celular en la misma red WiFi.
Escucha en 0.0.0.0 para aceptar conexiones desde cualquier dispositivo de la red.

En el celular abre: http://192.168.100.76:8000/
(Si tu IP cambia, ejecuta en la PC: ipconfig (Windows) o ifconfig (Mac/Linux) para verla)
"""
import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
