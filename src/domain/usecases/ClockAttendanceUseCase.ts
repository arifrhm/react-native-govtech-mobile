import type { AttendanceRecord, AttendanceType, LocationCoordinate } from '../models/Attendance.ts';
import { isLocationWithinGeofence } from '../models/Geofence.ts';
import type { GeofenceZone } from '../models/Geofence.ts';

export interface IAttendanceRepository {
  saveLocalRecord(record: AttendanceRecord): Promise<void>;
  dispatchToServer(record: AttendanceRecord): Promise<{ success: boolean; syncedAt?: string }>;
}

export interface ClockAttendanceParams {
  userId: string;
  type: AttendanceType;
  coordinate: LocationCoordinate;
  targetZone: GeofenceZone;
  biometricToken: string;
  deviceFingerprint: string;
  isOnline: boolean;
}

export class ClockAttendanceUseCase {
  private readonly attendanceRepository: IAttendanceRepository;

  constructor(attendanceRepository: IAttendanceRepository) {
    this.attendanceRepository = attendanceRepository;
  }

  async execute(params: ClockAttendanceParams): Promise<{
    record: AttendanceRecord;
    syncedImmediately: boolean;
  }> {
    const { isWithin, distanceMeters } = isLocationWithinGeofence(
      params.coordinate.latitude,
      params.coordinate.longitude,
      params.targetZone
    );

    const record: AttendanceRecord = {
      id: this.generateUUID(),
      userId: params.userId,
      type: params.type,
      timestamp: new Date().toISOString(),
      coordinate: params.coordinate,
      geofenceZoneId: params.targetZone.id,
      distanceFromZoneCenterMeters: distanceMeters,
      isWithinGeofence: isWithin,
      biometricVerificationToken: params.biometricToken,
      deviceFingerprint: params.deviceFingerprint,
      syncStatus: 'PENDING',
      retryCount: 0,
    };

    // Always persist to local queue first (offline-first resilience)
    await this.attendanceRepository.saveLocalRecord(record);

    let syncedImmediately = false;
    if (params.isOnline) {
      try {
        const dispatchRes = await this.attendanceRepository.dispatchToServer(record);
        if (dispatchRes.success) {
          record.syncStatus = 'SYNCED';
          record.syncedAt = dispatchRes.syncedAt || new Date().toISOString();
          syncedImmediately = true;
          await this.attendanceRepository.saveLocalRecord(record);
        }
      } catch (err) {
        // Stays PENDING in queue for background sync
        syncedImmediately = false;
      }
    }

    return {
      record,
      syncedImmediately,
    };
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
