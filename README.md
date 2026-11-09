# Respira VLC · web de Marinada Labs

Web comercial del proyecto de 2.º ASIR sobre el **ODS 11 (meta 11.6, calidad del aire)** en València.
Marinada Labs es la empresa (ficticia) y Respira VLC su producto: sensores de calidad del aire en farolas,
colegios, autobuses de la EMT y bicis Valenbisi, más una app que muestra el aire calle a calle.

Equipo: Saul Martin (datos y pandas) y Marcos Soria (web, diseño y producto).

## Estructura de carpetas

```
web/
├── index.html             Página única con todas las secciones
├── actualizar_copias.py   Copia los JSON de data/ dentro de index.html (para abrirla con doble clic)
├── css/styles.css         Estilos (temas claro y oscuro, responsive, tipografía local)
├── js/
│   ├── main.js            Utilidades, tema claro/oscuro, menú, vídeos, aparición al bajar, comparador
│   ├── hero.js            Fondo animado de partículas de la portada (canvas)
│   ├── datos.js           Carga de los JSON, tarjetas KPI, gráficas Chart.js, tabla y sección de pandas
│   ├── mapa.js            Mapa Leaflet con estaciones oficiales y nodos propuestos
│   └── tienda.js          Carrito, formulario de pedido y calculadora de impacto
├── img/                   Logos propios en SVG (empresa, producto, favicon)
├── vendor/                Copias locales de Chart.js 4.4.1, Leaflet 1.9.4 y la tipografía
└── data/                  JSON generados por el notebook de pandas
    ├── aire_2024.json         Medias anuales 2024 por estación (Generalitat)
    ├── no2_evolucion.json     NO₂ medio por año 2016-2022 (datos abiertos del Ayuntamiento)
    └── no2_por_hora.json      NO₂ medio por hora del día en 2022 (datos abiertos del Ayuntamiento)
```

## Cómo abrirla

### Diseño e interacciones

La portada permite explorar las ocho estaciones oficiales y actualiza el valor de NO₂, la referencia de 2030 y el punto destacado del plano. El plano es ilustrativo; las ubicaciones oficiales siguen en el mapa Leaflet.

La sección **«Dale aire a la ciudad»** incluye un sensor dibujado en 3D con CSS, conexiones animadas y partículas en canvas que reaccionan al cursor. El botón **«Activa la marinada»** cambia la brisa. Es una simulación visual, sin mediciones reales. El plano y las tarjetas del catálogo responden al cursor con luz y profundidad.

Los efectos se definen en `css/experience.css` y `js/experience.js`. Respetan la preferencia de movimiento reducido. La simulación se pausa al salir de pantalla o al ocultar la pestaña. El diseño se ha orientado a escritorio y a la presentación en clase.

El recorrido **«Una ciudad conectada. Calle a calle»** usa una ilustración 3D conceptual generada con IA (`img/ciudad-respira.png`). Al bajar se activan cuatro etapas: medir, conectar, entender y actuar. La calculadora dibuja una red proporcional y ofrece tres escenarios ilustrativos. `css/story.css` y `js/story.js` definen estas interacciones. El botón de pausa de la cabecera detiene los efectos decorativos y los canvas.

El **catálogo, comparador y pedido son la última sección**, después de equipo y fuentes. El carrito está dentro de ese cierre. Las referencias de diseño y el prompt de la ilustración están en [DISENO.md](DISENO.md).

**Funciona sin Internet.** Chart.js, Leaflet, la tipografía y los datos están dentro de la carpeta.
Si la copia local faltara, la página pide Chart.js y Leaflet al CDN como respaldo.

- **Recomendado:** VS Code + Live Server, o desde `web/`: `python -m http.server 8000` y abrir http://localhost:8000
- **Doble clic en `index.html`:** también funciona. El navegador no deja usar `fetch` con `file://`,
  así que la página usa las copias de los datos que hay dentro del HTML.

Solo necesitan Internet:
- **El fondo del mapa** (calles de OpenStreetMap). Sin conexión, los puntos y sus datos se ven igual y aparece un aviso.
- **Los vídeos** (YouTube). Sin conexión, se ve el aviso «Vídeo no disponible sin conexión».

## Si cambian los datos

1. Ejecutar el notebook `datos/analisis_aire_valencia.ipynb` (escribe los JSON en `web/data/`).
2. Desde `web/`: `python actualizar_copias.py` (actualiza las copias dentro de `index.html`).

## Secciones

1. **Portada y demostración:** explorador de estaciones con datos reales, tres cifras clave, plano ilustrativo y laboratorio de brisa interactivo con sensor 3D.
2. **El problema (ODS 11):** meta 11.6, Capital Verde 2024, ZBE y el bloque "Cumplimos hoy. No cumplimos mañana" calculado desde el JSON. Ilustración propia en SVG.
3. **Vídeos:** dos vídeos de la OMS (BreatheLife) en español. Solo se cargan al pulsar *play* y usan youtube-nocookie.com.
4. **Cómo funciona:** recorrido visual de cuatro etapas con ciudad 3D; esquema técnico SVG desplegable y fichas técnicas.
5. **Mapa:** estaciones con su NO₂ de 2024 (coordenadas oficiales del geoportal municipal), otras estaciones municipales en gris y nodos Respira propuestos.
6. **Datos:** tarjetas KPI, gráficas de NO₂ y PM2.5 con los límites UE hoy / UE 2030 / OMS, evolución 2016-2022, NO₂ por hora, tabla completa, explicación y **"Así lo hemos analizado con pandas"**.
7. **Calculadora:** red visual de sensores, tres escenarios ilustrativos, aulas, alumnos y puntos de medida frente a las 8 estaciones oficiales, y coste con los precios del catálogo.
8. **Equipo** y **9. Fuentes** (referencias desplegables).
10. **Catálogo y pedido, al final:** cinco gamas con ilustración, comparador, carrito con IVA del 21 % y formulario simulado (no envía nada).

Proyecto educativo ficticio de 2.º ASIR. Propuesta dirigida al Ayuntamiento de València; no es una colaboración oficial.
