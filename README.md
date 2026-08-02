# dev-landing-astro

Landing page premium para servicios de desarrollo de software. Construida con **Astro 5**, **Tailwind CSS v4** (CSS-first) y **GSAP** para animaciones.

## Requisitos

- Node.js 18.17+ (recomendado 20+)
- npm 10+

## Puesta en marcha

```bash
npm install
npm run dev
```

Abre `http://localhost:4321`.

## Scripts

| Comando           | Descripción                              |
| ------------------ | ----------------------------------------- |
| `npm run dev`       | Servidor de desarrollo con hot reload     |
| `npm run build`     | Build de producción en `dist/`            |
| `npm run preview`   | Sirve el build de producción localmente   |
| `npm run check`     | Chequeo de tipos con `astro check`        |

## Configuración antes de publicar

1. **Dominio**: cambia `SITE_URL` en `astro.config.mjs` (afecta `sitemap.xml`, canonical y OG tags).
2. **Contacto**: copia `.env.example` a `.env` y completa `PUBLIC_CONTACT_EMAIL`, `PUBLIC_WHATSAPP_NUMBER`, `PUBLIC_GITHUB_URL`, `PUBLIC_LINKEDIN_URL`. Si tienes un backend de formularios (Formspree, Resend, etc.) agrega `PUBLIC_FORM_ENDPOINT`; si lo dejas vacío, el formulario cae a un `mailto:` como respaldo.
3. **Contenido**: todo el copy vive en `src/data/*.ts` (servicios, proyectos, testimonios, tecnologías, ventajas, proceso). Edita ahí, no en los componentes.
4. **Imágenes**: coloca capturas reales en `public/images/` siguiendo `public/images/README.md`. Mientras no existan, las tarjetas ocultan la imagen rota automáticamente.
5. **OG image**: `public/og-image.svg` es un placeholder generado; reemplázalo por un PNG/JPG de 1200×630 si quieres una vista previa con diseño fijo en redes sociales.

## Estructura

```
dev-landing-astro/
├── astro.config.mjs               # Config de Astro: sitemap, plugin de Tailwind v4, prefetch
├── package.json                   # Dependencias y scripts (dev, build, preview, check)
├── tsconfig.json                  # TypeScript strict + alias de imports (@/, @components/, etc.)
├── .env.example                   # Plantilla de variables de entorno (copiar a .env)
├── .env                           # Tus variables reales — NO se sube a git (ver .gitignore)
├── .gitignore
├── README.md
│
├── public/                        # Archivos estáticos servidos tal cual, sin procesar
│   ├── favicon.svg                # Ícono del sitio
│   ├── og-image.svg               # Imagen para Open Graph / Twitter Cards (placeholder)
│   ├── robots.txt                 # Reglas para crawlers + referencia al sitemap
│   └── images/                    # Capturas de proyectos y avatares de testimonios
│       └── README.md              # Qué archivos poner y con qué nombre exacto
│
└── src/
    ├── env.d.ts                   # Tipado de las variables PUBLIC_* de .env para TypeScript
    │
    ├── pages/
    │   └── index.astro            # Única página: ensambla todas las secciones en orden
    │
    ├── layouts/
    │   └── Layout.astro           # <head> global: meta tags, Open Graph, Twitter, JSON-LD, fuentes
    │
    ├── styles/
    │   └── global.css             # Tema de Tailwind v4 (@theme): colores, sombras, animaciones,
    │                               # clases utilitarias propias (.glass-card, .text-gradient, etc.)
    │
    ├── data/                      # Todo el CONTENIDO de la landing, separado del diseño.
    │   │                          # Para cambiar textos, precios, links, etc. se edita SOLO acá.
    │   ├── site.ts                 # Datos globales: email, WhatsApp, GitHub, LinkedIn, nav links
    │   ├── icons.ts                 # Set de iconos SVG (paths) usados por Icon.astro
    │   ├── services.ts              # Las 4 tarjetas de "Servicios"
    │   ├── drones.ts                # Los 6 casos de uso de la sección "Drones"
    │   ├── whyChoose.ts             # Las 7 ventajas de "Por qué elegirme"
    │   ├── process.ts               # Los 5 pasos de "Cómo trabajo"
    │   ├── tech.ts                  # Las tecnologías del marquee (stack)
    │   ├── projects.ts              # Las tarjetas de "Proyectos" (título, tags, imagen)
    │   └── testimonials.ts          # Los testimonios (placeholder — reemplazar por reales)
    │
    ├── components/
    │   ├── ui/                    # Componentes reutilizables y sin contenido propio (reciben props)
    │   │   ├── Icon.astro           # Renderiza un ícono de icons.ts como <svg>
    │   │   ├── Button.astro         # Botón con variantes primary/secondary/ghost y tamaños
    │   │   ├── SectionHeader.astro  # Eyebrow + título + descripción, reutilizado en cada sección
    │   │   ├── ServiceCard.astro    # Tarjeta de servicio (usa un item de services.ts)
    │   │   ├── ProjectCard.astro    # Tarjeta de proyecto con imagen y hover (usa projects.ts)
    │   │   ├── TestimonialCard.astro# Tarjeta de testimonio con estrellas (usa testimonials.ts)
    │   │   ├── TechBadge.astro      # Chip de tecnología del marquee (usa tech.ts)
    │   │   └── ProcessStep.astro    # Paso individual de la línea de tiempo (usa process.ts)
    │   │
    │   └── sections/               # Secciones completas de la página (una por bloque visual)
    │       ├── Navbar.astro         # Header fijo, menú móvil, botón CTA
    │       ├── Hero.astro           # Título principal, subtítulo, botones y mockup animado
    │       ├── Services.astro       # Grilla de ServiceCard
    │       ├── Drones.astro         # Bloque destacado con ilustración SVG de dron + casos de uso
    │       ├── WhyChoose.astro      # Grilla de ventajas
    │       ├── Process.astro        # Línea de tiempo de 5 pasos
    │       ├── Technologies.astro   # Marquee infinito de TechBadge
    │       ├── Projects.astro       # Grilla de ProjectCard
    │       ├── Testimonials.astro   # Grilla de TestimonialCard
    │       ├── CTA.astro            # CTA final + formulario de contacto (id="contacto")
    │       └── Footer.astro         # Redes sociales, nav, copyright
    │
    └── scripts/                   # JavaScript/TypeScript del cliente (se cargan desde Layout.astro)
        ├── main.ts                 # Punto de entrada: inicializa menú móvil, formulario, scroll y animaciones
        ├── animations.ts           # GSAP + ScrollTrigger: reveal de [data-animate], navbar on scroll, timeline
        └── smoothScroll.ts         # Scroll suave hacia anchors (#servicios, #contacto, etc.) con offset del navbar
```

### Cómo moverse por el proyecto

- **¿Quiero cambiar un texto, precio o link?** → `src/data/*.ts`. No toques los `.astro` de `components/` para esto.
- **¿Quiero agregar/quitar un proyecto, servicio o testimonio?** → agregá o borrá un objeto del array correspondiente en `src/data/`; la sección se re-renderiza sola (usan `.map()`).
- **¿Quiero cambiar colores, tipografía o espaciados?** → `src/styles/global.css`, bloque `@theme` (son tokens de Tailwind v4, no hay `tailwind.config.js`).
- **¿Quiero cambiar el orden de las secciones?** → `src/pages/index.astro`, reordená las etiquetas dentro de `<main>`.
- **¿Quiero editar el layout visual de una sección** (no el contenido)? → el `.astro` correspondiente en `src/components/sections/`.
- **¿Quiero editar una tarjeta/botón que se repite en varias secciones?** → el componente en `src/components/ui/`, afecta a todas sus instancias.
- **¿Quiero cambiar una animación?** → `src/scripts/animations.ts` (GSAP) o las utilidades CSS en `global.css` (`animate-float`, `animate-marquee`, etc.).

## Despliegue

### Vercel
```bash
npm i -g vercel
vercel
```
Astro detecta automáticamente el preset estático; no requiere configuración adicional para este proyecto (sin SSR).

### Cloudflare Pages
- Build command: `npm run build`
- Output directory: `dist`

## Notas técnicas

- **Tailwind v4** se configura vía `@theme` en `src/styles/global.css` (sin `tailwind.config.js`).
- **Alias de imports**: `@/`, `@components/`, `@layouts/`, `@data/`, `@scripts/`, `@styles/` (ver `tsconfig.json`).
- **Accesibilidad**: skip-link, `focus-visible`, `prefers-reduced-motion` respetado en CSS y en `animations.ts`.
- **Rendimiento**: imágenes con `loading="lazy"`, `prefetch` en viewport, CSS crítico inline vía Astro, sin JS de frameworks pesados (solo GSAP + vanilla TS).
- **SEO**: `@astrojs/sitemap` genera `sitemap-index.xml` automáticamente en el build; `robots.txt` ya lo referencia.
