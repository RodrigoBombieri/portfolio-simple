export interface FaqEntry {
  question: string;
  answer: string;
}

// Revisá las respuestas de pago y plazos: son un punto de partida razonable,
// pero solo vos sabés tus condiciones exactas — ajustalas antes de publicar.
export const FAQS: FaqEntry[] = [
  {
    question: "¿Cómo es la modalidad de pago?",
    answer:
      "Trabajo con un anticipo para reservar el proyecto y comenzar el desarrollo, y el resto se abona contra la entrega. En proyectos más grandes, dividimos el pago por hitos o entregas parciales.",
  },
  {
    question: "¿Cuánto tiempo lleva desarrollar un proyecto?",
    answer:
      "Depende del alcance: una landing page suele estar lista en 1-2 días, mientras que una aplicación web o sistema de gestión puede llevar entre 2 y 3 semanas. En la etapa de análisis te doy un plazo concreto antes de arrancar.",
  },
  {
    question: "¿Incluye hosting o mantenimiento?",
    answer:
      "El desarrollo no incluye hosting por defecto, pero te ayudo a elegir y configurar el que mejor se adapte a tu proyecto. Para el mantenimiento y soporte post-entrega ofrezco planes aparte según cuánto acompañamiento necesites.",
  },
  {
    question: "¿Trabajás con clientes fuera de Argentina?",
    answer:
      "Sí, trabajo de forma remota con clientes de toda Latinoamérica. La comunicación es 100% online (videollamada, email o WhatsApp) y no representa ningún problema para el desarrollo del proyecto.",
  },
];
