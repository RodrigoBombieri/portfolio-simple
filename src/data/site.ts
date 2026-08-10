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

// Los links con "#" apuntan siempre a secciones de la home ("/#seccion"),
// así funcionan tanto parados en la home (scroll suave) como desde páginas
// separadas como /showroom o /portfolio-tecnico (navegan a la home y saltan
// a la sección). Ver src/scripts/smoothScroll.ts.
export const NAV_LINKS = [
  { label: "Servicios", href: "/#servicios" },
  { label: "Showroom", href: "/showroom" },
  { label: "Cómo trabajo", href: "/#proceso" },
  { label: "Drones", href: "/#drones" },
  { label: "FAQ", href: "/#faq" },
  { label: "Portfolio técnico", href: "/portfolio-tecnico" },
  { label: "Contacto", href: "/#contacto" },
];
