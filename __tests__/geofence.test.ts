import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateHaversineDistance,
  isLocationWithinGeofence,
} from '../src/domain/models/Geofence.ts';
import type { GeofenceZone } from '../src/domain/models/Geofence.ts';

test('Geofence & Haversine Distance Verification', async (t) => {
  const govTechHiveZone: GeofenceZone = {
    id: 'ZONE-SG-GOVTECH-HIVE',
    name: 'GovTech Hive (Sandcrawler / Mapletree)',
    agencyCode: 'GOVTECH-SG',
    centerLatitude: 1.2989,
    centerLongitude: 103.8528,
    radiusMeters: 100, // 100m geofence radius
    isActive: true,
  };

  await t.test('calculates zero distance when coordinates are identical', () => {
    const dist = calculateHaversineDistance(1.2989, 103.8528, 1.2989, 103.8528);
    assert.ok(Math.abs(dist) < 0.01);
  });

  await t.test('confirms location is within geofence when inside 100m radius', () => {
    const testLat = 1.2991;
    const testLon = 103.853;
    const result = isLocationWithinGeofence(testLat, testLon, govTechHiveZone);
    assert.strictEqual(result.isWithin, true);
    assert.ok(result.distanceMeters < 100);
    assert.ok(result.distanceMeters > 0);
  });

  await t.test('rejects location and flags out of zone when distance exceeds 100m', () => {
    const mbsLat = 1.2838;
    const mbsLon = 103.8591;
    const result = isLocationWithinGeofence(mbsLat, mbsLon, govTechHiveZone);
    assert.strictEqual(result.isWithin, false);
    assert.ok(result.distanceMeters > 1500);
  });
});
