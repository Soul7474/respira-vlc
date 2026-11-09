/* =====================================================================
   tienda.js · Catálogo, carrito, formulario de pedido y calculadora
   - El carrito se guarda en memoria (y en localStorage como comodidad).
   - El total desglosa base imponible e IVA del 21 %.
   - El formulario se valida con JavaScript y NO envía nada a ningún servidor.
   - La calculadora usa los precios del catálogo; no inventa reducciones de contaminación.
   ===================================================================== */
(function () {
  'use strict';

  var IVA = 0.21;

  /* ---------- Catálogo: precios exactos (sin IVA) ----------
     cuota = pago anual aparte (solo Respira Ciutat). En el pedido se suma la del primer año. */
  var PRODUCTOS = {
    aula:   { nombre: 'Respira Aula',   precio: 79,   unidad: 'sensor' },
    escola: { nombre: 'Respira Escola', precio: 690,  unidad: 'colegio' },
    mobil:  { nombre: 'Respira Mòbil',  precio: 249,  unidad: 'unidad' },
    ciutat: { nombre: 'Respira Ciutat', precio: 9900, unidad: 'lote de 50 nodos', cuota: 1200 }
  };
  RVLC.PRODUCTOS = PRODUCTOS;

  var CLAVE_GUARDADO = 'respira-carrito';
  var MAX_CANTIDAD = 999;

  /* El carrito es un objeto { idProducto: cantidad } */
  var carrito = leerCarritoGuardado();

  function leerCarritoGuardado() {
    try {
      var guardado = JSON.parse(localStorage.getItem(CLAVE_GUARDADO) || '{}');
      // Solo aceptamos productos que existen y cantidades válidas
      var limpio = {};
      Object.keys(guardado).forEach(function (id) {
        var n = parseInt(guardado[id], 10);
        if (PRODUCTOS[id] && n > 0) limpio[id] = Math.min(n, MAX_CANTIDAD);
      });
      return limpio;
    } catch (e) {
      return {};
    }
  }

  function guardarCarrito() {
    try { localStorage.setItem(CLAVE_GUARDADO, JSON.stringify(carrito)); } catch (e) { /* sin almacenamiento */ }
  }

  /* ---------- Operaciones del carrito ---------- */

  function anadir(id) {
    carrito[id] = Math.min((carrito[id] || 0) + 1, MAX_CANTIDAD);
    actualizarCarrito();
  }

  function cambiarCantidad(id, cantidad) {
    cantidad = parseInt(cantidad, 10);
    if (isNaN(cantidad) || cantidad < 1) { quitar(id); return; }
    carrito[id] = Math.min(cantidad, MAX_CANTIDAD);
    actualizarCarrito();
  }

  function quitar(id) {
    delete carrito[id];
    actualizarCarrito();
  }

  /** Calcula el importe de una línea (incluye la cuota del primer año si la hay). */
  function importeLinea(id, cantidad) {
    var p = PRODUCTOS[id];
    return cantidad * (p.precio + (p.cuota || 0));
  }

  /* ---------- Pintar el carrito ---------- */

  var lista = document.getElementById('carrito-lista');
  var vacio = document.getElementById('carrito-vacio');
  var totales = document.getElementById('carrito-totales');
  var botonVaciar = document.getElementById('vaciar-carrito');
  var notaCuota = document.getElementById('nota-cuota');
  var contador = document.getElementById('contador-carrito');

  function actualizarCarrito() {
    guardarCarrito();
    var ids = Object.keys(carrito);
    lista.innerHTML = '';

    var base = 0;
    var unidades = 0;
    ids.forEach(function (id) {
      var p = PRODUCTOS[id];
      var cantidad = carrito[id];
      var importe = importeLinea(id, cantidad);
      base += importe;
      unidades += cantidad;
      lista.appendChild(crearLinea(id, p, cantidad, importe));
    });

    var iva = base * IVA;
    document.getElementById('total-base').textContent = RVLC.formatoEuros(base);
    document.getElementById('total-iva').textContent = RVLC.formatoEuros(iva);
    document.getElementById('total-final').textContent = RVLC.formatoEuros(base + iva);

    var hayAlgo = ids.length > 0;
    vacio.hidden = hayAlgo;
    totales.hidden = !hayAlgo;
    botonVaciar.hidden = !hayAlgo;
    notaCuota.hidden = !carrito.ciutat;
    contador.textContent = String(unidades);
    contador.parentElement.setAttribute('aria-label', 'Ver tu pedido: ' + unidades + (unidades === 1 ? ' artículo' : ' artículos'));
  }

  /** Crea el HTML de una línea del carrito con controles de cantidad. */
  function crearLinea(id, p, cantidad, importe) {
    var li = document.createElement('li');
    li.className = 'linea-carrito';

    var nombre = document.createElement('span');
    nombre.className = 'linea-carrito__nombre';
    nombre.textContent = p.nombre;

    var importeEl = document.createElement('span');
    importeEl.className = 'linea-carrito__importe';
    importeEl.textContent = RVLC.formatoEuros(importe);

    var detalle = document.createElement('span');
    detalle.className = 'linea-carrito__detalle';
    detalle.textContent = RVLC.formatoEuros(p.precio) + ' por ' + p.unidad +
      (p.cuota ? ' + ' + RVLC.formatoEuros(p.cuota) + ' del primer año de plataforma' : '');

    var controles = document.createElement('div');
    controles.className = 'cantidad';

    var menos = document.createElement('button');
    menos.type = 'button';
    menos.textContent = '−';
    menos.setAttribute('aria-label', 'Quitar una unidad de ' + p.nombre);
    menos.addEventListener('click', function () { cambiarCantidad(id, cantidad - 1); });

    var campo = document.createElement('input');
    campo.type = 'number';
    campo.min = '1';
    campo.max = String(MAX_CANTIDAD);
    campo.value = String(cantidad);
    campo.inputMode = 'numeric';
    campo.setAttribute('aria-label', 'Cantidad de ' + p.nombre);
    campo.addEventListener('change', function () { cambiarCantidad(id, campo.value); });

    var mas = document.createElement('button');
    mas.type = 'button';
    mas.textContent = '+';
    mas.setAttribute('aria-label', 'Añadir una unidad de ' + p.nombre);
    mas.addEventListener('click', function () { cambiarCantidad(id, cantidad + 1); });

    var quitarBoton = document.createElement('button');
    quitarBoton.type = 'button';
    quitarBoton.className = 'quitar';
    quitarBoton.textContent = 'Quitar';
    quitarBoton.setAttribute('aria-label', 'Quitar ' + p.nombre + ' del pedido');
    quitarBoton.addEventListener('click', function () {
      quitar(id);
      document.getElementById('titulo-carrito').focus(); // el foco no se pierde al borrar la línea
    });

    controles.append(menos, campo, mas, quitarBoton);
    li.append(nombre, importeEl, detalle, controles);
    return li;
  }

  // El título del carrito puede recibir el foco (para no perderlo al quitar líneas)
  document.getElementById('titulo-carrito').tabIndex = -1;

  /* ---------- Botones del catálogo ---------- */

  document.querySelectorAll('[data-anadir]').forEach(function (boton) {
    var textoOriginal = boton.textContent;
    boton.addEventListener('click', function () {
      anadir(boton.dataset.anadir);
      // Confirmación breve en el propio botón: el usuario ve qué ha cambiado
      boton.textContent = 'Añadido al pedido';
      clearTimeout(boton._temporizador);
      boton._temporizador = setTimeout(function () { boton.textContent = textoOriginal; }, 1600);
    });
  });

  // El botón de la app gratuita rellena el mensaje del formulario
  document.querySelectorAll('[data-interes]').forEach(function (enlace) {
    enlace.addEventListener('click', function () {
      var mensaje = document.getElementById('f-mensaje');
      if (!mensaje.value) mensaje.value = 'Quiero que me aviséis cuando salga la ' + enlace.dataset.interes + '.';
    });
  });

  botonVaciar.addEventListener('click', function () {
    carrito = {};
    actualizarCarrito();
    document.getElementById('titulo-carrito').focus();
  });

  actualizarCarrito();

  /* ---------- Formulario con validación ---------- */

  var formulario = document.getElementById('formulario');
  var mensajeOk = document.getElementById('formulario-ok');

  /** Reglas de validación: devuelven un texto de error o "" si el campo es correcto. */
  var REGLAS = {
    'f-nombre': function (v) {
      if (!v.trim()) return 'Escribe tu nombre.';
      if (v.trim().length < 3) return 'El nombre debe tener al menos 3 letras.';
      return '';
    },
    'f-email': function (v) {
      if (!v.trim()) return 'Escribe tu correo electrónico.';
      // Comprobación sencilla: algo@algo.algo
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())) return 'Revisa el correo: debe tener la forma nombre@dominio.es.';
      return '';
    },
    'f-entidad': function (v) { return v ? '' : 'Elige qué tipo de entidad eres.'; },
    'f-acepto': function (v, campo) { return campo.checked ? '' : 'Marca la casilla para continuar.'; }
  };

  /** Valida un campo, muestra u oculta su error y devuelve true si es correcto. */
  function validarCampo(id) {
    var campo = document.getElementById(id);
    var error = REGLAS[id](campo.value, campo);
    var hueco = document.getElementById('e-' + id.slice(2));
    hueco.textContent = error;
    campo.setAttribute('aria-invalid', error ? 'true' : 'false');
    return !error;
  }

  // Validamos cada campo al salir de él (y al cambiar, si ya tenía error)
  Object.keys(REGLAS).forEach(function (id) {
    var campo = document.getElementById(id);
    campo.addEventListener('blur', function () { if (campo.value || campo.type === 'checkbox') validarCampo(id); });
    campo.addEventListener('input', function () { if (campo.getAttribute('aria-invalid') === 'true') validarCampo(id); });
    campo.addEventListener('change', function () { if (campo.getAttribute('aria-invalid') === 'true') validarCampo(id); });
  });

  formulario.addEventListener('submit', function (evento) {
    evento.preventDefault(); // nunca se envía a ningún servidor

    var primerError = null;
    Object.keys(REGLAS).forEach(function (id) {
      if (!validarCampo(id) && !primerError) primerError = document.getElementById(id);
    });
    if (primerError) { primerError.focus(); return; }

    // Construimos el resumen de la solicitud simulada
    var nombre = document.getElementById('f-nombre').value.trim().split(' ')[0];
    var ids = Object.keys(carrito);
    mensajeOk.innerHTML = '';

    var titulo = document.createElement('p');
    var fuerte = document.createElement('strong');
    fuerte.textContent = 'Solicitud enviada (simulación), ' + nombre + '.';
    titulo.appendChild(fuerte);
    mensajeOk.appendChild(titulo);

    var detalle = document.createElement('p');
    if (ids.length) {
      var base = ids.reduce(function (t, id) { return t + importeLinea(id, carrito[id]); }, 0);
      detalle.textContent = 'Tu pedido: ' + ids.map(function (id) { return carrito[id] + ' × ' + PRODUCTOS[id].nombre; }).join(', ') +
        '. Total con IVA: ' + RVLC.formatoEuros(base * (1 + IVA)) + '.';
    } else {
      detalle.textContent = 'Has pedido información sin productos en el pedido.';
    }
    mensajeOk.appendChild(detalle);

    var aviso = document.createElement('p');
    aviso.textContent = 'Es una demostración: no se ha enviado nada a ningún servidor ni se han guardado tus datos.';
    mensajeOk.appendChild(aviso);

    mensajeOk.hidden = false;
    mensajeOk.focus();
    formulario.querySelectorAll('input, select, textarea').forEach(function (c) { c.removeAttribute('aria-invalid'); });
    formulario.reset();
  });

  /* ---------- Calculadora de impacto ---------- */

  var ESTACIONES_OFICIALES = 8;   // estaciones con datos de NO₂ en el informe de 2024
  var AULAS_POR_COLEGIO = 10;     // Respira Escola trae 10 sensores de aula
  var ALUMNOS_POR_AULA = 25;
  var NODOS_POR_LOTE = 50;        // Respira Ciutat = 50 nodos de farola

  var cColegios = document.getElementById('c-colegios');
  var cFarolas = document.getElementById('c-farolas');
  var cMoviles = document.getElementById('c-moviles');

  function calcular() {
    var colegios = parseInt(cColegios.value, 10);
    var farolas = parseInt(cFarolas.value, 10);   // va de 50 en 50
    var moviles = parseInt(cMoviles.value, 10);

    document.getElementById('o-colegios').textContent = colegios;
    document.getElementById('o-farolas').textContent = farolas;
    document.getElementById('o-moviles').textContent = moviles;

    var aulas = colegios * AULAS_POR_COLEGIO;
    var alumnos = aulas * ALUMNOS_POR_AULA;
    // Puntos exteriores: el sensor de la puerta de cada colegio + farolas + móviles
    var puntos = colegios + farolas + moviles;
    var veces = puntos / ESTACIONES_OFICIALES;

    var lotes = farolas / NODOS_POR_LOTE;
    var costeColegios = colegios * PRODUCTOS.escola.precio;
    var costeCiutat = lotes * (PRODUCTOS.ciutat.precio + PRODUCTOS.ciutat.cuota);
    var costeMoviles = moviles * PRODUCTOS.mobil.precio;
    var total = costeColegios + costeCiutat + costeMoviles;

    document.getElementById('r-aulas').textContent = RVLC.formatoNumero(aulas);
    document.getElementById('r-alumnos').textContent = RVLC.formatoNumero(alumnos);
    document.getElementById('r-puntos').textContent = RVLC.formatoNumero(puntos);
    document.getElementById('r-veces').textContent = RVLC.formatoNumero(veces, veces < 10 && veces % 1 ? 1 : 0) + (veces === 1 ? ' vez' : ' veces');
    document.getElementById('r-coste').textContent = RVLC.formatoEuros(total);
    document.getElementById('r-coste-detalle').textContent =
      'Escola ' + RVLC.formatoEuros(costeColegios) +
      ' + Ciutat ' + RVLC.formatoEuros(costeCiutat) + (lotes ? ' (' + lotes + (lotes === 1 ? ' lote' : ' lotes') + ' con la cuota del primer año)' : '') +
      ' + Mòbil ' + RVLC.formatoEuros(costeMoviles) + '. Los años siguientes: ' + RVLC.formatoEuros(lotes * PRODUCTOS.ciutat.cuota) + ' al año de plataforma.';

    RVLC.redCalculada = { colegios: colegios, farolas: farolas, moviles: moviles, puntos: puntos };
    document.dispatchEvent(new CustomEvent('redcalculada', { detail: RVLC.redCalculada }));
  }

  [cColegios, cFarolas, cMoviles].forEach(function (c) { c.addEventListener('input', calcular); });
  calcular();
})();
