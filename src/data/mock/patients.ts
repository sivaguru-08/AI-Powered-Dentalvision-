import type { ConditionType, ScanType, Severity, StudyStatus, ToothSurface } from '@/domain/models';

/**
 * Compact, JSON-style scenario definitions for the demo patients.
 * The MockRepository expands these into full domain objects. Nothing here is
 * real patient data — all names and results are fictional simulations.
 */

export interface MockFindingSpec {
  tooth: string;
  condition: Exclude<ConditionType, 'healthy'>;
  severity: Severity;
  confidence: number;
  surface: ToothSurface;
  /** Structural, caries risk, root, bone, clinical (0–100). */
  dims: [number, number, number, number, number];
  /** Image evidence, localization quality. Model confidence = `confidence`. */
  xai: [number, number];
  /** Lesion vertical position on the tooth (-1 apex .. 1 occlusal) and spread. */
  lesionHeight: number;
  lesionSpread: number;
  angulationDeg?: number;
  boneLossFraction?: number;
}

export interface MockPatientSpec {
  id: string;
  code: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female';
  doctor: string;
  assignedNurse: string;
  phone: string;
  bloodGroup: string;
  scenario: string;
  seed: number;
  studyDaysAgo: number;
  scanType: ScanType;
  studyStatus: StudyStatus;
  imageKey: string;
  missing?: string[];
  findings: MockFindingSpec[];
}

export const MOCK_PATIENTS: MockPatientSpec[] = [
  {
    id: 'P001',
    code: '001',
    name: 'Arjun Mehta',
    age: 32,
    gender: 'Male',
    doctor: 'Dr. Demo',
    assignedNurse: 'Nurse Demo',
    phone: '+91 98450 00101',
    bloodGroup: 'B+',
    scenario: 'Mostly healthy — two simulated caries findings',
    seed: 11,
    studyDaysAgo: 0,
    scanType: 'Panoramic X-ray',
    studyStatus: 'Analyzed',
    imageKey: 'pano-standard',
    findings: [
      {
        tooth: '46',
        condition: 'caries',
        severity: 'Moderate',
        confidence: 0.92,
        surface: 'Distal',
        dims: [72, 58, 81, 66, 63],
        xai: [0.82, 0.91],
        lesionHeight: 0.55,
        lesionSpread: 0.32,
      },
      {
        tooth: '16',
        condition: 'caries',
        severity: 'Mild',
        confidence: 0.81,
        surface: 'Occlusal',
        dims: [86, 70, 92, 88, 80],
        xai: [0.74, 0.86],
        lesionHeight: 1,
        lesionSpread: 0.26,
      },
    ],
  },
  {
    id: 'P002',
    code: '002',
    name: 'Priya Raman',
    age: 45,
    gender: 'Female',
    doctor: 'Dr. Demo',
    assignedNurse: 'Nurse Demo',
    phone: '+91 98450 00102',
    bloodGroup: 'O+',
    scenario: 'Caries scenario — multiple posterior lesions',
    seed: 23,
    studyDaysAgo: 0,
    scanType: 'CBCT',
    studyStatus: 'Analyzed',
    imageKey: 'pano-standard',
    missing: ['38'],
    findings: [
      {
        tooth: '36',
        condition: 'caries',
        severity: 'Severe',
        confidence: 0.94,
        surface: 'Occlusal',
        dims: [52, 38, 70, 68, 49],
        xai: [0.9, 0.88],
        lesionHeight: 0.95,
        lesionSpread: 0.42,
      },
      {
        tooth: '26',
        condition: 'caries',
        severity: 'Moderate',
        confidence: 0.88,
        surface: 'Mesial',
        dims: [74, 60, 84, 78, 66],
        xai: [0.79, 0.87],
        lesionHeight: 0.5,
        lesionSpread: 0.3,
      },
      {
        tooth: '46',
        condition: 'caries',
        severity: 'Moderate',
        confidence: 0.9,
        surface: 'Distal',
        dims: [70, 55, 80, 72, 63],
        xai: [0.81, 0.9],
        lesionHeight: 0.55,
        lesionSpread: 0.33,
      },
    ],
  },
  {
    id: 'P003',
    code: '003',
    name: 'Karthik Suresh',
    age: 26,
    gender: 'Male',
    doctor: 'Dr. Demo',
    assignedNurse: 'Nurse Kavya S.',
    phone: '+91 98450 00103',
    bloodGroup: 'A+',
    scenario: 'Impacted wisdom tooth',
    seed: 37,
    studyDaysAgo: 1,
    scanType: 'Dental X-ray',
    studyStatus: 'Analyzed',
    imageKey: 'pano-standard',
    findings: [
      {
        tooth: '28',
        condition: 'impacted',
        severity: 'Moderate',
        confidence: 0.95,
        surface: 'Crown',
        dims: [60, 72, 66, 54, 52],
        xai: [0.93, 0.94],
        lesionHeight: 0.7,
        lesionSpread: 0.45,
        angulationDeg: 42,
      },
    ],
  },
  {
    id: 'P004',
    code: '004',
    name: 'Lakshmi Iyer',
    age: 58,
    gender: 'Female',
    doctor: 'Dr. Ananya Rao',
    assignedNurse: 'Nurse Kavya S.',
    phone: '+91 98450 00104',
    bloodGroup: 'AB+',
    scenario: 'Bone-loss scenario — lower left premolars',
    seed: 41,
    studyDaysAgo: 2,
    scanType: 'CBCT',
    studyStatus: 'Analyzed',
    imageKey: 'pano-standard',
    missing: ['18', '28', '38', '48'],
    findings: [
      {
        tooth: '35',
        condition: 'boneLoss',
        severity: 'Severe',
        confidence: 0.87,
        surface: 'Alveolar crest',
        dims: [76, 80, 55, 36, 50],
        xai: [0.84, 0.8],
        lesionHeight: -0.2,
        lesionSpread: 0.5,
        boneLossFraction: 0.5,
      },
      {
        tooth: '34',
        condition: 'boneLoss',
        severity: 'Moderate',
        confidence: 0.83,
        surface: 'Alveolar crest',
        dims: [80, 82, 62, 44, 58],
        xai: [0.78, 0.82],
        lesionHeight: -0.15,
        lesionSpread: 0.45,
        boneLossFraction: 0.35,
      },
    ],
  },
  {
    id: 'P005',
    code: '005',
    name: 'Faizal Rahman',
    age: 39,
    gender: 'Male',
    doctor: 'Dr. Demo',
    assignedNurse: 'Nurse Demo',
    phone: '+91 98450 00105',
    bloodGroup: 'O-',
    scenario: 'Mixed findings — caries, periapical, impaction, bone',
    seed: 53,
    studyDaysAgo: 3,
    scanType: 'Panoramic X-ray',
    studyStatus: 'Analyzed',
    imageKey: 'pano-standard',
    findings: [
      {
        tooth: '16',
        condition: 'periapical',
        severity: 'Moderate',
        confidence: 0.86,
        surface: 'Periapical',
        dims: [66, 62, 44, 58, 55],
        xai: [0.8, 0.83],
        lesionHeight: -1,
        lesionSpread: 0.4,
      },
      {
        tooth: '28',
        condition: 'impacted',
        severity: 'Mild',
        confidence: 0.9,
        surface: 'Crown',
        dims: [72, 78, 74, 62, 64],
        xai: [0.86, 0.9],
        lesionHeight: 0.7,
        lesionSpread: 0.4,
        angulationDeg: 25,
      },
      {
        tooth: '36',
        condition: 'caries',
        severity: 'Moderate',
        confidence: 0.89,
        surface: 'Mesial',
        dims: [74, 60, 82, 76, 68],
        xai: [0.8, 0.88],
        lesionHeight: 0.5,
        lesionSpread: 0.3,
      },
      {
        tooth: '46',
        condition: 'boneLoss',
        severity: 'Mild',
        confidence: 0.78,
        surface: 'Alveolar crest',
        dims: [84, 86, 72, 60, 70],
        xai: [0.72, 0.79],
        lesionHeight: -0.1,
        lesionSpread: 0.4,
        boneLossFraction: 0.22,
      },
    ],
  },
  {
    id: 'P006',
    code: '006',
    name: 'Sneha Kulkarni',
    age: 29,
    gender: 'Female',
    doctor: 'Dr. Demo',
    assignedNurse: 'Nurse Demo',
    phone: '+91 98450 00106',
    bloodGroup: 'A-',
    scenario: 'New patient — awaiting scan upload & analysis',
    seed: 67,
    studyDaysAgo: 0,
    scanType: 'Panoramic X-ray',
    studyStatus: 'Awaiting scan',
    imageKey: 'pano-standard',
    findings: [
      {
        tooth: '37',
        condition: 'periapical',
        severity: 'Moderate',
        confidence: 0.84,
        surface: 'Periapical',
        dims: [70, 66, 52, 64, 60],
        xai: [0.78, 0.81],
        lesionHeight: -1,
        lesionSpread: 0.38,
      },
      {
        tooth: '24',
        condition: 'caries',
        severity: 'Mild',
        confidence: 0.79,
        surface: 'Mesial',
        dims: [88, 72, 93, 90, 82],
        xai: [0.7, 0.83],
        lesionHeight: 0.5,
        lesionSpread: 0.26,
      },
    ],
  },
];
