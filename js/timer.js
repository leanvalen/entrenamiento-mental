// timer.js — modal del timer de respiración 4-2-6 (4s inhalar, 2s pausa,
// 6s exhalar), con el mantra sincronizado a cada fase.
//
// La animación del anillo SVG se controla con requestAnimationFrame y
// timestamps (no setInterval), para que no se desincronice si la pestaña
// pierde el foco. El cleanup cancela el rAF tanto al cerrar el modal como
// al pausar, para no dejar timers huérfanos.

import { getSettings } from './storage.js';

const RADIO = 80;
const CIRCUNFERENCIA = 2 * Math.PI * RADIO;

let FASES = [];
let faseActual = 0;
let ciclosCompletados = 0;
let inicioFase = null;       // timestamp (rAF) en que arrancó la fase actual
let tiempoAcumuladoFase = 0; // ms transcurridos en la fase, válido durante pausa
let rafId = null;
let pausado = false;
let elementoConFocoPrevio = null;

let elementos = {};

/**
 * Arma el listado de fases con los mantras configurados en settings. Se
 * recalcula cada vez que se abre el modal por si el usuario cambió la
 * configuración entre medio.
 */
function construirFases() {
  const settings = getSettings();
  FASES = [
    { nombre: 'inhale', duracion: 4000, etiqueta: 'Inhalo', mantra: settings.mantraInhale },
    { nombre: 'hold', duracion: 2000, etiqueta: 'Pausa', mantra: '' },
    { nombre: 'exhale', duracion: 6000, etiqueta: 'Exhalo', mantra: settings.mantraExhale },
  ];
}

/**
 * Dibuja el anillo según la fase y el progreso (0 a 1) dentro de ella.
 * Inhalar: el anillo crece de vacío a lleno. Pausa: queda lleno.
 * Exhalar: el anillo se vacía de lleno a vacío.
 */
function dibujarAnillo(fase, progreso) {
  let proporcionLlena;
  if (fase.nombre === 'inhale') {
    proporcionLlena = progreso;
  } else if (fase.nombre === 'hold') {
    proporcionLlena = 1;
  } else {
    proporcionLlena = 1 - progreso;
  }
  elementos.circuloProgreso.style.strokeDashoffset = String(CIRCUNFERENCIA * (1 - proporcionLlena));
}

function actualizarTextosFase() {
  const fase = FASES[faseActual];
  elementos.textoFase.textContent = fase.etiqueta;
  elementos.textoMantra.textContent = fase.mantra;
}

function actualizarContadorCiclos() {
  elementos.contadorCiclos.textContent = `Ciclos completados: ${ciclosCompletados}`;
}

/**
 * Loop principal del timer. Avanza de fase cuando se cumple la duración,
 * y vuelve a programarse a sí mismo mientras no esté pausado.
 */
function paso(timestampActual) {
  if (inicioFase === null) {
    inicioFase = timestampActual - tiempoAcumuladoFase;
  }
  const transcurrido = timestampActual - inicioFase;
  const fase = FASES[faseActual];

  if (transcurrido >= fase.duracion) {
    faseActual = (faseActual + 1) % FASES.length;
    if (faseActual === 0) {
      ciclosCompletados += 1;
      actualizarContadorCiclos();
    }
    inicioFase = timestampActual;
    tiempoAcumuladoFase = 0;
    actualizarTextosFase();
    dibujarAnillo(FASES[faseActual], 0);
  } else {
    tiempoAcumuladoFase = transcurrido;
    dibujarAnillo(fase, transcurrido / fase.duracion);
  }

  rafId = requestAnimationFrame(paso);
}

function pausarReanudarTimer() {
  pausado = !pausado;
  if (pausado) {
    cancelAnimationFrame(rafId);
    elementos.botonPausar.textContent = 'Reanudar';
  } else {
    inicioFase = null; // se recalcula en el próximo frame usando tiempoAcumuladoFase
    rafId = requestAnimationFrame(paso);
    elementos.botonPausar.textContent = 'Pausar';
  }
}

/**
 * Devuelve los elementos focuseables del modal, en orden, para el foco
 * atrapado mientras está abierto.
 */
function obtenerFocuseablesDelModal() {
  return Array.from(
    elementos.modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
  );
}

function manejarTeclado(evento) {
  if (evento.key === 'Escape') {
    cerrarTimer();
    return;
  }
  if (evento.key !== 'Tab') return;

  const focuseables = obtenerFocuseablesDelModal();
  const primero = focuseables[0];
  const ultimo = focuseables[focuseables.length - 1];

  if (evento.shiftKey && document.activeElement === primero) {
    evento.preventDefault();
    ultimo.focus();
  } else if (!evento.shiftKey && document.activeElement === ultimo) {
    evento.preventDefault();
    primero.focus();
  }
}

function abrirTimer() {
  elementoConFocoPrevio = document.activeElement;

  construirFases();
  faseActual = 0;
  ciclosCompletados = 0;
  inicioFase = null;
  tiempoAcumuladoFase = 0;
  pausado = false;

  elementos.botonPausar.textContent = 'Pausar';
  actualizarTextosFase();
  actualizarContadorCiclos();
  dibujarAnillo(FASES[0], 0);

  elementos.modal.classList.add('modal--abierto');
  document.addEventListener('keydown', manejarTeclado);
  elementos.botonCerrar.focus();

  rafId = requestAnimationFrame(paso);
}

function cerrarTimer() {
  cancelAnimationFrame(rafId);
  document.removeEventListener('keydown', manejarTeclado);
  elementos.modal.classList.remove('modal--abierto');
  elementoConFocoPrevio?.focus();
}

/**
 * Conecta los listeners del modal del timer. Se llama una vez al iniciar
 * la app. Cualquier pantalla puede abrir el timer disparando el evento
 * global "timer:abrir" en document.
 */
function iniciarTimer() {
  elementos = {
    modal: document.getElementById('modalTimer'),
    botonCerrar: document.getElementById('botonCerrarTimer'),
    botonPausar: document.getElementById('botonPausarTimer'),
    circuloProgreso: document.getElementById('circuloProgresoTimer'),
    textoFase: document.getElementById('timerTextoFase'),
    textoMantra: document.getElementById('timerTextoMantra'),
    contadorCiclos: document.getElementById('timerContadorCiclos'),
  };

  elementos.circuloProgreso.style.strokeDasharray = String(CIRCUNFERENCIA);

  document.addEventListener('timer:abrir', abrirTimer);
  elementos.botonCerrar.addEventListener('click', cerrarTimer);
  elementos.botonPausar.addEventListener('click', pausarReanudarTimer);
}

export { iniciarTimer };
