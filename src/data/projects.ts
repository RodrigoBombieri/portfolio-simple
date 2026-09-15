import { SHOW_DRONES } from "./site";

export interface Project {
  title: string;
  category: string;
  description: string;
  tags: string[];
  image: string;
  url?: string;
  /** Marca el proyecto como en fase experimental (aún no 100% disponible). */
  experimental?: boolean;
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
    title: "Control de Vencimientos",
    category: "Aplicación Web",
    description: "Control de vencimientos de servicios y trámites con notificaciones automáticas.",
    tags: ["C#", "SQL Server", ".NET MVC"],
    image: "/images/proyecto-vencimientos.png",
    url: "https://github.com/RodrigoBombieri/ControlVencimientos"
  },
  ...(SHOW_DRONES ? [{
    title: "Software para drones",
    category: "Drones",
    description: "Planificación de misiones autónomas y procesamiento de datos de sensores.",
    tags: ["Python", "ROS2", "OpenAI"],
    image: "/images/proyecto-drones.jpg",
    url:"https://github.com/RodrigoBombieri/agrotello",
    experimental: true
  }] : []),
  {
    title: "Web API para Profesionales",
    category: "Desarrollo Web",
    description: "API RESTful para servicios web de alta disponibilidad y rendimiento.",
    tags: [".NET", "API Web", "SQL Server"],
    image: "/images/proyecto-api.png",
    url: "https://github.com/RodrigoBombieri/Profesional.API",
  },
];
