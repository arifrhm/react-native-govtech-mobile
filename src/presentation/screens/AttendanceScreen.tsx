import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { GeofenceMapCard } from '../components/GeofenceMapCard';
import { OfflineStatusBanner } from '../components/OfflineStatusBanner';
import type { GeofenceZone } from '../../domain/models/Geofence';
import type { ClockAttendanceUseCase } from '../../domain/usecases/ClockAttendanceUseCase';
import type { BiometricAuthUseCase } from '../../domain/usecases/BiometricAuthUseCase';

interface Props {
  clockUseCase: ClockAttendanceUseCase;
  biometricUseCase?: BiometricAuthUseCase;
  currentZone: GeofenceZone;
  activeUserId?: string;
  deviceId?: string;
}

export const AttendanceScreen: React.FC<Props> = ({
  clockUseCase,
  biometricUseCase,
  currentZone,
  activeUserId = 'SG-CIVIL-SERVICE-DEFAULT',
  deviceId = 'mobile-hardware-enclave',
}) => {
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastAction, setLastAction] = useState<string | null>(null);

  // Dynamic user GPS coordinate (simulated 10m from GovTech Sandcrawler / Hive)
  const currentCoordinate = {
    latitude: 1.2985,
    longitude: 103.8522,
    accuracy: 4.5,
  };

  const handleClockAction = async (type: 'CHECK_IN' | 'CHECK_OUT') => {
    setLoading(true);
    try {
      let resolvedToken = 'hardware-session-validated';

      if (biometricUseCase) {
        const auth = await biometricUseCase.execute('Authenticate to record workforce attendance');
        if (!auth.authenticated) {
          Alert.alert('Verification Failed', auth.error || 'Biometric identity challenge failed');
          return;
        }
        resolvedToken = auth.session?.deviceFingerprint || 'session-authenticated';
      }

      const res = await clockUseCase.execute({
        userId: activeUserId,
        type,
        coordinate: currentCoordinate,
        targetZone: currentZone,
        biometricToken: resolvedToken,
        deviceFingerprint: deviceId,
        isOnline,
      });

      setLastAction(
        `${type} recorded at ${new Date(res.record.timestamp).toLocaleTimeString()} (${
          res.syncedImmediately ? 'Synced to Cloud 🟢' : 'Stored in Offline Queue 🟡'
        })`
      );

      if (!res.syncedImmediately) {
        setPendingCount((prev) => prev + 1);
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to record attendance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>GovTech Field Attendance</Text>
      <Text style={styles.subtitle}>Geofenced &amp; Biometrically Authenticated Verification</Text>

      <OfflineStatusBanner isOnline={isOnline} pendingSyncCount={pendingCount} />

      <GeofenceMapCard
        currentDistanceMeters={12.4}
        targetZone={currentZone}
        isWithinGeofence={true}
      />

      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.clockBtn, styles.checkInBtn]}
          onPress={() => handleClockAction('CHECK_IN')}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.btnText}>Clock In (Verify Biometrics)</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.clockBtn, styles.checkOutBtn]}
          onPress={() => handleClockAction('CHECK_OUT')}
          disabled={loading}
        >
          <Text style={styles.btnText}>Clock Out (End Shift)</Text>
        </TouchableOpacity>
      </View>

      {lastAction && (
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>{lastAction}</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.toggleNetBtn}
        onPress={() => setIsOnline(!isOnline)}
      >
        <Text style={styles.toggleNetText}>
          Toggle Network State (Currently: {isOnline ? 'Online' : 'Offline Simulated'})
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 16,
  },
  actionContainer: {
    marginTop: 20,
    gap: 12,
  },
  clockBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkInBtn: {
    backgroundColor: '#2563eb',
  },
  checkOutBtn: {
    backgroundColor: '#475569',
  },
  btnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  resultBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  resultText: {
    color: '#93c5fd',
    fontSize: 13,
    textAlign: 'center',
  },
  toggleNetBtn: {
    marginTop: 24,
    padding: 10,
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleNetText: {
    color: '#64748b',
    fontSize: 12,
  },
});
