/**
 * Domain models for DentalVision 3D.
 *
 * These types are the contract between the UI and any data source. The mock
 * repository produces them today; a real AI backend (see `data/api`) must
 * return the same shapes so the UI never needs to change.
 */

export type Role = 'doctor' | 'admin' | 'nurse';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  title: string;
  department: string;
}

/** FDI two-digit notation, e.g. "46" = lower right first molar. */
export type ToothNumber = string;

export type ToothType = 'incisor' | 'canine' | 'premolar' | 'molar';
export type Arch = 'upper' | 'lower';
export type Side = 'right' | 'left';

export type ToothStatus = 'healthy' | 'attention' | 'priority' | 'unknown';

export type ConditionType = 'healthy' | 'caries' | 'periapical' | 'impacted' | 'boneLoss';

export type Severity = 'Mild' | 'Moderate' | 'Severe';

export type ToothSurface =
  | 'Mesial'
  | 'Distal'
  | 'Occlusal'
  | 'Buccal'
  | 'Lingual'
  | 'Periapical'
  | 'Crown'
  | 'Alveolar crest';

/** Simulated sub-dimensions of the per-tooth demo health index (0–100 each). */
export interface HealthScore {
  structuralIntegrity: number;
  cariesRisk: number;
  rootCondition: number;
  surroundingBone: number;
  clinicalStatus: number;
  /** Mean of the dimensions above. */
  overall: number;
}

export interface XAIEvidenceMetric {
  label: string;
  value: number; // 0–1
}

export interface XAIExplanation {
  summary: string;
  evidence: string[];
  metrics: XAIEvidenceMetric[];
  /** Normalised (0–1) location of the salient region on the tooth radiograph crop. */
  heatmap: { x: number; y: number; radius: number; intensity: number }[];
  annotation: string;
  method: string;
}

export interface EvidenceContext {
  affectedRegion: string;
  observedPattern: string;
  potentialAssociation: string;
}

export interface Recommendation {
  priority: string;
  priorityLevel: 'routine' | 'soon' | 'urgent';
  preventive: string[];
  followUp: string;
  dos: string[];
  donts: string[];
}

export interface Finding {
  id: string;
  condition: ConditionType;
  /** Human readable condition, e.g. "Possible Carious Lesion". */
  title: string;
  shortTitle: string;
  severity: Severity;
  /** Simulated model confidence 0–1. */
  confidence: number;
  affectedSurface: ToothSurface;
  affectedRegion: string;
  description: string;
  /** Extra hint for the 3D viewer on where to place the lesion (tooth-local, -1..1). */
  lesion: { surface: ToothSurface; height: number; spread: number };
  /** For impacted teeth: angulation in degrees (mesioangular etc.). */
  angulationDeg?: number;
  /** For bone-loss: fraction of the root length that has lost bone support (0–1). */
  boneLossFraction?: number;
}

export type ReviewDecision = 'pending' | 'approved' | 'modified' | 'rejected';

export interface ClinicalReview {
  findingId: string;
  decision: ReviewDecision;
  reviewer?: string;
  reviewedAt?: string; // ISO timestamp
  note?: string;
  modifiedCondition?: string;
  modifiedSeverity?: Severity;
}

export interface Tooth {
  toothNumber: ToothNumber;
  name: string;
  type: ToothType;
  arch: Arch;
  side: Side;
  healthIndex: number | null; // null when not assessed
  health: HealthScore | null;
  status: ToothStatus;
  finding: Finding | null;
  possibleCauses: string[];
  evidenceContext: EvidenceContext | null;
  xai: XAIExplanation | null;
  recommendations: Recommendation;
  note?: string; // e.g. "Not present on study"
}

export type ScanType = 'Panoramic X-ray' | 'CBCT' | 'Dental X-ray' | 'Bitewing X-ray';
export type StudyStatus = 'Awaiting scan' | 'Uploaded' | 'Analyzing' | 'Analyzed' | 'Reviewed';

export interface Study {
  id: string;
  patientId: string;
  scanType: ScanType;
  date: string; // ISO date
  modality: string;
  device: string;
  resolution: string;
  status: StudyStatus;
  /** Id of the simulated scan image rendered by <SimulatedRadiograph/>. */
  imageKey: string;
}

export interface Patient {
  id: string;
  code: string; // "001"
  name: string;
  age: number;
  gender: 'Male' | 'Female';
  doctor: string;
  assignedNurse: string;
  phone: string;
  bloodGroup: string;
  lastVisit: string;
  scenario: string;
  study: Study;
  dentalHealthIndex: number;
  counts: { healthy: number; attention: number; priority: number; unknown: number };
  affectedTeeth: ToothNumber[];
  /** Compact list of findings for worklists / dashboards. */
  findings: FindingSummary[];
}

export interface FindingSummary {
  findingId: string;
  toothNumber: ToothNumber;
  toothName: string;
  title: string;
  shortTitle: string;
  severity: Severity;
  confidence: number;
  healthIndex: number;
  status: ToothStatus;
}

export interface PatientDetail extends Patient {
  teeth: Tooth[];
}

export interface StaffMember {
  id: string;
  name: string;
  role: 'Doctor' | 'Nurse';
  specialty: string;
  patientsToday: number;
  status: 'On duty' | 'In surgery' | 'Off duty';
}

export interface ClinicStats {
  totalPatients: number;
  todaysScans: number;
  pendingReviews: number;
  affectedTeeth: number;
  averageDentalHealthIndex: number;
  scansThisWeek: number[]; // Mon..Sun
  findingsByCondition: { condition: ConditionType; label: string; count: number }[];
}

export interface RecentScan {
  id: string;
  patientId: string;
  patientName: string;
  scanType: ScanType;
  time: string;
  status: StudyStatus;
  findings: number;
}

export interface SampleScan {
  key: string;
  label: string;
  scanType: ScanType;
  description: string;
  size: string;
}
