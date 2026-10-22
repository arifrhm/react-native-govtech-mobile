import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  isOnline: boolean;
  pendingSyncCount: number;
}

export const OfflineStatusBanner: React.FC<Props> = ({ isOnline, pendingSyncCount }) => {
  if (isOnline && pendingSyncCount === 0) {
    return (
      <View style={[styles.container, styles.onlineContainer]}>
        <View style={styles.dotOnline} />
        <Text style={styles.text}>Connected to GovTech Private APN (All synced)</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.offlineContainer]}>
      <View style={styles.dotOffline} />
      <Text style={styles.text}>
        {!isOnline ? 'Offline Mode Active' : 'Online'} — {pendingSyncCount} record(s) queued locally in SQLite
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginVertical: 6,
  },
  onlineContainer: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: '#10b981',
    borderWidth: 1,
  },
  offlineContainer: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: '#f59e0b',
    borderWidth: 1,
  },
  dotOnline: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: 8,
  },
  dotOffline: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f59e0b',
    marginRight: 8,
  },
  text: {
    fontSize: 12,
    color: '#e2e8f0',
    fontWeight: '500',
  },
});
