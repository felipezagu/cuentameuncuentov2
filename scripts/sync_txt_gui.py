#!/usr/bin/env python3
"""
Interfaz gráfica pequeña (tkinter) para convertir TXT con marcas (mm:ss) a .sync.json.

Ejecutar desde la raíz del proyecto:
  python scripts/sync_txt_gui.py

En Windows también: doble clic en sync_txt_gui.bat (en la raíz del repo).
"""

from __future__ import annotations

import sys
import traceback
from pathlib import Path

_scripts = Path(__file__).resolve().parent
if str(_scripts) not in sys.path:
    sys.path.insert(0, str(_scripts))

from txt_to_sync_json import DEFAULT_CAPERUCITA_SCENE_BOUNDARIES_SEC, convert_txt_to_sync

try:
    import tkinter as tk
    from tkinter import filedialog, messagebox, ttk
except ImportError as e:
    print("tkinter no está disponible:", e, file=sys.stderr)
    sys.exit(1)


def default_out_path(txt_path: Path) -> Path:
    stem = txt_path.stem
    if stem.endswith(".sync"):
        stem = stem[:-5]
    return txt_path.with_name(stem + ".sync.json")


class SyncTxtApp(tk.Tk):
    def __init__(self) -> None:
        super().__init__()
        self.title("TXT (mm:ss) → sync.json")
        self.minsize(560, 420)
        self.geometry("640x480")

        self.var_in = tk.StringVar()
        self.var_out = tk.StringVar()
        self.var_audio = tk.StringVar(value="caperucitarojahombre.mp3")
        self.var_guion = tk.StringVar(value="caperucitaroja.txt")
        self.var_duration = tk.StringVar()
        self.var_scenes = tk.StringVar(
            value=",".join(str(x) for x in DEFAULT_CAPERUCITA_SCENE_BOUNDARIES_SEC)
        )

        pad = {"padx": 8, "pady": 4}
        row = 0

        ttk.Label(self, text="Archivo TXT con tiempos (mm:ss):").grid(row=row, column=0, sticky="w", **pad)
        f0 = ttk.Frame(self)
        f0.grid(row=row, column=1, columnspan=2, sticky="ew", **pad)
        f0.columnconfigure(0, weight=1)
        ttk.Entry(f0, textvariable=self.var_in, width=50).grid(row=0, column=0, sticky="ew")
        ttk.Button(f0, text="Examinar…", command=self._browse_in).grid(row=0, column=1, padx=(6, 0))
        row += 1

        ttk.Label(self, text="Salida .sync.json:").grid(row=row, column=0, sticky="w", **pad)
        f1 = ttk.Frame(self)
        f1.grid(row=row, column=1, columnspan=2, sticky="ew", **pad)
        f1.columnconfigure(0, weight=1)
        ttk.Entry(f1, textvariable=self.var_out, width=50).grid(row=0, column=0, sticky="ew")
        ttk.Button(f1, text="Examinar…", command=self._browse_out).grid(row=0, column=1, padx=(6, 0))
        row += 1

        ttk.Label(self, text="Nombre del MP3 (en el JSON):").grid(row=row, column=0, sticky="w", **pad)
        ttk.Entry(self, textvariable=self.var_audio, width=48).grid(row=row, column=1, columnspan=2, sticky="ew", **pad)
        row += 1

        ttk.Label(self, text="Guion (sources.text):").grid(row=row, column=0, sticky="w", **pad)
        ttk.Entry(self, textvariable=self.var_guion, width=48).grid(row=row, column=1, columnspan=2, sticky="ew", **pad)
        row += 1

        ttk.Label(self, text="Duración audio (seg), opcional:").grid(row=row, column=0, sticky="w", **pad)
        ttk.Entry(self, textvariable=self.var_duration, width=48).grid(row=row, column=1, columnspan=2, sticky="ew", **pad)
        row += 1

        ttk.Label(self, text="Cortes de escena (seg, coma):").grid(row=row, column=0, sticky="nw", **pad)
        f2 = ttk.Frame(self)
        f2.grid(row=row, column=1, columnspan=2, sticky="ew", **pad)
        ttk.Entry(f2, textvariable=self.var_scenes, width=40).grid(row=0, column=0, sticky="ew")
        ttk.Button(f2, text="Preset Caperucita", command=self._preset_caperucita).grid(
            row=0, column=1, padx=(8, 0)
        )
        row += 1

        ttk.Separator(self, orient="horizontal").grid(row=row, column=0, columnspan=3, sticky="ew", pady=8)
        row += 1

        ttk.Button(self, text="Generar sync.json", command=self._convert).grid(row=row, column=0, columnspan=3, pady=6)
        row += 1

        ttk.Label(self, text="Resultado:").grid(row=row, column=0, sticky="nw", **pad)
        self.log = tk.Text(self, height=12, wrap="word", font=("Consolas", 9))
        self.log.grid(row=row, column=1, columnspan=2, sticky="nsew", **pad)
        sb = ttk.Scrollbar(self, command=self.log.yview)
        sb.grid(row=row, column=3, sticky="ns")
        self.log["yscrollcommand"] = sb.set
        row += 1

        self.columnconfigure(1, weight=1)
        self.rowconfigure(row - 1, weight=1)

        self.var_in.trace_add("write", lambda *_: self._maybe_fill_out())

    def _log(self, msg: str) -> None:
        self.log.insert("end", msg + "\n")
        self.log.see("end")
        self.update_idletasks()

    def _maybe_fill_out(self) -> None:
        p = self.var_in.get().strip()
        if not p:
            return
        try:
            inp = Path(p)
            if inp.is_file() and not self.var_out.get().strip():
                self.var_out.set(str(default_out_path(inp)))
        except OSError:
            pass

    def _browse_in(self) -> None:
        path = filedialog.askopenfilename(
            title="TXT con marcas (mm:ss)",
            filetypes=[("Texto", "*.txt"), ("Todos", "*.*")],
        )
        if path:
            self.var_in.set(path)
            self.var_out.set(str(default_out_path(Path(path))))

    def _browse_out(self) -> None:
        path = filedialog.asksaveasfilename(
            title="Guardar sync.json",
            defaultextension=".json",
            filetypes=[("sync JSON", "*.sync.json"), ("JSON", "*.json"), ("Todos", "*.*")],
        )
        if path:
            if not path.endswith(".json"):
                path += ".sync.json"
            self.var_out.set(path)

    def _preset_caperucita(self) -> None:
        self.var_scenes.set(",".join(str(x) for x in DEFAULT_CAPERUCITA_SCENE_BOUNDARIES_SEC))

    def _convert(self) -> None:
        self.log.delete("1.0", "end")
        inp_s = self.var_in.get().strip()
        out_s = self.var_out.get().strip()
        if not inp_s:
            messagebox.showwarning("Falta archivo", "Elige el archivo TXT de entrada.")
            return
        inp = Path(inp_s)
        if not inp.is_file():
            messagebox.showerror("Error", f"No existe el archivo:\n{inp}")
            return

        out_path = Path(out_s) if out_s else default_out_path(inp)

        dur: float | None = None
        ds = self.var_duration.get().strip()
        if ds:
            try:
                dur = float(ds.replace(",", "."))
            except ValueError:
                messagebox.showerror("Error", "Duración: usa un número (ej. 110 o 110,5).")
                return

        try:
            path, n = convert_txt_to_sync(
                inp,
                out=out_path,
                audio=self.var_audio.get().strip() or "audio.mp3",
                text_source=self.var_guion.get().strip() or "guion.txt",
                duration=dur,
                scene_boundaries_csv=self.var_scenes.get().strip() or None,
            )
        except ValueError as e:
            self._log(str(e))
            messagebox.showerror("Error", str(e))
            return
        except Exception:
            self._log(traceback.format_exc())
            messagebox.showerror("Error", "Fallo inesperado (ver log abajo).")
            return

        msg = f"Listo: {n} segmentos guardados en:\n{path}"
        self._log(msg)
        messagebox.showinfo("OK", f"{n} segmentos →\n{path}")


def main() -> None:
    app = SyncTxtApp()
    app.mainloop()


if __name__ == "__main__":
    main()
