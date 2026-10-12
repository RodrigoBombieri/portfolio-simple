/**
 * Escena 3D del hero — "Sistema vivo en wireframe".
 *
 * Nodos en wireframe (LineSegments2, grosor real), aristas con pulsos de datos
 * (shader: fase por arista + offset por pulso), labels HTML proyectados con
 * Vector3.project, plano de retícula con FogExp2 y partículas sutiles.
 * Este módulo (y Three) se carga solo con import dinámico desde initScene.ts.
 */
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  FogExp2,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  BoxGeometry,
  NormalBlending,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Ray,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderer,
  type InterleavedBufferAttribute,
} from "three";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SCENE_NODES, SCENE_EDGES, type SceneNode } from "@data/scene";
import { shapeSegments } from "./shapes";
import type { Bloom } from "./bloom";

gsap.registerPlugin(ScrollTrigger);

export interface SystemSceneHandle {
  dispose(): void;
}

interface Palette {
  dark: boolean;
  bg: Color;
  ink: Color;
  muted: Color;
  line: Color;
  signal: Color;
  signalDim: Color;
}

interface NodeRuntime {
  data: SceneNode;
  index: number;
  group: Group;
  material: LineMaterial;
  home: Vector3;
  scatter: Vector3;
  scatterRot: Vector3;
  t: number;
  hover: number;
  label: HTMLElement;
  labelW: number;
  core?: Mesh;
}

const PULSES_PER_EDGE = 2;
const TRAIL = 4;
const MAX_EDGES = 8;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** PRNG determinista (mismo "despiece" en cada visita) */
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function readPalette(): Palette {
  const css = getComputedStyle(document.documentElement);
  const dark = document.documentElement.getAttribute("data-theme") !== "light";
  const tok = (name: string, fallback: string) => new Color(css.getPropertyValue(name).trim() || fallback);
  return {
    dark,
    bg: tok("--color-bg", dark ? "#0a0c0b" : "#f2f1ec"),
    ink: tok("--color-ink", dark ? "#e8ede9" : "#121513"),
    muted: tok("--color-muted", dark ? "#8a968e" : "#5c625e"),
    line: tok("--color-line", dark ? "#26302a" : "#c9c8bf"),
    signal: tok("--color-signal", dark ? "#8cff5a" : "#1e7f2e"),
    signalDim: tok("--color-signal-dim", dark ? "#4fae34" : "#3e9a4c"),
  };
}

const PULSE_VERT = /* glsl */ `
  #define MAX_EDGES ${MAX_EDGES}
  uniform vec3 uA[MAX_EDGES];
  uniform vec3 uB[MAX_EDGES];
  uniform float uPhase[MAX_EDGES];
  uniform float uDraw[MAX_EDGES];
  uniform float uSize;
  attribute float aEdge;
  attribute float aOffset;
  attribute float aTrail;
  varying float vAlpha;
  void main() {
    int e = int(aEdge + 0.5);
    float p = fract(uPhase[e] + aOffset - aTrail * 0.016);
    vec3 pos = mix(uA[e], uB[e], p);
    // solo sobre el tramo ya dibujado; entra y sale suave en los extremos
    float vis = step(p, uDraw[e]) * smoothstep(0.0, 0.05, p) * (1.0 - smoothstep(0.95, 1.0, p));
    vAlpha = vis * (1.0 - aTrail / ${TRAIL.toFixed(1)});
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * (1.0 - aTrail * 0.17);
  }
`;

const PULSE_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlpha;
  void main() {
    float a = vAlpha * uOpacity;
    if (a < 0.01) discard;
    gl_FragColor = vec4(uColor, a);
    #include <colorspace_fragment>
  }
`;

export function createSystemScene(mount: HTMLElement): SystemSceneHandle | null {
  const hero = (mount.closest("section") as HTMLElement | null) ?? mount;
  const services = document.getElementById("servicios");

  const coarse = window.matchMedia("(hover: none)").matches;
  const cores = navigator.hardwareConcurrency || 8;
  const lowTier = cores <= 4 || window.innerWidth < 768;
  const maxDpr = lowTier ? 1.5 : 2;
  let dpr = Math.min(window.devicePixelRatio || 1, maxDpr);

  // ---------- Escenario fijo (canvas + capa de labels) ----------
  const stage = document.createElement("div");
  stage.className = "scene-stage";
  const labelsLayer = document.createElement("div");
  labelsLayer.className = "scene-labels";

  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: lowTier ? "low-power" : "high-performance" });
  } catch {
    return null;
  }
  if (!renderer.getContext()) return null;

  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.setAttribute("aria-hidden", "true");
  canvas.setAttribute("role", "presentation");
  stage.append(canvas, labelsLayer);
  mount.append(stage);

  let width = stage.clientWidth || window.innerWidth;
  let height = stage.clientHeight || window.innerHeight;
  renderer.setSize(width, height, false);

  const scene = new Scene();
  let palette = readPalette();
  scene.fog = new FogExp2(palette.bg.getHex(), 0.034);

  const camera = new PerspectiveCamera(30, width / height, 0.1, 120);
  const target = new Vector3(0, -0.2, 0);

  // ---------- Sistema ----------
  const system = new Group();
  scene.add(system);

  const nodesData = SCENE_NODES.filter((n) => !(lowTier && n.optional));
  const center = new Vector3();
  nodesData.forEach((n) => center.add(new Vector3(...n.position)));
  center.divideScalar(Math.max(1, nodesData.length));

  const rand = rng(20261011);
  const nodes: NodeRuntime[] = nodesData.map((data, index) => {
    const geo = new LineSegmentsGeometry();
    geo.setPositions(shapeSegments(data.shape, data.size));
    const material = new LineMaterial({ linewidth: 1.25, transparent: true, depthWrite: false, fog: true });
    const lines = new LineSegments2(geo, material);
    const group = new Group();
    group.add(lines);

    let core: Mesh | undefined;
    if (data.accent) {
      core = new Mesh(new BoxGeometry(data.size * 0.14, data.size * 0.14, data.size * 0.14), new MeshBasicMaterial({ transparent: true }));
      group.add(core);
    }
    system.add(group);

    const home = new Vector3(...data.position);
    const dir = home.clone().sub(center);
    if (dir.lengthSq() < 0.01) dir.set(0.3, 1, 0.2);
    dir.normalize();
    // Despiece: las piezas se abren hacia atrás (profundidad, niebla) y hacia la
    // derecha/abajo, lejos del titular, en vez de invadir el texto.
    const scatter = home
      .clone()
      .add(new Vector3(Math.abs(dir.x) * 1.6 + 3.6 + rand() * 1.4, dir.y * 0.9 - 2.6 - rand() * 1.4, -3 - rand() * 5));
    const scatterRot = new Vector3((rand() - 0.5) * 1.8, (rand() - 0.5) * 2.4, (rand() - 0.5) * 1.6);

    const label = document.createElement("div");
    label.className = "scene-label mono-label-sm";
    if (data.accent) label.dataset.accent = "";
    label.innerHTML = `<span class="scene-label-line"></span><span class="scene-label-body"><span class="scene-label-text"></span><span class="scene-label-note"></span></span>`;
    (label.querySelector(".scene-label-text") as HTMLElement).textContent = data.label;
    (label.querySelector(".scene-label-note") as HTMLElement).textContent = data.note;
    labelsLayer.append(label);

    return { data, index, group, material, home, scatter, scatterRot, t: 0, hover: 0, label, labelW: 0, core };
  });
  const byId = new Map(nodes.map((n) => [n.data.id, n]));

  // ---------- Aristas ----------
  const edges = SCENE_EDGES.filter((e) => byId.has(e.from) && byId.has(e.to)).slice(0, MAX_EDGES);
  const edgeGeo = new LineSegmentsGeometry();
  edgeGeo.setPositions(new Float32Array(Math.max(1, edges.length) * 6));
  const edgeMat = new LineMaterial({ linewidth: 1, transparent: true, depthWrite: false, fog: true, dashed: false });
  const edgeLines = new LineSegments2(edgeGeo, edgeMat);
  edgeLines.frustumCulled = false;
  scene.add(edgeLines);
  const edgeStart = edgeGeo.attributes.instanceStart as InterleavedBufferAttribute;
  const edgeBuffer = edgeStart.data;

  const edgeState = edges.map((_, j) => ({ phase: (j * 0.37) % 1, speed: 0.16 + (j % 3) * 0.035, boost: 1, draw: 0 }));

  // Pulsos: puntos cuadrados con estela, posición calculada en el shader
  const pulseCount = edges.length * PULSES_PER_EDGE * TRAIL;
  const aEdge = new Float32Array(pulseCount);
  const aOffset = new Float32Array(pulseCount);
  const aTrail = new Float32Array(pulseCount);
  let k = 0;
  for (let j = 0; j < edges.length; j++) {
    for (let p = 0; p < PULSES_PER_EDGE; p++) {
      for (let t = 0; t < TRAIL; t++) {
        aEdge[k] = j;
        aOffset[k] = p / PULSES_PER_EDGE + j * 0.11;
        aTrail[k] = t;
        k++;
      }
    }
  }
  const pulseGeo = new BufferGeometry();
  pulseGeo.setAttribute("position", new Float32BufferAttribute(new Float32Array(pulseCount * 3), 3));
  pulseGeo.setAttribute("aEdge", new Float32BufferAttribute(aEdge, 1));
  pulseGeo.setAttribute("aOffset", new Float32BufferAttribute(aOffset, 1));
  pulseGeo.setAttribute("aTrail", new Float32BufferAttribute(aTrail, 1));
  const uA = Array.from({ length: MAX_EDGES }, () => new Vector3());
  const uB = Array.from({ length: MAX_EDGES }, () => new Vector3());
  const pulseMat = new ShaderMaterial({
    vertexShader: PULSE_VERT,
    fragmentShader: PULSE_FRAG,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uA: { value: uA },
      uB: { value: uB },
      uPhase: { value: new Array(MAX_EDGES).fill(0) },
      uDraw: { value: new Array(MAX_EDGES).fill(0) },
      uSize: { value: 4 * dpr },
      uColor: { value: new Color() },
      uOpacity: { value: 1 },
    },
  });
  const pulses = new Points(pulseGeo, pulseMat);
  pulses.frustumCulled = false;
  scene.add(pulses);

  // ---------- Plano de retícula (se pierde en la niebla) ----------
  const floorY = -3.7;
  const minor: number[] = [];
  const major: number[] = [];
  const EXT = 44;
  for (let i = -EXT; i <= EXT; i++) {
    const arr = i % 4 === 0 ? major : minor;
    arr.push(i, floorY, -EXT, i, floorY, EXT * 0.5);
    if (i <= EXT * 0.5) arr.push(-EXT, floorY, i, EXT, floorY, i);
  }
  const mkGrid = (pts: number[]) => {
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute(pts, 3));
    const m = new LineBasicMaterial({ transparent: true, depthWrite: false });
    return new LineSegments(g, m);
  };
  const gridMinor = mkGrid(minor);
  const gridMajor = mkGrid(major);
  scene.add(gridMinor, gridMajor);

  // ---------- Partículas (polvo de medición) ----------
  const particleCount = lowTier ? 140 : 420;
  const pp = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    pp[i * 3] = (rand() - 0.5) * 46;
    pp[i * 3 + 1] = floorY + 0.4 + rand() * 14;
    pp[i * 3 + 2] = -30 + rand() * 36;
  }
  const partGeo = new BufferGeometry();
  partGeo.setAttribute("position", new Float32BufferAttribute(pp, 3));
  const partMat = new PointsMaterial({ size: 1.4 * dpr, sizeAttenuation: false, transparent: true, depthWrite: false });
  const particles = new Points(partGeo, partMat);
  scene.add(particles);

  // ---------- Tema ----------
  let bloom: Bloom | null = null;
  let bloomLoading = false;
  let disposed = false;
  const wantBloom = () => palette.dark && !lowTier && !coarse;

  function applyPalette(): void {
    palette = readPalette();
    const d = palette.dark;
    (scene.fog as FogExp2).color.copy(palette.bg);
    nodes.forEach((n) => {
      n.material.blending = NormalBlending;
      n.material.needsUpdate = true;
    });
    edgeMat.color.copy(palette.muted);
    edgeMat.opacity = d ? 0.5 : 0.55;
    pulseMat.uniforms.uColor.value.copy(palette.signal);
    // Oscuro: fósforo aditivo. Claro: tinta sobre papel, sin blending aditivo.
    pulseMat.blending = d ? AdditiveBlending : NormalBlending;
    pulseMat.needsUpdate = true;
    (gridMinor.material as LineBasicMaterial).color.copy(palette.ink);
    (gridMinor.material as LineBasicMaterial).opacity = d ? 0.045 : 0.07;
    (gridMajor.material as LineBasicMaterial).color.copy(palette.ink);
    (gridMajor.material as LineBasicMaterial).opacity = d ? 0.1 : 0.14;
    partMat.color.copy(d ? palette.ink : palette.muted);
    partMat.opacity = d ? 0.32 : 0.4;
    nodes.forEach((n) => {
      if (n.core) {
        const m = n.core.material as MeshBasicMaterial;
        m.color.copy(palette.signal);
        m.blending = d ? AdditiveBlending : NormalBlending;
        m.needsUpdate = true;
      }
    });

    if (wantBloom() && !bloom && !bloomLoading) {
      bloomLoading = true;
      import("./bloom")
        .then(({ createBloom }) => {
          if (disposed) return;
          bloom = createBloom(renderer, scene, camera, width, height, dpr);
        })
        .catch(() => {
          /* sin bloom: se sigue renderizando directo */
        })
        .finally(() => {
          bloomLoading = false;
          requestRender();
        });
    }
    requestRender();
  }

  // ---------- Estado / coreografía ----------
  const state = { intro: 0, scroll: 0, dolly: 0, out: 0, reveal: 0 };
  const baseOpacity = lowTier ? 0.6 : 0.92;

  const tweens: gsap.core.Tween[] = [];
  tweens.push(gsap.to(state, { intro: 1, duration: 2.6, ease: "power2.out" }));
  tweens.push(gsap.to(state, { reveal: 1, duration: 1.4, ease: "power1.out" }));

  const triggers: ScrollTrigger[] = [];
  triggers.push(
    ScrollTrigger.create({
      trigger: hero,
      start: "top top",
      end: "bottom top",
      scrub: 0.8,
      onUpdate: (self) => {
        state.scroll = self.progress;
        requestRender();
      },
    })
  );
  const afterHero = services ?? hero;
  triggers.push(
    ScrollTrigger.create({
      trigger: afterHero,
      start: services ? "top 45%" : "bottom 60%",
      end: services ? "top 5%" : "bottom top",
      scrub: 1,
      onUpdate: (self) => {
        state.dolly = self.progress;
        requestRender();
      },
    })
  );
  triggers.push(
    ScrollTrigger.create({
      trigger: afterHero,
      start: services ? "bottom 80%" : "bottom 20%",
      end: services ? "bottom 20%" : "bottom top",
      scrub: 0.6,
      onUpdate: (self) => {
        state.out = self.progress;
        updateRunning();
      },
    })
  );

  // ---------- Entrada: mouse / touch / hover ----------
  const pointer = new Vector2(0, 0);
  const pointerNdc = new Vector2(-10, -10);
  let pointerActive = false;
  const look = { x: 0, y: 0, tx: 0, ty: 0 };
  const MAX_TILT = (4 * Math.PI) / 180;

  const blockHoverSel = "a, button, h1, p, dl, ul, .sheet, input, textarea, select, label";
  function onPointerMove(e: PointerEvent): void {
    if (e.pointerType === "touch") return;
    pointer.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
    look.tx = -pointer.x * MAX_TILT;
    look.ty = pointer.y * MAX_TILT * 0.7;
    const tgt = e.target as Element | null;
    pointerActive = !(tgt && tgt.closest && tgt.closest(blockHoverSel));
    const r = canvas.getBoundingClientRect();
    pointerNdc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  }
  function onPointerLeave(): void {
    pointerActive = false;
    look.tx = 0;
    look.ty = 0;
  }
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  document.documentElement.addEventListener("pointerleave", onPointerLeave);

  // ---------- Zonas de texto a respetar (labels no se superponen) ----------
  let avoid: { l: number; t: number; r: number; b: number }[] = [];
  function measureAvoid(): void {
    const sy = window.scrollY;
    avoid = Array.from(hero.querySelectorAll<HTMLElement>("h1, p, a, ul, .sheet, [data-animate]"))
      .map((el) => el.getBoundingClientRect())
      .filter((r) => r.width > 0 && r.height > 0)
      .map((r) => ({ l: r.left - 12, t: r.top + sy - 10, r: r.right + 12, b: r.bottom + sy + 10 }));
    nodes.forEach((n) => (n.labelW = (n.label.querySelector(".scene-label-text") as HTMLElement).offsetWidth + 24));
  }

  // ---------- Layout / tamaño ----------
  let layoutScale = 1;
  let layoutX = 0;
  let layoutY = 0;
  let layoutRise = 0;
  function layout(): void {
    const aspect = width / height;
    camera.aspect = aspect;
    if (width < 768) {
      layoutScale = 0.62;
      layoutX = 0.1;
      layoutY = -1.0;
      layoutRise = 2.2;
    } else if (width < 1024) {
      layoutScale = 0.8;
      layoutX = 0.4;
      layoutY = -0.9;
      layoutRise = 2.4;
    } else {
      layoutScale = Math.min(1.0, Math.max(0.85, aspect / 1.7));
      layoutX = 2.6;
      layoutY = -0.7;
      layoutRise = 2.8;
    }
    system.scale.setScalar(layoutScale);
    system.position.set(layoutX, layoutY, 0);
    camera.updateProjectionMatrix();
  }

  function resize(): void {
    const w = stage.clientWidth || window.innerWidth;
    const h = stage.clientHeight || window.innerHeight;
    // En touch, ignorar cambios menores de alto (barra de URL que aparece/desaparece)
    if (coarse && w === width && Math.abs(h - height) < 160) return;
    width = w;
    height = h;
    dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    pulseMat.uniforms.uSize.value = 4 * dpr;
    partMat.size = 1.4 * dpr;
    bloom?.setSize(width, height, dpr);
    layout();
    measureAvoid();
    requestRender();
  }
  let resizeRaf = 0;
  const onResize = () => {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(resize);
  };
  window.addEventListener("resize", onResize, { passive: true });

  // ---------- Loop ----------
  const tmp = new Vector3();
  const tmpB = new Vector3();
  const ray = new Ray();
  let hovered: NodeRuntime | null = null;
  let raf = 0;
  let last = performance.now();
  let elapsed = 0;
  let pageVisible = document.visibilityState === "visible";
  let inView = true;
  let needsRender = true;
  let currentOpacity = -1;

  function stageOpacity(): number {
    return baseOpacity * state.reveal * lerp(1, 0.25, ease(state.dolly)) * (1 - state.out);
  }

  function pickHover(): NodeRuntime | null {
    if (!pointerActive || state.dolly > 0.4 || coarse) return null;
    camera.updateMatrixWorld();
    ray.origin.setFromMatrixPosition(camera.matrixWorld);
    ray.direction.set(pointerNdc.x, pointerNdc.y, 0.5).unproject(camera).sub(ray.origin).normalize();
    let best: NodeRuntime | null = null;
    let bestD = Infinity;
    for (const n of nodes) {
      if (n.t < 0.85) continue;
      n.group.getWorldPosition(tmp);
      const r = n.data.size * 0.8 * layoutScale;
      if (ray.distanceSqToPoint(tmp) < r * r) {
        const d = tmp.distanceTo(ray.origin);
        if (d < bestD) {
          bestD = d;
          best = n;
        }
      }
    }
    return best;
  }

  function frame(now: number): void {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    elapsed += dt;

    // Armado: 40% con la intro (se lee desde el primer frame), el resto con el
    // scroll de la primera mitad del hero
    const heroP = clamp01(state.scroll / 0.5);
    const build = clamp01(0.4 * state.intro + 0.6 * heroP);
    // Al cargar, el sistema "asoma" abajo (debajo del titular y la ficha) y sube
    // al centro mientras el contenido del hero se va: nunca compite con el texto.
    system.position.y = layoutY - (1 - ease(heroP)) * layoutRise;

    // Cámara: órbita + parallax (lerp) + dolly hacia atrás al pasar el hero
    if (coarse) {
      look.tx = Math.sin(elapsed * 0.13) * MAX_TILT * 0.6;
      look.ty = Math.sin(elapsed * 0.09) * MAX_TILT * 0.3;
    }
    look.x += (look.tx - look.x) * Math.min(1, dt * 3);
    look.y += (look.ty - look.y) * Math.min(1, dt * 3);
    const yaw = -0.2 + look.x;
    const pitch = 0.14 + look.y + state.dolly * 0.05;
    const radius = 17 + ease(state.dolly) * 8;
    camera.position.set(
      target.x + Math.sin(yaw) * Math.cos(pitch) * radius,
      target.y + Math.sin(pitch) * radius,
      target.z + Math.cos(yaw) * Math.cos(pitch) * radius
    );
    camera.lookAt(target);
    camera.updateMatrixWorld();

    hovered = pickHover();

    // Nodos: del despiece a su lugar (stagger) + vida mínima
    const d = palette.dark;
    nodes.forEach((n, i) => {
      n.t = ease(clamp01((build - i * 0.05) / 0.62));
      const s = n.t;
      n.group.position.lerpVectors(n.scatter, n.home, s);
      n.group.position.y += Math.sin(elapsed * 0.55 + i * 1.7) * 0.05 * s;
      n.group.rotation.set(n.scatterRot.x * (1 - s), n.scatterRot.y * (1 - s) + elapsed * 0.12 * (i % 2 ? 1 : -1), n.scatterRot.z * (1 - s));
      n.group.scale.setScalar(lerp(0.8, 1, s));
      n.hover += ((hovered === n ? 1 : 0) - n.hover) * Math.min(1, dt * 8);

      const base = n.data.accent ? palette.signal : palette.ink;
      n.material.color.copy(base).lerp(palette.signal, n.hover);
      // despiezado = casi un susurro (no compite con el titular); armado = trazo pleno
      n.material.opacity = lerp(0.06, n.data.accent ? 0.95 : d ? 0.58 : 0.62, s * s) + n.hover * 0.3;
      n.material.linewidth = n.data.accent ? 1.5 : 1.25 + n.hover * 0.35;
      if (n.core) n.core.rotation.set(elapsed * 0.6, elapsed * 0.4, 0);
    });

    // Aristas: se dibujan a medida que el sistema se arma
    const arr = edgeBuffer.array as Float32Array;
    const stride = edgeBuffer.stride;
    const off = edgeStart.offset;
    const phases = pulseMat.uniforms.uPhase.value as number[];
    const draws = pulseMat.uniforms.uDraw.value as number[];
    edges.forEach((e, j) => {
      const a = byId.get(e.from)!;
      const b = byId.get(e.to)!;
      a.group.getWorldPosition(tmp);
      b.group.getWorldPosition(tmpB);
      const dir = tmpB.clone().sub(tmp);
      const len = dir.length();
      dir.divideScalar(len || 1);
      const ra = a.data.size * 0.62 * layoutScale;
      const rb = b.data.size * 0.62 * layoutScale;
      const A = tmp.clone().addScaledVector(dir, ra);
      const B = tmpB.clone().addScaledVector(dir, -rb);
      const st = edgeState[j];
      st.draw = ease(clamp01((build - 0.32 - j * 0.06) / 0.34));
      const Bd = A.clone().lerp(B, st.draw);
      const base = j * stride + off;
      arr[base] = A.x; arr[base + 1] = A.y; arr[base + 2] = A.z;
      arr[base + 3] = Bd.x; arr[base + 4] = Bd.y; arr[base + 5] = Bd.z;
      uA[j].copy(A);
      uB[j].copy(B);
      const touched = hovered && (hovered === a || hovered === b);
      st.boost += ((touched ? 3.4 : 1) - st.boost) * Math.min(1, dt * 4);
      st.phase = (st.phase + dt * st.speed * st.boost) % 1;
      phases[j] = st.phase;
      draws[j] = st.draw;
    });
    edgeBuffer.needsUpdate = true;
    edgeMat.opacity = (d ? 0.5 : 0.55) * (0.4 + 0.6 * build);

    particles.rotation.y = elapsed * 0.006;

    // Opacidad global del escenario
    const op = stageOpacity();
    if (Math.abs(op - currentOpacity) > 0.002) {
      currentOpacity = op;
      stage.style.opacity = op.toFixed(3);
      stage.style.visibility = op < 0.01 ? "hidden" : "visible";
    }

    // Labels proyectados (Vector3.project) + no pisar el texto del hero
    const sy = window.scrollY;
    const labelsOn = state.dolly < 0.5;
    nodes.forEach((n) => {
      tmp.set(0, n.data.size * 0.62, 0);
      n.group.localToWorld(tmp);
      tmp.project(camera);
      const x = (tmp.x * 0.5 + 0.5) * width;
      const y = (-tmp.y * 0.5 + 0.5) * height;
      let o = labelsOn && tmp.z < 1 ? clamp01((n.t - 0.75) / 0.25) : 0;
      if (o > 0) {
        const L = x, R = x + n.labelW, T = y + sy - 24, Bm = y + sy + 6;
        for (const r of avoid) {
          if (L < r.r && R > r.l && T < r.b && Bm > r.t) {
            o = 0;
            break;
          }
        }
        if (x < 8 || x + n.labelW > width - 8 || y < 70 || y > height - 10) o = 0;
      }
      n.label.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      n.label.style.opacity = o.toFixed(2);
      if (hovered === n && o > 0) n.label.dataset.active = "";
      else delete n.label.dataset.active;
    });

    if (bloom && wantBloom()) bloom.render();
    else renderer.render(scene, camera);
    needsRender = false;

    if (shouldRun()) raf = requestAnimationFrame(frame);
  }

  function shouldRun(): boolean {
    return !disposed && pageVisible && inView && state.out < 0.999;
  }
  function updateRunning(): void {
    if (shouldRun()) {
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    } else if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
      // aplicar el último estado (p.ej. opacidad 0) aunque el loop quede en pausa
      if (state.out >= 0.999) {
        stage.style.opacity = "0";
        stage.style.visibility = "hidden";
        currentOpacity = 0;
      }
    }
  }
  function requestRender(): void {
    needsRender = true;
    if (!raf && !disposed && pageVisible && inView) raf = requestAnimationFrame(frame);
  }

  // Pausa: fuera de pantalla (hero + Servicios) y pestaña oculta
  const visibleSet = new Set<Element>();
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => (en.isIntersecting ? visibleSet.add(en.target) : visibleSet.delete(en.target)));
      inView = visibleSet.size > 0;
      updateRunning();
    },
    { rootMargin: "80px 0px" }
  );
  io.observe(hero);
  if (services) io.observe(services);

  const onVisibility = () => {
    pageVisible = document.visibilityState === "visible";
    updateRunning();
  };
  document.addEventListener("visibilitychange", onVisibility);

  // Re-colorear al cambiar data-theme
  const mo = new MutationObserver(() => applyPalette());
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  const onFonts = () => measureAvoid();
  document.fonts?.ready.then(onFonts).catch(() => undefined);
  ScrollTrigger.addEventListener("refresh", measureAvoid);

  layout();
  measureAvoid();
  applyPalette();
  void needsRender;
  updateRunning();

  return {
    dispose(): void {
      if (disposed) return;
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      triggers.forEach((t) => t.kill());
      tweens.forEach((t) => t.kill());
      ScrollTrigger.removeEventListener("refresh", measureAvoid);
      io.disconnect();
      mo.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("resize", onResize);
      scene.traverse((obj) => {
        const o = obj as Partial<Mesh>;
        o.geometry?.dispose();
        const m = o.material;
        if (Array.isArray(m)) m.forEach((x) => x.dispose());
        else m?.dispose();
      });
      bloom?.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      stage.remove();
    },
  };
}
