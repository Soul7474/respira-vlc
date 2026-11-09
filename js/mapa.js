/* =====================================================================
   mapa.js · Mapa de València con Leaflet y teselas de OpenStreetMap
   - Estaciones oficiales coloreadas según su NO₂ medio de 2024.
   - Estaciones municipales sin media en el informe 2024 (en gris).
   - Nodos Respira PROPUESTOS en entornos escolares (ubicación ilustrativa).
   Coordenadas oficiales: geoportal de datos abiertos del Ajuntament de València.
   ===================================================================== */
(function () {
  'use strict';

  var contenedor = document.getElementById('mapa-leaflet');
  if (!contenedor) return;

  // Si Leaflet no se ha cargado (sin Internet), mostramos un aviso y salimos
  if (typeof L === 'undefined') {
    contenedor.hidden = true;
    document.getElementById('aviso-mapa').hidden = false;
    return;
  }

  /* ---------- Ubicación de las estaciones ----------
     Coordenadas oficiales del conjunto "Estaciones contaminación atmosféricas"
     del portal de datos abiertos del Ajuntament de València (geoportal.valencia.es).
     Las 8 primeras tienen media anual en el informe de 2024; las 3 últimas, no. */
  var ORIGEN = 'Ubicación oficial: portal de datos abiertos del Ajuntament de València.';
  var UBICACIONES = {
    'Av. França':     { lat: 39.45783, lng: -0.34299 },
    'Bulevard Sud':   { lat: 39.45040, lng: -0.39634 },
    'Molí del Sol':   { lat: 39.48111, lng: -0.40881 },
    'Pista de Silla': { lat: 39.45806, lng: -0.37664 },
    'Politècnic':     { lat: 39.47964, lng: -0.33740 },
    'Vivers':         { lat: 39.47964, lng: -0.36965 },
    'Centre':         { lat: 39.47055, lng: -0.37640 },
    'Olivereta':      { lat: 39.46924, lng: -0.40592 }
  };
  var SIN_MEDIA_2024 = [
    { nombre: 'Dr. Lluch',  lat: 39.46668, lng: -0.32829 },
    { nombre: 'Cabanyal',   lat: 39.47439, lng: -0.32853 },
    { nombre: 'Patraix',    lat: 39.45919, lng: -0.40141 }
  ];

  /* ---------- Nodos Respira propuestos ----------
     Son una PROPUESTA: un nodo en la puerta de un colegio de cada barrio.
     La posición es ilustrativa (centro aproximado del barrio), no un colegio concreto. */
  var PROPUESTOS = [
    { barrio: 'Benimaclet',   lat: 39.4862, lng: -0.3600 },
    { barrio: 'Torrefiel',    lat: 39.4935, lng: -0.3800 },
    { barrio: 'Campanar',     lat: 39.4800, lng: -0.3940 },
    { barrio: 'Patraix',      lat: 39.4595, lng: -0.3930 },
    { barrio: 'Russafa',      lat: 39.4620, lng: -0.3730 },
    { barrio: 'Malilla',      lat: 39.4495, lng: -0.3720 },
    { barrio: 'Benicalap',    lat: 39.4935, lng: -0.3965 }
  ];

  /* ---------- Crear el mapa ---------- */
  var mapa = L.map(contenedor, {
    center: [39.4700, -0.3760],
    zoom: 13,
    scrollWheelZoom: false   // para que la rueda del ratón siga bajando por la página
  });

  var teselas = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">colaboradores de OpenStreetMap</a>'
  }).addTo(mapa);

  // El fondo del mapa (teselas) viene de Internet. Si no hay conexión, avisamos una sola vez:
  // los puntos y sus ventanas siguen funcionando porque están en nuestro código.
  teselas.once('tileerror', function () {
    document.getElementById('aviso-teselas').hidden = false;
    contenedor.classList.add('mapa--sin-red');
  });

  // Al hacer clic en el mapa se activa el zoom con la rueda
  mapa.once('focus', function () { mapa.scrollWheelZoom.enable(); });

  /** Clasifica el NO₂ frente al límite de 2030 (20 µg/m³). */
  function nivel(no2, limite) {
    if (no2 > limite) return { clase: 'alto', texto: 'Supera el límite UE 2030' };
    if (no2 === limite) return { clase: 'limite', texto: 'Justo en el límite UE 2030' };
    return { clase: 'bajo', texto: 'Por debajo del límite UE 2030' };
  }

  /** Crea un elemento HTML con texto de forma segura (sin innerHTML). */
  function crear(etiqueta, clase, texto) {
    var el = document.createElement(etiqueta);
    if (clase) el.className = clase;
    if (texto) el.textContent = texto;
    return el;
  }

  /** Dibuja las estaciones con los datos del JSON. */
  function pintarEstaciones(datos) {
    var limite = datos.limites.no2.ue_2030;
    var limites = [];

    datos.estaciones.forEach(function (e) {
      var pos = UBICACIONES[e.estacion];
      if (!pos) return;
      var n = nivel(e.no2_media_anual, limite);

      // Marcador redondo con el valor de NO₂ dentro (el color nunca va solo: también hay número)
      var icono = L.divIcon({
        className: '',
        html: '<span class="marcador-estacion marcador-estacion--' + n.clase + '">' + e.no2_media_anual + '</span>',
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        popupAnchor: [0, -16]
      });

      var popup = crear('div');
      popup.appendChild(crear('h3', null, 'Estación ' + e.estacion));
      popup.appendChild(crear('p', null, 'NO₂ medio 2024: ' + e.no2_media_anual + ' µg/m³. ' + n.texto + '.'));
      popup.appendChild(crear('p', null, 'PM2.5 medio 2024: ' + (e.pm25_media_anual === null ? 'esta estación no lo mide.' : RVLC.formatoNumero(e.pm25_media_anual) + ' µg/m³.')));
      popup.appendChild(crear('p', 'popup-aprox', ORIGEN));

      L.marker([pos.lat, pos.lng], {
        icon: icono,
        title: 'Estación ' + e.estacion + ': ' + e.no2_media_anual + ' µg/m³ de NO₂',
        alt: 'Estación ' + e.estacion,
        keyboard: true
      }).bindPopup(popup).addTo(mapa);

      limites.push([pos.lat, pos.lng]);
    });

    // Estaciones municipales que no tienen media en el informe de 2024: en gris y sin número
    SIN_MEDIA_2024.forEach(function (s) {
      var icono = L.divIcon({ className: '', html: '<span class="marcador-estacion marcador-estacion--sin" aria-hidden="true"></span>', iconSize: [22, 22], iconAnchor: [11, 11], popupAnchor: [0, -10] });
      var popup = crear('div');
      popup.appendChild(crear('h3', null, 'Estación ' + s.nombre));
      popup.appendChild(crear('p', null, 'Estación municipal sin media anual en el informe de la Generalitat de 2024.'));
      popup.appendChild(crear('p', 'popup-aprox', ORIGEN));
      L.marker([s.lat, s.lng], { icon: icono, title: 'Estación ' + s.nombre + ' (sin media en 2024)', alt: 'Estación ' + s.nombre, keyboard: true })
        .bindPopup(popup).addTo(mapa);
      limites.push([s.lat, s.lng]);
    });

    PROPUESTOS.forEach(function (p) {
      var icono = L.divIcon({ className: '', html: '<span class="marcador-propuesto"></span>', iconSize: [20, 20], iconAnchor: [10, 10], popupAnchor: [0, -10] });
      var popup = crear('div');
      popup.appendChild(crear('h3', null, 'Nodo Respira propuesto'));
      popup.appendChild(crear('p', null, 'Entorno escolar en ' + p.barrio + '.'));
      popup.appendChild(crear('p', 'popup-aprox', 'Es una propuesta, todavía no existe. La posición es ilustrativa: no corresponde a un colegio concreto.'));
      L.marker([p.lat, p.lng], { icon: icono, title: 'Nodo propuesto en ' + p.barrio, alt: 'Nodo propuesto en ' + p.barrio, keyboard: true })
        .bindPopup(popup).addTo(mapa);
      limites.push([p.lat, p.lng]);
    });

    // Encuadramos el mapa para que se vean todos los puntos
    mapa.fitBounds(limites, { padding: [30, 30] });
  }

  // Esperamos a que datos.js haya cargado el JSON
  if (RVLC.datos) pintarEstaciones(RVLC.datos);
  else document.addEventListener('datoscargados', function (e) { pintarEstaciones(e.detail); }, { once: true });

  // Si el contenedor cambia de tamaño (giro del móvil), Leaflet recalcula
  window.addEventListener('resize', function () { mapa.invalidateSize(); });
})();
