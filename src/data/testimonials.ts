export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  company: string;
  avatar: string;
}

// Placeholder — reemplazar con testimonios reales de clientes
export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "El sistema que desarrolló redujo nuestro tiempo de gestión de inventario en más de un 40%. Comunicación directa y entregas puntuales.",
    name: "Nombre del cliente",
    role: "Gerente de Operaciones",
    company: "Empresa S.A.",
    avatar: "/images/testimonio-1.jpg",
  },
  {
    quote:
      "La landing page que nos entregó multiplicó nuestras conversiones. Proceso claro de principio a fin.",
    name: "Nombre del cliente",
    role: "Fundador",
    company: "Startup XYZ",
    avatar: "/images/testimonio-2.jpg",
  },
  {
    quote:
      "El software para drones que implementó automatizó por completo nuestras inspecciones. Excelente soporte técnico.",
    name: "Nombre del cliente",
    role: "Director Técnico",
    company: "AgroTech",
    avatar: "/images/testimonio-3.jpg",
  },
];
