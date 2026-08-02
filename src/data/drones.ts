export interface DroneUseCase {
  icon: string;
  title: string;
  description: string;
}

export const DRONE_USE_CASES: DroneUseCase[] = [
  {
    icon: "leaf",
    title: "Agricultura",
    description: "Monitoreo de cultivos, mapeo NDVI y análisis de rendimiento en tiempo real.",
  },
  {
    icon: "search",
    title: "Inspecciones",
    description: "Inspección de infraestructuras, techos y estructuras de difícil acceso.",
  },
  {
    icon: "shield",
    title: "Seguridad",
    description: "Vigilancia perimetral y detección de eventos con procesamiento en el borde.",
  },
  {
    icon: "cpu",
    title: "Automatización",
    description: "Rutas de vuelo autónomas, misiones programadas y control por software.",
  },
  {
    icon: "radio",
    title: "Integración con sensores",
    description: "Cámaras térmicas, multiespectrales, LiDAR y telemetría en vivo.",
  },
  {
    icon: "chart",
    title: "Procesamiento de datos",
    description: "Pipelines de datos, generación de reportes y modelos con IA aplicada.",
  },
];
