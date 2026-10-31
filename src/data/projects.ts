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
  /** Opcionales: se muestran en la ficha técnica solo si están completos. */
  problem?: string;
  solution?: string;
  decisions?: string[];
}

export const PROJECTS: Project[] = [
  {
    title: "Control de Balanza y Cartas de Porte",
    category: "Aplicación Web",
    description: "Recepción de camiones de granos en acopios: lectura de la Carta de Porte por QR, PDF u OCR local (sin internet), pesaje de entrada y salida con control de diferencias y flujo por roles.",
    tags: ["C#", ".NET 10", "ASP.NET Core MVC", "Angular", "SQL Server", "EF Core"],
    image: "/images/proyecto-balanza.png",
    url: "https://github.com/RodrigoBombieri/AgroSoluciones"
  },
  {
    title: "Control de Vencimientos",
    category: "Aplicación Web",
    description: "Control de vencimientos de servicios y trámites con notificaciones automáticas.",
    tags: ["C#", "SQL Server", ".NET MVC"],
    image: "/images/proyecto-vencimientos.png",
    url: "https://github.com/RodrigoBombieri/ControlVencimientos"
  },
  {
    title: "Web API para Profesionales",
    category: "Desarrollo Web",
    description: "API RESTful para servicios web de alta disponibilidad y rendimiento.",
    tags: [".NET", "API Web", "SQL Server"],
    image: "/images/proyecto-api.png",
    url: "https://github.com/RodrigoBombieri/Profesional.API",
  },
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
  ...(SHOW_DRONES ? [{
    title: "Software para drones",
    category: "Drones",
    description: "Planificación de misiones autónomas y procesamiento de datos de sensores.",
    tags: ["Python", "PX4 SITL", "MAVSDK", "FastAPI", "Sentinel-2 vía STAC", "rasterio", "Shapely", "Leaflet"],
    image: "/images/proyecto-drones.png",
    url:"https://github.com/RodrigoBombieri/agrotello",
    experimental: true
  }] : []),
];
