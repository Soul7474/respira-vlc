/* El recorrido del proyecto y la red ilustrativa comparten los controles reales. */
(function () {
  'use strict';
  var stage = document.getElementById('viaje-stage');
  var pasos = document.querySelectorAll('.viaje-paso');
  var enlaces = document.querySelectorAll('.viaje-indice a');
  var titulos = ['Sentir la calle', 'Conectar la ciudad', 'Entender el aire', 'Decidir juntos'];

  function actualizarEtapa(etapa) {
    if (!stage || etapa < 1 || etapa > titulos.length) return;
    stage.dataset.etapa = String(etapa);
    document.getElementById('viaje-titulo').textContent = '0' + etapa + ' / ' + titulos[etapa - 1];
    document.getElementById('viaje-progreso').style.transform = 'scaleX(' + etapa / 4 + ')';
    pasos.forEach(function (paso) { paso.classList.toggle('viaje-paso--activo', Number(paso.dataset.etapa) === etapa); });
    enlaces.forEach(function (enlace, i) {
      if (i + 1 === etapa) enlace.setAttribute('aria-current', 'step');
      else enlace.removeAttribute('aria-current');
    });
  }

  enlaces.forEach(function (enlace, i) { enlace.addEventListener('click', function () { actualizarEtapa(i + 1); }); });
  if (stage && 'IntersectionObserver' in window) {
    var observarPaso = new IntersectionObserver(function (entradas) {
      var visibles = entradas.filter(function (e) { return e.isIntersecting; });
      visibles.sort(function (a, b) { return Math.abs(a.boundingClientRect.top - window.innerHeight * .4) - Math.abs(b.boundingClientRect.top - window.innerHeight * .4); });
      if (visibles.length) actualizarEtapa(Number(visibles[0].target.dataset.etapa));
    }, { rootMargin: '-35% 0px -35% 0px' });
    pasos.forEach(function (paso) { observarPaso.observe(paso); });
    new IntersectionObserver(function (entradas) { stage.classList.toggle('viaje-stage--pausada', !entradas[0].isIntersecting || document.hidden); }, { rootMargin: '60px' }).observe(stage);
    document.addEventListener('visibilitychange', function () {
      var caja = stage.getBoundingClientRect();
      stage.classList.toggle('viaje-stage--pausada', document.hidden || caja.bottom < 0 || caja.top > window.innerHeight);
    });
  }

  var grupo = document.getElementById('red-visual-nodos');
  var cantidad = document.getElementById('red-visual-total');
  var escala = document.getElementById('red-visual-escala');
  var escenarios = document.querySelectorAll('[data-red]');
  var controles = ['c-colegios', 'c-farolas', 'c-moviles'].map(function (id) { return document.getElementById(id); });
  var puntos = [];
  var maximo = 240;
  var colores = { colegio: '#9fd9c2', farola: '#c6eba7', movil: '#e6a273' };

  if (grupo) {
    for (var i = 0; i < maximo; i++) {
      var posicion = i * 97 % maximo;
      var circulo = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circulo.setAttribute('cx', 30 + posicion % 24 * 23 + Math.sin(posicion * 2.3) * 4);
      circulo.setAttribute('cy', 28 + Math.floor(posicion / 24) * 22 + Math.cos(posicion * 1.7) * 4);
      circulo.setAttribute('r', i % 9 === 0 ? '3.5' : '2.5');
      circulo.setAttribute('opacity', '0');
      grupo.appendChild(circulo);
      puntos.push(circulo);
    }
  }

  function dibujarRed(red) {
    if (!grupo || !red) return;
    var agrupacion = Math.max(1, Math.ceil(red.puntos / maximo));
    var visibles = Math.ceil(red.puntos / agrupacion);
    cantidad.textContent = RVLC.formatoNumero(red.puntos);
    escala.textContent = (red.puntos === 0 ? 'Añade sensores para dibujar tu red.' : agrupacion === 1 ? 'Cada punto representa un sensor exterior.' : 'Cada punto representa hasta ' + agrupacion + ' sensores exteriores.') + ' Distribución ilustrativa.';
    puntos.forEach(function (punto, i) {
      var indice = i * agrupacion;
      punto.setAttribute('fill', indice < red.colegios ? colores.colegio : indice < red.colegios + red.farolas ? colores.farola : colores.movil);
      punto.setAttribute('opacity', i < visibles ? '1' : '.06');
    });
    escenarios.forEach(function (boton) { boton.setAttribute('aria-pressed', String(boton.dataset.red === [red.colegios, red.farolas, red.moviles].join(','))); });
  }

  escenarios.forEach(function (boton) {
    if (!controles.every(Boolean)) return;
    boton.disabled = false;
    boton.addEventListener('click', function () {
      var valores = boton.dataset.red.split(',');
      controles.forEach(function (control, i) { control.value = valores[i]; });
      // Un único evento recalcula los precios, resultados y la visualización.
      controles[0].dispatchEvent(new Event('input', { bubbles: true }));
    });
  });
  document.addEventListener('redcalculada', function (evento) { dibujarRed(evento.detail); });
  dibujarRed(RVLC.redCalculada);
})();
