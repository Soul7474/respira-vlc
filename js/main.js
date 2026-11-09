/* =====================================================================
   main.js · Funciones comunes de la web de Respira VLC
   - Utilidades compartidas (formato de números y euros, leer colores CSS)
   - Interruptor de modo claro / oscuro
   - Menú de navegación (móvil), cabecera fija y sección activa
   - Vídeos con carga diferida (fachada con miniatura)
   - Iconos del comparador de gamas
   ===================================================================== */

/* Creamos un "espacio de nombres" global para compartir funciones entre archivos.
   Así no llenamos window de variables sueltas. */
window.RVLC = window.RVLC || {};

(function () {
  'use strict';

  /* ---------- Utilidades compartidas ---------- */

  /**
   * Formatea un número al estilo español: coma decimal y punto de miles.
   * Lo hacemos a mano porque Intl en español no pone el punto en números de 4 cifras (9900).
   * @param {number} valor  número a formatear
   * @param {number} decimales  cuántos decimales mostrar (por defecto 0)
   */
  function formatoNumero(valor, decimales) {
    decimales = decimales || 0;
    var texto = Math.abs(valor).toFixed(decimales);       // "11100.50"
    var partes = texto.split('.');                         // ["11100", "50"]
    var enteros = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.'); // "11.100"
    var resultado = partes.length > 1 ? enteros + ',' + partes[1] : enteros;
    return (valor < 0 ? '−' : '') + resultado;
  }

  /** Formatea un importe en euros. Si no tiene céntimos, no los muestra. */
  function formatoEuros(valor) {
    var redondeado = Math.round(valor * 100) / 100;
    var decimales = Number.isInteger(redondeado) ? 0 : 2;
    return formatoNumero(redondeado, decimales) + ' €';
  }

  /** Lee el valor de una variable CSS (por ejemplo "--tinta") del tema actual. */
  function leerColor(nombreVariable) {
    return getComputedStyle(document.documentElement).getPropertyValue(nombreVariable).trim();
  }

  /** ¿El usuario ha pedido menos animaciones en su sistema? */
  function prefiereMenosMovimiento() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('movimiento-pausado');
  }

  RVLC.formatoNumero = formatoNumero;
  RVLC.formatoEuros = formatoEuros;
  RVLC.leerColor = leerColor;
  RVLC.prefiereMenosMovimiento = prefiereMenosMovimiento;

  /* Pausa global para poder detener la demostración y explicar los datos. */
  var botonMovimiento = document.getElementById('boton-movimiento');
  var consultaMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');
  function actualizarBotonMovimiento() {
    if (!botonMovimiento) return;
    var pausado = prefiereMenosMovimiento();
    var etiqueta = consultaMovimiento.matches ? 'Animaciones reducidas por tu sistema' : pausado ? 'Reanudar animaciones' : 'Pausar animaciones';
    botonMovimiento.disabled = consultaMovimiento.matches;
    botonMovimiento.setAttribute('aria-pressed', String(pausado));
    botonMovimiento.setAttribute('aria-label', etiqueta);
    botonMovimiento.title = etiqueta;
  }
  if (botonMovimiento) botonMovimiento.addEventListener('click', function () {
    document.documentElement.classList.toggle('movimiento-pausado');
    actualizarBotonMovimiento();
    document.dispatchEvent(new CustomEvent('movimientocambiado'));
  });
  consultaMovimiento.addEventListener('change', actualizarBotonMovimiento);
  actualizarBotonMovimiento();

  /* ---------- Modo claro / oscuro ---------- */

  var botonTema = document.getElementById('boton-tema');
  var consultaOscuro = window.matchMedia('(prefers-color-scheme: dark)');

  /** Devuelve el tema que se está viendo ahora: el elegido o, si no hay, el del sistema. */
  function temaActual() {
    var elegido = document.documentElement.getAttribute('data-theme');
    if (elegido === 'light' || elegido === 'dark') return elegido;
    return consultaOscuro.matches ? 'dark' : 'light';
  }

  /** Actualiza el texto accesible del botón según el tema. */
  function actualizarBotonTema() {
    var oscuro = temaActual() === 'dark';
    botonTema.setAttribute('aria-pressed', String(oscuro));
    botonTema.setAttribute('aria-label', oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
  }

  /** Avisa al resto de scripts (gráficas, mapa) de que los colores han cambiado. */
  function avisarCambioTema() {
    document.dispatchEvent(new CustomEvent('temacambiado', { detail: { tema: temaActual() } }));
  }

  botonTema.addEventListener('click', function () {
    var nuevo = temaActual() === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nuevo);
    try { localStorage.setItem('respira-tema', nuevo); } catch (e) { /* sin almacenamiento: no pasa nada */ }
    actualizarBotonTema();
    avisarCambioTema();
  });

  // Si cambia el tema del sistema y el usuario no ha elegido uno, también avisamos
  consultaOscuro.addEventListener('change', function () {
    if (!document.documentElement.hasAttribute('data-theme')) {
      actualizarBotonTema();
      avisarCambioTema();
    }
  });

  actualizarBotonTema();
  RVLC.temaActual = temaActual;

  /* ---------- Navegación ---------- */

  var cabecera = document.getElementById('cabecera');
  var nav = document.getElementById('nav');
  var botonMenu = document.getElementById('boton-menu');
  var hero = document.getElementById('inicio');

  function abrirMenu(abrir) {
    nav.classList.toggle('nav--abierta', abrir);
    botonMenu.setAttribute('aria-expanded', String(abrir));
    botonMenu.setAttribute('aria-label', abrir ? 'Cerrar menú' : 'Abrir menú');
    actualizarCabecera();
  }

  botonMenu.addEventListener('click', function () {
    abrirMenu(!nav.classList.contains('nav--abierta'));
  });

  // Al pulsar un enlace del menú en el móvil, lo cerramos
  nav.addEventListener('click', function (evento) {
    if (evento.target.closest('a')) abrirMenu(false);
  });

  // Cerrar el desplegable al salir de él o al volver al diseño de escritorio.
  document.addEventListener('click', function (evento) {
    if (nav.classList.contains('nav--abierta') && !cabecera.contains(evento.target)) abrirMenu(false);
  });
  document.addEventListener('focusin', function (evento) {
    if (nav.classList.contains('nav--abierta') && !cabecera.contains(evento.target)) abrirMenu(false);
  });
  window.matchMedia('(max-width: 1020px)').addEventListener('change', function (evento) {
    if (!evento.matches) abrirMenu(false);
  });

  // Tecla Escape cierra el menú
  document.addEventListener('keydown', function (evento) {
    if (evento.key === 'Escape' && nav.classList.contains('nav--abierta')) {
      abrirMenu(false);
      botonMenu.focus();
    }
  });

  /** La cabecera acompaña la lectura con una línea de progreso. */
  function actualizarCabecera() {
    var pasadaPortada = window.scrollY > hero.offsetHeight - 80;
    cabecera.classList.toggle('cabecera--solida', pasadaPortada || nav.classList.contains('nav--abierta'));
    var recorrido = document.documentElement.scrollHeight - window.innerHeight;
    cabecera.style.setProperty('--progreso', recorrido > 0 ? Math.min(1, Math.max(0, window.scrollY / recorrido)) : 0);
  }
  window.addEventListener('scroll', actualizarCabecera, { passive: true });
  window.addEventListener('resize', actualizarCabecera);
  actualizarCabecera();

  // Marcamos en el menú la sección que se está viendo (aria-current)
  var enlacesMenu = nav.querySelectorAll('a[href^="#"]');
  var secciones = [];
  enlacesMenu.forEach(function (enlace) {
    var seccion = document.querySelector(enlace.getAttribute('href'));
    if (seccion) secciones.push({ seccion: seccion, enlace: enlace });
  });

  if ('IntersectionObserver' in window) {
    var observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (!entrada.isIntersecting) return;
        enlacesMenu.forEach(function (e) { e.removeAttribute('aria-current'); });
        // Si la sección que cruza el centro es la portada (u otra sin enlace), no queda nada marcado
        var par = secciones.find(function (s) { return s.seccion === entrada.target; });
        if (par) par.enlace.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-45% 0px -50% 0px' }); // cuenta la sección que cruza el centro de la pantalla
    secciones.forEach(function (s) { observador.observe(s.seccion); });
    // También observamos las secciones sin enlace (portada, vídeos, fuentes) para desmarcar el menú
    document.querySelectorAll('main > section').forEach(function (s) {
      if (!secciones.some(function (p) { return p.seccion === s; })) observador.observe(s);
    });
  }

  /* ---------- Explorador de estaciones de la portada ---------- */
  // Usa la misma copia de datos que las gráficas. También funciona con file://.
  var selectorEstacion = document.getElementById('estacion-portada');
  var copiaEstaciones = document.getElementById('datos-2024');
  if (selectorEstacion && copiaEstaciones) {
    try {
      var datosPortada = JSON.parse(copiaEstaciones.textContent);
      var referencia = datosPortada.limites.no2.ue_2030;
      var escala = datosPortada.limites.no2.ue_actual;
      var valorEstacion = document.getElementById('estacion-valor');
      var estadoEstacion = document.getElementById('estacion-estado');
      var escalaEstacion = document.getElementById('estacion-escala');
      var contextoEstacion = document.getElementById('estacion-contexto');
      var nodosPortada = document.querySelectorAll('[data-nodo]');

      function actualizarEstacion() {
        var estacion = datosPortada.estaciones.find(function (e) { return e.estacion === selectorEstacion.value; });
        if (!estacion) return;
        var valor = estacion.no2_media_anual;
        var estado = valor > referencia ? 'alto' : valor === referencia ? 'limite' : 'bajo';
        valorEstacion.textContent = formatoNumero(valor);
        estadoEstacion.textContent = (estado === 'alto' ? 'Por encima de' : estado === 'limite' ? 'Justo en' : 'Por debajo de') + ' la referencia UE 2030';
        estadoEstacion.dataset.estado = estado;
        escalaEstacion.style.setProperty('--medida', Math.min(100, Math.max(0, valor / escala * 100)) + '%');
        contextoEstacion.textContent = 'Referencia UE 2030: ' + formatoNumero(referencia) + ' µg/m³';
        nodosPortada.forEach(function (nodo) {
          nodo.classList.toggle('aire-nodo--activo', nodo.dataset.nodo === estacion.estacion);
        });
      }

      // Regenerar las opciones impide que se desincronicen si cambian los JSON.
      var seleccionInicial = selectorEstacion.value;
      selectorEstacion.textContent = '';
      datosPortada.estaciones.forEach(function (estacion) {
        var opcion = document.createElement('option');
        opcion.value = estacion.estacion;
        opcion.textContent = estacion.estacion;
        selectorEstacion.appendChild(opcion);
      });
      selectorEstacion.value = datosPortada.estaciones.some(function (e) { return e.estacion === seleccionInicial; }) ? seleccionInicial : datosPortada.estaciones[0].estacion;
      selectorEstacion.addEventListener('change', actualizarEstacion);
      actualizarEstacion();
      selectorEstacion.disabled = false;
    } catch (e) { /* Si falta la copia, mantenemos visible la lectura inicial. */ }
  }

  /* ---------- Vídeos con carga diferida ---------- */
  // Al principio solo se ve la miniatura. Al hacer clic se crea el iframe de youtube-nocookie.com.
  // Sin Internet: la miniatura no carga y el vídeo no se puede ver, así que lo decimos claramente.
  var avisoVideos = document.getElementById('aviso-videos');
  function sinConexionVideo(boton) {
    boton.classList.add('video__fachada--sin-red');
    if (avisoVideos) avisoVideos.hidden = false;
  }

  document.querySelectorAll('.video__fachada').forEach(function (boton) {
    var miniatura = boton.querySelector('img');
    // Si la miniatura falla (o ya había fallado antes de llegar aquí), mostramos el aviso
    miniatura.addEventListener('error', function () { sinConexionVideo(boton); });
    if (miniatura.complete && miniatura.naturalWidth === 0 && miniatura.currentSrc) sinConexionVideo(boton);

    boton.addEventListener('click', function () {
      if (!navigator.onLine) { sinConexionVideo(boton); return; }
      var id = boton.dataset.videoId;
      var iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0';
      iframe.title = boton.dataset.videoTitulo || 'Vídeo de YouTube';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      boton.replaceWith(iframe);
      iframe.focus();
    });
  });

  /* ---------- Aparición suave al bajar por la página ----------
     Las tarjetas entran con un pequeño desplazamiento cuando llegan a la pantalla.
     Sin JavaScript o con "reducir movimiento" se ven directamente (la clase la pone este código). */
  if ('IntersectionObserver' in window && !prefiereMenosMovimiento()) {
    var aparecen = document.querySelectorAll('.hecho, .liston, .ficha, .kpi, .grafica, .operacion, .producto, .persona');
    var observadorAparece = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (!entrada.isIntersecting) return;
        entrada.target.classList.add('aparece--visto');
        observadorAparece.unobserve(entrada.target);   // solo la primera vez
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    aparecen.forEach(function (el, i) {
      el.classList.add('aparece');
      el.style.setProperty('--retraso', (i % 5) * 70 + 'ms');   // efecto cascada entre hermanos
      observadorAparece.observe(el);
    });
  }

  /* ---------- Comparador de gamas: iconos de sí / no ---------- */
  var ICONO_SI = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var ICONO_NO = '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M6 12h12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>';

  document.querySelectorAll('.comparador td[data-v]').forEach(function (celda) {
    var si = celda.dataset.v === 's';
    // El icono es decorativo; el texto oculto ("Sí"/"No") lo leen los lectores de pantalla
    celda.innerHTML = '<span class="' + (si ? 'marca-si' : 'marca-no') + '">' + (si ? ICONO_SI : ICONO_NO) + '</span>' +
      '<span class="solo-lector">' + (si ? 'Sí' : 'No') + '</span>';
  });
})();
