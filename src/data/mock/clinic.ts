import type { Role, SampleScan, StaffMember, User } from '@/domain/models';

/** Demo accounts — simulated authentication only. */
export const DEMO_USERS: (User & { password: string })[] = [
  {
    id: 'U-DOC',
    name: 'Dr. Demo',
    email: 'doctor@demo.com',
    password: 'demo123',
    role: 'doctor',
    title: 'BDS, MDS — Conservative Dentistry',
    department: 'Restorative & Endodontics',
  },
  {
    id: 'U-ADM',
    name: 'Admin Demo',
    email: 'admin@demo.com',
    password: 'demo123',
    role: 'admin',
    title: 'Hospital Administrator',
    department: 'Operations',
  },
  {
    id: 'U-NUR',
    name: 'Nurse Demo',
    email: 'nurse@demo.com',
    password: 'demo123',
    role: 'nurse',
    title: 'Dental Nurse — Imaging',
    department: 'Radiology & Imaging',
  },
];

export const ROLE_LABELS: Record<Role, string> = {
  doctor: 'Doctor',
  admin: 'Hospital Admin',
  nurse: 'Nurse',
};

export const STAFF: StaffMember[] = [
  { id: 'S1', name: 'Dr. Demo', role: 'Doctor', specialty: 'Conservative Dentistry', patientsToday: 12, status: 'On duty' },
  { id: 'S2', name: 'Dr. Ananya Rao', role: 'Doctor', specialty: 'Periodontics', patientsToday: 9, status: 'On duty' },
  { id: 'S3', name: 'Dr. Vikram Nair', role: 'Doctor', specialty: 'Oral & Maxillofacial Surgery', patientsToday: 5, status: 'In surgery' },
  { id: 'S4', name: 'Dr. Meera Pillai', role: 'Doctor', specialty: 'Orthodontics', patientsToday: 7, status: 'Off duty' },
  { id: 'S5', name: 'Nurse Demo', role: 'Nurse', specialty: 'Radiology & Imaging', patientsToday: 14, status: 'On duty' },
  { id: 'S6', name: 'Nurse Kavya S.', role: 'Nurse', specialty: 'Clinical Assistance', patientsToday: 11, status: 'On duty' },
  { id: 'S7', name: 'Nurse Rohan D.', role: 'Nurse', specialty: 'Sterilisation & OT', patientsToday: 6, status: 'Off duty' },
];

/** Clinic-wide aggregates that are not derived from the demo patients. */
export const CLINIC_BASE = {
  totalPatients: 248,
  todaysScans: 31,
  scansThisWeek: [24, 29, 33, 27, 31, 12, 6],
};

export const SAMPLE_SCANS: SampleScan[] = [
  {
    key: 'pano-standard',
    label: 'Panoramic — full arch',
    scanType: 'Panoramic X-ray',
    description: 'Orthopantomogram, 2976 × 1536 px, 16-bit (simulated)',
    size: '4.2 MB',
  },
  {
    key: 'cbct-volume',
    label: 'CBCT — full volume',
    scanType: 'CBCT',
    description: '0.2 mm voxel, 16 × 10 cm FOV (simulated)',
    size: '118 MB',
  },
  {
    key: 'bitewing-pair',
    label: 'Bitewing — posterior pair',
    scanType: 'Bitewing X-ray',
    description: 'Left & right bitewings, digital sensor (simulated)',
    size: '1.6 MB',
  },
];
