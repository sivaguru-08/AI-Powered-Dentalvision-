import * as THREE from 'three';

import { toothDepth, toothMeta, toothWidth } from '@/domain/fdi';
import type { Finding, ToothNumber, ToothType } from '@/domain/models';

/**
 * Procedural, anatomically-inspired tooth geometry.
 *
 * Canonical frame: +Y = occlusal (crown up), +X = distal, +Z = buccal.
 * 1 unit ≈ 8 mm. Everything is generated from a handful of parameters per
 * tooth type so no external model files are required. A real pipeline could
 * swap this for a segmented CBCT mesh (GLB) with the same layer names.
 */

// ---------------------------------------------------------------- params

export interface ToothShape {
  type: ToothType;
  upper: boolean;
  position: number;
  halfW: number;
  halfD: number;
  crownH: number;
  rootLen: number;
  neck: number;
  n: number;
  rimY: number;
  /** Furcation depth for multi-rooted teeth (0 = single root). */
  trunkLen: number;
  cusps: { x: number; z: number; amp: number; sigma: number }[];
  grooves: { axis: 'x' | 'z'; amp: number; width: number; extent: number }[];
  incisalTaper: number;
  roots: RootSpec[];
}

interface RootSpec {
  top: [number, number]; // x, z factors of halfW / halfD
  apex: [number, number];
  rx: number; // factor of halfW
  rz: number; // factor of halfD
  length: number; // factor of rootLen
  bend: number;
}

export function shapeFor(num: ToothNumber): ToothShape {
  const m = toothMeta(num);
  const upper = m.arch === 'upper';
  const halfW = toothWidth(num) / 16;
  const halfD = toothDepth(num) / 16;
  const third = m.position === 8;
  switch (m.type) {
    case 'incisor': {
      const crownH = upper ? (m.position === 1 ? 1.32 : 1.12) : 1.1;
      return {
        type: m.type,
        upper,
        position: m.position,
        halfW,
        halfD,
        crownH,
        rootLen: upper ? 1.62 : 1.56,
        neck: 0.68,
        n: 2.5,
        rimY: crownH * 0.97,
        trunkLen: 0,
        cusps: [],
        grooves: [],
        incisalTaper: 0.72,
        roots: [{ top: [0, 0], apex: [0, -0.05], rx: 0.68, rz: 0.72, length: 1, bend: 0.06 }],
      };
    }
    case 'canine': {
      const crownH = upper ? 1.28 : 1.22;
      return {
        type: m.type,
        upper,
        position: m.position,
        halfW,
        halfD,
        crownH,
        rootLen: upper ? 2.08 : 1.95,
        neck: 0.7,
        n: 2.2,
        rimY: crownH * 0.72,
        trunkLen: 0,
        cusps: [{ x: 0, z: 0.08, amp: crownH * 0.3, sigma: 0.34 }],
        grooves: [],
        incisalTaper: 0.38,
        roots: [{ top: [0, 0], apex: [0.04, -0.05], rx: 0.7, rz: 0.76, length: 1, bend: 0.08 }],
      };
    }
    case 'premolar': {
      const crownH = 1.03;
      const twoRoots = upper && m.position === 4;
      return {
        type: m.type,
        upper,
        position: m.position,
        halfW,
        halfD,
        crownH,
        rootLen: 1.72,
        neck: 0.7,
        n: 2.4,
        rimY: crownH * 0.76,
        trunkLen: twoRoots ? 0.42 : 0,
        cusps: [
          { x: 0, z: 0.38, amp: crownH * 0.24, sigma: 0.3 },
          { x: 0, z: -0.4, amp: crownH * (upper ? 0.2 : 0.1), sigma: 0.28 },
        ],
        grooves: [{ axis: 'x', amp: crownH * 0.07, width: 0.1, extent: 0.7 }],
        incisalTaper: 0,
        roots: twoRoots
          ? [
              { top: [0, 0.24], apex: [0, 0.4], rx: 0.55, rz: 0.34, length: 0.95, bend: 0.06 },
              { top: [0, -0.24], apex: [0, -0.4], rx: 0.55, rz: 0.34, length: 1, bend: 0.06 },
            ]
          : [{ top: [0, 0], apex: [0.03, 0], rx: 0.7, rz: 0.72, length: 1, bend: 0.07 }],
      };
    }
    case 'molar':
    default: {
      const crownH = third ? 0.9 : 0.95;
      const lowerFirst = !upper && m.position === 6;
      const cusps = upper
        ? [
            { x: -0.46, z: 0.42, amp: 0.2, sigma: 0.27 },
            { x: 0.44, z: 0.42, amp: 0.18, sigma: 0.26 },
            { x: -0.4, z: -0.44, amp: 0.22, sigma: 0.3 },
            { x: 0.42, z: -0.46, amp: 0.13, sigma: 0.24 },
          ]
        : lowerFirst
          ? [
              { x: -0.58, z: 0.42, amp: 0.19, sigma: 0.24 },
              { x: 0.02, z: 0.46, amp: 0.18, sigma: 0.24 },
              { x: 0.62, z: 0.34, amp: 0.13, sigma: 0.2 },
              { x: -0.42, z: -0.44, amp: 0.22, sigma: 0.27 },
              { x: 0.4, z: -0.44, amp: 0.2, sigma: 0.26 },
            ]
          : [
              { x: -0.45, z: 0.42, amp: 0.18, sigma: 0.26 },
              { x: 0.45, z: 0.42, amp: 0.17, sigma: 0.26 },
              { x: -0.44, z: -0.44, amp: 0.2, sigma: 0.27 },
              { x: 0.44, z: -0.44, amp: 0.19, sigma: 0.27 },
            ];
      const roots: RootSpec[] = upper
        ? [
            { top: [-0.3, 0.26], apex: [-0.46, 0.5], rx: 0.28, rz: 0.3, length: 0.92, bend: 0.14 },
            { top: [0.3, 0.26], apex: [0.5, 0.52], rx: 0.27, rz: 0.29, length: 0.85, bend: 0.1 },
            { top: [0, -0.28], apex: [0.02, -0.72], rx: 0.34, rz: 0.32, length: 1.02, bend: 0.04 },
          ]
        : third
          ? [
              { top: [-0.24, 0], apex: [-0.12, 0], rx: 0.34, rz: 0.58, length: 0.9, bend: 0.2 },
              { top: [0.24, 0], apex: [0.3, 0], rx: 0.33, rz: 0.56, length: 0.85, bend: 0.22 },
            ]
          : [
              { top: [-0.32, 0], apex: [-0.46, 0], rx: 0.29, rz: 0.6, length: 1, bend: 0.16 },
              { top: [0.32, 0], apex: [0.54, 0], rx: 0.28, rz: 0.58, length: 0.93, bend: 0.14 },
            ];
      return {
        type: 'molar',
        upper,
        position: m.position,
        halfW,
        halfD,
        crownH,
        rootLen: third ? 1.4 : upper ? 1.6 : 1.66,
        neck: 0.74,
        n: 3.1,
        rimY: crownH * 0.76,
        trunkLen: 0.36,
        cusps: cusps.map((c) => ({ ...c, amp: c.amp * crownH })),
        grooves: [
          { axis: 'x', amp: crownH * 0.075, width: 0.09, extent: 0.78 },
          { axis: 'z', amp: crownH * 0.05, width: 0.08, extent: 0.7 },
        ],
        incisalTaper: 0,
        roots,
      };
    }
  }
}

// --------------------------------------------------------------- helpers

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function outline(phi: number, n: number): [number, number] {
  const c = Math.cos(phi);
  const s = Math.sin(phi);
  const e = 2 / n;
  return [Math.sign(c) * Math.pow(Math.abs(c), e), Math.sign(s) * Math.pow(Math.abs(s), e)];
}

interface MeshData {
  positions: number[];
  indices: number[];
}

function toGeometry({ positions, indices }: MeshData): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

/** Merge indexed geometries that share the same attribute layout. */
export function mergeGeometries(list: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  let offset = 0;
  for (const g of list) {
    const p = g.getAttribute('position');
    const nrm = g.getAttribute('normal');
    for (let i = 0; i < p.count; i++) {
      positions.push(p.getX(i), p.getY(i), p.getZ(i));
      normals.push(nrm.getX(i), nrm.getY(i), nrm.getZ(i));
    }
    const idx = g.getIndex()!;
    for (let i = 0; i < idx.count; i++) indices.push(idx.getX(i) + offset);
    offset += p.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  out.setIndex(indices);
  return out;
}

// ------------------------------------------------------------------ crown

interface CrownOptions {
  scaleW?: number;
  scaleD?: number;
  scaleH?: number;
  cuspScale?: number;
  yOffset?: number;
  segments?: number;
  rings?: number;
  /** Continue the surface below the CEJ as a root trunk of this length. */
  trunk?: number;
}

function buildCrown(s: ToothShape, o: CrownOptions = {}): THREE.BufferGeometry {
  const U = o.segments ?? 80;
  const V = o.rings ?? 56;
  const sw = o.scaleW ?? 1;
  const sd = o.scaleD ?? 1;
  const sh = o.scaleH ?? 1;
  const cuspScale = o.cuspScale ?? 1;
  const y0 = o.yOffset ?? 0;
  const crownH = s.crownH * sh;
  const rimY = s.rimY * sh;
  const vt = 0.42;
  const rimR = s.type === 'incisor' ? 0.9 : 0.84;
  const hc = s.type === 'molar' ? 0.6 : 0.55; // height of contour
  const roundDrop = crownH * (s.type === 'incisor' ? 0.02 : 0.05);

  const positions: number[] = [];
  const indices: number[] = [];

  // Top centre vertex
  const centerY = rimY + profileCusps(s, 0, 0, cuspScale) - grooveDepth(s, 0, 0, cuspScale);
  positions.push(0, centerY + y0, 0);

  for (let i = 1; i <= V; i++) {
    const v = i / V;
    let r: number;
    let y: number;
    let w: number;
    if (v <= vt) {
      const t = v / vt;
      r = rimR * t;
      y = rimY - roundDrop * Math.pow(smoothstep(0.7, 1, t), 2);
      w = 1;
    } else {
      const sN = (v - vt) / (1 - vt);
      const u = 1 - sN; // 0 at neck, 1 at rim
      r =
        u >= hc
          ? lerp(1, rimR, Math.pow((u - hc) / (1 - hc), 1.6))
          : lerp(s.neck, 1, Math.sin(((u / hc) * Math.PI) / 2));
      y = (rimY - roundDrop) * Math.pow(u, 0.92);
      w = 1 - smoothstep(0, 0.45, sN);
    }
    for (let j = 0; j < U; j++) {
      const phi = (j / U) * Math.PI * 2;
      const [ox, oz] = outline(phi, s.n);
      const xn = r * ox;
      const zn = r * oz;
      const heightFrac = y / crownH;
      const dz = 1 - s.incisalTaper * smoothstep(0.3, 1.02, heightFrac);
      const dx = 1 + (s.type === 'incisor' ? 0.08 * heightFrac : 0);
      const cy = w * (profileCusps(s, xn, zn, cuspScale) - grooveDepth(s, xn, zn, cuspScale));
      positions.push(xn * s.halfW * sw * dx, y + cy + y0, zn * s.halfD * sd * dz);
    }
  }
  // Fan around centre
  for (let j = 0; j < U; j++) {
    const a = 1 + j;
    const b = 1 + ((j + 1) % U);
    indices.push(0, b, a);
  }
  // Root trunk: same surface continues below the neck, tapers into the
  // furcation and closes with a rounded bottom (no seams, no flat caps).
  let rings = V;
  const trunk = o.trunk ?? 0;
  if (trunk > 0) {
    const K = 14;
    for (let k = 1; k <= K + 5; k++) {
      let y: number;
      let f: number;
      if (k <= K) {
        const t = k / K;
        y = -trunk * t;
        f = lerp(1, 0.6, Math.pow(t, 1.2));
      } else {
        const a = ((k - K) / 5) * (Math.PI / 2);
        y = -trunk - 0.1 * Math.sin(a);
        f = 0.6 * Math.cos(a) + 0.003;
      }
      const n = lerp(s.n, 2.3, Math.min(1, k / K));
      for (let j = 0; j < U; j++) {
        const phi = (j / U) * Math.PI * 2;
        const [ox, oz] = outline(phi, n);
        positions.push(ox * s.neck * s.halfW * sw * f, y + y0, oz * s.neck * s.halfD * sd * f);
      }
      rings++;
    }
  }
  for (let i = 0; i < rings - 1; i++) {
    const r0 = 1 + i * U;
    const r1 = 1 + (i + 1) * U;
    for (let j = 0; j < U; j++) {
      const j1 = (j + 1) % U;
      indices.push(r0 + j, r0 + j1, r1 + j);
      indices.push(r0 + j1, r1 + j1, r1 + j);
    }
  }
  if (trunk > 0) {
    const tip = positions.length / 3;
    positions.push(0, -trunk - 0.1 + y0, 0);
    const last = 1 + (rings - 1) * U;
    for (let j = 0; j < U; j++) indices.push(last + j, last + ((j + 1) % U), tip);
  }
  return toGeometry({ positions, indices });
}

function profileCusps(s: ToothShape, x: number, z: number, scale: number) {
  let h = 0;
  for (const c of s.cusps) {
    const dx = x - c.x;
    const dz = z - c.z;
    h += c.amp * scale * Math.exp(-(dx * dx + dz * dz) / (2 * c.sigma * c.sigma));
  }
  return h;
}

function grooveDepth(s: ToothShape, x: number, z: number, scale: number) {
  let d = 0;
  for (const g of s.grooves) {
    const across = g.axis === 'x' ? z : x;
    const along = g.axis === 'x' ? x : z;
    const fade = 1 - smoothstep(g.extent * 0.7, g.extent, Math.abs(along));
    d += g.amp * scale * Math.exp(-(across * across) / (2 * g.width * g.width)) * fade;
  }
  return d;
}

// ------------------------------------------------------------------ tubes

interface Section {
  cx: number;
  cy: number;
  cz: number;
  rx: number;
  rz: number;
  n: number;
}

/** Generic lofted tube through elliptical/superelliptical sections. */
function buildTube(sections: Section[], opts: { capTop?: boolean; closeBottom?: boolean; segments?: number }) {
  const U = opts.segments ?? 48;
  const positions: number[] = [];
  const indices: number[] = [];
  let base = 0;
  if (opts.capTop) {
    const s0 = sections[0];
    positions.push(s0.cx, s0.cy + 0.001, s0.cz);
    base = 1;
  }
  sections.forEach((sec) => {
    for (let j = 0; j < U; j++) {
      const phi = (j / U) * Math.PI * 2;
      const [ox, oz] = outline(phi, sec.n);
      positions.push(sec.cx + sec.rx * ox, sec.cy, sec.cz + sec.rz * oz);
    }
  });
  if (opts.capTop) {
    for (let j = 0; j < U; j++) indices.push(0, base + j, base + ((j + 1) % U));
  }
  for (let i = 0; i < sections.length - 1; i++) {
    const r0 = base + i * U;
    const r1 = base + (i + 1) * U;
    for (let j = 0; j < U; j++) {
      const j1 = (j + 1) % U;
      indices.push(r0 + j, r1 + j, r0 + j1);
      indices.push(r0 + j1, r1 + j, r1 + j1);
    }
  }
  if (opts.closeBottom) {
    const last = sections[sections.length - 1];
    const tip = positions.length / 3;
    positions.push(last.cx, last.cy - 0.002, last.cz);
    const r = base + (sections.length - 1) * U;
    for (let j = 0; j < U; j++) indices.push(r + j, tip, r + ((j + 1) % U));
  }
  return toGeometry({ positions, indices });
}

interface RootPath {
  top: THREE.Vector3;
  apex: THREE.Vector3;
  rx: number;
  rz: number;
  centerAt: (t: number) => THREE.Vector3;
}

function rootPaths(s: ToothShape): RootPath[] {
  const topY = s.trunkLen > 0 ? -s.trunkLen * 0.45 : 0;
  return s.roots.map((r) => {
    const top = new THREE.Vector3(r.top[0] * s.halfW, topY, r.top[1] * s.halfD);
    const apex = new THREE.Vector3(r.apex[0] * s.halfW, -s.rootLen * r.length, r.apex[1] * s.halfD);
    const rx = s.trunkLen > 0 ? r.rx * s.halfW : r.rx * s.halfW * (s.neck / 0.7);
    const rz = s.trunkLen > 0 ? r.rz * s.halfD : r.rz * s.halfD * (s.neck / 0.7);
    const centerAt = (t: number) => {
      const c = top.clone().lerp(apex, t);
      c.x += r.bend * Math.pow(t, 2) * s.halfW; // distal curvature toward apex
      return c;
    };
    return { top, apex, rx, rz, centerAt };
  });
}

function rootRadius(t: number) {
  let f = 1 - 0.8 * Math.pow(t, 1.35);
  if (t > 0.86) f *= Math.sqrt(Math.max(0, 1 - Math.pow((t - 0.86) / 0.14, 2)));
  return Math.max(f, 0.0001);
}

function buildRoots(s: ToothShape, scale = 1, stopAt = 1): THREE.BufferGeometry[] {
  const out: THREE.BufferGeometry[] = [];
  const singleRoot = s.trunkLen === 0;
  for (const path of rootPaths(s)) {
    const sections: Section[] = [];
    const N = 40;
    for (let i = 0; i <= N; i++) {
      const t = (i / N) * stopAt;
      const c = path.centerAt(t);
      const f = rootRadius(t) * scale;
      // Single-rooted teeth start exactly at the crown neck outline.
      const n = lerp(singleRoot ? s.n : 2.3, 2, Math.min(1, t * 2.2));
      const rx = singleRoot && i === 0 && scale === 1 ? s.neck * s.halfW : path.rx * f;
      const rz = singleRoot && i === 0 && scale === 1 ? s.neck * s.halfD : path.rz * f;
      sections.push({ cx: c.x, cy: c.y, cz: c.z, rx, rz, n });
    }
    out.push(buildTube(sections, { capTop: true, closeBottom: true }));
  }
  return out;
}

// ------------------------------------------------------------------ pulp

function buildPulp(s: ToothShape): THREE.BufferGeometry {
  const chamber = buildCrown(
    { ...s, cusps: s.cusps.map((c) => ({ ...c, sigma: c.sigma * 0.8 })), incisalTaper: s.incisalTaper * 0.6 },
    {
      scaleW: s.type === 'incisor' ? 0.34 : 0.42,
      scaleD: 0.36,
      scaleH: 0.55,
      cuspScale: 1.4,
      yOffset: s.trunkLen > 0 ? -s.trunkLen * 0.55 : -0.12,
      segments: 40,
      rings: 24,
    }
  );
  const canals = rootPaths(s).map((path) => {
    const sections: Section[] = [];
    const N = 30;
    for (let i = 0; i <= N; i++) {
      const t = (i / N) * 0.965;
      const c = path.centerAt(t);
      const f = (0.22 - 0.15 * t) * (s.trunkLen > 0 ? 1 : 0.8);
      sections.push({ cx: c.x, cy: c.y + (i === 0 ? 0.05 : 0), cz: c.z, rx: path.rx * f + 0.01, rz: path.rz * f * 0.7 + 0.01, n: 2 });
    }
    return buildTube(sections, { capTop: true, closeBottom: true, segments: 20 });
  });
  return mergeGeometries([chamber, ...canals]);
}

// ------------------------------------------------------------------- bone

function buildBone(
  s: ToothShape,
  opts: { crest: number; lossDepth: number; lossWidth: number; covering?: number; widen?: number; shiftX?: number }
): { bone: THREE.BufferGeometry; gum: THREE.BufferGeometry } {
  const w = s.halfW * 2.5 * (opts.widen ?? 1);
  const shiftX = opts.shiftX ?? 0;
  const d = s.halfD * 2.1;
  const bottom = -s.rootLen - 0.28;
  const crestAt = (x: number, z: number) => {
    const ridge = -0.1 * Math.pow(Math.abs(z) / (d / 2), 2.2); // rounded bucco-lingual ridge
    const loss = opts.lossDepth * Math.exp(-Math.pow(x / (s.halfW * opts.lossWidth), 2));
    // Covering bone only over the (impacted) tooth itself, not the neighbour.
    const cover = (opts.covering ?? 0) * (1 - smoothstep(s.halfW * 0.9, s.halfW * 1.5, -x));
    return opts.crest + cover + ridge - loss;
  };
  const make = (thickness: number, lift: number) => {
    const g = new THREE.BoxGeometry(w, 1, d, 48, 1, 20);
    const p = g.getAttribute('position');
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i) + shiftX;
      const z = p.getZ(i);
      p.setX(i, x);
      const top = crestAt(x, z) + lift;
      if (p.getY(i) > 0) p.setY(i, top);
      else p.setY(i, thickness > 0 ? top - thickness : bottom);
    }
    g.computeVertexNormals();
    return g;
  };
  // Gum sits just above the bone crest (small gap avoids z-fighting).
  return { bone: make(0, 0), gum: make(0.19, 0.2) };
}

// --------------------------------------------------------------- lesions

export interface LesionInfo {
  kind: 'point' | 'band' | 'apex' | 'none';
  point: THREE.Vector3;
  normal: THREE.Vector3;
  sigma: number;
  bandDepth: number;
}

function nearestVertex(g: THREE.BufferGeometry, target: THREE.Vector3) {
  const p = g.getAttribute('position');
  const n = g.getAttribute('normal');
  let best = 0;
  let bestD = Infinity;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.set(p.getX(i), p.getY(i), p.getZ(i));
    const dd = v.distanceToSquared(target);
    if (dd < bestD) {
      bestD = dd;
      best = i;
    }
  }
  return {
    point: new THREE.Vector3(p.getX(best), p.getY(best), p.getZ(best)),
    normal: new THREE.Vector3(n.getX(best), n.getY(best), n.getZ(best)).normalize(),
  };
}

function lesionFor(s: ToothShape, finding: Finding | null, crown: THREE.BufferGeometry, roots: THREE.BufferGeometry): LesionInfo {
  const none: LesionInfo = { kind: 'none', point: new THREE.Vector3(), normal: new THREE.Vector3(0, 0, 1), sigma: 0, bandDepth: 0 };
  if (!finding) return none;
  const surf = finding.lesion.surface;
  const sigma = 0.07 + finding.lesion.spread * 0.36;
  const yc = s.crownH * (0.38 + 0.3 * finding.lesion.height);
  switch (surf) {
    case 'Distal':
    case 'Mesial':
    case 'Buccal':
    case 'Lingual': {
      const dir = { Distal: [1, 0], Mesial: [-1, 0], Buccal: [0, 1], Lingual: [0, -1] }[surf];
      const t = new THREE.Vector3(dir[0] * s.halfW * 1.4, yc, dir[1] * s.halfD * 1.4);
      return { kind: 'point', ...nearestVertex(crown, t), sigma, bandDepth: 0 };
    }
    case 'Occlusal': {
      const t = new THREE.Vector3(0.08 * s.halfW, s.crownH * 1.4, 0.02);
      return { kind: 'point', ...nearestVertex(crown, t), sigma, bandDepth: 0 };
    }
    case 'Crown': {
      const t = new THREE.Vector3(-s.halfW * 1.4, s.crownH * 0.72, 0);
      return { kind: 'point', ...nearestVertex(crown, t), sigma: sigma * 1.1, bandDepth: 0 };
    }
    case 'Periapical': {
      const path = rootPaths(s)[0];
      const apex = path.centerAt(1);
      const hit = nearestVertex(roots, apex.clone().add(new THREE.Vector3(0, -0.3, 0)));
      return { kind: 'apex', point: apex, normal: hit.normal, sigma: 0.32, bandDepth: 0 };
    }
    case 'Alveolar crest': {
      const depth = (finding.boneLossFraction ?? 0.3) * s.rootLen;
      const t = new THREE.Vector3(-s.halfW * 1.3, -depth * 0.45, 0);
      return { kind: 'band', ...nearestVertex(roots, t), sigma: 0.3, bandDepth: depth };
    }
    default:
      return none;
  }
}

function lesionWeight(l: LesionInfo, x: number, y: number, z: number): number {
  if (l.kind === 'none') return 0;
  if (l.kind === 'band') {
    const inBand = smoothstep(0.04, -0.06, y) * smoothstep(-l.bandDepth - 0.08, -l.bandDepth + 0.1, y);
    const sideBias = 0.55 + 0.45 * Math.min(1, Math.abs(x) / 0.35);
    return inBand * sideBias;
  }
  const dx = x - l.point.x;
  const dy = y - l.point.y;
  const dz = z - l.point.z;
  return Math.exp(-(dx * dx + dy * dy + dz * dz) / (2 * l.sigma * l.sigma));
}

// ----------------------------------------------------------------- colors

const C = (hex: string) => new THREE.Color(hex);
const ENAMEL = C('#F5EFE4');
const ENAMEL_NECK = C('#E6D3AE');
const ENAMEL_EDGE = C('#E4ECF2');
const ROOT = C('#E2CC9F');
const ROOT_APEX = C('#D4B684');
const CARIES = C('#4A2F1A');
const CARIES_HALO = C('#B08A5A');
const HEAT = [C('#FFE14D'), C('#FF9A1F'), C('#FF3B30'), C('#B0102B')];

function heatColor(t: number, out: THREE.Color) {
  const x = Math.min(0.999, Math.max(0, t)) * (HEAT.length - 1);
  const i = Math.floor(x);
  return out.copy(HEAT[i]).lerp(HEAT[i + 1], x - i);
}

function colorize(
  g: THREE.BufferGeometry,
  part: 'crown' | 'root',
  s: ToothShape,
  lesion: LesionInfo,
  condition: Finding['condition'] | null
): { normal: Float32Array; lesion: Float32Array } {
  const p = g.getAttribute('position');
  const normal = new Float32Array(p.count * 3);
  const heat = new Float32Array(p.count * 3);
  const c = new THREE.Color();
  const h = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    if (part === 'crown' && y < -0.005) {
      c.copy(ROOT).lerp(ENAMEL_NECK, smoothstep(-0.12, 0, y) * 0.35);
    } else if (part === 'crown') {
      const f = y / s.crownH;
      c.copy(ENAMEL_NECK).lerp(ENAMEL, smoothstep(0.0, 0.55, f));
      if (s.type === 'incisor' || s.type === 'canine') c.lerp(ENAMEL_EDGE, smoothstep(0.82, 1.05, f) * 0.6);
    } else {
      c.copy(ROOT).lerp(ROOT_APEX, smoothstep(-0.2, -s.rootLen, y));
    }
    const L = lesionWeight(lesion, x, y, z);
    // Natural appearance: caries shows as discolouration, bone loss as a darker exposed root.
    const nat = c.clone();
    if (L > 0.01) {
      if (condition === 'caries' && part === 'crown') {
        nat.lerp(CARIES_HALO, smoothstep(0.25, 0.6, L) * 0.6).lerp(CARIES, smoothstep(0.55, 0.95, L) * 0.9);
      } else if (condition === 'boneLoss' && part === 'root') {
        nat.lerp(C('#B89A62'), L * 0.45);
      } else if (condition === 'periapical' && part === 'root') {
        nat.lerp(C('#A77B55'), L * 0.4);
      }
    }
    normal[i * 3] = nat.r;
    normal[i * 3 + 1] = nat.g;
    normal[i * 3 + 2] = nat.b;
    // Lesion view: desaturated base + heat overlay.
    const base = nat.clone().lerp(C('#C9CDD3'), 0.35);
    if (L > 0.02) {
      heatColor(Math.pow(L, 0.8), h);
      base.lerp(h, smoothstep(0.04, 0.45, L));
      if (condition === 'caries' && part === 'crown') base.lerp(CARIES, smoothstep(0.82, 1, L) * 0.7);
    }
    heat[i * 3] = base.r;
    heat[i * 3 + 1] = base.g;
    heat[i * 3 + 2] = base.b;
  }
  return { normal, lesion: heat };
}

/** Push crown vertices inwards to form a shallow cavity for caries. */
function carveCavity(g: THREE.BufferGeometry, l: LesionInfo, depth: number) {
  const p = g.getAttribute('position');
  const n = g.getAttribute('normal');
  for (let i = 0; i < p.count; i++) {
    const L = lesionWeight(l, p.getX(i), p.getY(i), p.getZ(i));
    if (L < 0.2) continue;
    const k = depth * smoothstep(0.2, 1, L);
    p.setXYZ(i, p.getX(i) - n.getX(i) * k, p.getY(i) - n.getY(i) * k, p.getZ(i) - n.getZ(i) * k);
  }
  p.needsUpdate = true;
  g.computeVertexNormals();
}

// ----------------------------------------------------------------- public

export interface ToothModelData {
  shape: ToothShape;
  crown: THREE.BufferGeometry;
  roots: THREE.BufferGeometry;
  dentin: THREE.BufferGeometry;
  pulp: THREE.BufferGeometry;
  bone: THREE.BufferGeometry;
  gum: THREE.BufferGeometry;
  crownColors: { normal: Float32Array; lesion: Float32Array };
  rootColors: { normal: Float32Array; lesion: Float32Array };
  lesion: LesionInfo;
  /** Axis-aligned extent in the canonical frame. */
  minY: number;
  maxY: number;
  tiltDeg: number;
  neighbor: THREE.BufferGeometry | null;
}

const cache = new Map<string, ToothModelData>();

export function getToothModel(num: ToothNumber, finding: Finding | null): ToothModelData {
  const key = `${num}|${finding?.id ?? 'none'}|${finding?.condition ?? ''}|${finding?.lesion.surface ?? ''}|${finding?.severity ?? ''}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const s = shapeFor(num);
  const crown = buildCrown(s, { trunk: s.trunkLen });
  const roots = mergeGeometries(buildRoots(s));
  const dentin = mergeGeometries([
    buildCrown(s, { scaleW: 0.8, scaleD: 0.78, scaleH: 0.86, cuspScale: 0.75, segments: 56, rings: 36 }),
  ]);
  const pulp = buildPulp(s);

  const lesion = lesionFor(s, finding, crown, roots);
  if (finding?.condition === 'caries') {
    carveCavity(crown, lesion, finding.severity === 'Severe' ? 0.08 : finding.severity === 'Moderate' ? 0.05 : 0.03);
  }
  const condition = finding?.condition ?? null;
  const crownColors = colorize(crown, 'crown', s, lesion, condition);
  const rootColors = colorize(roots, 'root', s, lesion, condition);

  const lossDepth = finding?.condition === 'boneLoss' ? (finding.boneLossFraction ?? 0.3) * s.rootLen : 0;
  const impacted = finding?.condition === 'impacted';
  const { bone, gum } = buildBone(s, {
    crest: -0.14,
    lossDepth,
    lossWidth: 1.6,
    covering: impacted ? s.crownH * 0.72 : 0,
    widen: impacted ? 2.3 : 1,
    shiftX: impacted ? -s.halfW * 0.2 : 0,
  });

  let neighbor: THREE.BufferGeometry | null = null;
  if (impacted) {
    const ns = shapeFor(`${num[0]}7`);
    neighbor = mergeGeometries([buildCrown(ns, { segments: 48, rings: 30 }), ...buildRoots(ns)]);
  }

  const data: ToothModelData = {
    shape: s,
    crown,
    roots,
    dentin,
    pulp,
    bone,
    gum,
    crownColors,
    rootColors,
    lesion,
    minY: -s.rootLen - 0.1,
    maxY: s.crownH + (impacted ? 0.2 : 0),
    tiltDeg: impacted ? finding?.angulationDeg ?? 35 : 0,
    neighbor,
  };
  cache.set(key, data);
  return data;
}
