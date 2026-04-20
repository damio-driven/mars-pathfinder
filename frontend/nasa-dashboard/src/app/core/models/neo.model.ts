export interface NeoDto {
  id: string;
  name: string;
  isPotentiallyHazardous: boolean;
  diameterMinKm: number;
  diameterMaxKm: number;
  missDistanceKm: number;
  relativeVelocityKmH: number;
  closeApproachDate: string;
}
