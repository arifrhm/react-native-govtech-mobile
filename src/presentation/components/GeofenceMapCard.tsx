import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GeofenceZone } from '../../domain/models/Geofence';

interface Props {
  currentDistanceMeters: number;
  targetZone: GeofenceZone;
  isWithinGeofence: boolean;
}

export const GeofenceMapCard: React.FC<Props> = ({
  currentDistanceMeters,
  targetZone,
  isWithinGeofence,
}) => {
  return (
    <View style={[styles.card, isWithinGeofence ? styles.cardValid : styles.cardInvalid]}>
      <View style={styles.headerRow}>
        <Text style={styles.zoneName}>{targetZone.name}</Text>
        <View style={[styles.badge, isWithinGeofence ? styles.badgeSuccess : styles.badgeDanger]}>
          <Text style={styles.badgeText}>
            {isWithinGeofence ? 'IN RANGE' : 'OUT OF ZONE'}
          </Text>
        </View>
      </View>
      <Text style={styles.detailText}>
        Agency Code: <Text style={styles.boldText}>{targetZone.agencyCode}</Text>
      </Text>
      <Text style={styles.detailText}>
        Radius Allowed: {targetZone.radiusMeters}m | Current Distance: {currentDistanceMeters}m
      </Text>
      <View style={styles.accuracyNote}>
        <Text style={styles.noteText}>
          {isWithinGeofence
            ? '✓ GPS coordinate cryptographically signed and valid for attendance timestamp.'
            : '⚠️ You are outside the authorized geofence. Move closer to the assigned facility.'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
  },
  cardValid: {
    borderColor: '#10b981',
  },
  cardInvalid: {
    borderColor: '#ef4444',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  zoneName: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  badgeDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#f8fafc',
  },
  detailText: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 4,
  },
  boldText: {
    color: '#38bdf8',
    fontWeight: '600',
  },
  accuracyNote: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  noteText: {
    fontSize: 12,
    color: '#cbd5e1',
    lineHeight: 16,
  },
});
