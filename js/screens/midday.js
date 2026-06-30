// screens/midday.js — lógica de la pantalla Mediodía: registrar la
// distorsión detectada y el pequeño logro del día, y marcar el bloque
// "midday" como completado.

import { getDay, saveBlock } from '../storage.js';

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

function cargarEstadoGuardado() {
  const diaActual = getDay(obtenerFechaHoy());
  const bloqueMediodia = diaActual?.midday;
  if (!bloqueMediodia) return;

  if (bloqueMediodia.distortion) {
    document.getElementById('campoDistorsionMediodia').value = bloqueMediodia.distortion;
  }
  if (bloqueMediodia.win) {
    document.getElementById('campoWinMediodia').value = bloqueMediodia.win;
  }
  if (bloqueMediodia.completed) {
    document.getElementById('botonCompletarMediodia').textContent = 'Mediodía completado ✓';
  }
}

function completarMediodia() {
  const distorsion = document.getElementById('campoDistorsionMediodia').value.trim();
  const win = document.getElementById('campoWinMediodia').value.trim();
  const botonCompletar = document.getElementById('botonCompletarMediodia');

  saveBlock(obtenerFechaHoy(), 'midday', {
    completed: true,
    completedAt: obtenerHoraActual(),
    distortion: distorsion,
    win,
  });

  botonCompletar.textContent = 'Mediodía completado ✓';
}

function iniciarPantallaMediodia() {
  document.getElementById('botonCompletarMediodia')
    .addEventListener('click', completarMediodia);

  cargarEstadoGuardado();
}

export { iniciarPantallaMediodia };
