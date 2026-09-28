import type {
  ClinicalReview,
  ClinicStats,
  ConditionType,
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
} from '@/domain/models';

import type { DentalRepository } from '../repository';

/**
 * HTTP implementation of DentalRepository for the future AI backend.
 *
 * Not active in the pilot. To switch, set `EXPO_PUBLIC_DATA_SOURCE=api` and
 * `EXPO_PUBLIC_API_URL=https://your-backend` (see src/data/index.ts). The
 * backend must return JSON matching the types in src/domain/models.ts.
 */
export class ApiRepository implements DentalRepository {
  readonly mode = 'api' as const;
  private token: string | null = null;
  private listeners = new Set<() => void>();

  constructor(private readonly baseUrl: string) {}

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        ...init.headers,
      },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`API ${res.status}: ${body || res.statusText}`);
    }
    return (await res.json()) as T;
  }

  private emit() {
    this.listeners.forEach((l) => l());
  }

  async login(email: string, password: string, role: Role): Promise<User> {
    const { token, user } = await this.request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    });
    this.token = token;
    return user;
  }

  listPatients() {
    return this.request<Patient[]>('/patients');
  }
  getPatient(id: string) {
    return this.request<PatientDetail>(`/patient/${encodeURIComponent(id)}`);
  }
  getStudy(studyId: string) {
    return this.request<Study>(`/study/${encodeURIComponent(studyId)}`);
  }
  getTooth(patientId: string, toothNumber: string) {
    return this.request<Tooth>(`/tooth/${encodeURIComponent(`${patientId}:${toothNumber}`)}`);
  }
  getRecommendations(condition: ConditionType) {
    return this.request<Recommendation>(`/recommendations/${condition}`);
  }

  async uploadScan(patientId: string, sampleScanKey: string) {
    // A real client would send multipart/form-data with the DICOM / image file.
    const study = await this.request<Study>('/scan', {
      method: 'POST',
      body: JSON.stringify({ patientId, source: sampleScanKey }),
    });
    this.emit();
    return study;
  }

  async analyzeStudy(studyId: string) {
    const study = await this.request<Study>('/analyze', { method: 'POST', body: JSON.stringify({ studyId }) });
    this.emit();
    return study;
  }

  getReview(findingId: string) {
    return this.request<ClinicalReview>(`/clinical-review/${encodeURIComponent(findingId)}`);
  }
  listReviews() {
    return this.request<ClinicalReview[]>('/clinical-review');
  }

  async submitReview(input: Parameters<DentalRepository['submitReview']>[0]) {
    const review = await this.request<ClinicalReview>('/clinical-review', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    this.emit();
    return review;
  }

  getClinicStats() {
    return this.request<ClinicStats>('/stats');
  }
  listStaff() {
    return this.request<StaffMember[]>('/staff');
  }
  listRecentScans() {
    return this.request<RecentScan[]>('/scans/recent');
  }
  listSampleScans() {
    return this.request<SampleScan[]>('/scans/samples');
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}
