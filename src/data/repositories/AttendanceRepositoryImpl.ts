import type { AttendanceRecord } from '../../domain/models/Attendance.ts';
import type { IAttendanceRepository } from '../../domain/usecases/ClockAttendanceUseCase.ts';
import { OfflineQueueStorage } from '../datasources/OfflineQueueStorage.ts';
import { GovTechApiClient } from '../datasources/GovTechApiClient.ts';

export class AttendanceRepositoryImpl implements IAttendanceRepository {
  private readonly localQueue: OfflineQueueStorage;
  private readonly apiClient: GovTechApiClient;

  constructor(
    localQueue: OfflineQueueStorage,
    apiClient: GovTechApiClient
  ) {
    this.localQueue = localQueue;
    this.apiClient = apiClient;
  }

  async saveLocalRecord(record: AttendanceRecord): Promise<void> {
    await this.localQueue.saveRecord(record);
  }

  async dispatchToServer(record: AttendanceRecord): Promise<{ success: boolean; syncedAt?: string }> {
    return this.apiClient.submitAttendance(record);
  }
}
