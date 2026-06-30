// storage.js — capa de abstracción sobre localStorage.
// Ningún otro archivo debe acceder a localStorage directamente: toda
// lectura/escritura de datos de la app pasa por las funciones exportadas
// acá. Estructura completa documentada en CLAUDE.md sección 4.2.

const CLAVE_RAIZ = 'em_data';
const VERSION_ACTUAL = 1;

const SETTINGS_POR_DEFECTO = {
  mantraInhale: 'claridad',
  mantraExhale: 'confío',
};

/**
 * Devuelve el objeto raíz completo desde localStorage, creándolo con su
 * forma mínima si todavía no existe (primera vez que se abre la app).
 */
function leerRaiz() {
  const crudo = localStorage.getItem(CLAVE_RAIZ);
  if (!crudo) {
    return {
      version: VERSION_ACTUAL,
      settings: { ...SETTINGS_POR_DEFECTO },
      days: {},
    };
  }
  return JSON.parse(crudo);
}

/**
 * Persiste el objeto raíz completo en localStorage.
 */
function escribirRaiz(raiz) {
  localStorage.setItem(CLAVE_RAIZ, JSON.stringify(raiz));
}

/**
 * Devuelve el objeto del día indicado (formato "YYYY-MM-DD", hora local),
 * o null si ese día todavía no tiene ningún dato guardado.
 */
function getDay(fechaStr) {
  const raiz = leerRaiz();
  return raiz.days[fechaStr] ?? null;
}

/**
 * Guarda (o mergea sobre lo existente) los datos de un bloque puntual de
 * un día. bloqueNombre es uno de: "morning" | "midday" | "threshold" | "night".
 * Hace merge superficial: los campos nuevos pisan a los viejos, el resto
 * del bloque se conserva.
 */
function saveBlock(fechaStr, bloqueNombre, datos) {
  const raiz = leerRaiz();
  if (!raiz.days[fechaStr]) {
    raiz.days[fechaStr] = {};
  }
  raiz.days[fechaStr][bloqueNombre] = {
    ...raiz.days[fechaStr][bloqueNombre],
    ...datos,
  };
  escribirRaiz(raiz);
}

/**
 * Devuelve el objeto completo "days" con todos los días guardados hasta
 * ahora, indexado por fecha "YYYY-MM-DD".
 */
function getAllDays() {
  return leerRaiz().days;
}

/**
 * Devuelve la configuración actual de la app (mantras del timer, etc.).
 */
function getSettings() {
  return leerRaiz().settings;
}

/**
 * Guarda (mergeando sobre lo existente) la configuración de la app.
 */
function saveSettings(settings) {
  const raiz = leerRaiz();
  raiz.settings = { ...raiz.settings, ...settings };
  escribirRaiz(raiz);
}

/**
 * Devuelve todos los datos de la app como string JSON, listo para
 * descargar como archivo de respaldo.
 */
function exportData() {
  return JSON.stringify(leerRaiz(), null, 2);
}

/**
 * Valida e importa un JSON exportado previamente con exportData().
 * Reemplaza por completo los datos actuales. Lanza un Error con mensaje
 * descriptivo si el JSON no tiene la forma esperada.
 */
function importData(jsonStr) {
  let datos;
  try {
    datos = JSON.parse(jsonStr);
  } catch {
    throw new Error('El archivo no contiene JSON válido.');
  }

  if (typeof datos !== 'object' || datos === null) {
    throw new Error('El archivo no tiene la estructura esperada.');
  }
  if (typeof datos.version !== 'number') {
    throw new Error('Falta el campo "version" en el archivo.');
  }
  if (typeof datos.days !== 'object' || datos.days === null) {
    throw new Error('Falta el campo "days" en el archivo.');
  }

  escribirRaiz({
    version: datos.version,
    settings: { ...SETTINGS_POR_DEFECTO, ...datos.settings },
    days: datos.days,
  });
}

export {
  getDay,
  saveBlock,
  getAllDays,
  getSettings,
  saveSettings,
  exportData,
  importData,
};
