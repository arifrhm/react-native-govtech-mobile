export type AttendanceType = 'CHECK_IN' | 'CHECK_OUT';
export type SyncStatus = 'PENDING' | 'SYNCED' | 'FAILED';

export interface LocationCoordinate {
  latitude: number;
  longitude: number;
  accuracy: number; // in meters
  altitude?: number;
}

export interface AttendanceRecord {
  id: string; // UUID v4
  userId: string;
  type: AttendanceType;
  timestamp: string; // ISO 8601 UTC
  coordinate: LocationCoordinate;
  geofenceZoneId: string;
  distanceFromZoneCenterMeters: number;
  isWithinGeofence: boolean;
  biometricVerificationToken: string;
  deviceFingerprint: string;
  syncStatus: SyncStatus;
  retryCount: number;
  syncedAt?: string;
}
