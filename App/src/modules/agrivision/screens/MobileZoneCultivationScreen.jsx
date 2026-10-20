/**
 * MobileZoneCultivationScreen — Current profile and log workflow for one zone.
 * Strictly adheres to Rule 2.1 (<= 300 LOC, functions <= 40 LOC).
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import { useMobileCultivationStore } from '../store/useMobileCultivationStore';
import { styles, LOG_TYPES } from './cultivation/CultivationStyles';
import {
  exactDate,
  trimOrNull,
  textWithin,
  formatAmount,
  buildProfileForm,
  buildLogForm,
  CultivationContractState,
  CultivationConflictState,
} from './cultivation/CultivationFormHelpers';
import { CultivationProfileSection } from './cultivation/CultivationProfileSection';
import { CultivationActivityFormSection } from './cultivation/CultivationActivityFormSection';
import { CultivationLogSection } from './cultivation/CultivationLogSection';

const emptyProfile = { cropType: '', plantingDate: '', expectedHarvestDate: '', note: '' };
const emptyLog = { type: 'observation', eventDate: '', amount: '', unit: '', product: '', title: '', note: '' };

export function MobileZoneCultivationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const pathname = usePathname();

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
    const pField = Array.isArray(params.fieldId) ? params.fieldId[0] : params.fieldId;
    const pZone = Array.isArray(params.zoneId) ? params.zoneId[0] : params.zoneId;
    if (pField && pZone) return { fieldId: pField, zoneId: pZone };
    const match = String(pathname || '').match(/\/field-detail\/([^/]+)\/cultivation\/([^/]+)/);
    return { fieldId: pField || match?.[1], zoneId: pZone || match?.[2] };
  }, [params.fieldId, params.zoneId, pathname]);

  useEffect(() => {
    if (fieldId && zoneId) fetchSummary(fieldId, zoneId);
    return () => clearCultivation();
  }, [fieldId, zoneId]);

  useEffect(() => {
    setProfileForm(buildProfileForm(summary?.profile));
  }, [summary?.profile]);

  const publicationVersion = summary?.publication?.version;

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

    const res = editingLogId
      ? await updateLog(fieldId, zoneId, editingLogId, payload)
      : await createLog(fieldId, zoneId, payload);

    if (res.ok) {
      setEditingLogId(null);
      setLogForm(emptyLog);
    }
  };

  if (isLoading && !summary) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading cultivation data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <CultivationContractState
        error={error}
        onRetry={() => (error.requiresReload ? router.replace('/(agrivision)') : fetchSummary(fieldId, zoneId))}
        onBack={() => router.back()}
      />
    );
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.headerCard}>
          <Text style={styles.eyebrow}>{summary?.field?.name || 'Field'}</Text>
          <Text style={styles.title}>{summary?.zone?.code || `Zone ${zoneId || ''}`} cultivation</Text>
          <Text style={styles.subtitle}>Manage current crop profile and zone-level field actions.</Text>
          <View style={styles.metaGrid}>
            <Text style={styles.metaPill}>Map v{publicationVersion ?? '?'}</Text>
            <Text style={styles.metaPill}>{summary?.zone?.areaHectares ?? 0} ha</Text>
            {summary?.zone?.status ? <Text style={styles.metaPill}>{summary.zone.status}</Text> : null}
          </View>
        </View>

        {conflict ? (
          <CultivationConflictState conflict={conflict} onReload={() => router.replace('/(agrivision)')} />
        ) : null}

        {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

        <CultivationProfileSection
          profileForm={profileForm}
          setProfileForm={setProfileForm}
          onSaveProfile={handleSaveProfile}
          isSaving={isSaving}
        />

        <CultivationActivityFormSection
          logForm={logForm}
          setLogForm={setLogForm}
          editingLogId={editingLogId}
          isSaving={isSaving}
          onSaveLog={handleSaveLog}
        />

        <CultivationLogSection
          logs={logs}
          isLoadingLogs={isLoadingLogs}
          pendingDeleteLog={pendingDeleteLog}
          isSaving={isSaving}
          onEditLog={(log) => {
            clearMessages();
            setFormError(null);
            setEditingLogId(log.id);
            setLogForm(buildLogForm(log));
          }}
          onDeleteLog={(log) => {
            clearMessages();
            setFormError(null);
            setPendingDeleteLog(log);
          }}
          onConfirmDelete={async () => {
            if (!pendingDeleteLog) return;
            const res = await deleteLog(fieldId, zoneId, pendingDeleteLog.id);
            if (res.ok) setPendingDeleteLog(null);
          }}
          onCancelDelete={() => setPendingDeleteLog(null)}
          onFetchLogs={() => fetchLogs(fieldId, zoneId, { limit: 20, offset: 0 })}
          formatAmount={formatAmount}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default MobileZoneCultivationScreen;
