export interface Advantage {
  icon: string;
  title: string;
  description: string;
}

// Ventajas diferenciales — evitar solapar con lo ya cubierto en Servicios/Drones
// (código limpio, escalabilidad y automatización ya se explican ahí).
export const ADVANTAGES: Advantage[] = [
  {
    icon: "message",
    title: "Comunicación directa",
    description: "Trato directo conmigo, sin intermediarios ni capas de gestión.",
  },
  {
    icon: "layers",
    title: "Código limpio y escalable",
    description: "Arquitectura moderna, documentada y pensada para crecer sin reescribir desde cero.",
  },
  {
    icon: "life-buoy",
    title: "Soporte post-entrega",
    description: "Acompañamiento para resolver incidencias y evolucionar el producto.",
  },
  {
    icon: "shield",
    title: "Seguridad y buenas prácticas",
    description: "Protección de datos y cumplimiento de normativas de privacidad.",
  },
];
