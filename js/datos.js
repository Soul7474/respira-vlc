/* =====================================================================
   datos.js · Carga de los JSON de data/, tarjetas KPI, gráficas y tabla
   1. Carga los JSON con fetch. Si falla (por ejemplo, al abrir el HTML con
      file://), usa las copias incrustadas en index.html (<script id="datos-...">).
   2. Calcula media, máximo y mínimo a partir de las estaciones.
   3. Dibuja con Chart.js: barras de 2024, evolución 2016-2022 y NO₂ por hora.
   4. Rellena la sección "Así lo hemos analizado con pandas".
   Los JSON los genera el notebook datos/analisis_aire_valencia.ipynb.
   ===================================================================== */
(function () {
  'use strict';

  var datos = null;            // data/aire_2024.json una vez cargado
  var datosEvolucion = null;   // data/no2_evolucion.json
  var datosHoras = null;       // data/no2_por_hora.json
  var graficas = [];           // guardamos las gráficas para redibujarlas al cambiar de tema

  /* ---------- 1. Carga de datos ---------- */

  /** Lee una copia incrustada en el HTML (o null si no existe). */
  function leerCopiaIncrustada(idScript) {
    var nodo = document.getElementById(idScript);
    return nodo ? JSON.parse(nodo.textContent) : null;
  }

  /**
   * Intenta leer un JSON con fetch; si no se puede, devuelve la copia incrustada.
   * @param {string} ruta  ruta del archivo, p. ej. "data/aire_2024.json"
   * @param {string} idScript  id del <script> con la copia de respaldo
   */
  function cargarJSON(ruta, idScript) {
    // Con file:// el navegador no permite fetch, así que ni lo intentamos (evita errores en consola)
    if (location.protocol === 'file:') return Promise.resolve(leerCopiaIncrustada(idScript));

    return fetch(ruta)
      .then(function (respuesta) {
        if (!respuesta.ok) throw new Error('HTTP ' + respuesta.status);
        return respuesta.json();
      })
      .catch(function () {
        return leerCopiaIncrustada(idScript);
      });
  }

  /* ---------- 2. Cálculos ---------- */

  /**
   * Devuelve media, máximo y mínimo de un campo, ignorando las estaciones sin dato (null).
   * Es lo mismo que hacen mean(), max() y min() en pandas.
   * @param {Array} estaciones  lista de estaciones del JSON
   * @param {string} campo  "no2_media_anual" o "pm25_media_anual"
   */
  function resumen(estaciones, campo) {
    var validas = estaciones.filter(function (e) { return typeof e[campo] === 'number'; });
    var suma = validas.reduce(function (total, e) { return total + e[campo]; }, 0);
    var max = validas.reduce(function (a, b) { return b[campo] > a[campo] ? b : a; });
    var min = validas.reduce(function (a, b) { return b[campo] < a[campo] ? b : a; });
    return {
      n: validas.length,
      media: suma / validas.length,
      max: { valor: max[campo], estacion: max.estacion },
      min: { valor: min[campo], estacion: min.estacion }
    };
  }

  /** Estaciones con dato en un campo, ordenadas de menor a mayor (como sort_values). */
  function ordenadas(campo) {
    return datos.estaciones
      .filter(function (e) { return typeof e[campo] === 'number'; })
      .sort(function (a, b) { return a[campo] - b[campo]; });
  }

  /** Escribe un texto en todos los elementos con el atributo indicado. */
  function ponerTexto(atributo, clave, texto) {
    document.querySelectorAll('[' + atributo + '="' + clave + '"]').forEach(function (el) { el.textContent = texto; });
  }

  function pintarKpis() {
    var no2 = resumen(datos.estaciones, 'no2_media_anual');
    var pm = resumen(datos.estaciones, 'pm25_media_anual');
    ponerTexto('data-kpi', 'no2-media', RVLC.formatoNumero(no2.media, 1));
    ponerTexto('data-kpi', 'no2-max', RVLC.formatoNumero(no2.max.valor));
    ponerTexto('data-kpi', 'no2-max-est', no2.max.estacion);
    ponerTexto('data-kpi', 'no2-min', RVLC.formatoNumero(no2.min.valor));
    ponerTexto('data-kpi', 'no2-min-est', no2.min.estacion);
    ponerTexto('data-kpi', 'pm25-media', RVLC.formatoNumero(pm.media, 1));
    ponerTexto('data-kpi', 'pm25-max', RVLC.formatoNumero(pm.max.valor));
    ponerTexto('data-kpi', 'pm25-max-est', pm.max.estacion);
    ponerTexto('data-kpi', 'pm25-min', RVLC.formatoNumero(pm.min.valor));
    ponerTexto('data-kpi', 'pm25-min-est', pm.min.estacion);
  }

  /* ---------- Sección "Así lo hemos analizado con pandas" ---------- */
  // Los resultados se recalculan desde el JSON: así coinciden siempre con las gráficas
  function pintarPandas() {
    var no2 = resumen(datos.estaciones, 'no2_media_anual');
    var orden = ordenadas('no2_media_anual');
    var limitePm = datos.limites.pm25.ue_2030;
    var conPm = ordenadas('pm25_media_anual');
    var superan = datos.estaciones.filter(function (e) { return e.pm25_media_anual > limitePm; });

    ponerTexto('data-pandas', 'filas', String(datos.estaciones.length));
    ponerTexto('data-pandas', 'media', RVLC.formatoNumero(no2.media, 1));
    ponerTexto('data-pandas', 'max', RVLC.formatoNumero(no2.max.valor));
    ponerTexto('data-pandas', 'max-est', no2.max.estacion);
    ponerTexto('data-pandas', 'orden', orden[0].estacion + ' ' + orden[0].no2_media_anual + ' → … → ' +
      orden[orden.length - 1].estacion + ' ' + orden[orden.length - 1].no2_media_anual);
    ponerTexto('data-pandas', 'filtro-n', superan.length + ' de ' + conPm.length);
    ponerTexto('data-pandas', 'filtro-est', superan.map(function (e) { return e.estacion; }).join(', '));
  }

  /* ---------- Bloque "Cumplimos hoy / No cumplimos mañana" ---------- */
  // Un punto por estación: azul si cumple, naranja claro si está justo y naranja si supera el límite
  function pintarVeredicto() {
    document.querySelectorAll('.puntos').forEach(function (fila) {
      var campo = fila.dataset.contaminante === 'no2' ? 'no2_media_anual' : 'pm25_media_anual';
      var limite = Number(fila.dataset.limite);
      var estaciones = ordenadas(campo);

      fila.innerHTML = '';
      var superan = 0, justo = 0;
      estaciones.forEach(function (e) {
        // Tres estados: por debajo, justo en el límite (p. ej. Centre con 20) y por encima
        var valor = e[campo];
        var clase = 'punto';
        var estado = 'por debajo';
        if (valor > limite) { clase += ' punto--supera'; estado = 'lo supera'; superan++; }
        else if (valor === limite) { clase += ' punto--justo'; estado = 'justo en el límite'; justo++; }
        var punto = document.createElement('span');
        punto.className = clase;
        punto.title = e.estacion + ': ' + RVLC.formatoNumero(valor) + ' µg/m³ (' + estado + ')';
        fila.appendChild(punto);
      });

      var texto;
      if (superan === 0 && justo === 0) texto = 'todas por debajo';
      else {
        texto = superan + ' de ' + estaciones.length + (superan === 1 ? ' lo supera' : ' lo superan');
        if (justo) texto += ', ' + justo + ' justo en él';
      }
      fila.setAttribute('role', 'img');
      fila.setAttribute('aria-label', texto);

      var cuenta = document.querySelector('[data-cuenta="' + fila.dataset.contaminante + '-' + limite + '"]');
      if (cuenta) cuenta.textContent = texto;
    });
  }

  /* ---------- Tabla con todos los datos ---------- */
  function pintarTabla() {
    var cuerpo = document.getElementById('tabla-cuerpo');
    cuerpo.innerHTML = '';
    datos.estaciones.forEach(function (e) {
      var fila = document.createElement('tr');
      // Usamos textContent (no innerHTML) para insertar datos: es más seguro
      [
        e.estacion,
        RVLC.formatoNumero(e.no2_media_anual),
        e.pm25_media_anual === null ? 'sin dato' : RVLC.formatoNumero(e.pm25_media_anual),
        String(e.no2_horas_sobre_200),
        e.datos_validos_no2_pct + ' %'
      ].forEach(function (texto, i) {
        var celda = document.createElement(i === 0 ? 'th' : 'td');
        if (i === 0) celda.scope = 'row';
        celda.textContent = texto;
        fila.appendChild(celda);
      });
      cuerpo.appendChild(fila);
    });
  }

  /* ---------- 3. Gráficas ---------- */

  /**
   * Plugin propio de Chart.js que dibuja líneas verticales de referencia
   * (límites legales y recomendación de la OMS) con su etiqueta arriba.
   * Lo hacemos a mano para no depender de otro plugin externo.
   */
  var pluginReferencias = {
    id: 'referencias',
    afterDatasetsDraw: function (grafica, args, opciones) {
      var ctx = grafica.ctx;
      var area = grafica.chartArea;
      var escalaX = grafica.scales.x;
      (opciones.lineas || []).forEach(function (linea) {
        var x = escalaX.getPixelForValue(linea.valor);
        if (x < area.left || x > area.right) return;
        ctx.save();
        ctx.strokeStyle = opciones.color;
        ctx.lineWidth = 1.5;
        ctx.setLineDash(linea.trazo);
        ctx.beginPath();
        ctx.moveTo(x, area.top);
        ctx.lineTo(x, area.bottom);
        ctx.stroke();
        // Etiqueta encima de la línea
        ctx.setLineDash([]);
        ctx.fillStyle = opciones.colorTexto;
        ctx.font = '600 12px ' + opciones.fuente;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(linea.texto, x, area.top - 18);
        ctx.font = '400 12px ' + opciones.fuente;
        ctx.fillText(linea.valor + ' µg/m³', x, area.top - 4);
        ctx.restore();
      });
    }
  };

  /** Plugin que escribe el valor al final de cada barra (con el color del texto, no de la barra). */
  var pluginValores = {
    id: 'valores',
    afterDatasetsDraw: function (grafica, args, opciones) {
      var ctx = grafica.ctx;
      var meta = grafica.getDatasetMeta(0);
      ctx.save();
      ctx.fillStyle = opciones.color;
      ctx.font = '600 12px ' + opciones.fuente;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      meta.data.forEach(function (barra, i) {
        var valor = grafica.data.datasets[0].data[i];
        ctx.fillText(RVLC.formatoNumero(valor), barra.x + 6, barra.y);
      });
      ctx.restore();
    }
  };

  /** Colores actuales del tema, leídos de las variables CSS. */
  function coloresTema() {
    return {
      cumple: RVLC.leerColor('--dato-cumple'),
      justo: RVLC.leerColor('--dato-justo'),
      supera: RVLC.leerColor('--dato-supera'),
      texto: RVLC.leerColor('--tinta'),
      texto2: RVLC.leerColor('--tinta-2'),
      texto3: RVLC.leerColor('--tinta-3'),
      rejilla: RVLC.leerColor('--rejilla'),
      superficie: RVLC.leerColor('--superficie'),
      fuente: getComputedStyle(document.body).fontFamily
    };
  }

  /** Color de una barra según el límite de 2030 (los mismos tres estados que en el notebook). */
  function colorEstado(valor, limite, colores) {
    if (valor > limite) return colores.supera;
    if (valor === limite) return colores.justo;
    return colores.cumple;
  }

  /** Opciones comunes del bocadillo (tooltip) para todas las gráficas. */
  function opcionesTooltip(colores, etiqueta) {
    return {
      backgroundColor: colores.superficie,
      titleColor: colores.texto2,
      bodyColor: colores.texto,
      borderColor: colores.rejilla,
      borderWidth: 1,
      padding: 10,
      titleFont: { family: colores.fuente, weight: '500' },
      bodyFont: { family: colores.fuente, weight: '700', size: 14 },
      displayColors: false,
      callbacks: { label: etiqueta }
    };
  }

  /** Leyenda HTML encima de cada gráfica: color de barra y estilo de cada línea. */
  function pintarLeyenda(idLeyenda, limites, colores) {
    var cont = document.getElementById(idLeyenda);
    cont.innerHTML =
      '<span><i style="background:' + colores.cumple + '"></i>Por debajo del límite 2030</span>' +
      '<span><i style="background:' + colores.justo + '"></i>Justo en el límite</span>' +
      '<span><i style="background:' + colores.supera + '"></i>Lo supera</span>' +
      '<span><i class="linea"></i>Líneas: UE hoy ' + limites.ue_actual + ', UE 2030 ' + limites.ue_2030 + ', OMS ' + limites.oms + '</span>';
  }

  /**
   * Crea una gráfica de barras horizontales ordenada de menor a mayor.
   * @param {string} idCanvas  id del <canvas>
   * @param {string} campo  campo del JSON a dibujar
   * @param {object} limites  { ue_actual, ue_2030, oms }
   * @param {number} maxEje  valor máximo del eje X
   */
  function crearGraficaBarras(idCanvas, campo, limites, maxEje) {
    var colores = coloresTema();
    var estaciones = ordenadas(campo);
    var etiquetas = estaciones.map(function (e) { return e.estacion; });
    var valores = estaciones.map(function (e) { return e[campo]; });
    var coloresBarras = valores.map(function (v) { return colorEstado(v, limites.ue_2030, colores); });

    return new Chart(document.getElementById(idCanvas), {
      type: 'bar',
      data: {
        labels: etiquetas,
        datasets: [{
          label: 'Media anual 2024',
          data: valores,
          backgroundColor: coloresBarras,
          hoverBackgroundColor: coloresBarras,
          borderRadius: { topRight: 4, bottomRight: 4, topLeft: 0, bottomLeft: 0 }, // redondeado solo en la punta
          borderSkipped: false,
          maxBarThickness: 22,
          categoryPercentage: .8,
          barPercentage: .9
        }]
      },
      options: {
        indexAxis: 'y',                 // barras horizontales: los nombres se leen bien en el móvil
        responsive: true,
        maintainAspectRatio: false,
        animation: RVLC.prefiereMenosMovimiento() ? false : { duration: 700 },
        layout: { padding: { top: 40, right: 28 } },  // hueco para las etiquetas de las líneas y los valores
        scales: {
          x: {
            min: 0,
            max: maxEje,
            grid: { color: colores.rejilla, drawTicks: false },
            border: { display: false },
            ticks: { color: colores.texto3, font: { family: colores.fuente, size: 12 }, padding: 6, stepSize: maxEje > 30 ? 10 : 5 },
            title: { display: true, text: 'µg/m³', color: colores.texto3, font: { family: colores.fuente, size: 12 } }
          },
          y: {
            grid: { display: false },
            border: { color: colores.texto3 },
            ticks: { color: colores.texto2, font: { family: colores.fuente, size: 13 } }
          }
        },
        plugins: {
          legend: { display: false },   // usamos una leyenda HTML propia
          tooltip: opcionesTooltip(colores, function (c) {
            var v = c.parsed.x;
            var estado = v > limites.ue_2030 ? 'supera el límite 2030' : (v === limites.ue_2030 ? 'justo en el límite 2030' : 'por debajo del límite 2030');
            return RVLC.formatoNumero(v) + ' µg/m³ · ' + estado;
          }),
          referencias: {
            color: colores.texto2,
            colorTexto: colores.texto2,
            fuente: colores.fuente,
            lineas: [
              { valor: limites.oms, texto: 'OMS', trazo: [2, 3] },
              { valor: limites.ue_2030, texto: 'UE 2030', trazo: [6, 4] },
              { valor: limites.ue_actual, texto: 'UE hoy', trazo: [] }
            ]
          },
          valores: { color: colores.texto, fuente: colores.fuente }
        }
      },
      plugins: [pluginReferencias, pluginValores]
    });
  }

  /** Plugin que dibuja una línea horizontal de referencia (para la evolución y las horas). */
  var pluginLineaHorizontal = {
    id: 'lineaHorizontal',
    afterDatasetsDraw: function (grafica, args, opciones) {
      var ctx = grafica.ctx;
      var area = grafica.chartArea;
      var y = grafica.scales.y.getPixelForValue(opciones.valor);
      ctx.save();
      ctx.strokeStyle = opciones.color;
      ctx.setLineDash([6, 4]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(area.left, y);
      ctx.lineTo(area.right, y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = opciones.color;
      ctx.font = '600 12px ' + opciones.fuente;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText(opciones.texto, area.right, y - 4);
      ctx.restore();
    }
  };

  /** Ejes comunes para las gráficas de evolución y de horas. */
  function ejesSimples(colores, maxY) {
    return {
      x: { grid: { display: false }, ticks: { color: colores.texto3, font: { family: colores.fuente } } },
      y: {
        min: 0,
        max: maxY,
        grid: { color: colores.rejilla },
        border: { display: false },
        ticks: { color: colores.texto3, font: { family: colores.fuente }, stepSize: 10 },
        title: { display: true, text: 'µg/m³', color: colores.texto3, font: { family: colores.fuente } }
      }
    };
  }

  function crearGraficaEvolucion(serie) {
    var colores = coloresTema();
    return new Chart(document.getElementById('grafica-evolucion'), {
      type: 'line',
      data: {
        labels: serie.anios.map(String),
        datasets: [{
          label: 'NO₂ medio',
          data: serie.no2_media,
          borderColor: colores.cumple,
          backgroundColor: colores.cumple,
          borderWidth: 2.5,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBorderColor: colores.superficie,
          pointBorderWidth: 2,
          tension: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: RVLC.prefiereMenosMovimiento() ? false : { duration: 900 },
        interaction: { mode: 'index', intersect: false },   // el bocadillo aparece al acercarse al año
        scales: ejesSimples(colores, 40),
        plugins: {
          legend: { display: false },
          tooltip: opcionesTooltip(colores, function (c) { return RVLC.formatoNumero(c.parsed.y, 1) + ' µg/m³'; }),
          lineaHorizontal: { valor: 20, texto: 'Límite UE 2030', color: colores.texto2, fuente: colores.fuente }
        }
      },
      plugins: [pluginLineaHorizontal]
    });
  }

  function crearGraficaHoras(serie) {
    var colores = coloresTema();
    return new Chart(document.getElementById('grafica-horas'), {
      type: 'bar',
      data: {
        labels: serie.horas.map(function (h) { return h + ' h'; }),
        datasets: [{
          label: 'NO₂ medio',
          data: serie.no2_media,
          backgroundColor: serie.no2_media.map(function (v) { return v > 20 ? colores.supera : colores.cumple; }),
          borderRadius: 3,
          categoryPercentage: .9,
          barPercentage: .9
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: RVLC.prefiereMenosMovimiento() ? false : { duration: 700 },
        scales: ejesSimples(colores, 40),
        plugins: {
          legend: { display: false },
          tooltip: opcionesTooltip(colores, function (c) { return RVLC.formatoNumero(c.parsed.y, 1) + ' µg/m³ de NO₂'; }),
          lineaHorizontal: { valor: 20, texto: '20 µg/m³', color: colores.texto2, fuente: colores.fuente }
        }
      },
      plugins: [pluginLineaHorizontal]
    });
  }

  function pintarGraficas() {
    // Destruimos las anteriores (si las hay) para redibujar con los colores del tema
    graficas.forEach(function (g) { g.destroy(); });
    graficas = [];
    var colores = coloresTema();
    pintarLeyenda('leyenda-no2', datos.limites.no2, colores);
    pintarLeyenda('leyenda-pm25', datos.limites.pm25, colores);
    graficas.push(crearGraficaBarras('grafica-no2', 'no2_media_anual', datos.limites.no2, 45));
    graficas.push(crearGraficaBarras('grafica-pm25', 'pm25_media_anual', datos.limites.pm25, 28));
    if (datosEvolucion) graficas.push(crearGraficaEvolucion(datosEvolucion));
    if (datosHoras) graficas.push(crearGraficaHoras(datosHoras));
  }

  /** Comprueba que una serie tiene el formato esperado: dos listas de la misma longitud. */
  function serieValida(json, campoX) {
    return json && Array.isArray(json[campoX]) && Array.isArray(json.no2_media) &&
      json[campoX].length > 1 && json[campoX].length === json.no2_media.length;
  }

  /* ---------- Inicio ---------- */

  Promise.all([
    cargarJSON('data/aire_2024.json', 'datos-2024'),
    cargarJSON('data/no2_evolucion.json', 'datos-evolucion'),
    cargarJSON('data/no2_por_hora.json', 'datos-horas')
  ]).then(function (resultados) {
    datos = resultados[0];
    datosEvolucion = serieValida(resultados[1], 'anios') ? resultados[1] : null;
    datosHoras = serieValida(resultados[2], 'horas') ? resultados[2] : null;

    RVLC.datos = datos;   // lo compartimos con mapa.js
    document.dispatchEvent(new CustomEvent('datoscargados', { detail: datos }));

    pintarKpis();
    pintarVeredicto();
    pintarTabla();
    pintarPandas();

    // Si Chart.js no se ha podido cargar, avisamos y dejamos la tabla visible
    if (typeof Chart === 'undefined') {
      document.querySelectorAll('.grafica__lienzo').forEach(function (c) {
        c.innerHTML = '<p class="nota">No se ha podido cargar la biblioteca de gráficas. Abre «Ver la tabla con todos los datos».</p>';
        c.style.height = 'auto';
      });
      document.querySelector('.tabla-datos').open = true;
      return;
    }

    // Solo se enseñan los bloques de las series que existen
    document.getElementById('bloque-evolucion').hidden = !datosEvolucion;
    document.getElementById('bloque-horas').hidden = !datosHoras;
    pintarGraficas();
  });

  // Al cambiar de tema, las gráficas se redibujan con los nuevos colores
  document.addEventListener('temacambiado', function () {
    if (datos && typeof Chart !== 'undefined') pintarGraficas();
  });
})();
