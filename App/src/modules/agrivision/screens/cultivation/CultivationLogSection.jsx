/**
 * CultivationLogSection — Renders cultivation logs list, edit actions, and pagination.
 * Strictly adheres to Rule 2.1 (<= 300 LOC, functions <= 40 LOC).
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from './CultivationStyles';

export function CultivationLogSection({
  logs,
  isLoadingLogs,
  pendingDeleteLog,
  isSaving,
  onEditLog,
  onDeleteLog,
  onConfirmDelete,
  onCancelDelete,
  onFetchLogs,
  formatAmount,
}) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Latest logs</Text>
        <Text style={styles.sectionHint}>{logs.length} shown</Text>
      </View>

      {logs.length === 0 ? (
        <Text style={styles.emptyText}>No logs yet. You can create a log before creating a profile.</Text>
      ) : (
        logs.map((log) => (
          <View key={log.id} style={styles.logRow}>
            <View style={styles.logMain}>
              <Text style={styles.logType}>{log.type}</Text>
              <Text style={styles.logDate}>{log.eventDate}</Text>
              {log.title ? <Text style={styles.logTitle}>{log.title}</Text> : null}
              {formatAmount(log.amount, log.unit) ? (
                <Text style={styles.logMeta}>{formatAmount(log.amount, log.unit)}</Text>
              ) : null}
              {log.note ? <Text style={styles.logNote}>{log.note}</Text> : null}
            </View>
            <View style={styles.logActions}>
              <TouchableOpacity
                testID={`btn-edit-cultivation-log-${log.id}`}
                style={styles.smallButton}
                onPress={() => onEditLog(log)}
              >
                <Text style={styles.smallButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID={`btn-delete-cultivation-log-${log.id}`}
                style={styles.smallDangerButton}
                onPress={() => onDeleteLog(log)}
              >
                <Text style={styles.smallDangerText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      {pendingDeleteLog ? (
        <View testID="delete-cultivation-log-confirmation" style={styles.deleteConfirmCard}>
          <Text style={styles.deleteConfirmTitle}>Delete log?</Text>
          <Text style={styles.deleteConfirmText}>
            This hides the log from the current mobile workflow. Historical data remains on the server.
          </Text>
          <View style={styles.logActions}>
            <TouchableOpacity
              testID="btn-confirm-delete-cultivation-log"
              style={styles.smallDangerButton}
              onPress={onConfirmDelete}
              disabled={isSaving}
            >
              <Text style={styles.smallDangerText}>{isSaving ? 'Deleting...' : 'Confirm delete'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="btn-cancel-delete-cultivation-log"
              style={styles.smallButton}
              onPress={onCancelDelete}
            >
              <Text style={styles.smallButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={onFetchLogs}
        disabled={isLoadingLogs}
      >
        <Text style={styles.secondaryButtonText}>
          {isLoadingLogs ? 'Loading logs...' : 'Load paginated logs'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
