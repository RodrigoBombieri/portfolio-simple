export interface ProcessStepData {
  number: string;
  title: string;
  description: string;
  icon: string;
}

export const PROCESS_STEPS: ProcessStepData[] = [
  {
    number: "01",
    title: "Reunión",
    description: "Conversamos sobre tu idea, objetivos y restricciones del proyecto.",
    icon: "message",
  },
  {
    number: "02",
    title: "Análisis",
    description: "Defino alcance, arquitectura y una propuesta técnica clara.",
    icon: "search",
  },
  {
    number: "03",
    title: "Desarrollo",
    description: "Construyo el software en iteraciones cortas con avances visibles.",
    icon: "code",
  },
  {
    number: "04",
    title: "Pruebas",
    description: "Validación funcional, de rendimiento y corrección de errores.",
    icon: "check",
  },
  {
    number: "05",
    title: "Entrega",
    description: "Despliegue, documentación y soporte para el arranque en producción.",
    icon: "rocket",
  },
];
