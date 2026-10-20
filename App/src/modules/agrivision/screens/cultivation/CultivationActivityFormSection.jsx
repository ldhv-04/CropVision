/**
 * CultivationActivityFormSection — Log activity form component
 * Strictly adheres to Rule 2.1 (<= 300 LOC, functions <= 40 LOC).
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from './CultivationStyles';
import { FieldInput, TypePicker } from './CultivationFormHelpers';

export function CultivationActivityFormSection({
  logForm,
  setLogForm,
  editingLogId,
  isSaving,
  onSaveLog,
}) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{editingLogId ? 'Edit log' : 'Log an activity'}</Text>
      </View>
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
        onPress={onSaveLog}
        disabled={isSaving}
      >
        <Text style={styles.primaryButtonText}>
          {isSaving ? 'Saving...' : editingLogId ? 'Update log' : 'Create log'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
