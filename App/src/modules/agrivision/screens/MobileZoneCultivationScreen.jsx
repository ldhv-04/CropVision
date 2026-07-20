/**
 * MobileZoneCultivationScreen - current profile and log workflow for one zone.
 *
 * Phase 03 keeps this screen SVG/mobile-lane only. It consumes the Phase 02
 * cultivation API contract through useMobileCultivationStore.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import { LIGHT_COLORS, SPACING, RADIUS } from '../../@core/constants/theme';
import { useMobileCultivationStore } from '../store/useMobileCultivationStore';

const C = LIGHT_COLORS;

const cultivationErrorCopy = {
  NO_PUBLISHED_MAP: {
    title: 'Map not published',
    message: 'Cultivation becomes available after a map is published.',
  },
  PUBLICATION_CONFLICT: {
    title: 'Publication conflict',
  },
  FIELD_NOT_FOUND: {
    title: 'Field unavailable',
    message: 'This field is unavailable.',
  },
};

const LOG_TYPES = [
  'watering',
  'fertilizing',
  'pesticide',
  'harvesting',
  'planting',
  'observation',
  'other',
];

const emptyProfile = {
  cropType: '',
  plantingDate: '',
  expectedHarvestDate: '',
  note: '',
};

const emptyLog = {
  type: 'observation',
  eventDate: '',
  amount: '',
  unit: '',
  product: '',
  title: '',
  note: '',
};

const exactDate = (value) => {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
};

const trimOrNull = (value) => {
  const trimmed = String(value || '').trim();
  return trimmed || null;
};

const textWithin = (value, max) => String(value || '').trim().length <= max;

const formatAmount = (amount, unit) => {
  if (amount === null || amount === undefined) return null;
  return `${amount} ${unit || ''}`.trim();
};

const buildProfileForm = (profile) => ({
  cropType: profile?.cropType || '',
  plantingDate: profile?.plantingDate || '',
  expectedHarvestDate: profile?.expectedHarvestDate || '',
  note: profile?.note || '',
});

const buildLogForm = (log) => ({
  type: log?.type || 'observation',
  eventDate: log?.eventDate || '',
  amount: log?.amount === null || log?.amount === undefined ? '' : String(log.amount),
  unit: log?.unit || '',
  product: log?.product || '',
  title: log?.title || '',
  note: log?.note || '',
});

function FieldInput({ label, value, onChangeText, placeholder, multiline = false, keyboardType = 'default', testID }) {
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

function TypePicker({ value, onChange }) {
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
            <Text style={[styles.typeChipText, selected && styles.typeChipTextActive]}>
              {type}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function CultivationContractState({ error, onRetry, onBack }) {
  const knownError = cultivationErrorCopy[error.code];

  return (
    <View style={styles.center}>
      {knownError ? <Text style={styles.conflictTitle}>{knownError.title}</Text> : null}
      <Text style={styles.errorText}>
        {knownError?.message || error.message}
      </Text>
      {error.latestPublicationVersion != null ? (
        <Text style={styles.conflictText}>
          Latest map: v{error.latestPublicationVersion}
        </Text>
      ) : null}
      <TouchableOpacity
        testID="btn-retry-cultivation"
        style={styles.secondaryButton}
        onPress={onRetry}
      >
        <Text style={styles.secondaryButtonText}>
          {error.requiresReload ? 'Reload latest map' : 'Retry'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

function CultivationConflictState({ conflict, onReload }) {
  return (
    <View style={styles.conflictCard}>
      <Text style={styles.conflictTitle}>Publication conflict</Text>
      <Text style={styles.conflictText}>{conflict.message}</Text>
      {conflict.latestPublicationVersion != null ? (
        <Text style={styles.conflictText}>
          Latest map: v{conflict.latestPublicationVersion}
        </Text>
      ) : null}
      {conflict.requiresManualSetup ? (
        <Text style={styles.conflictText}>This zone needs manual setup before new cultivation writes.</Text>
      ) : null}
      <TouchableOpacity style={styles.secondaryButton} onPress={onReload}>
        <Text style={styles.secondaryButtonText}>Reload latest map</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function MobileZoneCultivationScreen() {
  const params = useLocalSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const {
    summary,
    logs,
    isLoading,
    isLoadingLogs,
    isSaving,
    error,
    conflict,
    fetchSummary,
    fetchLogs,
    saveProfile,
    createLog,
    updateLog,
    deleteLog,
    clearCultivation,
    clearMessages,
  } = useMobileCultivationStore();

  const [profileForm, setProfileForm] = useState(emptyProfile);
  const [logForm, setLogForm] = useState(emptyLog);
  const [editingLogId, setEditingLogId] = useState(null);
  const [pendingDeleteLog, setPendingDeleteLog] = useState(null);
  const [formError, setFormError] = useState(null);

  const { fieldId, zoneId } = useMemo(() => {
    const paramFieldId = Array.isArray(params.fieldId) ? params.fieldId[0] : params.fieldId;
    const paramZoneId = Array.isArray(params.zoneId) ? params.zoneId[0] : params.zoneId;
    if (paramFieldId && paramZoneId) {
      return { fieldId: paramFieldId, zoneId: paramZoneId };
    }

    const match = String(pathname || '').match(/\/field-detail\/([^/]+)\/cultivation\/([^/]+)/);
    return {
      fieldId: paramFieldId || match?.[1],
      zoneId: paramZoneId || match?.[2],
    };
  }, [params.fieldId, params.zoneId, pathname]);

  useEffect(() => {
    if (fieldId && zoneId) fetchSummary(fieldId, zoneId);
    return () => clearCultivation();
  }, [fieldId, zoneId]);

  useEffect(() => {
    setProfileForm(buildProfileForm(summary?.profile));
  }, [
    summary?.profile?.id,
    summary?.profile?.cropType,
    summary?.profile?.plantingDate,
    summary?.profile?.expectedHarvestDate,
    summary?.profile?.note,
  ]);

  const publicationVersion = summary?.publication?.version;

  const pageTitle = useMemo(() => {
    const code = summary?.zone?.code || `Zone ${zoneId || ''}`;
    return `${code} cultivation`;
  }, [summary?.zone?.code, zoneId]);

  const validateProfile = () => {
    if (!profileForm.cropType.trim()) return 'Crop type is required.';
    if (!publicationVersion) return 'Latest publication context is required before saving.';
    if (!textWithin(profileForm.cropType, 100)) return 'Crop type must be at most 100 characters.';
    if (!exactDate(profileForm.plantingDate)) return 'Planting date must use YYYY-MM-DD.';
    if (!exactDate(profileForm.expectedHarvestDate)) return 'Expected harvest must use YYYY-MM-DD.';
    if (!textWithin(profileForm.note, 2000)) return 'Profile note must be at most 2000 characters.';
    return null;
  };

  const validateLog = () => {
    if (!LOG_TYPES.includes(logForm.type)) return 'Choose a valid log type.';
    if (!publicationVersion) return 'Latest publication context is required before saving.';
    if (!logForm.eventDate.trim()) return 'Event date is required.';
    if (!exactDate(logForm.eventDate)) return 'Event date must use YYYY-MM-DD.';
    if (!textWithin(logForm.unit, 30)) return 'Unit must be at most 30 characters.';
    if (!textWithin(logForm.product, 150)) return 'Product must be at most 150 characters.';
    if (!textWithin(logForm.title, 200)) return 'Title must be at most 200 characters.';
    if (!textWithin(logForm.note, 2000)) return 'Log note must be at most 2000 characters.';

    if (logForm.amount.trim()) {
      const amount = Number(logForm.amount);
      if (!Number.isFinite(amount) || amount < 0) return 'Amount must be a non-negative number.';
      if (!logForm.unit.trim()) return 'Unit is required when amount is provided.';
    }
    return null;
  };

  const handleSaveProfile = async () => {
    clearMessages();
    const validation = validateProfile();
    if (validation) {
      setFormError(validation);
      return;
    }
    setFormError(null);
    await saveProfile(fieldId, zoneId, {
      publicationVersion,
      cropType: profileForm.cropType,
      plantingDate: trimOrNull(profileForm.plantingDate),
      expectedHarvestDate: trimOrNull(profileForm.expectedHarvestDate),
      note: trimOrNull(profileForm.note),
    });
  };

  const handleSaveLog = async () => {
    clearMessages();
    const validation = validateLog();
    if (validation) {
      setFormError(validation);
      return;
    }
    setFormError(null);

    const payload = {
      publicationVersion,
      type: logForm.type,
      eventDate: logForm.eventDate.trim(),
      amount: logForm.amount.trim() ? Number(logForm.amount) : null,
      unit: trimOrNull(logForm.unit),
      product: trimOrNull(logForm.product),
      title: trimOrNull(logForm.title),
      note: trimOrNull(logForm.note),
    };

    const result = editingLogId
      ? await updateLog(fieldId, zoneId, editingLogId, payload)
      : await createLog(fieldId, zoneId, payload);

    if (result.ok) {
      setEditingLogId(null);
      setLogForm(emptyLog);
    }
  };

  const handleEditLog = (log) => {
    clearMessages();
    setFormError(null);
    setPendingDeleteLog(null);
    setEditingLogId(log.id);
    setLogForm(buildLogForm(log));
  };

  const handleCancelEdit = () => {
    setEditingLogId(null);
    setLogForm(emptyLog);
    setFormError(null);
  };

  const handleDeleteLog = (log) => {
    clearMessages();
    setFormError(null);
    setPendingDeleteLog(log);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteLog?.id) return;
    const result = await deleteLog(fieldId, zoneId, pendingDeleteLog.id, publicationVersion);
    if (result.ok) setPendingDeleteLog(null);
  };

  if (isLoading && !summary) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={styles.loadingText}>Loading cultivation data...</Text>
      </View>
    );
  }

  if (error && !summary) {
    return (
      <CultivationContractState
        error={error}
        onRetry={() => fetchSummary(fieldId, zoneId)}
        onBack={() => router.back()}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <View testID="mobile-zone-cultivation-screen" style={styles.headerCard}>
          <Text style={styles.eyebrow}>Mobile cultivation</Text>
          <Text style={styles.title}>{pageTitle}</Text>
          <Text style={styles.subtitle}>{summary?.field?.name || 'Field'}</Text>
          <View style={styles.metaGrid}>
            <Text style={styles.metaPill}>Map v{publicationVersion || '?'}</Text>
            <Text style={styles.metaPill}>{summary?.zone?.area ?? '-'} ha</Text>
            <Text style={styles.metaPill}>{summary?.publication?.status || 'published'}</Text>
          </View>
        </View>

        {conflict ? (
          <CultivationConflictState
            conflict={conflict}
            onReload={() => fetchSummary(fieldId, zoneId)}
          />
        ) : null}

        {error && !conflict ? <Text style={styles.errorText}>{error.message}</Text> : null}
        {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Current profile</Text>
            <Text style={styles.sectionHint}>{summary?.profile ? 'Edit visible crop setup' : 'No profile yet'}</Text>
          </View>
          <FieldInput
            testID="profile-crop-type-input"
            label="Crop type"
            value={profileForm.cropType}
            onChangeText={(cropType) => setProfileForm((prev) => ({ ...prev, cropType }))}
            placeholder="Rice"
          />
          <View style={styles.twoCol}>
            <View style={styles.col}>
              <FieldInput
                testID="profile-planting-date-input"
                label="Planting date"
                value={profileForm.plantingDate}
                onChangeText={(plantingDate) => setProfileForm((prev) => ({ ...prev, plantingDate }))}
                placeholder="YYYY-MM-DD"
              />
            </View>
            <View style={styles.col}>
              <FieldInput
                testID="profile-expected-harvest-date-input"
                label="Expected harvest"
                value={profileForm.expectedHarvestDate}
                onChangeText={(expectedHarvestDate) => setProfileForm((prev) => ({ ...prev, expectedHarvestDate }))}
                placeholder="YYYY-MM-DD"
              />
            </View>
          </View>
          <FieldInput
            testID="profile-note-input"
            label="Note"
            value={profileForm.note}
            onChangeText={(note) => setProfileForm((prev) => ({ ...prev, note }))}
            placeholder="Field observation"
            multiline
          />
          <TouchableOpacity
            testID="btn-save-cultivation-profile"
            style={styles.primaryButton}
            onPress={handleSaveProfile}
            disabled={isSaving}
          >
            <Text style={styles.primaryButtonText}>{isSaving ? 'Saving...' : 'Save profile'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{editingLogId ? 'Edit log' : 'New log'}</Text>
            {editingLogId ? (
              <TouchableOpacity onPress={handleCancelEdit}>
                <Text style={styles.linkText}>Cancel edit</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <Text style={styles.inputLabel}>Type</Text>
          <TypePicker value={logForm.type} onChange={(type) => setLogForm((prev) => ({ ...prev, type }))} />
          <FieldInput
            testID="log-event-date-input"
            label="Event date"
            value={logForm.eventDate}
            onChangeText={(eventDate) => setLogForm((prev) => ({ ...prev, eventDate }))}
            placeholder="YYYY-MM-DD"
          />
          <View style={styles.twoCol}>
            <View style={styles.col}>
              <FieldInput
                testID="log-amount-input"
                label="Amount"
                value={logForm.amount}
                onChangeText={(amount) => setLogForm((prev) => ({ ...prev, amount }))}
                placeholder="0"
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.col}>
              <FieldInput
                testID="log-unit-input"
                label="Unit"
                value={logForm.unit}
                onChangeText={(unit) => setLogForm((prev) => ({ ...prev, unit }))}
                placeholder="l"
              />
            </View>
          </View>
          <FieldInput
            testID="log-product-input"
            label="Product"
            value={logForm.product}
            onChangeText={(product) => setLogForm((prev) => ({ ...prev, product }))}
            placeholder="Optional product"
          />
          <FieldInput
            testID="log-title-input"
            label="Title"
            value={logForm.title}
            onChangeText={(title) => setLogForm((prev) => ({ ...prev, title }))}
            placeholder="Short title"
          />
          <FieldInput
            testID="log-note-input"
            label="Note"
            value={logForm.note}
            onChangeText={(note) => setLogForm((prev) => ({ ...prev, note }))}
            placeholder="What happened in this zone?"
            multiline
          />
          <TouchableOpacity
            testID="btn-save-cultivation-log"
            style={styles.primaryButton}
            onPress={handleSaveLog}
            disabled={isSaving}
          >
            <Text style={styles.primaryButtonText}>
              {isSaving ? 'Saving...' : editingLogId ? 'Update log' : 'Create log'}
            </Text>
          </TouchableOpacity>
        </View>

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
                    onPress={() => handleEditLog(log)}
                  >
                    <Text style={styles.smallButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    testID={`btn-delete-cultivation-log-${log.id}`}
                    style={styles.smallDangerButton}
                    onPress={() => handleDeleteLog(log)}
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
                  onPress={handleConfirmDelete}
                  disabled={isSaving}
                >
                  <Text style={styles.smallDangerText}>{isSaving ? 'Deleting...' : 'Confirm delete'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  testID="btn-cancel-delete-cultivation-log"
                  style={styles.smallButton}
                  onPress={() => setPendingDeleteLog(null)}
                >
                  <Text style={styles.smallButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => fetchLogs(fieldId, zoneId, { limit: 20, offset: 0 })}
            disabled={isLoadingLogs}
          >
            <Text style={styles.secondaryButtonText}>
              {isLoadingLogs ? 'Loading logs...' : 'Load paginated logs'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.background,
  },
  content: {
    padding: SPACING.md,
    paddingTop: 48,
    paddingBottom: 48,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    backgroundColor: C.background,
  },
  loadingText: {
    marginTop: SPACING.sm,
    color: C.textSecondary,
    fontSize: 16,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  backText: {
    color: C.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  headerCard: {
    backgroundColor: C.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: SPACING.md,
  },
  eyebrow: {
    color: C.textSecondary,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    color: C.textPrimary,
    fontSize: 28,
    fontWeight: '900',
    marginTop: SPACING.xs,
  },
  subtitle: {
    color: C.textSecondary,
    fontSize: 16,
    marginTop: SPACING.xs,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  metaPill: {
    backgroundColor: C.successBg,
    color: C.primary,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    fontSize: 13,
    fontWeight: '800',
  },
  sectionCard: {
    backgroundColor: C.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  sectionTitle: {
    color: C.textPrimary,
    fontSize: 20,
    fontWeight: '900',
  },
  sectionHint: {
    color: C.textSecondary,
    fontSize: 13,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    color: C.textSecondary,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: SPACING.xs,
  },
  input: {
    minHeight: 48,
    backgroundColor: C.surfaceAlt,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: C.textPrimary,
    fontSize: 16,
  },
  textArea: {
    minHeight: 92,
    textAlignVertical: 'top',
  },
  twoCol: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  col: {
    flex: 1,
  },
  typeWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  typeChip: {
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: C.surfaceAlt,
  },
  typeChipActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  typeChipText: {
    color: C.textSecondary,
    fontSize: 14,
    fontWeight: '800',
  },
  typeChipTextActive: {
    color: C.white,
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: RADIUS.md,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
  },
  primaryButtonText: {
    color: C.white,
    fontSize: 16,
    fontWeight: '900',
  },
  secondaryButton: {
    minHeight: 44,
    borderRadius: RADIUS.md,
    backgroundColor: C.warningBg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.md,
  },
  secondaryButtonText: {
    color: C.warning,
    fontSize: 16,
    fontWeight: '900',
  },
  conflictCard: {
    backgroundColor: C.warningBg,
    borderColor: C.warningBorder,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  conflictTitle: {
    color: C.warning,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: SPACING.xs,
  },
  conflictText: {
    color: C.textPrimary,
    fontSize: 16,
    lineHeight: 22,
  },
  errorText: {
    color: C.danger,
    backgroundColor: C.dangerBg,
    borderColor: C.dangerBorder,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    fontSize: 16,
  },
  emptyText: {
    color: C.textSecondary,
    fontSize: 16,
    lineHeight: 22,
  },
  linkText: {
    color: C.primary,
    fontSize: 14,
    fontWeight: '900',
  },
  logRow: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingVertical: SPACING.md,
  },
  logMain: {
    gap: 2,
  },
  logType: {
    color: C.primary,
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  logDate: {
    color: C.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  logTitle: {
    color: C.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  logMeta: {
    color: C.textSecondary,
    fontSize: 15,
  },
  logNote: {
    color: C.textSecondary,
    fontSize: 15,
    lineHeight: 21,
    marginTop: SPACING.xs,
  },
  logActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  smallButton: {
    borderRadius: RADIUS.md,
    backgroundColor: C.successBg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  smallButtonText: {
    color: C.primary,
    fontSize: 14,
    fontWeight: '900',
  },
  smallDangerButton: {
    borderRadius: RADIUS.md,
    backgroundColor: C.dangerBg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  smallDangerText: {
    color: C.danger,
    fontSize: 14,
    fontWeight: '900',
  },
  deleteConfirmCard: {
    backgroundColor: C.dangerBg,
    borderColor: C.dangerBorder,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.sm,
  },
  deleteConfirmTitle: {
    color: C.danger,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: SPACING.xs,
  },
  deleteConfirmText: {
    color: C.textPrimary,
    fontSize: 15,
    lineHeight: 21,
  },
});
