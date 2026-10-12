# Prompt — Rediseño visual completo de bombieridev (Astro)

> Copiá todo lo que está debajo de la línea y pegalo en tu asistente de código (Claude Code, Cursor, etc.) abierto en la raíz del repo `portfolio-simple`.

---

## Rol y objetivo

Actuá como un **diseñador de producto senior + desarrollador creativo frontend** con experiencia en WebGL. Vas a rediseñar **por completo la capa visual** de mi sitio (home, `/showroom` y `/portfolio-tecnico`). Es el sitio de mi negocio como desarrollador de software a medida (C#/.NET, Angular, Node), con base en Urdinarrain, Entre Ríos, Argentina.

**Problema actual:** el sitio se ve igual a cualquier portfolio generado con IA: fondo azul marino, acentos azul eléctrico + cian, manchas de luz con blur, grilla con máscara radial, Inter como única fuente, tarjetas de vidrio con glow, badge "Disponible" con punto pulsante y título con una palabra en degradado.

**Objetivo:** una identidad **única, moderna, profesional y memorable**, con un **fondo 3D inmersivo en tiempo real**, que **no sature** y que **no pierda el objetivo del sitio**: que un dueño de PyME me contacte para cotizar (prioridad 1) y que un reclutador técnico perciba nivel de ingeniería (prioridad 2).

## Restricciones (NO negociables)

- **Stack:** se mantiene Astro 5 + Tailwind CSS v4 (CSS-first, `@theme` en `src/styles/global.css`) + GSAP. Se agrega **Three.js** solo para las escenas 3D. No migrar a React/Next ni agregar otro framework de UI.
- **Contenido:** todo el copy vive en `src/data/*.ts`. No borres datos ni cambies la estructura de esos archivos salvo agregar campos nuevos opcionales (ej.: `figure`, `code`). Si proponés copy nuevo, hacelo en `src/data`, nunca hardcodeado en componentes.
- **Respetar:** el flag `SHOW_DRONES` de `src/data/site.ts` (la sección Drones se mantiene), el **toggle claro/oscuro** (script inline anti-flash en `Layout.astro` + `data-theme`), mi **foto** en el hero, SEO/OG/sitemap, Vercel Analytics y el fallback `mailto:` del formulario.
- **Estructura:** mantené la arquitectura `components/sections` + `components/ui`. Podés crear componentes nuevos (ej.: `components/three/`, `components/ui/Annotation.astro`).

## Dirección de arte: "Blueprint vivo"

El concepto: **mi sitio es el plano técnico de un sistema que funciona**. Estética de dibujo de ingeniería/arquitectura de software (cotas, anotaciones, números de figura, cajetín de plano, líneas finas, retículas precisas), combinada con una **escena 3D inmersiva** donde ese sistema está vivo y los datos fluyen. Mensaje implícito: *"no hago solo pantallas, diseño sistemas"*.

Referencias de sensación (no copiar): planos de arquitectura, hojas de especificación técnica, instrumentos de medición con fósforo verde (osciloscopios, radares), documentación de ingeniería de la NASA/JPL, señalética técnica suiza.

### PROHIBIDO (el "look IA" que hay que eliminar)
- Manchas de luz/blobs con `blur` grande, glows difusos y `shadow-glow`.
- Texto con degradado (`.text-gradient`), glassmorphism/`backdrop-blur` decorativo.
- Paleta azul/cian/violeta, Inter como única tipografía.
- Badge con punto pulsante (`animate-ping`), marquee de logos, íconos genéricos dentro de círculos o cuadrados con fondo tenue.
- Grillas de 3 tarjetas idénticas con borde redondeado de 24px y hover que "levanta" la tarjeta.
- Emojis, frases tipo "impulsa tu negocio", "soluciones innovadoras", "llevá tu negocio al siguiente nivel".
- Animación `float` infinita en tarjetas.

## Sistema de diseño

### Color (tokens en `@theme` + override en `html[data-theme="light"]`)

**Oscuro (por defecto) — "pantalla de instrumento":**
| Token | Valor | Uso |
|---|---|---|
| `--color-bg` | `#0A0C0B` | fondo grafito casi negro, con tinte verde mínimo |
| `--color-bg-soft` | `#101412` | secciones alternas |
| `--color-bg-elevated` | `#141916` | paneles |
| `--color-line` | `#26302A` | líneas de plano, bordes 1px |
| `--color-line-soft` | `#1A211D` | retícula fina |
| `--color-ink` | `#E8EDE9` | texto principal (blanco hueso, no puro) |
| `--color-muted` | `#8A968E` | texto secundario |
| `--color-signal` | `#8CFF5A` | **verde fósforo**: acento principal |
| `--color-signal-dim` | `#4FAE34` | acento atenuado, líneas activas |
| `--color-warn` | `#FFB547` | uso mínimo: estado "Beta", alertas |

**Claro — "papel de plano":**
| Token | Valor |
|---|---|
| `--color-bg` | `#F2F1EC` (papel cálido) |
| `--color-bg-soft` | `#E9E8E1` |
| `--color-bg-elevated` | `#FBFAF7` |
| `--color-line` | `#C9C8BF` |
| `--color-line-soft` | `#DEDDD5` |
| `--color-ink` | `#121513` (grafito) |
| `--color-muted` | `#5C625E` |
| `--color-signal` | `#1E7F2E` (verde tinta, contraste AA sobre papel) |
| `--color-signal-dim` | `#3E9A4C` |

Reglas de color:
- El verde es **señal, no decoración**: máximo ~5–8% de la superficie. Se usa en CTA principal, estado activo, datos fluyendo en el 3D, números de figura, foco de teclado.
- Sin degradados de color. La profundidad sale de líneas, capas y del 3D, no de sombras con glow.
- Verificar contraste WCAG AA en ambos temas (texto normal ≥ 4.5:1).

### Tipografía (autohospedada con `@fontsource`, sin Google Fonts runtime)
- **Display/títulos:** `Archivo` variable, usando el eje de ancho expandido (`font-stretch: 112%–125%`), peso 600–800, tracking ajustado (-0.02em). Títulos grandes y contundentes: hero `clamp(2.75rem, 7vw, 6.5rem)`.
- **Texto:** `Archivo` ancho normal, 400/500, 17–18px, interlineado 1.6.
- **Técnica/anotaciones:** `IBM Plex Mono` 400/500, 11–13px, MAYÚSCULAS con tracking +0.08em, para: números de figura (`FIG. 02`), códigos de módulo (`MOD-03`), coordenadas, labels de nodos 3D, metadatos, tags de tecnología.
- Escala tipográfica modular (ratio 1.25) definida como tokens.

### Lenguaje gráfico (el ADN que hace único al sitio)
Crear componentes reutilizables en `components/ui/`:
- **`Annotation`**: línea guía fina (1px) con un punto en un extremo y un label mono en el otro, apuntando a un elemento (ej.: señalando mi foto: "R. BOMBIERI — FULL STACK"; señalando el CTA: "PUNTO DE ENTRADA").
- **`Dimension`** (cota): línea con terminales en forma de tick y una medida o dato en el medio (ej.: `← 4 SEMANAS →` en el proceso, `← 100% A MEDIDA →`).
- **`CornerMarks`**: marcas de corte/esquina en vez de bordes completos y `border-radius`. Radio máximo de 2–4px en todo el sitio.
- **`FigureLabel`**: `FIG. 01 — SERVICIOS` en mono, arriba de cada sección, con numeración consistente en todo el sitio.
- **`TitleBlock`** (cajetín de plano): bloque con celdas tipo tabla con datos (proyecto, autor, escala, fecha, revisión) usado en Navbar y Footer.
- **Retícula de fondo:** grilla fina de 8px con líneas mayores cada 64px, con opacidad muy baja, sólo visible en ciertas secciones (no en toda la página). Sin máscara radial.
- **Íconos:** dibujados como **esquemas de línea** (stroke 1.25px, sin relleno, sin contenedor), coherentes con el estilo plano. Reemplazar los íconos actuales de `src/data/icons.ts` por versiones con trazo fino.

### Movimiento (nivel "equilibrado")
- GSAP + ScrollTrigger. Easing propio: `cubic-bezier(0.2, 0.7, 0.1, 1)`; duraciones 0.5–0.9s.
- Patrón principal: **"dibujarse"**: líneas, cotas y bordes aparecen con `stroke-dashoffset`/`scaleX` al entrar en viewport; el texto entra con un reveal por líneas (máscara), no con fade-up genérico.
- Microinteracciones: hover en links con subrayado que se dibuja; botones con un "tick" de cota que se desplaza; cursor normal (sin cursor custom).
- Nada de animaciones infinitas fuera del 3D.
- `prefers-reduced-motion: reduce` → todo aparece estático, el 3D queda congelado en un frame armado.

## Escena 3D del hero — "Sistema vivo en wireframe"

Componente `src/components/three/SystemScene.astro` + `src/scripts/three/systemScene.ts`.

**Qué muestra:** un diagrama de arquitectura de software en 3D, en wireframe, flotando en el espacio con profundidad real:
- **Nodos** (geometrías simples en wireframe/edges: cubos, cilindros tipo DB, octaedros) que representan: `CLIENTE`, `WEB · ANGULAR`, `API · .NET`, `SQL SERVER`, `SERVICIOS`, `DRONE · SENSORES` (este último solo si `SHOW_DRONES`).
- **Aristas** entre nodos como líneas finas; por ellas viajan **pulsos de datos** (pequeños puntos/segmentos verde fósforo) animados con shader (uniform de tiempo + offset por arista).
- **Labels** en IBM Plex Mono proyectados desde 3D a HTML (overlay posicionado con `Vector3.project`, no texto 3D), con una línea de anotación corta.
- Un **plano de retícula** en perspectiva debajo del sistema que se pierde en la niebla (`FogExp2`) para dar sensación de espacio inmenso.
- Campo sutil de partículas muy chicas (polvo/estrellas) a distintas profundidades para parallax.

**Interacción:**
- **Scroll (ScrollTrigger con `scrub`):** al cargar, el sistema está "despiezado" (nodos dispersos y aristas sin dibujar); a medida que se scrollea el hero, los nodos se acomodan y las aristas se dibujan; al terminar el hero, la cámara hace un dolly lento hacia atrás y la escena queda como fondo atenuado (opacidad ~0.25) detrás de la sección Servicios, luego se pausa.
- **Mouse:** parallax suave de cámara (lerp, máx. ±4°). En touch, no usar giroscopio: solo una deriva lenta automática de la cámara.
- **Hover sobre un nodo** (raycast): el nodo se ilumina en verde, sus aristas aceleran el flujo, y aparece una anotación con una línea de qué hago en esa capa (ej.: API · .NET → "Lógica de negocio, integraciones, seguridad").

**Temas:** la escena lee los tokens CSS (`getComputedStyle`) y se re-colorea al cambiar `data-theme`: en oscuro, líneas hueso + verde fósforo sobre grafito; en claro, líneas grafito + verde tinta sobre papel (como un plano impreso, sin blending aditivo).

**Calidad visual "4K":**
- Nitidez en pantallas de alta densidad: `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))`, antialias activado, líneas con `LineSegments2`/`LineMaterial` (grosor real en px, no limitado a 1px).
- Brillo del fósforo con material aditivo + un bloom muy leve (`UnrealBloomPass` de baja intensidad) **solo en modo oscuro y solo en desktop**.

**Rendimiento (obligatorio):**
- El LCP debe ser el título HTML, **nunca** el canvas. El canvas se monta con import dinámico (`await import("three")`) en `requestIdleCallback` después del primer paint.
- Importar solo los módulos necesarios de Three (tree-shaking). Presupuesto: ≤ 180 KB gzip para el chunk 3D.
- Pausar el render loop con `IntersectionObserver` cuando el hero no es visible y con `visibilitychange`.
- Mobile/gama baja (`navigator.hardwareConcurrency <= 4` o ancho < 768px): menos nodos/partículas, sin bloom, DPR máx. 1.5.
- Fallback sin WebGL / `reduced-motion`: SVG estático del mismo diagrama, dibujado en estilo plano.
- Liberar recursos (`dispose`) al navegar entre páginas (Astro View Transitions si se usan).
- Objetivo: Lighthouse mobile ≥ 90 en Performance, 100 en Accesibilidad.

## Rediseño por sección (home)

1. **Navbar** → franja tipo cajetín: a la izquierda `RB/` + "Rodrigo Bombieri" en mono; links en mono pequeño con número (`01 SERVICIOS`, `02 SHOWROOM`...); badge "BETA" de Drones en `--color-warn` como etiqueta rectangular; toggle de tema como un interruptor técnico (`DÍA / NOCHE` o `PAPEL / PANTALLA`). Al scrollear: fondo sólido con línea inferior de 1px (sin blur).
2. **Hero** → escena 3D de fondo a sangre. Izquierda: `FIG. 00 — SOFTWARE A MEDIDA` + título enorme (proponé 3 opciones de headline en `src/data`, ej.: "Diseño sistemas. Después, las pantallas." / "Software a medida, construido como un plano." / "Tu negocio, convertido en un sistema que funciona."), subtítulo, CTA principal sólido verde ("Cotizar mi proyecto" → WhatsApp/contacto) y secundario como link con flecha. Derecha: **mi foto** dentro de una "ficha técnica" con `CornerMarks`, `Annotation` apuntándola, datos en mono (rol, stack, ubicación con coordenadas `32°41′S 58°53′O`, estado "DISPONIBLE" como texto con un cuadradito verde fijo, sin pulsar). Foto en color natural, con un leve tratamiento duotono solo en modo claro opcional.
3. **Servicios** (`FIG. 01`) → no tarjetas iguales: un **listado de módulos** en filas a todo el ancho (`MOD-01 Landing pages`, `MOD-02 Aplicaciones web`...), cada fila con ícono esquemático, descripción, entregables en mono y una cota a la derecha. Al hover, la fila se "selecciona" (línea verde a la izquierda + el ícono se dibuja de nuevo).
4. **Proceso** (`FIG. 02`) → un **diagrama de flujo/circuito horizontal** (vertical en mobile) donde un trazo verde recorre los pasos al scrollear (scrub). Cada paso es un nodo con número, título y `Dimension` de duración estimada.
5. **Drones** (`FIG. 03`, solo si `SHOW_DRONES`) → panel con **curvas de nivel en SVG** (topografía) y una **ruta de vuelo** punteada que se dibuja al entrar, con waypoints que se corresponden con los casos de uso (Agricultura, Inspecciones...). Etiqueta `BETA / EXPERIMENTAL` en ámbar.
6. **FAQ** (`FIG. 04`) → estilo hoja de especificación: preguntas numeradas `Q.01`, separadores de 1px, `+`/`−` en mono, respuesta que se despliega con altura animada.
7. **CTA / Contacto** (`FIG. 05`) → "Iniciar especificación": formulario como **formulario técnico** (labels en mono arriba, inputs con solo borde inferior, foco verde), y al lado canales directos (WhatsApp destacado, email, GitHub, LinkedIn) como lista con flechas. Mensaje humano y directo, trato conmigo.
8. **Footer** → `TitleBlock` completo: `PROYECTO: bombieridev.com.ar · AUTOR: R. BOMBIERI · ESCALA: 1:1 · REV: 2026.10 · URDINARRAIN, ENTRE RÍOS`, links y copyright. Mini versión estática del diagrama del hero como sello.

## `/showroom`
- Mismo sistema. Encabezado `LÁMINAS — SHOWROOM`.
- Cada demo (los mockups en iframe de `public/mockups/`) es una **lámina**: marco con `CornerMarks`, número de figura, título, tipo (Landing / Web / Desktop / Mobile) y stack en tags mono. Mockups de dispositivo dibujados con líneas finas (no marcos de dispositivo realistas/brillantes).
- Filtros por tipo como pestañas en mono con contador (`WEB [4]`). Transición de filtrado con GSAP Flip.
- Mantener la carga diferida actual de los embeds (`mockupEmbeds.ts`).

## `/portfolio-tecnico`
- Orientado a reclutadores. Cada proyecto como **ficha de ingeniería**: captura, problema → solución, decisiones técnicas, y un **mini diagrama de arquitectura en SVG** (capas Domain/Application/Infra, API, DB) con el mismo lenguaje del hero.
- Stack como tabla de especificación (tecnología · uso · nivel), no como nube de badges.
- Links a GitHub/demo como acciones mono con flecha.
- Opcional: una versión reducida de la escena 3D (menos nodos, sin interacción) en el encabezado, reutilizando el mismo módulo con un parámetro `variant="compact"`.

## Accesibilidad y calidad
- HTML semántico, `aria-hidden` en canvas y decoraciones, labels 3D duplicados en texto accesible.
- Foco de teclado visible: outline 2px `--color-signal` con offset.
- Contraste AA en ambos temas; probar el verde sobre papel.
- Responsive real desde 360px: en mobile el hero prioriza título + CTA; la escena queda detrás, más tenue.
- Sin scroll horizontal; `font-display: swap`; imágenes con `width/height` y `loading="lazy"` fuera del hero.

## Forma de trabajo
1. **Primero** mostrame un plan breve: tokens, componentes nuevos, archivos a modificar, dependencias a instalar (`three`, `@fontsource-variable/archivo`, `@fontsource/ibm-plex-mono`).
2. Implementá en este orden, verificando `npm run build` y `npm run check` en cada fase:
   1. Tokens + tipografía + componentes del lenguaje gráfico (`Annotation`, `Dimension`, `CornerMarks`, `FigureLabel`, `TitleBlock`).
   2. Navbar + Hero (sin 3D) + Footer.
   3. Escena 3D del hero con fallback y optimizaciones.
   4. Resto de secciones de la home.
   5. `/showroom` y `/portfolio-tecnico`.
   6. Pasada de pulido: modo claro, mobile, reduced-motion, Lighthouse.
3. Eliminá estilos/utilidades huérfanas del diseño anterior (`text-gradient`, `shadow-glow`, `bg-grid` con máscara, `animate-float`, `animate-marquee`).
4. Al final, resumí qué cambió y cualquier decisión que tomaste por tu cuenta.

**Criterio de éxito:** si alguien ve una captura del sitio sin el logo, tiene que poder decir "esto es de Rodrigo", no "esto es otro portfolio hecho con IA". Sobrio, preciso, con un único momento "wow" (el sistema 3D vivo), y con el botón de cotizar siempre a mano.
