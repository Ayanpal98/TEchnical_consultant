import { MedicalCase, UserProfile } from '../types';

export interface ConsultantSuggestion {
  consultant: UserProfile;
  distance: number; // in kilometers
  score: number; // 0-100
  reasons: string[];
}

/**
 * Calculates the distance between two points on Earth using the Haversine formula.
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function getConsultantSuggestions(
  medicalCase: MedicalCase,
  clinicians: UserProfile[]
): ConsultantSuggestion[] {
  const suggestions: ConsultantSuggestion[] = clinicians
    .filter(c => c.role === 'clinician' && c.isAvailable)
    .map(consultant => {
      let score = 0;
      const reasons: string[] = [];

      // 1. Proximity (Primary Priority - Max 70 points)
      let distance = Infinity;
      let proximityScore = 0;
      if (medicalCase.location && consultant.location) {
        distance = calculateDistance(
          medicalCase.location.latitude,
          medicalCase.location.longitude,
          consultant.location.latitude,
          consultant.location.longitude
        );

        // Always add specific distance reason
        reasons.push(`Distance: ${distance.toFixed(1)}km`);

        if (distance < 2) {
          proximityScore = 70;
          reasons.push('Excellent proximity (< 2km)');
        } else if (distance < 5) {
          proximityScore = 60;
          reasons.push('Very close proximity (< 5km)');
        } else if (distance < 15) {
          proximityScore = 45;
          reasons.push('Nearby (< 15km)');
        } else if (distance < 30) {
          proximityScore = 30;
          reasons.push('Moderate proximity (< 30km)');
        } else if (distance < 50) {
          proximityScore = 15;
          reasons.push('Extended proximity (< 50km)');
        } else {
          reasons.push('Outside ideal range (> 50km)');
        }
      } else {
        reasons.push('Location data unavailable');
      }

      // 2. Specialty Match (Secondary Priority - Max 30 points)
      let specialtyScore = 0;
      if (medicalCase.requiredSpecialty) {
        if (consultant.specialty === medicalCase.requiredSpecialty) {
          specialtyScore = 30;
          reasons.push(`Specialty match: ${consultant.specialty}`);
        } else {
          reasons.push(`Specialty mismatch: Case requires ${medicalCase.requiredSpecialty}, Consultant is ${consultant.specialty || 'Generalist'}`);
        }
      } else {
        reasons.push('No specific specialty required for this case');
      }

      score = proximityScore + specialtyScore;

      return {
        consultant,
        distance,
        score: Math.max(0, Math.min(100, score)),
        reasons
      };
    });

  // Sort by score descending
  return suggestions.sort((a, b) => b.score - a.score);
}
