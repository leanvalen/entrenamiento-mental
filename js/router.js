// router.js — navegación entre pantallas, sin librería externa.
// Las pantallas son <section data-screen="..."> dentro de index.html que se
// muestran u ocultan agregando/quitando la clase "screen--active". No hay
// URLs distintas por pantalla: es una SPA simple sin history API.

const NOMBRES_PANTALLA = ['morning', 'midday', 'threshold', 'night', 'history'];

/**
 * Decide qué pantalla mostrar por defecto según la hora del sistema,
 * siguiendo la tabla de CLAUDE.md sección 4.1.
 */
function pantallaPorHora(fecha = new Date()) {
  const hora = fecha.getHours();
  if (hora >= 5 && hora < 12) return 'morning';
  if (hora >= 12 && hora < 14) return 'midday';
  if (hora >= 14 && hora < 20) return 'threshold';
  return 'night'; // 20:00 – 04:59
}

/**
 * Muestra la pantalla indicada y oculta el resto. También actualiza el
 * estado visual ("activo") de la barra de navegación inferior.
 */
function irAPantalla(nombre) {
  if (!NOMBRES_PANTALLA.includes(nombre)) return;

  document.querySelectorAll('.pantalla').forEach((seccion) => {
    seccion.classList.toggle('screen--active', seccion.dataset.screen === nombre);
  });

  document.querySelectorAll('.nav__item').forEach((boton) => {
    boton.classList.toggle('nav__item--activo', boton.dataset.target === nombre);
  });

  document.dispatchEvent(new CustomEvent('pantalla:cambio', { detail: { nombre } }));
}

/**
 * Inicializa el router: conecta los botones de la nav bar y abre la
 * pantalla que corresponde a la hora actual.
 */
function iniciarRouter() {
  document.querySelectorAll('.nav__item').forEach((boton) => {
    boton.addEventListener('click', () => irAPantalla(boton.dataset.target));
  });

  irAPantalla(pantallaPorHora());
}

export { iniciarRouter, irAPantalla, pantallaPorHora };
