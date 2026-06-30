// screens/threshold.js — lógica de la pantalla Umbral: toggle entro/salgo
// de trabajar, checklist secuencial del Anclaje de Umbral (cada paso se
// toca para marcarlo y avanza al siguiente automáticamente), y marcar el
// bloque "threshold" como completado.

import { getDay, saveBlock } from '../storage.js';

// Pasos derivados de "El Anclaje de Umbral" (CLAUDE.md sección 5.3).
const PASOS = {
  enter: [
    'Elegí tu umbral: una puerta específica.',
    'Pausa kinestésica: detené los pies por completo.',
    'Ajuste de fisiología: hombros atrás, pecho abierto, respiración profunda, barbilla arriba.',
    'El Cruce: dá un paso firme a través de la puerta.',
  ],
  exit: [
    'Detenete antes de cruzar hacia tu zona de descanso.',
    'Sacudí físicamente tus manos y brazos unos segundos.',
    'Exhalá fuerte y relajá los hombros.',
    'Dá el paso hacia tu zona de descanso.',
  ],
};

let modoActual = 'enter';
let pasoActual = 0;

function obtenerFechaHoy() {
  const ahora = new Date();
  const anio = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

function obtenerHoraActual() {
  const ahora = new Date();
  const horas = String(ahora.getHours()).padStart(2, '0');
  const minutos = String(ahora.getMinutes()).padStart(2, '0');
  return `${horas}:${minutos}`;
}

/**
 * Dibuja la lista de pasos del modo actual, marcando como "hecho" los
 * anteriores a pasoActual y como "actual" el siguiente a tocar.
 */
function dibujarPasos() {
  const lista = document.getElementById('listaPasosUmbral');
  lista.innerHTML = '';

  PASOS[modoActual].forEach((texto, indice) => {
    const item = document.createElement('li');
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'paso-secuencial';

    if (indice < pasoActual) {
      boton.classList.add('paso-secuencial--hecho');
    } else if (indice === pasoActual) {
      boton.classList.add('paso-secuencial--actual');
      boton.addEventListener('click', avanzarPaso);
    }

    boton.innerHTML = `<span class="paso-secuencial__numero">${indice + 1}</span><span>${texto}</span>`;
    item.appendChild(boton);
    lista.appendChild(item);
  });
}

function avanzarPaso() {
  pasoActual += 1;
  dibujarPasos();
}

/**
 * Cambia entre "Entro a trabajar" y "Salgo de trabajar". Reinicia el
 * progreso del checklist porque cada secuencia es independiente.
 */
function cambiarModo(modo) {
  modoActual = modo;
  pasoActual = 0;

  document.getElementById('botonUmbralEntro')
    .setAttribute('aria-pressed', String(modo === 'enter'));
  document.getElementById('botonUmbralSalgo')
    .setAttribute('aria-pressed', String(modo === 'exit'));

  dibujarPasos();
}

function cargarEstadoGuardado() {
  const diaActual = getDay(obtenerFechaHoy());
  const bloqueUmbral = diaActual?.threshold;
  if (bloqueUmbral?.lastAction) {
    cambiarModo(bloqueUmbral.lastAction);
  }
  if (bloqueUmbral?.completed) {
    document.getElementById('botonCompletarUmbral').textContent = 'Umbral completado ✓';
  }
}

function completarUmbral() {
  saveBlock(obtenerFechaHoy(), 'threshold', {
    completed: true,
    completedAt: obtenerHoraActual(),
    lastAction: modoActual,
  });
  document.getElementById('botonCompletarUmbral').textContent = 'Umbral completado ✓';
}

function iniciarPantallaUmbral() {
  document.getElementById('botonUmbralEntro')
    .addEventListener('click', () => cambiarModo('enter'));
  document.getElementById('botonUmbralSalgo')
    .addEventListener('click', () => cambiarModo('exit'));
  document.getElementById('botonCompletarUmbral')
    .addEventListener('click', completarUmbral);

  cambiarModo('enter');
  cargarEstadoGuardado();
}

export { iniciarPantallaUmbral };
