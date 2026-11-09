/* =====================================================================
   hero.js · Fondo animado de la portada
   Partículas que representan el aire contaminado (tonos pardos).
   Al mover el ratón (o el dedo) cerca, o al bajar por la página,
   la "marinada" las limpia: se vuelven verdes y se las lleva la brisa.
   - Se detiene cuando la portada no se ve o la pestaña está oculta (ahorra batería).
   - Con "reducir movimiento" activado se dibuja una sola imagen fija.
   ===================================================================== */
(function () {
  'use strict';

  var lienzo = document.getElementById('lienzo-aire');
  var hero = document.getElementById('inicio');
  if (!lienzo || !lienzo.getContext) return;

  var ctx = lienzo.getContext('2d');
  var particulas = [];
  var ancho = 0, alto = 0, escala = 1;
  var raton = { x: -9999, y: -9999, activo: false };
  var limpiezaScroll = 0;   // de 0 (nada) a 1 (todo limpio) según lo que se ha bajado
  var animando = false;
  var visible = true;
  var idFrame = null;

  // Colores: aire sucio (pardo) y aire limpio (verde mar)
  var SUCIO = [184, 156, 124];
  var LIMPIO = [92, 214, 164];
  var RADIO_RATON = 130;    // píxeles alrededor del ratón que se limpian

  /** Mezcla dos colores RGB: t = 0 da el primero y t = 1 el segundo. */
  function mezclar(a, b, t) {
    return 'rgb(' + Math.round(a[0] + (b[0] - a[0]) * t) + ',' +
      Math.round(a[1] + (b[1] - a[1]) * t) + ',' +
      Math.round(a[2] + (b[2] - a[2]) * t) + ')';
  }

  /** Crea una partícula en una posición al azar. */
  function crearParticula(i, total) {
    return {
      x: Math.random() * ancho,
      y: Math.random() * alto,
      vx: (Math.random() - .5) * .25,
      vy: (Math.random() - .5) * .25,
      radio: 1.8 + Math.random() * 3.4,
      limpieza: 0,                 // 0 = sucia, 1 = limpia
      orden: i / total             // decide qué partículas limpia antes el scroll
    };
  }

  /** Ajusta el tamaño del lienzo a la portada y crea las partículas. */
  function redimensionar() {
    escala = Math.min(window.devicePixelRatio || 1, 2);
    ancho = hero.clientWidth;
    alto = hero.clientHeight;
    lienzo.width = Math.round(ancho * escala);
    lienzo.height = Math.round(alto * escala);
    ctx.setTransform(escala, 0, 0, escala, 0, 0);

    // Número de partículas proporcional a la superficie, con un máximo para que vaya fluido
    var total = Math.min(380, Math.round((ancho * alto) / 4200));
    particulas = [];
    for (var i = 0; i < total; i++) particulas.push(crearParticula(i, total));
  }

  /** Mueve las partículas un paso. */
  function actualizar() {
    for (var i = 0; i < particulas.length; i++) {
      var p = particulas[i];

      // 1) El ratón limpia y empuja las partículas cercanas
      var dx = p.x - raton.x, dy = p.y - raton.y;
      var distancia = Math.sqrt(dx * dx + dy * dy);
      if (raton.activo && distancia < RADIO_RATON) {
        var fuerza = 1 - distancia / RADIO_RATON;
        p.limpieza = Math.min(1, p.limpieza + .08 * fuerza + .02);
        p.vx += (dx / (distancia || 1)) * fuerza * .6;
        p.vy += (dy / (distancia || 1)) * fuerza * .6;
      }

      // 2) El scroll limpia una parte de las partículas, en orden
      var objetivo = p.orden < limpiezaScroll ? 1 : 0;
      if (objetivo > p.limpieza) p.limpieza = Math.min(1, p.limpieza + .03);
      // Si nadie las limpia, poco a poco vuelve la contaminación
      else if (distancia > RADIO_RATON) p.limpieza = Math.max(objetivo, p.limpieza - .0025);

      // 3) Movimiento: las limpias se van con la brisa hacia la derecha
      var brisa = .9 * p.limpieza;
      p.vx = p.vx * .94 + (Math.random() - .5) * .05 + brisa * .06;
      p.vy = p.vy * .94 + (Math.random() - .5) * .05;
      p.x += p.vx + brisa * .5;
      p.y += p.vy;

      // 4) Si salen por un borde, entran por el contrario
      if (p.x > ancho + 10) p.x = -10;
      if (p.x < -10) p.x = ancho + 10;
      if (p.y > alto + 10) p.y = -10;
      if (p.y < -10) p.y = alto + 10;
    }
  }

  /** Dibuja todas las partículas. */
  function dibujar() {
    ctx.clearRect(0, 0, ancho, alto);
    for (var i = 0; i < particulas.length; i++) {
      var p = particulas[i];
      ctx.globalAlpha = .55 + .35 * p.limpieza;
      ctx.fillStyle = mezclar(SUCIO, LIMPIO, p.limpieza);
      ctx.beginPath();
      // Las partículas limpias se ven más pequeñas: el aire limpio pesa menos
      ctx.arc(p.x, p.y, p.radio * (1 - .45 * p.limpieza), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function bucle() {
    actualizar();
    dibujar();
    idFrame = requestAnimationFrame(bucle);
  }

  function arrancar() {
    if (animando || !visible || document.hidden || RVLC.prefiereMenosMovimiento()) return;
    animando = true;
    idFrame = requestAnimationFrame(bucle);
  }

  function parar() {
    animando = false;
    if (idFrame) cancelAnimationFrame(idFrame);
  }

  /** Imagen fija para quien prefiere menos movimiento: mitad sucia, mitad limpia. */
  function dibujoEstatico() {
    particulas.forEach(function (p) { p.limpieza = p.x > ancho * .55 ? 1 : 0; });
    dibujar();
  }

  /* ---------- Eventos ---------- */

  hero.addEventListener('pointermove', function (e) {
    var caja = hero.getBoundingClientRect();
    raton.x = e.clientX - caja.left;
    raton.y = e.clientY - caja.top;
    raton.activo = true;
  });
  hero.addEventListener('pointerleave', function () { raton.activo = false; });

  window.addEventListener('scroll', function () {
    limpiezaScroll = Math.min(1, window.scrollY / (hero.offsetHeight * .6));
  }, { passive: true });

  var temporizador;
  window.addEventListener('resize', function () {
    clearTimeout(temporizador);
    temporizador = setTimeout(function () {
      redimensionar();
      if (RVLC.prefiereMenosMovimiento()) dibujoEstatico();
    }, 150);
  });

  // Solo animamos mientras la portada está en pantalla
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entradas) {
      visible = entradas[0].isIntersecting;
      if (visible) arrancar(); else parar();
    }).observe(hero);
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) parar(); else arrancar();
  });
  document.addEventListener('movimientocambiado', function () {
    if (RVLC.prefiereMenosMovimiento()) { parar(); dibujoEstatico(); } else { arrancar(); }
  });

  // Si el usuario cambia la preferencia de movimiento con la página abierta
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', function (e) {
    if (e.matches) { parar(); dibujoEstatico(); } else { arrancar(); }
  });

  /* ---------- Inicio ---------- */
  redimensionar();
  if (RVLC.prefiereMenosMovimiento()) {
    dibujoEstatico();
    var pista = document.getElementById('pista-hero');
    if (pista) pista.hidden = true; // sin animación, la pista no tiene sentido
  } else {
    arrancar();
  }
})();
