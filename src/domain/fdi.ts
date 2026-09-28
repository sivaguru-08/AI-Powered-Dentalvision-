import type { Arch, Side, ToothNumber, ToothType } from './models';

/**
 * FDI (ISO 3950) permanent dentition helpers.
 * Quadrants: 1 = upper right, 2 = upper left, 3 = lower left, 4 = lower right.
 */

export const UPPER_RIGHT: ToothNumber[] = ['18', '17', '16', '15', '14', '13', '12', '11'];
export const UPPER_LEFT: ToothNumber[] = ['21', '22', '23', '24', '25', '26', '27', '28'];
export const LOWER_LEFT: ToothNumber[] = ['31', '32', '33', '34', '35', '36', '37', '38'];
export const LOWER_RIGHT: ToothNumber[] = ['48', '47', '46', '45', '44', '43', '42', '41'];

/** Display order as seen facing the patient: patient's right on the viewer's left. */
export const UPPER_ROW: ToothNumber[] = [...UPPER_RIGHT, ...UPPER_LEFT];
export const LOWER_ROW: ToothNumber[] = [...LOWER_RIGHT, ...LOWER_LEFT];
export const ALL_TEETH: ToothNumber[] = [...UPPER_ROW, ...LOWER_ROW];

const POSITION_NAMES: Record<number, { name: string; type: ToothType }> = {
  1: { name: 'Central Incisor', type: 'incisor' },
  2: { name: 'Lateral Incisor', type: 'incisor' },
  3: { name: 'Canine', type: 'canine' },
  4: { name: 'First Premolar', type: 'premolar' },
  5: { name: 'Second Premolar', type: 'premolar' },
  6: { name: 'First Molar', type: 'molar' },
  7: { name: 'Second Molar', type: 'molar' },
  8: { name: 'Third Molar', type: 'molar' },
};

export interface ToothMeta {
  number: ToothNumber;
  quadrant: 1 | 2 | 3 | 4;
  position: number; // 1..8 from midline
  arch: Arch;
  side: Side;
  type: ToothType;
  name: string; // "Lower Right First Molar"
  shortName: string; // "First Molar"
}

export function toothMeta(num: ToothNumber): ToothMeta {
  const quadrant = Number(num[0]) as 1 | 2 | 3 | 4;
  const position = Number(num[1]);
  const arch: Arch = quadrant <= 2 ? 'upper' : 'lower';
  const side: Side = quadrant === 1 || quadrant === 4 ? 'right' : 'left';
  const base = POSITION_NAMES[position];
  const archName = arch === 'upper' ? 'Upper' : 'Lower';
  const sideName = side === 'right' ? 'Right' : 'Left';
  return {
    number: num,
    quadrant,
    position,
    arch,
    side,
    type: base.type,
    name: `${archName} ${sideName} ${base.name}`,
    shortName: base.name,
  };
}

/** Relative mesio-distal crown width (mm, approximate average anatomy). */
export function toothWidth(num: ToothNumber): number {
  const { arch, position } = toothMeta(num);
  const upper = [0, 8.6, 6.6, 7.6, 7.0, 6.6, 10.2, 9.0, 8.6];
  const lower = [0, 5.4, 5.9, 6.9, 7.0, 7.1, 11.0, 10.4, 10.0];
  return (arch === 'upper' ? upper : lower)[position];
}

/** Relative bucco-lingual crown depth (mm). */
export function toothDepth(num: ToothNumber): number {
  const { arch, position } = toothMeta(num);
  const upper = [0, 7.0, 6.2, 8.0, 9.2, 9.0, 11.2, 11.0, 10.4];
  const lower = [0, 6.0, 6.2, 7.6, 7.8, 8.0, 10.4, 10.0, 9.6];
  return (arch === 'upper' ? upper : lower)[position];
}

export function isValidTooth(num: string): num is ToothNumber {
  return ALL_TEETH.includes(num);
}

/** Neighbouring tooth in chart order, for prev/next navigation. */
export function adjacentTooth(num: ToothNumber, dir: -1 | 1): ToothNumber {
  const i = ALL_TEETH.indexOf(num);
  const n = ALL_TEETH.length;
  return ALL_TEETH[(i + dir + n) % n];
}
