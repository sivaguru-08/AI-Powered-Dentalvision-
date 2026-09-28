import { LOWER_ROW, toothDepth, toothMeta, toothWidth, UPPER_ROW } from '@/domain/fdi';
import type { ToothNumber, ToothType } from '@/domain/models';

/**
 * Geometry for the occlusal-view dental arch (odontogram). Teeth are laid out
 * along two elliptical arcs by cumulative mesio-distal width, so the result
 * looks like a real human dental arch instead of a table.
 */

export const ARCH_VIEW = { width: 360, height: 520 };

export interface ArchTooth {
  num: ToothNumber;
  type: ToothType;
  cx: number;
  cy: number;
  angle: number; // degrees; tooth local x-axis along the arch tangent
  w: number;
  d: number;
  labelX: number;
  labelY: number;
}

function sampleArc(A: number, B: number, dirY: 1 | -1, thetaMax: number) {
  // Returns cumulative arc-length table for θ in [0, thetaMax].
  const N = 600;
  const pts: { t: number; x: number; y: number; s: number }[] = [];
  let s = 0;
  let px = 0;
  let py = dirY * B;
  for (let i = 0; i <= N; i++) {
    const t = (i / N) * thetaMax;
    const x = A * Math.sin(t);
    const y = dirY * B * Math.cos(t);
    if (i > 0) s += Math.hypot(x - px, y - py);
    pts.push({ t, x, y, s });
    px = x;
    py = y;
  }
  return pts;
}

function pointAt(pts: ReturnType<typeof sampleArc>, s: number) {
  let i = pts.findIndex((p) => p.s >= s);
  if (i <= 0) i = Math.max(1, i === -1 ? pts.length - 1 : 1);
  const a = pts[i - 1];
  const b = pts[i];
  const k = b.s === a.s ? 0 : (s - a.s) / (b.s - a.s);
  const x = a.x + (b.x - a.x) * k;
  const y = a.y + (b.y - a.y) * k;
  const tx = b.x - a.x;
  const ty = b.y - a.y;
  const len = Math.hypot(tx, ty) || 1;
  return { x, y, tx: tx / len, ty: ty / len };
}

function layoutArch(
  row: ToothNumber[],
  cx: number,
  cy: number,
  A: number,
  B: number,
  dirY: 1 | -1
): ArchTooth[] {
  const gap = 0.9; // mm between teeth
  const thetaMax = 1.72;
  const pts = sampleArc(A, B, dirY, thetaMax);
  const half = row.length / 2;
  const sideTeeth = row.slice(half); // midline → distal on the viewer's right
  const totalMm = sideTeeth.reduce((a, n) => a + toothWidth(n), 0) + gap * (sideTeeth.length - 0.5);
  const targetLen = pts[Math.floor((pts.length - 1) * (1.55 / thetaMax))].s;
  const k = targetLen / totalMm; // px per mm

  const out: ArchTooth[] = [];
  const place = (list: ToothNumber[], sign: 1 | -1) => {
    let s = (gap / 2) * k;
    for (const num of list) {
      const w = toothWidth(num) * k;
      const d = toothDepth(num) * k * 0.96;
      const mid = s + w / 2;
      const p = pointAt(pts, mid);
      const x = cx + sign * p.x;
      const y = cy + p.y;
      const tx = sign * p.tx;
      const ty = p.ty;
      // Outward normal (away from arch centre)
      let nx = ty;
      let ny = -tx;
      const toCx = x - cx;
      const toCy = y - (cy + dirY * B * 0.25);
      if (nx * toCx + ny * toCy < 0) {
        nx = -nx;
        ny = -ny;
      }
      // Rotate so that local +y (buccal) points along the outward normal.
      const angle = (Math.atan2(-nx, ny) * 180) / Math.PI;
      const lo = d / 2 + 12;
      out.push({
        num,
        type: toothMeta(num).type,
        cx: x,
        cy: y,
        angle,
        w,
        d,
        labelX: x + nx * lo,
        labelY: y + ny * lo,
      });
      s += w + gap * k;
    }
  };
  place(row.slice(half), 1);
  place([...row.slice(0, half)].reverse(), -1);
  return out;
}

let cached: ArchTooth[] | null = null;

export function archLayout(): ArchTooth[] {
  if (cached) return cached;
  const upper = layoutArch(UPPER_ROW, 180, 238, 120, 176, -1);
  const lower = layoutArch(LOWER_ROW, 180, 290, 110, 166, 1);
  cached = [...upper, ...lower];
  return cached;
}

// ------------------------------------------------------------- tooth glyphs

function superPath(w: number, d: number, n: number, pinch = 0): string {
  const pts: string[] = [];
  const N = 40;
  for (let i = 0; i < N; i++) {
    const t = (i / N) * Math.PI * 2;
    const c = Math.cos(t);
    const s = Math.sin(t);
    let x = (Math.sign(c) * Math.pow(Math.abs(c), 2 / n) * w) / 2;
    const y = (Math.sign(s) * Math.pow(Math.abs(s), 2 / n) * d) / 2;
    // pinch narrows the lingual side (y < 0 is lingual, toward the arch centre)
    if (pinch && s < 0) x *= 1 - pinch * Math.abs(s);
    pts.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return `M${pts.join(' L')} Z`;
}

export interface Glyph {
  outline: string;
  details: string; // fissures / edges
  cusps: { x: number; y: number; r: number }[];
}

/**
 * Occlusal outline for a tooth centred on (0,0). Local x = mesio-distal,
 * local y = bucco-lingual with +y pointing outward (buccal).
 */
export function toothGlyph(type: ToothType, w: number, d: number): Glyph {
  switch (type) {
    case 'molar':
      return {
        outline: superPath(w, d, 3.2, 0.08),
        details: `M${-w * 0.32},0 Q0,${d * 0.08} ${w * 0.32},0 M0,${-d * 0.3} L0,${d * 0.3}`,
        cusps: [
          { x: -w * 0.22, y: d * 0.2, r: w * 0.13 },
          { x: w * 0.22, y: d * 0.2, r: w * 0.13 },
          { x: -w * 0.22, y: -d * 0.2, r: w * 0.13 },
          { x: w * 0.22, y: -d * 0.2, r: w * 0.13 },
        ],
      };
    case 'premolar':
      return {
        outline: superPath(w, d, 2.4, 0.12),
        details: `M${-w * 0.28},${d * 0.02} Q0,${-d * 0.06} ${w * 0.28},${d * 0.02}`,
        cusps: [
          { x: 0, y: d * 0.2, r: w * 0.16 },
          { x: 0, y: -d * 0.22, r: w * 0.13 },
        ],
      };
    case 'canine':
      return {
        outline: superPath(w, d, 1.9, 0.2),
        details: `M${-w * 0.3},${d * 0.05} L0,${d * 0.2} L${w * 0.3},${d * 0.05}`,
        cusps: [{ x: 0, y: d * 0.1, r: w * 0.12 }],
      };
    case 'incisor':
    default:
      return {
        outline: superPath(w, d * 0.78, 2.6, 0.3),
        details: `M${-w * 0.36},${d * 0.14} Q0,${d * 0.24} ${w * 0.36},${d * 0.14}`,
        cusps: [],
      };
  }
}
