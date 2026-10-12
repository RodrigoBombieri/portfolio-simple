/**
 * Geometrías de nodo como listas de segmentos (pares de puntos xyz), listas
 * para LineSegmentsGeometry.setPositions. Todo en estilo plano: aristas, sin caras.
 */
import type { SceneShape } from "@data/scene";

type Seg = number[];

function push(out: Seg, a: [number, number, number], b: [number, number, number]): void {
  out.push(a[0], a[1], a[2], b[0], b[1], b[2]);
}

function box(out: Seg, w: number, h: number, d: number, cx = 0, cy = 0, cz = 0): void {
  const x = w / 2, y = h / 2, z = d / 2;
  const p = (sx: number, sy: number, sz: number): [number, number, number] => [cx + sx * x, cy + sy * y, cz + sz * z];
  // 4 aristas inferiores, 4 superiores, 4 verticales
  for (const sy of [-1, 1]) {
    push(out, p(-1, sy, -1), p(1, sy, -1));
    push(out, p(1, sy, -1), p(1, sy, 1));
    push(out, p(1, sy, 1), p(-1, sy, 1));
    push(out, p(-1, sy, 1), p(-1, sy, -1));
  }
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) push(out, p(sx, -1, sz), p(sx, 1, sz));
}

/** Círculo en el plano XZ (horizontal) */
function ringXZ(out: Seg, r: number, y: number, n: number, cx = 0, cz = 0): void {
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2;
    push(out, [cx + Math.cos(a0) * r, y, cz + Math.sin(a0) * r], [cx + Math.cos(a1) * r, y, cz + Math.sin(a1) * r]);
  }
}

function octahedron(out: Seg, r: number): void {
  const v: [number, number, number][] = [[r, 0, 0], [-r, 0, 0], [0, r, 0], [0, -r, 0], [0, 0, r], [0, 0, -r]];
  const eq = [0, 4, 1, 5];
  for (let i = 0; i < 4; i++) {
    push(out, v[eq[i]], v[eq[(i + 1) % 4]]);
    push(out, v[eq[i]], v[2]);
    push(out, v[eq[i]], v[3]);
  }
}

export function shapeSegments(shape: SceneShape, s: number): number[] {
  const out: Seg = [];
  switch (shape) {
    case "cube": {
      box(out, s, s, s);
      // marcas de esquina interiores: "pieza" de plano
      box(out, s * 0.42, s * 0.42, s * 0.42);
      break;
    }
    case "screen": {
      const w = s * 1.6, h = s, d = s * 0.08;
      box(out, w, h, d);
      // contenido de pantalla: barra + líneas de texto
      const z = d / 2 + 0.001;
      push(out, [-w * 0.42, h * 0.3, z], [w * 0.42, h * 0.3, z]);
      for (let i = 0; i < 3; i++) {
        const y = h * (0.08 - i * 0.16);
        push(out, [-w * 0.42, y, z], [w * (0.18 - i * 0.12), y, z]);
      }
      // pie
      push(out, [0, -h / 2, 0], [0, -h * 0.72, 0]);
      push(out, [-w * 0.18, -h * 0.72, 0], [w * 0.18, -h * 0.72, 0]);
      break;
    }
    case "core": {
      octahedron(out, s * 0.78);
      box(out, s * 0.34, s * 0.34, s * 0.34);
      break;
    }
    case "db": {
      const r = s * 0.55, h = s * 1.1, n = 32;
      for (const y of [-h / 2, -h / 6, h / 6, h / 2]) ringXZ(out, r, y, n);
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        push(out, [Math.cos(a) * r, -h / 2, Math.sin(a) * r], [Math.cos(a) * r, h / 2, Math.sin(a) * r]);
      }
      break;
    }
    case "service": {
      // rack de 3 módulos
      const w = s * 1.15, h = s * 0.26, d = s * 0.8, gap = s * 0.1;
      for (let i = -1; i <= 1; i++) {
        const cy = i * (h + gap);
        box(out, w, h, d, 0, cy, 0);
        push(out, [w * 0.25, cy, d / 2], [w * 0.42, cy, d / 2]);
      }
      break;
    }
    case "drone": {
      const arm = s * 0.62, rr = s * 0.24;
      box(out, s * 0.3, s * 0.12, s * 0.3);
      for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const cx = (sx * arm) / Math.SQRT2, cz = (sz * arm) / Math.SQRT2;
        push(out, [sx * s * 0.1, 0, sz * s * 0.1], [cx, 0, cz]);
        ringXZ(out, rr, s * 0.04, 20, cx, cz);
      }
      break;
    }
  }
  return out;
}
