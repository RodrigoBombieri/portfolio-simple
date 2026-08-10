export interface ProcessStepData {
  number: string;
  title: string;
  description: string;
  icon: string;
  /** Ventaja diferencial asociada a este paso (ex sección "Por qué elegirme", fusionada acá). */
  advantage?: string;
}

export const PROCESS_STEPS: ProcessStepData[] = [
  {
    number: "01",
    title: "Reunión",
    description: "Conversamos sobre tu idea, objetivos, alcances y restricciones.",
    icon: "message",
    advantage: "Comunicación directa",
  },
  {
    number: "02",
    title: "Análisis",
    description: "Defino alcance, arquitectura y una propuesta técnica clara para tu proyecto.",
    icon: "search",
    advantage: "Planificación y claridad",
  },
  {
    number: "03",
    title: "Desarrollo",
    description: "Construyo el software en iteraciones cortas con avances visibles.",
    icon: "code",
    advantage: "Código limpio y escalable",
  },
  {
    number: "04",
    title: "Pruebas",
    description: "Validación funcional, de rendimiento y corrección de errores.",
    icon: "check",
    advantage: "Seguridad y buenas prácticas",
  },
  {
    number: "05",
    title: "Entrega",
    description: "Despliegue, documentación y soporte para el arranque en producción.",
    icon: "rocket",
    advantage: "Soporte post-entrega",
  },
];
