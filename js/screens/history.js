// screens/history.js — lógica de la pantalla Historial: grid de los
// últimos 30 días, racha actual, detalle de un día al tocarlo, y
// exportar/importar los datos guardados.

import { getAllDays, exportData, importData } from '../storage.js';

const BLOQUES = [
  { nombre: 'morning', etiqueta: 'Mañana', color: 'var(--color-morning)' },
  { nombre: 'midday', etiqueta: 'Mediodía', color: 'var(--color-midday)' },
  { nombre: 'threshold', etiqueta: 'Umbral', color: 'var(--color-threshold)' },
  { nombre: 'night', etiqueta: 'Noche', color: 'var(--color-night)' },
];

function obtenerFechaHoy() {
  return formatearFecha(new Date());
}

function formatearFecha(fecha) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

/**
 * Devuelve las fechas "YYYY-MM-DD" de los últimos 30 días, de más antigua
 * a más reciente (hoy es la última).
 */
function ultimos30Dias() {
  const fechas = [];
  const hoy = new Date();
  for (let i = 29; i >= 0; i -= 1) {
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() - i);
    fechas.push(formatearFecha(fecha));
  }
  return fechas;
}

/**
 * Cuenta los días consecutivos hacia atrás desde hoy en los que se
 * completó al menos un bloque. Si hoy todavía no tiene nada completado,
 * no corta la racha (el día sigue en curso).
 */
function calcularRacha(todosLosDias) {
  const hoy = new Date();
  let racha = 0;

  for (let i = 0; i < 3650; i += 1) {
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() - i);
    const dia = todosLosDias[formatearFecha(fecha)];
    const tieneAlgoCompletado = BLOQUES.some((b) => dia?.[b.nombre]?.completed);

    if (!tieneAlgoCompletado) {
      if (i === 0) continue; // hoy puede seguir en curso, no corta la racha
      break;
    }
    racha += 1;
  }

  return racha;
}

/**
 * Conic-gradient de 4 segmentos: uno por bloque, coloreado con el acento
 * del momento del día si está completado, o gris si no.
 */
function construirGradiente(dia) {
  const segmentos = BLOQUES.map(
    (b) => (dia?.[b.nombre]?.completed ? b.color : 'var(--color-surface-2)')
  );
  return `conic-gradient(${segmentos[0]} 0% 25%, ${segmentos[1]} 25% 50%, ${segmentos[2]} 50% 75%, ${segmentos[3]} 75% 100%)`;
}

function construirGrid() {
  const grid = document.getElementById('historialGrid');
  grid.innerHTML = '';
  const todosLosDias = getAllDays();

  ultimos30Dias().forEach((fechaStr) => {
    const dia = todosLosDias[fechaStr];
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'historial-dia';
    boton.setAttribute('aria-label', `Ver detalle del ${fechaStr}`);
    boton.style.background = construirGradiente(dia);
    boton.textContent = String(Number(fechaStr.slice(8, 10)));
    boton.addEventListener('click', () => mostrarDetalleDia(fechaStr, dia));
    grid.appendChild(boton);
  });

  document.getElementById('rachaTexto').textContent = `${calcularRacha(todosLosDias)} días`;
}

/**
 * Crea un <p><strong>etiqueta:</strong> valor</p> usando textContent, sin
 * innerHTML, porque el valor es texto escrito por el usuario (o importado
 * desde un archivo) y no debe interpretarse como HTML.
 */
function crearLineaDetalle(etiqueta, valor) {
  const parrafo = document.createElement('p');
  const fuerte = document.createElement('strong');
  fuerte.textContent = `${etiqueta}: `;
  parrafo.appendChild(fuerte);
  parrafo.appendChild(document.createTextNode(valor || '—'));
  return parrafo;
}

function mostrarDetalleDia(fechaStr, dia) {
  const contenedor = document.getElementById('detalleDiaContenido');
  contenedor.innerHTML = '';
  document.getElementById('detalleDiaFecha').textContent = fechaStr;

  BLOQUES.forEach(({ nombre, etiqueta }) => {
    const datos = dia?.[nombre];
    const titulo = document.createElement('h3');
    titulo.className = 'tarjeta__titulo';
    titulo.textContent = datos?.completed
      ? `${etiqueta} (${datos.completedAt})`
      : `${etiqueta} — no completado`;
    contenedor.appendChild(titulo);

    if (!datos?.completed) return;

    if (nombre === 'morning') {
      contenedor.appendChild(crearLineaDetalle('Victoria', datos.victory));
    } else if (nombre === 'midday') {
      contenedor.appendChild(crearLineaDetalle('Distorsión', datos.distortion));
      contenedor.appendChild(crearLineaDetalle('Logro', datos.win));
    } else if (nombre === 'threshold') {
      contenedor.appendChild(
        crearLineaDetalle('Acción', datos.lastAction === 'enter' ? 'Entro a trabajar' : 'Salgo de trabajar')
      );
    } else if (nombre === 'night') {
      contenedor.appendChild(
        crearLineaDetalle('Cosecha', (datos.harvest || []).filter(Boolean).join(' · '))
      );
      if (datos.hadFailure) {
        contenedor.appendChild(crearLineaDetalle('Reencuadre', datos.reframe));
      }
    }
  });

  document.getElementById('modalDetalleDia').classList.add('modal--abierto');
}

function cerrarDetalleDia() {
  document.getElementById('modalDetalleDia').classList.remove('modal--abierto');
}

function exportar() {
  const json = exportData();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = `entrenamiento-mental-${obtenerFechaHoy()}.json`;
  enlace.click();
  URL.revokeObjectURL(url);
}

function importar(evento) {
  const archivo = evento.target.files[0];
  if (!archivo) return;

  const lector = new FileReader();
  lector.onload = () => {
    try {
      importData(lector.result);
      construirGrid();
      alert('Datos importados correctamente.');
    } catch (error) {
      alert(`No se pudo importar: ${error.message}`);
    }
  };
  lector.readAsText(archivo);
  evento.target.value = '';
}

function iniciarPantallaHistorial() {
  document.getElementById('botonExportar').addEventListener('click', exportar);
  document.getElementById('botonImportar').addEventListener('click', () => {
    document.getElementById('inputImportar').click();
  });
  document.getElementById('inputImportar').addEventListener('change', importar);
  document.getElementById('botonCerrarDetalleDia').addEventListener('click', cerrarDetalleDia);

  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape') cerrarDetalleDia();
  });

  // Refresca el grid cada vez que se navega a Historial, para reflejar
  // bloques recién completados en otras pantallas durante la sesión.
  document.addEventListener('pantalla:cambio', (evento) => {
    if (evento.detail.nombre === 'history') construirGrid();
  });

  construirGrid();
}

export { iniciarPantallaHistorial };
