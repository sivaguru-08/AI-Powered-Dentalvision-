import type { ToothStatus } from '@/domain/models';

export interface Palette {
  scheme: 'light' | 'dark';
  bg: string;
  bgAlt: string;
  surface: string;
  surfaceAlt: string;
  surfaceRaised: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  textFaint: string;
  primary: string;
  primarySoft: string;
  primaryText: string;
  accent: string;
  accentSoft: string;
  healthy: string;
  healthySoft: string;
  attention: string;
  attentionSoft: string;
  priority: string;
  prioritySoft: string;
  unknown: string;
  unknownSoft: string;
  simulation: string;
  simulationSoft: string;
  shadow: string;
  overlay: string;
  /** Always-dark studio surfaces (3D viewer, scan viewer, hero cards). */
  studio: string;
  studioAlt: string;
  studioBorder: string;
  studioText: string;
  studioMuted: string;
  heroGradient: [string, string, string];
}

export const light: Palette = {
  scheme: 'light',
  bg: '#F3F6FA',
  bgAlt: '#EAF0F7',
  surface: '#FFFFFF',
  surfaceAlt: '#F6F8FB',
  surfaceRaised: '#FFFFFF',
  border: '#E3E9F1',
  borderStrong: '#CCD6E3',
  text: '#0B1A2C',
  textMuted: '#55667C',
  textFaint: '#8A99AD',
  primary: '#1766E8',
  primarySoft: '#E6EFFD',
  primaryText: '#FFFFFF',
  accent: '#0FA3A3',
  accentSoft: '#E0F5F4',
  healthy: '#16A34A',
  healthySoft: '#E3F6EA',
  attention: '#E59400',
  attentionSoft: '#FFF3DB',
  priority: '#E0474C',
  prioritySoft: '#FDE8E8',
  unknown: '#94A3B8',
  unknownSoft: '#EEF1F5',
  simulation: '#7A5AF8',
  simulationSoft: '#F0ECFF',
  shadow: '#0B1A2C',
  overlay: 'rgba(8, 17, 32, 0.45)',
  studio: '#07111F',
  studioAlt: '#0D1B2E',
  studioBorder: 'rgba(148, 176, 214, 0.16)',
  studioText: '#EAF1FB',
  studioMuted: '#8EA3BF',
  heroGradient: ['#0A1A33', '#0F2F57', '#0E5A73'],
};

export const dark: Palette = {
  scheme: 'dark',
  bg: '#060D18',
  bgAlt: '#0A1422',
  surface: '#0E1828',
  surfaceAlt: '#132035',
  surfaceRaised: '#16243A',
  border: '#1C2B42',
  borderStrong: '#2A3D5A',
  text: '#E8EFF8',
  textMuted: '#93A5BD',
  textFaint: '#63758D',
  primary: '#4B8DF8',
  primarySoft: '#14284A',
  primaryText: '#FFFFFF',
  accent: '#2CC5C0',
  accentSoft: '#0F3033',
  healthy: '#34C466',
  healthySoft: '#0F2E1D',
  attention: '#F5A524',
  attentionSoft: '#33250B',
  priority: '#F2555A',
  prioritySoft: '#3A1519',
  unknown: '#6B7C93',
  unknownSoft: '#1A2536',
  simulation: '#9B85FF',
  simulationSoft: '#211A45',
  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.6)',
  studio: '#040A14',
  studioAlt: '#0A1628',
  studioBorder: 'rgba(148, 176, 214, 0.14)',
  studioText: '#EAF1FB',
  studioMuted: '#8EA3BF',
  heroGradient: ['#081326', '#0C2546', '#0B4658'],
};

export const radius = { xs: 6, sm: 10, md: 14, lg: 18, xl: 24, pill: 999 } as const;
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, xxxl: 40 } as const;

export const fonts = {
  display: 'Manrope_800ExtraBold',
  heading: 'Manrope_700Bold',
  headingSemi: 'Manrope_600SemiBold',
  body: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export function statusColor(p: Palette, s: ToothStatus): string {
  return { healthy: p.healthy, attention: p.attention, priority: p.priority, unknown: p.unknown }[s];
}

export function statusSoft(p: Palette, s: ToothStatus): string {
  return { healthy: p.healthySoft, attention: p.attentionSoft, priority: p.prioritySoft, unknown: p.unknownSoft }[s];
}

/** Color for a raw 0–100 score (heatmaps, bars). */
export function scoreColor(p: Palette, score: number | null): string {
  if (score == null) return p.unknown;
  if (score >= 85) return p.healthy;
  if (score >= 65) return p.attention;
  return p.priority;
}
