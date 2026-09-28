import { Text as RNText, type TextProps, type TextStyle } from 'react-native';

import { fonts, usePalette, type Palette } from '@/theme';

export type TextVariant =
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'title'
  | 'body'
  | 'bodySm'
  | 'caption'
  | 'label'
  | 'overline'
  | 'metric';

const VARIANTS: Record<TextVariant, TextStyle> = {
  display: { fontFamily: fonts.display, fontSize: 34, lineHeight: 40, letterSpacing: -0.8 },
  h1: { fontFamily: fonts.display, fontSize: 26, lineHeight: 32, letterSpacing: -0.5 },
  h2: { fontFamily: fonts.heading, fontSize: 20, lineHeight: 26, letterSpacing: -0.3 },
  h3: { fontFamily: fonts.heading, fontSize: 16, lineHeight: 22, letterSpacing: -0.1 },
  title: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 20 },
  body: { fontFamily: fonts.body, fontSize: 14, lineHeight: 21 },
  bodySm: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16 },
  label: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 16, letterSpacing: 0.2 },
  overline: { fontFamily: fonts.bold, fontSize: 10.5, lineHeight: 14, letterSpacing: 1.2, textTransform: 'uppercase' },
  metric: { fontFamily: fonts.display, fontSize: 28, lineHeight: 32, letterSpacing: -0.6 },
};

type Tone = 'default' | 'muted' | 'faint' | 'primary' | 'inverse' | 'studio' | 'studioMuted';

function toneColor(p: Palette, tone: Tone): string {
  switch (tone) {
    case 'muted':
      return p.textMuted;
    case 'faint':
      return p.textFaint;
    case 'primary':
      return p.primary;
    case 'inverse':
      return p.primaryText;
    case 'studio':
      return p.studioText;
    case 'studioMuted':
      return p.studioMuted;
    default:
      return p.text;
  }
}

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
  tone?: Tone;
  color?: string;
  align?: TextStyle['textAlign'];
}

export function Text({ variant = 'body', tone = 'default', color, align, style, ...rest }: AppTextProps) {
  const p = usePalette();
  return (
    <RNText
      {...rest}
      style={[VARIANTS[variant], { color: color ?? toneColor(p, tone) }, align ? { textAlign: align } : null, style]}
    />
  );
}
