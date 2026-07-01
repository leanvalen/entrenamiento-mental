# CLAUDE.md — App "Entrenamiento Mental" (PWA personal)

Este archivo es la memoria permanente del proyecto. Leelo completo antes de
tocar cualquier archivo. Cada decisión de arquitectura, diseño y contenido
está acá explicada con su porqué.

---

## 0. Estado actual (leer primero)

**La app está completa y en producción.** Las secciones 9 y 10 de más abajo
describen el plan *original* de construcción — quedan como referencia
histórica, no como pendientes. Todo lo de la sección 5 (contenido de las
5 pantallas) ya está implementado con las frases reales del docx.

- **URL en vivo:** https://leanvalen.github.io/entrenamiento-mental/
- **Repo:** https://github.com/leanvalen/entrenamiento-mental (rama `main`)
- Instalada como PWA en el celular del usuario; funciona offline porque el
  service worker cachea todos los assets en el primer uso (ver sección 7).
- Cualquier cambio se refleja en el celular recién cuando: (1) se hace
  `git push` a `main`, (2) GitHub Pages termina de propagar (1-2 min), y
  (3) el celular tiene señal la próxima vez que abre la app (el SW chequea
  actualizaciones en segundo plano).
- Ver sección 12 para el detalle completo de despliegue y las decisiones
  que se tomaron *después* de la construcción inicial (no estaban en el
  plan original).

---

## 1. Qué es este proyecto

Una Progressive Web App (PWA) de uso estrictamente personal para implementar
un plan diario de entrenamiento mental basado en PNL (Programación
Neurolingüística). El plan trabaja tres ejes: proactividad, constancia y
autoestima.

**Usuario único:** el dueño del proyecto. No hay login, no hay backend, no
hay múltiples usuarios. Todo vive en el dispositivo.

**Propósito técnico:** aprendizaje progresivo de desarrollo de apps. El
código debe ser legible, comentado, y estructurado para poder crecer en
complejidad sin necesidad de reescribir desde cero.

---

## 2. Stack tecnológico

| Capa | Decisión | Porqué |
|---|---|---|
| Lenguaje | HTML + CSS + JavaScript vanilla (ES6+) | Sin dependencias, sin build step, cero fricción para aprender |
| Framework UI | Ninguno | El proyecto es suficientemente simple; jQuery o React serían overhead |
| Persistencia | `localStorage` | Sin backend; todo queda en el navegador del dispositivo |
| PWA | `manifest.json` + Service Worker básico | Para instalar en pantalla de inicio del celular |
| Tipografías | Google Fonts (Fraunces + Inter) | Cargadas con `display=swap`; se cachean en el SW |
| Servidor dev | `npx serve .` o `python -m http.server` | Sin instalación extra; cualquiera de los dos sirve |

**No usar:**
- Frameworks CSS como Tailwind o Bootstrap (se puede, pero no para este proyecto — CSS custom permite más control visual y es mejor para aprender).
- Bundlers (Vite, Webpack, Parcel) — no son necesarios todavía.
- npm packages en general — si surge la necesidad de uno puntual, consultar antes.

---

## 3. Estructura de archivos

```
entrenamiento-mental/
├── CLAUDE.md                        ← este archivo
├── index.html                       ← punto de entrada único
├── manifest.json                    ← config PWA (nombre, íconos, theme)
├── service-worker.js                ← cacheo offline básico
├── css/
│   ├── reset.css                    ← reset minimalista (no normalize completo)
│   ├── tokens.css                   ← variables CSS (colores, tipografía, espaciado)
│   └── app.css                      ← estilos de componentes y pantallas
├── js/
│   ├── app.js                       ← punto de entrada JS; inicialización
│   ├── router.js                    ← navegación entre pantallas (sin librería)
│   ├── storage.js                   ← capa de abstracción sobre localStorage
│   ├── timer.js                     ← lógica del timer de respiración 4-2-6
│   └── screens/
│       ├── morning.js               ← lógica pantalla Mañana
│       ├── midday.js                ← lógica pantalla Mediodía
│       ├── threshold.js             ← lógica pantalla Umbral
│       ├── night.js                 ← lógica pantalla Noche
│       └── history.js               ← lógica pantalla Historial
├── icons/
│   ├── icon-192.png                 ← ícono PWA 192×192
│   └── icon-512.png                 ← ícono PWA 512×512
└── docs/
    └── Entrenamiento Mental chat Gemini.docx   ← referencia de contenido original
```

**`docs/` no está en el repo de GitHub** (está en `.gitignore`). El docx
tiene contenido personal de coaching y el repo es público, así que se
excluyó a propósito — sigue existiendo en el disco local, solo no se
sube. Si el archivo desaparece de la carpeta local, no hay forma de
recuperarlo desde git; es responsabilidad del usuario respaldarlo aparte.

**Regla de organización:** cada pantalla tiene su propio archivo JS en
`screens/`. El HTML de cada pantalla vive en `index.html` dentro de
`<section>` con `data-screen="nombre"`. El router muestra/oculta secciones
según la navegación.

---

## 4. Arquitectura de la app

### 4.1 Navegación (sin librería)

Un router propio y mínimo en `router.js`. Las pantallas son secciones HTML
que se muestran u ocultan con una clase CSS `screen--active`. No hay URLs
distintas por pantalla (es una SPA sin history API para mantenerlo simple).

```
Pantallas: morning | midday | threshold | night | history
```

La pantalla activa al abrir la app se determina por hora del sistema:

| Hora | Pantalla default |
|---|---|
| 05:00 – 11:59 | morning |
| 12:00 – 13:59 | midday |
| 14:00 – 19:59 | threshold |
| 20:00 – 04:59 | night |

El usuario puede navegar libremente a cualquier pantalla desde la barra
inferior.

### 4.2 Persistencia — capa `storage.js`

Toda la lectura/escritura de `localStorage` pasa por `storage.js`.
**Nunca acceder a `localStorage` directamente desde otros archivos.**

Estructura del objeto raíz guardado bajo la key `"em_data"`:

```json
{
  "version": 1,
  "settings": {
    "mantraInhale": "claridad",
    "mantraExhale": "confío"
  },
  "days": {
    "2026-06-24": {
      "morning": {
        "completed": true,
        "completedAt": "07:43",
        "victory": "Texto que escribió el usuario"
      },
      "midday": {
        "completed": true,
        "completedAt": "12:31",
        "distortion": "Texto de la generalización detectada",
        "win": "La cosa pequeña que sí logré"
      },
      "threshold": {
        "completed": true,
        "completedAt": "09:05",
        "lastAction": "enter"
      },
      "night": {
        "completed": true,
        "completedAt": "22:15",
        "harvest": ["cosa 1", "cosa 2", "cosa 3"],
        "hadFailure": true,
        "reframe": "Texto del reencuadre"
      }
    }
  }
}
```

La key del día siempre es `YYYY-MM-DD` en hora local.

API pública de `storage.js` (funciones que exporta):
- `getDay(dateStr)` → objeto del día o null
- `saveBlock(dateStr, blockName, data)` → guarda/mergeea un bloque
- `getAllDays()` → objeto con todos los días guardados
- `getSettings()` → objeto settings
- `saveSettings(settings)` → guarda settings
- `exportData()` → devuelve JSON string para descarga
- `importData(jsonStr)` → valida e importa JSON

### 4.3 Timer de respiración (`timer.js`)

El timer es el componente más técnico. Tiene que manejar:
- Un ciclo de 12 segundos (4 inhalar + 2 pausa + 6 exhalar)
- Una animación CSS controlada por JS (no animación CSS pura, para poder
  pausar/reiniciar con precisión)
- El texto del mantra sincronizado con la fase
- El conteo de ciclos completados
- Un cleanup correcto al cerrar (cancelar `requestAnimationFrame` o
  `setInterval`, no dejar timers huérfanos)

El anillo de respiración se implementa como un `<svg>` con un `<circle>`
cuyo radio se anima con JS usando `requestAnimationFrame`.

No usar `setInterval` para la animación visual — usar `requestAnimationFrame`
con timestamps para que no se desincronice si el tab pierde foco.

---

## 5. Contenido de cada pantalla

El contenido textual (afirmaciones, preguntas, checklists) está en
`docs/Entrenamiento_Mental_chat_Gemini.docx`. Usarlo como fuente de verdad
para los textos. Copiar las frases exactas, sin reformular.

### 5.1 Mañana
- Checklist de postura (1 ítem)
- Pregunta de activación destacada (cita tipográfica)
- Campo: "Mi primera pequeña victoria de hoy es..."
- 3 afirmaciones de mañana (tarjetas deslizables horizontalmente)
- Botón: "Respiración 4-2-6" → abre modal del timer
- Botón: "Completar mañana ✓"

### 5.2 Mediodía
- Texto intro (2 minutos de auditoría)
- Lista informativa de virus cognitivos a detectar
- Campo: "¿Qué me dije que suena a generalización o regla rígida?"
- Pregunta de precisión destacada
- Campo: "La cosa pequeña que sí logré es..."
- Botón: "Completar mediodía ✓"

### 5.3 Umbral
- Toggle: "Entro a trabajar" / "Salgo de trabajar"
- Checklist secuencial de 3–4 pasos según el toggle activo
  (cada paso se toca para marcar, avanza al siguiente automáticamente)
- Botón: "Completar umbral ✓"

### 5.4 Noche
- 3 campos de cosecha (una línea cada uno)
- Toggle "¿Hubo algún fallo hoy?" → si sí, aparece campo de reencuadre
- 3 afirmaciones de noche (tarjetas iguales a las de mañana)
- 3 imágenes de "soltar" (solo texto, el usuario lee la que resuena)
- Botón: "Completar noche ✓"

### 5.5 Historial
- Grid de últimos 30 días (círculos con 4 segmentos)
- Racha actual con ícono de fuego
- Al tocar un día: panel/modal con el detalle de ese día
- Botones de exportar e importar datos

---

## 6. Diseño visual

### 6.1 Filosofía

La app acompaña momentos privados del día — al despertar, antes de dormir.
El tono visual es el de un cuaderno personal con criterio, no el de una
herramienta de productividad SaaS. **Cálido, contenido, sin animaciones
decorativas extra.**

El único elemento con movimiento prominente es el anillo de respiración.
Todo lo demás queda quieto.

### 6.2 Tokens de diseño (definidos en `css/tokens.css`)

```css
:root {
  /* Fondos */
  --color-bg:           #1C1A17;   /* crema oscuro, fondo base */
  --color-surface:      #252219;   /* superficie de tarjetas */
  --color-surface-2:    #2E2A22;   /* hover/activo suave */

  /* Texto */
  --color-text:         #F2EDE4;   /* texto principal */
  --color-text-muted:   #9C9488;   /* texto secundario, etiquetas */
  --color-text-faint:   #605A51;   /* placeholder, disabled */

  /* Acentos por momento del día */
  --color-morning:      #E8A04C;   /* ámbar */
  --color-midday:       #A8B86B;   /* verde lima suave */
  --color-threshold:    #C2724F;   /* terracota */
  --color-night:        #3D5A52;   /* verde-azulado profundo */

  /* Acento neutro (UI genérica) */
  --color-accent:       #E8A04C;   /* ámbar, mismo que morning */
  --color-accent-dim:   #7A5828;   /* ámbar oscuro, para bordes sutiles */

  /* Tipografía */
  --font-display:       'Fraunces', Georgia, serif;
  --font-body:          'Inter', system-ui, sans-serif;

  /* Escala tipográfica */
  --text-xs:    0.75rem;   /* 12px */
  --text-sm:    0.875rem;  /* 14px */
  --text-base:  1rem;      /* 16px */
  --text-lg:    1.125rem;  /* 18px */
  --text-xl:    1.25rem;   /* 20px */
  --text-2xl:   1.5rem;    /* 24px */
  --text-3xl:   1.875rem;  /* 30px */

  /* Espaciado */
  --space-1:   0.25rem;
  --space-2:   0.5rem;
  --space-3:   0.75rem;
  --space-4:   1rem;
  --space-6:   1.5rem;
  --space-8:   2rem;
  --space-12:  3rem;
  --space-16:  4rem;

  /* Bordes */
  --radius-sm:  6px;
  --radius-md:  12px;
  --radius-lg:  20px;
  --radius-full: 9999px;

  /* Transiciones */
  --transition-fast:    150ms ease;
  --transition-base:    250ms ease;
  --transition-slow:    400ms ease;

  /* Z-index */
  --z-screen:   1;
  --z-nav:      10;
  --z-modal:    100;
}
```

### 6.3 Tipografía

- **Títulos de pantalla:** Fraunces, `--text-2xl`, weight 600, color `--color-text`
- **Preguntas destacadas (citas):** Fraunces italic, `--text-lg`, color del acento de la pantalla
- **Cuerpo / labels:** Inter, `--text-base`, color `--color-text`
- **Texto secundario:** Inter, `--text-sm`, color `--color-text-muted`
- **Botones:** Inter, `--text-base`, weight 500

### 6.4 Layout mobile-first

- Ancho máximo: 430px, centrado en desktop con fondo `--color-bg`
- Padding lateral: `--space-6` (24px)
- Barra de navegación inferior: fija, altura 64px + safe-area-inset-bottom
- Área de contenido: scroll vertical, padding-bottom suficiente para no
  quedar tapado por la nav bar
- Targets táctiles mínimos: 44×44px
- Sin gestos horizontales en pantallas de contenido (solo en las tarjetas
  de afirmaciones si se implementa swipe)

### 6.5 Barra de navegación inferior

5 íconos: Mañana ☀️ · Mediodía 🔍 · Umbral 🚪 · Noche 🌙 · Historial 📅

El ícono activo se colorea con el acento de la pantalla correspondiente.
Los completados del día muestran un pequeño punto debajo del ícono.

---

## 7. PWA

### `manifest.json` real (actualizado tras el deploy):
```json
{
  "name": "Entrenamiento Mental",
  "short_name": "E. Mental",
  "start_url": ".",
  "scope": ".",
  "display": "standalone",
  "background_color": "#1C1A17",
  "theme_color": "#E8A04C",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

**Importante — `start_url` y `scope` son relativos (`"."`), no absolutos
(`"/"`).** GitHub Pages publica el sitio en una subcarpeta
(`usuario.github.io/entrenamiento-mental/`), no en la raíz del dominio.
Con rutas absolutas, la app instalada apuntaba a la raíz del dominio y
tiraba 404 (bug real que pasó y se corrigió). Por la misma razón:
- `service-worker.js` registra con `navigator.serviceWorker.register('./service-worker.js')` (relativo), no `'/service-worker.js'`.
- La lista `ASSETS_PROPIOS` dentro de `service-worker.js` usa rutas con
  `./` al principio (`./index.html`, `./css/app.css`, etc.), no `/`.
- Si algún día se vuelve a servir desde la raíz de un dominio propio
  (ej. Netlify con dominio custom), las rutas relativas siguen
  funcionando igual — no hace falta revertir nada.

### Service Worker:
- Cachear en install: `index.html`, todos los `.css`, todos los `.js`,
  los iconos, y las fuentes de Google Fonts.
- Estrategia: Cache First para assets propios, Network First para Google
  Fonts (para que actualicen si cambian).
- Si no hay red y el recurso no está en caché, mostrar el `index.html`
  cacheado (la app funciona offline una vez instalada).

### Content-Security-Policy
`index.html` tiene un `<meta http-equiv="Content-Security-Policy">` que
limita `connect-src` a `'self'` (nada de fetch/XHR a otros orígenes) y
`script-src`/`style-src`/`font-src` a lo mínimo necesario (propio origen
+ Google Fonts). Mitiga el escenario de que un compromiso de la cuenta de
GitHub permita pushear JS malicioso a `main`: aunque se ejecutara, no
podría exfiltrar los datos de `localStorage` a un servidor externo.
Verificado que no rompe: carga de fuentes, registro del service worker,
ni el coloreado del grid de historial vía `el.style.background` en JS
(la CSP no bloquea asignaciones de estilo por CSSOM, solo `<style>`
inyectado y atributos `style=""` en el marcado).

---

## 8. Reglas de código

- **Comentarios:** comentar el propósito de cada función, no la implementación
  obvia. El código es para aprender, así que los comentarios pueden ser
  más verbosos de lo usual.
- **Nombres en español:** variables, funciones, y IDs de elementos HTML que
  correspondan a conceptos del dominio (ej: `guardarCosecha`, `bloqueNoche`,
  `diaActual`) para que el código sea legible sin traducir.
  Nombres técnicos de JS/DOM en inglés como siempre (ej: `addEventListener`,
  `getElementById`).
- **Sin `var`:** usar `const` por defecto, `let` cuando la variable cambia.
- **Sin `!important` en CSS:** si hace falta, es señal de que la especificidad
  está mal estructurada.
- **Accesibilidad mínima:** todos los botones interactivos tienen `aria-label`
  descriptivo. El modal del timer tiene foco atrapado mientras está abierto
  y se cierra con Escape.
- **`console.log` de debug:** está bien durante desarrollo. Antes de dar por
  terminada cualquier feature, limpiar los logs que no sean de error.

---

## 9. Orden de construcción recomendado

**✅ Completo — esto es un registro histórico, no un plan pendiente.**
Se construyó en este orden exacto en una sola sesión. Útil como
referencia si algún día se rehace el proyecto desde cero o se explica a
otra persona cómo se armó.

Construir en este orden permite tener algo funcional lo antes posible:

1. **Esqueleto HTML + CSS base** (tokens, reset, layout de pantalla única,
   nav bar) — resultado: app navegable visualmente aunque sin lógica
2. **`storage.js`** con su API completa y tests manuales en consola
3. **Pantalla Mañana** completa (contenido + marcar como completada + guardar
   victoria)
4. **Timer de respiración** (modal con anillo animado + mantra)
5. **Pantalla Noche** (cosecha + afirmaciones + guardar)
6. **Pantalla Mediodía**
7. **Pantalla Umbral**
8. **Pantalla Historial** (grid de días + racha + detalle al tocar)
9. **PWA** (manifest + service worker + íconos)
10. **Exportar/importar datos**
11. **Pulido visual y mobile QA** (probar en el celular real)

---

## 10. Comandos útiles

**Nota:** esta compu no tiene `node`/`npx`/`npm` instalados. El servidor
de desarrollo real que se usa es `python -m http.server` (Python sí está
instalado). El deploy real es por `git push` a GitHub Pages, no por
`netlify-cli` — ver sección 12.

```bash
# Levantar servidor de desarrollo local
python -m http.server 5050
# (en Windows, con PowerShell, correrlo con Start-Process -WindowStyle
# Hidden para que no bloquee la terminal)

# Ver la app en el celular desde la misma red wifi
# (reemplazar X.X.X.X con la IP local de la compu, ver `ipconfig`)
# http://X.X.X.X:5050
# OJO: sin HTTPS el service worker NO se registra en el celular (los
# navegadores exigen contexto seguro: HTTPS o localhost). Esto sirve
# para ver la UI rápido, pero no para probar instalación/offline real.
# Para eso hace falta la URL de producción (sección 12).
```

---

## 11. Decisiones que no están tomadas todavía (backlog)

Estas features se pueden agregar en iteraciones futuras sin romper la
estructura actual:

- [ ] Notificaciones push programadas (requiere permisos del sistema)
- [ ] Modo claro (light theme con los mismos tokens redefineidos)
- [ ] Sonido de campana tibetana al terminar ciclos de respiración
- [ ] Estadísticas semanales (promedio de bloques por día, bloque más
      completado, etc.)
- [ ] Editor de afirmaciones (para personalizar los textos desde la app)
- [ ] Sincronización entre dispositivos (requeriría un backend mínimo)
- [ ] Internacionalización (la app es en español, pero la estructura
      de i18n puede prepararse)

---

## 12. Despliegue (decisión tomada después de la construcción inicial)

**Dónde vive:**
- Repo: https://github.com/leanvalen/entrenamiento-mental, rama `main`.
- Hosting: GitHub Pages, gratis, sirve directo desde `main` en la raíz
  (`/`), configurado en Settings → Pages del repo.
- URL pública: https://leanvalen.github.io/entrenamiento-mental/

**Por qué GitHub Pages y no Netlify** (que es lo que sugería originalmente
la sección 10): no había `node`/`npx` instalados en la compu, así que
`netlify-cli` no era una opción sin instalar Node primero. GitHub Pages
no necesita nada más que `git push` — ya se usa git en el proyecto.

**Por qué el repo es público y qué se excluyó por eso:**
GitHub Pages gratis solo sirve desde repos públicos (Pages privado
requiere GitHub Pro). Como el código no tiene datos personales del
usuario (esos viven solo en `localStorage` del dispositivo, nunca se
suben), se aceptó que el repo sea público — con la excepción del
`docs/*.docx`, que sí tiene contenido personal de coaching y quedó fuera
vía `.gitignore` (ver sección 3).

**Flujo para publicar un cambio:**
1. Editar el código localmente.
2. `git add` + `git commit` + `git push origin main`.
3. Esperar 1-2 minutos a que el CDN de GitHub Pages propague.
4. El celular del usuario recibe la actualización la próxima vez que abre
   la app con señal (el service worker chequea en segundo plano).

**Riesgo a tener en cuenta — no borrar el repo:**
Aunque la app funciona offline día a día (todo cacheado localmente), el
repo/Pages sigue siendo necesario como "ancla" de la instalación:
si se borra, el próximo chequeo de actualización del navegador puede
encontrar un 404 en `service-worker.js` y desregistrar el service worker,
rompiendo la app instalada sin forma de recuperarla. No borrar el repo
mientras la PWA siga instalada en el celular.

---

*Este archivo debe actualizarse cada vez que se tome una decisión de
arquitectura o diseño que no estaba acá, o cuando cambie algo que estaba
documentado. El CLAUDE.md es la fuente de verdad del proyecto.*
