export interface ShowroomEmbed {
  /** Ruta pública al .dc.html (colocar el bundle completo en public/mockups/). */
  src: string;
  /** Ancho "de diseño" del mockup en px, usado para escalar el iframe dentro de la card. */
  width: number;
  /** Alto "de diseño" del mockup en px (aproximado — el mockup puede tener scroll interno). */
  height: number;
}

export interface ShowroomItem {
  title: string;
  description: string;
  /**
   * Mockup interactivo en vivo (Claude Design .dc.html embebido por iframe).
   * Si está presente, tiene prioridad sobre `image`.
   */
  embed?: ShowroomEmbed;
  /** Ruta de la imagen estática (public/images/showroom/...). Fallback si no hay `embed`. */
  image?: string;
}

export interface ShowroomCategory {
  id: string;
  label: string;
  icon: string;
  items: ShowroomItem[];
}

// Los mockups en vivo viven en /public/mockups/ — cada .dc.html necesita a su lado
// support.js (runtime compartido) e image-slot.js (helper de zonas de imagen, usado
// por algunos mockups). Ver public/mockups/README.md.
export const SHOWROOM_CATEGORIES: ShowroomCategory[] = [
  {
    id: "web",
    label: "Aplicaciones Web",
    icon: "layers",
    items: [
      {
        title: "Dashboard SaaS",
        description: "Panel de analítica e ingresos recurrentes, cohortes y mezcla de planes en tiempo real.",
        embed: { src: "/mockups/web-1.dc.html", width: 1440, height: 980 },
      },
      {
        title: "Aula Virtual",
        description: "Plataforma de cursos con reproductor de clases, temario y seguimiento de progreso.",
        embed: { src: "/mockups/web-2.dc.html", width: 1440, height: 980 },
      },
      {
        title: "CRM de Ventas",
        description: "Pipeline de oportunidades por etapas, contactos y metas del equipo comercial.",
        embed: { src: "/mockups/web-3.dc.html", width: 1440, height: 1060 },
      },
      {
        title: "Ecommerce",
        description: "Tienda online de producto artesanal, catálogo y ficha de producto con checkout.",
        // El diseño real mide ~1500px de alto (catálogo + ficha + checkout), pero se
        // recorta a 1060 —igual que sus hermanas de esta fila— para que las 4 cards
        // del showroom queden del mismo tamaño. El mockup completo se sigue viendo
        // entero (con scroll) al abrir "Ver interactivo".
        embed: { src: "/mockups/web-4.dc.html", width: 1440, height: 1060 },
      },
    ],
  },
  {
    id: "escritorio",
    label: "Aplicaciones de Escritorio",
    icon: "monitor",
    items: [
      {
        title: "Gestor de Tareas",
        description: "Tablero kanban de tareas por proyecto, con ventanas y arrastre entre columnas.",
        embed: { src: "/mockups/desktop-1.dc.html", width: 1440, height: 980 },
      },
      {
        title: "Punto de Venta",
        description: "Caja registradora con cobro rápido, catálogo de productos y ventas del turno.",
        embed: { src: "/mockups/desktop-2.dc.html", width: 1440, height: 980 },
      },
      {
        title: "Gestor de Inventario / Stock",
        description: "Control de depósito, stock por producto y movimientos de entrada y salida.",
        embed: { src: "/mockups/desktop-3.dc.html", width: 1440, height: 1000 },
      },
      {
        title: "Gestión de Trámites Legales",
        description: "Software para estudios jurídicos: expedientes, clientes y audiencias del staff.",
        embed: { src: "/mockups/desktop-4.dc.html", width: 1440, height: 1000 },
      },
    ],
  },
  {
    id: "mobile",
    label: "Aplicaciones Mobile",
    icon: "mobile",
    items: [
      {
        title: "Delivery / Ecommerce",
        description: "Pedidos con seguimiento de entrega, promos y checkout mobile-first.",
        embed: { src: "/mockups/mobile-1.dc.html", width: 430, height: 950 },
      },
      {
        title: "Billetera Virtual",
        description: "Tarjetas, transferencias y movimientos con estética fintech.",
        embed: { src: "/mockups/mobile-2.dc.html", width: 430, height: 950 },
      },
      {
        title: "Cuaderno de Campo",
        description: "Registro de lotes y parcelas para gestión agropecuaria.",
        embed: { src: "/mockups/mobile-3.dc.html", width: 430, height: 950 },
      },
      {
        title: "App de Turnos / Salud",
        description: "Agenda de turnos médicos con especialidades y disponibilidad horaria.",
        embed: { src: "/mockups/mobile-4.dc.html", width: 430, height: 950 },
      },
    ],
  },
  {
    id: "landing",
    label: "Landing Pages",
    icon: "layout",
    items: [
      { title: "Ejemplo landing 1", description: "Pendiente de carga.", image: "/images/showroom/landing-1.png" },
      { title: "Ejemplo landing 2", description: "Pendiente de carga.", image: "/images/showroom/landing-2.png" },
      { title: "Ejemplo landing 3", description: "Pendiente de carga.", image: "/images/showroom/landing-3.png" },
      { title: "Ejemplo landing 4", description: "Pendiente de carga.", image: "/images/showroom/landing-4.png" },
    ],
  },
];
