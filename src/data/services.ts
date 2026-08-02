export interface Service {
  icon: string;
  title: string;
  description: string;
  features: string[];
}

export const SERVICES: Service[] = [
  {
    icon: "layout",
    title: "Landing Pages",
    description:
      "Páginas de alto impacto pensadas para convertir visitas en clientes desde el primer segundo.",
    features: ["Diseño moderno", "SEO técnico", "100% responsive", "Optimizadas para conversión"],
  },
  {
    icon: "layers",
    title: "Aplicaciones Web",
    description:
      "Sistemas de gestión, paneles administrativos y APIs robustas que escalan con tu negocio.",
    features: ["Sistemas de gestión", "Paneles administrativos", "APIs REST/GraphQL", "Dashboards en tiempo real"],
  },
  {
    icon: "monitor",
    title: "Aplicaciones de Escritorio",
    description:
      "Software interno construido en C# y .NET, integrado con tus bases de datos y procesos actuales.",
    features: ["Windows nativo", "C# / .NET", "Bases de datos", "Software interno a medida"],
  },
  {
    icon: "drone",
    title: "Software para Drones",
    description:
      "Automatización, sensores e integración de datos para operaciones aéreas inteligentes.",
    features: ["Agricultura", "Inspecciones", "Seguridad", "Procesamiento de datos"],
  },
];
