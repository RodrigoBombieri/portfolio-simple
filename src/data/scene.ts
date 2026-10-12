import { SHOW_DRONES } from "./site";

/**
 * Datos de la escena 3D del hero ("Sistema vivo en wireframe").
 * Las posiciones son coordenadas del sistema ARMADO (unidades de mundo);
 * el script calcula el estado "despiezado" a partir de ellas.
 */
export type SceneShape = "cube" | "screen" | "core" | "db" | "service" | "drone";

export interface SceneNode {
  id: string;
  /** Label técnico (mono, mayúsculas) que se proyecta sobre el nodo. */
  label: string;
  /** Anotación breve que aparece al hover: qué hago en esa capa. */
  note: string;
  shape: SceneShape;
  position: [number, number, number];
  /** Tamaño de referencia del nodo (unidades de mundo). */
  size: number;
  /** Nodo central / acento (se dibuja en verde señal). */
  accent?: boolean;
  /** Se omite en mobile / gama baja para aliviar la escena. */
  optional?: boolean;
}

export interface SceneEdge {
  from: string;
  to: string;
}

const ALL_NODES: SceneNode[] = [
  {
    id: "cliente",
    label: "Cliente",
    note: "Tu cliente: navegador, celular o mostrador.",
    shape: "cube",
    position: [-4.4, 0.9, 0.6],
    size: 1.0,
  },
  {
    id: "web",
    label: "Web · Angular",
    note: "Interfaces claras, rápidas y responsive.",
    shape: "screen",
    position: [-1.5, 2.1, -0.8],
    size: 1.2,
  },
  {
    id: "api",
    label: "API · .NET",
    note: "Lógica de negocio, integraciones, seguridad.",
    shape: "core",
    position: [0.9, 0.2, 0.3],
    size: 1.25,
    accent: true,
  },
  {
    id: "sql",
    label: "SQL Server",
    note: "Datos ordenados, consistentes y respaldados.",
    shape: "db",
    position: [-0.6, -2.2, -0.9],
    size: 1.0,
  },
  {
    id: "servicios",
    label: "Servicios",
    note: "Pagos, facturación, email y APIs de terceros.",
    shape: "service",
    position: [4.0, 1.7, -1.3],
    size: 0.95,
  },
  {
    id: "drone",
    label: "Drone · Sensores",
    note: "Telemetría, mapas y datos de campo.",
    shape: "drone",
    position: [3.7, -1.9, 1.0],
    size: 1.0,
    optional: true,
  },
];

const ALL_EDGES: SceneEdge[] = [
  { from: "cliente", to: "web" },
  { from: "web", to: "api" },
  { from: "api", to: "sql" },
  { from: "api", to: "servicios" },
  { from: "cliente", to: "api" },
  { from: "drone", to: "api" },
];

export const SCENE_NODES: SceneNode[] = ALL_NODES.filter((n) => SHOW_DRONES || n.id !== "drone");

export const SCENE_EDGES: SceneEdge[] = ALL_EDGES.filter((e) =>
  SCENE_NODES.some((n) => n.id === e.from) && SCENE_NODES.some((n) => n.id === e.to)
);

export const SCENE_COPY = {
  /** Texto accesible equivalente a la escena (lista visualmente oculta). */
  srTitle: "Diagrama del sistema que construyo, capa por capa:",
  /** Etiqueta del diagrama de respaldo (sin WebGL / movimiento reducido). */
  fallbackLabel: "FIG. 00-A — Sistema en operación",
};
