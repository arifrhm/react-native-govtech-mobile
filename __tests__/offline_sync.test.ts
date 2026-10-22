import test from 'node:test';
import assert from 'node:assert/strict';
import { ClockAttendanceUseCase } from '../src/domain/usecases/ClockAttendanceUseCase.ts';
import { SyncOfflineQueueUseCase } from '../src/domain/usecases/SyncOfflineQueueUseCase.ts';
import { OfflineQueueStorage } from '../src/data/datasources/OfflineQueueStorage.ts';
import { AttendanceRepositoryImpl } from '../src/data/repositories/AttendanceRepositoryImpl.ts';
import { GovTechApiClient } from '../src/data/datasources/GovTechApiClient.ts';
import type { GeofenceZone } from '../src/domain/models/Geofence.ts';

test('Offline-First Queue & Sync Engine', async (t) => {
  const testZone: GeofenceZone = {
    id: 'ZONE-SG-TEST',
    name: 'Singapore Test Center',
    agencyCode: 'TEST-SG',
    centerLatitude: 1.3521,
    centerLongitude: 103.8198,
    radiusMeters: 200,
    isActive: true,
  };

  let storage: OfflineQueueStorage;
  let apiClient: GovTechApiClient;
  let repo: AttendanceRepositoryImpl;
  let clockUseCase: ClockAttendanceUseCase;
  let syncUseCase: SyncOfflineQueueUseCase;

  t.beforeEach(() => {
    storage = new OfflineQueueStorage();
    apiClient = new GovTechApiClient();
    repo = new AttendanceRepositoryImpl(storage, apiClient);
    clockUseCase = new ClockAttendanceUseCase(repo);
    syncUseCase = new SyncOfflineQueueUseCase(storage, repo);
  });

  await t.test('queues record locally with PENDING status when device is offline', async () => {
    const { record, syncedImmediately } = await clockUseCase.execute({
      userId: 'USER-101',
      type: 'CHECK_IN',
      coordinate: { latitude: 1.3521, longitude: 103.8198, accuracy: 3.0 },
      targetZone: testZone,
      biometricToken: 'valid-biometric-auth-token',
      deviceFingerprint: 'hw_secure_enclave_77',
      isOnline: false,
    });

    assert.strictEqual(syncedImmediately, false);
    assert.strictEqual(record.syncStatus, 'PENDING');

    const pending = await storage.getPendingRecords();
    assert.strictEqual(pending.length, 1);
    assert.strictEqual(pending[0].id, record.id);
  });

  await t.test('processes pending queue and updates status to SYNCED upon reconnection', async () => {
    // 1. Queue two records while offline
    await clockUseCase.execute({
      userId: 'USER-101',
      type: 'CHECK_IN',
      coordinate: { latitude: 1.3521, longitude: 103.8198, accuracy: 3.0 },
      targetZone: testZone,
      biometricToken: 'valid-auth-token-1',
      deviceFingerprint: 'hw_1',
      isOnline: false,
    });

    await clockUseCase.execute({
      userId: 'USER-101',
      type: 'CHECK_OUT',
      coordinate: { latitude: 1.3521, longitude: 103.8198, accuracy: 3.0 },
      targetZone: testZone,
      biometricToken: 'valid-auth-token-2',
      deviceFingerprint: 'hw_1',
      isOnline: false,
    });

    let pending = await storage.getPendingRecords();
    assert.strictEqual(pending.length, 2);

    // 2. Trigger sync use case (device back online)
    const syncRes = await syncUseCase.execute(10);
    assert.strictEqual(syncRes.totalProcessed, 2);
    assert.strictEqual(syncRes.syncedCount, 2);
    assert.strictEqual(syncRes.failedCount, 0);

    // 3. Verify queue is cleared
    pending = await storage.getPendingRecords();
    assert.strictEqual(pending.length, 0);

    // 4. Verify all records have synced timestamp
    const all = await storage.getAllRecords();
    assert.strictEqual(all[0].syncStatus, 'SYNCED');
    assert.ok(all[0].syncedAt);
  });
});
