import { ALL_TEETH, toothMeta } from '@/domain/fdi';
import { dentalHealthIndex, deriveStatus, overallFromDimensions } from '@/domain/health';
import type {
  ClinicalReview,
  ClinicStats,
  ConditionType,
  Finding,
  HealthScore,
  Patient,
  PatientDetail,
  RecentScan,
  Recommendation,
  Role,
  SampleScan,
  StaffMember,
  Study,
  Tooth,
  User,
  XAIExplanation,
} from '@/domain/models';

import type { DentalRepository } from '../repository';
import { CLINIC_BASE, DEMO_USERS, SAMPLE_SCANS, STAFF } from './clinic';
import { CONDITION_LABELS, CONDITIONS, HEALTHY_RECOMMENDATION } from './conditions';
import { MOCK_PATIENTS, type MockFindingSpec, type MockPatientSpec } from './patients';

/** Small deterministic PRNG so healthy-tooth scores are stable between runs. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isoDaysAgo(days: number, hour = 10, minute = 30): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

/** Heatmap location on a crown-up tooth radiograph crop (0–1 coordinates). */
function heatmapFor(spec: MockFindingSpec): XAIExplanation['heatmap'] {
  const i = spec.xai[0];
  switch (spec.surface) {
    case 'Distal':
      return [
        { x: 0.76, y: 0.24, radius: 0.16, intensity: i },
        { x: 0.66, y: 0.3, radius: 0.1, intensity: i * 0.6 },
      ];
    case 'Mesial':
      return [
        { x: 0.24, y: 0.24, radius: 0.16, intensity: i },
        { x: 0.34, y: 0.3, radius: 0.1, intensity: i * 0.6 },
      ];
    case 'Occlusal':
      return [
        { x: 0.5, y: 0.1, radius: 0.18, intensity: i },
        { x: 0.42, y: 0.16, radius: 0.1, intensity: i * 0.55 },
      ];
    case 'Periapical':
      return [
        { x: 0.5, y: 0.9, radius: 0.2, intensity: i },
        { x: 0.44, y: 0.82, radius: 0.1, intensity: i * 0.5 },
      ];
    case 'Alveolar crest':
      return [
        { x: 0.2, y: 0.46, radius: 0.15, intensity: i },
        { x: 0.8, y: 0.5, radius: 0.13, intensity: i * 0.8 },
      ];
    default:
      return [
        { x: 0.3, y: 0.24, radius: 0.2, intensity: i },
        { x: 0.55, y: 0.45, radius: 0.14, intensity: i * 0.55 },
      ];
  }
}

function healthyDims(rand: () => number, position: number): Omit<HealthScore, 'overall'> {
  const base = position === 8 ? 84 : 89;
  const v = () => Math.min(99, Math.round(base + rand() * 10));
  return {
    structuralIntegrity: v(),
    cariesRisk: v(),
    rootCondition: v(),
    surroundingBone: v(),
    clinicalStatus: v(),
  };
}

export class MockRepository implements DentalRepository {
  readonly mode = 'mock' as const;

  private studies = new Map<string, Study>();
  private reviews = new Map<string, ClinicalReview>();
  private listeners = new Set<() => void>();

  constructor(private readonly latencyMs = 220) {
    for (const p of MOCK_PATIENTS) {
      this.studies.set(p.id, {
        id: `ST-${p.code}`,
        patientId: p.id,
        scanType: p.scanType,
        date: isoDaysAgo(p.studyDaysAgo, 9 + (p.seed % 6), (p.seed * 7) % 60),
        modality: p.scanType === 'CBCT' ? 'Cone-beam CT' : 'Digital radiography',
        device: p.scanType === 'CBCT' ? 'Simulated CBCT unit' : 'Simulated OPG unit',
        resolution: p.scanType === 'CBCT' ? '0.2 mm voxel' : '2976 × 1536 px',
        status: p.studyStatus,
        imageKey: p.imageKey,
      });
      for (const f of p.findings) {
        this.reviews.set(`${p.id}-${f.tooth}`, { findingId: `${p.id}-${f.tooth}`, decision: 'pending' });
      }
    }
    // One patient already reviewed by a colleague, to show a mixed state.
    for (const f of ['P004-34', 'P004-35']) {
      this.reviews.set(f, {
        findingId: f,
        decision: 'approved',
        reviewer: 'Dr. Ananya Rao',
        reviewedAt: isoDaysAgo(1, 16, 5),
        note: 'Agree — refer for periodontal charting.',
      });
    }
  }

  // ---------------------------------------------------------------- helpers

  private emit() {
    this.listeners.forEach((l) => l());
  }

  private spec(id: string): MockPatientSpec {
    const spec = MOCK_PATIENTS.find((p) => p.id === id);
    if (!spec) throw new Error(`Patient ${id} not found`);
    return spec;
  }

  private isAnalyzed(patientId: string) {
    const s = this.studies.get(patientId)!;
    return s.status === 'Analyzed' || s.status === 'Reviewed';
  }

  private studyWithDerivedStatus(patientId: string): Study {
    const study = { ...this.studies.get(patientId)! };
    if (study.status === 'Analyzed') {
      const spec = this.spec(patientId);
      const allReviewed =
        spec.findings.length > 0 &&
        spec.findings.every((f) => this.reviews.get(`${patientId}-${f.tooth}`)?.decision !== 'pending');
      if (allReviewed) study.status = 'Reviewed';
    }
    return study;
  }

  private buildFinding(patientId: string, f: MockFindingSpec): Finding {
    const k = CONDITIONS[f.condition];
    const region =
      f.surface === 'Periapical'
        ? 'Periapical region'
        : f.surface === 'Alveolar crest'
          ? 'Alveolar crest (mesial & distal)'
          : f.surface === 'Crown'
            ? 'Crown / mesial contact'
            : `${f.surface} surface`;
    return {
      id: `${patientId}-${f.tooth}`,
      condition: f.condition,
      title: k.title,
      shortTitle: k.shortTitle,
      severity: f.severity,
      confidence: f.confidence,
      affectedSurface: f.surface,
      affectedRegion: region,
      description: k.description,
      lesion: { surface: f.surface, height: f.lesionHeight, spread: f.lesionSpread },
      angulationDeg: f.angulationDeg,
      boneLossFraction: f.boneLossFraction,
    };
  }

  private buildTeeth(spec: MockPatientSpec): Tooth[] {
    const rand = mulberry32(spec.seed);
    const analyzed = this.isAnalyzed(spec.id);
    return ALL_TEETH.map((num) => {
      const meta = toothMeta(num);
      const dims = healthyDims(rand, meta.position); // always consume rand for stability
      const base = {
        toothNumber: num,
        name: meta.name,
        type: meta.type,
        arch: meta.arch,
        side: meta.side,
      };
      if (!analyzed || spec.missing?.includes(num)) {
        return {
          ...base,
          healthIndex: null,
          health: null,
          status: 'unknown',
          finding: null,
          possibleCauses: [],
          evidenceContext: null,
          xai: null,
          recommendations: HEALTHY_RECOMMENDATION,
          note: analyzed ? 'Tooth not present on study — not assessed' : 'Awaiting scan analysis',
        } satisfies Tooth;
      }
      const fSpec = spec.findings.find((f) => f.tooth === num);
      if (!fSpec) {
        const overall = overallFromDimensions(dims);
        return {
          ...base,
          healthIndex: overall,
          health: { ...dims, overall },
          status: deriveStatus(overall, null),
          finding: null,
          possibleCauses: [],
          evidenceContext: null,
          xai: null,
          recommendations: HEALTHY_RECOMMENDATION,
        } satisfies Tooth;
      }
      const [structuralIntegrity, cariesRisk, rootCondition, surroundingBone, clinicalStatus] = fSpec.dims;
      const d = { structuralIntegrity, cariesRisk, rootCondition, surroundingBone, clinicalStatus };
      const overall = overallFromDimensions(d);
      const finding = this.buildFinding(spec.id, fSpec);
      const k = CONDITIONS[fSpec.condition];
      return {
        ...base,
        healthIndex: overall,
        health: { ...d, overall },
        status: deriveStatus(overall, finding),
        finding,
        possibleCauses: k.possibleCauses,
        evidenceContext: k.evidenceContext(fSpec.surface),
        xai: {
          summary: k.xaiSummary,
          evidence: k.evidence,
          metrics: [
            { label: 'Image evidence', value: fSpec.xai[0] },
            { label: 'Localization quality', value: fSpec.xai[1] },
            { label: 'Model confidence', value: fSpec.confidence },
          ],
          heatmap: heatmapFor(fSpec),
          annotation: k.annotation,
          method: 'Simulated Grad-CAM style saliency (demo)',
        },
        recommendations: k.recommendations,
      } satisfies Tooth;
    });
  }

  private buildPatient(spec: MockPatientSpec): PatientDetail {
    const teeth = this.buildTeeth(spec);
    const counts = { healthy: 0, attention: 0, priority: 0, unknown: 0 };
    teeth.forEach((t) => counts[t.status]++);
    return {
      id: spec.id,
      code: spec.code,
      name: spec.name,
      age: spec.age,
      gender: spec.gender,
      doctor: spec.doctor,
      assignedNurse: spec.assignedNurse,
      phone: spec.phone,
      bloodGroup: spec.bloodGroup,
      lastVisit: isoDaysAgo(spec.studyDaysAgo + 90),
      scenario: spec.scenario,
      study: this.studyWithDerivedStatus(spec.id),
      dentalHealthIndex: dentalHealthIndex(teeth),
      counts,
      affectedTeeth: teeth.filter((t) => t.finding).map((t) => t.toothNumber),
      findings: teeth
        .filter((t) => t.finding)
        .map((t) => ({
          findingId: t.finding!.id,
          toothNumber: t.toothNumber,
          toothName: t.name,
          title: t.finding!.title,
          shortTitle: t.finding!.shortTitle,
          severity: t.finding!.severity,
          confidence: t.finding!.confidence,
          healthIndex: t.healthIndex ?? 0,
          status: t.status,
        })),
      teeth,
    };
  }

  // ------------------------------------------------------------- interface

  async login(email: string, password: string, role: Role): Promise<User> {
    await wait(this.latencyMs * 3);
    const u = DEMO_USERS.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
    if (!u || u.password !== password) throw new Error('Invalid email or password.');
    if (u.role !== role) throw new Error(`This account is not registered as the selected role.`);
    const { password: _pw, ...user } = u;
    return user;
  }

  async listPatients(): Promise<Patient[]> {
    await wait(this.latencyMs);
    return MOCK_PATIENTS.map((s) => {
      const { teeth: _t, ...p } = this.buildPatient(s);
      return p;
    });
  }

  async getPatient(id: string): Promise<PatientDetail> {
    await wait(this.latencyMs);
    return this.buildPatient(this.spec(id));
  }

  async getStudy(studyId: string): Promise<Study> {
    await wait(this.latencyMs);
    const p = MOCK_PATIENTS.find((x) => `ST-${x.code}` === studyId);
    if (!p) throw new Error(`Study ${studyId} not found`);
    return this.studyWithDerivedStatus(p.id);
  }

  async getTooth(patientId: string, toothNumber: string): Promise<Tooth> {
    await wait(this.latencyMs);
    const tooth = this.buildTeeth(this.spec(patientId)).find((t) => t.toothNumber === toothNumber);
    if (!tooth) throw new Error(`Tooth ${toothNumber} not found`);
    return tooth;
  }

  async getRecommendations(condition: ConditionType): Promise<Recommendation> {
    await wait(this.latencyMs);
    return condition === 'healthy' ? HEALTHY_RECOMMENDATION : CONDITIONS[condition].recommendations;
  }

  async uploadScan(patientId: string, sampleScanKey: string): Promise<Study> {
    await wait(this.latencyMs * 4);
    const sample = SAMPLE_SCANS.find((s) => s.key === sampleScanKey) ?? SAMPLE_SCANS[0];
    const current = this.studies.get(patientId)!;
    const next: Study = {
      ...current,
      scanType: sample.scanType,
      modality: sample.scanType === 'CBCT' ? 'Cone-beam CT' : 'Digital radiography',
      device: sample.scanType === 'CBCT' ? 'Simulated CBCT unit' : 'Simulated OPG unit',
      resolution: sample.scanType === 'CBCT' ? '0.2 mm voxel' : '2976 × 1536 px',
      imageKey: sample.key,
      date: new Date().toISOString(),
      status: 'Uploaded',
    };
    this.studies.set(patientId, next);
    this.emit();
    return next;
  }

  async analyzeStudy(studyId: string): Promise<Study> {
    const p = MOCK_PATIENTS.find((x) => `ST-${x.code}` === studyId);
    if (!p) throw new Error(`Study ${studyId} not found`);
    await wait(this.latencyMs);
    const current = this.studies.get(p.id)!;
    if (current.status === 'Awaiting scan') throw new Error('Upload a scan before running the analysis.');
    this.studies.set(p.id, { ...current, status: 'Analyzed' });
    this.emit();
    return this.studyWithDerivedStatus(p.id);
  }

  async getReview(findingId: string): Promise<ClinicalReview> {
    return this.reviews.get(findingId) ?? { findingId, decision: 'pending' };
  }

  async listReviews(): Promise<ClinicalReview[]> {
    return [...this.reviews.values()];
  }

  async submitReview(input: Parameters<DentalRepository['submitReview']>[0]): Promise<ClinicalReview> {
    await wait(this.latencyMs * 2);
    const review: ClinicalReview = {
      findingId: input.findingId,
      decision: input.decision,
      reviewer: input.reviewer,
      reviewedAt: new Date().toISOString(),
      note: input.note,
      modifiedCondition: input.modifiedCondition,
      modifiedSeverity: input.modifiedSeverity,
    };
    this.reviews.set(input.findingId, review);
    this.emit();
    return review;
  }

  async getClinicStats(): Promise<ClinicStats> {
    await wait(this.latencyMs);
    const patients = MOCK_PATIENTS.map((s) => this.buildPatient(s));
    const analyzed = patients.filter((p) => this.isAnalyzed(p.id));
    const pendingReviews = analyzed.reduce(
      (n, p) => n + p.affectedTeeth.filter((t) => this.reviews.get(`${p.id}-${t}`)?.decision === 'pending').length,
      0
    );
    const byCondition = new Map<ConditionType, number>();
    analyzed.forEach((p) =>
      p.teeth.forEach((t) => {
        if (t.finding) byCondition.set(t.finding.condition, (byCondition.get(t.finding.condition) ?? 0) + 1);
      })
    );
    return {
      totalPatients: CLINIC_BASE.totalPatients,
      todaysScans: CLINIC_BASE.todaysScans,
      pendingReviews,
      affectedTeeth: analyzed.reduce((n, p) => n + p.affectedTeeth.length, 0),
      averageDentalHealthIndex: Math.round(
        analyzed.reduce((n, p) => n + p.dentalHealthIndex, 0) / Math.max(1, analyzed.length)
      ),
      scansThisWeek: CLINIC_BASE.scansThisWeek,
      findingsByCondition: (['caries', 'periapical', 'impacted', 'boneLoss'] as const).map((c) => ({
        condition: c,
        label: CONDITION_LABELS[c],
        count: byCondition.get(c) ?? 0,
      })),
    };
  }

  async listStaff(): Promise<StaffMember[]> {
    await wait(this.latencyMs);
    return STAFF;
  }

  async listRecentScans(): Promise<RecentScan[]> {
    await wait(this.latencyMs);
    return MOCK_PATIENTS.map((s) => {
      const p = this.buildPatient(s);
      return {
        id: p.study.id,
        patientId: p.id,
        patientName: p.name,
        scanType: p.study.scanType,
        time: p.study.date,
        status: p.study.status,
        findings: p.affectedTeeth.length,
      };
    }).sort((a, b) => b.time.localeCompare(a.time));
  }

  async listSampleScans(): Promise<SampleScan[]> {
    return SAMPLE_SCANS;
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}
