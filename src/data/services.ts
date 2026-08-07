export interface Service {
  icon: string;
  title: string;
  problem: string;
  description: string;
  features: string[];
}

export const SERVICES: Service[] = [
  {
    icon: "layout",
    title: "Landing Pages",
    problem: "¿Tenés visitas pero casi nadie te contacta o compra?",
    description:
      "Diseño páginas de alto impacto, rápidas y pensadas para convertir cada visita en una consulta o venta.",
    features: ["Diseño moderno", "SEO técnico", "100% responsive", "Optimizadas para conversión"],
  },
  {
    icon: "layers",
    title: "Aplicaciones Web",
    problem: "¿Planillas, WhatsApp y procesos manuales te hacen perder tiempo y datos?",
    description:
      "Desarrollo sistemas de gestión, paneles administrativos y APIs a medida que ordenan tu operación y escalan con tu negocio.",
    features: ["Sistemas de gestión", "Paneles administrativos", "APIs REST/GraphQL", "Dashboards en tiempo real"],
  },
  {
    icon: "monitor",
    title: "Aplicaciones de Escritorio",
    problem: "¿Tu operación depende de software viejo que ya no se banca tus procesos?",
    description:
      "Construyo software interno en C# y .NET, integrado con tus bases de datos y procesos actuales, sin depender de internet.",
    features: ["Windows nativo", "C# / .NET", "Bases de datos", "Software interno a medida"],
  },
  {
    icon: "drone",
    title: "Software para Drones",
    problem: "¿Necesitás cubrir grandes superficies sin duplicar personal en campo?",
    description:
      "Desarrollo software de automatización, sensores e integración de datos para operaciones aéreas inteligentes.",
    features: ["Agricultura", "Inspecciones", "Seguridad", "Procesamiento de datos"],
  },
];
