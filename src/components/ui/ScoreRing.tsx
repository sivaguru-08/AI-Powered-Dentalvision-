import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { fonts, scoreColor, usePalette } from '@/theme';

import { Text } from './Text';

/** Animates a number from 0 to `target` with an ease-out curve. */
export function useCountUp(target: number, duration = 900) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = Date.now();
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setV(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return v;
}

export function ScoreRing({
  score,
  size = 120,
  stroke = 11,
  label,
  sublabel = '/ 100',
  tone = 'default',
  color,
}: {
  score: number | null;
  size?: number;
  stroke?: number;
  label?: string;
  sublabel?: string;
  tone?: 'default' | 'studio';
  color?: string;
}) {
  const p = usePalette();
  const animated = useCountUp(score ?? 0);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const col = color ?? scoreColor(p, score);
  const studio = tone === 'studio';
  const id = `ring-${size}-${stroke}-${col.replace('#', '')}`;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={col} stopOpacity={1} />
            <Stop offset="1" stopColor={col} stopOpacity={0.65} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={studio ? 'rgba(255,255,255,0.08)' : p.surfaceAlt}
          strokeWidth={stroke}
          fill="none"
        />
        {score != null ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={`url(#${id})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${c} ${c}`}
            strokeDashoffset={c * (1 - animated / 100)}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        ) : null}
      </Svg>
      <Text
        style={{
          fontFamily: fonts.display,
          fontSize: size * 0.27,
          lineHeight: size * 0.32,
          letterSpacing: -1,
          color: studio ? p.studioText : p.text,
        }}>
        {score == null ? '—' : Math.round(animated)}
      </Text>
      <Text variant="caption" tone={studio ? 'studioMuted' : 'faint'} style={{ marginTop: -2 }}>
        {sublabel}
      </Text>
      {label ? (
        <Text variant="overline" tone={studio ? 'studioMuted' : 'muted'} style={{ marginTop: 2 }}>
          {label}
        </Text>
      ) : null}
    </View>
  );
}
