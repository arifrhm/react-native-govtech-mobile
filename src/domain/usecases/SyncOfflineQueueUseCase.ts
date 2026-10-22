import type { AttendanceRecord } from '../models/Attendance.ts';
import type { IAttendanceRepository } from './ClockAttendanceUseCase.ts';

export interface IOfflineQueueDataSource {
  getPendingRecords(): Promise<AttendanceRecord[]>;
  updateRecord(record: AttendanceRecord): Promise<void>;
  purgeSyncedRecords(olderThanHours: number): Promise<number>;
}

export interface SyncResult {
  totalProcessed: number;
  syncedCount: number;
  failedCount: number;
  errors: Array<{ id: string; error: string }>;
}

export class SyncOfflineQueueUseCase {
  private readonly queueDataSource: IOfflineQueueDataSource;
  private readonly attendanceRepository: IAttendanceRepository;

  constructor(
    queueDataSource: IOfflineQueueDataSource,
    attendanceRepository: IAttendanceRepository
  ) {
    this.queueDataSource = queueDataSource;
    this.attendanceRepository = attendanceRepository;
  }

  async execute(maxBatchSize = 25): Promise<SyncResult> {
    const pending = await this.queueDataSource.getPendingRecords();
    const batch = pending.slice(0, maxBatchSize);

    const result: SyncResult = {
      totalProcessed: batch.length,
      syncedCount: 0,
      failedCount: 0,
      errors: [],
    };

    for (const record of batch) {
      try {
        const res = await this.attendanceRepository.dispatchToServer(record);
        if (res.success) {
          record.syncStatus = 'SYNCED';
          record.syncedAt = res.syncedAt || new Date().toISOString();
          await this.queueDataSource.updateRecord(record);
          result.syncedCount++;
        } else {
          record.retryCount++;
          if (record.retryCount >= 5) {
            record.syncStatus = 'FAILED';
          }
          await this.queueDataSource.updateRecord(record);
          result.failedCount++;
          result.errors.push({ id: record.id, error: 'Server rejected record' });
        }
      } catch (err: any) {
        record.retryCount++;
        if (record.retryCount >= 5) {
          record.syncStatus = 'FAILED';
        }
        await this.queueDataSource.updateRecord(record);
        result.failedCount++;
        result.errors.push({ id: record.id, error: err?.message || 'Network error' });
      }
    }

    // Retain clean storage: Purge records synced > 48h ago
    await this.queueDataSource.purgeSyncedRecords(48);

    return result;
  }
}
