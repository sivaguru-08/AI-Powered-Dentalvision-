import { memo, useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Polyline, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';

import { LOWER_ROW, UPPER_ROW } from '@/domain/fdi';
import type { Tooth, ToothNumber, ToothStatus } from '@/domain/models';
import { fonts, statusColor, usePalette } from '@/theme';

import { ARCH_VIEW, archLayout, toothGlyph } from './archLayout';

const STATUS_FILL: Record<ToothStatus, { light: [string, string]; dark: [string, string] }> = {
  healthy: { light: ['#F1FBF4', '#BFEBCD'], dark: ['#1E4D32', '#12301F'] },
  attention: { light: ['#FFF8E6', '#FFD98A'], dark: ['#5A4312', '#33260A'] },
  priority: { light: ['#FFEDED', '#FFB3B5'], dark: ['#5E1E22', '#3A1216'] },
  unknown: { light: ['#F4F6F9', '#D5DCE5'], dark: ['#27313F', '#1A2230'] },
};

/** Short tween (0→1) restarted whenever `key` changes. */
function useTween(key: string | null, duration = 320) {
  const [t, setT] = useState(1);
  useEffect(() => {
    if (!key) return;
    let raf = 0;
    const start = Date.now();
    const step = () => {
      const k = Math.min(1, (Date.now() - start) / duration);
      setT(k);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [key, duration]);
  return t;
}

export const DentalArch = memo(function DentalArch({
  teeth,
  selected,
  onSelect,
  width,
}: {
  teeth: Tooth[];
  selected: ToothNumber | null;
  onSelect: (n: ToothNumber) => void;
  width: number;
}) {
  const p = usePalette();
  const layout = useMemo(() => archLayout(), []);
  const byNum = useMemo(() => new Map(teeth.map((t) => [t.toothNumber, t])), [teeth]);
  const tween = useTween(selected);
  const height = (width * ARCH_VIEW.height) / ARCH_VIEW.width;
  const dark = p.scheme === 'dark';

  const gumPath = (row: ToothNumber[]) =>
    row
      .map((n) => layout.find((l) => l.num === n)!)
      .map((l) => `${l.cx.toFixed(1)},${l.cy.toFixed(1)}`)
      .join(' ');

  const easeOutBack = (x: number) => 1 + 2.2 * Math.pow(x - 1, 3) + 1.2 * Math.pow(x - 1, 2);

  return (
    <View style={{ width, height }} testID="dental-arch">
      <Svg width={width} height={height} viewBox={`0 0 ${ARCH_VIEW.width} ${ARCH_VIEW.height}`}>
        <Defs>
          {(Object.keys(STATUS_FILL) as ToothStatus[]).map((s) => {
            const [a, b] = STATUS_FILL[s][dark ? 'dark' : 'light'];
            return (
              <LinearGradient key={s} id={`fill-${s}`} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={a} />
                <Stop offset="1" stopColor={b} />
              </LinearGradient>
            );
          })}
          <RadialGradient id="palate" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={dark ? '#1A2A44' : '#E9F1FC'} stopOpacity={1} />
            <Stop offset="1" stopColor={dark ? '#0E1828' : '#F7FAFE'} stopOpacity={0} />
          </RadialGradient>
        </Defs>

        {/* Palate / tongue areas */}
        <Circle cx={180} cy={150} r={110} fill="url(#palate)" />
        <Circle cx={180} cy={380} r={100} fill="url(#palate)" />

        {/* Gingiva bands */}
        {[UPPER_ROW, LOWER_ROW].map((row, i) => (
          <Polyline
            key={i}
            points={gumPath(row)}
            fill="none"
            stroke={dark ? '#3B2433' : '#F9E3E7'}
            strokeWidth={40}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {/* Midline + orientation labels */}
        <Line x1={180} y1={40} x2={180} y2={480} stroke={p.borderStrong} strokeDasharray="3 5" strokeWidth={0.8} />
        <SvgText x={180} y={176} fill={p.textFaint} fontSize={9} fontFamily={fonts.bold} textAnchor="middle" letterSpacing={1.6}>
          UPPER · MAXILLA
        </SvgText>
        <SvgText x={180} y={358} fill={p.textFaint} fontSize={9} fontFamily={fonts.bold} textAnchor="middle" letterSpacing={1.6}>
          LOWER · MANDIBLE
        </SvgText>
        <SvgText x={14} y={268} fill={p.textMuted} fontSize={11} fontFamily={fonts.bold}>
          R
        </SvgText>
        <SvgText x={339} y={268} fill={p.textMuted} fontSize={11} fontFamily={fonts.bold}>
          L
        </SvgText>

        {/* Teeth */}
        {layout.map((l) => {
          const t = byNum.get(l.num);
          const status: ToothStatus = t?.status ?? 'unknown';
          const isSel = selected === l.num;
          const glyph = toothGlyph(l.type, l.w, l.d);
          const col = statusColor(p, status);
          const scale = isSel ? 1 + 0.18 * easeOutBack(tween) : 1;
          const missing = t?.healthIndex == null;
          return (
            <G key={l.num}>
              <G transform={`translate(${l.cx.toFixed(2)} ${l.cy.toFixed(2)}) rotate(${l.angle.toFixed(2)}) scale(${scale.toFixed(3)})`}>
                {isSel ? (
                  <Circle r={Math.max(l.w, l.d) * 0.72} fill={p.primary} fillOpacity={0.14 * tween} stroke={p.primary} strokeOpacity={0.5 * tween} strokeWidth={1} />
                ) : null}
                <Path
                  d={glyph.outline}
                  fill={`url(#fill-${status})`}
                  stroke={isSel ? p.primary : col}
                  strokeWidth={isSel ? 2.2 : 1.3}
                  strokeDasharray={missing ? '2.5 2' : undefined}
                  opacity={missing ? 0.75 : 1}
                />
                {glyph.cusps.map((c, i) => (
                  <Circle key={i} cx={c.x} cy={c.y} r={c.r} fill="#FFFFFF" fillOpacity={dark ? 0.06 : 0.45} />
                ))}
                <Path d={glyph.details} stroke={col} strokeOpacity={0.45} strokeWidth={0.9} fill="none" strokeLinecap="round" />
                {t?.finding ? <Circle cx={0} cy={0} r={2.6} fill={col} /> : null}
              </G>
              {t?.finding || isSel ? (
                <Circle cx={l.labelX} cy={l.labelY - 3.2} r={8.2} fill={isSel ? p.primary : col} />
              ) : null}
              <SvgText
                x={l.labelX}
                y={l.labelY}
                fontSize={isSel ? 9 : 8.6}
                fontFamily={fonts.bold}
                textAnchor="middle"
                fill={t?.finding || isSel ? '#FFFFFF' : p.textMuted}>
                {l.num}
              </SvgText>
            </G>
          );
        })}
      </Svg>
      {/* Touch targets (native Views are more reliable than SVG press handlers on every platform) */}
      {layout.map((l) => {
        const k = width / ARCH_VIEW.width;
        const size = Math.max(26, Math.max(l.w, l.d) * 1.12 * k);
        return (
          <Pressable
            key={l.num}
            testID={`arch-tooth-${l.num}`}
            accessibilityRole="button"
            accessibilityLabel={`Tooth ${l.num}`}
            onPress={() => onSelect(l.num)}
            hitSlop={2}
            style={{ position: 'absolute', left: l.cx * k - size / 2, top: l.cy * k - size / 2, width: size, height: size, borderRadius: size / 2 }}
          />
        );
      })}
    </View>
  );
});
