/**
 * Modelos "realistas en estilo plano" de la escena de /drones: geometría con
 * la forma de los objetos reales (dron agrícola, dron de inspección, planta
 * de acopio, galpón parabólico, estación de radar), renderizada con
 * superficies sólidas de luz suave + bordes marcados, para que conviva con el
 * terreno en wireframe. Todo procedural: no se descarga ningún modelo.
 *
 * Cada pieza se acumula por material y al final se fusiona en un único Mesh
 * (+ sus bordes duros con EdgesGeometry) para mantener pocas draw calls.
 */
import {
  BoxGeometry,
  BufferGeometry,
  CircleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  EdgesGeometry,
  Euler,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  HemisphereLight,
  LatheGeometry,
  LineBasicMaterial,
  LineSegments,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  Quaternion,
  Shape,
  ShapeGeometry,
  SphereGeometry,
  Vector2,
  Vector3,
  type Object3D,
  type Scene,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

// ---------------------------------------------------------------- materiales
export interface ModelMaterials {
  body: MeshLambertMaterial;
  bodyDouble: MeshLambertMaterial;
  dark: MeshLambertMaterial;
  accent: MeshBasicMaterial;
  disc: MeshBasicMaterial;
  edge: LineBasicMaterial;
  edgeSoft: LineBasicMaterial;
}

export interface ModelLights {
  hemi: HemisphereLight;
  sun: DirectionalLight;
}

const solid = (doubleSided = false) => {
  const mat = new MeshLambertMaterial({
    color: 0xffffff,
    // empuja las caras hacia atrás para que los bordes se dibujen limpios encima
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
  if (doubleSided) mat.side = DoubleSide;
  return mat;
};

export function createModelMaterials(): ModelMaterials {
  return {
    body: solid(),
    bodyDouble: solid(true),
    dark: solid(),
    accent: new MeshBasicMaterial({ color: 0x8cff5a }),
    disc: new MeshBasicMaterial({ transparent: true, opacity: 0.1, depthWrite: false, side: DoubleSide }),
    edge: new LineBasicMaterial({ transparent: true }),
    edgeSoft: new LineBasicMaterial({ transparent: true, depthWrite: false }),
  };
}

export function createModelLights(scene: Scene): ModelLights {
  const hemi = new HemisphereLight(0xffffff, 0x000000, 2);
  const sun = new DirectionalLight(0xffffff, 1.6);
  sun.position.set(-30, 60, 25);
  scene.add(hemi, sun);
  return { hemi, sun };
}

export interface ModelPalette {
  dark: boolean;
  bg: Color;
  ink: Color;
  muted: Color;
  signal: Color;
}

/** Re-colorea materiales y luces según el tema (oscuro = pantalla, claro = papel). */
export function applyModelPalette(m: ModelMaterials, l: ModelLights, p: ModelPalette): void {
  const mix = (a: Color, b: Color, t: number) => a.clone().lerp(b, t);
  if (p.dark) {
    m.body.color.copy(mix(p.bg, p.ink, 0.2));
    m.dark.color.copy(mix(p.bg, p.ink, 0.07));
    l.hemi.color.set(0xffffff);
    l.hemi.groundColor.copy(p.bg);
    l.hemi.intensity = 2.1;
    l.sun.intensity = 1.5;
  } else {
    m.body.color.copy(mix(p.bg, new Color(0xffffff), 0.7));
    m.dark.color.copy(mix(p.bg, p.ink, 0.32));
    l.hemi.color.set(0xffffff);
    l.hemi.groundColor.copy(mix(p.bg, p.ink, 0.15));
    l.hemi.intensity = 2.3;
    l.sun.intensity = 1.1;
  }
  m.bodyDouble.color.copy(m.body.color);
  m.accent.color.copy(p.signal);
  m.disc.color.copy(p.dark ? p.ink : p.ink);
  m.disc.opacity = p.dark ? 0.07 : 0.06;
  m.edge.color.copy(p.ink);
  m.edge.opacity = p.dark ? 0.78 : 0.82;
  m.edgeSoft.color.copy(p.dark ? p.muted : p.ink);
  m.edgeSoft.opacity = p.dark ? 0.42 : 0.3;
}

// ------------------------------------------------------------------ builder
type SolidKey = "body" | "bodyDouble" | "dark" | "accent";

class Parts {
  private lists: Record<SolidKey, BufferGeometry[]> = { body: [], bodyDouble: [], dark: [], accent: [] };
  private hard: number[] = [];
  private soft: number[] = [];
  private readonly mtx = new Matrix4();
  private readonly quat = new Quaternion();
  private readonly eul = new Euler();
  private readonly pos = new Vector3();
  private readonly scl = new Vector3();

  /** Agrega una primitiva con posición / rotación (Euler XYZ) / escala. */
  add(key: SolidKey, g: BufferGeometry, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1): this {
    this.eul.set(rx, ry, rz);
    this.quat.setFromEuler(this.eul);
    this.mtx.compose(this.pos.set(x, y, z), this.quat, this.scl.set(sx, sy, sz));
    return this.addMatrix(key, g, this.mtx);
  }

  addMatrix(key: SolidKey, g: BufferGeometry, m: Matrix4): this {
    const ng = g.index ? g.toNonIndexed() : g;
    if (ng !== g) g.dispose();
    ng.applyMatrix4(m);
    for (const name of Object.keys(ng.attributes)) if (name !== "position" && name !== "normal") ng.deleteAttribute(name);
    ng.clearGroups();
    this.lists[key].push(ng);
    return this;
  }

  /** Cilindro (o tubo) entre dos puntos. */
  between(key: SolidKey, a: Vector3, b: Vector3, r: number, seg = 8): this {
    const dir = b.clone().sub(a);
    const len = dir.length();
    const q = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), dir.normalize());
    const m = new Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), q, new Vector3(1, 1, 1));
    return this.addMatrix(key, new CylinderGeometry(r, r, len, seg, 1), m);
  }

  /** Segmentos sueltos (x0,y0,z0,x1,y1,z1,...) — hard = borde marcado, soft = detalle tenue. */
  lines(soft: boolean, ...pts: number[]): this {
    (soft ? this.soft : this.hard).push(...pts);
    return this;
  }

  ring(soft: boolean, cx: number, cy: number, cz: number, r: number, n = 24, from = 0, to = Math.PI * 2): this {
    for (let i = 0; i < n; i++) {
      const a0 = from + ((to - from) * i) / n;
      const a1 = from + ((to - from) * (i + 1)) / n;
      this.lines(soft, cx + Math.cos(a0) * r, cy, cz + Math.sin(a0) * r, cx + Math.cos(a1) * r, cy, cz + Math.sin(a1) * r);
    }
    return this;
  }

  build(m: ModelMaterials, edgeAngle = 40): Group {
    const group = new Group();
    for (const key of Object.keys(this.lists) as SolidKey[]) {
      const list = this.lists[key];
      if (!list.length) continue;
      const merged = mergeGeometries(list, false);
      list.forEach((g) => g.dispose());
      if (!merged) continue;
      group.add(new Mesh(merged, m[key]));
      if (key !== "accent") group.add(new LineSegments(new EdgesGeometry(merged, edgeAngle), m.edge));
    }
    for (const [arr, mat] of [
      [this.hard, m.edge],
      [this.soft, m.edgeSoft],
    ] as const) {
      if (!arr.length) continue;
      const g = new BufferGeometry();
      g.setAttribute("position", new Float32BufferAttribute(arr, 3));
      group.add(new LineSegments(g, mat));
    }
    return group;
  }
}

const V = (x: number, y: number, z: number) => new Vector3(x, y, z);

/** Hélice bipala + disco de giro tenue. Devuelve el grupo que rota. */
function propeller(m: ModelMaterials, length: number, chord: number): Group {
  const p = new Parts();
  p.add("dark", new BoxGeometry(length, 0.018, chord), 0, 0, 0, 0, 0, 0.06);
  p.add("dark", new CylinderGeometry(0.05, 0.05, 0.05, 10), 0, 0.01, 0);
  const g = p.build(m, 40);
  const disc = new Mesh(new CircleGeometry(length / 2, 28), m.disc);
  disc.rotation.x = -Math.PI / 2;
  g.add(disc);
  return g;
}

export interface DroneModel {
  group: Group;
  rotors: Object3D[];
}

// --------------------------------------------------------- dron agrícola
/**
 * Dron agrícola pulverizador (hexacóptero): fuselaje con domo de radar al
 * frente, tanque bajo el cuerpo, seis brazos con motores, barra de
 * pulverización con picos y tren de aterrizaje de patines. Frente = +Z.
 */
export function buildAgroDrone(m: ModelMaterials): DroneModel {
  const p = new Parts();
  // fuselaje
  p.add("body", new BoxGeometry(0.92, 0.36, 1.2), 0, 0, 0);
  p.add("body", new BoxGeometry(0.7, 0.14, 0.86), 0, 0.25, -0.05);
  p.add("dark", new SphereGeometry(0.2, 16, 10), 0, -0.02, 0.62, 0, 0, 0, 1, 0.75, 0.55);
  p.add("accent", new BoxGeometry(0.5, 0.03, 0.03), 0, 0.12, 0.61);
  // tanque + tapa
  p.add("body", new CylinderGeometry(0.36, 0.3, 0.52, 18), 0, -0.44, -0.02);
  p.add("dark", new CylinderGeometry(0.12, 0.12, 0.08, 12), 0, 0.36, -0.02);
  // brazos, motores y picos
  const rotors: Object3D[] = [];
  const armR = 1.5;
  const props: [number, number][] = [];
  for (let k = 0; k < 6; k++) {
    const a = Math.PI / 6 + (k * Math.PI) / 3;
    const ex = Math.sin(a) * armR;
    const ez = Math.cos(a) * armR;
    p.between("body", V(Math.sin(a) * 0.4, 0.04, Math.cos(a) * 0.4), V(ex, 0.08, ez), 0.055, 10);
    p.add("dark", new CylinderGeometry(0.14, 0.12, 0.2, 14), ex, 0.17, ez);
    p.add("dark", new ConeGeometry(0.05, 0.12, 8), ex, -0.08, ez, Math.PI, 0, 0);
    p.add("accent", new SphereGeometry(0.035, 8, 6), ex, -0.01, ez);
    props.push([ex, ez]);
  }
  // barra de pulverización con 6 picos
  p.between("dark", V(-1.35, -0.62, -0.05), V(1.35, -0.62, -0.05), 0.03, 8);
  for (let k = 0; k < 6; k++) {
    const x = -1.25 + (k * 2.5) / 5;
    p.add("accent", new ConeGeometry(0.045, 0.1, 8), x, -0.7, -0.05, Math.PI, 0, 0);
  }
  p.lines(false, 0, -0.68, -0.02, -0.7, -0.62, -0.05, 0, -0.68, -0.02, 0.7, -0.62, -0.05);
  // tren de aterrizaje
  for (const sx of [-1, 1]) {
    p.between("dark", V(sx * 0.48, -0.98, -0.75), V(sx * 0.48, -0.98, 0.75), 0.035, 8);
    for (const sz of [-1, 1]) p.between("dark", V(sx * 0.32, -0.18, sz * 0.36), V(sx * 0.48, -0.98, sz * 0.46), 0.03, 6);
  }
  p.between("dark", V(-0.4, -0.66, 0), V(0.4, -0.66, 0), 0.02, 6);
  const group = p.build(m);
  for (const [ex, ez] of props) {
    const prop = propeller(m, 1.1, 0.09);
    prop.position.set(ex, 0.3, ez);
    group.add(prop);
    rotors.push(prop);
  }
  return { group, rotors };
}

// --------------------------------------------- dron industrial de inspección
/**
 * Cuadricóptero industrial de inspección: cuerpo con baterías duales y mástil
 * de GPS, cuatro brazos en X, patas altas de patín, gimbal con cámara al frente
 * y módulo LiDAR debajo. Frente = +Z.
 */
export function buildInspectionDrone(m: ModelMaterials): DroneModel {
  const p = new Parts();
  p.add("body", new BoxGeometry(0.78, 0.3, 0.98), 0, 0, 0);
  p.add("body", new BoxGeometry(0.62, 0.1, 0.7), 0, 0.2, -0.02);
  for (const sx of [-1, 1]) p.add("dark", new BoxGeometry(0.2, 0.14, 0.52), sx * 0.15, 0.32, -0.05);
  p.add("dark", new CylinderGeometry(0.025, 0.025, 0.28, 6), 0, 0.5, -0.2);
  p.add("body", new CylinderGeometry(0.15, 0.15, 0.06, 18), 0, 0.66, -0.2);
  p.add("accent", new BoxGeometry(0.44, 0.03, 0.03), 0, 0.06, 0.5);
  const rotors: Object3D[] = [];
  const props: [number, number][] = [];
  const armR = 1.32;
  for (const sx of [-1, 1])
    for (const sz of [-1, 1]) {
      const a = Math.atan2(sx, sz);
      const ex = Math.sin(a) * armR;
      const ez = Math.cos(a) * armR;
      p.between("body", V(sx * 0.3, 0.02, sz * 0.38), V(ex, 0.05, ez), 0.06, 10);
      p.add("dark", new CylinderGeometry(0.13, 0.12, 0.17, 14), ex, 0.14, ez);
      p.add("accent", new SphereGeometry(0.035, 8, 6), ex, -0.03, ez);
      props.push([ex, ez]);
    }
  // patas altas (dos marcos en T invertida)
  for (const sx of [-1, 1]) {
    p.between("dark", V(sx * 0.3, -0.14, 0.05), V(sx * 0.58, -1.06, 0.05), 0.035, 8);
    p.between("dark", V(sx * 0.58, -1.06, -0.55), V(sx * 0.58, -1.06, 0.6), 0.035, 8);
  }
  p.between("dark", V(-0.44, -0.6, 0.05), V(0.44, -0.6, 0.05), 0.02, 6);
  // gimbal con cámara
  p.add("dark", new BoxGeometry(0.2, 0.07, 0.2), 0, -0.19, 0.38);
  p.add("dark", new CylinderGeometry(0.03, 0.03, 0.16, 8), 0, -0.3, 0.38);
  p.add("body", new BoxGeometry(0.3, 0.24, 0.26), 0, -0.48, 0.42);
  p.add("dark", new CylinderGeometry(0.09, 0.09, 0.08, 16), 0, -0.48, 0.58, Math.PI / 2, 0, 0);
  p.add("accent", new CylinderGeometry(0.055, 0.055, 0.02, 16), 0, -0.48, 0.63, Math.PI / 2, 0, 0);
  // LiDAR
  p.add("body", new CylinderGeometry(0.13, 0.13, 0.15, 18), 0, -0.25, -0.22);
  p.add("accent", new CylinderGeometry(0.135, 0.135, 0.025, 18), 0, -0.25, -0.22);
  const group = p.build(m);
  for (const [ex, ez] of props) {
    const prop = propeller(m, 1.0, 0.085);
    prop.position.set(ex, 0.26, ez);
    group.add(prop);
    rotors.push(prop);
  }
  return { group, rotors };
}

// -------------------------------------------------------- planta de acopio
/**
 * Planta de acopio: tres silos de chapa con techo cónico, anillos, escalera
 * con jaula, pasarela superior, torre de elevación con caños de descarga y un
 * galpón de servicio a dos aguas. Coordenadas de mundo.
 */
export function buildGrainPlant(
  m: ModelMaterials,
  cx: number,
  cz: number,
  heightAt: (x: number, z: number) => number
): Group {
  const p = new Parts();
  const xs = [-2.6, 0, 2.6].map((d) => cx + d);
  const gB = Math.min(...xs.map((x) => heightAt(x, cz)));
  const R = 1.1;
  const H = 4.4;
  const yBody = gB + 0.2;
  const yEave = yBody + H;
  const yPeak = yEave + 1.0;
  for (const x of xs) {
    p.add("dark", new CylinderGeometry(R + 0.2, R + 0.25, 0.8, 24), x, gB - 0.2, cz);
    p.add("body", new CylinderGeometry(R, R, H, 28), x, yBody + H / 2, cz);
    // anillos de chapa
    for (let y = yBody + 0.55; y < yEave - 0.2; y += 0.55)
      p.add("body", new CylinderGeometry(R + 0.025, R + 0.025, 0.05, 28), x, y, cz);
    // techo cónico + alero + venteo
    p.add("body", new ConeGeometry(R + 0.12, 1.0, 28), x, yEave + 0.5, cz);
    p.add("dark", new CylinderGeometry(R + 0.13, R + 0.13, 0.06, 28), x, yEave + 0.02, cz);
    p.add("dark", new CylinderGeometry(0.17, 0.17, 0.22, 12), x, yPeak + 0.05, cz);
    p.add("dark", new ConeGeometry(0.24, 0.16, 12), x, yPeak + 0.24, cz);
    // montantes verticales (chapa)
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      const px = x + Math.cos(a) * (R + 0.01);
      const pz = cz + Math.sin(a) * (R + 0.01);
      p.lines(true, px, yBody, pz, px, yEave, pz);
    }
    // escalera con jaula, del lado -Z (hacia la cámara de llegada)
    const lz = cz - R - 0.12;
    for (const dx of [-0.13, 0.13]) p.lines(false, x + dx, yBody, lz, x + dx, yEave + 0.3, lz);
    for (let y = yBody + 0.2; y < yEave + 0.2; y += 0.22) p.lines(false, x - 0.13, y, lz, x + 0.13, y, lz);
    for (let y = yBody + 1.0; y < yEave + 0.2; y += 0.45) p.ring(false, x, y, lz, 0.28, 10, Math.PI, Math.PI * 2);
  }
  // pasarela superior + baranda
  const tx = cx + 4.4;
  const tz = cz - 0.2;
  const yWalk = yPeak + 0.38;
  p.add("dark", new BoxGeometry(tx - xs[0] + 0.4, 0.06, 0.38), (xs[0] + tx) / 2, yWalk, cz);
  for (const dz of [-0.19, 0.19]) p.lines(false, xs[0] - 0.2, yWalk + 0.32, cz + dz, tx, yWalk + 0.32, cz + dz);
  for (let x = xs[0] - 0.2; x <= tx; x += 0.6)
    for (const dz of [-0.19, 0.19]) p.lines(false, x, yWalk, cz + dz, x, yWalk + 0.32, cz + dz);
  for (const x of xs) p.lines(false, x, yPeak + 0.3, cz, x, yWalk, cz);
  // torre de elevación (noria) + casilla de cabeza + caños de descarga
  const gT = heightAt(tx, tz);
  const yHead = yWalk + 1.6;
  p.add("body", new BoxGeometry(0.55, yHead - gT, 0.55), tx, (yHead + gT) / 2, tz);
  p.add("dark", new BoxGeometry(0.95, 0.6, 0.95), tx, yHead + 0.3, tz);
  p.add("dark", new BoxGeometry(0.7, 0.12, 0.7), tx, yHead + 0.66, tz);
  for (const x of xs) p.between("dark", V(tx - 0.3, yHead - 0.1, tz), V(x, yPeak + 0.35, cz), 0.055, 8);
  for (let y = gT + 0.6; y < yHead; y += 0.6) p.lines(true, tx - 0.28, y, tz - 0.28, tx + 0.28, y, tz - 0.28);
  // galpón de servicio a dos aguas
  const sx = cx + 0.5;
  const sz = cz + 4.5;
  const gS = heightAt(sx, sz);
  p.add("body", new BoxGeometry(5.6, 1.8, 2.8), sx, gS + 0.7, sz);
  const roof = new Shape();
  roof.moveTo(-1.55, 0);
  roof.lineTo(1.55, 0);
  roof.lineTo(0, 0.75);
  roof.lineTo(-1.55, 0);
  const roofGeom = new ExtrudeGeometry(roof, { depth: 5.9, bevelEnabled: false });
  roofGeom.translate(0, 0, -2.95);
  p.add("body", roofGeom, sx, gS + 1.6, sz, 0, Math.PI / 2, 0);
  p.add("dark", new BoxGeometry(1.4, 1.3, 0.04), sx - 1.2, gS + 0.45, sz - 1.42);
  return p.build(m);
}

// --------------------------------------------------------- galpón parabólico
/**
 * Galpón de chapa con techo parabólico (típico del campo): cáscara curva con
 * costillas, muros de cierre, portón corredizo con riel y platea. Largo sobre X.
 */
export function buildParabolicShed(
  m: ModelMaterials,
  cx: number,
  cz: number,
  heightAt: (x: number, z: number) => number
): Group {
  const p = new Parts();
  const S = 4.4; // luz
  const Ht = 2.8; // altura
  const L = 6.4; // largo
  const t = 0.1;
  const N = 28;
  const arch = (span: number, h: number, n: number) => {
    const pts: Vector2[] = [];
    for (let i = 0; i <= n; i++) {
      const x = -span / 2 + (span * i) / n;
      pts.push(new Vector2(x, h * (1 - ((2 * x) / span) ** 2)));
    }
    return pts;
  };
  const outer = arch(S, Ht, N);
  const inner = arch(S - 2 * t, Ht - t, N);
  const shell = new Shape();
  shell.moveTo(outer[0].x, outer[0].y);
  outer.slice(1).forEach((v) => shell.lineTo(v.x, v.y));
  [...inner].reverse().forEach((v) => shell.lineTo(v.x, v.y));
  shell.lineTo(outer[0].x, outer[0].y);
  const shellGeom = new ExtrudeGeometry(shell, { depth: L, bevelEnabled: false, curveSegments: 1 });
  shellGeom.translate(0, 0, -L / 2);
  p.add("body", shellGeom);
  // muros de cierre (retirados 0.25 del borde)
  const wall = new Shape(inner.map((v) => v.clone()));
  for (const z of [-L / 2 + 0.25, L / 2 - 0.25]) p.add("bodyDouble", new ShapeGeometry(wall), 0, 0, z);
  // portón corredizo + riel
  p.add("dark", new BoxGeometry(1.8, 2.0, 0.06), 0.35, 1.0, L / 2 - 0.2);
  p.lines(false, -1.5, 2.1, L / 2 - 0.16, 2.2, 2.1, L / 2 - 0.16);
  p.lines(true, 0.35, 0.05, L / 2 - 0.16, 0.35, 1.95, L / 2 - 0.16);
  // costillas de chapa
  for (let z = -L / 2 + 0.4; z < L / 2 - 0.2; z += 0.4)
    for (let i = 0; i < N; i++)
      p.lines(true, outer[i].x * 1.004, outer[i].y + 0.004, z, outer[i + 1].x * 1.004, outer[i + 1].y + 0.004, z);
  // platea
  p.add("dark", new BoxGeometry(S + 0.8, 0.3, L + 0.8), 0, -0.12, 0);
  const g = p.build(m, 30);
  g.rotation.y = Math.PI / 2;
  g.position.set(cx, heightAt(cx, cz) - 0.05, cz);
  return g;
}

/** Poste con cámara de seguridad y reflector (coordenadas de mundo). */
export function buildSecurityPole(m: ModelMaterials, x: number, z: number, y0: number, yaw: number): Group {
  const p = new Parts();
  p.add("dark", new CylinderGeometry(0.06, 0.08, 3.0, 8), 0, 1.5, 0);
  p.add("dark", new BoxGeometry(0.5, 0.05, 0.08), 0, 2.9, 0);
  p.add("body", new BoxGeometry(0.18, 0.16, 0.42), 0.2, 2.78, 0.12, -0.25, 0, 0);
  p.add("accent", new CylinderGeometry(0.05, 0.05, 0.02, 12), 0.2, 2.74, 0.34, Math.PI / 2 - 0.25, 0, 0);
  p.add("body", new BoxGeometry(0.3, 0.2, 0.08), -0.2, 2.82, 0.06, -0.4, 0, 0);
  const g = p.build(m);
  g.position.set(x, y0, z);
  g.rotation.y = yaw;
  return g;
}

// ------------------------------------------------------ estación de radar
export interface RadarStation {
  group: Group;
  /** Antena de radar que gira. */
  spinner: Group;
  /** Punto al que llega el enlace de datos (cabeza de la torre). */
  linkTarget: Vector3;
}

/**
 * Estación base: torre reticulada triangular, plataforma con baranda, antena
 * de radar giratoria, plato parabólico con alimentador y shelter de equipos.
 * `faceX/faceZ`: hacia dónde apunta el plato.
 */
export function buildRadarStation(
  m: ModelMaterials,
  x: number,
  z: number,
  heightAt: (x: number, z: number) => number,
  faceX: number,
  faceZ: number
): RadarStation {
  const g0 = heightAt(x, z);
  const p = new Parts();
  const TH = 5.0;
  p.add("dark", new BoxGeometry(4.2, 0.4, 4.2), 0, -0.15, 0);
  // torre reticulada
  const legs = [0, 1, 2].map((i) => (Math.PI / 2 + (i * 2 * Math.PI) / 3));
  const legAt = (a: number, h: number) => {
    const r = 0.75 + (0.28 - 0.75) * (h / TH);
    return V(Math.cos(a) * r, h, Math.sin(a) * r);
  };
  for (const a of legs) p.between("dark", legAt(a, 0), legAt(a, TH), 0.045, 6);
  const secs = 7;
  for (let s = 0; s < secs; s++) {
    const h0 = (TH * s) / secs;
    const h1 = (TH * (s + 1)) / secs;
    for (let i = 0; i < 3; i++) {
      const a = legs[i];
      const b = legs[(i + 1) % 3];
      const A0 = legAt(a, h0);
      const B1 = legAt(b, h1);
      const B0 = legAt(b, h0);
      const A1 = legAt(a, h1);
      p.lines(false, A0.x, A0.y, A0.z, B1.x, B1.y, B1.z, B0.x, B0.y, B0.z, A1.x, A1.y, A1.z, A0.x, A0.y, A0.z, B0.x, B0.y, B0.z);
    }
  }
  // plataforma + baranda
  p.add("body", new CylinderGeometry(0.62, 0.62, 0.07, 20), 0, TH, 0);
  p.ring(false, 0, TH + 0.35, 0, 0.62, 20);
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    p.lines(false, Math.cos(a) * 0.62, TH, Math.sin(a) * 0.62, Math.cos(a) * 0.62, TH + 0.35, Math.sin(a) * 0.62);
  }
  // plato parabólico con alimentador
  const f = 0.3;
  const dishPts: Vector2[] = [];
  for (let i = 0; i <= 10; i++) {
    const r = (0.8 * i) / 10;
    dishPts.push(new Vector2(r, (r * r) / (4 * f)));
  }
  const dir = V(faceX, 0, faceZ).normalize();
  dir.y = 0.28;
  dir.normalize();
  const mount = V(0, 3.3, 0);
  const center = mount.clone().addScaledVector(dir, 0.55);
  const dq = new Quaternion().setFromUnitVectors(V(0, 1, 0), dir);
  p.addMatrix("bodyDouble", new LatheGeometry(dishPts, 28), new Matrix4().compose(center, dq, V(1, 1, 1)));
  p.between("dark", mount, center, 0.05, 8);
  const focus = center.clone().addScaledVector(dir, f);
  // alimentador en el foco
  p.addMatrix("dark", new CylinderGeometry(0.07, 0.05, 0.16, 10), new Matrix4().compose(focus, dq, V(1, 1, 1)));
  const rimH = (0.8 * 0.8) / (4 * f);
  const side = V(0, 1, 0).cross(dir).normalize();
  const up2 = dir.clone().cross(side).normalize();
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2;
    const rim = center
      .clone()
      .addScaledVector(dir, rimH)
      .addScaledVector(side, Math.cos(a) * 0.8)
      .addScaledVector(up2, Math.sin(a) * 0.8);
    p.lines(false, rim.x, rim.y, rim.z, focus.x, focus.y, focus.z);
  }
  // shelter de equipos + aire acondicionado + bandeja de cables
  p.add("body", new BoxGeometry(1.7, 1.15, 1.1), 1.75, 0.62, -0.75);
  p.add("dark", new BoxGeometry(0.05, 0.85, 0.45), 2.61, 0.5, -0.75);
  p.add("dark", new BoxGeometry(0.32, 0.36, 0.46), 1.75, 0.5, -1.42);
  p.lines(false, 0.9, 1.25, -0.75, 0.3, 1.25, -0.2, 0.3, 1.25, -0.2, 0.3, 4.9, -0.2);
  const group = p.build(m);
  // radar giratorio
  const r = new Parts();
  r.add("dark", new CylinderGeometry(0.1, 0.12, 0.35, 12), 0, 0.17, 0);
  r.add("body", new BoxGeometry(1.9, 0.34, 0.08), 0, 0.5, 0, -0.25, 0, 0);
  r.add("accent", new BoxGeometry(1.7, 0.04, 0.09), 0, 0.5, 0.0, -0.25, 0, 0);
  const spinner = r.build(m);
  spinner.position.set(0, TH + 0.04, 0);
  group.add(spinner);
  group.position.set(x, g0, z);
  return { group, spinner, linkTarget: V(x, g0 + TH + 0.5, z) };
}
