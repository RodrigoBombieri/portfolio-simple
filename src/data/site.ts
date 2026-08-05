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

export const NAV_LINKS = [
  { label: "Servicios", href: "#servicios" },
  { label: "Drones", href: "#drones" },
  { label: "Por qué elegirme", href: "#por-que-elegirme" },
  { label: "Proceso", href: "#proceso" },
  { label: "Proyectos", href: "#proyectos" },
  { label: "Contacto", href: "#contacto" },
];
