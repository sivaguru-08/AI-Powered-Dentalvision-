import type {
  ClinicalReview,
  ClinicStats,
  Patient,
  PatientDetail,
  RecentScan,
  Recommendation,
  ReviewDecision,
  Role,
  SampleScan,
  Severity,
  StaffMember,
  Study,
  Tooth,
  User,
  ConditionType,
} from '@/domain/models';

/**
 * Data-access contract used by the whole UI.
 *
 * `MockRepository` implements it with local simulated data.
 * `ApiRepository` implements it against the future AI backend:
 *   POST /scan · POST /analyze · GET /patient/{id} · GET /study/{id}
 *   GET /tooth/{id} · GET /recommendations/{finding} · POST /clinical-review
 */
export interface DentalRepository {
  readonly mode: 'mock' | 'api';

  login(email: string, password: string, role: Role): Promise<User>;

  listPatients(): Promise<Patient[]>;
  getPatient(id: string): Promise<PatientDetail>;
  getStudy(studyId: string): Promise<Study>;
  getTooth(patientId: string, toothNumber: string): Promise<Tooth>;
  getRecommendations(condition: ConditionType): Promise<Recommendation>;

  /** POST /scan — attach a scan to a patient's study. */
  uploadScan(patientId: string, sampleScanKey: string): Promise<Study>;
  /** POST /analyze — run the (simulated) AI pipeline for a study. */
  analyzeStudy(studyId: string): Promise<Study>;

  getReview(findingId: string): Promise<ClinicalReview>;
  listReviews(): Promise<ClinicalReview[]>;
  /** POST /clinical-review */
  submitReview(input: {
    findingId: string;
    decision: Exclude<ReviewDecision, 'pending'>;
    reviewer: string;
    note?: string;
    modifiedCondition?: string;
    modifiedSeverity?: Severity;
  }): Promise<ClinicalReview>;

  getClinicStats(): Promise<ClinicStats>;
  listStaff(): Promise<StaffMember[]>;
  listRecentScans(): Promise<RecentScan[]>;
  listSampleScans(): Promise<SampleScan[]>;

  /** Subscribe to data changes (reviews, uploads). Returns an unsubscribe fn. */
  subscribe(listener: () => void): () => void;
}
