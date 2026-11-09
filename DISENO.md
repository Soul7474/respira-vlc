# Diseño e investigación · Respira VLC

Revisión del 3 de noviembre de 2026. Prioridad: experiencia visual de escritorio para una presentación en clase.

## Referencias consultadas

- [Black Hole, caso de Midnight](https://midnight.agency/work/black-hole): usa una secuencia vinculada al desplazamiento y un objeto 3D interactivo. Aplicación en Respira: una escena de ciudad que permanece visible mientras cuatro etapas explican la propuesta.
- [Immersive Scroll](https://immersivescroll.com/): presenta su trabajo mediante escenas y una narración por pasos. Aplicación: primero problema, demostración, funcionamiento, mapa e impacto; la elección de gama cierra el recorrido.
- [Chrome: Motion](https://developer.chrome.com/docs/modern-web-guidance/guides/ui-behaviors/motion) y [web.dev: animaciones de alto rendimiento](https://web.dev/articles/animations-guide): priorizan transformaciones y opacidad y explican las preferencias de movimiento. Aplicación: transiciones de la escena, títulos vinculados al scroll donde hay soporte, preferencia de movimiento reducido y botón de pausa. Los canvas se detienen fuera de pantalla y con la pestaña oculta.

Estas son decisiones de diseño aplicadas al proyecto; no implican una medición de conversión o de rendimiento en navegador.

## Cambios

- Catálogo, comparador, carrito y formulario trasladados a la última sección del contenido. El carrito deja de ocupar la cabecera.
- Ciudad ilustrada con una secuencia de cuatro etapas y navegación directa: medir, conectar, entender, actuar.
- Calculadora conectada a una red de puntos proporcional y tres escenarios. No calcula reducciones de contaminación ni representa posiciones geográficas.
- Fuentes y diagrama técnico en desplegables; los textos y referencias se conservan.
- Control de pausa para explicar el proyecto sin movimiento de fondo.

## Ilustración

Archivo: `img/ciudad-respira.png`, 1536 × 1024 px. Generada con la herramienta integrada de ImageGen. Es una maqueta conceptual, no una fotografía ni un mapa de ubicaciones reales. La imagen se guarda en el proyecto y funciona sin conexión.

Prompt final:

```text
Use case: stylized-concept. Asset type: premium interactive website illustration for Respira VLC, a fictional educational air quality sensor network in Valencia. Create a richly detailed architectural miniature 3D diorama of one Mediterranean city neighborhood, seen from a high three-quarter isometric view. A floating diamond-shaped city block with beautiful warm ivory plaster apartment buildings, terracotta roof details, one small school, orange city bus, a bicycle lane, street lamps, citrus trees, palms, a broad winding planted green park inspired by the Turia. Several tiny elegant off-white air sensor boxes mounted on school and street lamps. Make it feel like a premium architectural scale model with tactile materials and extraordinary soft lighting, natural tiny cast shadows, a sophisticated Blender or Octane studio render. Mostly warm cream, muted sage, deep forest green, restrained burnt orange accents. Plain very dark forest-green studio background #101f19 fading naturally toward edges. The complete miniature should fit comfortably centered in the frame with generous 10 percent empty margins, all buildings clearly visible, no cropping. Landscape composition 3:2. Do NOT add any text, labels, UI, borders, logos, network lines, glows, data, watermarks or people in closeup. The image is conceptual, not an accurate geographical map. High quality final website asset.
```

## Verificación

Comprobadas la estructura HTML, las referencias accesibles, las anclas y la existencia de recursos locales. Los siete scripts pasan la comprobación de sintaxis. Las pruebas de lógica en un entorno DOM simulado cubren el carrito, IVA, cuota anual, tres escenarios, valores cero y máximos, representación proporcional, cuatro etapas y pausa de canvas.

No se ha realizado una revisión visual ni una medición de rendimiento en navegador: el host de acceso al navegador no está disponible en esta sesión. La captura de ventanas y la inspección visual final quedan pendientes.
