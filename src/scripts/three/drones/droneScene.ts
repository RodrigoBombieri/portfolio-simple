/**
 * Escena 3D de /drones — "Ruta autónoma simulada".
 *
 * Terreno topográfico en wireframe (curvas de nivel por marching squares),
 * dron en wireframe que sigue una ruta Catmull-Rom con 6 puntos de control,
 * sensores por tramo (cono multiespectral + lote NDVI, cámara, térmica,
 * misión, LiDAR, enlace de datos) y HUD de telemetría simulada en HTML.
 * Interacción: scroll (avance por la ruta) + arrastre (órbita propia, liviana).
 * Este módulo (y Three) se cargan solo con import dinámico desde initDroneScene.
 */
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Fog,
  Group,
  Line,
  LineBasicMaterial,
  LineDashedMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  NormalBlending,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  ShaderMaterial,
  Vector3,
  WebGLRenderer,
  type Material,
  type Object3D,
} from "three";
import type { Blending } from "three";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  DRONE_WORLD,
  DRONE_SCENE_STEPS,
  DRONE_SCENE_INTRO,
  DRONE_SCENE_UI,
  DRONE_HUD,
  type DroneSensor,
} from "@data/droneScene";
import { heightAt, contourSegments, ndviAt, NDVI_ALERT, catmullRom2D, TERRAIN_SIZE } from "./terrain";
import type { DroneBloom } from "./bloom";
import {
  applyModelPalette,
  buildAgroDrone,
  buildGrainPlant,
  buildInspectionDrone,
  buildParabolicShed,
  buildRadarStation,
  buildSecurityPole,
  createModelLights,
  createModelMaterials,
} from "./models";

gsap.registerPlugin(ScrollTrigger);

export interface DroneSceneHandle {
  dispose(): void;
}

interface Palette {
  dark: boolean;
  bg: Color;
  line: Color;
  ink: Color;
  muted: Color;
  signal: Color;
  signalDim: Color;
  warn: Color;
}

function readPalette(): Palette {
  const cs = getComputedStyle(document.documentElement);
  const get = (name: string, fb: string) => new Color(cs.getPropertyValue(name).trim() || fb);
  return {
    dark: document.documentElement.getAttribute("data-theme") !== "light",
    bg: get("--color-bg", "#0a0c0b"),
    line: get("--color-line", "#26302a"),
    ink: get("--color-ink", "#e8ede9"),
    muted: get("--color-muted", "#8a968e"),
    signal: get("--color-signal", "#8cff5a"),
    signalDim: get("--color-signal-dim", "#4fae34"),
    warn: get("--color-warn", "#ffb547"),
  };
}

const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const damp = (cur: number, target: number, k: number, dt: number) => cur + (target - cur) * (1 - Math.exp(-k * dt));

function segGeom(arr: number[]): BufferGeometry {
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(arr, 3));
  return g;
}

/** Anillo horizontal como pares de segmentos. */
function pushRing(out: number[], cx: number, cy: number, cz: number, r: number, n: number, drape = false): void {
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2;
    const a1 = ((i + 1) / n) * Math.PI * 2;
    const x0 = cx + Math.cos(a0) * r;
    const z0 = cz + Math.sin(a0) * r;
    const x1 = cx + Math.cos(a1) * r;
    const z1 = cz + Math.sin(a1) * r;
    out.push(x0, drape ? heightAt(x0, z0) + cy : cy, z0, x1, drape ? heightAt(x1, z1) + cy : cy, z1);
  }
}

/** Polilínea apoyada sobre el terreno, subdividida para seguir el relieve. */
function pushDraped(out: number[], pts: [number, number][], lift: number, sub = 8): void {
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i];
    const [bx, bz] = pts[i + 1];
    for (let k = 0; k < sub; k++) {
      const t0 = k / sub;
      const t1 = (k + 1) / sub;
      const x0 = ax + (bx - ax) * t0;
      const z0 = az + (bz - az) * t0;
      const x1 = ax + (bx - ax) * t1;
      const z1 = az + (bz - az) * t1;
      out.push(x0, heightAt(x0, z0) + lift, z0, x1, heightAt(x1, z1) + lift, z1);
    }
  }
}

const NDVI_VERT = /* glsl */ `
attribute vec3 aColor;
attribute float aT;
uniform float uT;
uniform float uOpacity;
uniform float uBase;
varying vec3 vColor;
varying float vAlpha;
void main() {
  vColor = aColor;
  float r = smoothstep(aT - 0.01, aT + 0.002, uT);
  vAlpha = mix(uBase, uOpacity, r);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const NDVI_FRAG = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;
void main() {
  gl_FragColor = vec4(vColor, vAlpha);
  #include <colorspace_fragment>
}`;

interface SceneLabel {
  el: HTMLElement;
  pos: Vector3;
  kind: "wp" | "feature" | "drone" | "base";
  step: number;
}

export function createDroneScene(root: HTMLElement): DroneSceneHandle | null {
  const stage = root.querySelector<HTMLElement>("[data-drone-stage]");
  const host = root.querySelector<HTMLElement>("[data-drone-canvas]");
  const labelsHost = root.querySelector<HTMLElement>("[data-drone-labels]");
  const hud = root.querySelector<HTMLElement>("[data-drone-hud]");
  const legendBox = root.querySelector<HTMLElement>("[data-drone-legend]");
  /** Zonas ocupadas por HUD y leyenda (coords del escenario): ahí no se dibujan labels. */
  let blockedRects: { l: number; t: number; r: number; b: number }[] = [];
  const linkPath = root.querySelector<SVGPathElement>("[data-drone-link-path]");
  const linkTip = root.querySelector<SVGRectElement>("[data-drone-link-tip]");
  const pauseBtn = root.querySelector<HTMLButtonElement>("[data-drone-pause]");
  const pauseLabel = root.querySelector<HTMLElement>("[data-pause-label]");
  const legendWp = root.querySelector<HTMLElement>("[data-legend-wp]");
  const legendTitle = root.querySelector<HTMLElement>("[data-legend-title]");
  const legendSensor = root.querySelector<HTMLElement>("[data-legend-sensor]");
  const stepEls = Array.from(root.querySelectorAll<HTMLElement>("[data-drone-step]"));
  const stepPanels = stepEls.map((el) => ({
    k: Number(el.dataset.droneStep),
    panel: el.querySelector<HTMLElement>(".drone-panel"),
  }));
  let lastPanelF = -1;
  /**
   * Desktop: cada tarjeta es 100% opaca cerca del centro del escenario y se
   * desvanece al alejarse (a ~0.4 de paso ya es invisible), así la que entra y
   * la que sale no se montan sobre el encabezado ni sobre el HUD. Usa el
   * progreso REAL del scroll (fTarget), porque las tarjetas se mueven con él.
   */
  const fadePanels = (f: number, desktop: boolean) => {
    if (desktop && Math.abs(f - lastPanelF) < 0.002) return;
    lastPanelF = desktop ? f : -1;
    for (const { k, panel } of stepPanels) {
      if (!panel) continue;
      if (!desktop) {
        panel.style.opacity = "";
        continue;
      }
      const d = Math.abs(k - f);
      panel.style.opacity = String(Math.min(1, Math.max(0, 1 - (d - 0.1) / 0.28)).toFixed(3));
    }
  };
  const hudEls: Record<string, HTMLElement | null> = {};
  for (const key of Object.keys(DRONE_HUD.fields)) hudEls[key] = root.querySelector<HTMLElement>(`[data-hud="${key}"]`);
  if (!stage || !host || !labelsHost) return null;

  // ---------------------------------------------------------------- calidad
  const isNarrow = window.innerWidth < 768;
  const low = isNarrow || (navigator.hardwareConcurrency ?? 8) <= 4;
  const dpr = Math.min(window.devicePixelRatio || 1, low ? 1.5 : 2);

  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    if (!renderer.getContext()) throw new Error("sin contexto");
  } catch {
    return null;
  }
  renderer.setPixelRatio(dpr);
  host.appendChild(renderer.domElement);

  let palette = readPalette();
  const scene = new Scene();
  const fog = new Fog(palette.bg, 34, 120);
  scene.fog = fog;
  scene.background = palette.bg.clone();
  const camera = new PerspectiveCamera(40, 1, 0.5, 260);

  // -------------------------------------------------------------- materiales
  const mm = createModelMaterials();
  const modelLights = createModelLights(scene);
  const mGrid = new LineBasicMaterial({ transparent: true, depthWrite: false });
  const mContour = new LineBasicMaterial({ transparent: true, depthWrite: false });
  const mContourMajor = new LineBasicMaterial({ transparent: true, depthWrite: false });
  const mPlan = new LineDashedMaterial({ transparent: true, dashSize: 0.7, gapSize: 0.9, depthWrite: false });
  const mDone = new LineMaterial({ linewidth: 2, transparent: true, worldUnits: false });
  const mDrone = new LineBasicMaterial({ transparent: true });
  const mRotor = new LineBasicMaterial({ transparent: true });
  const mPole = new LineDashedMaterial({ transparent: true, dashSize: 0.3, gapSize: 0.35, depthWrite: false });
  const mFeature = new LineBasicMaterial({ transparent: true, depthWrite: false });
  const mLotGrid = new LineBasicMaterial({ transparent: true, depthWrite: false });
  const mWarn = new LineBasicMaterial({ transparent: true, depthWrite: false });
  const mCone = new LineBasicMaterial({ transparent: true, depthWrite: false });
  const mConeFill = new MeshBasicMaterial({ transparent: true, depthWrite: false, side: DoubleSide, fog: true });
  const mMissionBase = new LineDashedMaterial({ transparent: true, dashSize: 0.4, gapSize: 0.4, depthWrite: false });
  const mMission = new LineBasicMaterial({ transparent: true, depthWrite: false });
  const mRays = new LineBasicMaterial({ transparent: true, depthWrite: false });
  const mCloud = new PointsMaterial({ size: 2, sizeAttenuation: false, transparent: true, depthWrite: false });
  const mPackets = new PointsMaterial({ size: 4, sizeAttenuation: false, transparent: true, depthWrite: false });
  const mLink = new LineDashedMaterial({ transparent: true, dashSize: 0.5, gapSize: 0.5, depthWrite: false });
  const mDust = new PointsMaterial({ size: 1.5, sizeAttenuation: false, transparent: true, depthWrite: false });
  const mNdvi = new ShaderMaterial({
    vertexShader: NDVI_VERT,
    fragmentShader: NDVI_FRAG,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    uniforms: { uT: { value: 0 }, uOpacity: { value: 0.4 }, uBase: { value: 0.05 } },
  });
  const wpMats = DRONE_WORLD.waypoints.map(() => new LineBasicMaterial({ transparent: true }));

  // ----------------------------------------------------------------- terreno
  const half = TERRAIN_SIZE / 2;
  {
    const gridStep = low ? 10 : 7;
    const samples = low ? 48 : 90;
    const pts: number[] = [];
    for (let a = -half; a <= half + 0.001; a += gridStep) {
      for (let k = 0; k < samples; k++) {
        const b0 = -half + (k / samples) * TERRAIN_SIZE;
        const b1 = -half + ((k + 1) / samples) * TERRAIN_SIZE;
        pts.push(a, heightAt(a, b0), b0, a, heightAt(a, b1), b1);
        pts.push(b0, heightAt(b0, a), a, b1, heightAt(b1, a), a);
      }
    }
    scene.add(new LineSegments(segGeom(pts), mGrid));
  }
  {
    const minor: number[] = [];
    const major: number[] = [];
    for (const c of contourSegments(low ? 64 : 110, 0.5)) {
      const target = Math.abs(Math.round(c.level * 2) % 4) === 0 ? major : minor;
      target.push(c.s[0], c.level + 0.03, c.s[1], c.s[2], c.level + 0.03, c.s[3]);
    }
    scene.add(new LineSegments(segGeom(minor), mContour));
    scene.add(new LineSegments(segGeom(major), mContourMajor));
  }

  // ------------------------------------------------------------------- ruta
  const W = DRONE_WORLD;
  const ctrl: [number, number][] = [[W.base.x, W.base.z], ...W.waypoints.map((w) => [w.x, w.z] as [number, number])];
  const SEG = 40;
  const raw = catmullRom2D(ctrl, SEG);
  const cum = [0];
  for (let i = 1; i < raw.length; i++) cum.push(cum[i - 1] + Math.hypot(raw[i][0] - raw[i - 1][0], raw[i][1] - raw[i - 1][1]));
  const totalLen = cum[cum.length - 1];
  const wpU = ctrl.map((_, i) => cum[i * SEG] / totalLen);
  const M = 600;
  const rx = new Float32Array(M);
  const ry = new Float32Array(M);
  const rz = new Float32Array(M);
  {
    let j = 0;
    for (let i = 0; i < M; i++) {
      const s = (i / (M - 1)) * totalLen;
      while (j < cum.length - 2 && cum[j + 1] < s) j++;
      const t = (s - cum[j]) / Math.max(1e-6, cum[j + 1] - cum[j]);
      const x = raw[j][0] + (raw[j + 1][0] - raw[j][0]) * t;
      const z = raw[j][1] + (raw[j + 1][1] - raw[j][1]) * t;
      const u = i / (M - 1);
      const alt = 0.5 + (W.altitude - 0.5) * smooth(clamp(u / 0.045, 0, 1));
      rx[i] = x;
      rz[i] = z;
      ry[i] = heightAt(x, z) + alt;
    }
  }
  const routeAt = (u: number, out: Vector3) => {
    const f = clamp(u, 0, 1) * (M - 1);
    const i = Math.min(M - 2, Math.floor(f));
    const t = f - i;
    return out.set(rx[i] + (rx[i + 1] - rx[i]) * t, ry[i] + (ry[i + 1] - ry[i]) * t, rz[i] + (rz[i + 1] - rz[i]) * t);
  };

  const routePos: number[] = [];
  for (let i = 0; i < M; i++) routePos.push(rx[i], ry[i], rz[i]);
  const planLine = new Line(segGeom(routePos), mPlan);
  planLine.computeLineDistances();
  scene.add(planLine);
  const doneGeom = new LineGeometry();
  doneGeom.setPositions(routePos);
  const doneLine = new Line2(doneGeom, mDone);
  doneLine.computeLineDistances();
  scene.add(doneLine);

  // ----------------------------------------------------- base y waypoints
  {
    const pts: number[] = [];
    const bx = W.base.x;
    const bz = W.base.z;
    pushRing(pts, bx, 0.06, bz, 1.4, 32, true);
    const g = (x: number, z: number) => heightAt(x, z) + 0.06;
    for (const dx of [-0.45, 0.45]) pts.push(bx + dx, g(bx + dx, bz - 0.6), bz - 0.6, bx + dx, g(bx + dx, bz + 0.6), bz + 0.6);
    pts.push(bx - 0.45, g(bx, bz), bz, bx + 0.45, g(bx, bz), bz);
    scene.add(new LineSegments(segGeom(pts), mFeature));
  }
  W.waypoints.forEach((w, i) => {
    const gy = heightAt(w.x, w.z);
    const ay = routeAt(wpU[i + 1], new Vector3()).y;
    const pts: number[] = [];
    const s = 0.9;
    pushDraped(
      pts,
      [
        [w.x - s, w.z - s],
        [w.x + s, w.z - s],
        [w.x + s, w.z + s],
        [w.x - s, w.z + s],
        [w.x - s, w.z - s],
      ],
      0.06,
      2
    );
    const r = 0.38;
    const top = [w.x, ay + r, w.z];
    const bot = [w.x, ay - r, w.z];
    const mid = [
      [w.x + r, ay, w.z],
      [w.x, ay, w.z + r],
      [w.x - r, ay, w.z],
      [w.x, ay, w.z - r],
    ];
    for (let k = 0; k < 4; k++) {
      pts.push(...top, ...mid[k], ...bot, ...mid[k], ...mid[k], ...mid[(k + 1) % 4]);
    }
    scene.add(new LineSegments(segGeom(pts), wpMats[i]));
    const pole = new Line(segGeom([w.x, gy, w.z, w.x, ay - r, w.z]), mPole);
    pole.computeLineDistances();
    scene.add(pole);
  });

  // -------------------------------------------------------------- lote NDVI
  const lot = W.lot;
  const lotCells: { v: number }[] = [];
  const ndviGeom = new BufferGeometry();
  {
    const pos: number[] = [];
    const tAttr: number[] = [];
    const cw = lot.w / lot.nx;
    const cd = lot.d / lot.nz;
    const gap = 0.12;
    const uMax = wpU[1] + 0.02;
    for (let j = 0; j < lot.nz; j++) {
      for (let i = 0; i < lot.nx; i++) {
        const x0 = lot.x - lot.w / 2 + i * cw + gap;
        const x1 = x0 + cw - gap * 2;
        const z0 = lot.z - lot.d / 2 + j * cd + gap;
        const z1 = z0 + cd - gap * 2;
        const y = (x: number, z: number) => heightAt(x, z) + 0.08;
        const quad = [
          [x0, y(x0, z0), z0],
          [x1, y(x1, z0), z0],
          [x1, y(x1, z1), z1],
          [x0, y(x0, z1), z1],
        ];
        for (const k of [0, 1, 2, 0, 2, 3]) pos.push(...quad[k]);
        // momento de la ruta en que el dron pasa más cerca de la celda
        const cx = (x0 + x1) / 2;
        const cz = (z0 + z1) / 2;
        let best = 0;
        let bestD = Infinity;
        for (let s = 0; s < M; s++) {
          const u = s / (M - 1);
          if (u > uMax) break;
          const d = (rx[s] - cx) ** 2 + (rz[s] - cz) ** 2;
          if (d < bestD) {
            bestD = d;
            best = u;
          }
        }
        const tReveal = Math.min(uMax, best + Math.sqrt(bestD) * 0.0012);
        for (let k = 0; k < 6; k++) tAttr.push(tReveal);
        lotCells.push({ v: ndviAt(i, j, lot.nx, lot.nz) });
      }
    }
    ndviGeom.setAttribute("position", new Float32BufferAttribute(pos, 3));
    ndviGeom.setAttribute("aT", new Float32BufferAttribute(tAttr, 1));
    ndviGeom.setAttribute("aColor", new Float32BufferAttribute(new Float32Array(pos.length), 3));
    scene.add(new Mesh(ndviGeom, mNdvi));

    const grid: number[] = [];
    for (let i = 0; i <= lot.nx; i++) {
      const x = lot.x - lot.w / 2 + i * cw;
      pushDraped(grid, [[x, lot.z - lot.d / 2], [x, lot.z + lot.d / 2]], 0.05, lot.nz);
    }
    for (let j = 0; j <= lot.nz; j++) {
      const z = lot.z - lot.d / 2 + j * cd;
      pushDraped(grid, [[lot.x - lot.w / 2, z], [lot.x + lot.w / 2, z]], 0.05, lot.nx);
    }
    scene.add(new LineSegments(segGeom(grid), mLotGrid));
  }
  const paintNdvi = () => {
    const col = ndviGeom.getAttribute("aColor") as Float32BufferAttribute;
    const c = new Color();
    lotCells.forEach((cell, n) => {
      if (cell.v < NDVI_ALERT) c.copy(palette.warn);
      else c.copy(palette.signalDim).lerp(palette.signal, clamp((cell.v - NDVI_ALERT) / (1 - NDVI_ALERT), 0, 1));
      for (let k = 0; k < 6; k++) col.setXYZ(n * 6 + k, c.r, c.g, c.b);
    });
    col.needsUpdate = true;
  };

  // ------------------------------------------------------------- elementos
  const silo = W.silos;
  const siloTarget = new Vector3(silo.x, heightAt(silo.x, silo.z) + 2.6, silo.z);
  scene.add(buildGrainPlant(mm, silo.x, silo.z, heightAt));

  const per = W.perimeter;
  const eventPos = new Vector3(per.x + per.w / 2, 0, per.z - per.d / 2);
  eventPos.y = heightAt(eventPos.x, eventPos.z);
  {
    const pts: number[] = [];
    const corners: [number, number][] = [
      [per.x - per.w / 2, per.z - per.d / 2],
      [per.x + per.w / 2, per.z - per.d / 2],
      [per.x + per.w / 2, per.z + per.d / 2],
      [per.x - per.w / 2, per.z + per.d / 2],
      [per.x - per.w / 2, per.z - per.d / 2],
    ];
    pushDraped(pts, corners, 0.8, 8);
    for (let c = 0; c < 4; c++) {
      const [ax, az] = corners[c];
      const [bx, bz] = corners[c + 1];
      const len = Math.hypot(bx - ax, bz - az);
      const n = Math.round(len / 1.5);
      for (let k = 0; k < n; k++) {
        const x = ax + ((bx - ax) * k) / n;
        const z = az + ((bz - az) * k) / n;
        const g = heightAt(x, z);
        pts.push(x, g, z, x, g + 0.8, z);
      }
    }
    scene.add(new LineSegments(segGeom(pts), mFeature));
  }
  scene.add(buildParabolicShed(mm, per.x, per.z, heightAt));
  {
    const px = per.x - per.w / 2 + 0.3;
    const pz = per.z - per.d / 2 + 0.3;
    scene.add(buildSecurityPole(mm, px, pz, heightAt(px, pz), Math.PI * 0.75));
  }
  const eventGroup = new Group();
  {
    const pts: number[] = [];
    pushRing(pts, 0, 0.1, 0, 0.9, 24);
    pts.push(0, 0, 0, 0, 2.2, 0);
    const ev = new LineSegments(segGeom(pts), mWarn);
    eventGroup.add(ev);
    eventGroup.position.copy(eventPos);
    scene.add(eventGroup);
  }

  const mis = W.mission;
  const missionPts: [number, number][] = [];
  for (let l = 0; l < mis.lanes; l++) {
    const x = mis.x - mis.w / 2 + (l / (mis.lanes - 1)) * mis.w;
    const a = mis.z - mis.d / 2;
    const b = mis.z + mis.d / 2;
    missionPts.push([x, l % 2 ? b : a], [x, l % 2 ? a : b]);
  }
  const missionStrip: number[] = [];
  {
    const sub = 10;
    for (let i = 0; i < missionPts.length - 1; i++) {
      const [ax, az] = missionPts[i];
      const [bx, bz] = missionPts[i + 1];
      for (let k = 0; k < sub; k++) {
        const x = ax + ((bx - ax) * k) / sub;
        const z = az + ((bz - az) * k) / sub;
        missionStrip.push(x, heightAt(x, z) + 0.12, z);
      }
    }
    const [lx, lz] = missionPts[missionPts.length - 1];
    missionStrip.push(lx, heightAt(lx, lz) + 0.12, lz);
  }
  const missionBase = new Line(segGeom(missionStrip), mMissionBase);
  missionBase.computeLineDistances();
  scene.add(missionBase);
  const missionLine = new Line(segGeom(missionStrip), mMission);
  const missionCount = missionStrip.length / 3;
  missionLine.geometry.setDrawRange(0, 0);
  scene.add(missionLine);

  const st = W.station;
  const lastWp = W.waypoints[W.waypoints.length - 1];
  const radar = buildRadarStation(mm, st.x, st.z, heightAt, lastWp.x - st.x, lastWp.z - st.z);
  scene.add(radar.group);
  const stationTop = radar.linkTarget;

  // ------------------------------------------------------------------- dron
  // Dos equipos reales: agrícola (pulverizador) en WP-00/WP-01 y de inspección
  // desde WP-02. El cambio ocurre entre WP-01 y WP-02, cuando no hay tarjeta.
  const drone = new Group();
  drone.rotation.order = "YXZ";
  const agro = buildAgroDrone(mm);
  const insp = buildInspectionDrone(mm);
  drone.add(agro.group, insp.group);
  drone.scale.setScalar(1.6);
  insp.group.visible = false;
  const rotors: Object3D[] = [...agro.rotors, ...insp.rotors];
  scene.add(drone);
  let droneKind: "agro" | "insp" = "agro";

  // --------------------------------------------------- sensor: cono / frustum
  const CONE_N = 40;
  const coneLineGeom = new BufferGeometry();
  coneLineGeom.setAttribute("position", new Float32BufferAttribute(new Float32Array((CONE_N * 4 + 8) * 3), 3));
  const coneLines = new LineSegments(coneLineGeom, mCone);
  coneLines.frustumCulled = false;
  scene.add(coneLines);
  const coneFillGeom = new BufferGeometry();
  coneFillGeom.setAttribute("position", new Float32BufferAttribute(new Float32Array(CONE_N * 9), 3));
  const coneFill = new Mesh(coneFillGeom, mConeFill);
  coneFill.frustumCulled = false;
  scene.add(coneFill);

  // LiDAR: abanico de rayos + nube de puntos acumulada
  const RAYS = low ? 16 : 28;
  const raysGeom = new BufferGeometry();
  raysGeom.setAttribute("position", new Float32BufferAttribute(new Float32Array(RAYS * 6), 3));
  const rays = new LineSegments(raysGeom, mRays);
  rays.frustumCulled = false;
  scene.add(rays);
  const CLOUD = low ? 320 : 900;
  const cloudGeom = new BufferGeometry();
  cloudGeom.setAttribute("position", new Float32BufferAttribute(new Float32Array(CLOUD * 3), 3));
  cloudGeom.setDrawRange(0, 0);
  const cloud = new Points(cloudGeom, mCloud);
  cloud.frustumCulled = false;
  scene.add(cloud);
  let cloudHead = 0;
  let cloudCount = 0;

  // Enlace dron → estación + paquetes
  const linkGeom = new BufferGeometry();
  linkGeom.setAttribute("position", new Float32BufferAttribute(new Float32Array(6), 3));
  const link3d = new Line(linkGeom, mLink);
  link3d.frustumCulled = false;
  scene.add(link3d);
  const PACKETS = 6;
  const packetsGeom = new BufferGeometry();
  packetsGeom.setAttribute("position", new Float32BufferAttribute(new Float32Array(PACKETS * 3), 3));
  const packets = new Points(packetsGeom, mPackets);
  packets.frustumCulled = false;
  scene.add(packets);

  // Polvo / partículas muy sutiles
  {
    const n = low ? 120 : 380;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      arr[i * 3] = (Math.random() - 0.5) * TERRAIN_SIZE * 0.9;
      arr[i * 3 + 1] = 3 + Math.random() * 20;
      arr[i * 3 + 2] = (Math.random() - 0.5) * TERRAIN_SIZE * 0.9;
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute(arr, 3));
    scene.add(new Points(g, mDust));
  }

  // ----------------------------------------------------------- labels HTML
  const labels: SceneLabel[] = [];
  const makeLabel = (text: string, pos: Vector3, kind: SceneLabel["kind"], step: number) => {
    const el = document.createElement("div");
    el.className = `drone-label drone-label--${kind}`;
    el.setAttribute("data-hidden", "");
    const span = document.createElement("span");
    span.textContent = text;
    el.appendChild(span);
    labelsHost.appendChild(el);
    labels.push({ el, pos, kind, step });
  };
  makeLabel(DRONE_SCENE_INTRO.wp + " · H", new Vector3(W.base.x, heightAt(W.base.x, W.base.z) + 0.4, W.base.z), "base", 0);
  W.waypoints.forEach((w, i) => {
    const p = routeAt(wpU[i + 1], new Vector3());
    p.y += 0.6;
    makeLabel(DRONE_SCENE_STEPS[i]?.wp ?? `WP-0${i + 1}`, p, "wp", i + 1);
  });
  const featurePos = [
    new Vector3(lot.x - lot.w / 2, heightAt(lot.x - lot.w / 2, lot.z + lot.d / 2) + 0.3, lot.z + lot.d / 2),
    new Vector3(silo.x - 2.6, heightAt(silo.x, silo.z) + 6.2, silo.z),
    new Vector3(per.x - per.w / 2, heightAt(per.x - per.w / 2, per.z + per.d / 2) + 1.2, per.z + per.d / 2),
    new Vector3(mis.x - mis.w / 2, heightAt(mis.x - mis.w / 2, mis.z + mis.d / 2) + 0.3, mis.z + mis.d / 2),
    new Vector3(W.lidar.x + 3, heightAt(W.lidar.x + 3, W.lidar.z + 3) + 0.3, W.lidar.z + 3),
    stationTop.clone().add(new Vector3(0, 0.8, 0)),
  ];
  DRONE_SCENE_STEPS.forEach((s, i) => makeLabel(s.feature, featurePos[i] ?? new Vector3(), "feature", i + 1));
  const dronePos = new Vector3();
  makeLabel(DRONE_SCENE_UI.droneLabels.agro, dronePos, "drone", -1);
  const droneLabelEl = labels.find((l) => l.kind === "drone")?.el ?? null;

  // ------------------------------------------------------------ paleta/tema
  let bloom: DroneBloom | null = null;
  let bloomLoading = false;
  let disposed = false;
  let width = 1;
  let height = 1;

  const applyPalette = () => {
    palette = readPalette();
    const d = palette.dark;
    const glow = d ? AdditiveBlending : NormalBlending;
    (scene.background as Color).copy(palette.bg);
    fog.color.copy(palette.bg);
    const set = (m: Material & { color?: Color }, color: Color, opacity: number, blending: Blending = NormalBlending) => {
      m.color?.copy(color);
      m.opacity = opacity;
      if (m.blending !== blending) {
        m.blending = blending;
        m.needsUpdate = true;
      }
    };
    set(mGrid, palette.line, d ? 0.75 : 0.9);
    set(mContour, palette.muted, d ? 0.26 : 0.32);
    set(mContourMajor, palette.ink, d ? 0.3 : 0.4);
    set(mPlan, palette.ink, d ? 0.55 : 0.6);
    mDone.color.copy(palette.signal);
    mDone.opacity = 1;
    mDone.blending = glow;
    mDone.needsUpdate = true;
    set(mDrone, palette.ink, d ? 0.95 : 1);
    set(mRotor, palette.signal, 1, glow);
    set(mPole, palette.muted, d ? 0.6 : 0.7);
    set(mFeature, palette.ink, d ? 0.5 : 0.62);
    set(mLotGrid, palette.ink, d ? 0.28 : 0.35);
    set(mWarn, palette.warn, 1);
    set(mMissionBase, palette.muted, d ? 0.5 : 0.6);
    set(mMission, palette.signal, 1, glow);
    set(mRays, palette.signal, d ? 0.45 : 0.6, glow);
    set(mCloud, palette.signal, d ? 0.8 : 0.9, glow);
    set(mPackets, palette.signal, 1, glow);
    set(mLink, palette.signal, d ? 0.6 : 0.75, glow);
    set(mDust, palette.muted, d ? 0.35 : 0.4);
    if (mNdvi.blending !== NormalBlending) mNdvi.blending = NormalBlending;
    mNdvi.uniforms.uOpacity.value = d ? 0.42 : 0.55;
    mNdvi.uniforms.uBase.value = d ? 0.05 : 0.07;
    applyModelPalette(mm, modelLights, palette);
    paintNdvi();
    coneColorDirty = true;
    activeWpDirty = true;
    syncBloom();
  };

  const syncBloom = () => {
    const want = palette.dark && !low;
    if (!want && bloom) {
      bloom.dispose();
      bloom = null;
    } else if (want && !bloom && !bloomLoading) {
      bloomLoading = true;
      import("./bloom")
        .then(({ createDroneBloom }) => {
          bloomLoading = false;
          if (disposed || !palette.dark) return;
          bloom = createDroneBloom(renderer, scene, camera, width, height, dpr);
          wake();
        })
        .catch(() => {
          bloomLoading = false;
        });
    }
  };

  // --------------------------------------------------------------- estado
  const N = W.waypoints.length; // 6 tramos: base → WP-06
  const yaws = [W.base.yaw, ...W.waypoints.map((w) => w.yaw)];
  let fTarget = 0;
  let fCur = 0;
  let userYaw = 0;
  let userYawT = 0;
  let userPitch = 0;
  let userPitchT = 0;
  let paused = false;
  let animTime = 0;
  let visible = true;
  let active = -1;
  let sensor: DroneSensor | null = null;
  let coneAlpha = 0;
  let coneColorDirty = true;
  let activeWpDirty = true;
  let speed = 0;
  let hudClock = 0;
  const prevPos = new Vector3();
  let hasPrev = false;
  let hudAnchor = { x: 0, y: 0 };
  let isDesktop = true;

  const tmpA = new Vector3();
  const tmpB = new Vector3();
  const tmpC = new Vector3();
  const proj = new Vector3();

  const uFromF = (f: number) => {
    const i = clamp(Math.floor(f), 0, N - 1);
    const fr = clamp(f - i, 0, 1);
    return wpU[i] + (wpU[i + 1] - wpU[i]) * smooth(fr);
  };
  const yawFromF = (f: number) => {
    const i = clamp(Math.floor(f), 0, N - 1);
    const fr = smooth(clamp(f - i, 0, 1));
    return yaws[i] + (yaws[i + 1] - yaws[i]) * fr;
  };

  const setActive = (idx: number) => {
    if (idx === active) return;
    active = idx;
    stepEls.forEach((el) => {
      if (Number(el.dataset.droneStep) === idx) el.setAttribute("data-active", "true");
      else el.removeAttribute("data-active");
    });
    const step = idx > 0 ? DRONE_SCENE_STEPS[idx - 1] : null;
    if (legendWp) legendWp.textContent = step ? step.wp : DRONE_SCENE_INTRO.wp;
    if (legendTitle) legendTitle.textContent = step ? step.title : DRONE_SCENE_INTRO.title;
    if (legendSensor) legendSensor.textContent = step ? step.sensorLabel : "—";
    if (hudEls.lote) hudEls.lote.textContent = step ? step.lote : DRONE_HUD.base;
    if (hudEls.sensor) hudEls.sensor.textContent = step ? step.sensorLabel : "—";
    activeWpDirty = true;
  };

  const sensorForF = (f: number): DroneSensor | null => {
    if (f < 0.08) return null;
    const idx = clamp(Math.round(f), 1, N);
    return DRONE_SCENE_STEPS[idx - 1]?.sensor ?? null;
  };

  // ------------------------------------------------------------- tamaño
  const resize = () => {
    width = Math.max(1, stage.clientWidth);
    height = Math.max(1, stage.clientHeight);
    isDesktop = width >= 768;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.fov = isDesktop ? 40 : 52;
    if (width >= 768) camera.setViewOffset(width, height, -width * (width >= 1024 ? 0.17 : 0.14), 0, width, height);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
    mDone.resolution.set(width, height);
    bloom?.setSize(width, height, dpr);
    if (hud) {
      const s = stage.getBoundingClientRect();
      const r = hud.getBoundingClientRect();
      hudAnchor = { x: r.left - s.left, y: r.top - s.top + 16 };
    }
    {
      const s = stage.getBoundingClientRect();
      blockedRects = [hud, legendBox]
        .filter((el): el is HTMLElement => Boolean(el) && el!.offsetParent !== null)
        .map((el) => {
          const r = el.getBoundingClientRect();
          return { l: r.left - s.left - 8, t: r.top - s.top - 8, r: r.right - s.left + 8, b: r.bottom - s.top + 8 };
        });
    }
    wake();
  };

  // ---------------------------------------------------------------- update
  const update = (dt: number): boolean => {
    if (!paused) animTime += dt;
    const t = animTime;

    fCur = damp(fCur, fTarget, 3.2, dt);
    if (Math.abs(fTarget - fCur) < 1e-4) fCur = fTarget;
    userYaw = damp(userYaw, userYawT, 6, dt);
    userPitch = damp(userPitch, userPitchT, 6, dt);

    setActive(clamp(Math.round(fCur), 0, N));
    fadePanels(fTarget, isDesktop);

    // dron
    const u = uFromF(fCur);
    routeAt(u, dronePos);
    routeAt(Math.min(1, u + 0.004), tmpA);
    const heading = Math.atan2(tmpA.x - dronePos.x, tmpA.z - dronePos.z);
    if (u < 0.999) drone.rotation.y = heading;
    dronePos.y += paused ? 0 : Math.sin(t * 1.7) * 0.08;
    drone.position.copy(dronePos);
    if (hasPrev && dt > 0) {
      const inst = dronePos.distanceTo(prevPos) / dt;
      speed = damp(speed, inst, 4, dt);
    }
    prevPos.copy(dronePos);
    hasPrev = true;
    drone.rotation.x = clamp(speed * 0.04, 0, 0.22);
    drone.rotation.z = paused ? 0 : Math.sin(t * 0.9) * 0.02;
    if (!paused) rotors.forEach((r, i) => (r.rotation.y += dt * (i % 2 ? 26 : -26)));
    if (!paused) radar.spinner.rotation.y += dt * 1.1;
    // cambio de equipo entre WP-01 y WP-02
    const swap = smooth(clamp((fCur - 1.4) / 0.2, 0, 1));
    agro.group.scale.setScalar(Math.max(0.001, 1 - swap));
    insp.group.scale.setScalar(Math.max(0.001, swap));
    agro.group.visible = swap < 0.999;
    insp.group.visible = swap > 0.001;
    const kind = swap < 0.5 ? "agro" : "insp";
    if (kind !== droneKind) {
      droneKind = kind;
      const span = droneLabelEl?.querySelector("span");
      if (span) span.textContent = kind === "agro" ? DRONE_SCENE_UI.droneLabels.agro : DRONE_SCENE_UI.droneLabels.insp;
    }

    // tramo volado
    const segs = Math.max(0, Math.floor(u * (M - 1)));
    doneGeom.instanceCount = segs;

    // NDVI: se revela al pasar el dron
    mNdvi.uniforms.uT.value = u;

    // waypoints activos
    if (activeWpDirty) {
      wpMats.forEach((m, i) => {
        const on = i + 1 === active;
        const passed = wpU[i + 1] <= u + 1e-3;
        m.color.copy(on || passed ? palette.signal : palette.muted);
        m.opacity = on ? 1 : passed ? 0.75 : 0.7;
        const blend = on && palette.dark ? AdditiveBlending : NormalBlending;
        if (m.blending !== blend) {
          m.blending = blend;
          m.needsUpdate = true;
        }
      });
      activeWpDirty = false;
    }

    // sensor
    const s = sensorForF(fCur);
    if (s !== sensor) {
      if (sensor === "lidar") {
        cloudCount = 0;
        cloudHead = 0;
        cloudGeom.setDrawRange(0, 0);
      }
      sensor = s;
      coneColorDirty = true;
    }
    const usesCone = s === "multiespectral" || s === "camara" || s === "termica" || s === "mision";
    coneAlpha = damp(coneAlpha, usesCone ? 1 : 0, 5, dt);
    if (coneColorDirty) {
      const c = s === "termica" ? palette.warn : palette.signal;
      mCone.color.copy(c);
      mConeFill.color.copy(c);
      const blend = palette.dark && s !== "termica" ? AdditiveBlending : NormalBlending;
      for (const m of [mCone, mConeFill]) {
        if (m.blending !== blend) {
          m.blending = blend;
          m.needsUpdate = true;
        }
      }
      coneColorDirty = false;
    }
    mCone.opacity = coneAlpha * (palette.dark ? 0.75 : 0.9);
    mConeFill.opacity = coneAlpha * (palette.dark ? 0.07 : 0.1);
    coneLines.visible = coneFill.visible = coneAlpha > 0.01;
    if (coneLines.visible) updateCone(s, t);

    // evento térmico (perímetro)
    const evOn = active === 3;
    eventGroup.visible = evOn || (s === "termica");
    if (eventGroup.visible) {
      const k = paused ? 1 : 1 + 0.25 * Math.sin(t * 4);
      eventGroup.scale.set(k, 1, k);
    }

    // misión: el plan se dibuja en loop mientras está activo
    if (s === "mision") {
      const p = paused ? 1 : (t * 0.22) % 1.15;
      missionLine.geometry.setDrawRange(0, Math.floor(clamp(p, 0, 1) * missionCount));
    } else {
      missionLine.geometry.setDrawRange(0, 0);
    }

    // LiDAR
    rays.visible = s === "lidar";
    if (rays.visible) updateLidar(t, !paused);
    cloud.visible = cloudCount > 0;

    // enlace a la estación
    const linkOn = s === "enlace";
    link3d.visible = packets.visible = linkOn;
    if (linkOn) {
      const lp = linkGeom.getAttribute("position") as Float32BufferAttribute;
      lp.setXYZ(0, dronePos.x, dronePos.y - 0.4, dronePos.z);
      lp.setXYZ(1, stationTop.x, stationTop.y, stationTop.z);
      lp.needsUpdate = true;
      link3d.computeLineDistances();
      const pp = packetsGeom.getAttribute("position") as Float32BufferAttribute;
      for (let i = 0; i < PACKETS; i++) {
        const k = (t * 0.45 + i / PACKETS) % 1;
        tmpB.set(dronePos.x, dronePos.y - 0.4, dronePos.z).lerp(stationTop, k);
        pp.setXYZ(i, tmpB.x, tmpB.y, tmpB.z);
      }
      pp.needsUpdate = true;
    }

    // cámara (órbita propia con límites + damping)
    const yaw = yawFromF(fCur) + userYaw;
    const pitch = clamp((isDesktop ? 0.58 : 0.66) + userPitch, 0.22, 1.25);
    const dist = isDesktop ? 25 : 31;
    tmpC.set(dronePos.x, dronePos.y - 2.2, dronePos.z);
    camera.position.set(
      tmpC.x + Math.sin(yaw) * Math.cos(pitch) * dist,
      tmpC.y + Math.sin(pitch) * dist,
      tmpC.z + Math.cos(yaw) * Math.cos(pitch) * dist
    );
    const ground = heightAt(camera.position.x, camera.position.z) + 2;
    if (camera.position.y < ground) camera.position.y = ground;
    camera.lookAt(tmpC);

    // HUD (~8 Hz)
    hudClock += dt;
    if (hudClock > 0.12) {
      hudClock = 0;
      updateHud(u, t);
    }

    const moving =
      Math.abs(fTarget - fCur) > 1e-4 ||
      Math.abs(userYawT - userYaw) > 1e-4 ||
      Math.abs(userPitchT - userPitch) > 1e-4 ||
      dragging ||
      Math.abs(coneAlpha - (usesCone ? 1 : 0)) > 0.01 ||
      speed > 0.01;
    return moving;
  };

  const updateCone = (s: DroneSensor | null, t: number) => {
    const lp = coneLineGeom.getAttribute("position") as Float32BufferAttribute;
    const fp = coneFillGeom.getAttribute("position") as Float32BufferAttribute;
    const apex = tmpA.set(dronePos.x, dronePos.y - 0.55, dronePos.z);
    let v = 0;
    const push = (x: number, y: number, z: number) => lp.setXYZ(v++, x, y, z);
    let f = 0;
    const tri = (a: Vector3, bx: number, by: number, bz: number, cx: number, cy: number, cz: number) => {
      fp.setXYZ(f++, a.x, a.y, a.z);
      fp.setXYZ(f++, bx, by, bz);
      fp.setXYZ(f++, cx, cy, cz);
    };
    if (s === "camara") {
      // frustum rectangular apuntando a los silos
      const dir = tmpB.copy(siloTarget).sub(apex);
      const len = dir.length();
      dir.normalize();
      const right = tmpC.set(dir.z, 0, -dir.x).normalize();
      const up = new Vector3().crossVectors(right, dir).normalize();
      const w = len * 0.2;
      const h = len * 0.13;
      const cs = [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, 1],
      ].map(([a, b]) => new Vector3().copy(siloTarget).addScaledVector(right, a * w).addScaledVector(up, b * h));
      for (let k = 0; k < 4; k++) {
        const p = cs[k];
        const q = cs[(k + 1) % 4];
        push(p.x, p.y, p.z);
        push(q.x, q.y, q.z);
        push(apex.x, apex.y, apex.z);
        push(p.x, p.y, p.z);
        tri(apex, p.x, p.y, p.z, q.x, q.y, q.z);
      }
      // marco interior que "enfoca"
      const sc = paused ? 0.6 : 0.45 + 0.25 * ((Math.sin(t * 2) + 1) / 2);
      for (let k = 0; k < 4; k++) {
        const p = tmpB.copy(cs[k]).sub(siloTarget).multiplyScalar(sc).add(siloTarget);
        const q = new Vector3().copy(cs[(k + 1) % 4]).sub(siloTarget).multiplyScalar(sc).add(siloTarget);
        push(p.x, p.y, p.z);
        push(q.x, q.y, q.z);
      }
    } else {
      // cono circular sobre el terreno
      const ground = tmpB.set(dronePos.x, 0, dronePos.z);
      if (s === "termica") ground.lerp(tmpC.set(eventPos.x, 0, eventPos.z), 0.45);
      const altAGL = Math.max(2, dronePos.y - heightAt(ground.x, ground.z));
      const R = altAGL * (s === "multiespectral" ? 0.5 : s === "termica" ? 0.34 : 0.24);
      const ringPt = (a: number, r: number) => {
        const x = ground.x + Math.cos(a) * r;
        const z = ground.z + Math.sin(a) * r;
        return [x, heightAt(x, z) + 0.12, z] as const;
      };
      const scan = paused ? 0.65 : (t * 0.55) % 1;
      for (let i = 0; i < CONE_N; i++) {
        const a0 = (i / CONE_N) * Math.PI * 2;
        const a1 = ((i + 1) / CONE_N) * Math.PI * 2;
        const p = ringPt(a0, R);
        const q = ringPt(a1, R);
        push(p[0], p[1], p[2]);
        push(q[0], q[1], q[2]);
        tri(apex, p[0], p[1], p[2], q[0], q[1], q[2]);
        const ps = ringPt(a0, R * scan);
        const qs = ringPt(a1, R * scan);
        push(ps[0], ps[1], ps[2]);
        push(qs[0], qs[1], qs[2]);
      }
      for (let k = 0; k < 4; k++) {
        const p = ringPt((k / 4) * Math.PI * 2 + 0.4, R);
        push(apex.x, apex.y, apex.z);
        push(p[0], p[1], p[2]);
      }
    }
    lp.needsUpdate = true;
    fp.needsUpdate = true;
    coneLineGeom.setDrawRange(0, v);
    coneFillGeom.setDrawRange(0, f);
  };

  const updateLidar = (t: number, accumulate: boolean) => {
    const rp = raysGeom.getAttribute("position") as Float32BufferAttribute;
    const cp = cloudGeom.getAttribute("position") as Float32BufferAttribute;
    const spin = t * 1.6;
    const ox = dronePos.x;
    const oy = dronePos.y - 0.5;
    const oz = dronePos.z;
    for (let i = 0; i < RAYS; i++) {
      const tilt = -1.0 + (i / (RAYS - 1)) * 2.0; // -57° … +57° desde la vertical
      const dx = Math.sin(tilt) * Math.cos(spin);
      const dz = Math.sin(tilt) * Math.sin(spin);
      const dy = -Math.cos(tilt);
      let hx = ox;
      let hy = oy;
      let hz = oz;
      for (let s = 0.5; s < 40; s += 0.5) {
        hx = ox + dx * s;
        hy = oy + dy * s;
        hz = oz + dz * s;
        if (hy <= heightAt(hx, hz)) break;
      }
      rp.setXYZ(i * 2, ox, oy, oz);
      rp.setXYZ(i * 2 + 1, hx, hy, hz);
      if (accumulate && i % 2 === 0) {
        cp.setXYZ(cloudHead, hx, heightAt(hx, hz) + 0.05, hz);
        cloudHead = (cloudHead + 1) % CLOUD;
        cloudCount = Math.min(CLOUD, cloudCount + 1);
      }
    }
    rp.needsUpdate = true;
    cp.needsUpdate = true;
    cloudGeom.setDrawRange(0, cloudCount);
  };

  const fmtCoord = (deg: number, minutes: number, hemi: string) => {
    let d = deg;
    let m = minutes;
    while (m >= 60) {
      m -= 60;
      d += 1;
    }
    while (m < 0) {
      m += 60;
      d -= 1;
    }
    return `${d}°${m.toFixed(2).padStart(5, "0")}′${hemi}`;
  };

  const updateHud = (u: number, t: number) => {
    const agl = (dronePos.y - heightAt(dronePos.x, dronePos.z)) * 10;
    const hover = paused ? 0 : 0.2 + 0.15 * Math.sin(t * 2.3);
    const vel = clamp(speed * 10 * 0.35 + (u > 0.01 && u < 0.999 ? hover : 0), 0, 18);
    const bat = 100 - 34 * u - 0.4 * Math.min(1, t / 60);
    const sd = Math.hypot(dronePos.x - st.x, dronePos.z - st.z);
    const linkQ = clamp(99 - sd * 0.45, 61, 99);
    if (hudEls.alt) hudEls.alt.textContent = `${agl.toFixed(0)} ${DRONE_HUD.units.alt}`;
    if (hudEls.vel) hudEls.vel.textContent = `${vel.toFixed(1)} ${DRONE_HUD.units.vel}`;
    if (hudEls.bat) {
      hudEls.bat.textContent = `${bat.toFixed(0)} ${DRONE_HUD.units.bat}`;
      hudEls.bat.toggleAttribute("data-warn", bat < 70);
    }
    if (hudEls.link) hudEls.link.textContent = `${linkQ.toFixed(0)} ${DRONE_HUD.units.link}`;
    if (hudEls.pos) {
      const lat = fmtCoord(32, 41 + (dronePos.z * 10) / 1852, "S");
      const lon = fmtCoord(58, 53 - (dronePos.x * 10) / 1558, "O");
      hudEls.pos.textContent = `${lat} ${lon}`;
    }
  };

  // ---------------------------------------------------- labels + enlace HUD
  const placeLabels = () => {
    for (const l of labels) {
      proj.copy(l.pos).project(camera);
      const x = (proj.x * 0.5 + 0.5) * width;
      const y = (-proj.y * 0.5 + 0.5) * height;
      const off = proj.z > 1 || x < -20 || x > width + 20 || y < 40 || y > height - 10;
      let show = !off;
      if (show && l.kind !== "drone") {
        // un label que arranca debajo del HUD o de la leyenda se oculta
        for (const b of blockedRects) {
          if (x >= b.l - 120 && x <= b.r && y >= b.t && y <= b.b) {
            show = false;
            break;
          }
        }
      }
      if (l.kind === "feature") show = show && l.step === active;
      if (show) {
        const dx = l.kind === "drone" ? (isDesktop ? 52 : 30) : 6;
        l.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(${dx - 2}px, -50%)`;
        l.el.removeAttribute("data-hidden");
      } else {
        l.el.setAttribute("data-hidden", "");
      }
      if (l.kind === "wp") l.el.toggleAttribute("data-active", l.step === active);
    }
    if (linkPath && linkTip) {
      proj.copy(dronePos).project(camera);
      const dx = (proj.x * 0.5 + 0.5) * width;
      const dy = (-proj.y * 0.5 + 0.5) * height;
      const ax = hudAnchor.x;
      const ay = hudAnchor.y;
      if (proj.z > 1 || !hud) {
        linkPath.setAttribute("d", "");
        linkTip.setAttribute("x", "-10");
      } else {
        const midX = dx < ax ? Math.max(dx + 8, ax - 28) : ax - 28;
        linkPath.setAttribute("d", `M${dx.toFixed(1)} ${dy.toFixed(1)}H${midX.toFixed(1)}V${ay.toFixed(1)}H${ax.toFixed(1)}`);
        linkPath.style.strokeDashoffset = String((-animTime * 26).toFixed(1));
        linkTip.setAttribute("x", (dx - 2.5).toFixed(1));
        linkTip.setAttribute("y", (dy - 2.5).toFixed(1));
      }
    }
  };

  // ------------------------------------------------------------------ loop
  let raf = 0;
  let last = 0;
  const frame = (now: number) => {
    raf = 0;
    // tope de 0.1 s: en equipos lentos la escena alcanza al scroll sin saltos grandes
    const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
    last = now;
    const moving = update(dt);
    if (bloom) bloom.render();
    else renderer.render(scene, camera);
    placeLabels();
    if (visible && !document.hidden && (!paused || moving)) raf = requestAnimationFrame(frame);
  };
  const wake = () => {
    if (disposed || raf || !visible || document.hidden) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };
  const sleep = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };

  // ----------------------------------------------------------- interacción
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let pointerId = -1;
  const onDown = (e: PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    dragging = true;
    pointerId = e.pointerId;
    lastX = e.clientX;
    lastY = e.clientY;
    try {
      host.setPointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
    stage.dataset.dragging = "true";
    wake();
  };
  const onMove = (e: PointerEvent) => {
    if (!dragging || e.pointerId !== pointerId) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    userYawT = clamp(userYawT - dx * 0.0065, -1.5, 1.5);
    // en touch el gesto vertical es scroll (touch-action: pan-y): solo rota en horizontal
    if (e.pointerType === "mouse" || e.pointerType === "pen") userPitchT = clamp(userPitchT + dy * 0.004, -0.35, 0.6);
    wake();
  };
  const onUp = (e: PointerEvent) => {
    if (e.pointerId !== pointerId) return;
    dragging = false;
    pointerId = -1;
    delete stage.dataset.dragging;
    wake();
  };
  host.addEventListener("pointerdown", onDown);
  host.addEventListener("pointermove", onMove);
  host.addEventListener("pointerup", onUp);
  host.addEventListener("pointercancel", onUp);

  const onPause = () => {
    paused = !paused;
    root.dataset.paused = String(paused);
    pauseBtn?.setAttribute("aria-pressed", String(paused));
    const label = paused ? pauseBtn?.dataset.labelPlay : pauseBtn?.dataset.labelPause;
    if (pauseLabel && label) pauseLabel.textContent = label;
    wake();
  };
  pauseBtn?.addEventListener("click", onPause);

  const trigger = ScrollTrigger.create({
    trigger: root,
    start: () => `top ${parseFloat(getComputedStyle(stage).top) || 53}px`,
    end: "bottom bottom",
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      fTarget = self.progress * N;
      wake();
    },
  });
  fTarget = trigger.progress * N;
  fCur = fTarget;

  const io = new IntersectionObserver(
    (entries) => {
      visible = entries.some((e) => e.isIntersecting);
      if (visible) wake();
      else sleep();
    },
    { rootMargin: "100px 0px" }
  );
  io.observe(stage);

  const onVisibility = () => {
    if (document.hidden) sleep();
    else wake();
  };
  document.addEventListener("visibilitychange", onVisibility);

  const ro = new ResizeObserver(() => resize());
  ro.observe(stage);

  const mo = new MutationObserver(() => {
    applyPalette();
    wake();
  });
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  applyPalette();
  resize();
  ScrollTrigger.refresh();
  wake();

  return {
    dispose() {
      if (disposed) return;
      disposed = true;
      sleep();
      trigger.kill();
      io.disconnect();
      ro.disconnect();
      mo.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      host.removeEventListener("pointerdown", onDown);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerup", onUp);
      host.removeEventListener("pointercancel", onUp);
      pauseBtn?.removeEventListener("click", onPause);
      bloom?.dispose();
      bloom = null;
      const geoms = new Set<BufferGeometry>();
      const mats = new Set<Material>();
      scene.traverse((obj) => {
        const o = obj as Object3D & { geometry?: BufferGeometry; material?: Material | Material[] };
        if (o.geometry) geoms.add(o.geometry);
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => mats.add(m));
      });
      geoms.forEach((g) => g.dispose());
      mats.forEach((m) => m.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
      labels.forEach((l) => l.el.remove());
      linkPath?.setAttribute("d", "");
    },
  };
}
