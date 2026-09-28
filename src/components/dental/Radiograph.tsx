import { memo, useMemo } from 'react';
import { Pressable, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { LOWER_ROW, toothMeta, toothWidth, UPPER_ROW } from '@/domain/fdi';
import type { Tooth, ToothNumber, ToothStatus, ToothType } from '@/domain/models';
import { fonts } from '@/theme';

/**
 * Stylised, procedurally drawn panoramic radiograph (OPG). It is a visual
 * simulation only — a real deployment would render the uploaded DICOM/PNG and
 * draw the model's boxes/masks/heatmaps returned by the AI service.
 */

export const PANO = { width: 1000, height: 520 };

export type ScanOverlay = 'original' | 'overlay' | 'findings';

interface PanoTooth {
  num: ToothNumber;
  type: ToothType;
  upper: boolean;
  cx: number;
  occ: number; // y of the occlusal end
  w: number;
  H: number; // crown + root length (px)
  cr: number; // crown fraction of H
  distalSign: 1 | -1; // +1 = distal is towards +x on screen
  box: { x: number; y: number; w: number; h: number };
}

const occlusalY = (x: number) => {
  const u = (x - 500) / 420;
  return 246 + 26 * (1 - u * u);
};

function layoutRow(row: ToothNumber[], upper: boolean): PanoTooth[] {
  const gap = 3;
  const k = 5.55;
  const total = row.reduce((a, n) => a + toothWidth(n) * k, 0) + gap * (row.length - 1);
  let x = 500 - total / 2;
  return row.map((num) => {
    const m = toothMeta(num);
    const w = toothWidth(num) * k;
    const cx = x + w / 2;
    x += w + gap;
    const crownMm = m.type === 'molar' ? 7.4 : m.type === 'premolar' ? 8.2 : m.type === 'canine' ? 10 : upper ? 10.4 : 9.2;
    const rootMm = m.type === 'molar' ? (m.position === 8 ? 11 : 13) : m.type === 'premolar' ? 14 : m.type === 'canine' ? 16.5 : upper ? 13 : 12.5;
    const H = (crownMm + rootMm) * 6.1;
    const occ = occlusalY(cx) + (upper ? -3 : 3);
    const distalSign: 1 | -1 = m.quadrant === 1 || m.quadrant === 4 ? -1 : 1;
    const top = upper ? occ - H : occ;
    return {
      num,
      type: m.type,
      upper,
      cx,
      occ,
      w,
      H,
      cr: crownMm / (crownMm + rootMm),
      distalSign,
      box: { x: cx - w / 2 - 3, y: top - 3, w: w + 6, h: H + 6 },
    };
  });
}

let cachedLayout: PanoTooth[] | null = null;
export function panoLayout(): PanoTooth[] {
  if (!cachedLayout) cachedLayout = [...layoutRow(UPPER_ROW, true), ...layoutRow(LOWER_ROW, false)];
  return cachedLayout;
}

// ---------------------------------------------------------------- shapes

type Pt = [number, number];

/** Catmull-Rom → cubic Bézier path through points (closed). */
function smooth(points: Pt[]): string {
  const n = points.length;
  let d = `M${points[0][0].toFixed(1)},${points[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d + ' Z';
}

function crownPts(type: ToothType, cr: number): Pt[] {
  switch (type) {
    case 'molar':
      return [[-0.4, cr], [-0.5, cr * 0.6], [-0.49, cr * 0.2], [-0.38, 0.02], [-0.2, 0.0], [-0.05, 0.05], [0.12, 0.0], [0.32, 0.02], [0.49, cr * 0.2], [0.5, cr * 0.6], [0.4, cr]];
    case 'premolar':
      return [[-0.36, cr], [-0.5, cr * 0.55], [-0.44, cr * 0.14], [-0.18, 0.01], [0, 0], [0.2, 0.02], [0.45, cr * 0.16], [0.5, cr * 0.55], [0.36, cr]];
    case 'canine':
      return [[-0.35, cr], [-0.5, cr * 0.5], [-0.34, cr * 0.14], [0, 0], [0.34, cr * 0.14], [0.5, cr * 0.5], [0.35, cr]];
    default:
      return [[-0.34, cr], [-0.47, cr * 0.45], [-0.45, 0.02], [0, 0], [0.45, 0.02], [0.47, cr * 0.45], [0.34, cr]];
  }
}

function rootPts(o: number, hw: number, cr: number, L: number, bend: number): Pt[] {
  return [
    [o - hw, cr - 0.03],
    [o - hw * 0.92 + bend * 0.25, cr + (L - cr) * 0.5],
    [o - hw * 0.3 + bend, L - 0.015],
    [o + bend, L],
    [o + hw * 0.3 + bend, L - 0.015],
    [o + hw * 0.92 + bend * 0.25, cr + (L - cr) * 0.5],
    [o + hw, cr - 0.03],
  ];
}

function rootsFor(t: PanoTooth): { pts: Pt[]; canal: [Pt, Pt, Pt] }[] {
  const b = 0.07 * t.distalSign;
  const make = (o: number, hw: number, L: number, bend: number) => ({
    pts: rootPts(o, hw, t.cr, L, bend),
    canal: [
      [o * 0.6, t.cr - 0.02],
      [o + bend * 0.3, t.cr + (L - t.cr) * 0.5],
      [o + bend, L - 0.04],
    ] as [Pt, Pt, Pt],
  });
  if (t.type === 'molar') {
    return [make(-0.22, 0.19, 1, t.distalSign < 0 ? b * 1.4 : b), make(0.22, 0.18, 0.95, t.distalSign > 0 ? b * 1.4 : b)];
  }
  return [make(0, t.type === 'incisor' ? 0.32 : 0.34, 1, b * 0.6)];
}

function toScreen(t: PanoTooth, [u, v]: Pt, tilt = 0, drop = 0): Pt {
  const dir = t.upper ? -1 : 1;
  let x = u * t.w;
  let y = v * t.H * dir + drop * dir;
  if (tilt) {
    // rotate around the crown centre
    const cy = t.cr * 0.5 * t.H * dir;
    const a = (tilt * Math.PI) / 180;
    const dx = x;
    const dy = y - cy;
    x = dx * Math.cos(a) - dy * Math.sin(a);
    y = cy + dx * Math.sin(a) + dy * Math.cos(a);
  }
  return [t.cx + x, t.occ + y];
}

const pathFor = (t: PanoTooth, pts: Pt[], tilt = 0, drop = 0) => smooth(pts.map((p) => toScreen(t, p, tilt, drop)));

/** Location (screen coords) of a heat point given in crown-up crop coords (0–1). */
export function heatToScreen(t: PanoTooth, hx: number, hy: number): Pt {
  const u = (t.distalSign > 0 ? hx : 1 - hx) - 0.5;
  return toScreen(t, [u, hy]);
}

const STATUS_HEX: Record<ToothStatus, string> = {
  healthy: '#34D17A',
  attention: '#FFB020',
  priority: '#FF4D4F',
  unknown: '#8FA1B8',
};

// ------------------------------------------------------------ component

export const Radiograph = memo(function Radiograph({
  teeth,
  overlay = 'original',
  width,
  focus,
  showHeat,
  selected,
  onSelectTooth,
  scanning,
}: {
  teeth: Tooth[] | null; // null → unanalysed scan (no findings)
  overlay?: ScanOverlay;
  width: number;
  /** Crop to one tooth (XAI view). */
  focus?: ToothNumber;
  showHeat?: boolean;
  selected?: ToothNumber | null;
  onSelectTooth?: (n: ToothNumber) => void;
  scanning?: number; // 0–1 position of a scan line
}) {
  const layout = useMemo(() => panoLayout(), []);
  const byNum = useMemo(() => new Map((teeth ?? []).map((t) => [t.toothNumber, t])), [teeth]);

  let vb = `0 0 ${PANO.width} ${PANO.height}`;
  let vbW = PANO.width;
  let vbH = PANO.height;
  if (focus) {
    const t = layout.find((l) => l.num === focus)!;
    const cw = Math.max(t.w * 2.6, t.H * 0.95);
    const ch = t.H * 1.25;
    const cy = t.upper ? t.occ - t.H / 2 : t.occ + t.H / 2;
    vb = `${(t.cx - cw / 2).toFixed(1)} ${(cy - ch / 2).toFixed(1)} ${cw.toFixed(1)} ${ch.toFixed(1)}`;
    vbW = cw;
    vbH = ch;
  }
  const height = (width * vbH) / vbW;
  const strokeScale = focus ? vbW / PANO.width : 1;

  return (
    <View style={{ width, height, backgroundColor: '#030405' }}>
      <Svg width={width} height={height} viewBox={vb} preserveAspectRatio="xMidYMid slice">
        <Defs>
          <RadialGradient id="xr-bg" cx="50%" cy="50%" r="65%">
            <Stop offset="0" stopColor="#1C1D20" />
            <Stop offset="1" stopColor="#030405" />
          </RadialGradient>
          <LinearGradient id="xr-max" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#2A2B2E" />
            <Stop offset="1" stopColor="#4C4D50" />
          </LinearGradient>
          <LinearGradient id="xr-mand" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#505154" />
            <Stop offset="0.75" stopColor="#3C3D40" />
            <Stop offset="1" stopColor="#6A6B6E" />
          </LinearGradient>
          <RadialGradient id="xr-dark" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#060606" stopOpacity={0.95} />
            <Stop offset="0.7" stopColor="#0A0A0A" stopOpacity={0.6} />
            <Stop offset="1" stopColor="#0A0A0A" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="xr-vignette" cx="50%" cy="50%" r="72%">
            <Stop offset="0.6" stopColor="#000" stopOpacity={0} />
            <Stop offset="1" stopColor="#000" stopOpacity={0.85} />
          </RadialGradient>
          <RadialGradient id="heat" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#FF2D2D" stopOpacity={0.9} />
            <Stop offset="0.35" stopColor="#FF7A1A" stopOpacity={0.7} />
            <Stop offset="0.65" stopColor="#FFD60A" stopOpacity={0.35} />
            <Stop offset="1" stopColor="#FFD60A" stopOpacity={0} />
          </RadialGradient>
          <LinearGradient id="scanline" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#37D4FF" stopOpacity={0} />
            <Stop offset="0.5" stopColor="#37D4FF" stopOpacity={0.9} />
            <Stop offset="1" stopColor="#37D4FF" stopOpacity={0} />
          </LinearGradient>
        </Defs>

        <Rect x={-200} y={-200} width={PANO.width + 400} height={PANO.height + 400} fill="url(#xr-bg)" />

        {/* Skull / jaw anatomy (simplified) */}
        <Path d="M60,250 C90,120 220,70 500,64 C780,70 910,120 940,250 L940,262 C700,244 300,244 60,262 Z" fill="url(#xr-max)" />
        <Ellipse cx={300} cy={120} rx={120} ry={52} fill="#141517" opacity={0.85} />
        <Ellipse cx={700} cy={120} rx={120} ry={52} fill="#141517" opacity={0.85} />
        <Ellipse cx={500} cy={96} rx={70} ry={40} fill="#0E0F10" opacity={0.9} />
        <Path d="M40,120 C60,200 70,300 110,420 C200,478 360,494 500,496 C640,494 800,478 890,420 C930,300 940,200 960,120 L930,110 C900,210 880,290 850,300 C700,286 300,286 150,300 C120,290 100,210 70,110 Z" fill="url(#xr-mand)" />
        <Path d="M150,300 C300,290 700,290 850,300 L840,322 C700,312 300,312 160,322 Z" fill="#2A2B2D" opacity={0.6} />
        {/* Mandibular canal */}
        <Path d="M130,330 C250,400 380,420 500,424 C620,420 750,400 870,330" stroke="#1D1E20" strokeWidth={10} fill="none" opacity={0.7} />

        {/* Teeth */}
        {layout.map((t) => {
          const tooth = byNum.get(t.num);
          const missing = tooth?.note?.startsWith('Tooth not present');
          if (missing) return null;
          const f = tooth?.finding;
          const tilt = f?.condition === 'impacted' ? (f.angulationDeg ?? 35) * -t.distalSign : 0;
          const drop = f?.condition === 'impacted' ? t.H * 0.16 : 0;
          const roots = rootsFor(t);
          const crown = crownPts(t.type, t.cr);
          const dentin = crown.map(([u, v]) => [u * 0.78, v * 0.9 + t.cr * 0.06] as Pt);
          const pulp: Pt[] = [
            [-0.18, t.cr * 0.95],
            [-0.2, t.cr * 0.62],
            [-0.1, t.cr * 0.48],
            [0.1, t.cr * 0.48],
            [0.2, t.cr * 0.62],
            [0.18, t.cr * 0.95],
          ];
          const status = tooth?.status ?? 'unknown';
          return (
            <G key={t.num}>
              {/* Bone-loss: darker crest region around the tooth */}
              {f?.condition === 'boneLoss' ? (
                <>
                  <Ellipse
                    cx={toScreen(t, [-0.6, t.cr + 0.12])[0]}
                    cy={toScreen(t, [-0.6, t.cr + 0.12])[1]}
                    rx={t.w * 0.3}
                    ry={t.H * 0.2}
                    fill="url(#xr-dark)"
                  />
                  <Ellipse
                    cx={toScreen(t, [0.6, t.cr + 0.12])[0]}
                    cy={toScreen(t, [0.6, t.cr + 0.12])[1]}
                    rx={t.w * 0.3}
                    ry={t.H * 0.2}
                    fill="url(#xr-dark)"
                  />
                </>
              ) : null}
              {roots.map((r, i) => (
                <Path key={`r${i}`} d={pathFor(t, r.pts, tilt, drop)} fill="#8E8F92" opacity={0.92} />
              ))}
              {roots.map((r, i) => {
                const a = toScreen(t, r.canal[0], tilt, drop);
                const b = toScreen(t, r.canal[1], tilt, drop);
                const c = toScreen(t, r.canal[2], tilt, drop);
                return (
                  <Path
                    key={`c${i}`}
                    d={`M${a[0]},${a[1]} Q${b[0]},${b[1]} ${c[0]},${c[1]}`}
                    stroke="#4A4B4E"
                    strokeWidth={Math.max(1.4, t.w * 0.06)}
                    fill="none"
                    strokeLinecap="round"
                  />
                );
              })}
              <Path d={pathFor(t, crown, tilt, drop)} fill="#EDEDEE" />
              <Path d={pathFor(t, dentin, tilt, drop)} fill="#C4C5C8" />
              <Path d={pathFor(t, pulp, tilt, drop)} fill="#4A4B4E" />

              {/* Radiographic lesions visible on the "original" image */}
              {f?.condition === 'caries'
                ? (() => {
                    const h = tooth!.xai?.heatmap[0];
                    if (!h) return null;
                    const [x, y] = heatToScreen(t, h.x, h.y);
                    const r = t.w * (f.severity === 'Severe' ? 0.2 : f.severity === 'Moderate' ? 0.15 : 0.11);
                    return <Ellipse cx={x} cy={y} rx={r} ry={r * 0.8} fill="url(#xr-dark)" />;
                  })()
                : null}
              {f?.condition === 'periapical'
                ? (() => {
                    const [x, y] = toScreen(t, [0.0, 1.02]);
                    return <Circle cx={x} cy={y} r={t.w * 0.42} fill="url(#xr-dark)" />;
                  })()
                : null}

              {/* AI overlay: detection boxes + segmentation tint */}
              {overlay !== 'original' && tooth && tooth.healthIndex != null ? (
                <>
                  <Path d={pathFor(t, crown, tilt, drop)} fill={STATUS_HEX[status]} opacity={overlay === 'overlay' ? 0.28 : 0.12} />
                  {overlay === 'overlay' ? (
                    <>
                      <Rect
                        x={t.box.x}
                        y={t.box.y}
                        width={t.box.w}
                        height={t.box.h}
                        fill="none"
                        stroke={selected === t.num ? '#FFFFFF' : STATUS_HEX[status]}
                        strokeWidth={(selected === t.num ? 2.2 : 1.1) * strokeScale * (focus ? 2 : 1)}
                        strokeOpacity={0.85}
                        rx={3}
                      />
                      <Rect
                        x={t.box.x}
                        y={t.upper ? t.box.y - 15 : t.box.y + t.box.h}
                        width={24}
                        height={15}
                        rx={3}
                        fill={STATUS_HEX[status]}
                      />
                      <SvgText
                        x={t.box.x + 12}
                        y={t.upper ? t.box.y - 4 : t.box.y + t.box.h + 11}
                        fontSize={10}
                        fontFamily={fonts.bold}
                        fill="#07111F"
                        textAnchor="middle">
                        {t.num}
                      </SvgText>
                    </>
                  ) : null}
                </>
              ) : null}

            </G>
          );
        })}

        {/* Findings heatmaps + callouts */}
        {teeth &&
          (overlay === 'findings' || showHeat) &&
          layout.map((t) => {
            const tooth = byNum.get(t.num);
            if (!tooth?.finding || !tooth.xai) return null;
            if (focus && t.num !== focus) return null;
            const f = tooth.finding;
            const tilt = f.condition === 'impacted' ? (f.angulationDeg ?? 35) * -t.distalSign : 0;
            return (
              <G key={`h${t.num}`}>
                {tooth.xai.heatmap.map((h, i) => {
                  const [x, y] = tilt ? toScreen(t, [(t.distalSign > 0 ? h.x : 1 - h.x) - 0.5, h.y], tilt, t.H * 0.16) : heatToScreen(t, h.x, h.y);
                  const r = h.radius * t.H * 0.9;
                  return <Circle key={i} cx={x} cy={y} r={r} fill="url(#heat)" opacity={Math.min(1, h.intensity + 0.1)} />;
                })}
                {!focus ? (
                  (() => {
                    const [x, y] = heatToScreen(t, tooth.xai.heatmap[0].x, tooth.xai.heatmap[0].y);
                    const ly = t.upper ? t.box.y - 26 : t.box.y + t.box.h + 34;
                    const label = `${t.num} · ${f.shortTitle} ${Math.round(f.confidence * 100)}%`;
                    const lw = label.length * 6.4 + 14;
                    const lx = Math.min(PANO.width - lw - 6, Math.max(6, x - lw / 2));
                    return (
                      <>
                        <Line x1={x} y1={y} x2={x} y2={t.upper ? ly + 4 : ly - 14} stroke="#FF6B6B" strokeWidth={1.2} strokeDasharray="3 3" />
                        <Circle cx={x} cy={y} r={3} fill="#FF6B6B" />
                        <Rect x={lx} y={t.upper ? ly - 14 : ly - 14} width={lw} height={19} rx={5} fill="#1A0B0D" stroke="#FF6B6B" strokeWidth={1} />
                        <SvgText x={lx + lw / 2} y={ly} fontSize={11} fontFamily={fonts.semibold} fill="#FFD5D5" textAnchor="middle">
                          {label}
                        </SvgText>
                      </>
                    );
                  })()
                ) : null}
              </G>
            );
          })}

        {scanning != null ? (
          <Rect x={-200} y={PANO.height * scanning - 3} width={PANO.width + 400} height={6} fill="url(#scanline)" />
        ) : null}

        <Rect x={-200} y={-200} width={PANO.width + 400} height={PANO.height + 400} fill="url(#xr-vignette)" pointerEvents="none" />

        {!focus ? (
          <>
            <SvgText x={24} y={34} fontSize={14} fontFamily={fonts.bold} fill="#D5D8DE" opacity={0.85}>
              R
            </SvgText>
            <SvgText x={966} y={34} fontSize={14} fontFamily={fonts.bold} fill="#D5D8DE" opacity={0.85}>
              L
            </SvgText>
            <SvgText x={500} y={508} fontSize={10} fontFamily={fonts.semibold} fill="#8A8E96" textAnchor="middle" letterSpacing={1}>
              SIMULATED RADIOGRAPH — DEMO IMAGE, NOT PATIENT DATA
            </SvgText>
          </>
        ) : null}
      </Svg>
      {onSelectTooth && !focus
        ? layout.map((t) => {
            const k = width / PANO.width;
            return (
              <Pressable
                key={t.num}
                testID={`scan-tooth-${t.num}`}
                accessibilityLabel={`Tooth ${t.num} on scan`}
                onPress={() => onSelectTooth(t.num)}
                style={{ position: 'absolute', left: t.box.x * k, top: t.box.y * k, width: t.box.w * k, height: t.box.h * k }}
              />
            );
          })
        : null}
    </View>
  );
});
