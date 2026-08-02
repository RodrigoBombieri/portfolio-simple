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
    title: "Sistema de gestión empresarial",
    category: "Aplicación Web",
    description: "ERP interno para gestión de ventas, inventario y reportes en tiempo real.",
    tags: ["Angular", "ASP.NET Core", "SQL Server"],
    image: "/images/proyecto-erp.jpg",
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
    tags: ["Node.js", "Express", "MongoDB"],
    image: "/images/proyecto-api.png",
    url: "https://github.com/RodrigoBombieri/Profesional.API",
  },
];
