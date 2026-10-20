/**
 * CultivationFormHelpers — Input elements and formatters for Zone Cultivation
 * Strictly adheres to Rule 2.1 (<= 300 LOC, functions <= 40 LOC).
 */

import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { styles, C, LOG_TYPES, cultivationErrorCopy } from './CultivationStyles';

export const exactDate = (value) => {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

export const trimOrNull = (value) => {
  const trimmed = String(value || '').trim();
  return trimmed || null;
};

export const textWithin = (value, max) => String(value || '').trim().length <= max;

export const formatAmount = (amount, unit) => {
  if (amount === null || amount === undefined) return null;
  return `${amount} ${unit || ''}`.trim();
};

export const buildProfileForm = (profile) => ({
  cropType: profile?.cropType || '',
  plantingDate: profile?.plantingDate || '',
  expectedHarvestDate: profile?.expectedHarvestDate || '',
  note: profile?.note || '',
});

export const buildLogForm = (log) => ({
  type: log?.type || 'observation',
  eventDate: log?.eventDate || '',
  amount: log?.amount === null || log?.amount === undefined ? '' : String(log.amount),
  unit: log?.unit || '',
  product: log?.product || '',
  title: log?.title || '',
  note: log?.note || '',
});

export function FieldInput({ label, value, onChangeText, placeholder, multiline = false, keyboardType = 'default', testID }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        testID={testID}
        style={[styles.input, multiline && styles.textArea]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.placeholder}
        multiline={multiline}
        keyboardType={keyboardType}
      />
    </View>
  );
}

export function TypePicker({ value, onChange }) {
  return (
    <View style={styles.typeWrap}>
      {LOG_TYPES.map((type) => {
        const selected = value === type;
        return (
          <TouchableOpacity
            key={type}
            style={[styles.typeChip, selected && styles.typeChipActive]}
            onPress={() => onChange(type)}
          >
            <Text style={[styles.typeChipText, selected && styles.typeChipTextActive]}>{type}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function CultivationContractState({ error, onRetry, onBack }) {
  const knownError = cultivationErrorCopy[error.code];

  return (
    <View style={styles.center}>
      {knownError ? <Text style={styles.conflictTitle}>{knownError.title}</Text> : null}
      <Text style={styles.errorText}>{knownError?.message || error.message}</Text>
      {error.latestPublicationVersion != null ? (
        <Text style={styles.conflictText}>Latest map: v{error.latestPublicationVersion}</Text>
      ) : null}
      <TouchableOpacity testID="btn-retry-cultivation" style={styles.secondaryButton} onPress={onRetry}>
        <Text style={styles.secondaryButtonText}>{error.requiresReload ? 'Reload latest map' : 'Retry'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

export function CultivationConflictState({ conflict, onReload }) {
  return (
    <View style={styles.conflictCard}>
      <Text style={styles.conflictTitle}>Publication conflict</Text>
      <Text style={styles.conflictText}>{conflict.message}</Text>
      {conflict.latestPublicationVersion != null ? (
        <Text style={styles.conflictText}>Latest version: v{conflict.latestPublicationVersion}</Text>
      ) : null}
      <TouchableOpacity testID="btn-reload-latest-map" style={styles.secondaryButton} onPress={onReload}>
        <Text style={styles.secondaryButtonText}>Reload latest map</Text>
      </TouchableOpacity>
    </View>
  );
}
