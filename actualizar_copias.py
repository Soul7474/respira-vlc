"""
actualizar_copias.py · Copia los JSON de data/ dentro de index.html

La web lee data/*.json con fetch. Si se abre index.html con doble clic (file://),
el navegador no deja usar fetch, así que la página usa estas copias incrustadas.

Uso (desde la carpeta web/), después de ejecutar el notebook:
    python actualizar_copias.py
"""
import json
import re
from pathlib import Path

carpeta = Path(__file__).parent
html = (carpeta / "index.html").read_text(encoding="utf-8")

# id del <script> en el HTML  ->  archivo de data/
COPIAS = {
    "datos-2024": "aire_2024.json",
    "datos-evolucion": "no2_evolucion.json",
    "datos-horas": "no2_por_hora.json",
}

bloques = []
for id_script, archivo in COPIAS.items():
    datos = json.loads((carpeta / "data" / archivo).read_text(encoding="utf-8"))
    texto = json.dumps(datos, ensure_ascii=False, separators=(",", ":"))
    bloques.append(f'  <script type="application/json" id="{id_script}">{texto}</script>')

nuevo = ("<!-- COPIAS-DATOS: inicio (no editar a mano: lo genera actualizar_copias.py) -->\n"
         + "\n".join(bloques) + "\n  <!-- COPIAS-DATOS: fin -->")

patron = re.compile(r"<!-- COPIAS-DATOS: inicio.*?COPIAS-DATOS: fin -->", re.S)
html = patron.sub(lambda m: nuevo, html)
(carpeta / "index.html").write_text(html, encoding="utf-8")
print("Copias actualizadas:", ", ".join(COPIAS.values()))
