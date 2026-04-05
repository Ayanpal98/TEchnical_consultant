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
      let score = 50; // Base score
      const reasons: string[] = [];

      // 1. Specialty Match
      if (medicalCase.requiredSpecialty && consultant.specialty === medicalCase.requiredSpecialty) {
        score += 30;
        reasons.push('Specialty match');
      } else if (medicalCase.requiredSpecialty) {
        score -= 20;
      }

      // 2. Proximity
      let distance = Infinity;
      if (medicalCase.location && consultant.location) {
        distance = calculateDistance(
          medicalCase.location.latitude,
          medicalCase.location.longitude,
          consultant.location.latitude,
          consultant.location.longitude
        );

        if (distance < 5) {
          score += 20;
          reasons.push('Very close proximity (< 5km)');
        } else if (distance < 15) {
          score += 10;
          reasons.push('Nearby (< 15km)');
        } else if (distance > 50) {
          score -= 10;
        }
      } else {
        reasons.push('Location data unavailable for distance calculation');
      }

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
