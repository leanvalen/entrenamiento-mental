// app.js — punto de entrada de la aplicación. Inicializa el router, el
// timer y cada pantalla, y registra el service worker para uso offline.

import { iniciarRouter } from './router.js';
import { iniciarTimer } from './timer.js';
import { iniciarPantallaManana } from './screens/morning.js';
import { iniciarPantallaNoche } from './screens/night.js';
import { iniciarPantallaMediodia } from './screens/midday.js';
import { iniciarPantallaUmbral } from './screens/threshold.js';
import { iniciarPantallaHistorial } from './screens/history.js';

document.addEventListener('DOMContentLoaded', () => {
  iniciarRouter();
  iniciarTimer();
  iniciarPantallaManana();
  iniciarPantallaNoche();
  iniciarPantallaMediodia();
  iniciarPantallaUmbral();
  iniciarPantallaHistorial();
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js');
  });
}
