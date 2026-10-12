/**
 * Terreno de la escena de drones: lomadas suaves (guiño a Entre Ríos).
 * Matemática pura, sin Three: la usan tanto la escena 3D como el SVG de
 * fallback (en build), así la vista en planta coincide con el 3D.
 */
export const TERRAIN_SIZE = 140;

export function heightAt(x: number, z: number): number {
  return (
    1.5 * Math.sin(x * 0.065 + 0.4) * Math.cos(z * 0.055 - 0.3) +
    1.0 * Math.sin((x + z) * 0.04 + 1.3) +
    3.0 * Math.exp(-((x + 22) ** 2 + (z - 6) ** 2) / 520) +
    2.6 * Math.exp(-((x - 22) ** 2 + (z - 10) ** 2) / 380) -
    2.0 * Math.exp(-((x - 2) ** 2 + (z - 36) ** 2) / 600) +
    0.22 * Math.sin(x * 0.21) * Math.sin(z * 0.19)
  );
}

export interface ContourSeg {
  /** x0, z0, x1, z1 */
  s: [number, number, number, number];
  level: number;
}

/**
 * Curvas de nivel por marching squares sobre una grilla res×res que cubre
 * [x0, x0+size] × [z0, z0+size].
 */
export function contourSegments(
  res: number,
  step: number,
  size = TERRAIN_SIZE,
  x0 = -size / 2,
  z0 = -size / 2
): ContourSeg[] {
  const n = res + 1;
  const cell = size / res;
  const h = new Float32Array(n * n);
  let min = Infinity;
  let max = -Infinity;
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const v = heightAt(x0 + i * cell, z0 + j * cell);
      h[j * n + i] = v;
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }
  const out: ContourSeg[] = [];
  const first = Math.ceil(min / step) * step;
  for (let level = first; level < max; level += step) {
    const L = Math.round(level * 1000) / 1000;
    for (let j = 0; j < res; j++) {
      for (let i = 0; i < res; i++) {
        const xa = x0 + i * cell;
        const za = z0 + j * cell;
        // esquinas: a(0,0) b(1,0) c(1,1) d(0,1)
        const c = [
          [xa, za, h[j * n + i]],
          [xa + cell, za, h[j * n + i + 1]],
          [xa + cell, za + cell, h[(j + 1) * n + i + 1]],
          [xa, za + cell, h[(j + 1) * n + i]],
        ];
        const pts: [number, number][] = [];
        for (let e = 0; e < 4; e++) {
          const p = c[e];
          const q = c[(e + 1) % 4];
          if ((p[2] < L) !== (q[2] < L)) {
            const t = (L - p[2]) / (q[2] - p[2]);
            pts.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
          }
        }
        for (let k = 0; k + 1 < pts.length; k += 2) {
          out.push({ s: [pts[k][0], pts[k][1], pts[k + 1][0], pts[k + 1][1]], level: L });
        }
      }
    }
  }
  return out;
}

/** Une segmentos que comparten extremos en polilíneas (para un SVG liviano). */
export function joinSegments(segs: ContourSeg[], precision = 100): { pts: [number, number][]; level: number }[] {
  const key = (x: number, z: number) => `${Math.round(x * precision)}:${Math.round(z * precision)}`;
  const byLevel = new Map<number, ContourSeg[]>();
  for (const s of segs) {
    const arr = byLevel.get(s.level) ?? [];
    arr.push(s);
    byLevel.set(s.level, arr);
  }
  const lines: { pts: [number, number][]; level: number }[] = [];
  for (const [level, list] of byLevel) {
    const ends = new Map<string, number[]>();
    list.forEach((s, idx) => {
      for (const k of [key(s.s[0], s.s[1]), key(s.s[2], s.s[3])]) {
        const a = ends.get(k) ?? [];
        a.push(idx);
        ends.set(k, a);
      }
    });
    const used = new Uint8Array(list.length);
    const extend = (pts: [number, number][], atEnd: boolean) => {
      for (;;) {
        const tip = atEnd ? pts[pts.length - 1] : pts[0];
        const cand = (ends.get(key(tip[0], tip[1])) ?? []).find((i) => !used[i]);
        if (cand === undefined) return;
        used[cand] = 1;
        const s = list[cand].s;
        const sameStart = key(s[0], s[1]) === key(tip[0], tip[1]);
        const next: [number, number] = sameStart ? [s[2], s[3]] : [s[0], s[1]];
        if (atEnd) pts.push(next);
        else pts.unshift(next);
      }
    };
    for (let i = 0; i < list.length; i++) {
      if (used[i]) continue;
      used[i] = 1;
      const s = list[i].s;
      const pts: [number, number][] = [
        [s[0], s[1]],
        [s[2], s[3]],
      ];
      extend(pts, true);
      extend(pts, false);
      lines.push({ pts, level });
    }
  }
  return lines;
}

/** Valor NDVI simulado (0–1) de la celda i,j del lote: vigor alto con una zona de estrés. */
export function ndviAt(i: number, j: number, nx: number, nz: number): number {
  const u = i / Math.max(1, nx - 1);
  const v = j / Math.max(1, nz - 1);
  let val = 0.72 + 0.12 * Math.sin(u * 5.1 + 0.6) * Math.cos(v * 4.3) + 0.06 * Math.sin((u + v) * 11);
  val -= 0.55 * Math.exp(-((u - 0.68) ** 2 + (v - 0.3) ** 2) / 0.03);
  val -= 0.3 * Math.exp(-((u - 0.2) ** 2 + (v - 0.85) ** 2) / 0.012);
  return Math.max(0, Math.min(1, val));
}

/** Umbral por debajo del cual una celda se marca como alerta (ámbar). */
export const NDVI_ALERT = 0.42;

/** Interpolación Catmull-Rom (uniforme) en 2D; devuelve `samples` puntos. */
export function catmullRom2D(points: [number, number][], samplesPerSeg = 24): [number, number][] {
  const p = (i: number) => points[Math.max(0, Math.min(points.length - 1, i))];
  const out: [number, number][] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const [p0, p1, p2, p3] = [p(i - 1), p(i), p(i + 1), p(i + 2)];
    for (let k = 0; k < samplesPerSeg; k++) {
      const t = k / samplesPerSeg;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) =>
        0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(points[points.length - 1]);
  return out;
}
