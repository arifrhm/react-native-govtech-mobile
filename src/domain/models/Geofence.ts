export interface GeofenceZone {
  id: string;
  name: string;
  agencyCode: string;
  centerLatitude: number;
  centerLongitude: number;
  radiusMeters: number;
  isActive: boolean;
}

/**
 * Calculates geodesic distance between two GPS coordinates using the Haversine formula.
 * Deterministic math verification for geofenced field operations.
 *
 * @param lat1 Latitude of point 1 in degrees
 * @param lon1 Longitude of point 1 in degrees
 * @param lat2 Latitude of point 2 in degrees
 * @param lon2 Longitude of point 2 in degrees
 * @returns Distance in meters
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const EARTH_RADIUS_METERS = 6371000;

  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

export function isLocationWithinGeofence(
  lat: number,
  lon: number,
  zone: GeofenceZone
): { isWithin: boolean; distanceMeters: number } {
  const distance = calculateHaversineDistance(
    lat,
    lon,
    zone.centerLatitude,
    zone.centerLongitude
  );
  return {
    isWithin: distance <= zone.radiusMeters,
    distanceMeters: Math.round(distance * 100) / 100,
  };
}
