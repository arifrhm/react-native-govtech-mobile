import type { AttendanceRecord } from '../../domain/models/Attendance.ts';
import type { IOfflineQueueDataSource } from '../../domain/usecases/SyncOfflineQueueUseCase.ts';

export class OfflineQueueStorage implements IOfflineQueueDataSource {
  private records: Map<string, AttendanceRecord> = new Map();

  async getPendingRecords(): Promise<AttendanceRecord[]> {
    return Array.from(this.records.values()).filter(
      (r) => r.syncStatus === 'PENDING'
    );
  }

  async getAllRecords(): Promise<AttendanceRecord[]> {
    return Array.from(this.records.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  async saveRecord(record: AttendanceRecord): Promise<void> {
    this.records.set(record.id, { ...record });
  }

  async updateRecord(record: AttendanceRecord): Promise<void> {
    this.records.set(record.id, { ...record });
  }

  async purgeSyncedRecords(olderThanHours: number): Promise<number> {
    const cutoff = Date.now() - olderThanHours * 60 * 60 * 1000;
    let purged = 0;
    for (const [id, r] of this.records.entries()) {
      if (r.syncStatus === 'SYNCED' && r.syncedAt) {
        if (new Date(r.syncedAt).getTime() < cutoff) {
          this.records.delete(id);
          purged++;
        }
      }
    }
    return purged;
  }
}
