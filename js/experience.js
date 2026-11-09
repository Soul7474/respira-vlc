/* Efectos del escritorio: luz, profundidad y una brisa que responde al cursor.
   La simulación es decorativa: nunca modifica los datos de las estaciones. */
(function () {
  'use strict';

  var movimiento = window.matchMedia('(prefers-reduced-motion: reduce)');
  var punteroFino = window.matchMedia('(hover: hover) and (pointer: fine)');

  // La luz sigue al cursor; las tarjetas del catálogo y el plano ganan profundidad.
  document.querySelectorAll('.aire-vista__mapa, .producto, .ficha').forEach(function (tarjeta) {
    var caja;
    var pendiente = null;
    var posicion;
    function limpiar() {
      if (pendiente !== null) cancelAnimationFrame(pendiente);
      pendiente = null;
      tarjeta.classList.remove('tilt--activo');
      ['--giro-x', '--giro-y', '--luz-x', '--luz-y'].forEach(function (propiedad) { tarjeta.style.removeProperty(propiedad); });
    }
    tarjeta.addEventListener('pointerenter', function () { caja = tarjeta.getBoundingClientRect(); });
    tarjeta.addEventListener('pointermove', function (evento) {
      if (RVLC.prefiereMenosMovimiento() || !punteroFino.matches) return;
      if (!caja) caja = tarjeta.getBoundingClientRect();
      posicion = { x: Math.min(1, Math.max(0, (evento.clientX - caja.left) / caja.width)), y: Math.min(1, Math.max(0, (evento.clientY - caja.top) / caja.height)) };
      if (pendiente !== null) return;
      pendiente = requestAnimationFrame(function () {
        pendiente = null;
        tarjeta.style.setProperty('--giro-x', ((.5 - posicion.y) * 9).toFixed(2) + 'deg');
        tarjeta.style.setProperty('--giro-y', ((posicion.x - .5) * 12).toFixed(2) + 'deg');
        tarjeta.style.setProperty('--luz-x', (posicion.x * 100) + '%');
        tarjeta.style.setProperty('--luz-y', (posicion.y * 100) + '%');
        tarjeta.classList.add('tilt--activo');
      });
    });
    tarjeta.addEventListener('pointerleave', limpiar);
    window.addEventListener('resize', function () { caja = null; limpiar(); });
    movimiento.addEventListener('change', limpiar);
    document.addEventListener('movimientocambiado', limpiar);
  });

  var escena = document.getElementById('brisa-escena');
  var canvas = document.getElementById('lienzo-brisa');
  var boton = document.getElementById('activar-brisa');
  if (!escena || !canvas || !boton) return;
  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var laboratorio = document.getElementById('brisa');
  var estado = document.getElementById('estado-brisa');
  var sensor = escena.querySelector('.sensor-3d');
  var ancho = 1, alto = 1;
  var particulas = [];
  var activa = false;
  var visible = false;
  var frame = null;
  var anterior = 0;
  var tiempo = 0;
  var cursor = { x: -1000, y: -1000, dentro: false };

  function crearParticula(enBorde) {
    return { x: enBorde ? -30 : Math.random() * ancho, y: Math.random() * alto, velocidad: .35 + Math.random() * .9, fase: Math.random() * Math.PI * 2, longitud: 5 + Math.random() * 24, opacidad: .15 + Math.random() * .5 };
  }

  function redimensionar() {
    var caja = escena.getBoundingClientRect();
    ancho = Math.max(1, caja.width);
    alto = Math.max(1, caja.height);
    var escala = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(ancho * escala);
    canvas.height = Math.round(alto * escala);
    ctx.setTransform(escala, 0, 0, escala, 0, 0);
    var cantidad = Math.min(200, Math.round(ancho * alto / 1700));
    particulas = Array.from({ length: cantidad }, function () { return crearParticula(false); });
    dibujar(0);
  }

  function dibujar(paso) {
    ctx.clearRect(0, 0, ancho, alto);
    var velocidad = activa ? 3.2 : .65;

    // Seis corrientes suaves dibujan el aire sin tapar la red.
    for (var linea = 0; linea < 6; linea++) {
      ctx.beginPath();
      for (var x = -20; x <= ancho + 20; x += 12) {
        var y = alto * (.19 + linea * .125) + Math.sin(x * .012 + tiempo * .00035 + linea) * (activa ? 28 : 16);
        if (x === -20) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = activa ? 'rgba(176,235,150,.12)' : 'rgba(213,170,113,.08)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    particulas.forEach(function (p, indice) {
      var dx = p.velocidad * velocidad;
      var dy = Math.sin(p.x * .012 + tiempo * .0006 + p.fase) * .45;
      if (cursor.dentro) {
        var distanciaX = p.x - cursor.x;
        var distanciaY = p.y - cursor.y;
        var distancia = Math.sqrt(distanciaX * distanciaX + distanciaY * distanciaY);
        if (distancia < 105) {
          var fuerza = (1 - distancia / 105) * 3;
          dx += distanciaX / (distancia || 1) * fuerza;
          dy += distanciaY / (distancia || 1) * fuerza;
        }
      }
      p.x += dx * paso;
      p.y += dy * paso;
      if (p.x > ancho + 40 || p.y < -40 || p.y > alto + 40 || p.x < -60) {
        particulas[indice] = crearParticula(true);
        return;
      }
      var verde = activa || p.x > ancho * .55;
      ctx.strokeStyle = verde ? 'rgba(183,235,154,' + p.opacidad + ')' : 'rgba(229,163,105,' + p.opacidad * .7 + ')';
      ctx.lineWidth = indice % 5 === 0 ? 1.6 : .7;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.longitud * (activa ? 1.3 : .5), p.y - dy * 4);
      ctx.stroke();
    });

    if (cursor.dentro) {
      var brillo = ctx.createRadialGradient(cursor.x, cursor.y, 0, cursor.x, cursor.y, 100);
      brillo.addColorStop(0, 'rgba(184,238,153,.09)');
      brillo.addColorStop(1, 'rgba(184,238,153,0)');
      ctx.fillStyle = brillo;
      ctx.fillRect(cursor.x - 100, cursor.y - 100, 200, 200);
    }
  }

  function animar(ahora) {
    frame = null;
    var delta = anterior ? Math.min(ahora - anterior, 40) : 16;
    anterior = ahora;
    tiempo += delta;
    dibujar(delta / 16.67);
    if (visible && !document.hidden && !RVLC.prefiereMenosMovimiento()) frame = requestAnimationFrame(animar);
  }

  function actualizarAnimacion() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    anterior = 0;
    if (visible && !document.hidden && !RVLC.prefiereMenosMovimiento()) frame = requestAnimationFrame(animar);
    else dibujar(0);
    laboratorio.classList.toggle('brisa-lab--pausada', !visible || document.hidden);
  }

  boton.addEventListener('click', function () {
    activa = !activa;
    laboratorio.classList.toggle('brisa-lab--activa', activa);
    boton.setAttribute('aria-pressed', String(activa));
    boton.querySelector('span').textContent = activa ? 'Deja descansar la brisa' : 'Activa la marinada';
    estado.textContent = activa ? 'Marinada activa · la red respira' : 'Red en calma · activa la brisa';
    if (RVLC.prefiereMenosMovimiento()) dibujar(0);
  });

  escena.addEventListener('pointermove', function (evento) {
    if (RVLC.prefiereMenosMovimiento() || !punteroFino.matches) return;
    var caja = escena.getBoundingClientRect();
    cursor.x = evento.clientX - caja.left;
    cursor.y = evento.clientY - caja.top;
    cursor.dentro = true;
    sensor.style.setProperty('--sensor-x', ((.5 - cursor.y / alto) * 16) + 'deg');
    sensor.style.setProperty('--sensor-y', ((cursor.x / ancho - .5) * 24) + 'deg');
  });
  escena.addEventListener('pointerleave', function () {
    cursor.dentro = false;
    sensor.style.removeProperty('--sensor-x');
    sensor.style.removeProperty('--sensor-y');
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entradas) {
      visible = entradas[0].isIntersecting;
      actualizarAnimacion();
    }, { rootMargin: '80px' }).observe(escena);
  } else { visible = true; }
  if ('ResizeObserver' in window) new ResizeObserver(redimensionar).observe(escena);
  else window.addEventListener('resize', redimensionar);
  document.addEventListener('visibilitychange', actualizarAnimacion);
  movimiento.addEventListener('change', actualizarAnimacion);
  document.addEventListener('movimientocambiado', actualizarAnimacion);
  redimensionar();
  boton.disabled = false;
  actualizarAnimacion();
})();
