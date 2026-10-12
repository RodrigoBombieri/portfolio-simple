// Datos globales del sitio. En producción, sobreescribe con variables PUBLIC_* en .env
export const SITE = {
  name: "Rodrigo — Software a Medida",
  role: "Desarrollador de Software",
  email: import.meta.env.PUBLIC_CONTACT_EMAIL || "rodrigosbombieri@gmail.com",
  whatsapp: import.meta.env.PUBLIC_WHATSAPP_NUMBER || "5493446523423",
  github: import.meta.env.PUBLIC_GITHUB_URL || "https://github.com/RodrigoBombieri",
  linkedin: import.meta.env.PUBLIC_LINKEDIN_URL || "https://www.linkedin.com/in/rodrigobombieri-dev/",
  formEndpoint: import.meta.env.PUBLIC_FORM_ENDPOINT || "",
};

export const WHATSAPP_LINK = `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(
  "Hola! Quiero pedir un presupuesto para un proyecto de software."
)}`;

// Flag para ocultar temporalmente todo el contenido relacionado a "Drones"
// (nav, proyecto, servicio, sección dedicada, opción del form y SEO) sin
// borrar nada. Para volver a mostrarlo, cambiar a true.
export const SHOW_DRONES = true;

export interface NavLink {
  label: string;
  href: string;
  /** Etiqueta corta opcional (ej. "Beta") para marcar contenido en prueba. */
  badge?: string;
}

// Los links con "#" apuntan siempre a secciones de la home ("/#seccion"),
// así funcionan tanto parados en la home (scroll suave) como desde páginas
// separadas como /showroom o /portfolio-tecnico (navegan a la home y saltan
// a la sección). Ver src/scripts/smoothScroll.ts.
export const NAV_LINKS: NavLink[] = [
  { label: "Servicios", href: "/#servicios" },
  { label: "Showroom", href: "/showroom" },
  { label: "Cómo trabajo", href: "/#proceso" },
  ...(SHOW_DRONES ? [{ label: "Drones", href: "/drones", badge: "Beta" }] : []),
  { label: "FAQ", href: "/#faq" },
  { label: "Portfolio técnico", href: "/portfolio-tecnico" },
  { label: "Contacto", href: "/#contacto" },
];

/**
 * Titulares candidatos del hero. Se muestra el de `HERO.headlineIndex`; cada
 * entrada es una lista de líneas (se renderizan con salto de línea suave).
 */
export const HERO_HEADLINES: string[][] = [
  ["Desarrollo software que", "impulsa tu negocio."],
  ["Diseño sistemas.", "Después, las pantallas."],
  ["Software a medida,", "construido como un plano."],
  ["Tu negocio, convertido en", "un sistema que funciona."],
];

export const HERO = {
  headlineIndex: 0,
  figure: "00",
  figureLabel: "Software a medida",
  description: SHOW_DRONES
    ? "Landing pages, aplicaciones web, software empresarial y soluciones para drones desarrolladas a medida, pensadas para ahorrarte tiempo, dinero y tareas repetitivas."
    : "Landing pages, aplicaciones web y software empresarial desarrollados a medida, pensados para ahorrarte tiempo, dinero y tareas repetitivas.",
  checks: ["Código limpio y escalable", "Comunicación directa"],
  card: {
    file: "Ficha 001 / Personal",
    name: "Rodrigo Bombieri",
    annotation: "R. Bombieri — Full Stack",
    bio: "Diseño y desarrollo software a medida, desde landing pages hasta sistemas empresariales completos. Trato directo conmigo en cada etapa, sin intermediarios ni equipos de por medio.",
    stack: ["C# / .NET", "Angular", "Node.js"],
    base: "Urdinarrain, Entre Ríos",
    coords: "32°41′S 58°53′O",
    status: "Disponible",
  },
};

export const TITLE_BLOCK = {
  project: "bombieridev.com.ar",
  author: "R. Bombieri",
  scale: "1:1",
  rev: "2026.10",
  place: "Urdinarrain, Entre Ríos",
};
