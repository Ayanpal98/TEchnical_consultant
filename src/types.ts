import { Specialty } from './constants';

export type UserRole = 'patient' | 'clinician' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  specialty?: Specialty;
  isAvailable?: boolean;
  location?: {
    latitude: number;
    longitude: number;
  };
  createdAt: any; // ISO string or Timestamp
}

export type CaseStatus = 'pending' | 'assigned' | 'in-progress' | 'completed';

export interface MedicalCase {
  id: string;
  patientId: string;
  patientName: string;
  symptoms: string;
  requiredSpecialty?: Specialty;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  imageUrl?: string;
  status: CaseStatus;
  assignedConsultantId?: string;
  assignedConsultantName?: string;
  createdAt: any; // ISO string or Timestamp
  updatedAt: any; // ISO string or Timestamp
}

export interface AuditLog {
  id: string;
  caseId: string;
  action: string;
  performedBy: string;
  timestamp: any; // Firestore Timestamp
}
