export interface Project {
  title: string;
  category: string;
  description: string;
  tags: string[];
  image: string;
  url?: string;
}

export const PROJECTS: Project[] = [
  {
    title: "Sistema de gestión Agraria",
    category: "Aplicación Mobile y Web",
    description: "Aplicación para la gestión de operaciones agrícolas.",
    tags: ["Android", "iOS", "NET Maui"],
    image: "/images/proyecto-mobile.png",
    url: "https://github.com/RodrigoBombieri/agronotes"
  },
  {
    title: "Landing corporativa",
    category: "Landing Page",
    description: "Página institucional de alta conversión con enfoque SEO y performance.",
    tags: ["Astro", "Tailwind CSS", "SEO"],
    image: "/images/proyecto-landing.png",
    url: "https://github.com/RodrigoBombieri/LandingCorporativa"
  },
  {
    title: "Sistema de stock",
    category: "Software de Escritorio",
    description: "Control de inventario con sincronización en la nube.",
    tags: ["C#", ".NET", "SQL Server"],
    image: "/images/proyecto-stock.png",
    url: "https://github.com/RodrigoBombieri/SistemaEscritorio"
  },
  {
    title: "Plataforma web",
    category: "Aplicación Web",
    description: "Panel administrativo con dashboards, roles y APIs para terceros.",
    tags: ["Node.js", "PostgreSQL", "Docker"],
    image: "/images/proyecto-plataforma.jpg",
  },
  {
    title: "Software para drones",
    category: "Drones",
    description: "Planificación de misiones autónomas y procesamiento de datos de sensores.",
    tags: ["Python", "ROS2", "OpenAI"],
    image: "/images/proyecto-drones.jpg",
    url:"https://github.com/RodrigoBombieri/agrotello"
  },
  {
    title: "Web API para Profesionales",
    category: "Desarrollo Web",
    description: "API RESTful para servicios web de alta disponibilidad y rendimiento.",
    tags: [".NET", "API Web", "SQL Server"],
    image: "/images/proyecto-api.png",
    url: "https://github.com/RodrigoBombieri/Profesional.API",
  },
];
