export interface ShowroomItem {
  title: string;
  description: string;
  /** Ruta de la imagen (public/images/showroom/...). Colocar el PNG en esa ruta para que aparezca. */
  image: string;
}

export interface ShowroomCategory {
  id: string;
  label: string;
  icon: string;
  items: ShowroomItem[];
}

// Contenido placeholder: reemplazar título, descripción e imagen de cada item
// a medida que se cargan los ejemplos reales. Las rutas de imagen ya están
// listas — solo hace falta colocar el PNG correspondiente en public/images/showroom/.
export const SHOWROOM_CATEGORIES: ShowroomCategory[] = [
  {
    id: "web",
    label: "Aplicaciones Web",
    icon: "layers",
    items: [
      { title: "Ejemplo web 1", description: "Pendiente de carga.", image: "/images/showroom/web-1.png" },
      { title: "Ejemplo web 2", description: "Pendiente de carga.", image: "/images/showroom/web-2.png" },
      { title: "Ejemplo web 3", description: "Pendiente de carga.", image: "/images/showroom/web-3.png" },
      { title: "Ejemplo web 4", description: "Pendiente de carga.", image: "/images/showroom/web-4.png" },
    ],
  },
  {
    id: "escritorio",
    label: "Aplicaciones de Escritorio",
    icon: "monitor",
    items: [
      { title: "Ejemplo escritorio 1", description: "Pendiente de carga.", image: "/images/showroom/escritorio-1.png" },
      { title: "Ejemplo escritorio 2", description: "Pendiente de carga.", image: "/images/showroom/escritorio-2.png" },
      { title: "Ejemplo escritorio 3", description: "Pendiente de carga.", image: "/images/showroom/escritorio-3.png" },
      { title: "Ejemplo escritorio 4", description: "Pendiente de carga.", image: "/images/showroom/escritorio-4.png" },
    ],
  },
  {
    id: "mobile",
    label: "Aplicaciones Mobile",
    icon: "mobile",
    items: [
      { title: "Ejemplo mobile 1", description: "Pendiente de carga.", image: "/images/showroom/mobile-1.png" },
      { title: "Ejemplo mobile 2", description: "Pendiente de carga.", image: "/images/showroom/mobile-2.png" },
      { title: "Ejemplo mobile 3", description: "Pendiente de carga.", image: "/images/showroom/mobile-3.png" },
      { title: "Ejemplo mobile 4", description: "Pendiente de carga.", image: "/images/showroom/mobile-4.png" },
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
