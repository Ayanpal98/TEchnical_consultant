export const SPECIALTIES = [
  'General Medicine',
  'Pediatrics',
  'Cardiology',
  'Dermatology',
  'Neurology',
  'Orthopedics',
  'Psychiatry',
  'Emergency Medicine'
] as const;

export type Specialty = typeof SPECIALTIES[number];
