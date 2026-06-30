// screens/night.js — lógica de la pantalla Noche: cosecha del día, toggle
// de fallo/reencuadre, y marcar el bloque "night" como completado.

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

/**
 * Cambia el toggle "¿Hubo algún fallo hoy?" al valor indicado (true/false)
 * y muestra u oculta el campo de reencuadre en consecuencia.
 */
function marcarFallo(huboFallo) {
  const botonSi = document.getElementById('botonFalloSi');
  const botonNo = document.getElementById('botonFalloNo');
  const contenedorReencuadre = document.getElementById('contenedorReencuadre');

  botonSi.setAttribute('aria-pressed', String(huboFallo === true));
  botonNo.setAttribute('aria-pressed', String(huboFallo === false));
  contenedorReencuadre.hidden = huboFallo !== true;
}

function cargarEstadoGuardado() {
  const diaActual = getDay(obtenerFechaHoy());
  const bloqueNoche = diaActual?.night;
  if (!bloqueNoche) return;

  if (Array.isArray(bloqueNoche.harvest)) {
    bloqueNoche.harvest.forEach((texto, indice) => {
      const campo = document.getElementById(`campoCosecha${indice + 1}`);
      if (campo) campo.value = texto;
    });
  }

  if (typeof bloqueNoche.hadFailure === 'boolean') {
    marcarFallo(bloqueNoche.hadFailure);
  }

  if (bloqueNoche.reframe) {
    document.getElementById('campoReencuadre').value = bloqueNoche.reframe;
  }

  if (bloqueNoche.completed) {
    document.getElementById('botonCompletarNoche').textContent = 'Noche completada ✓';
  }
}

function completarNoche() {
  const cosecha = [1, 2, 3].map(
    (n) => document.getElementById(`campoCosecha${n}`).value.trim()
  );
  const botonSi = document.getElementById('botonFalloSi');
  const huboFallo = botonSi.getAttribute('aria-pressed') === 'true';
  const reencuadre = document.getElementById('campoReencuadre').value.trim();
  const botonCompletar = document.getElementById('botonCompletarNoche');

  saveBlock(obtenerFechaHoy(), 'night', {
    completed: true,
    completedAt: obtenerHoraActual(),
    harvest: cosecha,
    hadFailure: huboFallo,
    reframe: huboFallo ? reencuadre : '',
  });

  botonCompletar.textContent = 'Noche completada ✓';
}

function iniciarPantallaNoche() {
  document.getElementById('botonFalloSi')
    .addEventListener('click', () => marcarFallo(true));
  document.getElementById('botonFalloNo')
    .addEventListener('click', () => marcarFallo(false));
  document.getElementById('botonCompletarNoche')
    .addEventListener('click', completarNoche);

  cargarEstadoGuardado();
}

export { iniciarPantallaNoche };
