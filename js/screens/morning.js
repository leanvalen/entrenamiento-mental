// screens/morning.js — lógica de la pantalla Mañana: cargar/guardar la
// victoria del día y marcar el bloque "morning" como completado.

import { getDay, saveBlock } from '../storage.js';

/**
 * Fecha local de hoy en formato "YYYY-MM-DD", la misma key que usa storage.js.
 */
function obtenerFechaHoy() {
  const ahora = new Date();
  const anio = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

/**
 * Hora local actual en formato "HH:MM", para registrar completedAt.
 */
function obtenerHoraActual() {
  const ahora = new Date();
  const horas = String(ahora.getHours()).padStart(2, '0');
  const minutos = String(ahora.getMinutes()).padStart(2, '0');
  return `${horas}:${minutos}`;
}

/**
 * Si ya hay datos guardados del bloque "morning" de hoy, los muestra en
 * pantalla (victoria escrita y estado del botón de completar).
 */
function cargarEstadoGuardado() {
  const diaActual = getDay(obtenerFechaHoy());
  const bloqueManana = diaActual?.morning;
  if (!bloqueManana) return;

  const campoVictoria = document.getElementById('campoVictoriaManana');
  if (bloqueManana.victory) {
    campoVictoria.value = bloqueManana.victory;
  }

  if (bloqueManana.completed) {
    const botonCompletar = document.getElementById('botonCompletarManana');
    botonCompletar.textContent = 'Mañana completada ✓';
  }
}

/**
 * Guarda la victoria escrita y marca el bloque "morning" de hoy como
 * completado, con su hora de finalización.
 */
function completarManana() {
  const campoVictoria = document.getElementById('campoVictoriaManana');
  const botonCompletar = document.getElementById('botonCompletarManana');

  saveBlock(obtenerFechaHoy(), 'morning', {
    completed: true,
    completedAt: obtenerHoraActual(),
    victory: campoVictoria.value.trim(),
  });

  botonCompletar.textContent = 'Mañana completada ✓';
}

/**
 * Conecta los listeners de la pantalla Mañana y restaura el estado guardado
 * de hoy, si existe. Se llama una vez al iniciar la app.
 */
function iniciarPantallaManana() {
  document.getElementById('botonCompletarManana')
    .addEventListener('click', completarManana);

  // El botón del timer dispara un evento global; timer.js lo escucha
  // cuando esté implementado (Fase 3, siguiente paso).
  document.getElementById('botonAbrirTimerManana')
    .addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('timer:abrir'));
    });

  cargarEstadoGuardado();
}

export { iniciarPantallaManana };
