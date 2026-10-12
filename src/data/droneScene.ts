/**
 * Textos y configuración de la página /drones y de su escena 3D
 * ("ruta autónoma simulada"). Los casos de uso salen de DRONE_USE_CASES:
 * acá solo se agregan los datos propios de la escena (sensor, lote, etc.).
 */
import { DRONE_USE_CASES } from "./drones";

export type DroneSensor = "multiespectral" | "camara" | "termica" | "mision" | "lidar" | "enlace";

export interface DroneSceneStep {
  /** Código del punto de control: WP-01 … WP-06 */
  wp: string;
  icon: string;
  title: string;
  description: string;
  sensor: DroneSensor;
  /** Nombre visible del sensor activo en ese tramo */
  sensorLabel: string;
  /** Qué está pasando en la escena en ese punto */
  detail: string;
  /** Lote / objetivo que muestra el HUD */
  lote: string;
  /** Rótulo del elemento del terreno asociado */
  feature: string;
}

export const DRONE_PAGE = {
  meta: {
    title: "Software para drones | Ruta autónoma en 3D — Rodrigo Bombieri",
    description:
      "Software a medida para drones: agricultura con NDVI, inspecciones, seguridad, misiones autónomas, sensores y procesamiento de datos. Recorré una ruta de vuelo simulada en 3D.",
  },
  figure: "03",
  figureLabel: "Software para drones — ruta en 3D",
  title: "Una ruta de vuelo,",
  titleMuted: "seis problemas resueltos.",
  description:
    "Software que conecta drones, sensores y datos para automatizar tareas en el campo, la industria y la seguridad. Abajo hay una ruta autónoma simulada: cada punto de control es un caso de uso.",
  note: "Esta línea está en fase experimental: todavía en desarrollo y ajuste, aún no es un producto 100% disponible. La escena y la telemetría son simuladas.",
  cta: "Contame tu proyecto",
  secondary: "Recorrer la ruta",
  /** Link desde la sección Drones de la home */
  homeLink: "Explorar la ruta en 3D",
  specs: [
    { k: "Puntos de control", v: "06" },
    { k: "Sensores", v: "05" },
    { k: "Datos", v: "Simulados" },
  ],
};

export const DRONE_SCENE_UI = {
  srTitle: "Ruta autónoma simulada: seis puntos de control, uno por caso de uso",
  figure: "03.1",
  figureLabel: "Ruta autónoma — simulada",
  dragHint: "Arrastrá para rotar",
  scrollHint: "Scrolleá para volar",
  pause: "Pausar animación",
  play: "Reanudar animación",
  stepCounter: "Punto",
  sensorPrefix: "Sensor",
  fallbackCaption: "Vista en planta: curvas de nivel, lote NDVI y ruta con seis puntos de control.",
  droneLabel: "UAV-01 · SIM",
  /** Rótulo del dron según el tramo: agrícola (WP-00/01) y de inspección (WP-02 en adelante). */
  droneLabels: { agro: "UAV-01 · Agro · Sim", insp: "UAV-02 · Inspección · Sim" },
};

export const DRONE_SCENE_INTRO = {
  wp: "WP-00",
  title: "Base de despegue",
  description:
    "Una ruta simulada sobre lomadas como las de Entre Ríos. Scrolleá para volar los seis puntos de control: cada uno muestra un caso de uso y el sensor que trabaja ahí.",
  hint: "Arrastrá la escena para rotar la cámara.",
};

const STEP_EXTRA: Omit<DroneSceneStep, "wp" | "icon" | "title" | "description">[] = [
  {
    sensor: "multiespectral",
    sensorLabel: "Cámara multiespectral",
    detail: "Lote 07 con índice NDVI por celda: verde es vigor alto, ámbar es una zona para revisar.",
    lote: "L-07 · Soja",
    feature: "Lote 07 · NDVI",
  },
  {
    sensor: "camara",
    sensorLabel: "Cámara RGB con zoom",
    detail: "Barrido de silos y techos sin subir a nadie: cada toma queda georreferenciada.",
    lote: "Planta de acopio",
    feature: "Silos · acopio",
  },
  {
    sensor: "termica",
    sensorLabel: "Cámara térmica",
    detail: "Recorrido perimetral. Un evento fuera de patrón se marca como alerta en ámbar.",
    lote: "Perímetro P-2",
    feature: "Perímetro",
  },
  {
    sensor: "mision",
    sensorLabel: "Plan de vuelo autónomo",
    detail: "La misión se programa una vez y se repite: mismo recorrido, mismos horarios, sin piloto pendiente.",
    lote: "Misión M-12",
    feature: "Misión M-12",
  },
  {
    sensor: "lidar",
    sensorLabel: "LiDAR + telemetría",
    detail: "Nube de puntos del terreno y lecturas de sensores en vivo, sincronizadas por tiempo y posición.",
    lote: "Relevamiento R-3",
    feature: "LiDAR",
  },
  {
    sensor: "enlace",
    sensorLabel: "Enlace de datos",
    detail: "Los datos bajan a la estación, se procesan y salen como reporte o alerta, no como una carpeta de fotos.",
    lote: "Estación base",
    feature: "Estación",
  },
];

export const DRONE_SCENE_STEPS: DroneSceneStep[] = DRONE_USE_CASES.map((useCase, i) => ({
  wp: `WP-${String(i + 1).padStart(2, "0")}`,
  icon: useCase.icon,
  title: useCase.title,
  description: useCase.description,
  ...STEP_EXTRA[i % STEP_EXTRA.length],
}));

export const DRONE_HUD = {
  title: "Telemetría",
  simulated: "Simulado",
  fields: {
    alt: "Altitud",
    vel: "Velocidad",
    bat: "Batería",
    pos: "Posición",
    lote: "Lote",
    sensor: "Sensor",
    link: "Enlace",
  },
  units: { alt: "m", vel: "m/s", bat: "%", link: "%" },
  base: "En base",
};

export const DRONE_LEGEND = {
  title: "Referencias",
  active: "WP activo",
  sensor: "Sensor",
  items: [
    { key: "plan", label: "Ruta planificada" },
    { key: "done", label: "Tramo volado" },
    { key: "ndvi-high", label: "NDVI alto" },
    { key: "ndvi-low", label: "Alerta / NDVI bajo" },
  ],
};

/**
 * Mundo de la escena (unidades arbitrarias, 1 u ≈ 10 m). Plano XZ, terreno de
 * TERRAIN_SIZE de lado centrado en el origen. `yaw` es el ángulo de cámara
 * sugerido al llegar a cada punto (radianes).
 */
export const DRONE_WORLD = {
  base: { x: -38, z: 26, yaw: 0.35 },
  waypoints: [
    { x: -18, z: 8, yaw: 0.2 },
    { x: -6, z: -16, yaw: -0.35 },
    { x: 15, z: -8, yaw: -0.8 },
    { x: 27, z: 13, yaw: -1.25 },
    { x: 8, z: 30, yaw: -1.9 },
    { x: -14, z: 40, yaw: -2.35 },
  ],
  altitude: 7,
  lot: { x: -28, z: 17, w: 20, d: 14, nx: 12, nz: 8 },
  silos: { x: -3, z: -21 },
  perimeter: { x: 19, z: -5, w: 11, d: 8 },
  mission: { x: 30, z: 18, w: 12, d: 9, lanes: 7 },
  lidar: { x: 8, z: 30 },
  // abajo a la izquierda del dron en WP-06, dentro del encuadre de la cámara
  station: { x: -16, z: 34 },
};
